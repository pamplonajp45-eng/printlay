import React, { useState } from "react";
import { PHOTO_PRESETS, cmToIn, mmToIn } from "../lib/presets";
import { Sliders, RectangleVertical, RectangleHorizontal } from "lucide-react";

export default function PresetPicker({
  selectedPresetId,
  onSelectPreset,
  photoOrientation = "portrait",
  onChangePhotoOrientation,
  customPhotoSize,
  onChangeCustomSize,
}) {
  const [unit, setUnit] = useState("in");
  const [customW, setCustomW] = useState(customPhotoSize?.wIn || 3.0);
  const [customH, setCustomH] = useState(customPhotoSize?.hIn || 4.0);

  const handleCustomChange = (wVal, hVal, unitType) => {
    let wIn = parseFloat(wVal) || 1;
    let hIn = parseFloat(hVal) || 1;

    if (unitType === "cm") {
      wIn = cmToIn(wIn);
      hIn = cmToIn(hIn);
    } else if (unitType === "mm") {
      wIn = mmToIn(wIn);
      hIn = mmToIn(hIn);
    }

    onChangeCustomSize({
      wIn: Math.max(0.5, Math.min(12, wIn)),
      hIn: Math.max(0.5, Math.min(12, hIn)),
      unit: unitType,
      wRaw: wVal,
      hRaw: hVal,
    });
  };

  return (
    <div className="glass-card" style={{ padding: "20px", marginBottom: "20px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px", flexWrap: "wrap", gap: "8px" }}>
        <h3 className="heading" style={{ margin: 0, fontSize: 16, color: "#3d3856" }}>
          Target Photo Print Size
        </h3>
        
        {/* Photo Orientation Switcher (Portrait vs Landscape) */}
        <div style={{ display: "flex", background: "rgba(0,0,0,0.06)", borderRadius: "999px", padding: "2px" }}>
          <button
            type="button"
            onClick={() => onChangePhotoOrientation("portrait")}
            style={{
              padding: "4px 12px",
              borderRadius: "999px",
              border: "none",
              fontSize: "12px",
              fontWeight: 700,
              background: photoOrientation === "portrait" ? "#8f7fe0" : "transparent",
              color: photoOrientation === "portrait" ? "#ffffff" : "#57536b",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "5px",
            }}
            title="Portrait position (Vertical)"
          >
            <RectangleVertical size={13} /> Portrait
          </button>

          <button
            type="button"
            onClick={() => onChangePhotoOrientation("landscape")}
            style={{
              padding: "4px 12px",
              borderRadius: "999px",
              border: "none",
              fontSize: "12px",
              fontWeight: 700,
              background: photoOrientation === "landscape" ? "#8f7fe0" : "transparent",
              color: photoOrientation === "landscape" ? "#ffffff" : "#57536b",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "5px",
            }}
            title="Landscape position (Horizontal)"
          >
            <RectangleHorizontal size={13} /> Landscape
          </button>
        </div>
      </div>

      {/* Segmented pill buttons for presets */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "16px" }}>
        {PHOTO_PRESETS.map((preset) => {
          const isActive = preset.id === selectedPresetId;
          return (
            <button
              key={preset.id}
              onClick={() => onSelectPreset(preset.id)}
              className={isActive ? "bubble-pill-active" : "bubble-pill-inactive"}
              title={preset.description}
            >
              {preset.name}
            </button>
          );
        })}
      </div>

      {/* Custom size form if Custom preset is selected */}
      {selectedPresetId === "custom" && (
        <div
          style={{
            background: "rgba(143, 127, 224, 0.08)",
            border: "1px solid rgba(143, 127, 224, 0.2)",
            borderRadius: "18px",
            padding: "16px",
            marginTop: "12px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12, fontSize: 14, fontWeight: 700, color: "#3d3856" }}>
            <Sliders size={16} color="#8f7fe0" /> Custom Photo Dimensions
          </div>

          <div style={{ display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap" }}>
            
            {/* Unit selector */}
            <div style={{ display: "flex", background: "rgba(255,255,255,0.7)", borderRadius: "999px", padding: "2px" }}>
              {["in", "cm", "mm"].map((u) => (
                <button
                  key={u}
                  type="button"
                  onClick={() => {
                    setUnit(u);
                    handleCustomChange(customW, customH, u);
                  }}
                  style={{
                    padding: "4px 12px",
                    borderRadius: "999px",
                    border: "none",
                    fontSize: "12px",
                    fontWeight: 700,
                    background: unit === u ? "#8f7fe0" : "transparent",
                    color: unit === u ? "#ffffff" : "#57536b",
                    cursor: "pointer",
                  }}
                >
                  {u}
                </button>
              ))}
            </div>

            {/* Width */}
            <label style={{ fontSize: 13, fontWeight: 600, color: "#57536b", display: "flex", alignItems: "center", gap: 6 }}>
              Width:
              <input
                type="number"
                step="0.1"
                min="0.5"
                max="30"
                value={customW}
                onChange={(e) => {
                  setCustomW(e.target.value);
                  handleCustomChange(e.target.value, customH, unit);
                }}
                style={{
                  width: "70px",
                  padding: "6px 10px",
                  borderRadius: "12px",
                  border: "1px solid rgba(0,0,0,0.12)",
                  fontSize: "13px",
                  fontWeight: 700,
                }}
              />
            </label>

            {/* Height */}
            <label style={{ fontSize: 13, fontWeight: 600, color: "#57536b", display: "flex", alignItems: "center", gap: 6 }}>
              Height:
              <input
                type="number"
                step="0.1"
                min="0.5"
                max="30"
                value={customH}
                onChange={(e) => {
                  setCustomH(e.target.value);
                  handleCustomChange(customW, e.target.value, unit);
                }}
                style={{
                  width: "70px",
                  padding: "6px 10px",
                  borderRadius: "12px",
                  border: "1px solid rgba(0,0,0,0.12)",
                  fontSize: "13px",
                  fontWeight: 700,
                }}
              />
            </label>

          </div>
        </div>
      )}
    </div>
  );
}
