import React from "react";
import { X, Crop, Copy, ArrowLeft, ArrowRight, CheckCircle2 } from "lucide-react";

export default function PhotoThumbGrid({
  photos,
  onRemovePhoto,
  onDuplicatePhoto,
  onMovePhoto,
  onOpenCropModal,
}) {
  if (!photos || photos.length === 0) return null;

  return (
    <div className="glass-card" style={{ padding: "20px", marginBottom: "20px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
        <h3 className="heading" style={{ margin: 0, fontSize: 16, color: "#3d3856", display: "flex", alignItems: "center", gap: 8 }}>
          Uploaded Photos ({photos.length})
          <span style={{ fontSize: 12, fontWeight: 600, color: "#7c7893" }}>
            Click photo to adjust crop/pan
          </span>
        </h3>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(105px, 1fr))",
          gap: "14px",
          maxHeight: "360px",
          overflowY: "auto",
          paddingRight: "4px",
        }}
      >
        {photos.map((photo, index) => {
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
                borderRadius: "20px",
                overflow: "hidden",
                background: "#ffffff",
                boxShadow: "0 4px 14px rgba(0,0,0,0.06)",
                border: "1px solid rgba(0,0,0,0.06)",
                transition: "all 200ms ease",
              }}
            >
              {/* Thumbnail image */}
              <div
                onClick={() => onOpenCropModal(photo)}
                style={{
                  width: "100%",
                  height: "100px",
                  cursor: "pointer",
                  overflow: "hidden",
                  position: "relative",
                  background: "#f3f3f8",
                }}
              >
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

                {/* Custom crop badge */}
                {hasCustomCrop && (
                  <div
                    style={{
                      position: "absolute",
                      top: 6,
                      left: 6,
                      background: "#8f7fe0",
                      color: "#ffffff",
                      fontSize: 10,
                      fontWeight: 700,
                      padding: "2px 6px",
                      borderRadius: "999px",
                      display: "flex",
                      alignItems: "center",
                      gap: 3,
                    }}
                    title="Manual crop applied"
                  >
                    <Crop size={10} /> Adjusted
                  </div>
                )}
              </div>

              {/* Action buttons overlay bar */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "6px 8px",
                  background: "#faf9fe",
                  borderTop: "1px solid rgba(0,0,0,0.05)",
                }}
              >
                <div style={{ display: "flex", gap: 4 }}>
                  {index > 0 && (
                    <button
                      onClick={() => onMovePhoto(index, index - 1)}
                      style={{ border: "none", background: "none", cursor: "pointer", padding: 2, color: "#8b87a0" }}
                      title="Move left"
                    >
                      <ArrowLeft size={13} />
                    </button>
                  )}
                  {index < photos.length - 1 && (
                    <button
                      onClick={() => onMovePhoto(index, index + 1)}
                      style={{ border: "none", background: "none", cursor: "pointer", padding: 2, color: "#8b87a0" }}
                      title="Move right"
                    >
                      <ArrowRight size={13} />
                    </button>
                  )}
                </div>

                <div style={{ display: "flex", gap: 4 }}>
                  <button
                    onClick={() => onDuplicatePhoto(photo)}
                    style={{ border: "none", background: "none", cursor: "pointer", padding: 2, color: "#8b87a0" }}
                    title="Duplicate photo"
                  >
                    <Copy size={13} />
                  </button>
                  <button
                    onClick={() => onRemovePhoto(photo.id)}
                    style={{ border: "none", background: "none", cursor: "pointer", padding: 2, color: "#e55b5b" }}
                    title="Remove photo"
                  >
                    <X size={13} />
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
