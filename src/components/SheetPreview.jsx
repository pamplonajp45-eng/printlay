import { useState, useEffect, useRef } from "react";
import {
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Layers,
} from "lucide-react";

export default function SheetPreview({
  sheets,
  sheetPreset,
  photoCount,
  onUpdatePhotoCrop,
  onOpenCropModal,
  onUpdatePageLabel,
}) {
  const [activeSheetIndex, setActiveSheetIndex] = useState(0);
  const [previewZoom, setPreviewZoom] = useState(1.0);
  const [draggingCell, setDraggingCell] = useState(null);
  const [hoveredCellId, setHoveredCellId] = useState(null);
  const [hoveredLabel, setHoveredLabel] = useState(false);
  const [editingLabel, setEditingLabel] = useState(false);
  const [editValue, setEditValue] = useState("");
  const canvasContainerRef = useRef(null);

  // Global mousemove and mouseup listeners for drag & click handling
  useEffect(() => {
    if (!draggingCell) return;

    const handleMouseMove = (e) => {
      const dist = Math.hypot(
        e.clientX - draggingCell.startX,
        e.clientY - draggingCell.startY,
      );
      if (dist > 4) {
        draggingCell.hasDragged = true;
      }

      if (draggingCell.hasDragged) {
        const dx = (e.clientX - draggingCell.startX) * 0.0025;
        const dy = (e.clientY - draggingCell.startY) * 0.0025;

        const currentSettings = draggingCell.photoItem?.cropSettings || {
          offsetX: 0,
          offsetY: 0,
          zoom: 1,
          rotate: 0,
        };
        const newOffsetX = Math.max(
          -0.5,
          Math.min(0.5, draggingCell.initialOffsetX - dx),
        );
        const newOffsetY = Math.max(
          -0.5,
          Math.min(0.5, draggingCell.initialOffsetY - dy),
        );

        onUpdatePhotoCrop(draggingCell.photoId, {
          ...currentSettings,
          offsetX: newOffsetX,
          offsetY: newOffsetY,
        });
      }
    };

    const handleMouseUp = () => {
      if (draggingCell && !draggingCell.hasDragged) {
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
      <div
        style={{
          width: "100%",
          height: "100%",
          minHeight: "560px",
          background: "#e7e6ee",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          padding: "40px 20px",
        }}
      >
        <div
          style={{
            width: 54,
            height: 54,
            marginBottom: 12,
            borderRadius: "50%",
            background: "rgba(143, 127, 224, 0.14)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Layers size={26} color="#8f7fe0" />
        </div>
        <h3
          className="heading"
          style={{ margin: "0 0 6px", fontSize: 17, color: "#3d3856" }}
        >
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

  // Clamp the active page during render (instead of via setState-in-effect)
  const safeIndex = Math.min(activeSheetIndex, sheets.length - 1);
  const currentSheet = sheets[safeIndex];
  const { sheetWpx, sheetHpx, layoutCells = [] } = currentSheet;
  const labelBounds = currentSheet.pageLabelBounds;
  const hasMultiplePages = sheets.length > 1;

  const startEditLabel = () => {
    setEditValue(currentSheet.pageLabelText || "");
    setEditingLabel(true);
  };

  const commitLabel = () => {
    if (typeof onUpdatePageLabel === "function") {
      onUpdatePageLabel(safeIndex, editValue);
    }
    setEditingLabel(false);
  };

  return (
    <div
      ref={canvasContainerRef}
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        minHeight: "560px",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: "#e7e6ee",
        overflow: "hidden",
      }}
    >
      {/* Floating sheet-format label — bottom-right, clear of the rail/sidebar */}
      <div
        style={{
          position: "absolute",
          bottom: "16px",
          right: "20px",
          zIndex: 40,
          fontSize: 12,
          color: "#7c7893",
          pointerEvents: "none",
        }}
      >
        <strong style={{ color: "#57536b" }}>{sheetPreset.name}</strong> (
        {sheetPreset.wIn}″ × {sheetPreset.hIn}″)
      </div>

      <div
        style={{
          position: "relative",
          transform: `scale(${previewZoom})`,
          transformOrigin: "center center",
          transition: "transform 200ms ease",
          boxShadow: "0 4px 18px rgba(35, 31, 53, 0.16)",
          borderRadius: "3px",
          background: "#ffffff",
          maxWidth: "100%",
          userSelect: "none",
          WebkitUserSelect: "none",
        }}
      >
        <RenderedCanvasHost canvas={currentSheet.canvas} />

        {/* Cell overlays — invisible until hovered, clean solid outline (no dashed dead-state) */}
        {layoutCells.map((cell) => {
          const leftPct = (cell.x / sheetWpx) * 100;
          const topPct = (cell.y / sheetHpx) * 100;
          const widthPct = (cell.w / sheetWpx) * 100;
          const heightPct = (cell.h / sheetHpx) * 100;

          const cellKey = `${cell.photoId}-${cell.index}`;
          const isDraggingThis = draggingCell?.photoId === cell.photoId;
          const isHovered = hoveredCellId === cellKey;

          return (
            <div
              key={cellKey}
              onMouseEnter={() => setHoveredCellId(cellKey)}
              onMouseLeave={() =>
                setHoveredCellId((id) => (id === cellKey ? null : id))
              }
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
                border:
                  isDraggingThis || isHovered
                    ? "1.5px solid #8f7fe0"
                    : "1.5px solid transparent",
                boxSizing: "border-box",
                zIndex: 20,
                transition: "border-color 120ms ease",
              }}
              title="Click to open crop editor, or drag to pan"
            />
          );
        })}

        {/* Page label overlay — same hover-only treatment */}
        {labelBounds && (
          <div
            onMouseEnter={() => setHoveredLabel(true)}
            onMouseLeave={() => setHoveredLabel(false)}
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (draggingCell) return;
              startEditLabel();
            }}
            style={{
              position: "absolute",
              left: `${(labelBounds.x / sheetWpx) * 100}%`,
              top: `${(labelBounds.y / sheetHpx) * 100}%`,
              width: `${(labelBounds.w / sheetWpx) * 100}%`,
              height: `${(labelBounds.h / sheetHpx) * 100}%`,
              cursor: "text",
              border: editingLabel
                ? "1.5px solid #8f7fe0"
                : hoveredLabel
                  ? "1.5px solid rgba(143,127,224,0.55)"
                  : "1.5px solid transparent",
              background: editingLabel
                ? "rgba(143,127,224,0.06)"
                : "transparent",
              zIndex: 30,
              boxSizing: "border-box",
              transition: "border-color 120ms ease",
            }}
            title="Click to edit this page's waybill / label"
          />
        )}
      </div>

      {/* Floating toolbar — zoom + pagination combined, docked at the bottom like Canva */}
      <div
        style={{
          position: "absolute",
          bottom: "16px",
          left: "50%",
          transform: "translateX(-50%)",
          display: "flex",
          alignItems: "center",
          gap: 4,
          padding: "6px",
          borderRadius: "999px",
          background: "rgba(255,255,255,0.92)",
          backdropFilter: "blur(10px)",
          WebkitBackdropFilter: "blur(10px)",
          boxShadow: "0 6px 20px rgba(35, 31, 53, 0.14)",
          border: "1px solid rgba(255,255,255,0.8)",
          zIndex: 40,
        }}
      >
        <button
          onClick={() => setPreviewZoom((z) => Math.max(0.6, z - 0.2))}
          style={{
            border: "none",
            background: "none",
            cursor: "pointer",
            padding: 6,
            color: "#57536b",
            display: "flex",
          }}
          title="Zoom out"
        >
          <ZoomOut size={15} />
        </button>
        <span
          style={{
            fontSize: 12,
            fontWeight: 700,
            minWidth: 38,
            textAlign: "center",
            color: "#3d3856",
          }}
        >
          {Math.round(previewZoom * 100)}%
        </span>
        <button
          onClick={() => setPreviewZoom((z) => Math.min(2.0, z + 0.2))}
          style={{
            border: "none",
            background: "none",
            cursor: "pointer",
            padding: 6,
            color: "#57536b",
            display: "flex",
          }}
          title="Zoom in"
        >
          <ZoomIn size={15} />
        </button>

        {hasMultiplePages && (
          <>
            <div
              style={{
                width: 1,
                height: 18,
                background: "rgba(0,0,0,0.1)",
                margin: "0 4px",
              }}
            />
            <button
              onClick={() => {
                setEditingLabel(false);
                setActiveSheetIndex((prev) => Math.max(0, prev - 1));
              }}
              disabled={safeIndex === 0}
              style={{
                border: "none",
                background: "none",
                cursor: safeIndex === 0 ? "default" : "pointer",
                padding: 6,
                color: "#57536b",
                opacity: safeIndex === 0 ? 0.35 : 1,
                display: "flex",
              }}
            >
              <ChevronLeft size={16} />
            </button>
            <span
              style={{
                fontSize: 12,
                fontWeight: 700,
                minWidth: 40,
                textAlign: "center",
                color: "#3d3856",
              }}
            >
              {safeIndex + 1} / {sheets.length}
            </span>
            <button
              onClick={() => {
                setEditingLabel(false);
                setActiveSheetIndex((prev) =>
                  Math.min(sheets.length - 1, prev + 1),
                );
              }}
              disabled={safeIndex === sheets.length - 1}
              style={{
                border: "none",
                background: "none",
                cursor:
                  safeIndex === sheets.length - 1
                    ? "default"
                    : "pointer",
                padding: 6,
                color: "#57536b",
                opacity: safeIndex === sheets.length - 1 ? 0.35 : 1,
                display: "flex",
              }}
            >
              <ChevronRight size={16} />
            </button>
          </>
        )}
      </div>

      {/* Inline waybill editor pill shown while editing the page label */}
      {editingLabel && (
        <div
          style={{
            position: "absolute",
            top: "12px",
            left: "50%",
            transform: "translateX(-50%)",
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "8px 12px",
            borderRadius: "14px",
            background: "#ffffff",
            boxShadow: "0 8px 24px rgba(99,91,166,0.28)",
            border: "1.5px solid #8f7fe0",
            zIndex: 50,
            whiteSpace: "nowrap",
          }}
        >
          <span style={{ fontSize: 12, fontWeight: 700, color: "#3d3856" }}>
            Page {safeIndex + 1} waybill:
          </span>
          <input
            autoFocus
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") commitLabel();
              if (e.key === "Escape") setEditingLabel(false);
            }}
            style={{
              width: 190,
              padding: "5px 8px",
              borderRadius: 8,
              border: "1px solid rgba(143,127,224,0.4)",
              fontSize: 13,
              fontWeight: 600,
              color: "#3d3856",
              outline: "none",
              background: "rgba(143,127,224,0.06)",
            }}
            placeholder="Type waybill..."
          />
          <button
            type="button"
            onClick={commitLabel}
            style={{
              padding: "5px 12px",
              borderRadius: 8,
              border: "none",
              background: "linear-gradient(135deg, #8f7fe0, #b78ee0)",
              color: "#fff",
              fontWeight: 700,
              fontSize: 12,
              cursor: "pointer",
            }}
          >
            Save
          </button>
          <button
            type="button"
            onClick={() => setEditingLabel(false)}
            style={{
              padding: "5px 10px",
              borderRadius: 8,
              border: "none",
              background: "rgba(0,0,0,0.06)",
              color: "#57536b",
              fontWeight: 700,
              fontSize: 12,
              cursor: "pointer",
            }}
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}

// Sub-component to attach rendered canvas into DOM cleanly with full ghosting prevention
function RenderedCanvasHost({ canvas }) {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current || !canvas) return;

    // Perf: full-res sheets (A4 @ 300dpi ≈ 8.7MP) are far too heavy to
    // PNG-encode on every regeneration. Preview is downscaled to max 1600px
    // and JPEG-encoded (sheets have a white background, no transparency
    // needed) — several times faster with far less memory churn.
    const MAX_PREVIEW_PX = 1600;
    const scale = Math.min(
      1,
      MAX_PREVIEW_PX / Math.max(canvas.width, canvas.height),
    );

    let previewCanvas = canvas;
    if (scale < 1) {
      previewCanvas = document.createElement("canvas");
      previewCanvas.width = Math.round(canvas.width * scale);
      previewCanvas.height = Math.round(canvas.height * scale);
      previewCanvas
        .getContext("2d")
        .drawImage(canvas, 0, 0, previewCanvas.width, previewCanvas.height);
    }

    containerRef.current.innerHTML = "";
    const previewImg = document.createElement("img");
    previewImg.src = previewCanvas.toDataURL("image/jpeg", 0.85);
    previewImg.style.maxHeight = "680px";
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
  }, [canvas]);

  return <div ref={containerRef} />;
}
