import { useState, useEffect, useRef, useCallback } from "react";
import {
  X,
  RotateCw,
  ZoomIn,
  RefreshCw,
  Check,
  Layers,
  Sparkles,
  Sliders,
  Type,
  AlignLeft,
  AlignCenter,
  AlignRight,
} from "lucide-react";
import { cropToCanvas, loadImage, PHOTO_FILTERS } from "../lib/cropEngine";
import { FONT_FAMILIES } from "./TextControls";

export default function CropModal({
  photo,
  photoPreset,
  onSave,
  onApplyToAll,
  onApplyTextToAll,
  onClose,
}) {
  const [cropSettings, setCropSettings] = useState(
    photo?.cropSettings || { offsetX: 0, offsetY: 0, zoom: 1, rotate: 0 },
  );
  const [activeFilter, setActiveFilter] = useState(photo?.filter || "none");
  const [filterIntensity, setFilterIntensity] = useState(
    typeof photo?.filterIntensity === "number" ? photo.filterIntensity : 1,
  );
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [imageReady, setImageReady] = useState(false);
  const [activeModalTab, setActiveModalTab] = useState("crop"); // "crop" | "text"
  const previewCanvasRef = useRef(null);
  const loadedImgRef = useRef(null);

  // Text overlay state for the per-photo text editor
  const [textOverlays, setTextOverlays] = useState(photo?.textOverlays || []);
  const [editingText, setEditingText] = useState(() =>
    photo?.textOverlays?.[0] || {
      id: `txt-${Date.now()}`,
      text: "",
      fontFamily: "Caveat",
      fontSize: 14,
      fontWeight: "700",
      color: "#ffffff",
      align: "center",
      x: 0.5,
      y: 0.88,
      shadow: true,
      bgEnabled: false,
      bgColor: "rgba(0,0,0,0.4)",
    },
  );

  const renderPreview = useCallback(() => {
    if (!loadedImgRef.current || !previewCanvasRef.current) return;
    const canvas = previewCanvasRef.current;
    const previewOverlays = editingText?.text?.trim()
      ? [editingText]
      : textOverlays;
    const rendered = cropToCanvas(loadedImgRef.current, photoPreset, {
      dpi: 150,
      cropSettings,
      filter: activeFilter,
      filterIntensity,
      frameBgColor: "#ffffff",
      textOverlays: previewOverlays,
    });

    canvas.width = rendered.width;
    canvas.height = rendered.height;
    canvas.getContext("2d").drawImage(rendered, 0, 0);
  }, [photoPreset, cropSettings, activeFilter, filterIntensity, editingText, textOverlays]);

  useEffect(() => {
    let mounted = true;
    if (photo?.url) {
      loadImage(photo.url)
        .then((img) => {
          if (mounted) {
            loadedImgRef.current = img;
            setImageReady(true);
          }
        })
        .catch(console.error);
    }
    return () => {
      mounted = false;
    };
  }, [photo?.url]);

  useEffect(() => {
    if (!imageReady) return;
    const frame = requestAnimationFrame(renderPreview);
    return () => cancelAnimationFrame(frame);
  }, [imageReady, renderPreview]);

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
    setCropSettings({
      offsetX: 0,
      offsetY: 0,
      zoom: 1,
      rotate: 0,
      fitMode: "cover",
    });
    setActiveFilter("none");
    setFilterIntensity(1);
  };

  const handleRotate = () => {
    setCropSettings((prev) => ({
      ...prev,
      rotate: ((prev.rotate || 0) + 90) % 360,
    }));
  };

  const handleFitEntirePhoto = () => {
    const loadedImg = loadedImgRef.current;
    const imgRatio = loadedImg ? loadedImg.width / loadedImg.height : 1.0;
    const isPhotoLandscape = imgRatio > 1.0;
    const isFramePortrait = photoPreset.wIn < photoPreset.hIn;
    const isFrameLandscape = photoPreset.wIn > photoPreset.hIn;

    let targetRotate = cropSettings.rotate || 0;
    if (isPhotoLandscape && isFramePortrait) {
      targetRotate = 90;
    } else if (!isPhotoLandscape && isFrameLandscape) {
      targetRotate = 90;
    } else if ((cropSettings.rotate || 0) % 180 !== 0) {
      targetRotate = 0;
    }

    setCropSettings({
      zoom: 1,
      offsetX: 0,
      offsetY: 0,
      rotate: targetRotate,
    });
  };

  return (
    <div className="modal-backdrop">
      <div
        className="glass-card modal-content crop-modal-content"
      >
        {/* Header */}
        <div
          className="crop-modal-header"
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "16px",
          }}
        >
          <div>
            <h2
              className="heading"
              style={{ margin: 0, fontSize: 22, color: "#3d3856" }}
            >
              Edit Photo
            </h2>
            <p style={{ margin: 0, fontSize: 14, color: "#7c7893" }}>
              Target preset: <strong>{photoPreset.name}</strong> (
              {photoPreset.wIn} × {photoPreset.hIn} in)
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              border: "none",
              background: "none",
              cursor: "pointer",
              color: "#7c7893",
            }}
          >
            <X size={24} />
          </button>
        </div>
        <div className="crop-modal-workspace">
        {/* Live Canvas Preview */}
        <div
          className="crop-modal-preview"
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
            minHeight: "360px",
            maxHeight: "48vh",
          }}
        >
          <canvas
            ref={previewCanvasRef}
            style={{
              maxHeight: "340px",
              maxWidth: "100%",
              borderRadius: "8px",
              boxShadow: "0 8px 24px rgba(0,0,0,0.18)",
              border: "1px solid rgba(255,255,255,0.8)",
            }}
          />
        </div>
        <aside className="crop-modal-inspector">
          {/* Tab Navigation */}
          <div className="crop-modal-tabs">
            {[
              { id: "crop", label: "Crop & Filter" },
              { id: "text", label: "Text Overlay" },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveModalTab(tab.id)}
                className={`crop-modal-tab ${activeModalTab === tab.id ? "active" : ""}`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        {/* Controls */}
        {activeModalTab === "crop" && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "16px",
              marginBottom: "24px",
            }}
          >
            {/* Filter Selection Row */}
            <div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  fontSize: 13,
                  fontWeight: 600,
                  color: "#57536b",
                  marginBottom: 8,
                }}
              >
                <Sparkles size={14} color="#8f7fe0" /> Photo Color Filter
              </div>
              <div
                style={{
                  display: "flex",
                  gap: "8px",
                  flexWrap: "wrap",
                  marginBottom: activeFilter !== "none" ? 10 : 0,
                }}
              >
                {PHOTO_FILTERS.map((f) => {
                  const isSelected = activeFilter === f.id;
                  return (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setActiveFilter(f.id)}
                      style={{
                        padding: "6px 14px",
                        fontSize: 12,
                        fontWeight: 600,
                        borderRadius: "999px",
                        border: isSelected
                          ? "2px solid #8f7fe0"
                          : "1px solid rgba(0,0,0,0.12)",
                        background: isSelected
                          ? "rgba(143, 127, 224, 0.15)"
                          : "rgba(143, 127, 224, 0.12)",
                        color: isSelected ? "#6f5ec7" : "#57536b",
                        cursor: "pointer",
                        transition: "all 150ms ease",
                      }}
                    >
                      {f.name}
                    </button>
                  );
                })}
              </div>

              {/* Filter Intensity Slider */}
              {activeFilter !== "none" && (
                <div
                  style={{
                    background: "rgba(143, 127, 224, 0.06)",
                    padding: "10px 14px",
                    borderRadius: "12px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: 12,
                      fontWeight: 600,
                      color: "#57536b",
                      marginBottom: 4,
                    }}
                  >
                    <span
                      style={{ display: "flex", alignItems: "center", gap: 5 }}
                    >
                      <Sliders size={13} color="#8f7fe0" /> Filter Intensity
                    </span>
                    <span>{Math.round(filterIntensity * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0.0"
                    max="1.0"
                    step="0.05"
                    value={filterIntensity}
                    onChange={(e) =>
                      setFilterIntensity(parseFloat(e.target.value))
                    }
                    style={{ width: "100%", accentColor: "#8f7fe0" }}
                  />
                </div>
              )}
            </div>

            {/* Zoom Slider */}
            <div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: 13,
                  fontWeight: 600,
                  color: "#57536b",
                  marginBottom: 6,
                }}
              >
                <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <ZoomIn size={14} color="#8f7fe0" /> Zoom Level
                </span>
                <span>{cropSettings.zoom.toFixed(2)}x</span>
              </div>
              <input
                type="range"
                min="0.3"
                max="3.0"
                step="0.05"
                value={cropSettings.zoom}
                onChange={(e) =>
                  setCropSettings((prev) => ({
                    ...prev,
                    zoom: parseFloat(e.target.value),
                  }))
                }
                style={{ width: "100%", accentColor: "#8f7fe0" }}
              />
            </div>

            {/* Quick Action Buttons */}
            <div
              style={{
                display: "flex",
                gap: "10px",
                flexWrap: "wrap",
                alignItems: "center",
              }}
            >
              <button
                onClick={handleFitEntirePhoto}
                className="bubble-button-primary"
                style={{
                  padding: "8px 16px",
                  fontSize: 13,
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
                title="Auto-align and fit entire photo to print size with zero white borders"
              >
                <Check size={15} /> Fit to Photo Print Size (No Borders)
              </button>

              <button
                onClick={handleRotate}
                className="bubble-button-secondary"
                style={{
                  padding: "8px 14px",
                  fontSize: 13,
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <RotateCw size={14} /> Rotate 90°
              </button>

              <button
                onClick={handleReset}
                className="bubble-button-secondary"
                style={{
                  padding: "8px 14px",
                  fontSize: 13,
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <RefreshCw size={14} /> Reset
              </button>
            </div>
          </div>
        )}{" "}
        {/* end crop tab */}
        {/* Text Overlay Tab Panel */}
        {activeModalTab === "text" && (
          <div style={{ marginBottom: "24px" }}>
            {/* Compact inline text editor */}
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {/* Text input */}
              <div>
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: "#57536b",
                    marginBottom: 5,
                    display: "flex",
                    alignItems: "center",
                    gap: 5,
                  }}
                >
                  <Type size={13} color="#8f7fe0" /> Caption Text
                </div>
                <textarea
                  value={editingText.text}
                  onChange={(e) =>
                    setEditingText((p) => ({ ...p, text: e.target.value }))
                  }
                  placeholder={"Type your caption...\nEnter for new line"}
                  rows={3}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: "12px",
                    border: "1.5px solid rgba(143,127,224,0.35)",
                    background: "rgba(255,255,255,0.9)",
                    fontSize: 13,
                    fontFamily: `"${editingText.fontFamily}", sans-serif`,
                    fontWeight: editingText.fontWeight,
                    color: "#3d3856",
                    resize: "vertical",
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              {/* Font Family */}
              <div>
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: "#57536b",
                    marginBottom: 5,
                  }}
                >
                  Font Style
                </div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {FONT_FAMILIES.map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() =>
                        setEditingText((p) => ({ ...p, fontFamily: f.id }))
                      }
                      style={{
                        padding: "5px 10px",
                        fontSize: 12,
                        borderRadius: 8,
                        background:
                          editingText.fontFamily === f.id
                            ? "rgba(143,127,224,0.15)"
                            : "rgba(143,127,224,0.12)",
                        border:
                          editingText.fontFamily === f.id
                            ? "2px solid #8f7fe0"
                            : "1px solid rgba(143,127,224,0.25)",
                        color:
                          editingText.fontFamily === f.id
                            ? "#6f5ec7"
                            : "#57536b",
                        cursor: "pointer",
                        fontFamily: `"${f.id}", sans-serif`,
                        fontWeight: 600,
                      }}
                    >
                      {f.preview}
                    </button>
                  ))}
                </div>
              </div>

              {/* Text weight */}
              <div>
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: "#57536b",
                    marginBottom: 5,
                  }}
                >
                  Text Weight
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  {[
                    { value: "400", label: "Normal" },
                    { value: "700", label: "Bold" },
                  ].map(({ value, label }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() =>
                        setEditingText((p) => ({ ...p, fontWeight: value }))
                      }
                      style={{
                        flex: 1,
                        padding: "6px 10px",
                        borderRadius: 8,
                        border:
                          editingText.fontWeight === value
                            ? "2px solid #8f7fe0"
                            : "1px solid rgba(143,127,224,0.25)",
                        background:
                          editingText.fontWeight === value
                            ? "rgba(143,127,224,0.15)"
                            : "rgba(143,127,224,0.12)",
                        color:
                          editingText.fontWeight === value
                            ? "#6f5ec7"
                            : "#57536b",
                        cursor: "pointer",
                        fontWeight: value,
                      }}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Size / Color / Align row */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr auto 1fr",
                  gap: 10,
                  alignItems: "end",
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: "#57536b",
                      marginBottom: 4,
                    }}
                  >
                    Size ({editingText.fontSize}pt)
                  </div>
                  <input
                    type="range"
                    min={6}
                    max={48}
                    step={1}
                    value={editingText.fontSize}
                    onChange={(e) =>
                      setEditingText((p) => ({
                        ...p,
                        fontSize: parseInt(e.target.value),
                      }))
                    }
                    style={{ width: "100%", accentColor: "#8f7fe0" }}
                  />
                </div>
                <div>
                  <div
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: "#57536b",
                      marginBottom: 4,
                    }}
                  >
                    Color
                  </div>
                  <input
                    type="color"
                    value={
                      editingText.color.startsWith("rgba")
                        ? "#ffffff"
                        : editingText.color
                    }
                    onChange={(e) =>
                      setEditingText((p) => ({ ...p, color: e.target.value }))
                    }
                    style={{
                      width: 44,
                      height: 34,
                      border: "none",
                      borderRadius: 8,
                      cursor: "pointer",
                      padding: 2,
                    }}
                  />
                </div>
                <div>
                  <div
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: "#57536b",
                      marginBottom: 4,
                    }}
                  >
                    Align
                  </div>
                  <div style={{ display: "flex", gap: 6 }}>
                    {[
                      { v: "left", icon: <AlignLeft size={14} /> },
                      { v: "center", icon: <AlignCenter size={14} /> },
                      { v: "right", icon: <AlignRight size={14} /> },
                    ].map(({ v, icon }) => (
                      <button
                        key={v}
                        type="button"
                        onClick={() =>
                          setEditingText((p) => ({ ...p, align: v }))
                        }
                        style={{
                          flex: 1,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          padding: "6px 0",
                          borderRadius: 8,
                          border:
                            editingText.align === v
                              ? "2px solid #8f7fe0"
                              : "1px solid rgba(143,127,224,0.25)",
                          background:
                            editingText.align === v
                              ? "rgba(143,127,224,0.15)"
                              : "rgba(143,127,224,0.12)",
                          color:
                            editingText.align === v ? "#6f5ec7" : "#57536b",
                          cursor: "pointer",
                        }}
                      >
                        {icon}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Position Y quick snaps */}
              <div>
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: "#57536b",
                    marginBottom: 5,
                  }}
                >
                  Position
                </div>
                <div
                  style={{
                    display: "flex",
                    gap: 6,
                    flexWrap: "wrap",
                    marginBottom: 8,
                  }}
                >
                  {[
                    { label: "Polaroid Chin", x: 0.5, y: 0.93 },
                    { label: "Bottom", x: 0.5, y: 0.88 },
                    { label: "Center", x: 0.5, y: 0.5 },
                    { label: "Top", x: 0.5, y: 0.1 },
                  ].map((snap) => {
                    const isActive =
                      Math.abs(editingText.x - snap.x) < 0.015 &&
                      Math.abs(editingText.y - snap.y) < 0.015;
                    return (
                      <button
                        key={snap.label}
                        type="button"
                        onClick={() =>
                          setEditingText((p) => ({
                            ...p,
                            x: snap.x,
                            y: snap.y,
                          }))
                        }
                        style={{
                          padding: "4px 9px",
                          fontSize: 11,
                          borderRadius: 8,
                          fontWeight: 600,
                          cursor: "pointer",
                          border: isActive
                            ? "2px solid #8f7fe0"
                            : "1px solid rgba(143,127,224,0.25)",
                          background: isActive
                            ? "rgba(143,127,224,0.12)"
                            : "rgba(143,127,224,0.12)",
                          color: isActive ? "#6f5ec7" : "#57536b",
                        }}
                      >
                        {snap.label}
                      </button>
                    );
                  })}
                </div>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 10,
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontSize: 11,
                        fontWeight: 600,
                        color: "#7c7893",
                        marginBottom: 3,
                      }}
                    >
                      X: {Math.round(editingText.x * 100)}%
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.01"
                      value={editingText.x}
                      onChange={(e) =>
                        setEditingText((p) => ({
                          ...p,
                          x: parseFloat(e.target.value),
                        }))
                      }
                      style={{ width: "100%", accentColor: "#8f7fe0" }}
                    />
                  </div>
                  <div>
                    <div
                      style={{
                        fontSize: 11,
                        fontWeight: 600,
                        color: "#7c7893",
                        marginBottom: 3,
                      }}
                    >
                      Y: {Math.round(editingText.y * 100)}%
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.01"
                      value={editingText.y}
                      onChange={(e) =>
                        setEditingText((p) => ({
                          ...p,
                          y: parseFloat(e.target.value),
                        }))
                      }
                      style={{ width: "100%", accentColor: "#8f7fe0" }}
                    />
                  </div>
                </div>
              </div>

              {/* Shadow + Background */}
              <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    fontSize: 12,
                    fontWeight: 600,
                    color: "#57536b",
                    cursor: "pointer",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={editingText.shadow}
                    onChange={(e) =>
                      setEditingText((p) => ({
                        ...p,
                        shadow: e.target.checked,
                      }))
                    }
                    style={{ accentColor: "#8f7fe0" }}
                  />
                  Drop Shadow
                </label>
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    fontSize: 12,
                    fontWeight: 600,
                    color: "#57536b",
                    cursor: "pointer",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={editingText.bgEnabled}
                    onChange={(e) =>
                      setEditingText((p) => ({
                        ...p,
                        bgEnabled: e.target.checked,
                      }))
                    }
                    style={{ accentColor: "#8f7fe0" }}
                  />
                  Background Pill
                </label>
              </div>

              {/* Clear text button */}
              <button
                type="button"
                onClick={() => {
                  setEditingText((p) => ({ ...p, text: "" }));
                  setTextOverlays([]);
                }}
                style={{
                  padding: "7px 14px",
                  borderRadius: 10,
                  background: "rgba(255,100,100,0.08)",
                  color: "#d94f4f",
                  border: "1px solid rgba(255,100,100,0.25)",
                  fontWeight: 700,
                  fontSize: 12,
                  cursor: "pointer",
                  alignSelf: "flex-start",
                }}
              >
                Clear Text
              </button>
            </div>
          </div>
        )}
        {/* Footer Actions */}
        <div
          className="crop-modal-actions"
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: "10px",
            flexWrap: "wrap",
          }}
        >
          {activeModalTab === "crop" && (
            <button
              onClick={() =>
                onApplyToAll(cropSettings, activeFilter, filterIntensity)
              }
              className="bubble-button-secondary"
              style={{
                padding: "10px 18px",
                fontSize: 13,
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
              title="Apply this crop, zoom, rotation AND filter intensity to ALL photos in the batch"
            >
              <Layers size={14} color="#8f7fe0" /> Apply All Settings to All
            </button>
          )}
          {activeModalTab === "text" && (
            <button
              onClick={() => {
                const finalOverlays = editingText?.text?.trim()
                  ? [editingText]
                  : textOverlays;
                onApplyTextToAll(finalOverlays);
              }}
              className="bubble-button-secondary"
              style={{
                padding: "10px 18px",
                fontSize: 13,
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
              title="Apply this text overlay to ALL photos in the batch"
            >
              <Layers size={14} color="#8f7fe0" /> Apply Text to All
            </button>
          )}

          <div style={{ display: "flex", gap: "10px" }}>
            <button
              onClick={onClose}
              className="bubble-button-secondary"
              style={{ padding: "10px 18px", fontSize: 13 }}
            >
              Cancel
            </button>
            <button
              onClick={() => {
                const finalOverlays = editingText?.text?.trim()
                  ? [editingText]
                  : textOverlays;
                setTextOverlays(finalOverlays);
                onSave(
                  cropSettings,
                  activeFilter,
                  filterIntensity,
                  finalOverlays,
                );
              }}
              className="bubble-button-primary"
              style={{
                padding: "10px 22px",
                fontSize: 13,
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <Check size={16} /> Save Changes
            </button>
          </div>
        </div>
        </aside>
        </div>
      </div>
    </div>
  );
}
