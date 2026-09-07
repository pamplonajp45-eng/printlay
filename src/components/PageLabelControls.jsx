import { FileText } from "lucide-react";

/**
 * Controls for the page-level label (e.g. tracking number / waybill note) that
 * gets printed at the bottom-right of the paper page margin area. Used in the
 * Layout controls drawer.
 */
// Default free-form position (fraction of page) matching the old bottom-right
const DEFAULT_X = 0.95;
const DEFAULT_Y = 0.96;

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
        <>
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

        {/* Adjustable X / Y position of the label on the page */}
        <div
          style={{
            background: "rgba(143, 127, 224, 0.06)",
            padding: "10px 12px",
            borderRadius: "12px",
            display: "flex",
            flexDirection: "column",
            gap: "8px",
          }}
        >
          {/* Horizontal (X) adjust bar */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, fontWeight: 600, color: "#57536b", marginBottom: 4 }}>
              <span>X Position:</span>
              <span>{Math.round((pageLabel.x ?? DEFAULT_X) * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              step="1"
              value={Math.round((pageLabel.x ?? DEFAULT_X) * 100)}
              onChange={(e) =>
                update({
                  x: parseInt(e.target.value, 10) / 100,
                  y: pageLabel.y ?? DEFAULT_Y,
                })
              }
              style={{ width: "100%", accentColor: "#8f7fe0" }}
            />
          </div>

          {/* Vertical (Y) adjust bar */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, fontWeight: 600, color: "#57536b", marginBottom: 4 }}>
              <span>Y Position:</span>
              <span>{Math.round((pageLabel.y ?? DEFAULT_Y) * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              step="1"
              value={Math.round((pageLabel.y ?? DEFAULT_Y) * 100)}
              onChange={(e) =>
                update({
                  x: pageLabel.x ?? DEFAULT_X,
                  y: parseInt(e.target.value, 10) / 100,
                })
              }
              style={{ width: "100%", accentColor: "#8f7fe0" }}
            />
          </div>

          {/* Text size */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, fontWeight: 600, color: "#57536b", marginBottom: 4 }}>
              <span>Text Size:</span>
              <span>{pageLabel.fontSize ?? 9}pt</span>
            </div>
            <input
              type="range"
              min="6"
              max="18"
              step="1"
              value={pageLabel.fontSize ?? 9}
              onChange={(e) => update({ fontSize: parseInt(e.target.value, 10) })}
              style={{ width: "100%", accentColor: "#8f7fe0" }}
            />
          </div>
        </div>
        </>
      )}
    </div>
  );
}