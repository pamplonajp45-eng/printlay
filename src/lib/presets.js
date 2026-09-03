/**
 * Print presets config with physical dimensions (inches) and 300 DPI calculations.
 */

export const DEFAULT_DPI = 300;

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
    name: "Polaroid Mini",
    description: "2 × 3 in photo strip / mini print style",
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
      bottomRatio: 0.16,
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
    orientation,
  };
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
