import { getBleedShape } from "./bleedGeometry";
import { computeFlowLayout, A4 } from "./layout";

/**
 * Dark, high-contrast test artwork. A white edge is very visible against it,
 * so you can judge the cut at a glance.
 */
export function makeTestImage(size = 1200) {
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const g = c.getContext("2d");
  g.fillStyle = "#1b1f4b";
  g.fillRect(0, 0, size, size);
  g.strokeStyle = "#ff6fb5";
  g.lineWidth = size / 40;
  for (let i = -size; i < size * 2; i += size / 8) {
    g.beginPath();
    g.moveTo(i, 0);
    g.lineTo(i - size, size);
    g.stroke();
  }
  return c;
}

/**
 * One A4 sheet with the same item at several bleed values, each labelled.
 * Cut it once, find the smallest bleed with no white edge.
 */
export function buildCalibrationSlots({ preset, image, bleeds = [0, 1, 1.5, 2], cutInsetMm = 0, sheet = A4, gapMm = 6, marginMm = 8 }) {
  const labelH = 6;
  const shapes = bleeds.map((b) => getBleedShape(preset, b, cutInsetMm));
  const boxes = shapes.map((s) => ({ w: s.footprint.widthMm, h: s.footprint.heightMm + labelH }));
  const { positions, overflow } = computeFlowLayout({ sheet, boxes, gapMm, marginMm });
  const slots = [];
  shapes.forEach((shape, i) => {
    if (!positions[i]) return;
    slots.push({
      ...positions[i],
      rotated: false,
      shape,
      image,
      label: bleeds[i] === 0 ? "0 mm (no bleed)" : `${bleeds[i]} mm bleed`,
    });
  });
  return { slots, overflow };
}