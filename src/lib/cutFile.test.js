import { describe, it, expect } from "vitest";
import { toSheetPoint, buildCutPaths, buildCutSvg, buildCutDxf } from "./cutFile";
import { getBleedShape, polygonBounds } from "./bleedGeometry";

const atm = {
  wMm: 85.6, hMm: 53.98, cornerRadiusMm: 3.18, shape: "rounded",
  hole: { xMm: 10, yMm: 15, widthMm: 12, heightMm: 9, radiusMm: 1 },
};
const shape = getBleedShape(atm, 1.5, 0, { fillCutouts: true });

describe("toSheetPoint", () => {
  it("offsets unrotated items", () => {
    expect(toSheetPoint({ x: 10, y: 20, rotated: false, shape }, { x: 1, y: 2 })).toEqual({ x: 11, y: 22 });
  });

  it("matches renderSheet's 90° placement (translate fh, rotate 90°)", () => {
    const item = { x: 10, y: 20, rotated: true, shape };
    const fh = shape.footprint.heightMm;
    // footprint corner (0,0) lands at the placed cell's top-RIGHT
    expect(toSheetPoint(item, { x: 0, y: 0 })).toEqual({ x: 10 + fh, y: 20 });
    // (fw, fh) lands at the placed cell's bottom-left
    const p = toSheetPoint(item, { x: shape.footprint.widthMm, y: fh });
    expect(p.x).toBeCloseTo(10);
    expect(p.y).toBeCloseTo(20 + shape.footprint.widthMm);
  });
});

describe("buildCutPaths", () => {
  it("emits the outer cut and the window, inside the item's placed cell", () => {
    const item = { x: 30, y: 40, rotated: false, shape };
    const paths = buildCutPaths([item]);
    expect(paths).toHaveLength(2);
    const outer = polygonBounds(paths[0]);
    expect(outer.width).toBeCloseTo(85.6, 1);
    expect(outer.minX).toBeCloseTo(30 + 1.5, 1); // bleed sits outside the cut
    expect(outer.minY).toBeCloseTo(40 + 1.5, 1);
    const hole = polygonBounds(paths[1]);
    expect(hole.width).toBeCloseTo(12, 1);
  });

  it("rotated items swap the cut size on the sheet", () => {
    const b = polygonBounds(buildCutPaths([{ x: 0, y: 0, rotated: true, shape }])[0]);
    expect(b.width).toBeCloseTo(53.98, 1);
    expect(b.height).toBeCloseTo(85.6, 1);
  });
});

describe("buildCutSvg", () => {
  const paths = buildCutPaths([{ x: 5, y: 5, rotated: false, shape }]);

  it("is A4 at real size with one path per cut line", () => {
    const svg = buildCutSvg({ paths });
    expect(svg).toContain('width="210mm" height="297mm" viewBox="0 0 210 297"');
    expect(svg.match(/<path /g)).toHaveLength(2);
    expect(svg).not.toContain("<image");
  });

  it("embeds the artwork under the cut lines when given", () => {
    const svg = buildCutSvg({ paths, artworkDataUrl: "data:image/png;base64,AAAA" });
    expect(svg.indexOf("<image")).toBeLessThan(svg.indexOf('id="cut-lines"'));
    expect(svg).toContain('xlink:href="data:image/png;base64,AAAA"');
  });
});

describe("buildCutDxf", () => {
  it("writes closed R12 polylines in mm with Y flipped", () => {
    const paths = [[{ x: 10, y: 10 }, { x: 20, y: 10 }, { x: 20, y: 30 }]];
    const dxf = buildCutDxf({ paths });
    const lines = dxf.split("\r\n");
    expect(lines).toContain("AC1009");
    expect(dxf.match(/\r\nPOLYLINE\r\n/g)).toHaveLength(1);
    expect(dxf.match(/\r\nVERTEX\r\n/g)).toHaveLength(3);
    // first vertex: x=10, y = 297 - 10 = 287
    const v = lines.indexOf("VERTEX");
    expect(lines.slice(v, v + 9)).toEqual(["VERTEX", "8", "CUT", "10", "10", "20", "287", "30", "0"]);
    expect(lines[lines.length - 2]).toBe("EOF");
  });
});

describe("buildCutDxf pageFrame", () => {
  it("adds a blue A4 frame on its own layer, cut lines red", () => {
    const dxf = buildCutDxf({ paths: [[{ x: 1, y: 1 }, { x: 2, y: 1 }, { x: 2, y: 2 }]], pageFrame: true });
    const lines = dxf.split("\r\n");
    expect(dxf.match(/\r\nPOLYLINE\r\n/g)).toHaveLength(2);
    const f = lines.indexOf("PAGE_FRAME");
    expect(lines.slice(f, f + 3)).toEqual(["PAGE_FRAME", "62", "5"]);
    const c = lines.indexOf("CUT");
    expect(lines.slice(c, c + 3)).toEqual(["CUT", "62", "1"]);
    expect(dxf).toContain("\r\n10\r\n210\r\n20\r\n0\r\n"); // bottom-right corner (Y flipped)
  });
});

describe("buildCutDxf scale", () => {
  it("multiplies every coordinate", () => {
    const dxf = buildCutDxf({ paths: [[{ x: 10, y: 10 }, { x: 20, y: 10 }, { x: 20, y: 30 }]], pageFrame: true, scale: 1.25 });
    const lines = dxf.split("\r\n");
    // frame corner (210, 0) -> (262.5, 371.25)
    expect(dxf).toContain("\r\n10\r\n262.5\r\n20\r\n371.25\r\n");
    // first cut vertex (10, 297-10) * 1.25
    const v = lines.indexOf("CUT");
    const firstVertex = lines.indexOf("VERTEX", v);
    expect(lines.slice(firstVertex + 3, firstVertex + 7)).toEqual(["10", "12.5", "20", "358.75"]);
  });
});
