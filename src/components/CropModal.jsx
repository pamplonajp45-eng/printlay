import React, { useState, useEffect, useRef } from "react";
import { X, RotateCw, ZoomIn, Move, RefreshCw, Check, Layers } from "lucide-react";
import { cropToCanvas, loadImage } from "../lib/cropEngine";

export default function CropModal({
  photo,
  photoPreset,
  onSave,
  onApplyToAll,
  onClose,
}) {
  const [cropSettings, setCropSettings] = useState(
    photo?.cropSettings || { offsetX: 0, offsetY: 0, zoom: 1, rotate: 0 }
  );
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const previewCanvasRef = useRef(null);
  const loadedImgRef = useRef(null);

  useEffect(() => {
    let mounted = true;
    if (photo?.url) {
      loadImage(photo.url)
        .then((img) => {
          if (mounted) {
            loadedImgRef.current = img;
            renderPreview();
          }
        })
        .catch(console.error);
    }
    return () => {
      mounted = false;
    };
  }, [photo, photoPreset, cropSettings]);

  const renderPreview = () => {
    if (!loadedImgRef.current || !previewCanvasRef.current) return;
    const canvas = previewCanvasRef.current;
    const rendered = cropToCanvas(loadedImgRef.current, photoPreset, {
      dpi: 150, // fast preview DPI
      cropSettings,
      frameBgColor: "#ffffff",
    });

    canvas.width = rendered.width;
    canvas.height = rendered.height;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(rendered, 0, 0);
  };

  const handleMouseDown = (e) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    const dx = (e.clientX - dragStart.x) * 0.002;
    const dy = (e.clientY - dragStart.y) * 0.002;

    setCropSettings((prev) => ({
      ...prev,
      offsetX: Math.max(-0.5, Math.min(0.5, prev.offsetX - dx)),
      offsetY: Math.max(-0.5, Math.min(0.5, prev.offsetY - dy)),
    }));

    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleReset = () => {
    setCropSettings({ offsetX: 0, offsetY: 0, zoom: 1, rotate: 0 });
  };

  const handleRotate = () => {
    setCropSettings((prev) => ({
      ...prev,
      rotate: ((prev.rotate || 0) + 90) % 360,
    }));
  };

  return (
    <div className="modal-backdrop">
      <div className="glass-card modal-content" style={{ width: "92%", maxWidth: "800px", padding: "28px" }}>
        
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <div>
            <h2 className="heading" style={{ margin: 0, fontSize: 22, color: "#3d3856" }}>
              Adjust Photo Crop & Pan
            </h2>
            <p style={{ margin: 0, fontSize: 14, color: "#7c7893" }}>
              Target preset: <strong>{photoPreset.name}</strong> ({photoPreset.wIn} × {photoPreset.hIn} in)
            </p>
          </div>
          <button
            onClick={onClose}
            style={{ border: "none", background: "none", cursor: "pointer", color: "#7c7893" }}
          >
            <X size={24} />
          </button>
        </div>

        {/* Live Canvas Preview */}
        <div
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            background: "#eceafa",
            borderRadius: "20px",
            padding: "24px",
            marginBottom: "20px",
            cursor: isDragging ? "grabbing" : "grab",
            userSelect: "none",
            minHeight: "420px",
            maxHeight: "55vh",
          }}
        >
          <canvas
            ref={previewCanvasRef}
            style={{
              maxHeight: "400px",
              maxWidth: "100%",
              borderRadius: "8px",
              boxShadow: "0 8px 24px rgba(0,0,0,0.18)",
              border: "1px solid rgba(255,255,255,0.8)",
            }}
          />
        </div>

        {/* Controls */}
        <div style={{ display: "flex", flexDirection: "column", gap: "14px", marginBottom: "24px" }}>
          
          {/* Zoom Slider */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, fontWeight: 600, color: "#57536b", marginBottom: 6 }}>
              <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <ZoomIn size={14} color="#8f7fe0" /> Zoom Level
              </span>
              <span>{cropSettings.zoom.toFixed(2)}x</span>
            </div>
            <input
              type="range"
              min="1.0"
              max="3.0"
              step="0.05"
              value={cropSettings.zoom}
              onChange={(e) =>
                setCropSettings((prev) => ({ ...prev, zoom: parseFloat(e.target.value) }))
              }
              style={{ width: "100%", accentColor: "#8f7fe0" }}
            />
          </div>

          {/* Quick Action Buttons */}
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            <button
              onClick={handleRotate}
              className="bubble-button-secondary"
              style={{ padding: "8px 14px", fontSize: 13, display: "flex", alignItems: "center", gap: 6 }}
            >
              <RotateCw size={14} /> Rotate 90°
            </button>

            <button
              onClick={handleReset}
              className="bubble-button-secondary"
              style={{ padding: "8px 14px", fontSize: 13, display: "flex", alignItems: "center", gap: 6 }}
            >
              <RefreshCw size={14} /> Reset
            </button>
          </div>
        </div>

        {/* Footer Actions */}
        <div style={{ display: "flex", justifyContent: "space-between", gap: "10px", flexWrap: "wrap" }}>
          <button
            onClick={() => onApplyToAll(cropSettings)}
            className="bubble-button-secondary"
            style={{ padding: "10px 18px", fontSize: 13, display: "flex", alignItems: "center", gap: 6 }}
            title="Apply this crop, zoom and orientation to ALL photos in the batch"
          >
            <Layers size={14} color="#8f7fe0" /> Apply to All Photos
          </button>

          <div style={{ display: "flex", gap: "10px" }}>
            <button onClick={onClose} className="bubble-button-secondary" style={{ padding: "10px 18px", fontSize: 13 }}>
              Cancel
            </button>
            <button
              onClick={() => onSave(cropSettings)}
              className="bubble-button-primary"
              style={{ padding: "10px 22px", fontSize: 13, display: "flex", alignItems: "center", gap: 6 }}
            >
              <Check size={16} /> Save Changes
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
