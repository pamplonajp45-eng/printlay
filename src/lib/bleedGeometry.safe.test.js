import { describe, it, expect } from "vitest";
import { getBleedShape, getSafeShape, polygonBounds } from "./bleedGeometry";

const atm = {
  wMm: 85.6, hMm: 53.98, cornerRadiusMm: 3.18, shape: "rounded",
  hole: { xMm: 10, yMm: 15, widthMm: 12, heightMm: 9, radiusMm: 1 },
};
const notched = { wMm: 100, hMm: 50, notch: { edge: "bottom", widthMm: 30, depthMm: 20, radiusMm: 3 } };

describe("getSafeShape", () => {
  it("moves the outer cut line inward and grows holes", () => {
    const s = getBleedShape(atm, 1.5, 0);
    const safe = getSafeShape(s, 2);
    const ob = polygonBounds(safe.outer);
    expect(ob.width).toBeCloseTo(85.6 - 4, 1);
    expect(ob.height).toBeCloseTo(53.98 - 4, 1);
    const hb = polygonBounds(safe.holes[0]);
    expect(hb.width).toBeCloseTo(12 + 4, 1);
    expect(hb.height).toBeCloseTo(9 + 4, 1);
  });

  it("returns the cut path itself for a zero safe distance", () => {
    const s = getBleedShape(atm, 1.5, 0);
    const safe = getSafeShape(s, 0);
    expect(safe.outer).toBe(s.cutOuter);
    expect(safe.holes).toBe(s.cutHoles);
  });

  it("handles missing shapes", () => {
    expect(getSafeShape(null, 1)).toEqual({ outer: [], holes: [] });
  });
});

describe("getBleedShape around a notch", () => {
  it("bleed covers the notch walls and ceiling by the bleed distance", () => {
    const s = getBleedShape(notched, 1.5, 0);
    // Footprint frame is shifted by +1.5 mm; cavity walls were at x=35/65, ceiling y=30
    const cavityPts = s.outer.filter((p) => p.y > 30 && p.y < 45 && p.x > 30 && p.x < 70);
    const xs = cavityPts.map((p) => p.x);
    expect(Math.min(...xs)).toBeCloseTo(35 + 1.5 + 1.5, 1);
    expect(Math.max(...xs)).toBeCloseTo(65 - 1.5 + 1.5, 1);
    expect(Math.min(...cavityPts.map((p) => p.y))).toBeCloseTo(30 + 1.5 + 1.5, 1);
  });
});

describe("getBleedShape with fillCutouts", () => {
  // even-odd point-in-polygon
  const inside = (pt, poly) => {
    let c = false;
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      const a = poly[i];
      const b = poly[j];
      if ((a.y > pt.y) !== (b.y > pt.y) && pt.x < ((b.x - a.x) * (pt.y - a.y)) / (b.y - a.y) + a.x) c = !c;
    }
    return c;
  };

  it("prints the photo through the notch but keeps the notch in the cut line", () => {
    const s = getBleedShape(notched, 1.5, 0, { fillCutouts: true });
    // notch centre (x=50, y=45) in the shifted frame (+1.5 mm)
    const p = { x: 51.5, y: 46.5 };
    expect(inside(p, s.outer)).toBe(true);
    expect(inside(p, s.cutOuter)).toBe(false);
    // same footprint as without the option
    const plain = getBleedShape(notched, 1.5, 0);
    expect(s.footprint).toEqual(plain.footprint);
    expect(s.cutOuter).toEqual(plain.cutOuter);
  });

  it("prints through the window: no bleed hole, cut hole unchanged", () => {
    const s = getBleedShape(atm, 1.5, 0, { fillCutouts: true });
    expect(s.holes).toEqual([]);
    expect(s.cutHoles).toHaveLength(1);
    expect(s.fillCutouts).toBe(true);
  });

  it("is off by default", () => {
    expect(getBleedShape(atm, 1.5, 0).holes).toHaveLength(1);
  });
});
