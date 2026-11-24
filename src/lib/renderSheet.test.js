import { describe, it, expect } from "vitest";
import { resolvePageLabel, pageLabelPlacement } from "./renderSheet";

const A4 = { widthMm: 210, heightMm: 297 };

describe("page label on bleed-cut sheets", () => {
  it("only when enabled with text; a sheet's own override wins", () => {
    const label = { enabled: true, text: "WAYBILL-1", position: "bottom-right", fontSize: 9 };
    expect(resolvePageLabel({ ...label, enabled: false }, {}, 0)).toBeNull();
    expect(resolvePageLabel({ ...label, text: "  " }, {}, 0)).toBeNull();
    expect(resolvePageLabel(label, { 1: { text: "PAGE-2" } }, 1).text).toBe("PAGE-2");
    expect(resolvePageLabel(label, { 1: { text: "PAGE-2" } }, 0).text).toBe("WAYBILL-1");
  });

  it("corner presets sit inside the page margin, free X/Y uses page fractions", () => {
    const corner = pageLabelPlacement({ text: "A", position: "bottom-right", fontSize: 9 }, A4, 6);
    expect(corner).toMatchObject({ xMm: 204, yMm: 291, align: "right" });
    const free = pageLabelPlacement({ text: "A", x: 0.95, y: 0.96, fontSize: 9 }, A4, 6);
    expect(free.xMm).toBeCloseTo(199.5, 5);
    expect(free.yMm).toBeCloseTo(285.12, 5);
    expect(free.align).toBe("left");
    expect(free.fontMm).toBeCloseTo((9 / 72) * 25.4, 5);
  });
});
