const LAYER_DEFS = [
  { key: "artwork", label: "Artwork" },
  { key: "bleedZone", label: "Bleed zone" },
  { key: "cutLine", label: "Cut line" },
  { key: "safeZone", label: "Safe zone" },
  { key: "labels", label: "Labels" },
  { key: "pageMargin", label: "Page margin" },
];

/** Layer toggles + legend for the bleed-cut preview side panel. */
export default function BleedLayers({ layers, toggleLayer }) {
  return (
    <>
      <section className="bcp-section">
        <h4 className="bcp-section__title">Layers</h4>
        <div className="bcp-layers">
          {LAYER_DEFS.map(({ key, label }) => (
            <label key={key} className="bcp-check">
              <input type="checkbox" checked={!!layers[key]} onChange={() => toggleLayer(key)} />
              <span>{label}</span>
            </label>
          ))}
        </div>
      </section>

      <section className="bcp-section">
        <h4 className="bcp-section__title">Legend</h4>
        <ul className="bcp-legend">
          <li>
            <svg width="28" height="14" aria-hidden="true">
              <defs>
                <pattern id="bcp-legend-hatch" patternUnits="userSpaceOnUse" width="5" height="5" patternTransform="rotate(45)">
                  <line x1="0" y1="0" x2="0" y2="5" stroke="rgba(30,27,46,0.6)" strokeWidth="1.6" />
                </pattern>
              </defs>
              <rect x="1" y="1" width="26" height="12" rx="2" fill="rgba(255,255,255,0.5)" />
              <rect x="1" y="1" width="26" height="12" rx="2" fill="url(#bcp-legend-hatch)" stroke="#8f7fe0" />
            </svg>
            <span><b>Hatch</b> = bleed (printed, trimmed off)</span>
          </li>
          <li>
            <svg width="28" height="14" aria-hidden="true">
              <line x1="1" y1="7" x2="27" y2="7" stroke="#fff" strokeWidth="3" />
              <line x1="1" y1="7" x2="27" y2="7" stroke="#1e1b2e" strokeWidth="1.25" strokeDasharray="4 3" />
            </svg>
            <span><b>Dashed</b> = cut line (what the Silhouette cuts)</span>
          </li>
          <li>
            <svg width="28" height="14" aria-hidden="true">
              <line x1="1" y1="7" x2="27" y2="7" stroke="#fff" strokeWidth="2.5" />
              <line x1="1" y1="7" x2="27" y2="7" stroke="#0891b2" strokeWidth="1" strokeDasharray="2 2" />
            </svg>
            <span><b>Inner dashed</b> = safe zone (keep text inside)</span>
          </li>
        </ul>
      </section>
    </>
  );
}
