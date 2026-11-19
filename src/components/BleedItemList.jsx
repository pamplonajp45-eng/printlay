import { TriangleAlert } from "lucide-react";

const fmt = (v) => (Number.isFinite(v) ? +v.toFixed(1) : "—");

/**
 * Items on the current sheet with size/DPI info. Warning badges, the warning
 * count and the gap fix only appear when `showWarnings` is on (off by default).
 */
export default function BleedItemList({
  itemInfos, warningsByIndex, fixGapMm, onFixGap, onHover, showWarnings = false, onToggleWarnings,
}) {
  const warnCount = [...warningsByIndex.values()].reduce((n, list) => n + list.length, 0);

  return (
    <section className="bcp-section">
      <h4 className="bcp-section__title">
        Items on this sheet
        {showWarnings && warnCount > 0 && (
          <span className="bcp-count">{warnCount} warning{warnCount !== 1 ? "s" : ""}</span>
        )}
      </h4>

      {onToggleWarnings && (
        <label className="bcp-check" style={{ marginBottom: 10 }}>
          <input type="checkbox" checked={showWarnings} onChange={(e) => onToggleWarnings(e.target.checked)} />
          <span>Show warnings (DPI, overlap, margin)</span>
        </label>
      )}

      {showWarnings && fixGapMm != null && (
        <button type="button" className="bcp-fix" onClick={() => onFixGap(fixGapMm)}>
          Bleed zones overlap — set gap to 2 × bleed ({fixGapMm} mm)
        </button>
      )}

      {itemInfos.length === 0 && <p className="bcp-muted">No items on this sheet.</p>}

      <ol className="bcp-items">
        {itemInfos.map((info, i) => {
          const list = showWarnings ? warningsByIndex.get(i) || [] : [];
          return (
            <li
              key={i}
              className={`bcp-item ${list.length ? "has-warning" : ""}`}
              onMouseEnter={() => onHover?.(i)}
              onMouseLeave={() => onHover?.(null)}
            >
              <span className="bcp-item__num">#{info.number ?? i + 1}</span>
              <div className="bcp-item__body">
                <div className="bcp-item__name">{info.presetName}</div>
                <dl className="bcp-item__stats">
                  <dt>Cut</dt><dd>{fmt(info.cutW)} × {fmt(info.cutH)} mm</dd>
                  <dt>With bleed</dt><dd>{fmt(info.bleedW)} × {fmt(info.bleedH)} mm</dd>
                  <dt>Rotation</dt><dd>{info.rotated ? "90°" : "0°"}</dd>
                  <dt>DPI</dt><dd>{info.effectiveDpi == null ? "—" : Math.round(info.effectiveDpi)}</dd>
                </dl>
                {list.length > 0 && (
                  <div className="bcp-badges">
                    {list.map((w, wi) => (
                      <span key={wi} className={`bcp-badge bcp-badge--${w.type}`} title={w.label}>
                        <TriangleAlert size={11} /> {w.label}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
