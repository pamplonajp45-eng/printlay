import React, { useRef, useState, useCallback } from "react";
import { Upload, Sparkles, Loader2, PlusCircle, X } from "lucide-react";
import { isHeicFile, convertHeicFilesInParallel } from "../lib/heicEngine";
import { PhotoGridSkeleton } from "./Skeleton";

// Demo sample images for quick 1-click testing
const SAMPLE_PHOTOS = [
  { name: "sample-1.jpg", url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&auto=format&fit=crop&q=80" },
  { name: "sample-2.jpg", url: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=800&auto=format&fit=crop&q=80" },
  { name: "sample-3.jpg", url: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=800&auto=format&fit=crop&q=80" },
  { name: "sample-4.jpg", url: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=800&auto=format&fit=crop&q=80" },
  { name: "sample-5.jpg", url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&auto=format&fit=crop&q=80" },
  { name: "sample-6.jpg", url: "https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?w=800&auto=format&fit=crop&q=80" },
];

export default function UploadZone({ onPhotosAdded, photoCount }) {
  const [dragActive, setDragActive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingText, setLoadingText] = useState("");
  const [loadingCount, setLoadingCount] = useState(6);
  // Only display skeleton loading effect if file processing is taking noticeable time (> 180ms)
  const [showSkeleton, setShowSkeleton] = useState(false);
  // Parallel HEIC conversion progress state
  const [progressPercent, setProgressPercent] = useState(0);
  const [perFileProgress, setPerFileProgress] = useState([]);
  const [isCancelled, setIsCancelled] = useState(false);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);
  const abortControllerRef = useRef(null);

  React.useEffect(() => {
    if (!isLoading) {
      return;
    }

    const timer = setTimeout(() => {
      setShowSkeleton(true);
    }, 180);

    return () => clearTimeout(timer);
  }, [isLoading]);

  const processFiles = useCallback(async (fileList) => {
    if (!fileList || fileList.length === 0) return;

    // Cancel any ongoing conversion
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    setLoadingCount(fileList.length || 6);
    setIsLoading(true);
    setShowSkeleton(false);
    setIsCancelled(false);
    setError(null);
    setLoadingText(`Processing ${fileList.length} photo${fileList.length > 1 ? "s" : ""}...`);
    setPerFileProgress([]);
    setProgressPercent(0);

    const rawFiles = Array.from(fileList);
    const heicFiles = rawFiles.filter((f) => isHeicFile(f));
    const otherFiles = rawFiles.filter((f) => !isHeicFile(f));

    const processedItems = [];

    try {
      // Process HEIC files in parallel with concurrency control
      if (heicFiles.length > 0) {
        setLoadingText(`Converting iPhone HEIC photos (${heicFiles.length})...`);
        const results = await convertHeicFilesInParallel(heicFiles, {
          concurrency: 4,
          signal: abortController.signal,
          onProgress: (id, done, total) => {
            setProgressPercent(Math.round((done / total) * 100));
            setPerFileProgress((prev) => {
              const existing = prev.find((entry) => entry.id === id);
              if (existing) {
                return prev.map((entry) =>
                  entry.id === id
                    ? { ...entry, status: "done", progress: 100 }
                    : entry,
                );
              }
              return [
                ...prev,
                { id, name: id, status: "done", progress: 100 },
              ];
            });
          },
        });

        // Update processedItems with converted HEIC files (now Blobs)
        for (let i = 0; i < results.results.length; i++) {
          const result = results.results[i];
          if (result) {
            const originalFile = heicFiles[i];
            processedItems.push({
              id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              name: originalFile.name.replace(/\.(heic|heif)$/i, ".jpg"),
              file: result,
              url: await fileToDataUrl(result),
              dataUrl: await fileToDataUrl(result),
              cropSettings: { offsetX: 0, offsetY: 0, zoom: 1, rotate: 0 },
              isHeicConverted: true,
              originalName: originalFile.name,
            });
          }
        }
      }

      // Process non-HEIC files (JPG, PNG, WEBP) directly
      for (const file of otherFiles) {
        processedItems.push({
          id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          name: file.name,
          file,
          url: await fileToDataUrl(file),
          dataUrl: await fileToDataUrl(file),
          cropSettings: { offsetX: 0, offsetY: 0, zoom: 1, rotate: 0 },
          isHeicConverted: false,
          originalName: file.name,
        });
      }

      if (processedItems.length > 0) {
        onPhotosAdded(processedItems);
      }

      setIsLoading(false);
      setLoadingText("");
      setProgressPercent(100);

      // Cleanup file objects to free memory after data URLs extracted
      setTimeout(() => {
        for (const item of processedItems) {
          if (item.file && item.isHeicConverted) {
            // For HEIC converted files, we already stored dataURL, clean up blob
            item.file = null;
          }
        }
      }, 1000);

    } catch (err) {
      if (err.name === "AbortError") {
        setLoadingText("Conversion cancelled");
        setIsLoading(false);
        setProgressPercent(0);
        setPerFileProgress([]);
        return;
      }
      setError(err.message || "Failed to process photos");
      setIsLoading(false);
      setProgressPercent(0);
      setPerFileProgress([]);
    } finally {
      abortControllerRef.current = null;
    }
  }, [onPhotosAdded]);

  const handleCancel = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setIsCancelled(true);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  };

  const handleDragOver = (e) => { e.preventDefault(); e.stopPropagation(); setDragActive(true); };
  const handleDragLeave = (e) => { e.preventDefault(); e.stopPropagation(); setDragActive(false); };

  const loadSamplePhotos = () => {
    setLoadingText("Loading 6 sample photos for demonstration...");
    setIsLoading(true);
    setShowSkeleton(false);
    setProgressPercent(0);

    setTimeout(() => {
      const sampleItems = SAMPLE_PHOTOS.map((sample, idx) => ({
        id: `sample-${Date.now()}-${idx}`,
        name: sample.name,
        url: sample.url,
        dataUrl: sample.url,
        cropSettings: { offsetX: 0, offsetY: 0, zoom: 1, rotate: 0 },
      }));

      onPhotosAdded(sampleItems);
      setIsLoading(false);
      setLoadingText("");
      setProgressPercent(100);
    }, 500);
  };

  return (
    <div className="glass-card" style={{ padding: "24px", marginBottom: "20px" }}>
      {isLoading && (
        <div
          style={{
            marginBottom: "14px",
            padding: "12px 16px",
            background: "rgba(143, 127, 224, 0.08)",
            border: "1px solid rgba(143, 127, 224, 0.25)",
            borderRadius: "12px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              justifyContent: "space-between",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <Loader2 size={16} color="#8f7fe0" className="animate-spin" />
              <p
                style={{
                  margin: 0,
                  fontWeight: 700,
                  fontSize: 14,
                  color: "#3d3856",
                }}
              >
                {isCancelled ? "Cancelling\u2026" : loadingText}
              </p>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: "#8f7fe0" }}>
                {progressPercent}%
              </span>
              <button
                type="button"
                onClick={handleCancel}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                  fontSize: 12,
                  padding: "4px 10px",
                  borderRadius: "8px",
                  border: "1px solid rgba(239, 68, 68, 0.4)",
                  background: "rgba(239, 68, 68, 0.08)",
                  color: "#b91c1c",
                  cursor: "pointer",
                }}
              >
                <X size={13} /> Cancel
              </button>
            </div>
          </div>
          <div
            style={{
              marginTop: "10px",
              height: "6px",
              borderRadius: "999px",
              background: "rgba(143, 127, 224, 0.18)",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: `${progressPercent}%`,
                height: "100%",
                background: "#8f7fe0",
                borderRadius: "999px",
                transition: "width 200ms ease",
              }}
            />
          </div>
          {perFileProgress.length > 0 && (
            <p
              style={{
                margin: "8px 0 0",
                fontSize: 12,
                color: "#7c7893",
              }}
            >
              Converted {perFileProgress.length} of {loadingCount} HEIC file
              {loadingCount === 1 ? "" : "s"}
            </p>
          )}
        </div>
      )}

      {error && (
        <div
          style={{
            marginBottom: "14px",
            padding: "10px 16px",
            background: "rgba(239, 68, 68, 0.1)",
            border: "1px solid rgba(239, 68, 68, 0.35)",
            borderRadius: "12px",
            fontSize: 13,
            color: "#b91c1c",
            fontWeight: 600,
          }}
        >
          {error}
        </div>
      )}

      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        style={{
          border: `2px dashed ${dragActive ? "#8f7fe0" : "rgba(143, 127, 224, 0.35)"}`,
          borderRadius: "24px",
          padding: photoCount > 0 ? "24px 16px" : "40px 20px",
          textAlign: "center",
          cursor: "pointer",
          background: dragActive ? "rgba(143, 127, 224, 0.08)" : "rgba(255, 255, 255, 0.4)",
          transition: "all 200ms ease",
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,.heic,.heif"
          multiple
          hidden
          onChange={(e) => e.target.files && processFiles(e.target.files)}
        />

        {isLoading && showSkeleton ? (
          <div style={{ padding: "16px 4px" }}>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "10px",
                marginBottom: "16px",
                padding: "6px 16px",
                borderRadius: "999px",
                background: "rgba(143, 127, 224, 0.12)",
                border: "1px solid rgba(143, 127, 224, 0.25)",
              }}
            >
              <div className="skeleton-pulse-dot" />
              <p style={{ margin: 0, fontWeight: 700, color: "var(--text-dark, #3d3856)", fontSize: 14 }}>
                {loadingText}
              </p>
            </div>
            <PhotoGridSkeleton count={Math.min(loadingCount || 6, 6)} />
          </div>
        ) : (
          <div>
            <div
              style={{
                width: 56,
                height: 56,
                margin: "0 auto 14px",
                borderRadius: "50%",
                background: "rgba(143, 127, 224, 0.12)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {photoCount > 0 ? <PlusCircle size={28} color="#8f7fe0" /> : <Upload size={28} color="#8f7fe0" />}
            </div>
            
            <h3 className="heading" style={{ margin: "0 0 6px", fontSize: 18, color: "#3d3856" }}>
              {photoCount > 0 ? "Add More Photos" : "Drag & Drop Bulk Photos Here"}
            </h3>
            
            <p style={{ margin: "0 0 16px", fontSize: 14, color: "#7c7893" }}>
              Or <span style={{ color: "#8f7fe0", fontWeight: 700, textDecoration: "underline" }}>browse files</span> (supports JPG, PNG, WEBP, HEIC)
            </p>

            {photoCount === 0 && (
              <div style={{ display: "inline-flex", gap: "10px" }} onClick={(e) => e.stopPropagation()}>
                <button
                  type="button"
                  onClick={loadSamplePhotos}
                  className="bubble-button-secondary"
                  style={{ fontSize: 12, padding: "6px 14px", display: "inline-flex", alignItems: "center", gap: 6 }}
                >
                  <Sparkles size={13} color="#8f7fe0" />
                  Try 6 Sample Photos
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
