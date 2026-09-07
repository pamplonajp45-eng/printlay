import { X, Crop, Copy, ArrowLeft, ArrowRight, Sparkles, Type } from "lucide-react";
import { PHOTO_FILTERS } from "../lib/cropEngine";

export default function PhotoThumbGrid({
  photos,
  onRemovePhoto,
  onDuplicatePhoto,
  onMovePhoto,
  onOpenCropModal,
  onUpdatePhotoFilter,
  onApplyFilterToAll,
}) {
  if (!photos || photos.length === 0) return null;

  return (
    <div className="glass-card" style={{ padding: "20px", marginBottom: "20px" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px", flexWrap: "wrap", gap: "8px" }}>
        <h3 className="heading" style={{ margin: 0, fontSize: 16, color: "#3d3856", display: "flex", alignItems: "center", gap: 8 }}>
          Uploaded Photos ({photos.length})
          <span style={{ fontSize: 12, fontWeight: 600, color: "#7c7893" }}>
            Click photo to crop & pan
          </span>
        </h3>
      </div>

      {/* Global / Batch Filter Bar */}
      <div
        style={{
          background: "rgba(143, 127, 224, 0.08)",
          borderRadius: "14px",
          padding: "10px 14px",
          marginBottom: "16px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "10px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 700, color: "#57536b" }}>
          <Sparkles size={15} color="#8f7fe0" />
          <span>Batch Filter All Photos:</span>
        </div>

        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", alignItems: "center" }}>
          {PHOTO_FILTERS.map((f) => (
            <button
              key={f.id}
              onClick={() => onApplyFilterToAll && onApplyFilterToAll(f.id)}
              className="bubble-button-secondary"
              style={{
                padding: "4px 10px",
                fontSize: 12,
                borderRadius: "999px",
                background: "#ffffff",
                border: "1px solid rgba(143, 127, 224, 0.25)",
                cursor: "pointer",
                fontWeight: 600,
                color: "#4e4963",
                transition: "all 150ms ease",
              }}
              title={`Apply ${f.name} filter to all ${photos.length} photos`}
            >
              {f.name}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Photo Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(115px, 1fr))",
          gap: "14px",
          maxHeight: "380px",
          overflowY: "auto",
          paddingRight: "4px",
        }}
      >
        {photos.map((photo, index) => {
          const activeFilterId = photo.filter || "none";
          const activeFilterDef = PHOTO_FILTERS.find((f) => f.id === activeFilterId) || PHOTO_FILTERS[0];
          const intensity = typeof photo.filterIntensity === "number" ? photo.filterIntensity : 1;

          const hasCustomCrop =
            photo.cropSettings &&
            (photo.cropSettings.offsetX !== 0 ||
              photo.cropSettings.offsetY !== 0 ||
              photo.cropSettings.zoom !== 1 ||
              photo.cropSettings.rotate !== 0);

          return (
            <div
              key={photo.id}
              className="photo-thumb-card"
              style={{
                position: "relative",
                borderRadius: "16px",
                overflow: "hidden",
                background: "#ffffff",
                boxShadow: "0 4px 14px rgba(0,0,0,0.06)",
                border: "1px solid rgba(0,0,0,0.06)",
                transition: "all 200ms ease",
              }}
            >
              {/* Thumbnail image with live filter CSS & intensity layer opacity */}
              <div
                onClick={() => onOpenCropModal(photo)}
                style={{
                  width: "100%",
                  height: "105px",
                  cursor: "pointer",
                  overflow: "hidden",
                  position: "relative",
                  background: "#f3f3f8",
                }}
              >
                {/* Base un-filtered photo */}
                <img
                  src={photo.url}
                  alt={photo.name}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    transform: `scale(${photo.cropSettings?.zoom || 1}) rotate(${photo.cropSettings?.rotate || 0}deg)`,
                    transition: "transform 150ms ease",
                  }}
                />

                {/* Overlaid filter photo layer with opacity matching intensity */}
                {activeFilterDef.cssFilter !== "none" && (
                  <img
                    src={photo.url}
                    alt={photo.name}
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      filter: activeFilterDef.cssFilter,
                      opacity: intensity,
                      transform: `scale(${photo.cropSettings?.zoom || 1}) rotate(${photo.cropSettings?.rotate || 0}deg)`,
                      transition: "transform 150ms ease, opacity 150ms ease",
                      pointerEvents: "none",
                    }}
                  />
                )}

                {/* Sequence badge */}
                <div
                  style={{
                    position: "absolute",
                    bottom: 6,
                    left: 6,
                    background: "rgba(0,0,0,0.65)",
                    backdropFilter: "blur(4px)",
                    color: "#ffffff",
                    fontSize: 10,
                    fontWeight: 700,
                    padding: "2px 6px",
                    borderRadius: "999px",
                  }}
                >
                  #{index + 1}
                </div>

                {/* Filter Badge */}
                {activeFilterId !== "none" && (
                  <div
                    style={{
                      position: "absolute",
                      top: 6,
                      right: 6,
                      background: "rgba(61, 56, 86, 0.85)",
                      backdropFilter: "blur(4px)",
                      color: "#ffffff",
                      fontSize: 9,
                      fontWeight: 700,
                      padding: "2px 6px",
                      borderRadius: "999px",
                      display: "flex",
                      alignItems: "center",
                      gap: 2,
                    }}
                    title={`Filter: ${activeFilterDef.name} (${Math.round(intensity * 100)}%)`}
                  >
                    <Sparkles size={9} color="#ffd166" />
                    {activeFilterDef.name} {intensity < 1 && `${Math.round(intensity * 100)}%`}
                  </div>
                )}

                {/* Custom crop badge */}
                {hasCustomCrop && (
                  <div
                    style={{
                      position: "absolute",
                      top: 6,
                      left: 6,
                      background: "#8f7fe0",
                      color: "#ffffff",
                      fontSize: 9,
                      fontWeight: 700,
                      padding: "2px 6px",
                      borderRadius: "999px",
                      display: "flex",
                      alignItems: "center",
                      gap: 3,
                    }}
                    title="Manual crop applied"
                  >
                    <Crop size={9} /> Crop
                  </div>
                )}

                {/* Text overlay badge */}
                {photo.textOverlays && photo.textOverlays.length > 0 && photo.textOverlays.some(o => o.text?.trim()) && (
                  <div
                    style={{
                      position: "absolute",
                      bottom: 6,
                      right: 6,
                      background: "rgba(143,127,224,0.90)",
                      backdropFilter: "blur(4px)",
                      color: "#ffffff",
                      fontSize: 9,
                      fontWeight: 700,
                      padding: "2px 6px",
                      borderRadius: "999px",
                      display: "flex",
                      alignItems: "center",
                      gap: 2,
                    }}
                    title="Has text overlay"
                  >
                    <Type size={11} /> Text
                  </div>
                )}
              </div>

              {/* Per-photo Filter Dropdown */}
              <div
                style={{
                  padding: "4px 6px",
                  background: "#ffffff",
                  borderTop: "1px solid rgba(0,0,0,0.05)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <select
                  value={activeFilterId}
                  onChange={(e) => onUpdatePhotoFilter && onUpdatePhotoFilter(photo.id, e.target.value)}
                  style={{
                    width: "100%",
                    fontSize: 11,
                    fontWeight: 600,
                    color: activeFilterId !== "none" ? "#7c6dd8" : "#57536b",
                    border: "1px solid rgba(0,0,0,0.1)",
                    borderRadius: "6px",
                    padding: "2px 4px",
                    background: activeFilterId !== "none" ? "rgba(143, 127, 224, 0.08)" : "#faf9fe",
                    cursor: "pointer",
                    outline: "none",
                  }}
                  title="Change filter for this photo"
                >
                  {PHOTO_FILTERS.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name} Filter
                    </option>
                  ))}
                </select>
              </div>

              {/* Action buttons overlay bar */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "4px 8px 6px",
                  background: "#faf9fe",
                  borderTop: "1px solid rgba(0,0,0,0.04)",
                }}
              >
                <div style={{ display: "flex", gap: 2 }}>
                  {index > 0 && (
                    <button
                      onClick={() => onMovePhoto(index, index - 1)}
                      style={{ border: "none", background: "none", cursor: "pointer", padding: 2, color: "#8b87a0" }}
                      title="Move left"
                    >
                      <ArrowLeft size={12} />
                    </button>
                  )}
                  {index < photos.length - 1 && (
                    <button
                      onClick={() => onMovePhoto(index, index + 1)}
                      style={{ border: "none", background: "none", cursor: "pointer", padding: 2, color: "#8b87a0" }}
                      title="Move right"
                    >
                      <ArrowRight size={12} />
                    </button>
                  )}
                </div>

                <div style={{ display: "flex", gap: 2 }}>
                  <button
                    onClick={() => onDuplicatePhoto(photo)}
                    style={{ border: "none", background: "none", cursor: "pointer", padding: 2, color: "#8b87a0" }}
                    title="Duplicate photo"
                  >
                    <Copy size={12} />
                  </button>
                  <button
                    onClick={() => onRemovePhoto(photo.id)}
                    style={{ border: "none", background: "none", cursor: "pointer", padding: 2, color: "#e55b5b" }}
                    title="Remove photo"
                  >
                    <X size={12} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
