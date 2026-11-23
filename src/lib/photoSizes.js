import { PHOTO_PRESETS, getOrientedPreset } from "./presets";

/**
 * Sizes a single photo can be switched to. Custom and Phone Skin need their
 * own settings (dimensions / phone model), so they stay batch-wide.
 */
export const PER_PHOTO_SIZES = PHOTO_PRESETS.filter((p) => p.id !== "custom" && !p.isPhoneSkin);

/** BLCK name tags (V2-V4 notch, V5 / V6 window). */
export function isNameTagPreset(preset) {
  return Boolean(preset?.isNameTag || preset?.id?.startsWith("nametag"));
}
const isNameTag = isNameTagPreset;

/**
 * The preset a photo prints at: its own `sizeId` if set, else the batch preset.
 * Name tags always print landscape (their notch / window is authored that way);
 * other per-photo sizes follow the batch orientation.
 *
 * @param {{ sizeId?: string }} photo
 * @param {Object} activePreset - the batch (Photo Size panel) preset, already oriented
 * @param {"portrait"|"landscape"} orientation - the batch orientation
 */
export function resolvePhotoPreset(photo, activePreset, orientation = "portrait") {
  const id = photo?.sizeId;
  if (!id || id === activePreset?.id) return activePreset;
  const base = PHOTO_PRESETS.find((p) => p.id === id);
  if (!base || base.id === "custom") return activePreset;
  const orient = isNameTag(base) ? "landscape" : orientation;
  // Cached so the same size always yields the same object (stable React deps)
  const key = `${id}|${orient}`;
  if (!orientedCache.has(key)) orientedCache.set(key, getOrientedPreset(base, orient));
  return orientedCache.get(key);
}

const orientedCache = new Map();

/** Stable key for "same printed size and shape". */
export function presetKey(preset) {
  if (!preset) return "";
  const w = preset.customWidthIn || preset.wIn || 0;
  const h = preset.customHeightIn || preset.hIn || 0;
  return `${preset.id}|${(+w).toFixed(3)}x${(+h).toFixed(3)}`;
}

/** True when the presets are not all the same size/shape. */
export function hasMixedSizes(presets) {
  if (!presets || presets.length < 2) return false;
  const first = presetKey(presets[0]);
  return presets.some((p) => presetKey(p) !== first);
}
