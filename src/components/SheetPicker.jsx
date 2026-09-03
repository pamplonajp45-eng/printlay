import React from "react";
import { SHEET_PRESETS } from "../lib/presets";
import { FileText, RectangleVertical, RectangleHorizontal } from "lucide-react";

export default function SheetPicker({
  selectedSheetId,
  onSelectSheet,
  sheetOrientation = "portrait",
  onChangeSheetOrientation,
}) {
  return (
    <div className="glass-card" style={{ padding: "20px", marginBottom: "20px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px", flexWrap: "wrap", gap: "8px" }}>
        <h3 className="heading" style={{ margin: 0, fontSize: 16, color: "#3d3856", display: "flex", alignItems: "center", gap: 6 }}>
          <FileText size={16} color="#8f7fe0" /> Output Paper / Sheet Size
        </h3>

        {/* Sheet Orientation Switcher (Portrait vs Landscape) */}
        <div style={{ display: "flex", background: "rgba(0,0,0,0.06)", borderRadius: "999px", padding: "2px" }}>
          <button
            type="button"
            onClick={() => onChangeSheetOrientation("portrait")}
            style={{
              padding: "4px 12px",
              borderRadius: "999px",
              border: "none",
              fontSize: "12px",
              fontWeight: 700,
              background: sheetOrientation === "portrait" ? "#8f7fe0" : "transparent",
              color: sheetOrientation === "portrait" ? "#ffffff" : "#57536b",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "5px",
            }}
            title="Paper sheet in Portrait position (Vertical)"
          >
            <RectangleVertical size={13} /> Portrait
          </button>

          <button
            type="button"
            onClick={() => onChangeSheetOrientation("landscape")}
            style={{
              padding: "4px 12px",
              borderRadius: "999px",
              border: "none",
              fontSize: "12px",
              fontWeight: 700,
              background: sheetOrientation === "landscape" ? "#8f7fe0" : "transparent",
              color: sheetOrientation === "landscape" ? "#ffffff" : "#57536b",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "5px",
            }}
            title="Paper sheet in Landscape position (Horizontal)"
          >
            <RectangleHorizontal size={13} /> Landscape
          </button>
        </div>
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
        {SHEET_PRESETS.map((preset) => {
          const isActive = preset.id === selectedSheetId;
          const displayW = sheetOrientation === "landscape" && preset.hIn ? preset.hIn : preset.wIn;
          const displayH = sheetOrientation === "landscape" && preset.wIn ? preset.wIn : preset.hIn;

          return (
            <button
              key={preset.id}
              onClick={() => onSelectSheet(preset.id)}
              className={isActive ? "bubble-pill-active" : "bubble-pill-inactive"}
              title={preset.description}
            >
              {preset.name}
              <span style={{ opacity: 0.75, fontSize: 11, marginLeft: 4 }}>
                ({displayW}″×{displayH}″)
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
