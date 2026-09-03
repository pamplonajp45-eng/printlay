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
 * @param {Array} photoMetadata - [{ id, name }]
 * @param {Object} options - { dpi, marginIn, gutterIn, showCutGuides, cutGuideStyle, showSequenceLabels, bgColor }
 * @returns {Array<{ canvas: HTMLCanvasElement, sheetIndex: number, totalSheets: number }>}
 */
export function generateSheetCanvases(croppedCanvases, photoPreset, sheetPreset, photoMetadata = [], options = {}) {
  const {
    dpi = 300,
    marginIn = 0.3,
    gutterIn = 0.15,
    showCutGuides = true,
    cutGuideStyle = "dashed",
    showSequenceLabels = false,
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

  const gridW = cols * photoWpx + (cols - 1) * gutterPx;
  const gridH = rows * photoHpx + (rows - 1) * gutterPx;
  const offsetX = marginPx + (sheetWpx - 2 * marginPx - gridW) / 2;
  const offsetY = marginPx + (sheetHpx - 2 * marginPx - gridH) / 2;

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

    sheetSlice.forEach((croppedCanvas, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const x = Math.round(offsetX + col * (photoWpx + gutterPx));
      const y = Math.round(offsetY + row * (photoHpx + gutterPx));

      // Draw photo canvas onto sheet
      ctx.drawImage(croppedCanvas, x, y);

      // Draw cut guides if enabled
      if (showCutGuides && cutGuideStyle !== "none") {
        drawCutGuides(ctx, x, y, photoWpx, photoHpx, cutGuideStyle, dpi);
      }

      // Draw optional sequence / file label under photo cell
      if (showSequenceLabels) {
        const itemNumber = s * perSheet + i + 1;
        const photoName = metaSlice[i]?.name || `#${itemNumber}`;
        drawSequenceLabel(ctx, x, y, photoWpx, photoHpx, photoName, dpi);
      }
    });

    sheets.push({
      canvas: sheetCanvas,
      sheetIndex: s,
      totalSheets,
      cols,
      rows,
      photosCount: sheetSlice.length,
    });
  }

  return sheets;
}

/**
 * Draws cut-guide lines or corner marks around a photo cell.
 */
function drawCutGuides(ctx, x, y, w, h, style, dpi) {
  ctx.save();
  ctx.strokeStyle = "#b0b0be";
  ctx.lineWidth = Math.max(1, Math.round(dpi * 0.003)); // ~1px at 300dpi

  if (style === "dashed") {
    ctx.setLineDash([Math.round(dpi * 0.02), Math.round(dpi * 0.015)]);
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
 * Draws text label below photo cell.
 */
function drawSequenceLabel(ctx, x, y, w, h, text, dpi) {
  ctx.save();
  const fontSize = Math.max(10, Math.round(dpi * 0.035));
  ctx.font = `${fontSize}px Inter, sans-serif`;
  ctx.fillStyle = "#888899";
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.fillText(text, x + w / 2, y + h + 2);
  ctx.restore();
}
