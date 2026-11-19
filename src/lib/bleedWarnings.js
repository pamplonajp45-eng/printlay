/**
 * Pure warning / info helpers for the bleed-cut preview mode.
 * All units are mm unless noted. No DOM, no React.
 */

const EPS = 1e-6;

/** Aspect ratios closer than this (relative) count as "not stretched". */
export const ASPECT_TOLERANCE = 0.03;

/**
 * Per-item display info used by the item list.
 * The artwork is drawn in the item's UNROTATED frame (see renderSheet), so DPI
 * and aspect are measured against the unrotated cut / bleed size.
 */
export function computeItemInfo(item, shape, canvas, preset) {
  const cutW = shape.cutBounds.widthMm;
  const cutH = shape.cutBounds.heightMm;
  const bleedW = shape.footprint.widthMm;
  const bleedH = shape.footprint.heightMm;
  const rotated = Boolean(item.rotated);
  const placedW = rotated ? bleedH : bleedW;
  const placedH = rotated ? bleedW : bleedH;

  let effectiveDpi = null;
  let aspectMatch = true;
  let imageSize = null;
  if (canvas) {
    const iw = canvas.naturalWidth || canvas.width;
    const ih = canvas.naturalHeight || canvas.height;
    if (iw > 0 && ih > 0) {
      imageSize = { w: iw, h: ih };
      // The artwork canvas maps to the CUT size (the bleed is a ~3% stretch past it).
      // canvas.sourceScale (set by cropToCanvas) = photo pixels per canvas pixel, so an
      // upscaled photo reports its real, lower resolution.
      const sourceScale = Number.isFinite(canvas.sourceScale) ? Math.min(1, canvas.sourceScale) : 1;
      effectiveDpi = Math.min(iw / (cutW / 25.4), ih / (cutH / 25.4)) * sourceScale;
      const imgAspect = iw / ih;
      // Artwork is normally cropped to the CUT size; either aspect is fine
      const near = (target) => Math.abs(imgAspect / target - 1) <= ASPECT_TOLERANCE;
      aspectMatch = near(cutW / cutH) || near(bleedW / bleedH);
    }
  }

  return {
    presetName: preset?.name || preset?.id || "Item",
    cutW,
    cutH,
    bleedW,
    bleedH,
    rotated,
    placedW,
    placedH,
    effectiveDpi,
    aspectMatch,
    imageSize,
  };
}

/**
 * Edge-to-edge distance between two placed boxes {x,y,w,h}.
 * Negative when they overlap. Diagonal neighbours use the corner distance.
 */
export function boxGap(a, b) {
  const dx = Math.max(b.x - (a.x + a.w), a.x - (b.x + b.w));
  const dy = Math.max(b.y - (a.y + a.h), a.y - (b.y + b.h));
  if (dx >= 0 && dy >= 0) return Math.hypot(dx, dy);
  return Math.max(dx, dy);
}

/** Smallest gap that keeps two neighbours' bleed zones apart. */
export function minSafeGap(bleedMm) {
  return +(2 * Math.max(0, bleedMm)).toFixed(3);
}

/**
 * Bleed-zone overlap: any neighbour closer than 2 x bleed (touching or
 * overlapping included). One warning per item, for its closest neighbour.
 */
export function checkBleedOverlap(items, bleedMm) {
  const warnings = [];
  const minGap = minSafeGap(bleedMm);
  if (minGap <= 0) return warnings;
  for (let i = 0; i < items.length; i++) {
    let closest = null;
    for (let j = 0; j < items.length; j++) {
      if (i === j) continue;
      const gap = boxGap(items[i], items[j]);
      if (gap < minGap - EPS && (closest === null || gap < closest.gap)) {
        closest = { j, gap };
      }
    }
    if (closest) {
      warnings.push({
        index: i,
        type: "bleedOverlap",
        neighbour: closest.j,
        gap: +closest.gap.toFixed(2),
        minGap: +minGap.toFixed(2),
      });
    }
  }
  return warnings;
}

/** Items whose placed box crosses the page margin. */
export function checkOutsideMargin(items, sheet, marginMm) {
  const warnings = [];
  const rightLimit = sheet.widthMm - marginMm;
  const bottomLimit = sheet.heightMm - marginMm;
  for (let i = 0; i < items.length; i++) {
    const it = items[i];
    if (
      it.x < marginMm - EPS ||
      it.y < marginMm - EPS ||
      it.x + it.w > rightLimit + EPS ||
      it.y + it.h > bottomLimit + EPS
    ) {
      warnings.push({ index: i, type: "outsideMargin" });
    }
  }
  return warnings;
}

/** Items whose effective DPI is below the target. Infos need an `index`. */
export function checkLowDpi(itemInfos, targetDpi) {
  const warnings = [];
  for (const info of itemInfos) {
    // round first so "299.6 DPI" doesn't warn against a 300 DPI target
    if (info.effectiveDpi != null && Math.round(info.effectiveDpi) < targetDpi) {
      warnings.push({
        index: info.index,
        type: "lowDpi",
        effectiveDpi: Math.round(info.effectiveDpi),
        targetDpi,
      });
    }
  }
  return warnings;
}

/** Items whose image aspect doesn't match the item (would be stretched/cropped). */
export function checkAspectMismatch(itemInfos) {
  return itemInfos
    .filter((info) => info.aspectMatch === false)
    .map((info) => ({ index: info.index, type: "aspectMismatch" }));
}

/**
 * Aggregate all warnings for the item list.
 * @returns {{ byIndex: Map<number, Array<{type,label,fixable,fixGapMm?}>>, itemInfos: Array, fixGapMm: number|null }}
 */
export function computeWarnings({
  items,
  bleedShape,
  croppedCanvases,
  preset,
  dpi,
  bleedMm,
  sheet,
  marginMm,
}) {
  // Mixed sizes: each item may carry its own shape / preset; `index` = the photo's number - 1
  const itemInfos = items.map((it, i) => ({
    ...computeItemInfo(it, it.shape ?? bleedShape, croppedCanvases?.[i] ?? null, it.preset ?? preset),
    index: i,
    number: (Number.isInteger(it.index) ? it.index : i) + 1,
  }));

  const byIndex = new Map();
  const add = (index, warning) => {
    if (!byIndex.has(index)) byIndex.set(index, []);
    byIndex.get(index).push({ fixable: false, ...warning });
  };

  const overlap = checkBleedOverlap(items, bleedMm);
  for (const w of overlap) {
    add(w.index, {
      type: "bleedOverlap",
      label: `Gap ${w.gap} mm < ${w.minGap} mm (2 × bleed)`,
      fixable: true,
      fixGapMm: w.minGap,
    });
  }
  for (const w of checkOutsideMargin(items, sheet, marginMm)) {
    add(w.index, { type: "outsideMargin", label: "Outside page margin" });
  }
  for (const w of checkLowDpi(itemInfos, dpi)) {
    add(w.index, { type: "lowDpi", label: `${w.effectiveDpi} DPI < ${w.targetDpi}` });
  }
  for (const w of checkAspectMismatch(itemInfos)) {
    add(w.index, { type: "aspectMismatch", label: "Image stretched" });
  }

  return {
    byIndex,
    itemInfos,
    fixGapMm: overlap.length ? minSafeGap(bleedMm) : null,
  };
}
