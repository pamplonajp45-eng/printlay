import React from "react";
import { Sparkles, Trash2, HelpCircle, ShieldCheck, Printer } from "lucide-react";

export default function Header({ photoCount, onClearSession, onOpenInfo }) {
  return (
    <header className="glass-card header-container" style={{ padding: "16px 24px", marginBottom: "24px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "16px" }}>
        
        {/* Brand logo & title */}
        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 18,
              background: "linear-gradient(135deg, #a9a0f0 0%, #8f7fe0 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 8px 20px rgba(143, 127, 224, 0.4)",
            }}
          >
            <Sparkles size={24} color="#ffffff" />
          </div>
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
