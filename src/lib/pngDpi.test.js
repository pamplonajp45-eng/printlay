import { describe, it, expect } from "vitest";
import { setPngDpi, crc32 } from "./pngDpi";

// 1x1 transparent PNG
const PNG = Uint8Array.from(
  atob("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="),
  (c) => c.charCodeAt(0),
);

const chunks = (png) => {
  const v = new DataView(png.buffer, png.byteOffset, png.byteLength);
  const list = [];
  for (let off = 8; off < png.length; ) {
    const len = v.getUint32(off);
    const type = String.fromCharCode(...png.subarray(off + 4, off + 8));
    list.push({ type, len, off, crc: v.getUint32(off + 8 + len) });
    off += 12 + len;
  }
  return list;
};

describe("setPngDpi", () => {
  it("computes the standard CRC-32", () => {
    expect(crc32(new TextEncoder().encode("123456789"))).toBe(0xcbf43926);
  });

  it("inserts a valid pHYs chunk after IHDR with 300 DPI", () => {
    const out = setPngDpi(PNG, 300);
    const list = chunks(out);
    expect(list.map((c) => c.type)).toEqual(["IHDR", "pHYs", "IDAT", "IEND"]);
    const p = list[1];
    const v = new DataView(out.buffer, out.byteOffset);
    expect(v.getUint32(p.off + 8)).toBe(11811); // 300 / 0.0254
    expect(v.getUint32(p.off + 12)).toBe(11811);
    expect(out[p.off + 16]).toBe(1);
    expect(p.crc).toBe(crc32(out.subarray(p.off + 4, p.off + 8 + p.len)));
  });

  it("replaces an existing pHYs instead of adding a second one", () => {
    const twice = setPngDpi(setPngDpi(PNG, 72), 300);
    expect(chunks(twice).filter((c) => c.type === "pHYs")).toHaveLength(1);
  });

  it("rejects non-PNG data", () => {
    expect(() => setPngDpi(new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8]), 300)).toThrow();
  });
});
