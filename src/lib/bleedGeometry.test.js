import { describe, it, expect } from "vitest";
import {
  offsetPath,
  buildRoundedRectPolygon,
  buildNotchPolygon,
  getPresetCutPolygon,
  getBleedShape,
  getFootprint,
  polygonBounds,
} from "./bleedGeometry";

describe("bleedGeometry unit tests", () => {
  it("offsets a standard rectangle outward by bleed mm", () => {
    // 100 x 50 mm rectangle
    const rect = [
      { x: 0, y: 0 },
      { x: 100, y: 0 },
      { x: 100, y: 50 },
      { x: 0, y: 50 },
    ];
    const bleedMm = 1.5;
    const offset = offsetPath(rect, bleedMm);
    const bounds = polygonBounds(offset);

    // Bounding box should expand by 1.5 mm on all 4 sides
    expect(bounds.minX).toBeCloseTo(-1.5, 2);
    expect(bounds.maxX).toBeCloseTo(101.5, 2);
    expect(bounds.minY).toBeCloseTo(-1.5, 2);
    expect(bounds.maxY).toBeCloseTo(51.5, 2);
    expect(bounds.width).toBeCloseTo(103.0, 2);
    expect(bounds.height).toBeCloseTo(53.0, 2);
  });

  it("offsets a rounded rectangle outward with round joins", () => {
    // 85.6 x 53.98 mm (ATM card) with corner radius 3.18 mm
    const rounded = buildRoundedRectPolygon(85.6, 53.98, 3.18, 12);
    const bleedMm = 2.0;
    const offset = offsetPath(rounded, bleedMm);
    const bounds = polygonBounds(offset);

    expect(bounds.minX).toBeCloseTo(-2.0, 2);
    expect(bounds.maxX).toBeCloseTo(87.6, 2);
    expect(bounds.minY).toBeCloseTo(-2.0, 2);
    expect(bounds.maxY).toBeCloseTo(55.98, 2);
    expect(bounds.width).toBeCloseTo(89.6, 2);
    expect(bounds.height).toBeCloseTo(57.98, 2);
  });

  it("offsets a shape with a bottom notch: outer expands outward and notch cavity shrinks", () => {
    // 100 x 50 mm card with bottom notch of width 30, depth 20, radius 3
    const notch = { edge: "bottom", widthMm: 30, depthMm: 20, radiusMm: 3 };
    const notchedPoly = buildNotchPolygon(100, 50, notch);
    const initialBounds = polygonBounds(notchedPoly);
    expect(initialBounds.minX).toBeCloseTo(0, 2);
    expect(initialBounds.maxX).toBeCloseTo(100, 2);

    const bleedMm = 1.5;
    const offset = offsetPath(notchedPoly, bleedMm);
    const bounds = polygonBounds(offset);

    // Outer boundary expands by bleedMm
    expect(bounds.minX).toBeCloseTo(-1.5, 2);
    expect(bounds.maxX).toBeCloseTo(101.5, 2);
    expect(bounds.minY).toBeCloseTo(-1.5, 2);
    expect(bounds.maxY).toBeCloseTo(51.5, 2);

    // Notch cavity ceiling was at Y = 50 - 20 = 30.
    // When expanding outward, the cavity ceiling moves DOWN towards the outer edge to 30 + 1.5 = 31.5 mm
    // (the cavity shrinks by 1.5 mm, extending artwork 1.5 mm into the notch)
    const cavityCeilingPts = offset.filter((p) => p.x > 36 && p.x < 64 && p.y >= 25 && p.y <= 45);
    const minCavityY = Math.min(...cavityCeilingPts.map((p) => p.y));
    expect(minCavityY).toBeCloseTo(31.5, 1);
  });

  it("handles a shape with an enclosed hole: outer expands outward and hole shrinks", () => {
    // ATM Card preset with chip window hole
    const atmPreset = {
      id: "atm-card",
      wMm: 85.6,
      hMm: 53.98,
      shape: "rounded",
      cornerRadiusMm: 3.18,
      hole: {
        xMm: 10,
        yMm: 15,
        widthMm: 12,
        heightMm: 9,
        radiusMm: 1,
      },
    };

    const cutPoly = getPresetCutPolygon(atmPreset);
    expect(cutPoly.outer.length).toBeGreaterThan(4);
    expect(cutPoly.holes.length).toBe(1);

    const holeCutBounds = polygonBounds(cutPoly.holes[0]);
    expect(holeCutBounds.minX).toBeCloseTo(10, 2);
    expect(holeCutBounds.maxX).toBeCloseTo(22, 2);
    expect(holeCutBounds.minY).toBeCloseTo(15, 2);
    expect(holeCutBounds.maxY).toBeCloseTo(24, 2);
    expect(holeCutBounds.width).toBeCloseTo(12, 2);
    expect(holeCutBounds.height).toBeCloseTo(9, 2);

    const bleedMm = 1.5;
    const bleedShape = getBleedShape(atmPreset, bleedMm);

    // Outer footprint bounds: width = 85.6 + 3 = 88.6 mm, height = 53.98 + 3 = 56.98 mm
    expect(bleedShape.footprint.widthMm).toBeCloseTo(88.6, 2);
    expect(bleedShape.footprint.heightMm).toBeCloseTo(56.98, 2);

    // Shrunk hole inside the bleed shape:
    // Original hole width: 12 mm. Shrunk by 1.5 mm on both sides -> 12 - 3 = 9 mm
    // Original hole height: 9 mm. Shrunk by 1.5 mm on both sides -> 9 - 3 = 6 mm
    expect(bleedShape.holes.length).toBe(1);
    const bleedHoleBounds = polygonBounds(bleedShape.holes[0]);
    expect(bleedHoleBounds.width).toBeCloseTo(9.0, 1);
    expect(bleedHoleBounds.height).toBeCloseTo(6.0, 1);

    // The cut hole inside the bleed shape stays at exact cut size:
    const cutHoleBounds = polygonBounds(bleedShape.cutHoles[0]);
    expect(cutHoleBounds.width).toBeCloseTo(12.0, 2);
    expect(cutHoleBounds.height).toBeCloseTo(9.0, 2);
  });

  it("computes accurate footprint dimensions and aspect ratios", () => {
    const preset = { wMm: 50, hMm: 75 };
    const fp0 = getFootprint(preset, 0);
    expect(fp0.widthMm).toBe(50);
    expect(fp0.heightMm).toBe(75);

    const fp15 = getFootprint(preset, 1.5);
    expect(fp15.widthMm).toBe(53);
    expect(fp15.heightMm).toBe(78);
    expect(fp15.aspectRatio).toBeCloseTo(53 / 78, 4);
  });
});
