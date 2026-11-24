import { BLEED_STEP_MM, MAX_BLEED_MM, MAX_CUT_INSET_MM, CUT_INSET_STEP_MM } from "../lib/bleedGeometry";

/**
 * Plain markup with pl-* class names, so you can restyle it to match the
 * lavender glassmorphism panels. Props: settings + update from useBleedSettings.
 */
export default function BleedControls({ settings, update, onCalibrate, capacity }) {
  const slider = (label, key, min, max, step, unit = "mm") => (
    <label className="pl-field">
      <span className="pl-field__label">
        {label}: <strong>{settings[key]} {unit}</strong>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={settings[key]}
        onChange={(e) => update({ [key]: Number(e.target.value) })}
      />
    </label>
  );

  const toggle = (label, key) => (
    <label className="pl-toggle">
      <input type="checkbox" checked={settings[key]} onChange={(e) => update({ [key]: e.target.checked })} />
      <span>{label}</span>
    </label>
  );

  return (
    <section className="pl-bleed-controls">
      <h3>Bleed &amp; cut</h3>
      {slider("Bleed", "bleedMm", 0, MAX_BLEED_MM, BLEED_STEP_MM)}
      {slider("Cut inset", "cutInsetMm", 0, MAX_CUT_INSET_MM, CUT_INSET_STEP_MM)}
      <p className="pl-hint">Spacing and margin come from Photo Spacing and Page Margin above.</p>
      {toggle("Show bleed edge", "showBleed")}
      {toggle("Show cut guide", "showCutGuide")}
      {toggle("Allow 90° rotation", "allowRotate")}
      {typeof capacity === "number" && <p className="pl-hint">{capacity} per sheet</p>}
      <button type="button" className="pl-btn" onClick={onCalibrate} title="Prints one A4 page with this shape at 0, 1, 1.5 and 2 mm bleed. Cut it once on your Silhouette and use the smallest bleed that shows no white edge.">
        Print bleed calibration sheet
      </button>
    </section>
  );
}