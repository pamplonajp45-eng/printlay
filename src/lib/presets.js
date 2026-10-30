/**
 * Print presets config with physical dimensions (inches) and 300 DPI calculations.
 */

export const DEFAULT_DPI = 300;

// ---------------------------------------------------------------------------
// Black Teo (XBLACK) vape name tag decals
// ---------------------------------------------------------------------------
// Shared outer size. Authored wide (4.808 x 3.092) with the cutout on the
// bottom = "native" orientation.
const NAME_TAG_BASE = {
  wIn: 4.808,
  hIn: 3.092,
  wCm: 12.21,
  hCm: 7.85,
  isPolaroid: false,
  aspectRatio: 4.808 / 3.092,
};

// V2-V4: notch that opens onto the bottom edge.
// Hand-measured: notch depth = height 3.092 - notch top to top edge 2.309.
const NAME_TAG_NOTCH = {
  edge: "bottom",
  depthIn: 0.783,
  widthIn: 1.265,
  radiusIn: 0.133,
  centered: true,
};

// ---------------------------------------------------------------------------
// Black Teo V5 & V6 exact template dimensions & cutouts (from vector PDF template)
// ---------------------------------------------------------------------------
const V5_V6_BASE = {
  wIn: 4.980,
  hIn: 3.332,
  wCm: 12.65,
  hCm: 8.46,
  isPolaroid: false,
  aspectRatio: 4.980 / 3.332,
  isNameTag: true,
  hasDieCutContour: true,
};

const V5_V6_HOLE = {
  xIn: 1.820,
  yIn: 2.362,
  widthIn: 1.340,
  heightIn: 0.855,
  radiusIn: 0.104,
};

/**
 * 3-up layout for V5/V6 on ONE A4 LANDSCAPE sheet (11.693 x 8.267 in):
 * one sticker centered on top, two side by side below.
 * xIn: null means "center horizontally on the sheet".
 * Each entry is the sticker's top-left corner in inches.
 */
export const V5_V6_SHEET_LAYOUT = [
  { xIn: 0.817, yIn: 0.652 }, // top-left
  { xIn: 5.897, yIn: 0.652 }, // top-right
  { xIn: 0.817, yIn: 4.284 }, // bottom-left
  { xIn: 5.897, yIn: 4.284 }, // bottom-right
];

// Legacy fallback reference
const NAME_TAG_HOLE = V5_V6_HOLE;

export const PHOTO_PRESETS = [
  {
    id: "polaroidClassic",
    name: "Polaroid Classic",
    description: "3.5 × 4.2 in frame (square 3.1 × 3.1 in image area)",
    wIn: 3.5,
    hIn: 4.2,
    wCm: 8.9,
    hCm: 10.7,
    isPolaroid: true,
    polaroidStyle: "classic", // thicker bottom border
    aspectRatio: 3.5 / 4.2,
    imageArea: {
      leftRatio: 0.057,
      topRatio: 0.048,
      rightRatio: 0.057,
      bottomRatio: 0.214,
    }
  },
  {
    id: "polaroidMini",
    name: "Polaroid Mini (2×3)",
    description: "2 × 3 in (5.1 × 7.6 cm) mini print (10 per A4 sheet in 2×5 grid)",
    wIn: 2.0,
    hIn: 3.0,
    wCm: 5.1,
    hCm: 7.6,
    isPolaroid: true,
    polaroidStyle: "mini",
    aspectRatio: 2.0 / 3.0,
    imageArea: {
      leftRatio: 0.06,
      topRatio: 0.06,
      rightRatio: 0.06,
      bottomRatio: 0.18,
    }
  },
  {
    id: "instaxMini",
    name: "Instax Mini (54×86mm)",
    description: "54 × 86 mm (2.1 × 3.4 in) standard film spec (10 per A4 sheet in 2×5 grid)",
    wIn: 2.1,
    hIn: 3.35,
    wCm: 5.4,
    hCm: 8.6,
    isPolaroid: true,
    polaroidStyle: "mini",
    aspectRatio: 2.1 / 3.35,
    imageArea: {
      leftRatio: 0.074,
      topRatio: 0.058,
      rightRatio: 0.074,
      bottomRatio: 0.22,
    }
  },
  {
    id: "idSquare",
    name: "Passport / ID (2×2)",
    description: "2 × 2 in (5.1 × 5.1 cm) standard square ID",
    wIn: 2.0,
    hIn: 2.0,
    wCm: 5.1,
    hCm: 5.1,
    isPolaroid: false,
    aspectRatio: 1.0,
  },
  {
    id: "passportFormal",
    name: "Passport (Formal)",
    description: "1.4 × 1.8 in (3.5 × 4.5 cm) official spec",
    wIn: 1.378,
    hIn: 1.772,
    wCm: 3.5,
    hCm: 4.5,
    isPolaroid: false,
    aspectRatio: 3.5 / 4.5,
  },
  {
    id: "wallet2R",
    name: "Wallet (2R)",
    description: "2.5 × 3.5 in (6.4 × 8.9 cm)",
    wIn: 2.5,
    hIn: 3.5,
    wCm: 6.4,
    hCm: 8.9,
    isPolaroid: false,
    aspectRatio: 2.5 / 3.5,
  },
  {
    id: "r3",
    name: "3R",
    description: "3.5 × 5 in (8.9 × 12.7 cm)",
    wIn: 3.5,
    hIn: 5.0,
    wCm: 8.9,
    hCm: 12.7,
    isPolaroid: false,
    aspectRatio: 3.5 / 5.0,
  },
  {
    id: "r4",
    name: "4R",
    description: "4 × 6 in (10.2 × 15.2 cm) standard photo",
    wIn: 4.0,
    hIn: 6.0,
    wCm: 10.2,
    hCm: 15.2,
    isPolaroid: false,
    aspectRatio: 4.0 / 6.0,
  },
  {
    id: "r5",
    name: "5R",
    description: "5 × 7 in (12.7 × 17.8 cm)",
    wIn: 5.0,
    hIn: 7.0,
    wCm: 12.7,
    hCm: 17.8,
    isPolaroid: false,
    aspectRatio: 5.0 / 7.0,
  },
  {
    id: "r6",
    name: "6R",
    description: "6 × 8 in (15.2 × 20.3 cm)",
    wIn: 6.0,
    hIn: 8.0,
    wCm: 15.2,
    hCm: 20.3,
    isPolaroid: false,
    aspectRatio: 6.0 / 8.0,
  },
  {
    // Keep this id: existing code may compare against "nametag-notch".
    ...NAME_TAG_BASE,
    id: "nametag-notch",
    name: "BLCK V2-V4 Name Tag",
    description: "4.808 × 3.092 in wrap-around decal with bottom notch (V2, V3, V4)",
    notch: NAME_TAG_NOTCH,
  },
  {
    ...V5_V6_BASE,
    id: "nametag-hole-v5",
    name: "BLCK V5 Name Tag",
    description: "4.980 × 3.332 in die-cut wrap decal with window hole (3 per A4 landscape)",
    hole: V5_V6_HOLE,
    hasDieCutContour: true,
  },
  {
    ...V5_V6_BASE,
    id: "nametag-hole-v6",
    name: "BLCK V6 Name Tag",
    description: "4.980 × 3.332 in die-cut wrap decal with window hole (3 per A4 landscape)",
    hole: V5_V6_HOLE,
    hasDieCutContour: true,
  },
  {
    id: "custom",
    name: "Custom Size...",
    description: "User-defined width & height",
    wIn: 3.0,
    hIn: 4.0,
    wCm: 7.62,
    hCm: 10.16,
    isPolaroid: false,
    aspectRatio: 0.75,
    isCustom: true,
  }
];

export const SHEET_PRESETS = [
  {
    id: "a4",
    name: "A4 Paper",
    description: "8.27 × 11.69 in (21 × 29.7 cm)",
    wIn: 8.267,
    hIn: 11.693,
    wCm: 21.0,
    hCm: 29.7,
  },
 // SHEET_PRESETS entry
{
  id: "a4-landscape",
  name: "A4 Landscape (4 stickers)",
  description: "11.69 × 8.27 in (29.7 × 21 cm), used for the V5/V6 2×2 layout",
  wIn: 11.693,
  hIn: 8.267,
  wCm: 29.7,
  hCm: 21.0,
},
  {
    id: "letter",
    name: "US Letter",
    description: "8.5 × 11.0 in (21.6 × 27.9 cm)",
    wIn: 8.5,
    hIn: 11.0,
    wCm: 21.59,
    hCm: 27.94,
  },
  {
    id: "r4sheet",
    name: "4R Paper",
    description: "4.0 × 6.0 in (10.2 × 15.2 cm)",
    wIn: 4.0,
    hIn: 6.0,
    wCm: 10.16,
    hCm: 15.24,
  },
  {
    id: "r6sheet",
    name: "6R Paper",
    description: "6.0 × 8.0 in (15.2 × 20.3 cm)",
    wIn: 6.0,
    hIn: 8.0,
    wCm: 15.24,
    hCm: 20.32,
  },
  {
    id: "continuous",
    name: "Continuous Strip",
    description: "Single auto-expanding sheet",
    wIn: 8.267,
    hIn: 11.693,
    isContinuous: true,
  }
];

/**
 * Adjusts preset dimensions according to chosen orientation ('portrait' or 'landscape')
 */
export function getOrientedPreset(preset, orientation = "portrait") {
  if (!preset) return preset;

  const baseW = preset.customWidthIn || preset.wIn || 3.0;
  const baseH = preset.customHeightIn || preset.hIn || 4.0;

  const isCurrentLandscape = baseW > baseH;
  const targetLandscape = orientation === "landscape";

  if (isCurrentLandscape === targetLandscape) {
    return { ...preset, wIn: baseW, hIn: baseH, orientation };
  }

  // Swap width & height for new orientation
  const orientedW = baseH;
  const orientedH = baseW;

  let imageArea = preset.imageArea;
  if (preset.isPolaroid && imageArea) {
    if (targetLandscape) {
      imageArea = {
        leftRatio: imageArea.topRatio,
        topRatio: imageArea.leftRatio,
        rightRatio: imageArea.bottomRatio, // thick border on right side when landscape
        bottomRatio: imageArea.rightRatio,
      };
    } else {
      imageArea = { ...preset.imageArea };
    }
  }

  return {
    ...preset,
    wIn: orientedW,
    hIn: orientedH,
    aspectRatio: orientedW / orientedH,
    imageArea,
    // A notched shape turns with the sticker: bottom edge -> right edge
    ...(preset.notch ? { notch: { ...preset.notch, edge: "right" } } : {}),
    // A hole turns the same way (90° counter-clockwise, like bottom -> right).
    // Point (x, y) in the wide layout becomes (y, baseW - x) in the turned one,
    // so the hole's top-left corner is (yIn, baseW - xIn - widthIn) and its
    // width and height swap.
    ...(preset.hole
      ? {
          hole: {
            ...preset.hole,
            xIn: preset.hole.yIn,
            yIn: baseW - preset.hole.xIn - preset.hole.widthIn,
            widthIn: preset.hole.heightIn,
            heightIn: preset.hole.widthIn,
          },
        }
      : {}),
    orientation,
  };
}

/**
 * SVG path string (in inches) for a rounded rectangle.
 */
export function roundedRectPath(x, y, w, h, r = 0) {
  const rr = Math.max(0, Math.min(r, w / 2, h / 2));
  if (rr === 0) return `M${x} ${y}H${x + w}V${y + h}H${x}Z`;
  return (
    `M${x + rr} ${y}H${x + w - rr}` +
    `A${rr} ${rr} 0 0 1 ${x + w} ${y + rr}V${y + h - rr}` +
    `A${rr} ${rr} 0 0 1 ${x + w - rr} ${y + h}H${x + rr}` +
    `A${rr} ${rr} 0 0 1 ${x} ${y + h - rr}V${y + rr}` +
    `A${rr} ${rr} 0 0 1 ${x + rr} ${y}Z`
  );
}

/**
 * SVG path string (in inches) for the Black Teo V5/V6 die-cut outline,
 * matching the vector template:
 *  - full-height tabs at both ends (square outer corner, rounded inner corner)
 *  - low shoulders with a shallow circular dip each
 *  - a center tab with both top corners rounded
 * Tweak `depth` / `halfChord` / `dipX` if the dips look off against the template.
 */
export function getV5V6OutlinePath(wIn = 4.980, hIn = 3.332) {
  const r = 0.13;            // rounded tab corners
  const shoulderY = 0.19;    // how far the shoulders sit below the top
  const sideTab = 0.866;     // width of each end tab
  const centerL = 1.794;     // center tab left edge
  const centerR = wIn - centerL; // symmetric
  const dipX = 1.33;         // x of the dip center from each side
  const halfChord = 0.17;    // half the dip's width
  const depth = 0.09;        // how deep the dip bites down

  // radius of a circular arc from its half-width and depth
  const R = (halfChord ** 2 + depth ** 2) / (2 * depth);

  const d1L = dipX - halfChord, d1R = dipX + halfChord;
  const d2L = wIn - dipX - halfChord, d2R = wIn - dipX + halfChord;
  const rightTab = wIn - sideTab;

  return [
    `M 0 0`,
    `H ${sideTab - r}`,
    `A ${r} ${r} 0 0 1 ${sideTab} ${r}`,
    `V ${shoulderY}`,
    `H ${d1L}`,
    `A ${R} ${R} 0 0 0 ${d1R} ${shoulderY}`,
    `H ${centerL}`,
    `V ${r}`,
    `A ${r} ${r} 0 0 1 ${centerL + r} 0`,
    `H ${centerR - r}`,
    `A ${r} ${r} 0 0 1 ${centerR} ${r}`,
    `V ${shoulderY}`,
    `H ${d2L}`,
    `A ${R} ${R} 0 0 0 ${d2R} ${shoulderY}`,
    `H ${rightTab}`,
    `V ${r}`,
    `A ${r} ${r} 0 0 1 ${rightTab + r} 0`,
    `H ${wIn}`,
    `V ${hIn}`,
    `H 0`,
    `Z`,
  ].join(" ");
}

/**
 * Path for a decal that has an enclosed hole: the outer outline plus the hole.
 * Draw or clip it with the "evenodd" fill rule so the hole is see-through:
 *   <path d={getHoleCutoutPath(orientedPreset)} fillRule="evenodd" />
 *   ctx.clip(new Path2D(d), "evenodd")  // canvas version (scale first)
 * Pass an oriented preset (from getOrientedPreset). Returns null when the
 * preset has no hole.
 */
export function getHoleCutoutPath(orientedPreset) {
  const hole = orientedPreset?.hole;
  if (!hole) return null;
  const isNativeWide = (orientedPreset.wIn || 0) >= (orientedPreset.hIn || 0);
  const outer = orientedPreset.hasDieCutContour && isNativeWide
    ? getV5V6OutlinePath(orientedPreset.wIn, orientedPreset.hIn)
    : roundedRectPath(0, 0, orientedPreset.wIn, orientedPreset.hIn, 0);
  const inner = roundedRectPath(
    hole.xIn,
    hole.yIn,
    hole.widthIn,
    hole.heightIn,
    hole.radiusIn
  );
  return `${outer}${inner}`;
}

export function inToPx(inches, dpi = DEFAULT_DPI) {
  return Math.round(inches * dpi);
}

export function cmToIn(cm) {
  return cm / 2.54;
}

export function mmToIn(mm) {
  return mm / 25.4;
}

export function inToCm(inches) {
  return (inches * 2.54).toFixed(2);
}