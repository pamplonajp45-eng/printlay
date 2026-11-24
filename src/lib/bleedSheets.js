import { computeLayout, pageCounts, packShelves, packUniformGrid, A4 } from "./layout";
import { presetKey, hasMixedSizes, isNameTagPreset } from "./photoSizes";

/**
 * Which item goes where on which bleed sheet. Pure, no DOM.
 *
 * One size: the rotation-aware grid from computeLayout (identical to before).
 * Mixed sizes: shelf packing, one size per row (packShelves); a size turns 90°
 * when that fits more per row (same rotation as renderSheet uses).
 * Mixed NAME TAGS (V2-V4 / V5 / V6): a fixed grid sized for the largest tag,
 * same slots on every page (4 per A4), each tag centered in its slot.
 *
 * @param {Object} opts
 * @param {Array<Object>} opts.presets - one preset per photo
 * @param {(preset:Object) => Object} opts.getShape - preset -> getBleedShape(...) result
 * @param {{ gapMm:number, marginMm:number, allowRotate:boolean }} opts.settings
 * @param {{ widthMm:number, heightMm:number }} [opts.sheet=A4]
 * @returns {{ mixed:boolean, capacity:number|null,
 *   pages: Array<Array<{index:number,x:number,y:number,w:number,h:number,rotated:boolean,shape:Object,preset:Object}>> }}
 *   `capacity` is items per sheet for one size, null when mixed.
 */
export function planBleedSheets({ presets, getShape, settings, sheet = A4 }) {
  const { gapMm, marginMm, allowRotate } = settings;
  if (!presets.length) return { mixed: false, capacity: 0, pages: [] };

  if (!hasMixedSizes(presets)) {
    const preset = presets[0];
    const shape = getShape(preset);
    const layout = computeLayout({ sheet, footprint: shape.footprint, gapMm, marginMm, allowRotate });
    let start = 0;
    const pages = pageCounts(presets.length, layout.capacity).map((count) => {
      const page = layout.items.slice(0, count).map((it, i) => ({ ...it, index: start + i, shape, preset }));
      start += count;
      return page;
    });
    return { mixed: false, capacity: layout.capacity, pages };
  }

  const shapes = presets.map(getShape);
  const packOpts = {
    sheetW: sheet.widthMm,
    sheetH: sheet.heightMm,
    margin: marginMm,
    gap: gapMm,
    allowRotate,
    items: shapes.map((s, i) => ({ w: s.footprint.widthMm, h: s.footprint.heightMm, key: presetKey(presets[i]) })),
    // Phone skins of different models are near the same size: share rows
    mixRows: presets.every((p) => p?.isPhoneSkin),
  };
  const grid = presets.every(isNameTagPreset);
  const packed = grid ? packUniformGrid(packOpts) : packShelves(packOpts);
  return {
    mixed: true,
    // fixed grid for name tags: items per sheet is known
    capacity: grid ? packed.perPage : null,
    grid,
    pages: packed.pages.map((page) =>
      page.map((c) => ({
        x: c.x, y: c.y, w: c.w, h: c.h, rotated: c.rotated,
        index: c.index, shape: shapes[c.index], preset: presets[c.index],
      })),
    ),
  };
}
