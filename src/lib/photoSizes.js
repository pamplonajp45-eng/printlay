import { PHOTO_PRESETS, getOrientedPreset } from "./presets";
import { buildPhoneSkinPreset, DEFAULT_PHONE_SKIN, findPhoneModel } from "./phoneSkin";

/** Per-photo size ids for phone skins: "phone:<modelId>". */
export const PHONE_SIZE_PREFIX = "phone:";
export const phoneSizeId = (modelId) => PHONE_SIZE_PREFIX + modelId;
export const isPhoneSizeId = (id) => typeof id === "string" && id.startsWith(PHONE_SIZE_PREFIX);

// One cache per phone-skin settings object: editing the settings (coverage,
// wrap, fine-tuned sizes) makes a new object, so old presets drop out
const phonePresetCache = new WeakMap();

function phonePresetFor(modelId, orientation, phoneSkin) {
  const settings = phoneSkin || DEFAULT_PHONE_SKIN;
  if (!phonePresetCache.has(settings)) phonePresetCache.set(settings, new Map());
  const cache = phonePresetCache.get(settings);
  const key = `${modelId}|${orientation}`;
  if (!cache.has(key)) {
    cache.set(key, getOrientedPreset(buildPhoneSkinPreset({ ...settings, modelId }), orientation));
  }
  return cache.get(key);
}

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
 * A sizeId of "phone:<modelId>" prints that phone's skin, built with the
 * Phone Skin panel's settings (coverage, wrap, clearance, fine-tuned sizes).
 *
 * @param {{ sizeId?: string }} photo
 * @param {Object} activePreset - the batch (Photo Size panel) preset, already oriented
 * @param {"portrait"|"landscape"} orientation - the batch orientation
 * @param {Object} [phoneSkin] - the Phone Skin panel settings
 */
export function resolvePhotoPreset(photo, activePreset, orientation = "portrait", phoneSkin = DEFAULT_PHONE_SKIN) {
  const id = photo?.sizeId;
  if (!id || id === activePreset?.id) return activePreset;
  if (isPhoneSizeId(id)) {
    const modelId = id.slice(PHONE_SIZE_PREFIX.length);
    if (!findPhoneModel(modelId)) return activePreset;
    if (activePreset?.isPhoneSkin && activePreset.phoneModelId === modelId) return activePreset;
    return phonePresetFor(modelId, orientation, phoneSkin);
  }
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
  // Phone skins of one size still differ in shape (iPhone 13 vs 13 Pro)
  const id = preset.phoneModelId ? `${preset.id}:${preset.phoneModelId}` : preset.id;
  return `${id}|${(+w).toFixed(3)}x${(+h).toFixed(3)}`;
}

/** True when the presets are not all the same size/shape. */
export function hasMixedSizes(presets) {
  if (!presets || presets.length < 2) return false;
  const first = presetKey(presets[0]);
  return presets.some((p) => presetKey(p) !== first);
}
