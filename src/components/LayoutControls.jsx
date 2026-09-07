import React from "react";
import { Scissors, Sliders, Tag, Gauge } from "lucide-react";
import PageLabelControls from "./PageLabelControls";

export default function LayoutControls({
  showCutGuides,
  onToggleCutGuides,
  cutGuideStyle,
  onChangeCutGuideStyle,
  cutGuideColor,
  onChangeCutGuideColor,
  cutGuideOpacity,
  onChangeCutGuideOpacity,
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
  pageLabel,
  onChangePageLabel,
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

          {showCutGuides && (
            <div
              style={{
                background: "rgba(143, 127, 224, 0.06)",
                padding: "10px 12px",
                borderRadius: "12px",
                marginTop: "10px",
                display: "flex",
                flexDirection: "column",
                gap: "8px",
              }}
            >
              {/* Guide Color */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: "#57536b" }}>
                  Guide Color:
                </span>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  {["#b0b0be", "#3d3856", "#ff6b8a", "#8f7fe0", "#000000"].map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => onChangeCutGuideColor(c)}
                      title={c}
                      style={{
                        width: 20,
                        height: 20,
                        borderRadius: "50%",
                        border:
                          cutGuideColor === c
                            ? "2px solid #8f7fe0"
                            : "1px solid rgba(0,0,0,0.15)",
                        background: c,
                        cursor: "pointer",
                        padding: 0,
                      }}
                    />
                  ))}
                  <input
                    type="color"
                    value={cutGuideColor}
                    onChange={(e) => onChangeCutGuideColor(e.target.value)}
                    title="Custom guide color"
                    style={{
                      width: 26,
                      height: 22,
                      border: "1px solid rgba(0,0,0,0.15)",
                      borderRadius: 6,
                      background: "transparent",
                      cursor: "pointer",
                      padding: 0,
                    }}
                  />
                </div>
              </div>

              {/* Guide Opacity */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, fontWeight: 600, color: "#57536b", marginBottom: 4 }}>
                  <span>Guide Opacity:</span>
                  <span>{Math.round(cutGuideOpacity * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="100"
                  step="5"
                  value={Math.round(cutGuideOpacity * 100)}
                  onChange={(e) =>
                    onChangeCutGuideOpacity(parseInt(e.target.value, 10) / 100)
                  }
                  style={{ width: "100%", accentColor: "#8f7fe0" }}
                />
              </div>
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

        {/* Page Label: tracking / waybill note in margin area */}
        <PageLabelControls
          pageLabel={pageLabel}
          onChangePageLabel={onChangePageLabel}
        />

      </div>
    </div>
  );
}
