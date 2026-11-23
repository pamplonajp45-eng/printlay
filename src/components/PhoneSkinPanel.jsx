import { useState } from "react";
import { Smartphone, RotateCcw, Plus, Trash2, Ruler, ChevronRight } from "lucide-react";
import {
  PHONE_MODELS,
  PHONE_BRANDS,
  SKIN_STYLES,
  DEFAULT_PHONE_SKIN,
  resolvePhoneModel,
  isPhoneModelEdited,
  buildPhoneSkinShape,
  defaultWrapMm,
} from "../lib/phoneSkin";
import { shapeToSvgPath } from "../lib/bleedGeometry";

const ACCENT = "#8f7fe0";
const INK = "var(--pl-ink)";
const MUTED = "var(--pl-muted)";

const panelStyle = {
  background: "rgba(143, 127, 224, 0.08)",
  border: "1px solid rgba(143, 127, 224, 0.2)",
  borderRadius: "18px",
  padding: "16px",
  marginTop: "12px",
  display: "flex",
  flexDirection: "column",
  gap: 12,
};

const labelStyle = { fontSize: 12, fontWeight: 600, color: MUTED };

const inputStyle = {
  width: "100%",
  boxSizing: "border-box",
  padding: "6px 8px",
  borderRadius: "10px",
  border: "1px solid rgba(0,0,0,0.12)",
  fontSize: "13px",
  fontWeight: 700,
  background: "#fff",
  color: INK,
};

const pillGroup = {
  display: "flex",
  background: "var(--pl-surface)",
  borderRadius: "999px",
  padding: "2px",
  flexWrap: "wrap",
};

const pillBtn = (active) => ({
  flex: 1,
  padding: "5px 6px",
  borderRadius: "999px",
  border: "none",
  fontSize: "12px",
  fontWeight: 700,
  whiteSpace: "nowrap",
  background: active ? ACCENT : "transparent",
  color: active ? "#ffffff" : MUTED,
  cursor: "pointer",
});

const smallBtn = {
  display: "inline-flex",
  alignItems: "center",
  gap: 4,
  padding: "4px 10px",
  borderRadius: "999px",
  border: "1px solid rgba(143, 127, 224, 0.35)",
  background: "var(--pl-surface)",
  color: "var(--pl-accent-text)",
  fontSize: 12,
  fontWeight: 700,
  cursor: "pointer",
};

const iconBtn = {
  border: "none",
  background: "transparent",
  color: "var(--pl-danger)",
  cursor: "pointer",
  padding: 2,
  display: "inline-flex",
};

const cardStyle = {
  display: "flex",
  flexDirection: "column",
  gap: 6,
  padding: 8,
  borderRadius: 12,
  background: "var(--pl-surface-soft)",
  border: "1px solid rgba(143, 127, 224, 0.15)",
};

const cardHead = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  fontSize: 12,
  fontWeight: 700,
  color: MUTED,
};

const fmt = (n) => String(+(+n).toFixed(2));

/**
 * Number input that keeps what the user is typing ("7.", "") while only
 * sending finite numbers up. Re-syncs when the value changes from outside.
 */
function NumField({ label, value, onChange, min = 0, max = 400, step = 0.1, title }) {
  const [raw, setRaw] = useState(fmt(value));
  const [seen, setSeen] = useState(value);
  if (value !== seen) {
    setSeen(value);
    if (parseFloat(raw) !== value) setRaw(fmt(value));
  }
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 3, minWidth: 0 }} title={title}>
      {label && <span style={labelStyle}>{label}</span>}
      <input
        type="number"
        inputMode="decimal"
        step={step}
        min={min}
        max={max}
        value={raw}
        onChange={(e) => {
          setRaw(e.target.value);
          const n = parseFloat(e.target.value);
          if (Number.isFinite(n)) onChange(Math.max(min, Math.min(max, n)));
        }}
        onBlur={() => setRaw(fmt(value))}
        className="pl-num-input"
        style={{ ...inputStyle, padding: "6px 6px" }}
      />
    </label>
  );
}

const grid = (cols) => ({
  display: "grid",
  gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
  gap: 8,
  alignItems: "end",
});

/** Back-view drawing of the template: cut line, fold lines and overall size. */
function TemplatePreview({ shape }) {
  const pad = 6;
  const W = shape.widthMm;
  const H = shape.heightMm;
  const d = shapeToSvgPath({ outer: shape.outer, holes: shape.holes });
  const b = shape.back;
  return (
    <svg
      viewBox={`${-pad} ${-pad} ${W + pad * 2} ${H + pad * 2 + 10}`}
      role="img"
      aria-label={`Template outline, ${W.toFixed(1)} by ${H.toFixed(1)} millimetres`}
      style={{ width: "100%", maxHeight: 300, display: "block" }}
    >
      <path d={d} fill="rgba(143, 127, 224, 0.22)" fillRule="evenodd" stroke={ACCENT} strokeWidth={0.5} />
      {shape.wrapMm > 0 && (
        <rect
          x={b.x}
          y={b.y}
          width={b.w}
          height={b.h}
          rx={b.r}
          fill="none"
          stroke="#9b97b0"
          strokeWidth={0.35}
          strokeDasharray="1.6 1.2"
        />
      )}
      <text x={W / 2} y={b.y + b.h / 2} textAnchor="middle" fontSize={5} fontWeight={700} style={{ fill: "var(--pl-faint)" }}>
        BACK
      </text>
      <text x={W / 2} y={H + pad + 5} textAnchor="middle" fontSize={5.2} fontWeight={700} style={{ fill: INK }}>
        {W.toFixed(1)} × {H.toFixed(1)} mm
      </text>
    </svg>
  );
}

const EDGE_LABELS = { left: "Left", right: "Right", top: "Top", bottom: "Bottom" };

/**
 * Phone back-skin settings for the Photo Size panel.
 * value / onChange: the phone skin state (see DEFAULT_PHONE_SKIN).
 */
export default function PhoneSkinPanel({ value, onChange }) {
  const state = { ...DEFAULT_PHONE_SKIN, ...(value || {}) };
  const model = resolvePhoneModel(state);
  const edited = isPhoneModelEdited(state);
  const [showTune, setShowTune] = useState(false);

  const shape = buildPhoneSkinShape(model, state);

  const set = (patch) => onChange({ ...state, ...patch });

  // Fine-tuning writes a full copy of the model under edits[modelId]
  const editModel = (fn) => {
    const next = structuredClone(model);
    fn(next);
    onChange({ ...state, edits: { ...state.edits, [state.modelId]: next } });
  };
  const resetModel = () => {
    const edits = { ...state.edits };
    delete edits[state.modelId];
    onChange({ ...state, edits });
  };

  const autoWrap = defaultWrapMm(model.body.t);
  const wrapOff = state.style === "back";
  const sourceText =
    model.bodySource === "official"
      ? "official spec"
      : model.bodySource === "published"
        ? "published spec"
        : model.bodySource === "custom"
          ? "enter your phone's size"
          : "estimated";

  return (
    <div style={panelStyle}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, fontWeight: 700, color: INK }}>
        <Smartphone size={16} color={ACCENT} /> Phone Skin Template
      </div>

      {/* Model */}
      <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <span style={labelStyle}>Phone model</span>
        <select
          value={state.modelId}
          onChange={(e) => set({ modelId: e.target.value })}
          style={{ ...inputStyle, fontWeight: 600, cursor: "pointer" }}
        >
          {PHONE_BRANDS.map((brand) => (
            <optgroup key={brand} label={brand}>
              {PHONE_MODELS.filter((m) => m.brand === brand).map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                  {state.edits?.[m.id] ? " (edited)" : ""}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
      </label>

      <div style={{ fontSize: 12, color: MUTED, lineHeight: 1.45 }}>
        Body {fmt(model.body.w)} × {fmt(model.body.h)} × {fmt(model.body.t)} mm{" "}
        <span style={{ color: "var(--pl-faint)" }}>({edited ? "fine-tuned" : sourceText})</span>
        {edited && (
          <button type="button" onClick={resetModel} style={{ ...smallBtn, marginLeft: 8, padding: "2px 8px" }}>
            <RotateCcw size={12} /> Reset
          </button>
        )}
      </div>

      {/* Coverage */}
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <span style={labelStyle}>Coverage</span>
        <div style={pillGroup}>
          {SKIN_STYLES.map((s) => (
            <button
              key={s.id}
              type="button"
              title={s.description}
              onClick={() => set({ style: s.id })}
              style={pillBtn(state.style === s.id)}
            >
              {s.name}
            </button>
          ))}
        </div>
      </div>

      {/* Wrap settings */}
      <div style={grid(3)}>
        <div style={{ opacity: wrapOff ? 0.45 : 1, pointerEvents: wrapOff ? "none" : "auto" }}>
          <NumField
            label="Wrap (mm)"
            value={state.wrapMm ?? autoWrap}
            min={1}
            max={30}
            onChange={(n) => set({ wrapMm: n })}
            title="How far the side flaps fold over the frame. Auto = thickness − 2 mm."
          />
        </div>
        <NumField
          label="Clearance"
          value={state.clearanceMm}
          min={0}
          max={5}
          step={0.1}
          onChange={(n) => set({ clearanceMm: n })}
          title="Extra gap around the camera, buttons and ports (mm)"
        />
        <div style={{ opacity: wrapOff ? 0.45 : 1, pointerEvents: wrapOff ? "none" : "auto" }}>
          <NumField
            label="Corner gap"
            value={state.cornerGapMm ?? model.body.r}
            min={0}
            max={40}
            onChange={(n) => set({ cornerGapMm: n })}
            title="Where the side flaps stop before each corner (mm). Auto = corner radius."
          />
        </div>
      </div>
      {(state.wrapMm != null || state.cornerGapMm != null) && !wrapOff && (
        <button
          type="button"
          onClick={() => set({ wrapMm: null, cornerGapMm: null })}
          style={{ ...smallBtn, alignSelf: "flex-start" }}
        >
          <RotateCcw size={12} /> Auto wrap &amp; corners
        </button>
      )}

      {/* Preview */}
      <div
        style={{
          background: "var(--pl-surface)",
          borderRadius: 14,
          padding: 10,
          border: "1px solid rgba(143, 127, 224, 0.15)",
        }}
      >
        <TemplatePreview shape={shape} />
        <div style={{ fontSize: 11, color: "var(--pl-faint)", textAlign: "center", marginTop: 4 }}>
          Seen from the back (camera side). Dashed line = fold.
        </div>
      </div>

      <div
        style={{
          display: "flex",
          gap: 8,
          fontSize: 12,
          lineHeight: 1.45,
          color: "var(--pl-warn-text)",
          background: "rgba(255, 196, 0, 0.12)",
          border: "1px solid rgba(214, 160, 0, 0.3)",
          borderRadius: 12,
          padding: "8px 10px",
        }}
      >
        <Ruler size={16} style={{ flexShrink: 0, marginTop: 1 }} />
        <span>
          Camera, button and port positions are estimates. Measure your phone, fine-tune below, and test-cut one on
          plain paper before using vinyl.
        </span>
      </div>

      {/* Fine-tune */}
      <button
        type="button"
        onClick={() => setShowTune((o) => !o)}
        aria-expanded={showTune}
        style={{ ...smallBtn, alignSelf: "flex-start" }}
      >
        <ChevronRight size={13} style={{ transform: showTune ? "rotate(90deg)" : "none", transition: "transform 150ms" }} />
        Fine-tune measurements (mm)
      </button>

      {showTune && (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <section style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <span style={{ ...labelStyle, color: INK }}>Body</span>
            <div style={{ ...grid(4), gap: 6 }}>
              {[
                ["w", "Width"],
                ["h", "Height"],
                ["t", "Thick"],
                ["r", "Corner"],
              ].map(([k, label]) => (
                <NumField
                  key={k}
                  label={label}
                  value={model.body[k]}
                  min={k === "r" ? 0 : 1}
                  max={k === "t" ? 30 : 400}
                  onChange={(n) => editModel((m) => (m.body[k] = n))}
                />
              ))}
            </div>
          </section>

          <section style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <span style={{ ...labelStyle, color: INK }}>
              Camera windows <span style={{ fontWeight: 500 }}>(from the back's top-left corner)</span>
            </span>
            {(model.cameras || []).map((cam, i) => (
              <div key={i} style={cardStyle}>
                <div style={cardHead}>
                  <span>Window {i + 1}</span>
                  <button
                    type="button"
                    title="Remove this window"
                    aria-label={`Remove window ${i + 1}`}
                    onClick={() => editModel((m) => m.cameras.splice(i, 1))}
                    style={iconBtn}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
                <div style={{ ...grid(5), gap: 4 }}>
                  {[
                    ["x", "X", "From the back's left edge"],
                    ["y", "Y", "From the back's top edge"],
                    ["w", "W", "Width"],
                    ["h", "H", "Height"],
                    ["r", "R", "Corner radius (half the width = circle)"],
                  ].map(([k, label, title]) => (
                    <NumField
                      key={k}
                      label={label}
                      title={title}
                      value={cam[k]}
                      onChange={(n) => editModel((m) => (m.cameras[i][k] = n))}
                    />
                  ))}
                </div>
              </div>
            ))}
            <button
              type="button"
              onClick={() =>
                editModel((m) => (m.cameras = [...(m.cameras || []), { x: 8, y: 8, w: 10, h: 10, r: 5 }]))
              }
              style={{ ...smallBtn, alignSelf: "flex-start" }}
            >
              <Plus size={12} /> Add window
            </button>
          </section>

          <section style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <span style={{ ...labelStyle, color: INK }}>
              Side cut-outs{" "}
              <span style={{ fontWeight: 500 }}>
                (seen from the back: Android buttons are on the Left edge)
              </span>
            </span>
            {(model.edges || []).map((e, i) => (
              <div key={i} style={cardStyle}>
                <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                  <input
                    type="text"
                    aria-label="Cut-out name"
                    value={e.label || ""}
                    onChange={(ev) => editModel((m) => (m.edges[i].label = ev.target.value))}
                    style={{ ...inputStyle, flex: 1, minWidth: 0, fontWeight: 600 }}
                  />
                  <select
                    aria-label="Edge"
                    value={e.edge}
                    onChange={(ev) => editModel((m) => (m.edges[i].edge = ev.target.value))}
                    style={{ ...inputStyle, width: 84, flexShrink: 0, padding: "6px 4px", fontWeight: 600 }}
                  >
                    {Object.entries(EDGE_LABELS).map(([k, label]) => (
                      <option key={k} value={k}>
                        {label}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    title="Remove this cut-out"
                    aria-label={`Remove ${e.label || "cut-out"}`}
                    onClick={() => editModel((m) => m.edges.splice(i, 1))}
                    style={iconBtn}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
                <div style={{ ...grid(3), gap: 6 }}>
                  <NumField
                    label="From"
                    title="Start along the edge: from the top (left/right edges) or from the left (top/bottom)"
                    value={e.from}
                    onChange={(n) => editModel((m) => (m.edges[i].from = n))}
                  />
                  <NumField
                    label="Length"
                    title="Length along the edge"
                    value={e.len}
                    onChange={(n) => editModel((m) => (m.edges[i].len = n))}
                  />
                  <NumField
                    label="Size"
                    title="Size across the phone's thickness"
                    value={e.h}
                    max={30}
                    onChange={(n) => editModel((m) => (m.edges[i].h = n))}
                  />
                </div>
              </div>
            ))}
            <button
              type="button"
              onClick={() =>
                editModel(
                  (m) => (m.edges = [...(m.edges || []), { label: "Button", edge: "left", from: 40, len: 12, h: 3 }]),
                )
              }
              style={{ ...smallBtn, alignSelf: "flex-start" }}
            >
              <Plus size={12} /> Add cut-out
            </button>
          </section>
        </div>
      )}
    </div>
  );
}
