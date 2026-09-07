import { useState, useEffect, useRef } from "react";
import {
  Trash2,
  HelpCircle,
  ShieldCheck,
  Moon,
  Sun,
  Share2,
  FileDown,
  Archive,
  Printer,
  Loader2,
  RefreshCw,
} from "lucide-react";

export default function Header({
  photoCount,
  onClearSession,
  onOpenInfo,
  theme,
  onToggleTheme,
  sheets,
  isGenerating,
  onGenerateLayout,
  onDownloadPdf,
  onDownloadZip,
  onPrint,
}) {
  const [shareOpen, setShareOpen] = useState(false);
  const [busyAction, setBusyAction] = useState(null);
  const shareRef = useRef(null);

  // Close the Share dropdown when clicking outside it
  useEffect(() => {
    if (!shareOpen) return;
    const handleClick = (e) => {
      if (shareRef.current && !shareRef.current.contains(e.target)) {
        setShareOpen(false);
      }
    };
    document.addEventListener("mouseup", handleClick);
    return () => document.removeEventListener("mouseup", handleClick);
  }, [shareOpen]);

  const hasSheets = sheets && sheets.length > 0;

  const runAction = async (action, fn) => {
    setBusyAction(action);
    try {
      await fn();
    } catch (err) {
      console.error(action, "failed:", err);
    } finally {
      setBusyAction(null);
    }
  };

  return (
    <header
      className="glass-card header-container"
      style={{ padding: "16px 24px", marginBottom: "24px", position: "relative", zIndex: 400 }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "16px",
        }}
      >
        {/* Brand logo & title */}
        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
          <img
            src={
              theme === "dark"
                ? "/printlay-logo-dark.svg"
                : "/printlay-logo.svg"
            }
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
              <h1
                className="heading"
                style={{
                  margin: 0,
                  fontSize: 24,
                  fontWeight: 700,
                  color: "#3d3856",
                }}
              >
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

          {/* Share dropdown with Page Label (tracking / waybill) controls */}
          <div ref={shareRef} style={{ position: "relative" }}>
            <button
              onClick={() => setShareOpen((open) => !open)}
              className="bubble-button-accent"
              style={{
                padding: "8px 14px",
                fontSize: "13px",
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
              title="Share / add page label (tracking number, waybill note)"
            >
              <Share2 size={15} />
              Share
              <span style={{ fontSize: 11, opacity: 0.75 }}>▾</span>
            </button>

            {shareOpen && (
              <div
                className="glass-card share-dropdown"
                style={{
                  position: "absolute",
                  top: "calc(100% + 8px)",
                  right: 0,
                  width: 272,
                  padding: "14px 16px",
                  zIndex: 210,
                  boxShadow: "0 14px 40px rgba(99, 91, 166, 0.35)",
                }}
              >
                <h4
                  className="heading"
                  style={{
                    margin: "0 0 12px",
                    fontSize: 14,
                    color: "#3d3856",
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <Share2 size={15} color="#8f7fe0" /> Export & Share
                </h4>

                {/* Generate / Re-generate Layout */}
                <button
                  type="button"
                  disabled={photoCount === 0 || isGenerating}
                  onClick={() => runAction("generate", onGenerateLayout)}
                  className="bubble-button-accent"
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    fontSize: 13,
                    fontWeight: 700,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                  }}
                >
                  {isGenerating || busyAction === "generate" ? (
                    <Loader2 className="spinner" size={15} />
                  ) : hasSheets ? (
                    <RefreshCw size={15} />
                  ) : null}
                  {isGenerating || busyAction === "generate"
                    ? "Laying out..."
                    : hasSheets
                      ? "Re-Generate Layout"
                      : `Generate Layout (${photoCount})`}
                </button>

                {hasSheets && (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "8px",
                      marginTop: "12px",
                      paddingTop: "12px",
                      borderTop: "1px solid rgba(0,0,0,0.08)",
                    }}
                  >
                    <button
                      type="button"
                      disabled={busyAction === "pdf"}
                      onClick={() => runAction("pdf", onDownloadPdf)}
                      className="bubble-button-secondary"
                      style={{
                        width: "100%",
                        padding: "10px 12px",
                        fontSize: 13,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 8,
                      }}
                    >
                      {busyAction === "pdf" ? (
                        <Loader2 className="spinner" size={15} />
                      ) : (
                        <FileDown size={15} />
                      )}
                      {busyAction === "pdf" ? "Building PDF..." : "Download PDF"}
                    </button>

                    <button
                      type="button"
                      disabled={busyAction === "zip"}
                      onClick={() => runAction("zip", onDownloadZip)}
                      className="bubble-button-secondary"
                      style={{
                        width: "100%",
                        padding: "10px 12px",
                        fontSize: 13,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 8,
                      }}
                    >
                      {busyAction === "zip" ? (
                        <Loader2 className="spinner" size={15} />
                      ) : sheets.length === 1 ? (
                        <FileDown size={15} />
                      ) : (
                        <Archive size={15} />
                      )}
                      {busyAction === "zip"
                        ? "Zipping PNGs..."
                        : sheets.length === 1
                          ? "Download PNG"
                          : "Download PNGs (ZIP)"}
                    </button>

                    <button
                      type="button"
                      disabled={busyAction === "print"}
                      onClick={() => runAction("print", onPrint)}
                      className="bubble-button-secondary"
                      style={{
                        width: "100%",
                        padding: "10px 12px",
                        fontSize: 13,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 8,
                      }}
                    >
                      {busyAction === "print" ? (
                        <Loader2 className="spinner" size={15} />
                      ) : (
                        <Printer size={15} />
                      )}
                      {busyAction === "print" ? "Preparing..." : "Print"}
                    </button>
                  </div>
                )}
            </div>
          )}
          </div>

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
