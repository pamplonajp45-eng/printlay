import { describe, it, expect } from "vitest";
import { packShelves } from "./layout";
import { resolvePhotoPreset, presetKey, hasMixedSizes, PER_PHOTO_SIZES } from "./photoSizes";
import { PHOTO_PRESETS, getOrientedPreset } from "./presets";

const A = { w: 60, h: 40, key: "a" };
const B = { w: 90, h: 50, key: "b" };
const sheet = { sheetW: 210, sheetH: 297, margin: 5, gap: 2 };

describe("packShelves mixRows", () => {
  it("puts different sizes side by side in photo order, row height = tallest", () => {
    const a = { w: 92, h: 183, key: "phone-a" };
    const b = { w: 91, h: 181, key: "phone-b" };
    const { pages } = packShelves({ sheetW: 210, sheetH: 297, margin: 6, gap: 2, mixRows: true, items: [a, b, a] });
    expect(pages.length).toBe(2);
    expect(pages[0].map((c) => c.index)).toEqual([0, 1]);
    expect(pages[0][0].y).toBe(pages[0][1].y);
    expect(pages[0][1].w).toBe(91);
    // without mixRows each size gets its own row (here: its own page)
    const { pages: apart } = packShelves({ sheetW: 210, sheetH: 297, margin: 6, gap: 2, items: [a, b, a] });
    expect(apart.length).toBe(2);
    expect(apart[0].map((c) => c.index)).toEqual([0, 2]);
  });
});

describe("packShelves", () => {
  it("keeps one size per row and groups sizes together", () => {
    const { pages } = packShelves({ ...sheet, items: [A, B, A, B, A] });
    expect(pages).toHaveLength(1);
    const byRow = {};
    for (const p of pages[0]) (byRow[p.row] ||= []).push(p.index);
    // A's (0,2,4) fit 3 per 200 mm row; B's (1,3) share the next row
    expect(byRow[0]).toEqual([0, 2, 4]);
    expect(byRow[1]).toEqual([1, 3]);
  });

  it("never overlaps items and respects the gap", () => {
    const items = Array.from({ length: 9 }, (_, i) => (i % 3 === 0 ? B : A));
    const { pages } = packShelves({ ...sheet, items });
    for (const pg of pages) {
      for (let i = 0; i < pg.length; i++) {
        for (let j = i + 1; j < pg.length; j++) {
          const a = pg[i];
          const b = pg[j];
          const sepX = Math.max(b.x - (a.x + a.w), a.x - (b.x + b.w));
          const sepY = Math.max(b.y - (a.y + a.h), a.y - (b.y + b.h));
          expect(Math.max(sepX, sepY)).toBeGreaterThanOrEqual(2 - 1e-6);
        }
      }
    }
  });

  it("stays inside the margins", () => {
    const items = Array.from({ length: 12 }, (_, i) => (i % 2 ? A : B));
    const { pages, oversize } = packShelves({ ...sheet, items });
    expect(oversize).toEqual([]);
    for (const pg of pages) {
      for (const p of pg) {
        expect(p.x).toBeGreaterThanOrEqual(5 - 1e-6);
        expect(p.y).toBeGreaterThanOrEqual(5 - 1e-6);
        expect(p.x + p.w).toBeLessThanOrEqual(205 + 1e-6);
        expect(p.y + p.h).toBeLessThanOrEqual(292 + 1e-6);
      }
    }
  });

  it("starts a new page when the sheet is full and places every item once", () => {
    const items = Array.from({ length: 30 }, () => B);
    const { pages } = packShelves({ ...sheet, items });
    expect(pages.length).toBeGreaterThan(1);
    const all = pages.flat().map((p) => p.index).sort((x, y) => x - y);
    expect(all).toEqual(items.map((_, i) => i));
  });

  it("reserves rowExtra under each row", () => {
    const { pages } = packShelves({ ...sheet, center: false, rowExtra: 4, items: [B, B, B] });
    const ys = [...new Set(pages[0].map((p) => p.y))];
    expect(ys[1] - ys[0]).toBeCloseTo(50 + 4 + 2);
  });

  it("turns a size 90° when more fit per row", () => {
    const wide = { w: 120, h: 80, key: "w" };
    const { pages } = packShelves({ ...sheet, allowRotate: true, items: [wide, wide] });
    expect(pages[0].every((p) => p.rotated && p.w === 80 && p.h === 120)).toBe(true);
    expect(pages[0][0].y).toBe(pages[0][1].y); // both on one row
    const { pages: noTurn } = packShelves({ ...sheet, items: [wide, wide] });
    expect(noTurn[0].some((p) => p.rotated)).toBe(false);
  });

  it("flags items larger than the usable area", () => {
    const { oversize } = packShelves({ ...sheet, items: [{ w: 300, h: 10, key: "x" }] });
    expect(oversize).toEqual([0]);
  });

  it("uses one page with an infinite (continuous) sheet", () => {
    const items = Array.from({ length: 40 }, () => B);
    const { pages } = packShelves({ ...sheet, sheetH: Infinity, items });
    expect(pages).toHaveLength(1);
    expect(pages[0][0].y).toBe(5);
  });
});

describe("photoSizes", () => {
  const v2 = PHOTO_PRESETS.find((p) => p.id === "nametag-notch");
  const v5 = PHOTO_PRESETS.find((p) => p.id === "nametag-hole-v5");
  const r4 = PHOTO_PRESETS.find((p) => p.id === "4R") || PHOTO_PRESETS.find((p) => !p.id.startsWith("nametag") && p.id !== "custom");
  const active = getOrientedPreset(v2, "landscape");

  it("falls back to the batch preset", () => {
    expect(resolvePhotoPreset({}, active, "landscape")).toBe(active);
    expect(resolvePhotoPreset({ sizeId: v2.id }, active, "landscape")).toBe(active);
    expect(resolvePhotoPreset({ sizeId: "nope" }, active, "landscape")).toBe(active);
  });

  it("prints name tags landscape even in a portrait batch", () => {
    const p = resolvePhotoPreset({ sizeId: v5.id }, active, "portrait");
    expect(p.id).toBe(v5.id);
    expect(p.wIn).toBeGreaterThan(p.hIn);
  });

  it("follows the batch orientation for other sizes", () => {
    const p = resolvePhotoPreset({ sizeId: r4.id }, active, "portrait");
    expect(p.wIn).toBeLessThanOrEqual(p.hIn);
  });

  it("detects mixed sizes", () => {
    const p5 = resolvePhotoPreset({ sizeId: v5.id }, active, "landscape");
    expect(hasMixedSizes([active, active])).toBe(false);
    expect(hasMixedSizes([active, p5])).toBe(true);
    expect(presetKey(active)).not.toBe(presetKey(p5));
  });

  it("does not offer Custom per photo", () => {
    expect(PER_PHOTO_SIZES.some((p) => p.id === "custom")).toBe(false);
  });
});

describe("planBleedSheets", async () => {
  const { planBleedSheets } = await import("./bleedSheets");
  const { getBleedShape } = await import("./bleedGeometry");
  const v2 = getOrientedPreset(PHOTO_PRESETS.find((p) => p.id === "nametag-notch"), "landscape");
  const v5 = getOrientedPreset(PHOTO_PRESETS.find((p) => p.id === "nametag-hole-v5"), "landscape");
  const shapes = new Map();
  const getShape = (p) => {
    if (!shapes.has(p)) shapes.set(p, getBleedShape(p, 1.5, 0));
    return shapes.get(p);
  };
  const settings = { gapMm: 3, marginMm: 5, allowRotate: true };

  it("uses the rotation-aware grid for a single size", () => {
    const plan = planBleedSheets({ presets: [v2, v2, v2, v2, v2], getShape, settings });
    expect(plan.mixed).toBe(false);
    expect(plan.capacity).toBeGreaterThan(0);
    expect(plan.pages.flat().map((it) => it.index)).toEqual([0, 1, 2, 3, 4]);
  });

  it("keeps one size per row for non-name-tag mixes", () => {
    const r4 = getOrientedPreset(PHOTO_PRESETS.find((p) => p.id === "4R") ?? PHOTO_PRESETS[9], "portrait");
    const wallet = getOrientedPreset(PHOTO_PRESETS.find((p) => p.id.toLowerCase().includes("wallet")) ?? PHOTO_PRESETS[7], "portrait");
    const presets = [r4, wallet, r4, wallet, wallet];
    const plan = planBleedSheets({ presets, getShape, settings });
    for (const page of plan.pages) {
      const rows = new Map();
      for (const it of page) {
        const key = it.y.toFixed(3);
        if (!rows.has(key)) rows.set(key, new Set());
        rows.get(key).add(it.preset.id);
      }
      for (const ids of rows.values()) expect(ids.size).toBe(1);
    }
  });

  it("mixes V2-V4 and V5 on the same sheets with their own shapes", () => {
    const presets = [v2, v5, v2, v5];
    const plan = planBleedSheets({ presets, getShape, settings });
    expect(plan.mixed).toBe(true);
    const all = plan.pages.flat();
    expect(all.map((it) => it.index).sort()).toEqual([0, 1, 2, 3]);
    for (const it of all) {
      expect(it.shape).toBe(getShape(presets[it.index]));
      // placed size = footprint, swapped when turned 90°
      expect(it.rotated ? it.h : it.w).toBeCloseTo(it.shape.footprint.widthMm);
    }
    // name tags share one 2x2 grid: all 4 on one sheet, in photo order
    expect(plan.pages).toHaveLength(1);
    expect(plan.pages[0].map((it) => it.index)).toEqual([0, 1, 2, 3]);
    // the first sheet really holds both sizes
    expect(new Set(plan.pages[0].map((it) => it.preset.id)).size).toBe(2);
  });
});

describe("packUniformGrid", async () => {
  const { packUniformGrid } = await import("./layout");
  // name-tag-ish sizes in mm on A4 landscape
  const v2 = { w: 122, h: 79 };
  const v5 = { w: 126.5, h: 84.6 };
  const a4l = { sheetW: 297, sheetH: 210, margin: 7.6, gap: 3.8 };

  it("puts 4 per page in a 2x2 grid whatever the mix", () => {
    const items = [v5, v2, v5, v2, v2, v5, v5];
    const { pages, perPage } = packUniformGrid({ ...a4l, items });
    expect(perPage).toBe(4);
    expect(pages.map((p) => p.length)).toEqual([4, 3]);
    expect(pages.flat().map((p) => p.index)).toEqual([0, 1, 2, 3, 4, 5, 6]);
  });

  it("uses the same slot positions on every page and centers smaller items", () => {
    const { pages } = packUniformGrid({ ...a4l, items: [v5, v5, v5, v5, v2, v5, v5, v5] });
    // slot 0 on page 2 holds a smaller V2: centered in the V5-sized cell
    expect(pages[1][0].x).toBeCloseTo(pages[0][0].x + (126.5 - 122) / 2);
    expect(pages[1][0].y).toBeCloseTo(pages[0][0].y + (84.6 - 79) / 2);
    expect(pages[1][1].x).toBeCloseTo(pages[0][1].x);
  });

  it("never overlaps and stays inside the margins", () => {
    const { pages } = packUniformGrid({ ...a4l, items: [v5, v2, v5, v2] });
    const pg = pages[0];
    for (const p of pg) {
      expect(p.x).toBeGreaterThanOrEqual(7.6 - 1e-6);
      expect(p.x + p.w).toBeLessThanOrEqual(297 - 7.6 + 1e-6);
      expect(p.y + p.h).toBeLessThanOrEqual(210 - 7.6 + 1e-6);
    }
    expect(pg[1].x - (pg[0].x + pg[0].w)).toBeGreaterThan(3.8 - 1e-6);
  });

  it("turns the grid 90° on portrait A4 when that fits more", () => {
    const { pages, perPage } = packUniformGrid({ sheetW: 210, sheetH: 297, margin: 5, gap: 3, items: [v5, v2, v5, v2], allowRotate: true });
    expect(perPage).toBe(4);
    expect(pages[0].every((p) => p.rotated)).toBe(true);
    expect(pages[0][1].w).toBeCloseTo(79);
  });

  it("flags items bigger than the page", () => {
    const { oversize, pages } = packUniformGrid({ ...a4l, items: [{ w: 400, h: 10 }, { w: 400, h: 10 }] });
    expect(oversize).toEqual([0, 1]);
    expect(pages).toHaveLength(2);
  });
});

describe("planBleedSheets name-tag mix", async () => {
  const { planBleedSheets } = await import("./bleedSheets");
  const { getBleedShape } = await import("./bleedGeometry");
  const tag = (id) => getOrientedPreset(PHOTO_PRESETS.find((p) => p.id === id), "landscape");
  const v2 = tag("nametag-notch");
  const v5 = tag("nametag-hole-v5");
  const v6 = tag("nametag-hole-v6");
  const shapes = new Map();
  const getShape = (p) => {
    if (!shapes.has(p)) shapes.set(p, getBleedShape(p, 1.5, 0));
    return shapes.get(p);
  };

  it("gives a consistent 4 per A4 page for any V2/V5/V6 mix", () => {
    const presets = [v5, v6, v2, v5, v6, v6, v2, v5, v5];
    const plan = planBleedSheets({ presets, getShape, settings: { gapMm: 3, marginMm: 5, allowRotate: true } });
    expect(plan.pages.map((p) => p.length)).toEqual([4, 4, 1]);
    expect(plan.pages.flat().map((it) => it.index)).toEqual(presets.map((_, i) => i));
  });
});

describe("planBleedSheets on A4 landscape", async () => {
  const { planBleedSheets } = await import("./bleedSheets");
  const { getBleedShape } = await import("./bleedGeometry");
  const tag = (id) => getOrientedPreset(PHOTO_PRESETS.find((p) => p.id === id), "landscape");
  const v2 = tag("nametag-notch");
  const v5 = tag("nametag-hole-v5");
  const getShape = (p) => getBleedShape(p, 1.5, 0);
  const landscape = { widthMm: 297, heightMm: 210 };

  it("fits 4 name tags per landscape sheet without turning them, inside the page", () => {
    const presets = [v5, v2, v5, v2, v5];
    const plan = planBleedSheets({ presets, getShape, settings: { gapMm: 3, marginMm: 5, allowRotate: true }, sheet: landscape });
    expect(plan.pages.map((p) => p.length)).toEqual([4, 1]);
    for (const it of plan.pages.flat()) {
      expect(it.rotated).toBe(false);
      expect(it.x + it.w).toBeLessThanOrEqual(297 - 5 + 1e-6);
      expect(it.y + it.h).toBeLessThanOrEqual(210 - 5 + 1e-6);
    }
  });
});
