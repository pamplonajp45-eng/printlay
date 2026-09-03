import React, { useState, useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Layers } from "lucide-react";

export default function SheetPreview({
  sheets,
  photoPreset,
  sheetPreset,
  gridInfo,
  photoCount,
  onUpdatePhotoCrop,
  onOpenCropModal,
}) {
  const [activeSheetIndex, setActiveSheetIndex] = useState(0);
  const [previewZoom, setPreviewZoom] = useState(1.0);
  const [draggingCell, setDraggingCell] = useState(null);
  const canvasContainerRef = useRef(null);

  useEffect(() => {
    if (activeSheetIndex >= sheets.length && sheets.length > 0) {
      setActiveSheetIndex(sheets.length - 1);
    }
  }, [sheets]);

  // Global mousemove and mouseup listeners for drag & click handling
  useEffect(() => {
    if (!draggingCell) return;

    const handleMouseMove = (e) => {
      const dist = Math.hypot(e.clientX - draggingCell.startX, e.clientY - draggingCell.startY);
      if (dist > 4) {
        draggingCell.hasDragged = true;
      }

      if (draggingCell.hasDragged) {
        const dx = (e.clientX - draggingCell.startX) * 0.0025;
        const dy = (e.clientY - draggingCell.startY) * 0.0025;

        const currentSettings = draggingCell.photoItem?.cropSettings || { offsetX: 0, offsetY: 0, zoom: 1, rotate: 0 };
        const newOffsetX = Math.max(-0.5, Math.min(0.5, draggingCell.initialOffsetX - dx));
        const newOffsetY = Math.max(-0.5, Math.min(0.5, draggingCell.initialOffsetY - dy));

        onUpdatePhotoCrop(draggingCell.photoId, {
          ...currentSettings,
          offsetX: newOffsetX,
          offsetY: newOffsetY,
        });
      }
    };

    const handleMouseUp = () => {
      if (draggingCell && !draggingCell.hasDragged) {
        // Clicked photo cell -> open Crop & Pan Modal editor
        if (draggingCell.photoItem) {
          onOpenCropModal(draggingCell.photoItem);
        }
      }
      setDraggingCell(null);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [draggingCell, onUpdatePhotoCrop, onOpenCropModal]);

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
  const { sheetWpx, sheetHpx, layoutCells = [] } = currentSheet;

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
            Interactive Sheet Preview
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
            Click any photo cell to open crop editor • Drag photo to pan position
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
            position: "relative",
            transform: `scale(${previewZoom})`,
            transformOrigin: "center center",
            transition: "transform 200ms ease",
            boxShadow: "0 12px 36px rgba(0,0,0,0.22)",
            borderRadius: "4px",
            background: "#ffffff",
            maxWidth: "100%",
            userSelect: "none",
            WebkitUserSelect: "none",
          }}
        >
          {/* Rendered sheet canvas */}
          <RenderedCanvasHost canvas={currentSheet.canvas} />

          {/* Clean Interactive Cell Overlays */}
          {layoutCells.map((cell) => {
            const leftPct = (cell.x / sheetWpx) * 100;
            const topPct = (cell.y / sheetHpx) * 100;
            const widthPct = (cell.w / sheetWpx) * 100;
            const heightPct = (cell.h / sheetHpx) * 100;

            const isDraggingThis = draggingCell?.photoId === cell.photoId;

            return (
              <div
                key={`${cell.photoId}-${cell.index}`}
                className="sheet-preview-cell-overlay"
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setDraggingCell({
                    photoId: cell.photoId,
                    photoItem: cell.photoItem,
                    startX: e.clientX,
                    startY: e.clientY,
                    initialOffsetX: cell.photoItem?.cropSettings?.offsetX || 0,
                    initialOffsetY: cell.photoItem?.cropSettings?.offsetY || 0,
                    hasDragged: false,
                  });
                }}
                style={{
                  position: "absolute",
                  left: `${leftPct}%`,
                  top: `${topPct}%`,
                  width: `${widthPct}%`,
                  height: `${heightPct}%`,
                  cursor: isDraggingThis ? "grabbing" : "pointer",
                  border: isDraggingThis
                    ? "2px solid #8f7fe0"
                    : "1px dashed transparent",
                  borderRadius: "2px",
                  boxSizing: "border-box",
                  zIndex: 20,
                  transition: "border-color 150ms ease, background 150ms ease",
                }}
                title="Click to open crop editor, or drag to pan"
              />
            );
          })}
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 12, fontSize: 12, color: "#7c7893" }}>
        <span>Sheet format: <strong>{sheetPreset.name}</strong> ({sheetPreset.wIn}″ × {sheetPreset.hIn}″)</span>
        <span>Click any photo cell to open crop editor • Drag photo to pan position</span>
      </div>
    </div>
  );
}

// Sub-component to attach rendered canvas into DOM cleanly with full ghosting prevention
function RenderedCanvasHost({ canvas }) {
  const containerRef = useRef(null);

  useEffect(() => {
    if (containerRef.current && canvas) {
      containerRef.current.innerHTML = "";
      const previewImg = document.createElement("img");
      previewImg.src = canvas.toDataURL("image/png");
      previewImg.style.maxHeight = "520px";
      previewImg.style.maxWidth = "100%";
      previewImg.style.height = "auto";
      previewImg.style.display = "block";
      previewImg.style.pointerEvents = "none";
      previewImg.style.userSelect = "none";
      previewImg.style.webkitUserSelect = "none";
      previewImg.style.webkitUserDrag = "none";
      previewImg.setAttribute("draggable", "false");
      previewImg.oncontextmenu = (e) => e.preventDefault();
      previewImg.ondragstart = (e) => e.preventDefault();
      containerRef.current.appendChild(previewImg);
    }
  }, [canvas]);

  return <div ref={containerRef} />;
}
