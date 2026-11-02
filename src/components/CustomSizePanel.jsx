import { useState, useEffect } from "react";

const UNITS = ["in", "cm", "mm"];
const TO_INCHES = { in: 1, cm: 1 / 2.54, mm: 1 / 25.4 };
const SHAPES = [
  { id: "rect", label: "Rectangle" },
  { id: "rounded", label: "Rounded" },
  { id: "circle", label: "Circle" },
];

const fromInches = (inches, unit) => +(inches / TO_INCHES[unit]).toFixed(3);
const toInches = (val, unit) => val * TO_INCHES[unit];

const pillGroup = {
  display: "flex",
  gap: 4,
  padding: 3,
  borderRadius: 999,
  background: "#d9d7e3",
};

const pillBtn = (active) => ({
  flex: 1,
  padding: "5px 10px",
  borderRadius: 999,
  border: "none",
  cursor: "pointer",
  fontSize: 12,
  fontWeight: 700,
  color: active ? "#fff" : "#57536b",
  background: active ? "linear-gradient(135deg, #8f7fe0, #b78ee0)" : "transparent",
});

const numberInput = {
  width: 80,
  padding: "7px 10px",
  borderRadius: 12,
  border: "1px solid rgba(143,127,224,0.4)",
  background: "rgba(255,255,255,0.06)",
  color: "#fff",
  fontWeight: 700,
  fontSize: 14,
  outline: "none",
};

const labelStyle = { fontSize: 13, color: "#9590a8", minWidth: 52 };

/**
 * value:    { widthIn, heightIn, shape, cornerRadiusIn }   (always inches)
 * onChange: (nextValue) => void
 */
export default function CustomSizePanel({ value, onChange }) {
  const { widthIn, heightIn, shape = "rect", cornerRadiusIn = 0.5 } = value;

  const [unit, setUnit] = useState("in");
  const [wDraft, setWDraft] = useState(String(fromInches(widthIn, "in")));
  const [hDraft, setHDraft] = useState(String(fromInches(heightIn, "in")));

  // Keep the text boxes in sync when the unit or outside values change,
  // without clobbering something half-typed like "3."
  useEffect(() => {
    if (toInches(parseFloat(wDraft), unit) !== widthIn) {
      setWDraft(String(fromInches(widthIn, unit)));
    }
    if (toInches(parseFloat(hDraft), unit) !== heightIn) {
      setHDraft(String(fromInches(heightIn, unit)));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unit, widthIn, heightIn]);

  const update = (patch) => onChange({ ...value, ...patch });

  const handleWidth = (text) => {
    setWDraft(text);
    const n = parseFloat(text);
    if (!(n > 0)) return;
    const w = toInches(n, unit);
    // A circle stays round: height follows width
    update(shape === "circle" ? { widthIn: w, heightIn: w } : { widthIn: w });
  };

  const handleHeight = (text) => {
    setHDraft(text);
    const n = parseFloat(text);
    if (!(n > 0)) return;
    const h = toInches(n, unit);
    update(shape === "circle" ? { widthIn: h, heightIn: h } : { heightIn: h });
  };

  const handleShape = (id) => {
    // Picking circle makes it a true circle using the current width
    update(id === "circle" ? { shape: id, heightIn: widthIn } : { shape: id });
  };

  const radiusInUnit = fromInches(cornerRadiusIn, unit);

  return (
    <div
      style={{
        padding: 16,
        borderRadius: 18,
        border: "1px solid rgba(143,127,224,0.25)",
        background: "rgba(255,255,255,0.03)",
      }}
    >
      <div style={{ fontSize: 14, fontWeight: 700, color: "#9590a8", marginBottom: 12 }}>
        Custom Photo Dimensions
      </div>

      {/* Unit toggle */}
      <div style={{ ...pillGroup, width: 150 }}>
        {UNITS.map((u) => (
          <button key={u} type="button" onClick={() => setUnit(u)} style={pillBtn(unit === u)}>
            {u}
          </button>
        ))}
      </div>

      {/* Width / Height */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 14 }}>
        <span style={labelStyle}>Width:</span>
        <input
          type="number"
          min="0"
          step="any"
          value={wDraft}
          onChange={(e) => handleWidth(e.target.value)}
          style={numberInput}
        />
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 10 }}>
        <span style={labelStyle}>Height:</span>
        <input
          type="number"
          min="0"
          step="any"
          value={hDraft}
          onChange={(e) => handleHeight(e.target.value)}
          style={numberInput}
        />
      </div>

      {/* Shape */}
      <div style={{ marginTop: 16 }}>
        <div style={{ fontSize: 12, color: "#9590a8", marginBottom: 6 }}>Shape</div>
        <div style={pillGroup}>
          {SHAPES.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => handleShape(s.id)}
              style={pillBtn(shape === s.id)}
            >
              {s.label}
            </button>
          ))}
        </div>

        {shape === "rounded" && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 10 }}>
            <span style={{ fontSize: 13, color: "#9590a8" }}>Corner radius</span>
            <input
              type="number"
              min="0"
              step="any"
              value={radiusInUnit}
              onChange={(e) =>
                update({
                  cornerRadiusIn: Math.max(0, toInches(parseFloat(e.target.value) || 0, unit)),
                })
              }
              style={{ ...numberInput, width: 70 }}
            />
            <span style={{ fontSize: 12, color: "#9590a8" }}>{unit}</span>
          </div>
        )}

        {shape === "circle" && (
          <div style={{ fontSize: 11, color: "#9590a8", marginTop: 8 }}>
            Width and height stay equal so it's a true circle.
          </div>
        )}
      </div>
    </div>
  );
}