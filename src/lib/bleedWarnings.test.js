import { describe, it, expect } from "vitest";
import {
  boxGap,
  minSafeGap,
  checkBleedOverlap,
  checkOutsideMargin,
  checkLowDpi,
  checkAspectMismatch,
  computeItemInfo,
  computeWarnings,
} from "./bleedWarnings";

const shape = {
  cutBounds: { widthMm: 50, heightMm: 75 },
  footprint: { widthMm: 53, heightMm: 78 },
};

const preset = { id: "test-50x75", name: "Test 50x75" };
const sheet = { widthMm: 210, heightMm: 297 };

// 4 mm apart: enough for 1.5 mm bleed (needs 3 mm)
const items = [
  { x: 5, y: 5, w: 53, h: 78, rotated: false },
  { x: 62, y: 5, w: 53, h: 78, rotated: false },
];
const close = [
  { x: 5, y: 5, w: 53, h: 78, rotated: false },
  { x: 59, y: 5, w: 53, h: 78, rotated: false }, // 1 mm gap
];

describe("computeItemInfo", () => {
  it("computes cut and bleed dimensions", () => {
    const info = computeItemInfo(items[0], shape, null, preset);
    expect(info).toMatchObject({ cutW: 50, cutH: 75, bleedW: 53, bleedH: 78, rotated: false, presetName: "Test 50x75" });
    expect(info.effectiveDpi).toBeNull();
  });

  it("computes effective DPI from the canvas against the cut size", () => {
    // 50 x 75 mm at 300 dpi = 591 x 886 px
    const info = computeItemInfo(items[0], shape, { naturalWidth: 591, naturalHeight: 886 }, preset);
    expect(info.effectiveDpi).toBeCloseTo(300, 0);
    expect(info.imageSize).toEqual({ w: 591, h: 886 });
  });

  it("scales DPI down when the source photo was upscaled (sourceScale < 1)", () => {
    const info = computeItemInfo(items[0], shape, { width: 591, height: 886, sourceScale: 0.5 }, preset);
    expect(info.effectiveDpi).toBeCloseTo(150, 0);
  });

  it("does not report more DPI than the canvas has when downscaled", () => {
    const info = computeItemInfo(items[0], shape, { width: 591, height: 886, sourceScale: 3 }, preset);
    expect(info.effectiveDpi).toBeCloseTo(300, 0);
  });

  it("measures DPI in the unrotated frame for rotated items", () => {
    const rotated = { ...items[0], w: 78, h: 53, rotated: true };
    const canvas = { width: 591, height: 886 };
    const a = computeItemInfo(items[0], shape, canvas, preset);
    const b = computeItemInfo(rotated, shape, canvas, preset);
    expect(b.effectiveDpi).toBeCloseTo(a.effectiveDpi, 6);
    expect(b.aspectMatch).toBe(true);
    expect(b.placedW).toBe(78);
  });

  it("accepts artwork cropped to the cut size", () => {
    const info = computeItemInfo(items[0], shape, { width: 500, height: 750 }, preset);
    expect(info.aspectMatch).toBe(true);
  });

  it("detects aspect mismatch", () => {
    const info = computeItemInfo(items[0], shape, { naturalWidth: 1000, naturalHeight: 500 }, preset);
    expect(info.aspectMatch).toBe(false);
  });
});

describe("boxGap / minSafeGap", () => {
  it("measures side, overlapping and diagonal gaps", () => {
    const a = { x: 0, y: 0, w: 10, h: 10 };
    expect(boxGap(a, { x: 12, y: 0, w: 10, h: 10 })).toBeCloseTo(2);
    expect(boxGap(a, { x: 0, y: 10, w: 10, h: 10 })).toBeCloseTo(0);
    expect(boxGap(a, { x: 8, y: 0, w: 10, h: 10 })).toBeCloseTo(-2);
    expect(boxGap(a, { x: 13, y: 14, w: 10, h: 10 })).toBeCloseTo(5);
  });

  it("needs 2 x bleed", () => {
    expect(minSafeGap(1.5)).toBe(3);
    expect(minSafeGap(-1)).toBe(0);
  });
});

describe("checkBleedOverlap", () => {
  it("returns no warnings when gap >= 2 x bleed", () => {
    expect(checkBleedOverlap(items, 1.5)).toEqual([]);
  });

  it("warns both neighbours when gap < 2 x bleed", () => {
    const result = checkBleedOverlap(close, 1.5);
    expect(result).toHaveLength(2);
    expect(result[0]).toMatchObject({ index: 0, neighbour: 1, type: "bleedOverlap", gap: 1, minGap: 3 });
    expect(result[1]).toMatchObject({ index: 1, neighbour: 0 });
  });

  it("flags touching (0 mm gap) items, which the old check missed", () => {
    const touching = [
      { x: 5, y: 5, w: 53, h: 78 },
      { x: 5, y: 83, w: 53, h: 78 },
    ];
    expect(checkBleedOverlap(touching, 1)).toHaveLength(2);
  });

  it("never warns with zero bleed", () => {
    expect(checkBleedOverlap(close, 0)).toEqual([]);
  });
});

describe("checkOutsideMargin", () => {
  it("returns no warnings when items are inside margin", () => {
    expect(checkOutsideMargin(items, sheet, 5)).toEqual([]);
  });

  it("returns warning when item extends past right margin", () => {
    const result = checkOutsideMargin([{ x: 200, y: 5, w: 20, h: 20 }], sheet, 5);
    expect(result).toEqual([{ index: 0, type: "outsideMargin" }]);
  });
});

describe("checkLowDpi", () => {
  it("returns no warnings when DPI is sufficient (after rounding)", () => {
    expect(checkLowDpi([{ index: 0, effectiveDpi: 299.6 }], 300)).toEqual([]);
  });

  it("returns warning when DPI is below target", () => {
    const result = checkLowDpi([{ index: 3, effectiveDpi: 150 }], 300);
    expect(result).toEqual([{ index: 3, type: "lowDpi", effectiveDpi: 150, targetDpi: 300 }]);
  });
});

describe("checkAspectMismatch", () => {
  it("returns no warnings when aspects match", () => {
    expect(checkAspectMismatch([{ index: 0, aspectMatch: true }])).toEqual([]);
  });

  it("returns warning when aspects mismatch", () => {
    expect(checkAspectMismatch([{ index: 0, aspectMatch: false }])).toEqual([{ index: 0, type: "aspectMismatch" }]);
  });
});

describe("computeWarnings", () => {
  const params = {
    items,
    bleedShape: shape,
    croppedCanvases: [null, null],
    preset,
    dpi: 300,
    bleedMm: 1.5,
    sheet,
    marginMm: 5,
  };

  it("returns empty byIndex when no warnings", () => {
    const { byIndex, fixGapMm, itemInfos } = computeWarnings(params);
    expect(byIndex.size).toBe(0);
    expect(fixGapMm).toBeNull();
    expect(itemInfos.map((i) => i.index)).toEqual([0, 1]);
  });

  it("aggregates bleed overlap warning with a gap fix", () => {
    const { byIndex, fixGapMm } = computeWarnings({ ...params, items: close });
    const w = byIndex.get(0)[0];
    expect(w.type).toBe("bleedOverlap");
    expect(w.fixable).toBe(true);
    expect(w.fixGapMm).toBe(3);
    expect(fixGapMm).toBe(3);
  });

  it("attaches low-DPI warnings to the right item", () => {
    const { byIndex } = computeWarnings({
      ...params,
      croppedCanvases: [null, { width: 591, height: 886, sourceScale: 0.6 }],
    });
    expect(byIndex.has(0)).toBe(false);
    expect(byIndex.get(1).map((w) => w.type)).toEqual(["lowDpi"]);
  });
});
