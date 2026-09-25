import React from "react";
import { Image as ImageIcon, Sparkles, Layers } from "lucide-react";

/**
 * Base generic Skeleton element with animated shimmer gradient sweep.
 */
export function Skeleton({
  width,
  height,
  borderRadius = "8px",
  className = "",
  style = {},
  children,
  ...props
}) {
  return (
    <div
      className={`skeleton skeleton-shimmer ${className}`}
      style={{
        width: width ?? "100%",
        height: height ?? "100%",
        borderRadius,
        ...style,
      }}
      {...props}
    >
      {children}
    </div>
  );
}

/**
 * Skeleton placeholder for a single photo card in the upload/grid view.
 */
export function PhotoCardSkeleton({ index = 0 }) {
  return (
    <div
      className="photo-thumb-card skeleton-card"
      style={{
        position: "relative",
        borderRadius: "16px",
        overflow: "hidden",
        background: "rgba(255, 255, 255, 0.7)",
        border: "1px solid rgba(143, 127, 224, 0.16)",
        boxShadow: "0 4px 14px rgba(0, 0, 0, 0.04)",
        padding: "8px",
        display: "flex",
        flexDirection: "column",
        gap: "8px",
        boxSizing: "border-box",
        animationDelay: `${(index % 6) * 120}ms`,
      }}
    >
      <Skeleton
        height="95px"
        borderRadius="12px"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <ImageIcon size={22} color="rgba(143, 127, 224, 0.35)" />
      </Skeleton>
      <div style={{ display: "flex", flexDirection: "column", gap: 5, padding: "2px 2px" }}>
        <Skeleton width="75%" height="10px" borderRadius="4px" />
        <Skeleton width="45%" height="8px" borderRadius="4px" />
      </div>
    </div>
  );
}

/**
 * Grid of photo card skeletons displayed while uploading or processing photos.
 */
export function PhotoGridSkeleton({ count = 6 }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(105px, 1fr))",
        gap: "12px",
        width: "100%",
        maxWidth: "600px",
        margin: "12px auto 0",
      }}
    >
      {Array.from({ length: Math.min(count, 8) }).map((_, i) => (
        <PhotoCardSkeleton key={i} index={i} />
      ))}
    </div>
  );
}

/**
 * Sheet-accurate skeleton screen mimicking the real output paper sheet.
 * Uses the sheet aspect ratio, margins, and calculated photo grid dimensions.
 */
export function SheetSkeleton({
  sheetPreset,
  photoPreset,
  gridInfo,
  photoCount = 4,
}) {
  const wIn = sheetPreset?.wIn || 8.5;
  const hIn = sheetPreset?.hIn || 11;

  // Grid layout estimation
  const cols = Math.max(1, Math.min(gridInfo?.cols || 2, 6));
  const rows = typeof gridInfo?.rows === "number" ? Math.max(1, Math.min(gridInfo.rows, 6)) : 3;
  const totalCells = Math.min(Math.max(photoCount || 4, cols * 2), cols * rows, 16);

  return (
    <div
      className="sheet-skeleton-card"
      style={{
        position: "relative",
        width: "min(86vw, 460px)",
        aspectRatio: `${wIn} / ${hIn}`,
        maxHeight: "75vh",
        display: "flex",
        flexDirection: "column",
        padding: "16px",
        boxSizing: "border-box",
        overflow: "hidden",
        animation: "fadeIn 200ms ease",
      }}
    >
      {/* Waybill / Header Bar Skeleton */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "12px",
          paddingBottom: "8px",
          borderBottom: "1px dashed rgba(143, 127, 224, 0.22)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div className="skeleton-pulse-dot" />
          <Skeleton width="110px" height="12px" borderRadius="6px" />
        </div>
        <Skeleton width="60px" height="10px" borderRadius="6px" />
      </div>

      {/* Sheet Photo Placement Cells Grid */}
      <div
        style={{
          flex: 1,
          display: "grid",
          gridTemplateColumns: `repeat(${cols}, 1fr)`,
          gridTemplateRows: `repeat(${rows}, 1fr)`,
          gap: "8px",
          alignContent: "center",
          justifyContent: "center",
          minHeight: 0,
        }}
      >
        {Array.from({ length: totalCells }).map((_, i) => (
          <div
            key={i}
            className="skeleton-cell"
            style={{
              position: "relative",
              width: "100%",
              height: "100%",
              minHeight: "40px",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <Skeleton
              style={{
                width: "100%",
                height: "100%",
                borderRadius: "4px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <ImageIcon size={18} color="rgba(143, 127, 224, 0.3)" />
            </Skeleton>
          </div>
        ))}
      </div>

      {/* Floating Status Pill */}
      <div
        style={{
          marginTop: "12px",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            padding: "5px 14px",
            borderRadius: "999px",
            background: "rgba(143, 127, 224, 0.12)",
            border: "1px solid rgba(143, 127, 224, 0.25)",
            fontSize: "12px",
            fontWeight: 700,
            color: "var(--text-dark, #57536b)",
          }}
        >
          <div className="skeleton-pulse-dot" />
          <span>Composing print layout sheet...</span>
        </div>
      </div>
    </div>
  );
}

export default Skeleton;
