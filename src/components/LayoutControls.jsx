import React from "react";
import { Scissors, Sliders, Palette, Tag, Gauge } from "lucide-react";

export default function LayoutControls({
  showCutGuides,
  onToggleCutGuides,
  cutGuideStyle,
  onChangeCutGuideStyle,
  marginIn,
  onChangeMargin,
  gutterIn,
  onChangeGutter,
  dpi,
  onChangeDpi,
  frameBgColor,
  onChangeFrameBgColor,
  showSequenceLabels,
  onToggleSequenceLabels,
}) {
  return (
    <div className="glass-card" style={{ padding: "20px", marginBottom: "20px" }}>
      <h3 className="heading" style={{ margin: "0 0 16px", fontSize: 16, color: "#3d3856", display: "flex", alignItems: "center", gap: 6 }}>
        <Sliders size={16} color="#8f7fe0" /> Layout & Cut-Guide Settings
      </h3>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "20px" }}>
        
        {/* Cut-Guide Toggle & Style */}
        <div>
          <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, fontWeight: 700, color: "#3d3856", marginBottom: 8, cursor: "pointer" }}>
            <input
              type="checkbox"
              checked={showCutGuides}
              onChange={(e) => onToggleCutGuides(e.target.checked)}
              style={{ width: 16, height: 16, accentColor: "#8f7fe0" }}
            />
            <Scissors size={15} color="#8f7fe0" /> Print Cut-Guides
          </label>

          {showCutGuides && (
            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginTop: "8px" }}>
              {[
                { id: "dashed", label: "Dashed Lines" },
                { id: "corner", label: "Corner Marks" },
                { id: "solid", label: "Solid Lines" },
              ].map((style) => (
                <button
                  key={style.id}
                  onClick={() => onChangeCutGuideStyle(style.id)}
                  style={{
                    padding: "4px 10px",
                    borderRadius: "999px",
                    border: "none",
                    fontSize: "12px",
                    fontWeight: 600,
                    background: cutGuideStyle === style.id ? "#8f7fe0" : "rgba(0,0,0,0.05)",
                    color: cutGuideStyle === style.id ? "#ffffff" : "#57536b",
                    cursor: "pointer",
                  }}
                >
                  {style.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Page Margin Slider */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, fontWeight: 600, color: "#57536b", marginBottom: 6 }}>
            <span>Page Margin:</span>
            <span>{marginIn.toFixed(2)} in</span>
          </div>
          <input
            type="range"
            min="0.0"
            max="1.0"
            step="0.05"
            value={marginIn}
            onChange={(e) => onChangeMargin(parseFloat(e.target.value))}
            style={{ width: "100%", accentColor: "#8f7fe0" }}
          />
        </div>

        {/* Photo Spacing / Gutter Slider */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, fontWeight: 600, color: "#57536b", marginBottom: 6 }}>
            <span>Photo Spacing (Gutter):</span>
            <span>{gutterIn.toFixed(2)} in</span>
          </div>
          <input
            type="range"
            min="0.0"
            max="0.8"
            step="0.05"
            value={gutterIn}
            onChange={(e) => onChangeGutter(parseFloat(e.target.value))}
            style={{ width: "100%", accentColor: "#8f7fe0" }}
          />
        </div>

        {/* Resolution DPI & Frame Color & Sequence Labels */}
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          
          {/* DPI Switcher */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: "#57536b", display: "flex", alignItems: "center", gap: 4 }}>
              <Gauge size={14} color="#8f7fe0" /> Resolution:
            </span>
            <div style={{ display: "flex", background: "rgba(0,0,0,0.05)", borderRadius: "999px", padding: "2px" }}>
              <button
                onClick={() => onChangeDpi(150)}
                style={{
                  padding: "3px 10px",
                  borderRadius: "999px",
                  border: "none",
                  fontSize: "11px",
                  fontWeight: 700,
                  background: dpi === 150 ? "#8f7fe0" : "transparent",
                  color: dpi === 150 ? "#fff" : "#57536b",
                  cursor: "pointer",
                }}
              >
                150 DPI
              </button>
              <button
                onClick={() => onChangeDpi(300)}
                style={{
                  padding: "3px 10px",
                  borderRadius: "999px",
                  border: "none",
                  fontSize: "11px",
                  fontWeight: 700,
                  background: dpi === 300 ? "#8f7fe0" : "transparent",
                  color: dpi === 300 ? "#fff" : "#57536b",
                  cursor: "pointer",
                }}
                title="300 DPI - Standard print sharp resolution"
              >
                300 DPI (Print)
              </button>
            </div>
          </div>

          {/* Sequence Number Label Toggle */}
          <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 600, color: "#57536b", cursor: "pointer" }}>
            <input
              type="checkbox"
              checked={showSequenceLabels}
              onChange={(e) => onToggleSequenceLabels(e.target.checked)}
              style={{ accentColor: "#8f7fe0" }}
            />
            <Tag size={13} color="#8f7fe0" /> Label photo sequence (#1, #2...)
          </label>

        </div>

      </div>
    </div>
  );
}
