import React, { useState, useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Maximize2, Layers, Printer } from "lucide-react";

export default function SheetPreview({
  sheets,
  photoPreset,
  sheetPreset,
  gridInfo,
  photoCount,
}) {
  const [activeSheetIndex, setActiveSheetIndex] = useState(0);
  const [previewZoom, setPreviewZoom] = useState(1.0);
  const canvasContainerRef = useRef(null);

  useEffect(() => {
    if (activeSheetIndex >= sheets.length && sheets.length > 0) {
      setActiveSheetIndex(sheets.length - 1);
    }
  }, [sheets]);

  if (!sheets || sheets.length === 0) {
    return (
      <div className="glass-card" style={{ padding: "40px 20px", textAlign: "center", marginBottom: "20px" }}>
        <div
          style={{
            width: 54,
            height: 54,
            margin: "0 auto 12px",
            borderRadius: "50%",
            background: "rgba(143, 127, 224, 0.12)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Layers size={26} color="#8f7fe0" />
        </div>
        <h3 className="heading" style={{ margin: "0 0 6px", fontSize: 17, color: "#3d3856" }}>
          Ready to Generate Layout Sheet
        </h3>
        <p style={{ margin: 0, fontSize: 14, color: "#7c7893" }}>
          {photoCount > 0
            ? `${photoCount} photos uploaded. Click "Generate Print-Ready Layout" below.`
            : "Upload photos above to begin auto-cropping and layout generation."}
        </p>
      </div>
    );
  }

  const currentSheet = sheets[activeSheetIndex];

  return (
    <div className="glass-card" style={{ padding: "20px", marginBottom: "24px" }}>
      {/* Header & Stats bar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "12px",
          marginBottom: "16px",
        }}
      >
        <div>
          <h3 className="heading" style={{ margin: 0, fontSize: 18, color: "#3d3856", display: "flex", alignItems: "center", gap: 8 }}>
            Sheet Preview
            <span
              style={{
                fontSize: 12,
                fontWeight: 700,
                background: "rgba(143, 127, 224, 0.15)",
                color: "#7c6dd8",
                padding: "3px 10px",
                borderRadius: "999px",
              }}
            >
              Page {activeSheetIndex + 1} of {sheets.length}
            </span>
          </h3>
          <p style={{ margin: "2px 0 0", fontSize: 13, color: "#7c7893" }}>
            Grid: {gridInfo.cols} cols × {gridInfo.rows} rows ({gridInfo.perSheet} photos/sheet capacity)
          </p>
        </div>

        {/* Zoom & Page Navigation Controls */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          
          {/* Zoom controls */}
          <div style={{ display: "flex", alignItems: "center", background: "rgba(0,0,0,0.05)", borderRadius: "999px", padding: "2px 8px" }}>
            <button
              onClick={() => setPreviewZoom((z) => Math.max(0.6, z - 0.2))}
              style={{ border: "none", background: "none", cursor: "pointer", padding: 4, color: "#57536b" }}
              title="Zoom out preview"
            >
              <ZoomOut size={15} />
            </button>
            <span style={{ fontSize: 12, fontWeight: 700, minWidth: 40, textAlign: "center" }}>
              {Math.round(previewZoom * 100)}%
            </span>
            <button
              onClick={() => setPreviewZoom((z) => Math.min(2.0, z + 0.2))}
              style={{ border: "none", background: "none", cursor: "pointer", padding: 4, color: "#57536b" }}
              title="Zoom in preview"
            >
              <ZoomIn size={15} />
            </button>
          </div>

          {/* Pagination controls */}
          {sheets.length > 1 && (
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <button
                onClick={() => setActiveSheetIndex((prev) => Math.max(0, prev - 1))}
                disabled={activeSheetIndex === 0}
                className="bubble-button-secondary"
                style={{ padding: "6px 10px", opacity: activeSheetIndex === 0 ? 0.4 : 1 }}
              >
                <ChevronLeft size={16} />
              </button>
              <span style={{ fontSize: 13, fontWeight: 700, color: "#3d3856" }}>
                {activeSheetIndex + 1} / {sheets.length}
              </span>
              <button
                onClick={() => setActiveSheetIndex((prev) => Math.min(sheets.length - 1, prev + 1))}
                disabled={activeSheetIndex === sheets.length - 1}
                className="bubble-button-secondary"
                style={{ padding: "6px 10px", opacity: activeSheetIndex === sheets.length - 1 ? 0.4 : 1 }}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Rendered Canvas Preview Container */}
      <div
        ref={canvasContainerRef}
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          background: "linear-gradient(135deg, #e9e7f5 0%, #dedbf0 100%)",
          borderRadius: "24px",
          padding: "24px 16px",
          overflowX: "auto",
          minHeight: "420px",
        }}
      >
        <div
          style={{
            transform: `scale(${previewZoom})`,
            transformOrigin: "center center",
            transition: "transform 200ms ease",
            boxShadow: "0 12px 36px rgba(0,0,0,0.22)",
            borderRadius: "4px",
            background: "#ffffff",
            maxWidth: "100%",
          }}
        >
          <RenderedCanvasHost canvas={currentSheet.canvas} />
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 12, fontSize: 12, color: "#7c7893" }}>
        <span>Sheet format: <strong>{sheetPreset.name}</strong> ({sheetPreset.wIn}″ × {sheetPreset.hIn}″)</span>
        <span>Print at <strong>100% scale (no fit-to-page)</strong> for exact physical dimensions</span>
      </div>
    </div>
  );
}

// Sub-component to attach rendered canvas into DOM cleanly
function RenderedCanvasHost({ canvas }) {
  const containerRef = useRef(null);

  useEffect(() => {
    if (containerRef.current && canvas) {
      containerRef.current.innerHTML = "";
      // Clone or style canvas for responsive preview
      const previewImg = document.createElement("img");
      previewImg.src = canvas.toDataURL("image/png");
      previewImg.style.maxHeight = "520px";
      previewImg.style.maxWidth = "100%";
      previewImg.style.height = "auto";
      previewImg.style.display = "block";
      containerRef.current.appendChild(previewImg);
    }
  }, [canvas]);

  return <div ref={containerRef} />;
}
