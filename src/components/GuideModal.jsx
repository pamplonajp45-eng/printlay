import React from "react";
import { X, CheckCircle2, Sparkles, Printer, Crop, ShieldCheck } from "lucide-react";

export default function GuideModal({ onClose }) {
  return (
    <div className="modal-backdrop">
      <div className="glass-card modal-content" style={{ width: "90%", maxWidth: "600px", padding: "28px" }}>
        
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 14,
                background: "linear-gradient(135deg, #a9a0f0, #8f7fe0)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Sparkles size={20} color="#ffffff" />
            </div>
            <h2 className="heading" style={{ margin: 0, fontSize: 20, color: "#3d3856" }}>
              How PrintLay Works
            </h2>
          </div>
          <button onClick={onClose} style={{ border: "none", background: "none", cursor: "pointer", color: "#7c7893" }}>
            <X size={20} />
          </button>
        </div>

        {/* Guide Steps */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginBottom: "24px" }}>
          
          <div style={{ display: "flex", gap: "14px" }}>
            <div style={{ fontWeight: 800, color: "#8f7fe0", fontSize: 16, width: 24 }}>1.</div>
            <div>
              <h4 style={{ margin: "0 0 4px", fontSize: 15, color: "#3d3856" }}>Upload Photos in Bulk</h4>
              <p style={{ margin: 0, fontSize: 13, color: "#7c7893" }}>
                Drag and drop 1 to 50+ photos (JPG, PNG, WEBP, or iPhone HEIC). They are loaded instantly into your browser.
              </p>
            </div>
          </div>

          <div style={{ display: "flex", gap: "14px" }}>
            <div style={{ fontWeight: 800, color: "#8f7fe0", fontSize: 16, width: 24 }}>2.</div>
            <div>
              <h4 style={{ margin: "0 0 4px", fontSize: 15, color: "#3d3856" }}>Pick Photo & Paper Presets</h4>
              <p style={{ margin: 0, fontSize: 13, color: "#7c7893" }}>
                Select target photo print size (Polaroid Classic, Polaroid Mini, ID 2x2, Passport, Wallet 2R-6R, or Custom W×H).
                Pick layout paper (A4, Letter, 4R, 6R, or Continuous strip).
              </p>
            </div>
          </div>

          <div style={{ display: "flex", gap: "14px" }}>
            <div style={{ fontWeight: 800, color: "#8f7fe0", fontSize: 16, width: 24 }}>3.</div>
            <div>
              <h4 style={{ margin: "0 0 4px", fontSize: 15, color: "#3d3856" }}>Auto-Crop & Optional Nudge</h4>
              <p style={{ margin: 0, fontSize: 13, color: "#7c7893" }}>
                Smart cover-crop is applied to all photos automatically. Click any thumbnail to nudge, pan, zoom, or rotate individually if needed.
              </p>
            </div>
          </div>

          <div style={{ display: "flex", gap: "14px" }}>
            <div style={{ fontWeight: 800, color: "#8f7fe0", fontSize: 16, width: 24 }}>4.</div>
            <div>
              <h4 style={{ margin: "0 0 4px", fontSize: 15, color: "#3d3856" }}>Export & Print</h4>
              <p style={{ margin: 0, fontSize: 13, color: "#7c7893" }}>
                Download a print-ready multi-page PDF or PNGs, complete with cut-guide lines. When printing from your computer, set scale to <strong>100% (Actual Size)</strong>.
              </p>
            </div>
          </div>

        </div>

        {/* Privacy Note */}
        <div
          style={{
            background: "rgba(91, 138, 106, 0.1)",
            border: "1px solid rgba(91, 138, 106, 0.2)",
            borderRadius: "16px",
            padding: "12px 16px",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            marginBottom: "20px",
          }}
        >
          <ShieldCheck size={20} color="#5b8a6a" />
          <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: "#486e54" }}>
            Zero server uploads. Your customer photos remain 100% private in your browser memory and IndexedDB storage.
          </p>
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <button onClick={onClose} className="bubble-button-primary" style={{ padding: "10px 24px", fontSize: 14 }}>
            Got It!
          </button>
        </div>

      </div>
    </div>
  );
}
