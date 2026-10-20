import { useState, useEffect, useRef } from "react";
import { PHOTO_PRESETS, cmToIn, mmToIn } from "../lib/presets";
import { Sliders, RectangleVertical, RectangleHorizontal, Scissors } from "lucide-react";

// ---- unit helpers (inches is the source of truth everywhere) ----
const toIn = (val, unit) =>
  unit === "cm" ? cmToIn(val) : unit === "mm" ? mmToIn(val) : val;
const fromIn = (valIn, unit) =>
  unit === "cm" ? valIn * 2.54 : unit === "mm" ? valIn * 25.4 : valIn;
const round3 = (n) => Number(n.toFixed(3));
const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));

// Fix: input max now matches the 12 in clamp, in whatever unit is shown
const MAX_BY_UNIT = { in: 12, cm: 30, mm: 300 };

const inputStyle = {
  width: "70px",
  padding: "6px 10px",
  borderRadius: "12px",
  border: "1px solid rgba(0,0,0,0.12)",
  fontSize: "13px",
  fontWeight: 700,
};

const labelStyle = {
  fontSize: 13,
  fontWeight: 600,
  color: "#57536b",
  display: "flex",
  alignItems: "center",
  gap: 6,
};

const panelStyle = {
  background: "rgba(143, 127, 224, 0.08)",
  border: "1px solid rgba(143, 127, 224, 0.2)",
  borderRadius: "18px",
  padding: "16px",
  marginTop: "12px",
};

const panelTitleStyle = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  marginBottom: 12,
  fontSize: 14,
  fontWeight: 700,
  color: "#3d3856",
};

function UnitSelector({ unit, onChange }) {
  return (
    <div style={{ display: "flex", background: "rgba(255,255,255,0.7)", borderRadius: "999px", padding: "2px" }}>
      {["in", "cm", "mm"].map((u) => (
        <button
          key={u}
          type="button"
          onClick={() => onChange(u)}
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
  );
}

export default function PresetPicker({
  selectedPresetId,
  onSelectPreset,
  photoOrientation = "portrait",
  onChangePhotoOrientation,
  customPhotoSize,
  onChangeCustomSize,
  onChangeNotch, // receives { depthIn, widthIn, radiusIn, edge } or null
  notchValue, // the parent's current notch, so edits survive closing/reopening this panel
}) {
  const [unit, setUnit] = useState("in");
  const [customW, setCustomW] = useState(customPhotoSize?.wIn || 3.0);
  const [customH, setCustomH] = useState(customPhotoSize?.hIn || 4.0);

  const selectedPreset = PHOTO_PRESETS.find((p) => p.id === selectedPresetId);
  const presetNotch = selectedPreset?.notch || null;

  // Notch values in inches (truth) + raw strings (what the inputs show)
  // Start from the parent's saved notch if there is one, else the preset default
  const seedNotch = presetNotch
    ? {
        depthIn: (notchValue || presetNotch).depthIn,
        widthIn: (notchValue || presetNotch).widthIn,
        radiusIn: (notchValue || presetNotch).radiusIn,
      }
    : null;
  const [notchIn, setNotchIn] = useState(seedNotch);
  const [notchRaw, setNotchRaw] = useState(() =>
    seedNotch
      ? {
          depth: String(round3(seedNotch.depthIn)),
          width: String(round3(seedNotch.widthIn)),
          radius: String(round3(seedNotch.radiusIn)),
        }
      : { depth: "", width: "", radius: "" }
  );

  // Rotating the shape: bottom edge becomes right edge in landscape
  // The preset is authored wide (4.92 x 3.17) with the notch on the bottom, so
  // that is its "native" orientation. Any other orientation rotates it.
  const nativeLandscape = (selectedPreset?.wIn ?? 0) >= (selectedPreset?.hIn ?? 0);
  const isNativeOrientation = (photoOrientation === "landscape") === nativeLandscape;
  const autoEdge = isNativeOrientation ? "bottom" : "right";

  // Manual choice from the "Position" buttons. null = follow orientation.
  const [edgeOverride, setEdgeOverride] = useState(() =>
    notchValue && notchValue.edge !== autoEdge ? notchValue.edge : null
  );
  const notchEdge = edgeOverride || autoEdge;

  // Size of the actual cell after orientation: used for the notch limits
  const cellW = isNativeOrientation ? selectedPreset?.wIn : selectedPreset?.hIn;
  const cellH = isNativeOrientation ? selectedPreset?.hIn : selectedPreset?.wIn;
  const alongEdge = notchEdge === "left" || notchEdge === "right" ? cellH : cellW;
  const acrossEdge = notchEdge === "left" || notchEdge === "right" ? cellW : cellH;

  const emitNotch = (n, edge = notchEdge) => {
    if (!onChangeNotch) return;
    onChangeNotch(n ? { ...n, edge } : null);
  };

  const handleEdgeChange = (edge) => {
    setEdgeOverride(edge);
    if (notchIn) emitNotch(notchIn, edge);
  };

  const prevPresetRef = useRef(selectedPresetId);
  const prevOrientationRef = useRef(photoOrientation);

  // When the preset really changes, reset the notch to that preset's defaults
  useEffect(() => {
    if (prevPresetRef.current === selectedPresetId) return;
    prevPresetRef.current = selectedPresetId;
    if (presetNotch) {
      const n = {
        depthIn: presetNotch.depthIn,
        widthIn: presetNotch.widthIn,
        radiusIn: presetNotch.radiusIn,
      };
      setNotchIn(n);
      setEdgeOverride(null);
      setNotchRaw({
        depth: String(round3(fromIn(n.depthIn, unit))),
        width: String(round3(fromIn(n.widthIn, unit))),
        radius: String(round3(fromIn(n.radiusIn, unit))),
      });
      emitNotch(n, autoEdge);
    } else {
      setNotchIn(null);
      setEdgeOverride(null);
      emitNotch(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPresetId]);

  // When orientation flips, re-send the same notch with the new edge
  useEffect(() => {
    if (prevOrientationRef.current === photoOrientation) return;
    prevOrientationRef.current = photoOrientation;
    setEdgeOverride(null);
    if (notchIn) emitNotch(notchIn, autoEdge);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [photoOrientation]);

  const handleCustomChange = (wVal, hVal, unitType) => {
    const wIn = toIn(parseFloat(wVal) || 1, unitType);
    const hIn = toIn(parseFloat(hVal) || 1, unitType);

    onChangeCustomSize({
      wIn: clamp(wIn, 0.5, 12),
      hIn: clamp(hIn, 0.5, 12),
      unit: unitType,
      wRaw: wVal,
      hRaw: hVal,
    });
  };

  // Fix: convert the numbers on screen instead of reinterpreting them
  const handleUnitChange = (nextUnit) => {
    const nextW = round3(fromIn(toIn(parseFloat(customW) || 0, unit), nextUnit));
    const nextH = round3(fromIn(toIn(parseFloat(customH) || 0, unit), nextUnit));
    setUnit(nextUnit);
    setCustomW(nextW);
    setCustomH(nextH);
    handleCustomChange(nextW, nextH, nextUnit);

    if (notchIn) {
      setNotchRaw({
        depth: String(round3(fromIn(notchIn.depthIn, nextUnit))),
        width: String(round3(fromIn(notchIn.widthIn, nextUnit))),
        radius: String(round3(fromIn(notchIn.radiusIn, nextUnit))),
      });
    }
  };

  const handleNotchChange = (field, value) => {
    const nextRaw = { ...notchRaw, [field]: value };
    setNotchRaw(nextRaw);

    const maxDepth = (acrossEdge || 12) - 0.1;
    const maxWidth = (alongEdge || 12) - 0.1;

    const depthIn = clamp(toIn(parseFloat(nextRaw.depth) || 0, unit), 0, maxDepth);
    const widthIn = clamp(toIn(parseFloat(nextRaw.width) || 0, unit), 0, maxWidth);
    // Radius can't be bigger than half the notch width or the notch depth
    const radiusIn = clamp(
      toIn(parseFloat(nextRaw.radius) || 0, unit),
      0,
      Math.min(widthIn / 2, depthIn)
    );

    const next = { depthIn, widthIn, radiusIn };
    setNotchIn(next);
    emitNotch(next);
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
        <div style={panelStyle}>
          <div style={panelTitleStyle}>
            <Sliders size={16} color="#8f7fe0" /> Custom Photo Dimensions
          </div>

          <div style={{ display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap" }}>
            <UnitSelector unit={unit} onChange={handleUnitChange} />

            <label style={labelStyle}>
              Width:
              <input
                type="number"
                step="0.1"
                min="0.5"
                max={MAX_BY_UNIT[unit]}
                value={customW}
                onChange={(e) => {
                  setCustomW(e.target.value);
                  handleCustomChange(e.target.value, customH, unit);
                }}
                style={inputStyle}
              />
            </label>

            <label style={labelStyle}>
              Height:
              <input
                type="number"
                step="0.1"
                min="0.5"
                max={MAX_BY_UNIT[unit]}
                value={customH}
                onChange={(e) => {
                  setCustomH(e.target.value);
                  handleCustomChange(customW, e.target.value, unit);
                }}
                style={inputStyle}
              />
            </label>
          </div>
        </div>
      )}

      {/* NEW: Notch panel, shown when the selected preset has a notch */}
      {presetNotch && notchIn && (
        <div style={panelStyle}>
          <div style={panelTitleStyle}>
            <Scissors size={16} color="#8f7fe0" /> Notch Dimensions
            <span style={{ fontWeight: 600, fontSize: 12, color: "#57536b" }}>
              ({notchEdge} edge, centered)
            </span>
          </div>

          <div style={{ display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap" }}>
            <UnitSelector unit={unit} onChange={handleUnitChange} />

            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={labelStyle}>Position:</span>
              <div style={{ display: "flex", background: "rgba(255,255,255,0.7)", borderRadius: "999px", padding: "2px" }}>
                {["bottom", "top", "left", "right"].map((edge) => (
                  <button
                    key={edge}
                    type="button"
                    onClick={() => handleEdgeChange(edge)}
                    style={{
                      padding: "4px 10px",
                      borderRadius: "999px",
                      border: "none",
                      fontSize: "12px",
                      fontWeight: 700,
                      textTransform: "capitalize",
                      background: notchEdge === edge ? "#8f7fe0" : "transparent",
                      color: notchEdge === edge ? "#ffffff" : "#57536b",
                      cursor: "pointer",
                    }}
                  >
                    {edge}
                  </button>
                ))}
              </div>
            </div>

            <label style={labelStyle}>
              Depth:
              <input
                type="number"
                step="0.01"
                min="0"
                max={MAX_BY_UNIT[unit]}
                value={notchRaw.depth}
                onChange={(e) => handleNotchChange("depth", e.target.value)}
                style={inputStyle}
              />
            </label>

            <label style={labelStyle}>
              Width:
              <input
                type="number"
                step="0.01"
                min="0"
                max={MAX_BY_UNIT[unit]}
                value={notchRaw.width}
                onChange={(e) => handleNotchChange("width", e.target.value)}
                style={inputStyle}
              />
            </label>

            <label style={labelStyle}>
              Corner radius:
              <input
                type="number"
                step="0.01"
                min="0"
                max={MAX_BY_UNIT[unit]}
                value={notchRaw.radius}
                onChange={(e) => handleNotchChange("radius", e.target.value)}
                style={inputStyle}
              />
            </label>
          </div>
        </div>
      )}
    </div>
  );
}