/**
 * Cut files for Silhouette Studio (and other cutters). Pure string builders,
 * no DOM. All units are mm, origin top-left of the sheet, same placement
 * (incl. 90° rotation) as renderSheet, so cut lines land on the printed art.
 */
import { A4 } from "./layout";

/** One placed item's point (footprint frame, mm) -> sheet mm. Matches renderSheet. */
export function toSheetPoint(item, p) {
  if (item.rotated) {
    // translate(x, y) · translate(fh, 0) · rotate(90°): (px, py) -> (fh - py, px)
    const fh = item.shape.footprint.heightMm;
    return { x: item.x + fh - p.y, y: item.y + p.x };
  }
  return { x: item.x + p.x, y: item.y + p.y };
}

/**
 * Every closed cut path on the sheet: each item's outer cut line (incl. notch /
 * die-cut) plus its enclosed windows.
 * @param {Array<{x,y,rotated,shape}>} items - placed items (shape = getBleedShape result)
 * @returns {Array<Array<{x:number,y:number}>>}
 */
export function buildCutPaths(items) {
  const paths = [];
  for (const item of items) {
    const { cutOuter, cutHoles = [] } = item.shape;
    for (const poly of [cutOuter, ...cutHoles]) {
      if (poly && poly.length >= 3) paths.push(poly.map((p) => toSheetPoint(item, p)));
    }
  }
  return paths;
}

const n = (v) => (+v.toFixed(3)).toString();

function pathD(poly) {
  return `M${poly.map((p) => `${n(p.x)} ${n(p.y)}`).join(" L")} Z`;
}

/**
 * A4 SVG at real size (mm). Optional artwork PNG fills the page underneath;
 * cut lines are thin red strokes, no fill, in their own group.
 */
export function buildCutSvg({ paths, sheet = A4, artworkDataUrl = null, title = "PrintLay cut file" }) {
  const W = sheet.widthMm;
  const H = sheet.heightMm;
  const art = artworkDataUrl
    ? `  <g id="print-artwork">\n    <image x="0" y="0" width="${W}" height="${H}" preserveAspectRatio="none" xlink:href="${artworkDataUrl}" href="${artworkDataUrl}"/>\n  </g>\n`
    : "";
  const cuts = paths.map((p) => `    <path d="${pathD(p)}"/>`).join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1"
     width="${W}mm" height="${H}mm" viewBox="0 0 ${W} ${H}">
  <title>${title}</title>
${art}  <g id="cut-lines" fill="none" stroke="#ff0000" stroke-width="0.25">
${cuts}
  </g>
</svg>
`;
}

/**
 * AutoCAD R12 DXF (the most widely readable flavour, incl. Silhouette Basic).
 * Closed POLYLINEs in mm, cut lines in RED on layer CUT. DXF's Y axis points
 * up, so Y is flipped against the sheet height (same way up as the print).
 *
 * pageFrame: adds the page border (BLUE, layer PAGE_FRAME) so the imported
 * group is exactly the page size: place it at X 0 / Y 0, then delete the
 * blue frame before cutting.
 *
 * scale: multiplies every coordinate (default 1 = real size in mm). Note that
 * Silhouette Studio fits DXF imports to its own size whatever the file says,
 * so pre-scaling does not help there; resize the frame to the page instead.
 */
export function buildCutDxf({ paths, sheet = A4, pageFrame = false, scale = 1 }) {
  const H = sheet.heightMm;
  const out = [
    "0", "SECTION", "2", "HEADER",
    "9", "$ACADVER", "1", "AC1009",
    "9", "$INSUNITS", "70", "4", // 4 = millimetres
    "9", "$MEASUREMENT", "70", "1", // metric
    "9", "$EXTMIN", "10", "0", "20", "0", "30", "0",
    "9", "$EXTMAX", "10", n(sheet.widthMm * scale), "20", n(H * scale), "30", "0",
    "0", "ENDSEC",
    "0", "SECTION", "2", "ENTITIES",
  ];
  // 62 = ACI colour: 1 red (cut), 5 blue (page frame)
  const polyline = (poly, layer, color) => {
    out.push("0", "POLYLINE", "8", layer, "62", String(color), "66", "1", "10", "0", "20", "0", "30", "0", "70", "1");
    for (const p of poly) {
      out.push("0", "VERTEX", "8", layer, "10", n(p.x * scale), "20", n((H - p.y) * scale), "30", "0");
    }
    out.push("0", "SEQEND", "8", layer);
  };
  if (pageFrame) {
    const W = sheet.widthMm;
    polyline([{ x: 0, y: 0 }, { x: W, y: 0 }, { x: W, y: H }, { x: 0, y: H }], "PAGE_FRAME", 5);
  }
  for (const poly of paths) polyline(poly, "CUT", 1);
  out.push("0", "ENDSEC", "0", "EOF");
  return out.join("\r\n") + "\r\n";
}
