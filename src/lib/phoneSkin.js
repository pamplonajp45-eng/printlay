/**
 * Phone back-skin templates: a die-cut outline generated from a phone's
 * measurements.
 *
 * Everything here is in MILLIMETRES and drawn AS SEEN FROM THE BACK of the
 * phone (camera side up, top of the phone at the top). That is how the
 * sticker is printed and applied, so no mirroring is needed. Note that
 * "left" in this view is the screen's RIGHT side: Android power / volume
 * buttons (screen-right) therefore sit on the LEFT edge here.
 *
 * The template is the back panel plus optional side flaps (the "wrap") that
 * fold over the frame. Cut-outs:
 *   - camera / flash windows on the back panel
 *   - buttons, ports, speaker and mic holes on the flaps
 * A cut-out that runs (almost) off a flap's outer edge becomes an open notch.
 */
import ClipperLibModule from "clipper-lib";

const ClipperLib = ClipperLibModule.default || ClipperLibModule;
const SCALE = 1000; // Clipper integer units per mm (1 micron)

/** Narrowest strip of vinyl left between a cut-out and a flap edge (mm). */
const MIN_BRIDGE_MM = 1;

export const SKIN_STYLES = [
  { id: "full", name: "Full wrap", description: "Back + all four sides" },
  { id: "sides", name: "Back + sides", description: "Back + the two long sides (buttons)" },
  { id: "back", name: "Back only", description: "Back panel only, no side wrap" },
];

const FLAPS_BY_STYLE = {
  full: ["left", "right", "top", "bottom"],
  sides: ["left", "right"],
  back: [],
};

export const DEFAULT_PHONE_SKIN = {
  modelId: "redmi-note-17-5g",
  style: "full",
  wrapMm: null, // null = automatic from the phone's thickness
  clearanceMm: 0.5, // extra gap around every cut-out
  cornerGapMm: null, // null = the phone's corner radius
  edits: {}, // { [modelId]: model } fine-tuned copies
};

// ---------------------------------------------------------------------------
// Model catalogue
// ---------------------------------------------------------------------------
// body: w (width), h (height), t (thickness), r (corner radius seen from the back)
// cameras: windows on the back panel, x / y from the back's top-left corner
// edges: cut-outs on the sides.
//   edge:   "left" | "right" | "top" | "bottom" (back view)
//   from:   start along the edge (left/right: from the top, top/bottom: from the left)
//   len:    length along the edge
//   h:      size across the phone's thickness
//   offset: centre across the thickness, from the back face (default t / 2)
//
// bodySource: "official" = the maker's spec sheet, "published" = spec sites
// (GSMArena etc.) when the maker's page doesn't list it. Corner radius,
// camera, button and port positions are ESTIMATES: measure the real phone
// and fine-tune before cutting a batch.
//
// The Philippine best sellers (Infinix, TECNO, POCO, vivo, Galaxy A17,
// iPhone 18 Pro Max) were added from Lazada PH "sold" counts, Nov 2026.

const lens = (cx, cy, d) => ({ x: +(cx - d / 2).toFixed(2), y: +(cy - d / 2).toFixed(2), w: d, h: d, r: d / 2 });
const box = (x, y, w, h, r) => ({ x, y, w, h, r });
const slot = (label, edge, from, len, h = 3) => ({ label, edge, from: +from.toFixed(2), len, h });
const hole = (label, edge, centre, d) => ({ label, edge, from: +(centre - d / 2).toFixed(2), len: d, h: d });

/** Android: power + volume on the screen-right side = LEFT edge seen from the back. */
function androidEdges(w, { volFrom, volLen, powerFrom, powerLen, keyIsland = false }) {
  const buttons = keyIsland
    ? [slot("Buttons", "left", volFrom, powerFrom + powerLen - volFrom, 3.4)]
    : [slot("Volume", "left", volFrom, volLen), slot("Power", "left", powerFrom, powerLen)];
  return [
    ...buttons,
    slot("USB-C", "bottom", w / 2 - 4.6, 9.2, 3.5),
    slot("Speaker", "bottom", w * 0.17, 11, 1.8),
    hole("Mic", "bottom", w / 2 + 9, 1.4),
    hole("Top mic", "top", w / 2 + 10, 1.4),
  ];
}

/** iPhone: side button on the screen-right = LEFT edge from the back; volume on the RIGHT. */
function iphoneEdges(w, h, { port = 9, cameraControl = false } = {}) {
  const k = h / 146.7;
  const edges = [
    slot("Side button", "left", 41 * k, 18),
    slot("Switch / Action", "right", 27 * k, 7),
    slot("Volume up", "right", 41 * k, 10),
    slot("Volume down", "right", 54 * k, 10),
    slot("Port", "bottom", w / 2 - port / 2, port, 3.4),
    slot("Speaker", "bottom", w / 2 - 6 - 10, 10, 1.6),
    slot("Mic", "bottom", w / 2 + 6, 10, 1.6),
  ];
  if (cameraControl) edges.push(slot("Camera Control", "left", 96 * k, 17, 4));
  return edges;
}

/** Samsung Galaxy: three separate lens rings in a column at the top-left. */
function samsungLenses(x, y0, d, pitch, n = 3) {
  return Array.from({ length: n }, (_, i) => lens(x, y0 + i * pitch, d));
}

const CUSTOM_MODEL = {
  id: "custom-phone",
  brand: "Custom",
  name: "Custom phone (measure your own)",
  bodySource: "custom",
  body: { w: 75, h: 162, t: 8, r: 9 },
  cameras: [box(6, 6, 26, 30, 7)],
  edges: androidEdges(75, { volFrom: 40, volLen: 24, powerFrom: 72, powerLen: 12 }),
};

export const PHONE_MODELS = [
  // ---- Xiaomi / Redmi ----
  {
    id: "redmi-note-17-5g",
    brand: "Xiaomi / Redmi",
    name: "Redmi Note 17 5G / Note 17",
    bodySource: "official",
    body: { w: 79.14, h: 169.7, t: 8.45, r: 10 },
    cameras: [box(6.5, 6.5, 30, 34, 8.5)],
    edges: androidEdges(79.14, { volFrom: 42, volLen: 26, powerFrom: 77, powerLen: 13 }),
  },
  {
    id: "redmi-note-17-pro-5g",
    brand: "Xiaomi / Redmi",
    name: "Redmi Note 17 Pro 5G",
    bodySource: "official",
    body: { w: 78.27, h: 163.45, t: 8.6, r: 10 },
    cameras: [box(6.5, 6.5, 31, 35, 8.5)],
    edges: androidEdges(78.27, { volFrom: 40, volLen: 25, powerFrom: 74, powerLen: 13 }),
  },
  {
    id: "redmi-note-15-5g",
    brand: "Xiaomi / Redmi",
    name: "Redmi Note 15 5G",
    bodySource: "official",
    body: { w: 75.42, h: 164, t: 7.35, r: 9.5 },
    cameras: [box(6, 6, 28, 33, 8)],
    edges: androidEdges(75.42, { volFrom: 40, volLen: 25, powerFrom: 74, powerLen: 12 }),
  },
  {
    id: "redmi-note-15-pro-5g",
    brand: "Xiaomi / Redmi",
    name: "Redmi Note 15 Pro 5G",
    bodySource: "official",
    body: { w: 78.09, h: 163.61, t: 7.96, r: 10 },
    cameras: [box(6.5, 6.5, 31, 35, 8.5)],
    edges: androidEdges(78.09, { volFrom: 40, volLen: 25, powerFrom: 74, powerLen: 12 }),
  },
  {
    id: "redmi-note-13-4g",
    brand: "Xiaomi / Redmi",
    name: "Redmi Note 13 (4G)",
    bodySource: "official",
    body: { w: 75.55, h: 162.24, t: 7.97, r: 9 },
    cameras: [box(6, 6, 23, 36, 6)],
    edges: androidEdges(75.55, { volFrom: 38, volLen: 25, powerFrom: 71, powerLen: 12 }),
  },
  {
    id: "poco-x8-pro",
    brand: "Xiaomi / Redmi",
    name: "POCO X8 Pro",
    bodySource: "official",
    body: { w: 75.19, h: 157.53, t: 8.38, r: 9.5 },
    cameras: [box(6, 6, 28, 34, 8)],
    edges: androidEdges(75.19, { volFrom: 38, volLen: 24, powerFrom: 70, powerLen: 12 }),
  },

  // ---- Infinix (Transsion) ----
  {
    id: "infinix-smart-20",
    brand: "Infinix",
    name: "Infinix Smart 20",
    bodySource: "official",
    body: { w: 78.8, h: 167.7, t: 7.7, r: 9.5 },
    cameras: [box(6, 6, 25, 31, 7.5)],
    edges: androidEdges(78.8, { volFrom: 42, volLen: 25, powerFrom: 76, powerLen: 13 }),
  },
  {
    id: "infinix-note-edge-5g",
    brand: "Infinix",
    name: "Infinix NOTE Edge 5G",
    bodySource: "published",
    body: { w: 77.4, h: 163.1, t: 7.2, r: 9.5 },
    cameras: [box(6, 6, 28, 33, 9)],
    edges: androidEdges(77.4, { volFrom: 40, volLen: 25, powerFrom: 74, powerLen: 13 }),
  },

  // ---- TECNO (Transsion) ----
  {
    id: "tecno-spark-go-3",
    brand: "TECNO",
    name: "TECNO Spark Go 3",
    bodySource: "published",
    body: { w: 77.8, h: 167.7, t: 8.1, r: 9.5 },
    cameras: [box(6, 6, 24, 29, 7)],
    edges: androidEdges(77.8, { volFrom: 42, volLen: 25, powerFrom: 76, powerLen: 13 }),
  },
  {
    id: "tecno-spark-50-4g",
    brand: "TECNO",
    name: "TECNO Spark 50 (4G)",
    bodySource: "published",
    body: { w: 79.2, h: 167.8, t: 8.2, r: 9.5 },
    cameras: [box(6, 6, 27, 32, 8)],
    edges: androidEdges(79.2, { volFrom: 42, volLen: 25, powerFrom: 76, powerLen: 13 }),
  },

  // ---- vivo ----
  {
    id: "vivo-y05e",
    brand: "vivo",
    name: "vivo Y05e",
    bodySource: "official",
    body: { w: 76.95, h: 167.3, t: 8.19, r: 9.5 },
    cameras: [box(6, 6, 25, 30, 7.5)],
    edges: androidEdges(76.95, { volFrom: 42, volLen: 25, powerFrom: 76, powerLen: 13 }),
  },

  // ---- Samsung ----
  {
    id: "galaxy-a17-5g",
    brand: "Samsung",
    name: "Galaxy A17 5G",
    bodySource: "published",
    body: { w: 77.9, h: 164.4, t: 7.5, r: 9 },
    cameras: [box(7, 7, 14.5, 40, 7.25)],
    edges: androidEdges(77.9, { volFrom: 40, volLen: 24, powerFrom: 68, powerLen: 13, keyIsland: true }),
  },
  {
    id: "galaxy-a16",
    brand: "Samsung",
    name: "Galaxy A16 / A16 5G",
    bodySource: "official",
    body: { w: 77.9, h: 164.4, t: 7.9, r: 9 },
    cameras: samsungLenses(13.5, 13.5, 10.5, 13),
    edges: androidEdges(77.9, { volFrom: 40, volLen: 24, powerFrom: 68, powerLen: 13, keyIsland: true }),
  },
  {
    id: "galaxy-a15",
    brand: "Samsung",
    name: "Galaxy A15 / A15 5G",
    bodySource: "official",
    body: { w: 76.8, h: 160.1, t: 8.4, r: 9 },
    cameras: samsungLenses(13.5, 13.5, 10.5, 13),
    edges: androidEdges(76.8, { volFrom: 38, volLen: 24, powerFrom: 66, powerLen: 13, keyIsland: true }),
  },
  {
    id: "galaxy-a26",
    brand: "Samsung",
    name: "Galaxy A26 5G",
    bodySource: "official",
    body: { w: 77.5, h: 164, t: 7.7, r: 9 },
    cameras: [box(7, 7, 14.5, 40, 7.25)],
    edges: androidEdges(77.5, { volFrom: 40, volLen: 24, powerFrom: 68, powerLen: 13, keyIsland: true }),
  },
  {
    id: "galaxy-a36",
    brand: "Samsung",
    name: "Galaxy A36 5G",
    bodySource: "official",
    body: { w: 78.2, h: 162.9, t: 7.4, r: 9 },
    cameras: [box(7, 7, 14.5, 40, 7.25)],
    edges: androidEdges(78.2, { volFrom: 40, volLen: 24, powerFrom: 68, powerLen: 13, keyIsland: true }),
  },
  {
    id: "galaxy-a56",
    brand: "Samsung",
    name: "Galaxy A56 5G",
    bodySource: "official",
    body: { w: 77.5, h: 162.2, t: 7.4, r: 9 },
    cameras: [box(7, 7, 14.5, 40, 7.25)],
    edges: androidEdges(77.5, { volFrom: 40, volLen: 24, powerFrom: 68, powerLen: 13, keyIsland: true }),
  },
  {
    id: "galaxy-a55",
    brand: "Samsung",
    name: "Galaxy A55 5G",
    bodySource: "official",
    body: { w: 77.4, h: 161.1, t: 8.2, r: 9 },
    cameras: samsungLenses(13.5, 13.5, 11, 13.5),
    edges: androidEdges(77.4, { volFrom: 39, volLen: 24, powerFrom: 67, powerLen: 13, keyIsland: true }),
  },
  {
    id: "galaxy-s24",
    brand: "Samsung",
    name: "Galaxy S24",
    bodySource: "official",
    body: { w: 70.6, h: 147, t: 7.6, r: 8 },
    cameras: samsungLenses(12.5, 12.5, 10, 12.5),
    edges: androidEdges(70.6, { volFrom: 32, volLen: 22, powerFrom: 58, powerLen: 12 }),
  },
  {
    id: "galaxy-s25-ultra",
    brand: "Samsung",
    name: "Galaxy S25 Ultra",
    bodySource: "official",
    body: { w: 77.6, h: 162.8, t: 8.2, r: 8 },
    cameras: [...samsungLenses(15, 14.5, 13, 15.5), lens(31, 30, 11)],
    edges: androidEdges(77.6, { volFrom: 36, volLen: 24, powerFrom: 64, powerLen: 13 }),
  },

  // ---- Apple ----
  {
    id: "iphone-11",
    brand: "Apple",
    name: "iPhone 11",
    bodySource: "official",
    body: { w: 75.7, h: 150.9, t: 8.3, r: 11 },
    cameras: [box(5, 5, 31, 31, 8)],
    edges: iphoneEdges(75.7, 150.9, { port: 8 }),
  },
  {
    id: "iphone-12",
    brand: "Apple",
    name: "iPhone 12 / 12 Pro",
    bodySource: "official",
    body: { w: 71.5, h: 146.7, t: 7.4, r: 10 },
    cameras: [box(5, 5, 29, 29, 7.5)],
    edges: iphoneEdges(71.5, 146.7, { port: 8 }),
  },
  {
    id: "iphone-13",
    brand: "Apple",
    name: "iPhone 13",
    bodySource: "official",
    body: { w: 71.5, h: 146.7, t: 7.65, r: 10 },
    cameras: [box(5, 5, 29.5, 29.5, 7.5)],
    edges: iphoneEdges(71.5, 146.7, { port: 8 }),
  },
  {
    id: "iphone-13-pro",
    brand: "Apple",
    name: "iPhone 13 Pro",
    bodySource: "official",
    body: { w: 71.5, h: 146.7, t: 7.65, r: 10 },
    // Triple-lens Pro plateau: much bigger than the iPhone 13's
    cameras: [box(5, 5, 35.5, 37, 9)],
    edges: iphoneEdges(71.5, 146.7, { port: 8 }),
  },
  {
    id: "iphone-14",
    brand: "Apple",
    name: "iPhone 14",
    bodySource: "official",
    body: { w: 71.5, h: 146.7, t: 7.8, r: 10 },
    cameras: [box(5, 5, 30.5, 30.5, 8)],
    edges: iphoneEdges(71.5, 146.7, { port: 8 }),
  },
  {
    id: "iphone-15",
    brand: "Apple",
    name: "iPhone 15",
    bodySource: "official",
    body: { w: 71.6, h: 147.6, t: 7.8, r: 10 },
    cameras: [box(5, 5, 30.5, 30.5, 8)],
    edges: iphoneEdges(71.6, 147.6),
  },
  {
    id: "iphone-16",
    brand: "Apple",
    name: "iPhone 16",
    bodySource: "official",
    body: { w: 71.6, h: 147.6, t: 7.8, r: 10 },
    cameras: [box(5, 5, 17.5, 33, 8.75)],
    edges: iphoneEdges(71.6, 147.6, { cameraControl: true }),
  },
  {
    id: "iphone-13-pro-max",
    brand: "Apple",
    name: "iPhone 13 Pro Max",
    bodySource: "official",
    body: { w: 78.1, h: 160.8, t: 7.65, r: 11 },
    cameras: [box(5, 5, 38, 39.5, 9)],
    edges: iphoneEdges(78.1, 160.8, { port: 8 }),
  },
  {
    id: "iphone-15-pro-max",
    brand: "Apple",
    name: "iPhone 15 Pro Max",
    bodySource: "official",
    body: { w: 76.7, h: 159.9, t: 8.25, r: 11 },
    cameras: [box(5, 5, 38, 39.5, 9)],
    edges: iphoneEdges(76.7, 159.9),
  },
  {
    id: "iphone-16-pro",
    brand: "Apple",
    name: "iPhone 16 Pro",
    bodySource: "official",
    body: { w: 71.5, h: 149.6, t: 8.25, r: 10 },
    cameras: [box(5, 5, 36, 37.5, 9)],
    edges: iphoneEdges(71.5, 149.6, { cameraControl: true }),
  },
  {
    id: "iphone-16-pro-max",
    brand: "Apple",
    name: "iPhone 16 Pro Max",
    bodySource: "official",
    body: { w: 77.6, h: 163, t: 8.25, r: 11 },
    cameras: [box(5, 5, 38.5, 40, 9)],
    edges: iphoneEdges(77.6, 163, { cameraControl: true }),
  },
  {
    id: "iphone-17-pro-max",
    brand: "Apple",
    name: "iPhone 17 Pro Max",
    bodySource: "official",
    body: { w: 78, h: 163.4, t: 8.75, r: 11 },
    // Full-width camera plateau
    cameras: [box(3.5, 3.5, 71, 40, 8)],
    edges: iphoneEdges(78, 163.4, { cameraControl: true }),
  },
  {
    id: "iphone-18-pro-max",
    brand: "Apple",
    name: "iPhone 18 Pro Max",
    bodySource: "official",
    body: { w: 78, h: 163.4, t: 8.75, r: 11 },
    // Same body as the 17 Pro Max; full-width camera plateau assumed
    cameras: [box(3.5, 3.5, 71, 40, 8)],
    edges: iphoneEdges(78, 163.4, { cameraControl: true }),
  },

  CUSTOM_MODEL,
];

export const PHONE_BRANDS = [...new Set(PHONE_MODELS.map((m) => m.brand))];

export function findPhoneModel(id) {
  return PHONE_MODELS.find((m) => m.id === id) || null;
}

/** The model to build: the user's fine-tuned copy if there is one, else the catalogue entry. */
export function resolvePhoneModel(state) {
  const s = state || DEFAULT_PHONE_SKIN;
  return s.edits?.[s.modelId] || findPhoneModel(s.modelId) || PHONE_MODELS[0];
}

export function isPhoneModelEdited(state) {
  return Boolean(state?.edits?.[state?.modelId]);
}

/** Default wrap depth: the frame minus ~2 mm so the vinyl stops short of the screen. */
export function defaultWrapMm(thicknessMm) {
  return Math.max(3, +(thicknessMm - 2).toFixed(1));
}

// ---------------------------------------------------------------------------
// Geometry
// ---------------------------------------------------------------------------

const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));

function arc(pts, cx, cy, r, a0, a1) {
  // ~0.01 mm chord error: plenty at 300-600 dpi and for cutter blades
  const n = Math.max(3, Math.ceil(Math.sqrt(r) * 6));
  for (let i = 1; i <= n; i++) {
    const a = a0 + ((a1 - a0) * i) / n;
    pts.push({ x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) });
  }
}

/** Rounded rectangle polygon (mm). r is clamped; r >= half the short side = stadium / circle. */
export function roundedRectPoly(x, y, w, h, r = 0) {
  const rr = clamp(r, 0, Math.min(w, h) / 2);
  if (rr < 0.01) {
    return [
      { x, y },
      { x: x + w, y },
      { x: x + w, y: y + h },
      { x, y: y + h },
    ];
  }
  const pts = [{ x: x + rr, y }];
  const H = Math.PI / 2;
  pts.push({ x: x + w - rr, y });
  arc(pts, x + w - rr, y + rr, rr, -H, 0);
  pts.push({ x: x + w, y: y + h - rr });
  arc(pts, x + w - rr, y + h - rr, rr, 0, H);
  pts.push({ x: x + rr, y: y + h });
  arc(pts, x + rr, y + h - rr, rr, H, 2 * H);
  pts.push({ x, y: y + rr });
  arc(pts, x + rr, y + rr, rr, 2 * H, 3 * H);
  // drop the duplicated start point and any zero-length edges
  return pts.filter((p, i) => {
    const q = pts[(i + 1) % pts.length];
    return Math.abs(p.x - q.x) > 1e-6 || Math.abs(p.y - q.y) > 1e-6;
  });
}

const toClipper = (poly) => {
  const path = poly.map((p) => ({ X: Math.round(p.x * SCALE), Y: Math.round(p.y * SCALE) }));
  if (!ClipperLib.Clipper.Orientation(path)) path.reverse(); // same winding for nonzero union
  return path;
};
const fromClipper = (path) => path.map((p) => ({ x: +(p.X / SCALE).toFixed(4), y: +(p.Y / SCALE).toFixed(4) }));

/**
 * Builds the die-cut template for one phone.
 *
 * @param {Object} model - entry shaped like PHONE_MODELS[i]
 * @param {Object} [opts] - { style, wrapMm, clearanceMm, cornerGapMm }
 * @returns {{
 *   outer: Array<{x:number,y:number}>, holes: Array<Array<{x:number,y:number}>>,
 *   widthMm: number, heightMm: number, wrapMm: number,
 *   back: { x: number, y: number, w: number, h: number, r: number }
 * }} polygons in mm, top-left of the whole template at 0,0
 */
export function buildPhoneSkinShape(model, opts = {}) {
  const { style = "full", wrapMm = null, clearanceMm = 0.5, cornerGapMm = null } = opts;
  const W = Math.max(10, +model.body.w || 0);
  const H = Math.max(10, +model.body.h || 0);
  const T = Math.max(1, +model.body.t || 0);
  const R = clamp(+model.body.r || 0, 0, Math.min(W, H) / 2);
  const c = clamp(+clearanceMm || 0, 0, 5);

  const flaps = FLAPS_BY_STYLE[style] || FLAPS_BY_STYLE.full;
  const has = (edge) => flaps.includes(edge);
  const D = flaps.length ? clamp(wrapMm ?? defaultWrapMm(T), 1, 30) : 0;
  const gap = clamp(cornerGapMm ?? R, 0, Math.min(W, H) / 2 - 2);

  const ox = has("left") ? D : 0;
  const oy = has("top") ? D : 0;
  const widthMm = W + (has("left") ? D : 0) + (has("right") ? D : 0);
  const heightMm = H + (has("top") ? D : 0) + (has("bottom") ? D : 0);

  // --- solid parts: back panel + flaps (each flap tucks a little under the back panel)
  const solids = [roundedRectPoly(ox, oy, W, H, R)];
  const fr = Math.min(1.5, D / 3); // rounded flap corners
  const ov = fr + 0.5;
  if (has("left")) solids.push(roundedRectPoly(ox - D, oy + gap, D + ov, H - 2 * gap, fr));
  if (has("right")) solids.push(roundedRectPoly(ox + W - ov, oy + gap, D + ov, H - 2 * gap, fr));
  if (has("top")) solids.push(roundedRectPoly(ox + gap, oy - D, W - 2 * gap, D + ov, fr));
  if (has("bottom")) solids.push(roundedRectPoly(ox + gap, oy + H - ov, W - 2 * gap, D + ov, fr));

  // --- cut-outs
  const cuts = [];
  for (const cam of model.cameras || []) {
    if (!(cam.w > 0 && cam.h > 0)) continue;
    cuts.push(roundedRectPoly(ox + cam.x - c, oy + cam.y - c, cam.w + 2 * c, cam.h + 2 * c, (cam.r || 0) + c));
  }
  for (const e of model.edges || []) {
    if (!has(e.edge) || !(e.len > 0 && e.h > 0)) continue;
    const mid = Number.isFinite(e.offset) ? e.offset : T / 2;
    const a0 = mid - e.h / 2 - c; // across the thickness, measured out from the back face
    let a1 = mid + e.h / 2 + c;
    if (D - a1 < MIN_BRIDGE_MM) a1 = D + 1; // too close to the flap edge: open it into a notch
    const s0 = e.from - c; // along the edge
    const s1 = e.from + e.len + c;
    const r = Math.min((e.h + 2 * c) / 2, (s1 - s0) / 2);
    const across = a1 - a0;
    const along = s1 - s0;
    if (e.edge === "left") cuts.push(roundedRectPoly(ox - a1, oy + s0, across, along, r));
    else if (e.edge === "right") cuts.push(roundedRectPoly(ox + W + a0, oy + s0, across, along, r));
    else if (e.edge === "top") cuts.push(roundedRectPoly(ox + s0, oy - a1, along, across, r));
    else if (e.edge === "bottom") cuts.push(roundedRectPoly(ox + s0, oy + H + a0, along, across, r));
  }

  // --- boolean: union(solids) - union(cuts)
  const cpr = new ClipperLib.Clipper();
  cpr.AddPaths(solids.map(toClipper), ClipperLib.PolyType.ptSubject, true);
  if (cuts.length) cpr.AddPaths(cuts.map(toClipper), ClipperLib.PolyType.ptClip, true);
  const tree = new ClipperLib.PolyTree();
  cpr.Execute(
    cuts.length ? ClipperLib.ClipType.ctDifference : ClipperLib.ClipType.ctUnion,
    tree,
    ClipperLib.PolyFillType.pftNonZero,
    ClipperLib.PolyFillType.pftNonZero,
  );

  // Keep the main piece (a cut-out that splits a flap off leaves a loose island)
  let main = null;
  let mainArea = -1;
  for (const node of tree.Childs()) {
    const a = Math.abs(ClipperLib.Clipper.Area(node.Contour()));
    if (a > mainArea) {
      mainArea = a;
      main = node;
    }
  }
  const outer = main ? fromClipper(main.Contour()) : [];
  const holes = main
    ? main
        .Childs()
        .map((n) => fromClipper(n.Contour()))
        .filter((p) => p.length >= 3)
    : [];

  return {
    outer,
    holes,
    widthMm: +widthMm.toFixed(3),
    heightMm: +heightMm.toFixed(3),
    wrapMm: D,
    back: { x: ox, y: oy, w: W, h: H, r: R },
  };
}

/**
 * A photo-size preset for the phone skin, ready for getOrientedPreset().
 * `shape: "path"` + `cutShapeMm` tell the layout, crop, bleed and cut-file
 * code to follow the die-cut outline (holes use the evenodd rule).
 */
export function buildPhoneSkinPreset(state) {
  const s = { ...DEFAULT_PHONE_SKIN, ...(state || {}) };
  const model = resolvePhoneModel(s);
  const shape = buildPhoneSkinShape(model, s);
  const wIn = shape.widthMm / 25.4;
  const hIn = shape.heightMm / 25.4;
  const styleName = (SKIN_STYLES.find((x) => x.id === s.style) || SKIN_STYLES[0]).name;
  return {
    id: "phoneSkin",
    name: `${model.name} skin`,
    description: `${styleName} · ${shape.widthMm.toFixed(1)} × ${shape.heightMm.toFixed(1)} mm`,
    wIn,
    hIn,
    wCm: +(shape.widthMm / 10).toFixed(2),
    hCm: +(shape.heightMm / 10).toFixed(2),
    isPolaroid: false,
    aspectRatio: wIn / hIn,
    isPhoneSkin: true,
    shape: "path",
    cutShapeMm: { outer: shape.outer, holes: shape.holes },
    phoneModelId: model.id,
  };
}
