import { describe, it, expect } from "vitest";
import { getBleedShape, polygonBounds } from "./bleedGeometry";

const atm = {
  wMm: 85.6, hMm: 53.98, cornerRadiusMm: 3.18,
  hole: { xMm: 10, yMm: 15, widthMm: 12, heightMm: 9, radiusMm: 1 },
};

describe("getBleedShape with cut inset", () => {
  it("footprint stays nominal + 2*bleed regardless of inset", () => {
    const s = getBleedShape(atm, 1.5, 0.3);
    expect(s.footprint.widthMm).toBeCloseTo(88.6, 2);
    expect(s.footprint.heightMm).toBeCloseTo(56.98, 2);
  });

  it("cut outer is inset by 0.3 mm on each side", () => {
    const s = getBleedShape(atm, 1.5, 0.3);
    const cb = polygonBounds(s.cutOuter);
    expect(cb.width).toBeCloseTo(85.6 - 0.6, 2);
    expect(cb.height).toBeCloseTo(53.98 - 0.6, 2);
    // sits 1.5 (bleed) + 0.3 (inset) from the cell edge
    expect(cb.minX).toBeCloseTo(1.8, 2);
  });

  it("cut hole GROWS with inset (blade moves into the ink), bleed hole still shrinks", () => {
    const s = getBleedShape(atm, 1.5, 0.3);
    expect(polygonBounds(s.cutHoles[0]).width).toBeCloseTo(12.6, 2);
    expect(polygonBounds(s.cutHoles[0]).height).toBeCloseTo(9.6, 2);
    expect(polygonBounds(s.holes[0]).width).toBeCloseTo(9, 1);
  });

  it("cut line always lies inside the bleed outline and outside the bleed hole", () => {
    const s = getBleedShape(atm, 1.5, 0.3);
    const bo = polygonBounds(s.outer), co = polygonBounds(s.cutOuter);
    expect(co.minX).toBeGreaterThan(bo.minX);
    expect(co.maxX).toBeLessThan(bo.maxX);
    const bh = polygonBounds(s.holes[0]), ch = polygonBounds(s.cutHoles[0]);
    expect(ch.minX).toBeLessThan(bh.minX);
    expect(ch.maxX).toBeGreaterThan(bh.maxX);
  });

  it("zero inset matches the original behaviour", () => {
    const s = getBleedShape(atm, 1.5, 0);
    expect(polygonBounds(s.cutHoles[0]).width).toBeCloseTo(12, 2);
    expect(s.footprint.widthMm).toBeCloseTo(88.6, 2);
  });
});