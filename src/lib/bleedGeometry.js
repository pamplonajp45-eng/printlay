import ClipperLibModule from "clipper-lib";

const ClipperLib = ClipperLibModule.default || ClipperLibModule;

export const CLIPPER_SCALE = 10000; // 10,000 units = 1 mm (0.1 micron precision)

export const DEFAULT_BLEED_MM = 1.5;
export const MIN_BLEED_MM = 0.0;
export const MAX_BLEED_MM = 3.0;
export const BLEED_STEP_MM = 0.25;

export const DEFAULT_CUT_INSET_MM = 0.0;
export const MAX_CUT_INSET_MM = 0.5;
export const CUT_INSET_STEP_MM = 0.05;

export const DEFAULT_MIN_GAP_MM = 1.0;

/**
 * Computes signed area of a 2D polygon.
 * Positive in Cartesian coordinates means counter-clockwise.
 */
export function polygonArea(points) {
  if (!points || points.length < 3) return 0;
  let area = 0;
  for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
    area += (points[j].x + points[i].x) * (points[j].y - points[i].y);
  }
  return area / 2;
}

/**
 * Computes bounding box for an array of 2D points.
 */
export function polygonBounds(points) {
  if (!points || points.length === 0) {
    return { minX: 0, maxX: 0, minY: 0, maxY: 0, width: 0, height: 0 };
  }
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  for (const pt of points) {
    if (pt.x < minX) minX = pt.x;
    if (pt.x > maxX) maxX = pt.x;
    if (pt.y < minY) minY = pt.y;
    if (pt.y > maxY) maxY = pt.y;
  }
  return {
    minX,
    maxX,
    minY,
    maxY,
    width: maxX - minX,
    height: maxY - minY,
  };
}

/**
 * Offsets a closed 2D polygon by `offsetMm` using Clipper.
 * - Positive `offsetMm`: expands outward.
 * - Negative `offsetMm`: shrinks inward.
 * - Uses ClipperLib.JoinType.jtRound for smooth corner joins.
 *
 * @param {Array<{x: number, y: number}>} points - Polygon vertices in mm
 * @param {number} offsetMm - Offset distance in mm
 * @param {Object} [options]
 * @returns {Array<{x: number, y: number}>} - Offset polygon vertices in mm
 */
export function offsetPath(points, offsetMm, options = {}) {
  if (!points || points.length < 3) return points ? [...points] : [];
  if (Math.abs(offsetMm) < 1e-6) {
    return points.map((p) => ({ x: +p.x.toFixed(4), y: +p.y.toFixed(4) }));
  }

  const joinType = options.joinType !== undefined ? options.joinType : ClipperLib.JoinType.jtRound;
  const endType = options.endType !== undefined ? options.endType : ClipperLib.EndType.etClosedPolygon;
  const miterLimit = options.miterLimit || 2;

  // Convert to Clipper integer format
  let clipperPath = points.map((p) => ({
    X: Math.round(p.x * CLIPPER_SCALE),
    Y: Math.round(p.y * CLIPPER_SCALE),
  }));

  // Ensure consistent orientation: positive (CCW in Cartesian, CW in Y-down screen)
  if (!ClipperLib.Clipper.Orientation(clipperPath)) {
    clipperPath.reverse();
  }

  const co = new ClipperLib.ClipperOffset(miterLimit, 0.25 * (CLIPPER_SCALE / 1000));
  co.AddPath(clipperPath, joinType, endType);

  const solution = new ClipperLib.Paths();
  co.Execute(solution, offsetMm * CLIPPER_SCALE);

  if (!solution || solution.length === 0) {
    return [];
  }

  // Pick largest polygon in case of tiny artifacts
  let bestIdx = 0;
  let maxArea = -1;
  for (let i = 0; i < solution.length; i++) {
    const area = Math.abs(ClipperLib.Clipper.Area(solution[i]));
    if (area > maxArea) {
      maxArea = area;
      bestIdx = i;
    }
  }

  const resultPath = solution[bestIdx];
  return resultPath.map((pt) => ({
    x: +(pt.X / CLIPPER_SCALE).toFixed(4),
    y: +(pt.Y / CLIPPER_SCALE).toFixed(4),
  }));
}

/**
 * Samples points along a circular arc.
 */
export function sampleArc(cx, cy, r, startAngle, endAngle, numSegments = 8) {
  const points = [];
  const count = Math.max(2, numSegments);
  for (let i = 0; i <= count; i++) {
    const theta = startAngle + (endAngle - startAngle) * (i / count);
    points.push({
      x: +(cx + r * Math.cos(theta)).toFixed(4),
      y: +(cy + r * Math.sin(theta)).toFixed(4),
    });
  }
  return points;
}

/**
 * Generates polygon vertices for a rectangle or rounded rectangle in mm.
 */
export function buildRoundedRectPolygon(w, h, r = 0, numSegments = 8) {
  const cornerR = Math.max(0, Math.min(r, w / 2, h / 2));
  if (cornerR <= 0.001) {
    return [
      { x: 0, y: 0 },
      { x: w, y: 0 },
      { x: w, y: h },
      { x: 0, y: h },
    ];
  }

  const pts = [];
  // Top edge
  pts.push({ x: cornerR, y: 0 });
  pts.push({ x: w - cornerR, y: 0 });
  // Top-Right arc (center: w - cornerR, cornerR; angle: -PI/2 to 0)
  pts.push(...sampleArc(w - cornerR, cornerR, cornerR, -Math.PI / 2, 0, numSegments).slice(1));
  // Right edge
  pts.push({ x: w, y: h - cornerR });
  // Bottom-Right arc (center: w - cornerR, h - cornerR; angle: 0 to PI/2)
  pts.push(...sampleArc(w - cornerR, h - cornerR, cornerR, 0, Math.PI / 2, numSegments).slice(1));
  // Bottom edge
  pts.push({ x: cornerR, y: h });
  // Bottom-Left arc (center: cornerR, h - cornerR; angle: PI/2 to PI)
  pts.push(...sampleArc(cornerR, h - cornerR, cornerR, Math.PI / 2, Math.PI, numSegments).slice(1));
  // Left edge
  pts.push({ x: 0, y: cornerR });
  // Top-Left arc (center: cornerR, cornerR; angle: PI to 3*PI/2)
  pts.push(...sampleArc(cornerR, cornerR, cornerR, Math.PI, (3 * Math.PI) / 2, numSegments).slice(1));

  return pts;
}

/**
 * Generates polygon vertices for an ellipse / circle touching [0, 0, w, h] in mm.
 */
export function buildEllipsePolygon(w, h, numSegments = 48) {
  const rx = w / 2;
  const ry = h / 2;
  const cx = rx;
  const cy = ry;
  const pts = [];
  for (let i = 0; i < numSegments; i++) {
    const theta = (i / numSegments) * 2 * Math.PI;
    pts.push({
      x: +(cx + rx * Math.cos(theta)).toFixed(4),
      y: +(cy + ry * Math.sin(theta)).toFixed(4),
    });
  }
  return pts;
}

/**
 * Builds polygon vertices for a rectangle with an indented notch on one edge in mm.
 */
export function buildNotchPolygon(w, h, notch, numSegments = 8) {
  const edge = notch?.edge || "bottom";
  const depth = notch?.depthMm || (notch?.depthIn ? notch.depthIn * 25.4 : 19.888);
  const width = notch?.widthMm || (notch?.widthIn ? notch.widthIn * 25.4 : 32.131);
  const radius = notch?.radiusMm || (notch?.radiusIn ? notch.radiusIn * 25.4 : 3.378);

  // Work in local frame where notch is on the bottom edge
  let lw = w;
  let lh = h;
  if (edge === "right" || edge === "left") {
    lw = h;
    lh = w;
  }

  const cx = lw / 2;
  const uR = cx + width / 2;
  const uL = cx - width / 2;
  const vT = lh - depth;
  const r = Math.max(0, Math.min(radius, (uR - uL) / 2, depth));

  const localPts = [];
  // Top-left
  localPts.push({ u: 0, v: 0 });
  // Top-right
  localPts.push({ u: lw, v: 0 });
  // Bottom-right
  localPts.push({ u: lw, v: lh });
  // Right cavity mouth
  localPts.push({ u: uR, v: lh });
  // Right wall up to right arc
  localPts.push({ u: uR, v: vT + r });
  // Arc at top-right of cavity (center: uR - r, vT + r, angle: 0 to -PI/2)
  if (r > 0.01) {
    const arcRight = sampleArc(uR - r, vT + r, r, 0, -Math.PI / 2, numSegments);
    localPts.push(...arcRight.map((p) => ({ u: p.x, v: p.y })).slice(1));
  }
  // Ceiling
  localPts.push({ u: uL + r, v: vT });
  // Arc at top-left of cavity (center: uL + r, vT + r, angle: -PI/2 to -PI)
  if (r > 0.01) {
    const arcLeft = sampleArc(uL + r, vT + r, r, -Math.PI / 2, -Math.PI, numSegments);
    localPts.push(...arcLeft.map((p) => ({ u: p.x, v: p.y })).slice(1));
  }
  // Left wall down to bottom
  localPts.push({ u: uL, v: lh });
  // Bottom-left
  localPts.push({ u: 0, v: lh });

  // Map local frame (u, v) to cell frame (x, y)
  const mapPoint = (u, v) => {
    switch (edge) {
      case "right":
        return { x: +(v).toFixed(4), y: +(h - u).toFixed(4) };
      case "left":
        return { x: +(w - v).toFixed(4), y: +(u).toFixed(4) };
      case "top":
        return { x: +(w - u).toFixed(4), y: +(h - v).toFixed(4) };
      default: // "bottom"
        return { x: +(u).toFixed(4), y: +(v).toFixed(4) };
    }
  };

  return localPts.map((p) => mapPoint(p.u, p.v));
}

/**
 * Builds polygon vertices for the BLCK V5 / V6 die-cut outline in mm.
 */
export function buildV5V6Polygon(wMm = 126.492, hMm = 84.633) {
  // Dimensions converted from inch specs:
  // r = 0.13 in -> 3.302 mm
  // shoulderY = 0.19 in -> 4.826 mm
  // sideTab = 0.866 in -> 21.996 mm
  // centerL = 1.794 in -> 45.568 mm
  // dipX = 1.33 in -> 33.782 mm
  // halfChord = 0.17 in -> 4.318 mm
  // depth = 0.09 in -> 2.286 mm
  const r = 3.302;
  const shoulderY = 4.826;
  const sideTab = 21.996;
  const centerL = 45.568;
  const centerR = wMm - centerL;
  const dipX = 33.782;
  const halfChord = 4.318;
  const depth = 2.286;
  const R = (halfChord ** 2 + depth ** 2) / (2 * depth);

  const d1L = dipX - halfChord;
  const d1R = dipX + halfChord;
  const d2L = wMm - dipX - halfChord;
  const d2R = wMm - dipX + halfChord;
  const rightTab = wMm - sideTab;

  const pts = [];
  // Top-left origin
  pts.push({ x: 0, y: 0 });
  // Left tab top edge to arc
  pts.push({ x: sideTab - r, y: 0 });
  pts.push(...sampleArc(sideTab - r, r, r, -Math.PI / 2, 0, 6).slice(1));
  // Drop to shoulder
  pts.push({ x: sideTab, y: shoulderY });
  // Left shoulder line to dip
  pts.push({ x: d1L, y: shoulderY });
  // First dip circular arc
  // Circle center for dip: (dipX, shoulderY - (R - depth))
  const dipCenterY = shoulderY - (R - depth);
  const dipAlpha = Math.atan2(depth, halfChord) * 2;
  pts.push(...sampleArc(dipX, dipCenterY, R, Math.PI / 2 - dipAlpha / 2, Math.PI / 2 + dipAlpha / 2, 8).slice(1));
  pts.push({ x: d1R, y: shoulderY });
  // To center tab
  pts.push({ x: centerL, y: shoulderY });
  pts.push({ x: centerL, y: r });
  pts.push(...sampleArc(centerL + r, r, r, Math.PI, (3 * Math.PI) / 2, 6).slice(1));
  // Center tab top edge
  pts.push({ x: centerR - r, y: 0 });
  pts.push(...sampleArc(centerR - r, r, r, -Math.PI / 2, 0, 6).slice(1));
  // Drop to right shoulder
  pts.push({ x: centerR, y: shoulderY });
  pts.push({ x: d2L, y: shoulderY });
  // Second dip arc
  const dip2CenterY = shoulderY - (R - depth);
  pts.push(...sampleArc(wMm - dipX, dip2CenterY, R, Math.PI / 2 - dipAlpha / 2, Math.PI / 2 + dipAlpha / 2, 8).slice(1));
  pts.push({ x: d2R, y: shoulderY });
  // To right tab
  pts.push({ x: rightTab, y: shoulderY });
  pts.push({ x: rightTab, y: r });
  pts.push(...sampleArc(rightTab + r, r, r, Math.PI, (3 * Math.PI) / 2, 6).slice(1));
  // Top-right
  pts.push({ x: wMm, y: 0 });
  // Bottom-right
  pts.push({ x: wMm, y: hMm });
  // Bottom-left
  pts.push({ x: 0, y: hMm });

  return pts;
}

/**
 * Resolves width and height of a preset in millimeters.
 */
export function getPresetDimensionsMm(preset) {
  if (!preset) return { widthMm: 76.2, heightMm: 101.6 };

  let widthMm = preset.wMm;
  let heightMm = preset.hMm;

  if (!widthMm) {
    const wIn = preset.customWidthIn || preset.wIn || (preset.wCm ? preset.wCm / 2.54 : 3.0);
    widthMm = +(wIn * 25.4).toFixed(3);
  }
  if (!heightMm) {
    const hIn = preset.customHeightIn || preset.hIn || (preset.hCm ? preset.hCm / 2.54 : 4.0);
    heightMm = +(hIn * 25.4).toFixed(3);
  }

  return { widthMm, heightMm };
}

/**
 * Builds the exact cut polygon (outer boundary + enclosed hole boundaries) in mm.
 * If `cutInsetMm > 0`, the cut path is shrunk slightly inward.
 *
 * @param {Object} preset - Photo preset
 * @param {number} [cutInsetMm=0] - Optional inward cut inset in mm
 * @returns {{ outer: Array<{x: number, y: number}>, holes: Array<Array<{x: number, y: number}>> }}
 */
export function getPresetCutPolygon(preset, cutInsetMm = 0) {
  const { widthMm, heightMm } = getPresetDimensionsMm(preset);
  let outer;
  const holes = [];

  const shape = preset?.shape;
  const isCircle = shape === "circle";
  const isRounded = shape === "rounded";
  const isDieCut = preset?.hasDieCutContour && widthMm >= heightMm;
  const hasNotch = Boolean(preset?.notch);

  if (isCircle) {
    outer = buildEllipsePolygon(widthMm, heightMm);
  } else if (isDieCut) {
    outer = buildV5V6Polygon(widthMm, heightMm);
  } else if (hasNotch) {
    outer = buildNotchPolygon(widthMm, heightMm, preset.notch);
  } else if (isRounded) {
    const rMm = preset.cornerRadiusMm || (preset.cornerRadiusIn ? preset.cornerRadiusIn * 25.4 : 3.18);
    outer = buildRoundedRectPolygon(widthMm, heightMm, rMm);
  } else {
    outer = buildRoundedRectPolygon(widthMm, heightMm, 0);
  }

  // Enclosed holes (e.g. ATM chip window, BLCK V5/V6 window)
  if (preset?.hole) {
    const h = preset.hole;
    const hx = h.xMm !== undefined ? h.xMm : (h.xIn || 0) * 25.4;
    const hy = h.yMm !== undefined ? h.yMm : (h.yIn || 0) * 25.4;
    const hw = h.widthMm !== undefined ? h.widthMm : (h.widthIn || 0) * 25.4;
    const hh = h.heightMm !== undefined ? h.heightMm : (h.heightIn || 0) * 25.4;
    const hr = h.radiusMm !== undefined ? h.radiusMm : (h.radiusIn || 0) * 25.4;

    const holePoly = buildRoundedRectPolygon(hw, hh, hr).map((p) => ({
      x: +(p.x + hx).toFixed(4),
      y: +(p.y + hy).toFixed(4),
    }));
    holes.push(holePoly);
  }

  // Apply cut inset if requested: moves the cut line inward into the ink
  if (cutInsetMm > 0.001) {
    outer = offsetPath(outer, -cutInsetMm);
    // Holes GROW with the inset: the blade moves into the ink and opens the hole
    for (let i = 0; i < holes.length; i++) {
      holes[i] = offsetPath(holes[i], +cutInsetMm);
    }
  }

  return { outer, holes };
}

/**
 * The preset's outer shape WITHOUT notch, window or die-cut tabs (mm):
 * ellipse, rounded rect or rect. Used when cut-outs print with the photo.
 */
export function getPresetFillPolygon(preset) {
  const { widthMm, heightMm } = getPresetDimensionsMm(preset);
  if (preset?.shape === "circle") return buildEllipsePolygon(widthMm, heightMm);
  if (preset?.shape === "rounded") {
    const rMm = preset.cornerRadiusMm || (preset.cornerRadiusIn ? preset.cornerRadiusIn * 25.4 : 3.18);
    return buildRoundedRectPolygon(widthMm, heightMm, rMm);
  }
  return buildRoundedRectPolygon(widthMm, heightMm, 0);
}

/**
 * Calculates item footprint including bleed in mm and inches.
 *
 * @param {Object} preset
 * @param {number} [bleedMm=1.5]
 * @returns {{ widthMm: number, heightMm: number, widthIn: number, heightIn: number, aspectRatio: number }}
 */
export function getFootprint(preset, bleedMm = DEFAULT_BLEED_MM) {
  const { widthMm: cutW, heightMm: cutH } = getPresetDimensionsMm(preset);
  const b = Math.max(0, bleedMm);
  const widthMm = +(cutW + 2 * b).toFixed(3);
  const heightMm = +(cutH + 2 * b).toFixed(3);
  return {
    widthMm,
    heightMm,
    widthIn: +(widthMm / 25.4).toFixed(4),
    heightIn: +(heightMm / 25.4).toFixed(4),
    aspectRatio: widthMm / heightMm,
  };
}

/**
 * Builds the complete bleed shape:
 * - Outer boundary expanded outward by `bleedMm` from the NOMINAL outline
 *   (footprint = nominal + 2*bleed).
 * - The cut line is the nominal outline moved `cutInsetMm` into the ink
 *   (outer shrinks, holes grow).
 * - Bleed hole = nominal hole shrunk by the bleed, so ink extends into the hole.
 * - All coordinates normalized relative to [0, 0] of the footprint cell.
 * - options.fillCutouts: the ARTWORK (bleed path) ignores the notch, the
 *   enclosed window and the V5/V6 die-cut tabs, so the photo prints right
 *   through them. The cut path still follows them exactly.
 *
 * @param {Object} preset
 * @param {number} [bleedMm=1.5]
 * @param {number} [cutInsetMm=0]
 * @param {{ fillCutouts?: boolean }} [options]
 * @returns {Object}
 */
export function getBleedShape(preset, bleedMm = DEFAULT_BLEED_MM, cutInsetMm = 0, options = {}) {
  const b = Math.max(0, bleedMm);
  const inset = Math.max(0, cutInsetMm);
  const fill = Boolean(options.fillCutouts);

  const nominal = getPresetCutPolygon(preset, 0);
  const cut = inset > 0.001 ? getPresetCutPolygon(preset, inset) : nominal;
  const { widthMm: cutW, heightMm: cutH } = getPresetDimensionsMm(preset);

  // Artwork outline: the cut outline, or (fillCutouts) the plain outer shape
  const artOuter = fill ? getPresetFillPolygon(preset) : nominal.outer;
  const bleedOuter = b > 0.001 ? offsetPath(artOuter, b) : artOuter;
  const bounds = polygonBounds(bleedOuter);
  const shiftX = -bounds.minX;
  const shiftY = -bounds.minY;
  const shift = (poly) =>
    poly.map((p) => ({ x: +(p.x + shiftX).toFixed(4), y: +(p.y + shiftY).toFixed(4) }));

  const bleedHoles = [];
  for (const hole of fill ? [] : nominal.holes) {
    const h = b > 0.001 ? offsetPath(hole, -b) : hole;
    if (h && h.length >= 3 && Math.abs(polygonArea(h)) > 0.1) bleedHoles.push(shift(h));
  }

  const footprintW = bounds.width > 0 ? bounds.width : cutW + 2 * b;
  const footprintH = bounds.height > 0 ? bounds.height : cutH + 2 * b;

  return {
    bleedMm: b,
    cutInsetMm: inset,
    fillCutouts: fill,
    footprint: {
      widthMm: +footprintW.toFixed(3),
      heightMm: +footprintH.toFixed(3),
      widthIn: +(footprintW / 25.4).toFixed(4),
      heightIn: +(footprintH / 25.4).toFixed(4),
    },
    outer: shift(bleedOuter),
    holes: bleedHoles,
    cutOuter: shift(cut.outer),
    cutHoles: cut.holes.map(shift),
    cutOffset: { x: +shiftX.toFixed(4), y: +shiftY.toFixed(4) },
    cutBounds: { widthMm: cutW, heightMm: cutH },
  };
}

/**
 * Converts a shape ({ outer, holes }) to a canvas Path2D object.
 *
 * @param {Object} shape - { outer: [...], holes: [...] }
 * @param {number} pxPerMm - Pixels per mm (dpi / 25.4)
 * @param {number} [offsetX=0] - X translation in canvas pixels
 * @param {number} [offsetY=0] - Y translation in canvas pixels
 * @returns {Path2D}
 */
export function shapeToPath2D(shape, pxPerMm, offsetX = 0, offsetY = 0) {
  const p = new Path2D();
  if (shape?.outer && shape.outer.length > 0) {
    p.moveTo(offsetX + shape.outer[0].x * pxPerMm, offsetY + shape.outer[0].y * pxPerMm);
    for (let i = 1; i < shape.outer.length; i++) {
      p.lineTo(offsetX + shape.outer[i].x * pxPerMm, offsetY + shape.outer[i].y * pxPerMm);
    }
    p.closePath();
  }
  if (shape?.holes && shape.holes.length > 0) {
    for (const hole of shape.holes) {
      if (hole.length > 0) {
        p.moveTo(offsetX + hole[0].x * pxPerMm, offsetY + hole[0].y * pxPerMm);
        for (let i = 1; i < hole.length; i++) {
          p.lineTo(offsetX + hole[i].x * pxPerMm, offsetY + hole[i].y * pxPerMm);
        }
        p.closePath();
      }
    }
  }
  return p;
}

/**
 * Converts a polygon or shape ({ outer, holes }) to an SVG path string `d="..."`.
 *
 * @param {Object|Array} shape
 * @param {number} [scale=1]
 * @param {number} [offsetX=0]
 * @param {number} [offsetY=0]
 * @returns {string}
 */
export function shapeToSvgPath(shape, scale = 1, offsetX = 0, offsetY = 0) {
  if (Array.isArray(shape)) {
    if (shape.length === 0) return "";
    let d = `M ${(offsetX + shape[0].x * scale).toFixed(3)} ${(offsetY + shape[0].y * scale).toFixed(3)}`;
    for (let i = 1; i < shape.length; i++) {
      d += ` L ${(offsetX + shape[i].x * scale).toFixed(3)} ${(offsetY + shape[i].y * scale).toFixed(3)}`;
    }
    d += " Z";
    return d;
  }

  let d = "";
  if (shape?.outer && shape.outer.length > 0) {
    d += `M ${(offsetX + shape.outer[0].x * scale).toFixed(3)} ${(offsetY + shape.outer[0].y * scale).toFixed(3)}`;
    for (let i = 1; i < shape.outer.length; i++) {
      d += ` L ${(offsetX + shape.outer[i].x * scale).toFixed(3)} ${(offsetY + shape.outer[i].y * scale).toFixed(3)}`;
    }
    d += " Z ";
  }
  if (shape?.holes && shape.holes.length > 0) {
    for (const hole of shape.holes) {
      if (hole.length > 0) {
        d += `M ${(offsetX + hole[0].x * scale).toFixed(3)} ${(offsetY + hole[0].y * scale).toFixed(3)}`;
        for (let i = 1; i < hole.length; i++) {
          d += ` L ${(offsetX + hole[i].x * scale).toFixed(3)} ${(offsetY + hole[i].y * scale).toFixed(3)}`;
        }
        d += " Z ";
      }
    }
  }
  return d.trim();
}

/**
 * Safe zone for a bleed shape: the CUT path moved `safeMm` further into the
 * artwork (outer shrinks, holes grow). Keep important content inside it.
 * Coordinates are in the same footprint frame as `shape.cutOuter`.
 *
 * @param {Object} shape - result of getBleedShape
 * @param {number} safeMm - distance inside the cut line in mm
 * @returns {{ outer: Array<{x:number,y:number}>, holes: Array<Array<{x:number,y:number}>> }}
 */
export function getSafeShape(shape, safeMm) {
  const d = Math.max(0, safeMm || 0);
  if (!shape?.cutOuter?.length) return { outer: [], holes: [] };
  if (d < 0.001) return { outer: shape.cutOuter, holes: shape.cutHoles || [] };
  const outer = offsetPath(shape.cutOuter, -d);
  const holes = (shape.cutHoles || [])
    .map((h) => offsetPath(h, d))
    .filter((h) => h && h.length >= 3);
  return { outer: outer.length >= 3 ? outer : [], holes };
}

/** Safe-zone distance inside the cut line: the bleed distance (min 1 mm), or the cut inset if larger. */
export function getSafeDistanceMm(bleedMm, cutInsetMm = 0) {
  return Math.max(1, bleedMm || 0, cutInsetMm || 0);
}
