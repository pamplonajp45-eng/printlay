import React, { useRef, useState } from "react";
import { Upload, Image as ImageIcon, Sparkles, Loader2, PlusCircle } from "lucide-react";
import { isHeicFile, convertHeicToJpeg } from "../lib/heicEngine";

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
  const fileInputRef = useRef(null);

  const processFiles = async (fileList) => {
    if (!fileList || fileList.length === 0) return;

    setIsLoading(true);
    setLoadingText(`Processing ${fileList.length} photo${fileList.length > 1 ? "s" : ""}...`);

    const rawFiles = Array.from(fileList);
    const processedItems = [];

    for (let i = 0; i < rawFiles.length; i++) {
      let file = rawFiles[i];

      if (!file.type.startsWith("image/") && !isHeicFile(file)) {
        continue;
      }

      if (isHeicFile(file)) {
        setLoadingText(`Converting iPhone HEIC photo (${i + 1}/${rawFiles.length})...`);
        file = await convertHeicToJpeg(file);
      }

      const dataUrl = await fileToDataUrl(file);
      processedItems.push({
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: file.name,
        file,
        url: dataUrl,
        dataUrl,
        cropSettings: { offsetX: 0, offsetY: 0, zoom: 1, rotate: 0 },
      });
    }

    if (processedItems.length > 0) {
      onPhotosAdded(processedItems);
    }

    setIsLoading(false);
    setLoadingText("");
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const loadSamplePhotos = async () => {
    setIsLoading(true);
    setLoadingText("Loading 6 sample photos for demonstration...");

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
  };

  return (
    <div className="glass-card" style={{ padding: "24px", marginBottom: "20px" }}>
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

        {isLoading ? (
          <div style={{ padding: "20px 0" }}>
            <Loader2 className="spinner" size={36} color="#8f7fe0" style={{ margin: "0 auto 12px" }} />
            <p style={{ margin: 0, fontWeight: 700, color: "#3d3856", fontSize: 16 }}>
              {loadingText}
            </p>
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
