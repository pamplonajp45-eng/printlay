import { describe, it, expect } from "vitest";
import { computeLayout, computeFlowLayout, pageCounts, A4 } from "./layout";

const fp = { widthMm: 53, heightMm: 78 };

function overlap(a, b) {
  return a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + b.h;
}

describe("computeLayout", () => {
  it("fits a 3x3 grid upright when rotation is off", () => {
    const r = computeLayout({ footprint: fp, allowRotate: false });
    expect(r.cols).toBe(3);
    expect(r.rows).toBe(3);
    expect(r.capacity).toBe(9);
    expect(r.rotated).toBe(false);
  });

  it("rotates when that fits more items (2x5 = 10 > 9)", () => {
    const r = computeLayout({ footprint: fp, allowRotate: true });
    expect(r.rotated).toBe(true);
    expect(r.capacity).toBe(10);
    expect(r.items[0].w).toBe(78);
    expect(r.items[0].h).toBe(53);
  });

  it("keeps every item inside the margins and never overlaps", () => {
    const margin = 5;
    const r = computeLayout({ footprint: fp, marginMm: margin, gapMm: 1 });
    for (const it of r.items) {
      expect(it.x).toBeGreaterThanOrEqual(margin - 1e-6);
      expect(it.y).toBeGreaterThanOrEqual(margin - 1e-6);
      expect(it.x + it.w).toBeLessThanOrEqual(A4.widthMm - margin + 1e-6);
      expect(it.y + it.h).toBeLessThanOrEqual(A4.heightMm - margin + 1e-6);
    }
    for (let i = 0; i < r.items.length; i++)
      for (let j = i + 1; j < r.items.length; j++) expect(overlap(r.items[i], r.items[j])).toBe(false);
  });

  it("keeps at least the min gap between neighbouring bleed edges", () => {
    const r = computeLayout({ footprint: fp, gapMm: 2, allowRotate: false });
    const a = r.items[0];
    const b = r.items[1];
    expect(b.x - (a.x + a.w)).toBeGreaterThanOrEqual(2 - 1e-6);
  });

  it("capacity drops as bleed grows", () => {
    const small = computeLayout({ footprint: { widthMm: 50, heightMm: 75 }, allowRotate: false }).capacity;
    const big = computeLayout({ footprint: { widthMm: 70, heightMm: 75 }, allowRotate: false }).capacity;
    expect(big).toBeLessThan(small);
  });

  it("only places `count` items and centres the used block", () => {
    const r = computeLayout({ footprint: fp, count: 2, allowRotate: false });
    expect(r.placed).toBe(2);
    expect(r.items.length).toBe(2);
    const left = r.items[0].x;
    const right = A4.widthMm - (r.items[1].x + r.items[1].w);
    expect(left).toBeCloseTo(right, 3);
  });

  it("returns nothing when the item is bigger than the sheet", () => {
    const r = computeLayout({ footprint: { widthMm: 300, heightMm: 300 } });
    expect(r.capacity).toBe(0);
    expect(r.items).toEqual([]);
  });
});

describe("computeFlowLayout / pageCounts", () => {
  it("wraps rows and reports overflow", () => {
    const boxes = Array.from({ length: 3 }, () => ({ w: 90, h: 60 }));
    const { positions, overflow } = computeFlowLayout({ boxes, gapMm: 6, marginMm: 8 });
    expect(overflow).toBe(0);
    expect(positions[1].y).toBe(positions[0].y);
    expect(positions[2].y).toBeGreaterThan(positions[0].y);

    const tooBig = computeFlowLayout({ boxes: [{ w: 400, h: 10 }] });
    expect(tooBig.overflow).toBe(1);
  });

  it("splits photos across sheets", () => {
    expect(pageCounts(25, 10)).toEqual([10, 10, 5]);
    expect(pageCounts(0, 10)).toEqual([]);
  });
});