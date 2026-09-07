import { Trash2, HelpCircle, ShieldCheck, Moon, Sun } from "lucide-react";

export default function Header({ photoCount, onClearSession, onOpenInfo, theme, onToggleTheme }) {
  return (
    <header className="glass-card header-container" style={{ padding: "16px 24px", marginBottom: "24px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "16px" }}>
        
        {/* Brand logo & title */}
        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
          <img
            src={theme === "dark" ? "/printlay-logo-dark.svg" : "/printlay-logo.svg"}
            alt="PrintLay"
            style={{
              width: 52,
              height: 52,
              flexShrink: 0,
              filter: "drop-shadow(0 6px 12px rgba(109, 95, 232, 0.22))",
            }}
          />
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <h1 className="heading" style={{ margin: 0, fontSize: 24, fontWeight: 700, color: "#3d3856" }}>
                PrintLay
              </h1>
              <span
                style={{
                  background: "rgba(143, 127, 224, 0.15)",
                  color: "#7c6dd8",
                  fontSize: 11,
                  fontWeight: 700,
                  padding: "3px 10px",
                  borderRadius: "999px",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                }}
              >
                v1.0 Pro
              </span>
            </div>
            <p style={{ margin: 0, fontSize: 13, color: "#7c7893" }}>
              Bulk Photo Auto-Cropper & Print-Ready Sheet Layout Tool
            </p>
          </div>
        </div>

        {/* Info badges & Actions */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <button
            type="button"
            onClick={onToggleTheme}
            className="theme-toggle"
            aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
            title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
          >
            {theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}
            <span>{theme === "dark" ? "Light" : "Dark"}</span>
          </button>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              fontSize: "12px",
              fontWeight: 600,
              color: "#5b8a6a",
              background: "rgba(91, 138, 106, 0.1)",
              padding: "6px 14px",
              borderRadius: "999px",
            }}
            title="All image processing happens locally in your browser. No files are uploaded to any server."
          >
            <ShieldCheck size={14} />
            100% In-Browser Privacy
          </div>

          {photoCount > 0 && (
            <button
              onClick={onClearSession}
              className="bubble-button-danger"
              style={{
                padding: "8px 16px",
                fontSize: "13px",
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
              title="Clear all uploaded photos and reset layout session"
            >
              <Trash2 size={14} />
              Reset Batch ({photoCount})
            </button>
          )}

          <button
            onClick={onOpenInfo}
            className="bubble-button-secondary"
            style={{
              padding: "8px 14px",
              fontSize: "13px",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <HelpCircle size={15} />
            Guide
          </button>
        </div>
      </div>
    </header>
  );
}
