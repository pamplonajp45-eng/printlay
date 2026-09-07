import { FileText } from "lucide-react";

/**
 * Controls for the page-level label (e.g. tracking number / waybill note) that
 * gets printed at the bottom-right of the paper page margin area. Used in the
 * Layout controls drawer.
 */
export default function PageLabelControls({
  pageLabel = { text: "", position: "bottom-right", fontSize: 9, enabled: false },
  onChangePageLabel,
}) {
  const update = (patch) =>
    typeof onChangePageLabel === "function" &&
    onChangePageLabel({ ...pageLabel, ...patch });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
      <label
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          fontSize: 13,
          fontWeight: 700,
          color: "#3d3856",
          cursor: "pointer",
        }}
      >
        <input
          type="checkbox"
          checked={pageLabel.enabled}
          onChange={(e) => update({ enabled: e.target.checked })}
          style={{ width: 16, height: 16, accentColor: "#8f7fe0" }}
        />
        <FileText size={14} color="#8f7fe0" /> Page Label (Tracking / Waybill)
      </label>

      {pageLabel.enabled && (
        <input
          type="text"
          value={pageLabel.text}
          onChange={(e) => update({ text: e.target.value })}
          placeholder="e.g. WAYBILL # 1234-5678"
          style={{
            width: "100%",
            padding: "8px 10px",
            borderRadius: "10px",
            border: "1.5px solid rgba(143,127,224,0.3)",
            background: "rgba(143,127,224,0.06)",
            fontSize: 12.5,
            fontWeight: 600,
            color: "#3d3856",
            outline: "none",
            boxSizing: "border-box",
          }}
        />
      )}
    </div>
  );
}