// Pure layout helpers. All units are mm. No DOM, no React.

export const A4 = { widthMm: 210, heightMm: 297 };

function gridFit(usableW, usableH, cellW, cellH, gap) {
  if (cellW <= 0 || cellH <= 0 || usableW <= 0 || usableH <= 0) return { cols: 0, rows: 0 };
  const eps = 1e-9;
  const cols = Math.max(0, Math.floor((usableW + gap + eps) / (cellW + gap)));
  const rows = Math.max(0, Math.floor((usableH + gap + eps) / (cellH + gap)));
  return { cols, rows };
}

/**
 * Packs identical items (same footprint) into a grid on one sheet.
 * `footprint` must be the BLEED footprint, so the gap is measured between
 * bleed edges and neighbouring bleeds never overlap.
 *
 * @returns {{ items: Array<{x:number,y:number,w:number,h:number,rotated:boolean}>,
 *             cols:number, rows:number, capacity:number, placed:number, rotated:boolean }}
 *   x/y/w/h describe the PLACED cell (w/h already swapped when rotated).
 */
export function computeLayout({
  sheet = A4,
  footprint,
  gapMm = 1,
  marginMm = 5,
  count = Infinity,
  allowRotate = true,
  center = true,
}) {
  const gap = Math.max(0, gapMm);
  const margin = Math.max(0, marginMm);
  const usableW = sheet.widthMm - 2 * margin;
  const usableH = sheet.heightMm - 2 * margin;
  const fw = footprint.widthMm;
  const fh = footprint.heightMm;

  const upright = gridFit(usableW, usableH, fw, fh, gap);
  const turned = allowRotate ? gridFit(usableW, usableH, fh, fw, gap) : { cols: 0, rows: 0 };
  const rotated = turned.cols * turned.rows > upright.cols * upright.rows;
  const { cols, rows } = rotated ? turned : upright;

  const cellW = rotated ? fh : fw;
  const cellH = rotated ? fw : fh;
  const capacity = cols * rows;
  const placed = Math.max(0, Math.min(count, capacity));

  if (placed === 0) return { items: [], cols, rows, capacity, placed, rotated };

  const usedCols = Math.min(cols, placed);
  const usedRows = Math.ceil(placed / cols);
  const blockW = usedCols * cellW + (usedCols - 1) * gap;
  const blockH = usedRows * cellH + (usedRows - 1) * gap;
  const originX = center ? margin + (usableW - blockW) / 2 : margin;
  const originY = center ? margin + (usableH - blockH) / 2 : margin;

  const items = [];
  for (let i = 0; i < placed; i++) {
    const c = i % cols;
    const r = Math.floor(i / cols);
    items.push({
      x: +(originX + c * (cellW + gap)).toFixed(4),
      y: +(originY + r * (cellH + gap)).toFixed(4),
      w: cellW,
      h: cellH,
      rotated,
    });
  }
  return { items, cols, rows, capacity, placed, rotated };
}

/**
 * Shelf/flow layout for boxes of different sizes (used by the calibration sheet).
 * @param {Array<{w:number,h:number}>} boxes
 * @returns {{ positions: Array<{x:number,y:number}|null>, overflow: number }}
 */
export function computeFlowLayout({ sheet = A4, boxes, gapMm = 6, marginMm = 8 }) {
  const usableW = sheet.widthMm - 2 * marginMm;
  const bottom = sheet.heightMm - marginMm;
  let x = marginMm;
  let y = marginMm;
  let rowH = 0;
  let overflow = 0;
  const positions = [];
  for (const b of boxes) {
    if (x > marginMm && x + b.w > marginMm + usableW + 1e-9) {
      x = marginMm;
      y += rowH + gapMm;
      rowH = 0;
    }
    if (y + b.h > bottom + 1e-9 || b.w > usableW + 1e-9) {
      positions.push(null);
      overflow++;
      continue;
    }
    positions.push({ x: +x.toFixed(4), y: +y.toFixed(4) });
    x += b.w + gapMm;
    rowH = Math.max(rowH, b.h);
  }
  return { positions, overflow };
}

/** How many items go on each sheet, e.g. 25 photos at capacity 10 -> [10, 10, 5]. */
export function pageCounts(total, capacity) {
  if (capacity <= 0 || total <= 0) return [];
  const pages = [];
  let left = total;
  while (left > 0) {
    pages.push(Math.min(capacity, left));
    left -= capacity;
  }
  return pages;
}
/**
 * Packs items of DIFFERENT sizes onto as many sheets as needed (shelf packing).
 * Items with the same `key` are kept together and each row holds one size only,
 * so cut lines stay tidy. Groups keep the order their first item appears in.
 * Unit-agnostic: pass mm (bleed layout) or px (sheet canvases) consistently.
 *
 * @param {Object} opts
 * @param {number} opts.sheetW
 * @param {number} opts.sheetH - Infinity for a continuous roll (one page)
 * @param {number} opts.margin
 * @param {number} opts.gap - space between items and between rows
 * @param {Array<{w:number,h:number,key:string}>} opts.items
 * @param {number} [opts.rowExtra=0] - extra space under every row (e.g. labels)
 * @param {boolean} [opts.center=true] - center each row and the block of rows
 * @param {boolean} [opts.allowRotate=false] - turn a size 90° when that fits more per row
 * @returns {{ pages: Array<Array<{index:number,x:number,y:number,w:number,h:number,row:number,rotated:boolean}>>, oversize: number[] }}
 *   w/h are the PLACED size (swapped when rotated).
 *   `oversize`: indices that are bigger than the usable area (still placed, alone on a row).
 */
export function packShelves({ sheetW, sheetH, margin = 0, gap = 0, items, rowExtra = 0, center = true, allowRotate = false }) {
  const usableW = sheetW - 2 * margin;
  const usableH = sheetH - 2 * margin;
  const eps = 1e-9;

  // Group by key, groups in first-appearance order, items keep their order
  const groups = new Map();
  items.forEach((it, index) => {
    if (!groups.has(it.key)) groups.set(it.key, []);
    groups.get(it.key).push(index);
  });

  // Per size: turn it 90° when that fits more per row (and still fits the page)
  const perRow = (w) => Math.floor((usableW + gap + eps) / (w + gap));
  const placedSize = new Map();
  for (const [key, indices] of groups) {
    const { w, h } = items[indices[0]];
    const turn = allowRotate && perRow(h) > perRow(w) && w <= usableH + eps;
    placedSize.set(key, turn ? { w: h, h: w, rotated: true } : { w, h, rotated: false });
  }

  // Build rows: one size per row, wrap when the row is full
  const rows = [];
  for (const [key, indices] of groups) {
    const size = placedSize.get(key);
    let row = null;
    for (const index of indices) {
      if (!row || row.width + gap + size.w > usableW + eps) {
        row = { indices: [], width: -gap, height: size.h, size };
        rows.push(row);
      }
      row.indices.push(index);
      row.width += gap + size.w;
    }
  }

  // Stack rows onto pages
  const pages = [];
  let page = null;
  for (const row of rows) {
    const need = row.height + rowExtra;
    if (!page || (page.rows.length > 0 && page.height + gap + need > usableH + eps)) {
      page = { rows: [], height: -gap };
      pages.push(page);
    }
    page.rows.push(row);
    page.height += gap + need;
  }

  const oversize = [];
  const out = pages.map((pg) => {
    const placed = [];
    let y = margin + (center && Number.isFinite(usableH) ? Math.max(0, (usableH - pg.height) / 2) : 0);
    pg.rows.forEach((row, r) => {
      let x = margin + (center ? Math.max(0, (usableW - row.width) / 2) : 0);
      const { w, h, rotated } = row.size;
      for (const index of row.indices) {
        if (w > usableW + eps || h > usableH + eps) oversize.push(index);
        placed.push({ index, x: +x.toFixed(4), y: +y.toFixed(4), w, h, row: r, rotated });
        x += w + gap;
      }
      y += row.height + rowExtra + gap;
    });
    return placed;
  });

  return { pages: out, oversize };
}

/**
 * Same-size slots for items of DIFFERENT sizes: every item gets a cell the size
 * of the largest item and sits centered in it, so every page has the same grid
 * (e.g. 4 name tags per A4 regardless of V2-V4 / V5 / V6). Items keep their order.
 * The full grid is centered (not just the used part), so positions match page to page.
 *
 * @param {Object} opts - like packShelves: sheetW, sheetH (Infinity = one long page),
 *   margin, gap, items [{w,h}], rowExtra, allowRotate (turn the whole grid 90° if more fit)
 * @returns {{ pages: Array<Array<{index,x,y,w,h,row,rotated}>>, perPage: number, oversize: number[] }}
 */
export function packUniformGrid({ sheetW, sheetH, margin = 0, gap = 0, items, rowExtra = 0, allowRotate = false }) {
  if (!items.length) return { pages: [], perPage: 0, oversize: [] };
  const usableW = sheetW - 2 * margin;
  const usableH = sheetH - 2 * margin;
  const eps = 1e-9;
  const maxW = Math.max(...items.map((it) => it.w));
  const maxH = Math.max(...items.map((it) => it.h));
  const fit = (cw, ch) => ({
    cols: Math.max(0, Math.floor((usableW + gap + eps) / (cw + gap))),
    rows: Number.isFinite(usableH) ? Math.max(0, Math.floor((usableH + gap + eps) / (ch + rowExtra + gap))) : Infinity,
  });
  const up = fit(maxW, maxH);
  const turned = allowRotate ? fit(maxH, maxW) : { cols: 0, rows: 0 };
  const rotated = turned.cols * turned.rows > up.cols * up.rows;
  let { cols, rows } = rotated ? turned : up;
  const cellW = rotated ? maxH : maxW;
  const cellH = rotated ? maxW : maxH;

  // Larger than the page: one item per page at the margin, flagged
  const oversize = [];
  if (cols < 1 || rows < 1) {
    cols = 1;
    rows = 1;
    items.forEach((_, i) => oversize.push(i));
  }
  const perPage = Number.isFinite(rows) ? cols * rows : items.length;
  const usedRows = Number.isFinite(rows) ? rows : Math.ceil(items.length / cols);
  const gridW = cols * cellW + (cols - 1) * gap;
  const gridH = usedRows * (cellH + rowExtra) + (usedRows - 1) * gap;
  const x0 = margin + Math.max(0, (usableW - gridW) / 2);
  const y0 = margin + (Number.isFinite(usableH) ? Math.max(0, (usableH - gridH) / 2) : 0);

  const pages = [];
  items.forEach((it, index) => {
    const k = index % perPage;
    if (k === 0) pages.push([]);
    const col = k % cols;
    const row = Math.floor(k / cols);
    const w = rotated ? it.h : it.w;
    const h = rotated ? it.w : it.h;
    pages[pages.length - 1].push({
      index,
      x: +(x0 + col * (cellW + gap) + (cellW - w) / 2).toFixed(4),
      y: +(y0 + row * (cellH + rowExtra + gap) + (cellH - h) / 2).toFixed(4),
      w,
      h,
      row,
      rotated,
    });
  });
  return { pages, perPage, oversize };
}
