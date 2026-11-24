import { describe, it, expect } from "vitest";
import {
  PHONE_MODELS,
  buildPhoneSkinShape,
  buildPhoneSkinPreset,
  findPhoneModel,
  defaultWrapMm,
  DEFAULT_PHONE_SKIN,
} from "./phoneSkin";
import { getOrientedPreset, isShapedPreset } from "./presets";
import { polygonBounds, getPresetCutPolygon, getBleedShape } from "./bleedGeometry";
import { PER_PHOTO_SIZES } from "./photoSizes";

const note17 = findPhoneModel("redmi-note-17-5g");

describe("phone skin geometry", () => {
  it("full wrap = back panel + a wrap flap on every side", () => {
    const s = buildPhoneSkinShape(note17, { style: "full" });
    const D = defaultWrapMm(8.45);
    expect(s.wrapMm).toBe(D);
    expect(s.widthMm).toBeCloseTo(79.14 + 2 * D, 3);
    expect(s.heightMm).toBeCloseTo(169.7 + 2 * D, 3);
    const b = polygonBounds(s.outer);
    expect(b.minX).toBeCloseTo(0, 2);
    expect(b.minY).toBeCloseTo(0, 2);
    expect(b.maxX).toBeCloseTo(s.widthMm, 2);
    expect(b.maxY).toBeCloseTo(s.heightMm, 2);
  });

  it("default wrap: side cut-outs open into notches, only the camera is a window", () => {
    const s = buildPhoneSkinShape(note17, { style: "full" });
    const plain = buildPhoneSkinShape({ ...note17, edges: [] }, { style: "full" });
    expect(s.holes.length).toBe(1);
    expect(s.outer.length).toBeGreaterThan(plain.outer.length + 20);
  });

  it("cuts the camera window and the side holes", () => {
    const s = buildPhoneSkinShape(note17, { style: "full", wrapMm: 8 });
    // camera + volume + power + USB-C + speaker + mic + top mic
    expect(s.holes.length).toBe(7);
    const cam = polygonBounds(s.holes.find((h) => polygonBounds(h).width > 20));
    const c = note17.cameras[0];
    expect(cam.minX).toBeCloseTo(s.back.x + c.x - 0.5, 1);
    expect(cam.width).toBeCloseTo(c.w + 1, 1);
  });

  it("back only = the plain back panel with just the camera window", () => {
    const s = buildPhoneSkinShape(note17, { style: "back" });
    expect(s.widthMm).toBeCloseTo(79.14, 3);
    expect(s.heightMm).toBeCloseTo(169.7, 3);
    expect(s.holes.length).toBe(1);
  });

  it("a cut-out near the flap edge opens into a notch instead of leaving a sliver", () => {
    const model = {
      ...note17,
      cameras: [],
      edges: [{ label: "Fat button", edge: "left", from: 50, len: 20, h: 6 }],
    };
    // wrap 6 mm, button centred at 4.2 mm and 6 mm tall: would leave < 1 mm of vinyl
    const s = buildPhoneSkinShape(model, { style: "full", wrapMm: 6 });
    expect(s.holes.length).toBe(0);
    // the notch is part of the outline: some outline point sits inside the flap
    const inNotch = s.outer.some((p) => p.x > 0.5 && p.x < 6 && p.y > 50 + 6 && p.y < 70 + 6);
    expect(inNotch).toBe(true);
  });

  it("every catalogue model builds one clean piece", () => {
    for (const m of PHONE_MODELS) {
      for (const style of ["full", "sides", "back"]) {
        const s = buildPhoneSkinShape(m, { style });
        expect(s.outer.length, `${m.id} ${style}`).toBeGreaterThan(8);
        const b = polygonBounds(s.outer);
        expect(b.width, `${m.id} ${style}`).toBeCloseTo(s.widthMm, 1);
        expect(b.height, `${m.id} ${style}`).toBeCloseTo(s.heightMm, 1);
        // A camera window inside the back panel stays a closed hole; a
        // full-width plateau (iPhone 17 / 18 Pro Max) opens to the edges
        const insideWindow = m.cameras.some((c) => c.x > 0 && c.y > 0);
        if (insideWindow) expect(s.holes.length, `${m.id} ${style}`).toBeGreaterThanOrEqual(1);
      }
    }
  });
});

describe("iPhone data from Apple's dimensional drawings", () => {
  it("iPhone 13 Pro: plateau window sits 1.15 mm in, extends to 42.39 x 43.62 mm", () => {
    const s = buildPhoneSkinShape(findPhoneModel("iphone-13-pro"), { style: "back", clearanceMm: 0 });
    expect(s.holes.length).toBe(1);
    const b = polygonBounds(s.holes[0]);
    expect(b.minX).toBeCloseTo(1.15, 2);
    expect(b.minY).toBeCloseTo(1.15, 2);
    expect(b.maxX).toBeCloseTo(42.39, 2);
    expect(b.maxY).toBeCloseTo(43.62, 2);
  });

  it("buttons are centre ± half-length; bottom ports are mirrored into the back view", () => {
    const m = findPhoneModel("iphone-15");
    const vol = m.edges.find((e) => e.label === "Volume up");
    expect(vol.edge).toBe("right");
    expect(vol.from).toBeCloseTo(46.27 - 5.6, 2);
    expect(vol.len).toBeCloseTo(11.2, 2);
    const usb = m.edges.find((e) => e.label === "USB-C");
    expect(usb.from).toBeCloseTo(71.63 - 40.31, 2);
    expect(usb.len).toBeCloseTo(9, 2);
    expect(m.edges.find((e) => e.label === "Side button").edge).toBe("left");
  });

  it("iPhone 17 Pro Max: the full-width plateau takes the top strip, the template starts below it", () => {
    const m = findPhoneModel("iphone-17-pro-max");
    const s = buildPhoneSkinShape(m, { style: "back", clearanceMm: 0.5 });
    // Below the plateau (its rounded bottom corners leave a little panel at the sides)
    expect(s.heightMm).toBeGreaterThan(163.43 - 49.2);
    expect(s.heightMm).toBeLessThan(163.43 - 40);
    expect(s.widthMm).toBeCloseTo(77.98, 1);
  });
});

describe("phone skin preset", () => {
  it("is a shaped preset sized to the template", () => {
    const p = buildPhoneSkinPreset(DEFAULT_PHONE_SKIN);
    expect(isShapedPreset(p)).toBe(true);
    expect(p.wIn * 25.4).toBeCloseTo(79.14 + 2 * defaultWrapMm(8.45), 3);
    expect(p.name).toMatch(/Redmi Note 17 5G/);
  });

  it("uses the user's fine-tuned copy of the model", () => {
    const edited = { ...note17, body: { ...note17.body, w: 80 } };
    const p = buildPhoneSkinPreset({ ...DEFAULT_PHONE_SKIN, style: "back", edits: { [note17.id]: edited } });
    expect(p.wIn * 25.4).toBeCloseTo(80, 3);
  });

  it("turns the outline with the photo orientation", () => {
    const p = buildPhoneSkinPreset({ ...DEFAULT_PHONE_SKIN, style: "back" });
    const land = getOrientedPreset(p, "landscape");
    expect(land.wIn).toBeCloseTo(p.hIn, 6);
    const b = polygonBounds(land.cutShapeMm.outer);
    expect(b.width).toBeCloseTo(169.7, 1);
    expect(b.height).toBeCloseTo(79.14, 1);
    expect(b.minX).toBeCloseTo(0, 2);
    expect(b.minY).toBeCloseTo(0, 2);
    expect(land.cutShapeMm.holes.length).toBe(1);
  });

  it("feeds the bleed / cut-file pipeline with outline + holes", () => {
    const p = buildPhoneSkinPreset({ ...DEFAULT_PHONE_SKIN, wrapMm: 8 });
    const cut = getPresetCutPolygon(p);
    expect(cut.holes.length).toBe(p.cutShapeMm.holes.length);
    const shape = getBleedShape(p, 1.5);
    expect(shape.footprint.widthMm).toBeCloseTo(p.wIn * 25.4 + 3, 1);
    expect(shape.cutHoles.length).toBe(p.cutShapeMm.holes.length);
  });

  it("is not offered as a per-photo size", () => {
    expect(PER_PHOTO_SIZES.some((p) => p.id === "phoneSkin")).toBe(false);
  });
});
