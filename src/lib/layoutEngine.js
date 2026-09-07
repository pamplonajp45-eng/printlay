/**
 * Sheet Bin-Packing Layout & Cut-Guide Engine
 */

/**
 * Calculates layout dimensions and grid capacity info for UI display.
 */
export function calculateGridInfo(photoPreset, sheetPreset, options = {}) {
  const { dpi = 300, marginIn = 0.3, gutterIn = 0.15 } = options;

  const photoWpx = Math.round(presetWidthIn(photoPreset) * dpi);
  const photoHpx = Math.round(presetHeightIn(photoPreset) * dpi);
  const sheetWpx = Math.round(sheetPreset.wIn * dpi);
  const sheetHpx = Math.round(sheetPreset.hIn * dpi);
  const marginPx = Math.round(marginIn * dpi);
  const gutterPx = Math.round(gutterIn * dpi);

  const cols = Math.max(1, Math.floor((sheetWpx - 2 * marginPx + gutterPx) / (photoWpx + gutterPx)));
  const rows = sheetPreset.isContinuous
    ? 999
    : Math.max(1, Math.floor((sheetHpx - 2 * marginPx + gutterPx) / (photoHpx + gutterPx)));

  const perSheet = cols * rows;

  return {
    cols,
    rows: sheetPreset.isContinuous ? "Auto" : rows,
    perSheet: sheetPreset.isContinuous ? "Unlimited" : perSheet,
    photoWpx,
    photoHpx,
    sheetWpx,
    sheetHpx,
    marginPx,
    gutterPx,
  };
}

function presetWidthIn(preset) {
  return preset.customWidthIn || preset.wIn || 3.0;
}

function presetHeightIn(preset) {
  return preset.customHeightIn || preset.hIn || 4.0;
}

/**
 * Generates array of sheet canvas objects containing laid out photos.
 *
 * @param {Array<HTMLCanvasElement>} croppedCanvases - Array of cropped photo canvases
 * @param {Object} photoPreset
 * @param {Object} sheetPreset
 * @param {Array} photoMetadata - [{ id, name, cropSettings }]
 * @param {Object} options - { dpi, marginIn, gutterIn, showCutGuides, cutGuideStyle, showSequenceLabels, bgColor }
 * @returns {Array<{ canvas: HTMLCanvasElement, sheetIndex: number, totalSheets: number, layoutCells: Array }>}
 */
export function generateSheetCanvases(croppedCanvases, photoPreset, sheetPreset, photoMetadata = [], options = {}) {
  const {
    dpi = 300,
    marginIn = 0.3,
    gutterIn = 0.15,
    showCutGuides = true,
    cutGuideStyle = "dashed",
    showSequenceLabels = false,
    pageLabel = null,
    pageLabelOverrides = {},
    cutGuideColor = "#b0b0be",
    cutGuideOpacity = 1,
    bgColor = "#ffffff",
  } = options;

  if (!croppedCanvases || croppedCanvases.length === 0) {
    return [];
  }

  const photoWpx = Math.round(presetWidthIn(photoPreset) * dpi);
  const photoHpx = Math.round(presetHeightIn(photoPreset) * dpi);
  const sheetWpx = Math.round(sheetPreset.wIn * dpi);
  let sheetHpx = Math.round(sheetPreset.hIn * dpi);

  const marginPx = Math.round(marginIn * dpi);
  const gutterPx = Math.round(gutterIn * dpi);

  const cols = Math.max(1, Math.floor((sheetWpx - 2 * marginPx + gutterPx) / (photoWpx + gutterPx)));

  let rows;
  let perSheet;

  if (sheetPreset.isContinuous) {
    rows = Math.ceil(croppedCanvases.length / cols);
    perSheet = croppedCanvases.length;
    const requiredGridH = rows * photoHpx + (rows - 1) * gutterPx;
    sheetHpx = Math.max(sheetHpx, requiredGridH + 2 * marginPx);
  } else {
    rows = Math.max(1, Math.floor((sheetHpx - 2 * marginPx + gutterPx) / (photoHpx + gutterPx)));
    perSheet = cols * rows;
  }

  // When sequence labels are enabled, reserve a horizontal strip ABOVE each
  // row so the label lives OUTSIDE the cell's cut-guide rectangle (a label
  // inside the cut area would be printed on the photo / lost on the seam).
  // The strip for the first row sits in the top page margin. If the strips
  // don't fit on the sheet, fall back to the legacy inline behaviour.
  const labelFontPx = Math.max(10, Math.round(dpi * 0.035));
  const labelStripH = showSequenceLabels
    ? labelFontPx + Math.round(dpi * 0.012)
    : 0;
  const availH = sheetHpx - 2 * marginPx;
  const gridW = cols * photoWpx + (cols - 1) * gutterPx;
  const gridH = rows * photoHpx + (rows - 1) * gutterPx;
  const useLabelStrips =
    labelStripH > 0 &&
    // (rows - 1) strips BETWEEN rows + 1 strip above the first row (must stay
    // on-sheet inside the top margin for the label to be readable)
    gridH + rows * labelStripH <= availH;
  const rowPitchY = photoHpx + (useLabelStrips ? labelStripH : 0);
  const finalGridH = gridH + (useLabelStrips ? (rows - 1) * labelStripH : 0);
  const offsetX = marginPx + (sheetWpx - 2 * marginPx - gridW) / 2;
  // Reserve one extra strip BELOW the last row: the last row's label is drawn
  // under its cells instead of above (the top strip of row 0 lives in the
  // top page margin, so only rows 1..n-1 need an "above" strip between rows).
  const offsetY =
    marginPx + (availH - finalGridH - (useLabelStrips ? labelStripH : 0)) / 2;

  const totalSheets = Math.ceil(croppedCanvases.length / perSheet);
  const sheets = [];

  for (let s = 0; s < totalSheets; s++) {
    const sheetCanvas = document.createElement("canvas");
    sheetCanvas.width = sheetWpx;
    sheetCanvas.height = sheetHpx;
    const ctx = sheetCanvas.getContext("2d");

    // Sheet background
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, sheetWpx, sheetHpx);

    const sheetSlice = croppedCanvases.slice(s * perSheet, (s + 1) * perSheet);
    const metaSlice = photoMetadata.slice(s * perSheet, (s + 1) * perSheet);
    const layoutCells = [];

    sheetSlice.forEach((croppedCanvas, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const x = Math.round(offsetX + col * (photoWpx + gutterPx));
      const rowStep = photoHpx + gutterPx + (useLabelStrips ? labelStripH : 0);
      const y = Math.round(offsetY + row * rowStep);

      // Draw photo canvas onto sheet
      ctx.drawImage(croppedCanvas, x, y);

      // Store layout cell bounds for interactive drag & click handlers
      layoutCells.push({
        photoId: metaSlice[i]?.id,
        photoItem: metaSlice[i],
        index: s * perSheet + i,
        col,
        row,
        x,
        y,
        w: photoWpx,
        h: photoHpx,
        labelStripH: useLabelStrips ? labelStripH : 0,
      });

      // (Cut guides & sequence labels are drawn in a second pass below so
      // they are never covered by neighbouring photos at zero gutter.)
    });

    // Sequence / file labels are also drawn in a second pass — with zero
    // gutter a label drawn inline sits on the next row's photo and gets
    // painted over (the "first column has no label" bug).
    if (showSequenceLabels) {
      layoutCells.forEach((cell) => {
        const itemNumber = cell.index + 1;
        const photoName =
          metaSlice[cell.row * cols + cell.col]?.name || `#${itemNumber}`;
        drawSequenceLabel(
          ctx,
          cell.x,
          cell.y,
          cell.w,
          cell.h,
          photoName,
          dpi,
          gutterPx,
          cell.col,
          cell.labelStripH || 0,
          cell.row === rows - 1,
        );
      });
    }

    // Cut guides are drawn in a SECOND pass (after every photo is painted) so
    // that with zero gutter the neighbouring photo can never paint over a
    // guide line on a shared edge (the "missing lines at 0 spacing" bug).
    if (showCutGuides && cutGuideStyle !== "none") {
      if (gutterPx === 0 && cutGuideStyle !== "corner") {
        // Zero gutter: cells share edges, so draw the grid as continuous
        // separator lines instead of overlapping per-cell rectangles.
        drawGridSeparators(
          ctx,
          offsetX,
          offsetY,
          cols,
          rows,
          photoWpx,
          photoHpx,
          cutGuideStyle,
          dpi,
          cutGuideColor,
          cutGuideOpacity,
          photoHpx + (useLabelStrips ? labelStripH : 0),
        );
      } else {
        layoutCells.forEach((cell) =>
          drawCutGuides(
            ctx,
            cell.x,
            cell.y,
            cell.w,
            cell.h,
            cutGuideStyle,
            dpi,
            cutGuideColor,
            cutGuideOpacity,
          ),
        );
      }
    }

    // Draw optional page label (e.g. tracking / waybill note) in the margin area.
    // A per-page override (if any) replaces the default text for this sheet only.
    let pageLabelBounds = null;
    let pageLabelText = "";
    const pageOverride = pageLabelOverrides ? pageLabelOverrides[s] : null;
    const resolvedLabel = pageOverride
      ? { ...pageLabel, ...pageOverride }
      : { ...pageLabel };
    if (resolvedLabel && resolvedLabel.enabled && resolvedLabel.text?.trim()) {
      pageLabelBounds = drawPageLabel(ctx, resolvedLabel, sheetWpx, sheetHpx, marginPx, dpi);
      pageLabelText = resolvedLabel.text;
    }

    sheets.push({
      canvas: sheetCanvas,
      sheetIndex: s,
      totalSheets,
      cols,
      rows,
      sheetWpx,
      sheetHpx,
      photosCount: sheetSlice.length,
      layoutCells,
      pageLabelBounds,
      pageLabelText,
    });
  }

  return sheets;
}

/**
 * Draws continuous cut-guide separator lines across a zero-gutter grid where
 * photos butt edge-to-edge. Draws the outer border once plus internal
 * separators between columns/rows, so shared edges always get exactly one
 * clean line (dashed or solid) instead of overlapping per-cell rectangles.
 */
function drawGridSeparators(ctx, x0, y0, cols, rows, w, h, style, dpi, guideColor, guideOpacity, rowStepY = h) {
  ctx.save();
  ctx.globalAlpha = typeof guideOpacity === "number" ? Math.max(0, Math.min(1, guideOpacity)) : 1;
  ctx.strokeStyle = guideColor || "#b0b0be";
  // ~2px at 300dpi — thin enough to look like a guide, thick enough to survive
  // downscaling/JPEG without parts of the line fading in and out
  ctx.lineWidth = Math.max(1, Math.round(dpi * 0.005));

  const dashLen = Math.round(dpi * 0.02);
  const gapLen = Math.round(dpi * 0.015);
  if (style === "dashed") {
    ctx.setLineDash([dashLen, gapLen]);
  } else {
    ctx.setLineDash([]);
  }

  // Photos are placed at Math.round(offsetX/Y + i * pitch), so the guides must
  // be derived from those same ROUNDED positions. Using the raw fractional
  // offsets puts the stroke on a fractional pixel: the 1px line gets
  // antialiased across two pixel rows at ~50% each and effectively disappears
  // (most visibly along the top and bottom edges of the grid).
  const left = Math.round(x0);
  const right = Math.round(x0 + (cols - 1) * w) + Math.round(w);

  if (rowStepY > h) {
    // Label strips sit between rows: rows are separate bands, so draw each
    // row band as its own closed rectangle (the strip gap stays outside all
    // cut guides, leaving room for the sequence labels).
    for (let r = 0; r < rows; r++) {
      const rowTop = Math.round(y0 + r * rowStepY);
      ctx.strokeRect(left - 0.5, rowTop - 0.5, right - left + 1, h + 1);
    }
    // Internal column separators, drawn per row band.
    ctx.beginPath();
    for (let r = 0; r < rows; r++) {
      const rowTop = Math.round(y0 + r * rowStepY);
      const rowBottom = rowTop + h;
      for (let c = 1; c < cols; c++) {
        const px = Math.round(x0 + c * w) + 0.5;
        ctx.moveTo(px, rowTop);
        ctx.lineTo(px, rowBottom);
      }
    }
    ctx.stroke();
  } else {
    const top = Math.round(y0);
    const bottom = Math.round(y0 + (rows - 1) * rowStepY) + Math.round(h);

    // Outer border — snapped to the integer pixel grid (+0.5 => crisp 1px line)
    ctx.strokeRect(
      left - 0.5,
      top - 0.5,
      right - left + 1,
      bottom - top + 1,
    );

    // Internal separators
    ctx.beginPath();
    for (let c = 1; c < cols; c++) {
      const px = Math.round(x0 + c * w) + 0.5;
      ctx.moveTo(px, top);
      ctx.lineTo(px, bottom);
    }
    for (let r = 1; r < rows; r++) {
      const py = Math.round(y0 + r * rowStepY) + 0.5;
      ctx.moveTo(left, py);
      ctx.lineTo(right, py);
    }
    ctx.stroke();
  }

  ctx.restore();
}

/**
 * Draws cut-guide lines or corner marks around a photo cell.
 */
function drawCutGuides(ctx, x, y, w, h, style, dpi, guideColor, guideOpacity) {
  ctx.save();
  ctx.globalAlpha = typeof guideOpacity === "number" ? Math.max(0, Math.min(1, guideOpacity)) : 1;
  ctx.strokeStyle = guideColor || "#b0b0be";
  // ~2px at 300dpi — thin enough to look like a guide, thick enough to survive
  // downscaling/JPEG without parts of the line fading in and out
  ctx.lineWidth = Math.max(1, Math.round(dpi * 0.005));

  const dashLen = Math.round(dpi * 0.02);
  const gapLen = Math.round(dpi * 0.015);
  if (style === "dashed") {
    ctx.setLineDash([dashLen, gapLen]);
    // Phase-align the dash pattern to the cell's absolute position so dashes
    // line up consistently across neighbouring cells in the grid, instead of
    // each cell starting its own phase (patchy / uneven-looking guides)
    const period = dashLen + gapLen;
    ctx.lineDashOffset = -(((x - 0.5) % period) + period) % period;
  } else {
    ctx.setLineDash([]);
  }

  if (style === "dashed") {
    ctx.strokeRect(x - 0.5, y - 0.5, w + 1, h + 1);
  } else if (style === "solid") {
    ctx.setLineDash([]);
    ctx.strokeRect(x - 0.5, y - 0.5, w + 1, h + 1);
  } else if (style === "corner") {
    ctx.setLineDash([]);
    const markLength = Math.round(dpi * 0.08); // ~0.08 in length corner mark

    // Top-Left corner
    ctx.beginPath();
    ctx.moveTo(x - markLength, y);
    ctx.lineTo(x, y);
    ctx.lineTo(x, y - markLength);
    ctx.stroke();

    // Top-Right corner
    ctx.beginPath();
    ctx.moveTo(x + w + markLength, y);
    ctx.lineTo(x + w, y);
    ctx.lineTo(x + w, y - markLength);
    ctx.stroke();

    // Bottom-Left corner
    ctx.beginPath();
    ctx.moveTo(x - markLength, y + h);
    ctx.lineTo(x, y + h);
    ctx.lineTo(x, y + h + markLength);
    ctx.stroke();

    // Bottom-Right corner
    ctx.beginPath();
    ctx.moveTo(x + w + markLength, y + h);
    ctx.lineTo(x + w, y + h);
    ctx.lineTo(x + w, y + h + markLength);
    ctx.stroke();
  }

  ctx.restore();
}

/**
 * Draws the sequence label for a photo cell. When a label strip was reserved
 * ABOVE the row (stripH > 0), the label is drawn inside that strip — entirely
 * OUTSIDE the cell's cut-guide rectangle, so it never touches the photo and
 * never sits on a seam between joined photos at zero spacing. For the first
 * row, the strip lies in the top page margin (also outside the cut guides).
 * If no strip was reserved (legacy fallback), it degrades to the old inline
 * placements.
 */
function drawSequenceLabel(
  ctx,
  x,
  y,
  w,
  h,
  text,
  dpi,
  gutterPx = 1,
  col = 0,
  stripH = 0,
  isLastRow = false,
) {
  ctx.save();
  const fontSize = Math.max(10, Math.round(dpi * 0.035));
  ctx.font = `${fontSize}px Inter, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "top";

  if (stripH > 0) {
    // Preferred: the label lives in a reserved strip OUTSIDE the cut-guide
    // rect, so it never touches the photo and never sits on a seam between
    // joined photos at zero spacing.
    // - every row draws its label in the strip ABOVE the cell (the first
    //   row's strip lies in the top page margin)
    // - the LAST row draws its label in the strip BELOW the cells instead
    const labelPad = Math.max(0, Math.round((stripH - fontSize) / 2));
    const labelY = isLastRow
      ? y + h + Math.max(2, labelPad)
      : y - stripH + labelPad;
    ctx.fillStyle = "#888899";
    ctx.fillText(text, x + w / 2, labelY);
  } else if (gutterPx === 0) {
    // Zero gutter fallback (strips didn't fit): cells share edges, so the
    // bottom of a cell is the TOP of the next row's photo — a label drawn
    // there sits "in the middle" between the joined photos and appears to
    // disappear into the seam. Draw just inside the TOP of its own cell.
    const edgeInset = Math.max(4, Math.round(dpi * 0.012));
    const labelY = y + edgeInset; // just inside the top guide line
    const textW = ctx.measureText(text).width;
    const padX = Math.round(dpi * 0.015);
    ctx.fillStyle = "rgba(255,255,255,0.75)";
    ctx.fillRect(
      x + w / 2 - textW / 2 - padX,
      labelY - 2,
      textW + padX * 2,
      fontSize + 4,
    );
    ctx.fillStyle = "#66627a";
    ctx.fillText(text, x + w / 2, labelY);
  } else {
    ctx.fillStyle = "#888899";
    ctx.fillText(text, x + w / 2, y + h + 2);
  }

  ctx.restore();
}

/**
 * Draws a page-level label (e.g. tracking number / waybill note) into the
 * page margin area. Position can be a corner or centered edge:
 *   bottom-left | bottom-center | bottom-right | top-left | top-center | top-right
 */
function drawPageLabel(ctx, pageLabel, sheetWpx, sheetHpx, marginPx, dpi) {
  const {
    text,
    position = "bottom-right",
    // Free-form adjustable position: 0..1 fraction of the page (X from left,
    // Y from top). When set, overrides the old corner `position` preset.
    x: xFrac,
    y: yFrac,
    fontSize = 9,
    color = "#3d3856",
  } = pageLabel;

  ctx.save();

  const fontSizePx = Math.max(8, Math.round((fontSize / 72) * dpi));
  ctx.font = `600 ${fontSizePx}px Inter, sans-serif`;
  ctx.fillStyle = color;
  ctx.textBaseline = "bottom";

  const hasFreePos =
    typeof xFrac === "number" && typeof yFrac === "number";

  let px;
  let py;
  let isCenter = false;
  let isRight = false;

  if (hasFreePos) {
    const clampedX = Math.max(0, Math.min(1, xFrac));
    const clampedY = Math.max(0, Math.min(1, yFrac));
    px = Math.round(clampedX * sheetWpx);
    py = Math.round(clampedY * sheetHpx);
    ctx.textAlign = "left";
  } else {
    const isTop = position.startsWith("top");
    isCenter = position.endsWith("center");
    isRight = position.endsWith("right");

    ctx.textAlign = isCenter ? "center" : isRight ? "right" : "left";

    px = isCenter
      ? sheetWpx / 2
      : isRight
        ? sheetWpx - marginPx
        : marginPx;
    py = isTop
      ? marginPx + fontSizePx
      : sheetHpx - marginPx;
  }

  ctx.fillText(text, px, py);

  // Compute the bounding box of the drawn text (in canvas px) so the preview
  // can render a clickable/editable overlay on top of it.
  const textW = ctx.measureText(text).width;
  const pad = Math.round(dpi * 0.03);
  const left = hasFreePos
    ? px
    : isCenter
      ? px - textW / 2
      : isRight
        ? px - textW
        : px;
  const top = py - fontSizePx;

  ctx.restore();

  return {
    x: Math.round(left - pad),
    y: Math.round(top - pad),
    w: Math.round(textW + pad * 2),
    h: Math.round(fontSizePx + pad * 2),
  };
}
