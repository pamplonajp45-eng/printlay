import { useMemo } from "react";
import { shapeToSvgPath, getSafeShape, getSafeDistanceMm } from "../lib/bleedGeometry";

// Data URLs are expensive; cache one per canvas object.
const urlCache = new WeakMap();
function canvasUrl(canvas) {
  if (!canvas) return null;
  if (urlCache.has(canvas)) return urlCache.get(canvas);
  let url;
  try {
    url = canvas.toDataURL("image/png");
  } catch {
    url = null; // tainted canvas: fall back to the placeholder
  }
  urlCache.set(canvas, url);
  return url;
}

/** Same frame as renderSheet's drawSlot, so preview and export line up exactly. */
function itemTransform(item) {
  let t = `translate(${item.x} ${item.y})`;
  if (item.rotated) t += ` translate(${item.shape.footprint.heightMm} 0) rotate(90)`;
  return t;
}

/** SVG path strings for one bleed shape. */
function shapePaths(shape, cutInsetMm, id) {
  const bleed = shapeToSvgPath({ outer: shape.outer, holes: shape.holes });
  const cut = shapeToSvgPath({ outer: shape.cutOuter, holes: shape.cutHoles });
  const safe = getSafeShape(shape, getSafeDistanceMm(shape.bleedMm, cutInsetMm));
  return {
    clipId: `bcp-bleed-clip-${id}`,
    bleed,
    cut,
    // evenodd over bleed + cut contours = only the ring between them (outer, notch and windows)
    zone: `${bleed} ${cut}`,
    safe: safe.outer.length ? shapeToSvgPath(safe) : "",
  };
}

const S = { vectorEffect: "non-scaling-stroke", pointerEvents: "none" };

/**
 * The whole A4 sheet as SVG, in mm. Each item carries its own bleed `shape`
 * (mixed sizes). Strokes use non-scaling-stroke so the cut line keeps its
 * 3px halo + 1.25px dash at any zoom.
 */
export default function BleedSheetSvg({
  sheet, marginMm, items, canvases, cutInsetMm, layers, scale, hovered,
}) {
  const pathsByShape = useMemo(() => {
    const map = new Map();
    for (const it of items) {
      if (it.shape && !map.has(it.shape)) map.set(it.shape, shapePaths(it.shape, cutInsetMm, map.size));
    }
    return map;
  }, [items, cutInsetMm]);

  const W = sheet.widthMm;
  const H = sheet.heightMm;

  // Label pill: constant ~15px tall on screen, placed outside the item
  const px = 1 / scale; // 1 screen px in mm
  const pillH = 15 * px;
  const fontSize = 9.5 * px;

  return (
    <svg
      className="bcp-sheet-svg"
      xmlns="http://www.w3.org/2000/svg"
      viewBox={`0 0 ${W} ${H}`}
      width={W * scale}
      height={H * scale}
      style={{ overflow: "visible", display: "block" }}
    >
      <defs>
        {[...pathsByShape.values()].map((p) => (
          <clipPath key={p.clipId} id={p.clipId} clipPathUnits="userSpaceOnUse">
            <path d={p.bleed} clipRule="evenodd" />
          </clipPath>
        ))}
        <pattern id="bcp-hatch" patternUnits="userSpaceOnUse" width="1.4" height="1.4" patternTransform="rotate(45)">
          <line x1="0" y1="0" x2="0" y2="1.4" stroke="rgba(30,27,46,0.6)" strokeWidth="0.45" />
        </pattern>
      </defs>

      <rect width={W} height={H} fill="#ffffff" />

      {layers.pageMargin && marginMm > 0 && (
        <rect
          x={marginMm} y={marginMm} width={W - 2 * marginMm} height={H - 2 * marginMm}
          fill="none" stroke="#9a94b8" strokeWidth="1" strokeDasharray="5 4" opacity="0.7" style={S}
        />
      )}

      {items.map((item, i) => {
        const paths = pathsByShape.get(item.shape);
        if (!paths) return null;
        const fw = item.shape.footprint.widthMm;
        const fh = item.shape.footprint.heightMm;
        const url = layers.artwork ? canvasUrl(canvases[i]) : null;
        return (
          <g key={i} transform={itemTransform(item)}>
            {/* 1. Artwork clipped to the BLEED path (cover-fit to the bleed box, like renderSheet) */}
            {layers.artwork && (url ? (
              <image
                href={url} x="0" y="0" width={fw} height={fh}
                preserveAspectRatio="xMidYMid slice" clipPath={`url(#${paths.clipId})`}
              />
            ) : (
              <path d={paths.bleed} fill="#d9d5ee" fillRule="evenodd" />
            ))}

            {/* 2 + 5. Bleed zone ring, including around the notch and inside windows */}
            {layers.bleedZone && (
              <>
                <path d={paths.zone} fill="rgba(255,255,255,0.38)" fillRule="evenodd" style={S} />
                <path d={paths.zone} fill="url(#bcp-hatch)" fillRule="evenodd" style={S} />
                <path d={paths.bleed} fill="none" stroke="#8f7fe0" strokeWidth="1" style={S} />
              </>
            )}

            {/* 4. Safe zone */}
            {layers.safeZone && paths.safe && (
              <>
                <path d={paths.safe} fill="none" stroke="#ffffff" strokeWidth="2.5" opacity="0.85" style={S} />
                <path d={paths.safe} fill="none" stroke="#0891b2" strokeWidth="1" strokeDasharray="2 2" style={S} />
              </>
            )}

            {/* 3. Cut line: white halo under dark dash, visible on any artwork */}
            {layers.cutLine && (
              <>
                <path d={paths.cut} fill="none" stroke="#ffffff" strokeWidth="3" strokeLinejoin="round" style={S} />
                <path
                  d={paths.cut} fill="none" stroke="#1e1b2e" strokeWidth="1.25"
                  strokeDasharray="4 3" strokeLinejoin="round" style={S}
                />
              </>
            )}

            {hovered === i && (
              <rect x="0" y="0" width={fw} height={fh} fill="none" stroke="#8f7fe0" strokeWidth="2" style={S} />
            )}
          </g>
        );
      })}

      {/* 6. Labels last, in sheet space, so nothing clips or covers them */}
      {layers.labels && items.map((item, i) => {
        const text = `#${(Number.isInteger(item.index) ? item.index : i) + 1}`;
        const pillW = (text.length * 6.2 + 10) * px;
        const above = item.y - pillH - 2 * px;
        const y = above >= 0 ? above : Math.min(H - pillH, item.y + item.h + 2 * px);
        const x = Math.min(Math.max(0, item.x), W - pillW);
        return (
          <g key={`label-${i}`} style={{ pointerEvents: "none" }}>
            <rect
              x={x} y={y} width={pillW} height={pillH} rx={pillH / 2}
              fill="#3d3856" stroke="#ffffff" strokeWidth="1" style={S}
            />
            <text
              x={x + pillW / 2} y={y + pillH / 2} fill="#ffffff" fontSize={fontSize}
              fontWeight="700" fontFamily="Inter, system-ui, sans-serif"
              textAnchor="middle" dominantBaseline="central"
            >
              {text}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
