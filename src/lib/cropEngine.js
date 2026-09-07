export const PHOTO_FILTERS = [
  { id: "none", name: "Normal", cssFilter: "none" },
  { id: "bw", name: "B&W", cssFilter: "grayscale(100%) contrast(115%)" },
  { id: "vintage", name: "Vintage", cssFilter: "sepia(45%) contrast(92%) brightness(104%) saturate(85%)" },
  { id: "sepia", name: "Sepia", cssFilter: "sepia(85%) contrast(95%)" },
  { id: "warm", name: "Warm", cssFilter: "sepia(25%) brightness(105%) contrast(105%) saturate(115%)" },
  { id: "cool", name: "Cool", cssFilter: "hue-rotate(170deg) brightness(102%) contrast(105%) saturate(75%)" },
];

export function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = (err) => reject(new Error(`Failed to load image: ${url}`));
    img.src = url;
  });
}

/**
 * Crops an image to a canvas matching target preset dimensions and frame options.
 *
 * @param {HTMLImageElement} img - Loaded image element
 * @param {Object} preset - Photo preset object (from presets.js)
 * @param {Object} options - { dpi, cropSettings, filter, frameBgColor }
 * @returns {HTMLCanvasElement}
 */
export function cropToCanvas(img, preset, options = {}) {
  const {
    dpi = 300,
    cropSettings = { offsetX: 0, offsetY: 0, zoom: 1, rotate: 0 },
    filter = "none",
    filterIntensity = 1,
    frameBgColor = "#ffffff",
    textOverlays = [],
  } = options;

  const targetWpx = Math.round(preset.wIn * dpi);
  const targetHpx = Math.round(preset.hIn * dpi);

  const canvas = document.createElement("canvas");
  canvas.width = targetWpx;
  canvas.height = targetHpx;
  const ctx = canvas.getContext("2d");

  // Draw background (frame color)
  ctx.fillStyle = frameBgColor;
  ctx.fillRect(0, 0, targetWpx, targetHpx);

  // Calculate photo image box bounds inside frame
  let photoX = 0;
  let photoY = 0;
  let photoW = targetWpx;
  let photoH = targetHpx;

  if (preset.isPolaroid && preset.imageArea) {
    const { leftRatio, topRatio, rightRatio, bottomRatio } = preset.imageArea;
    photoX = Math.round(targetWpx * leftRatio);
    photoY = Math.round(targetHpx * topRatio);
    photoW = Math.round(targetWpx * (1 - leftRatio - rightRatio));
    photoH = Math.round(targetHpx * (1 - topRatio - bottomRatio));

    // Border inside polaroid frame
    ctx.strokeStyle = "rgba(0,0,0,0.06)";
    ctx.lineWidth = Math.max(1, Math.round(dpi * 0.005));
    ctx.strokeRect(photoX, photoY, photoW, photoH);
  }

  // Save state for clipping to photo box
  ctx.save();
  ctx.beginPath();
  ctx.rect(photoX, photoY, photoW, photoH);
  ctx.clip();

  const zoom = cropSettings.zoom || 1;
  const offsetX = cropSettings.offsetX || 0; // percentage shift (-0.5 to 0.5)
  const offsetY = cropSettings.offsetY || 0;
  const rotate = cropSettings.rotate || 0;

  const targetRatio = photoW / photoH;
  const is90or270 = rotate === 90 || rotate === 270;

  let sw, sh, sx, sy;

  if (is90or270) {
    // When rotated 90 or 270 deg, effective photo dimensions in frame swap
    const cropImgW = img.height;
    const cropImgH = img.width;
    const srcRatio = cropImgW / cropImgH;

    if (srcRatio >= targetRatio) {
      const cropH = cropImgH / zoom;
      const cropW = cropH * targetRatio;
      sw = Math.min(img.width, cropH);
      sh = Math.min(img.height, cropW);
    } else {
      const cropW = cropImgW / zoom;
      const cropH = cropW / targetRatio;
      sh = Math.min(img.height, cropW);
      sw = Math.min(img.width, cropH);
    }

    sx = (img.width - sw) / 2 + offsetY * (img.width - sw);
    sy = (img.height - sh) / 2 + offsetX * (img.height - sh);
  } else {
    // Unrotated or 180 deg
    const srcRatio = img.width / img.height;

    if (srcRatio >= targetRatio) {
      sh = img.height / zoom;
      sw = sh * targetRatio;
    } else {
      sw = img.width / zoom;
      sh = sw / targetRatio;
    }

    sx = (img.width - sw) / 2 + offsetX * (img.width - sw);
    sy = (img.height - sh) / 2 + offsetY * (img.height - sh);
  }

  // Clamp bounds safely within original image
  sx = Math.max(0, Math.min(img.width - sw, sx));
  sy = Math.max(0, Math.min(img.height - sh, sy));

  // Render to canvas with exact rotation alignment & zero borders
  const centerX = photoX + photoW / 2;
  const centerY = photoY + photoH / 2;

  const validIntensity = typeof filterIntensity === "number" ? Math.max(0, Math.min(1, filterIntensity)) : 1;
  const filterDef = PHOTO_FILTERS.find((f) => f.id === filter);
  const hasFilter = filterDef && filterDef.cssFilter !== "none" && validIntensity > 0;

  const drawPhoto = (applyFilter = false, alpha = 1.0) => {
    ctx.save();
    ctx.globalAlpha = alpha;
    if (applyFilter && filterDef) {
      ctx.filter = filterDef.cssFilter;
    } else {
      ctx.filter = "none";
    }

    if (rotate !== 0) {
      ctx.translate(centerX, centerY);
      ctx.rotate((rotate * Math.PI) / 180);
      if (is90or270) {
        ctx.drawImage(img, sx, sy, sw, sh, -photoH / 2, -photoW / 2, photoH, photoW);
      } else {
        ctx.drawImage(img, sx, sy, sw, sh, -photoW / 2, -photoH / 2, photoW, photoH);
      }
    } else {
      ctx.drawImage(img, sx, sy, sw, sh, photoX, photoY, photoW, photoH);
    }
    ctx.restore();
  };

  if (hasFilter && validIntensity < 1) {
    // Base un-filtered photo
    drawPhoto(false, 1.0);
    // Overlaid filtered photo with opacity blending matching filterIntensity
    drawPhoto(true, validIntensity);
  } else if (hasFilter && validIntensity >= 1) {
    drawPhoto(true, 1.0);
  } else {
    drawPhoto(false, 1.0);
  }

  // Optional Vintage Vignette effect overlay (opacity scales with filterIntensity)
  if (filter === "vintage" && validIntensity > 0) {
    ctx.save();
    ctx.globalAlpha = validIntensity;
    const rx = photoW / 2;
    const ry = photoH / 2;
    const maxR = Math.hypot(rx, ry);
    const vignetteGrad = ctx.createRadialGradient(
      centerX,
      centerY,
      maxR * 0.35,
      centerX,
      centerY,
      maxR * 0.95
    );
    vignetteGrad.addColorStop(0, "rgba(255, 245, 220, 0.04)");
    vignetteGrad.addColorStop(0.65, "rgba(130, 85, 40, 0.07)");
    vignetteGrad.addColorStop(1, "rgba(45, 25, 12, 0.26)");

    ctx.fillStyle = vignetteGrad;
    ctx.fillRect(photoX, photoY, photoW, photoH);
    ctx.restore();
  }

  ctx.restore();

  // Subtle inner border for realistic print look on polaroids
  if (preset.isPolaroid) {
    ctx.save();
    ctx.strokeStyle = "rgba(0, 0, 0, 0.08)";
    ctx.lineWidth = Math.max(1, Math.round(dpi * 0.003));
    ctx.strokeRect(photoX, photoY, photoW, photoH);
    ctx.restore();
  }

  // Render freeform text overlays
  if (textOverlays && textOverlays.length > 0) {
    renderTextOverlays(ctx, textOverlays, targetWpx, targetHpx, dpi);
  }

  return canvas;
}

/**
 * Renders an array of text overlay objects onto the canvas.
 * Text positions are stored as fractions (0–1) of canvas width/height.
 *
 * @param {CanvasRenderingContext2D} ctx
 * @param {Array} overlays - Array of text overlay config objects
 * @param {number} canvasW - Canvas width in pixels
 * @param {number} canvasH - Canvas height in pixels
 * @param {number} dpi - Dots per inch for font size scaling
 */
function renderTextOverlays(ctx, overlays, canvasW, canvasH, dpi) {
  overlays.forEach((overlay) => {
    if (!overlay.text || overlay.text.trim() === "") return;

    const {
      text,
      fontFamily = "Caveat",
      fontSize = 12,         // pt size (1 pt = 1/72 in)
      fontWeight = "700",
      color = "#ffffff",
      align = "center",
      x = 0.5,               // fraction of canvas width
      y = 0.85,              // fraction of canvas height
      shadow = true,
      bgEnabled = false,
      bgColor = "rgba(0,0,0,0.35)",
      bgPadding = 6,
    } = overlay;

    // Scale font from pt to px at the target DPI
    const fontSizePx = Math.round((fontSize / 72) * dpi);

    ctx.save();

    ctx.font = `${fontWeight} ${fontSizePx}px "${fontFamily}", sans-serif`;
    ctx.textAlign = align;
    ctx.textBaseline = "middle";

    const px = canvasW * x;
    const py = canvasH * y;

    const lines = text.split("\n");
    const lineHeight = fontSizePx * 1.3;
    const totalH = lines.length * lineHeight;
    const startY = py - totalH / 2 + lineHeight / 2;

    lines.forEach((line, i) => {
      const ly = startY + i * lineHeight;

      // Optional background pill/badge
      if (bgEnabled) {
        const metrics = ctx.measureText(line);
        const tw = metrics.width;
        const padH = bgPadding * (dpi / 96);
        const padW = padH * 1.6;
        let bx = px - padW;
        if (align === "left") bx = px - padW;
        if (align === "center") bx = px - tw / 2 - padW;
        if (align === "right") bx = px - tw - padW;
        const bw = tw + padW * 2;
        const bh = fontSizePx + padH * 2;
        const br = Math.min(bh / 2, 8 * (dpi / 96));

        ctx.save();
        ctx.fillStyle = bgColor;
        ctx.beginPath();
        ctx.roundRect(bx, ly - bh / 2, bw, bh, br);
        ctx.fill();
        ctx.restore();
      }

      // Drop shadow for readability
      if (shadow) {
        const shadowBlur = Math.max(2, Math.round(dpi * 0.008));
        ctx.shadowColor = "rgba(0,0,0,0.55)";
        ctx.shadowBlur = shadowBlur;
        ctx.shadowOffsetX = Math.round(dpi * 0.002);
        ctx.shadowOffsetY = Math.round(dpi * 0.002);
      } else {
        ctx.shadowColor = "transparent";
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
      }

      ctx.fillStyle = color;
      ctx.fillText(line, px, ly);
    });

    ctx.restore();
  });
}
