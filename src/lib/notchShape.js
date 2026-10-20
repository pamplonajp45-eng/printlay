/**
 * notchShape.js: geometry helpers for stickers that have a rounded notch cut
 * out of one edge (e.g. the "Name Tag Decal").
 *
 * notch = { depthIn, widthIn, radiusIn, edge: "bottom" | "right" | "left" | "top" }
 * The notch is always centered on its edge.
 *
 * Everything is worked out in a LOCAL frame where the notch is on the bottom
 * edge, then rotated onto the real edge by mapPoint(). Rotations keep
 * arc directions the same, so arcTo / SVG "A" need no special cases.
 */

function frame(w, h, edge) {
  // lw/lh = local width/height, map(u, v) = local point -> cell point
  switch (edge) {
    case "right":
      return { lw: h, lh: w, map: (u, v) => [v, h - u] };
    case "left":
      return { lw: h, lh: w, map: (u, v) => [w - v, u] };
    case "top":
      return { lw: w, lh: h, map: (u, v) => [w - u, h - v] };
    default: // "bottom"
      return { lw: w, lh: h, map: (u, v) => [u, v] };
  }
}

/** Corner points of the outline (local frame), shared by canvas + SVG. */
function outline(lw, lh, nw, nd, nr, grow) {
  const g = grow;
  const cx = lw / 2;
  const uR = cx + nw / 2 - g; // cavity right wall (shrinks when growing)
  const uL = cx - nw / 2 + g; // cavity left wall
  const vT = lh - nd + g; // cavity ceiling (moves down when growing)
  const r = Math.max(0, Math.min(nr - g, (uR - uL) / 2, lh + g - vT));
  return { g, uR, uL, vT, r, lw, lh };
}

/**
 * Adds the outline to ctx as the current path (does NOT fill/stroke/clip).
 * x, y, w, h  : cell rectangle in canvas px
 * pxPerIn     : pixels per inch (dpi, or canvas.width / preset.wIn)
 * grow        : px to expand the outline (use bleed px). The outer edges move
 *               out and the notch cavity shrinks, so artwork bleeds into it.
 */
export function traceNotchPath(ctx, x, y, w, h, notch, pxPerIn, grow = 0) {
  ctx.beginPath();
  if (!notch) {
    ctx.rect(x - grow, y - grow, w + grow * 2, h + grow * 2);
    return;
  }
  const { lw, lh, map } = frame(w, h, notch.edge);
  const o = outline(
    lw,
    lh,
    notch.widthIn * pxPerIn,
    notch.depthIn * pxPerIn,
    notch.radiusIn * pxPerIn,
    grow
  );
  const P = (u, v) => {
    const [px, py] = map(u, v);
    return [x + px, y + py];
  };
  const mv = (u, v) => ctx.moveTo(...P(u, v));
  const ln = (u, v) => ctx.lineTo(...P(u, v));
  const arc = (u1, v1, u2, v2) => {
    const [a, b] = P(u1, v1);
    const [c, d] = P(u2, v2);
    ctx.arcTo(a, b, c, d, o.r);
  };

  mv(-o.g, -o.g);
  ln(lw + o.g, -o.g);
  ln(lw + o.g, lh + o.g);
  ln(o.uR, lh + o.g);
  ln(o.uR, o.vT + o.r);
  arc(o.uR, o.vT, o.uR - o.r, o.vT);
  ln(o.uL + o.r, o.vT);
  arc(o.uL, o.vT, o.uL, o.vT + o.r);
  ln(o.uL, lh + o.g);
  ln(-o.g, lh + o.g);
  ctx.closePath();
}

/**
 * Makes everything outside the notch shape transparent on a canvas that is
 * exactly one cell. Call it LAST in cropToCanvas (after text overlays).
 * Returns the same canvas.
 */
export function applyNotchMask(canvas, notch, pxPerIn) {
  if (!notch) return canvas;
  const ctx = canvas.getContext("2d");
  ctx.save();
  ctx.globalCompositeOperation = "destination-in";
  ctx.fillStyle = "#000";
  traceNotchPath(ctx, 0, 0, canvas.width, canvas.height, notch, pxPerIn, 0);
  ctx.fill();
  ctx.restore();
  return canvas;
}

/**
 * Draws the real cut line (outer edge + notch) for one cell.
 * style: "dashed" | "solid" | "corner". Corner marks can't describe a notch,
 * so notched stickers draw the full outline for "corner" as well.
 */
export function strokeNotchCutLine(
  ctx,
  x,
  y,
  w,
  h,
  notch,
  pxPerIn,
  { color = "#3d3856", opacity = 1, style = "dashed", lineWidth = 1 } = {}
) {
  ctx.save();
  ctx.globalAlpha = opacity;
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.setLineDash(style === "solid" ? [] : [lineWidth * 6, lineWidth * 4]);
  traceNotchPath(ctx, x, y, w, h, notch, pxPerIn, 0);
  ctx.stroke();
  ctx.restore();
}

/**
 * SVG path (units = inches) for a "CutContour" layer. Same shape as above.
 * grow is in inches (use your bleed).
 */
export function notchSvgPath(wIn, hIn, notch, growIn = 0) {
  if (!notch) {
    const g = growIn;
    return `M ${-g} ${-g} H ${wIn + g} V ${hIn + g} H ${-g} Z`;
  }
  const { lw, lh, map } = frame(wIn, hIn, notch.edge);
  const o = outline(lw, lh, notch.widthIn, notch.depthIn, notch.radiusIn, growIn);
  const P = (u, v) => map(u, v).map((n) => +n.toFixed(4)).join(" ");
  return [
    `M ${P(-o.g, -o.g)}`,
    `L ${P(lw + o.g, -o.g)}`,
    `L ${P(lw + o.g, lh + o.g)}`,
    `L ${P(o.uR, lh + o.g)}`,
    `L ${P(o.uR, o.vT + o.r)}`,
    `A ${o.r} ${o.r} 0 0 0 ${P(o.uR - o.r, o.vT)}`,
    `L ${P(o.uL + o.r, o.vT)}`,
    `A ${o.r} ${o.r} 0 0 0 ${P(o.uL, o.vT + o.r)}`,
    `L ${P(o.uL, lh + o.g)}`,
    `L ${P(-o.g, lh + o.g)}`,
    "Z",
  ].join(" ");
}