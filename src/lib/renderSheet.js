import { shapeToPath2D, polygonBounds } from "./bleedGeometry";
import { A4 } from "./layout";

/**
 * Draws `image` so it covers the box (dx, dy, dw, dh) without distortion.
 * `focus` (0..1) picks which part of the photo survives the crop.
 */
export function drawCover(ctx, image, dx, dy, dw, dh, focus = { x: 0.5, y: 0.5 }) {
  const iw = image.naturalWidth || image.width;
  const ih = image.naturalHeight || image.height;
  if (!iw || !ih) return;
  const scale = Math.max(dw / iw, dh / ih);
  const sw = dw / scale;
  const sh = dh / scale;
  const fx = Math.min(1, Math.max(0, focus.x));
  const fy = Math.min(1, Math.max(0, focus.y));
  ctx.drawImage(image, (iw - sw) * fx, (ih - sh) * fy, sw, sh, dx, dy, dw, dh);
}

function drawWatermark(ctx, shape, watermark, px) {
  const cb = polygonBounds(shape.cutOuter);
  const text = watermark.text;
  const sizeMm = Math.max(2, Math.min(cb.width, cb.height) * 0.07);
  ctx.save();
  ctx.font = `600 ${sizeMm * px}px sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.globalAlpha = watermark.opacity ?? 0.35;
  ctx.fillStyle = "#ffffff";
  ctx.shadowColor = "rgba(0,0,0,0.6)";
  ctx.shadowBlur = 0.4 * px;
  // 60% of the cut width max, centred in the cut box, so it never nears the cut line
  ctx.fillText(text, (cb.minX + cb.width / 2) * px, (cb.minY + cb.height / 2) * px, cb.width * 0.6 * px);
  ctx.restore();
}

function drawSlot(ctx, slot, px, opts) {
  const { shape, image, x, y, rotated, focus, label } = slot;
  const fw = shape.footprint.widthMm;
  const fh = shape.footprint.heightMm;
  const placedH = rotated ? fw : fh;

  ctx.save();
  ctx.translate(x * px, y * px);
  if (rotated) {
    // placed cell is fh wide: move to its right edge, then turn 90 degrees clockwise
    ctx.translate(fh * px, 0);
    ctx.rotate(Math.PI / 2);
  }

  // 1) artwork: clipped to the BLEED shape (evenodd keeps holes open),
  //    cover-fitted to the bleed bounding box, never to the cut box.
  ctx.save();
  ctx.clip(shapeToPath2D(shape, px), "evenodd");
  if (image) {
    drawCover(ctx, image, 0, 0, fw * px, fh * px, focus);
  } else {
    ctx.fillStyle = "#cfcfe6";
    ctx.fillRect(0, 0, fw * px, fh * px);
  }
  if (opts.watermark?.text) drawWatermark(ctx, shape, opts.watermark, px);
  ctx.restore();

  // 2) guides (kept on a separate pass so they can be switched off for print)
  const line = Math.max(1, 0.2 * px);
  if (opts.showBleed) {
    ctx.save();
    ctx.lineWidth = line;
    ctx.setLineDash([line * 3, line * 2]);
    ctx.strokeStyle = "rgba(0,150,255,0.9)";
    ctx.stroke(shapeToPath2D(shape, px));
    ctx.restore();
  }
  if (opts.showCutGuide) {
    ctx.save();
    const g = opts.cutGuide;
    if (g) {
      // The Guides panel's style: same weight and dash as the normal sheets
      ctx.globalAlpha = Math.max(0, Math.min(1, g.opacity ?? 1));
      ctx.strokeStyle = g.color || "#b0b0be";
      ctx.lineWidth = Math.max(1, 0.127 * px);
      ctx.setLineDash(g.style === "dashed" ? [0.508 * px, 0.381 * px] : []);
    } else {
      // Thin, solid hairline (~0.1 mm): one clean edge for the cutter / trace,
      // no dash "teeth" if the blade lands a hair to either side
      ctx.lineWidth = Math.max(1, 0.1 * px);
      ctx.setLineDash([]);
      ctx.strokeStyle = "#ff2d95";
    }
    ctx.stroke(shapeToPath2D({ outer: shape.cutOuter, holes: shape.cutHoles }, px));
    ctx.restore();
  }
  ctx.restore();

  if (label) {
    ctx.save();
    ctx.fillStyle = "#222";
    ctx.font = `${3 * px}px sans-serif`;
    ctx.textBaseline = "top";
    ctx.fillText(label, x * px, (y + placedH + 1.2) * px);
    ctx.restore();
  }
}

/**
 * The page label (tracking / waybill note) for one sheet, or null: the
 * Guides panel's label with that sheet's own text override, when enabled.
 */
export function resolvePageLabel(pageLabel, overrides, sheetIndex) {
  if (!pageLabel) return null;
  const own = overrides?.[sheetIndex] ?? overrides?.[String(sheetIndex)];
  const label = own ? { ...pageLabel, ...own } : pageLabel;
  return label.enabled && label.text?.trim() ? label : null;
}

/**
 * Where the page label goes, in mm, matching the normal sheets: a free X/Y
 * position (fractions of the page) when set, else a corner / edge preset
 * inside the page margin. The text sits ON yMm (bottom baseline).
 */
export function pageLabelPlacement(label, sheet, marginMm) {
  const W = sheet.widthMm;
  const H = sheet.heightMm;
  const fontMm = ((label.fontSize ?? 9) / 72) * 25.4;
  const base = { text: label.text, color: label.color || "#3d3856", fontMm };
  const clamp01 = (n) => Math.max(0, Math.min(1, n));
  if (typeof label.x === "number" && typeof label.y === "number") {
    return { ...base, xMm: clamp01(label.x) * W, yMm: clamp01(label.y) * H, align: "left" };
  }
  const position = label.position || "bottom-right";
  const isTop = position.startsWith("top");
  const align = position.endsWith("center") ? "center" : position.endsWith("right") ? "right" : "left";
  return {
    ...base,
    xMm: align === "center" ? W / 2 : align === "right" ? W - marginMm : marginMm,
    yMm: isTop ? marginMm + fontMm : H - marginMm,
    align,
  };
}

function drawPageLabel(ctx, placement, px) {
  ctx.save();
  ctx.font = `600 ${placement.fontMm * px}px Inter, sans-serif`;
  ctx.fillStyle = placement.color;
  ctx.textAlign = placement.align;
  ctx.textBaseline = "bottom";
  ctx.fillText(placement.text, placement.xMm * px, placement.yMm * px);
  ctx.restore();
}

/**
 * ONE render function for the on-screen preview and every export, so what you
 * see is what prints.
 *
 * slot = { x, y, rotated, shape, image, focus?, label? }
 *   x/y: top-left of the placed cell in mm (from computeLayout / computeFlowLayout)
 *   shape: result of getBleedShape(...)
 *   image: HTMLImageElement | ImageBitmap | canvas
 *
 * options:
 *   dpi          preview ~100, export 300
 *   background   null = transparent (PNG), "#fff" for PDF/print
 *   showCutGuide / showBleed   booleans
 *   cutGuide     { style, color, opacity } from the Guides panel, or null for
 *                the default cutter hairline
 *   pageLabel    a resolved page label (resolvePageLabel) or null
 *   marginMm     page margin, for corner-placed page labels
 *   watermark    { text, opacity } or null (free tier)
 */
export function renderSheet(canvas, {
  sheet = A4, dpi = 300, slots, background = null, showCutGuide = false, showBleed = false,
  cutGuide = null, pageLabel = null, marginMm = 0, watermark = null,
}) {
  const px = dpi / 25.4;
  canvas.width = Math.round(sheet.widthMm * px);
  canvas.height = Math.round(sheet.heightMm * px);
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  if (background) {
    ctx.fillStyle = background;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
  for (const slot of slots) drawSlot(ctx, slot, px, { showCutGuide, showBleed, watermark, cutGuide });
  if (pageLabel) drawPageLabel(ctx, pageLabelPlacement(pageLabel, sheet, marginMm), px);
  return canvas;
}