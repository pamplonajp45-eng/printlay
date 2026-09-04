/**
 * Per-photo smart crop & frame rendering engine.
 */

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
 * @param {Object} options - { dpi, cropSettings, frameBgColor }
 * @returns {HTMLCanvasElement}
 */
export function cropToCanvas(img, preset, options = {}) {
  const {
    dpi = 300,
    cropSettings = { offsetX: 0, offsetY: 0, zoom: 1, rotate: 0 },
    frameBgColor = "#ffffff",
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

  // Subtle inner border for realistic print look on polaroids
  if (preset.isPolaroid) {
    ctx.save();
    ctx.strokeStyle = "rgba(0, 0, 0, 0.08)";
    ctx.lineWidth = Math.max(1, Math.round(dpi * 0.003));
    ctx.strokeRect(photoX, photoY, photoW, photoH);
    ctx.restore();
  }

  return canvas;
}
