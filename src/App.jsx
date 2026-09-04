import React, { useState, useEffect, useCallback, useMemo } from "react";
import Header from "./components/Header";
import UploadZone from "./components/UploadZone";
import PhotoThumbGrid from "./components/PhotoThumbGrid";
import PresetPicker from "./components/PresetPicker";
import SheetPicker from "./components/SheetPicker";
import LayoutControls from "./components/LayoutControls";
import SheetPreview from "./components/SheetPreview";
import ExportBar from "./components/ExportBar";
import CropModal from "./components/CropModal";
import GuideModal from "./components/GuideModal";
import { Heart, Upload, Image, FileText, Sliders, X } from "lucide-react";

import { PHOTO_PRESETS, SHEET_PRESETS, getOrientedPreset } from "./lib/presets";
import { cropToCanvas, loadImage } from "./lib/cropEngine";
import { generateSheetCanvases, calculateGridInfo } from "./lib/layoutEngine";
import { saveSession, loadSession, clearSessionStorage } from "./lib/storage";

export default function App() {
  const [photos, setPhotos] = useState([]);
  const [photoPresetId, setPhotoPresetId] = useState("polaroidClassic");
  const [sheetPresetId, setSheetPresetId] = useState("a4");
  const [photoOrientation, setPhotoOrientation] = useState("portrait");
  const [sheetOrientation, setSheetOrientation] = useState("portrait");
  const [customPhotoSize, setCustomPhotoSize] = useState({ wIn: 3.0, hIn: 4.0, unit: "in" });
  
  const [showCutGuides, setShowCutGuides] = useState(true);
  const [cutGuideStyle, setCutGuideStyle] = useState("dashed");
  const [marginIn, setMarginIn] = useState(0.25);
  const [gutterIn, setGutterIn] = useState(0.1);
  const [dpi, setDpi] = useState(300);
  const [frameBgColor, setFrameBgColor] = useState("#ffffff");
  const [showSequenceLabels, setShowSequenceLabels] = useState(false);

  const [sheets, setSheets] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeCropPhoto, setActiveCropPhoto] = useState(null);
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [activeTab, setActiveTab] = useState("photoPreset"); // "photos" | "photoPreset" | "sheetPreset" | "layout" | null

  // Active presets lookup with orientation applied
  const activePhotoPreset = useMemo(() => {
    let base;
    if (photoPresetId === "custom") {
      base = {
        id: "custom",
        name: "Custom Size",
        wIn: customPhotoSize.wIn,
        hIn: customPhotoSize.hIn,
        customWidthIn: customPhotoSize.wIn,
        customHeightIn: customPhotoSize.hIn,
        aspectRatio: customPhotoSize.wIn / customPhotoSize.hIn,
        isPolaroid: false,
      };
    } else {
      base = PHOTO_PRESETS.find((p) => p.id === photoPresetId) || PHOTO_PRESETS[0];
    }
    return getOrientedPreset(base, photoOrientation);
  }, [photoPresetId, customPhotoSize, photoOrientation]);

  const activeSheetPreset = useMemo(() => {
    const base = SHEET_PRESETS.find((s) => s.id === sheetPresetId) || SHEET_PRESETS[0];
    return getOrientedPreset(base, sheetOrientation);
  }, [sheetPresetId, sheetOrientation]);

  const gridInfo = useMemo(() => {
    return calculateGridInfo(activePhotoPreset, activeSheetPreset, {
      dpi,
      marginIn,
      gutterIn,
    });
  }, [activePhotoPreset, activeSheetPreset, dpi, marginIn, gutterIn]);

  // Load session from IndexedDB on initial mount
  useEffect(() => {
    async function restoreSession() {
      const session = await loadSession();
      if (session) {
        if (session.photos && session.photos.length > 0) setPhotos(session.photos);
        if (session.photoPresetId) setPhotoPresetId(session.photoPresetId);
        if (session.sheetPresetId) setSheetPresetId(session.sheetPresetId);
        if (session.photoOrientation) setPhotoOrientation(session.photoOrientation);
        if (session.sheetOrientation) setSheetOrientation(session.sheetOrientation);
        if (session.customPhotoSize) setCustomPhotoSize(session.customPhotoSize);
        if (session.showCutGuides !== undefined) setShowCutGuides(session.showCutGuides);
        if (session.cutGuideStyle) setCutGuideStyle(session.cutGuideStyle);
        if (session.marginIn !== undefined) setMarginIn(session.marginIn);
        if (session.gutterIn !== undefined) setGutterIn(session.gutterIn);
        if (session.dpi) setDpi(session.dpi);
        if (session.frameBgColor) setFrameBgColor(session.frameBgColor);
        if (session.showSequenceLabels !== undefined) setShowSequenceLabels(session.showSequenceLabels);
      }
    }
    restoreSession();
  }, []);

  // Save session when relevant state updates
  useEffect(() => {
    saveSession({
      photos,
      photoPresetId,
      sheetPresetId,
      photoOrientation,
      sheetOrientation,
      customPhotoSize,
      showCutGuides,
      cutGuideStyle,
      marginIn,
      gutterIn,
      dpi,
      frameBgColor,
      showSequenceLabels,
    });
  }, [
    photos,
    photoPresetId,
    sheetPresetId,
    photoOrientation,
    sheetOrientation,
    customPhotoSize,
    showCutGuides,
    cutGuideStyle,
    marginIn,
    gutterIn,
    dpi,
    frameBgColor,
    showSequenceLabels,
  ]);

  // Layout Generation Logic
  const handleGenerateLayout = useCallback(async () => {
    if (photos.length === 0) {
      setSheets([]);
      return;
    }

    setIsGenerating(true);

    try {
      // 1. Crop all photos to canvas using cropEngine
      const croppedCanvases = await Promise.all(
        photos.map(async (photo) => {
          const loadedImg = await loadImage(photo.url || photo.dataUrl);
          return cropToCanvas(loadedImg, activePhotoPreset, {
            dpi,
            cropSettings: photo.cropSettings,
            frameBgColor,
          });
        })
      );

      // 2. Lay out cropped photo canvases onto sheet(s) using layoutEngine
      const generatedSheets = generateSheetCanvases(
        croppedCanvases,
        activePhotoPreset,
        activeSheetPreset,
        photos,
        {
          dpi,
          marginIn,
          gutterIn,
          showCutGuides,
          cutGuideStyle,
          showSequenceLabels,
        }
      );

      setSheets(generatedSheets);
    } catch (err) {
      console.error("Layout generation failed:", err);
    }

    setIsGenerating(false);
  }, [
    photos,
    activePhotoPreset,
    activeSheetPreset,
    dpi,
    marginIn,
    gutterIn,
    showCutGuides,
    cutGuideStyle,
    frameBgColor,
    showSequenceLabels,
  ]);

  // Auto re-generate layout when photos or key settings change
  useEffect(() => {
    if (photos.length > 0) {
      handleGenerateLayout();
    } else {
      setSheets([]);
    }
  }, [photos, activePhotoPreset, activeSheetPreset, showCutGuides, cutGuideStyle, marginIn, gutterIn, dpi, frameBgColor, showSequenceLabels]);

  // Handlers for Photo Management
  const handlePhotosAdded = (newPhotos) => {
    setPhotos((prev) => [...prev, ...newPhotos]);
  };

  const handleRemovePhoto = (id) => {
    setPhotos((prev) => prev.filter((p) => p.id !== id));
  };

  const handleDuplicatePhoto = (photo) => {
    const copy = {
      ...photo,
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    };
    setPhotos((prev) => [...prev, copy]);
  };

  const handleMovePhoto = (fromIdx, toIdx) => {
    setPhotos((prev) => {
      const list = [...prev];
      const [item] = list.splice(fromIdx, 1);
      list.splice(toIdx, 0, item);
      return list;
    });
  };

  const handleClearSession = async () => {
    if (window.confirm("Are you sure you want to clear all uploaded photos?")) {
      setPhotos([]);
      setSheets([]);
      await clearSessionStorage();
    }
  };

  const handleUpdatePhotoCrop = useCallback((photoId, newCropSettings) => {
    setPhotos((prev) =>
      prev.map((p) => (p.id === photoId ? { ...p, cropSettings: newCropSettings } : p))
    );
  }, []);

  // Crop Modal Handlers
  const handleSaveCrop = (newSettings) => {
    if (!activeCropPhoto) return;
    setPhotos((prev) =>
      prev.map((p) => (p.id === activeCropPhoto.id ? { ...p, cropSettings: newSettings } : p))
    );
    setActiveCropPhoto(null);
  };

  const handleApplyToAllCrops = (newSettings) => {
    setPhotos((prev) => prev.map((p) => ({ ...p, cropSettings: { ...newSettings } })));
    setActiveCropPhoto(null);
  };

  return (
    <div className="app-bg-wrapper">
      <div className="app-main-container">
        
        {/* Header */}
        <Header
          photoCount={photos.length}
          onClearSession={handleClearSession}
          onOpenInfo={() => setShowGuideModal(true)}
        />

        {/* Canva-Style Editor Workspace Layout */}
        <div className="editor-workspace-layout">
          
          {/* Slim Vertical Tool Rail (Far Left) */}
          <nav className="editor-tool-rail">
            <button
              type="button"
              className={`tool-rail-button ${activeTab === "photos" ? "active" : ""}`}
              onClick={() => setActiveTab(activeTab === "photos" ? null : "photos")}
              title="Upload & View Photos"
            >
              <Upload size={19} />
              <span className="tool-rail-label">Uploads</span>
              <span className="tool-rail-badge">{photos.length} photos</span>
            </button>

            <button
              type="button"
              className={`tool-rail-button ${activeTab === "photoPreset" ? "active" : ""}`}
              onClick={() => setActiveTab(activeTab === "photoPreset" ? null : "photoPreset")}
              title="Select Target Photo Size"
            >
              <Image size={19} />
              <span className="tool-rail-label">Photo Size</span>
              <span className="tool-rail-badge">{activePhotoPreset.name}</span>
            </button>

            <button
              type="button"
              className={`tool-rail-button ${activeTab === "sheetPreset" ? "active" : ""}`}
              onClick={() => setActiveTab(activeTab === "sheetPreset" ? null : "sheetPreset")}
              title="Select Output Paper / Sheet Size"
            >
              <FileText size={19} />
              <span className="tool-rail-label">Paper Size</span>
              <span className="tool-rail-badge">{activeSheetPreset.name}</span>
            </button>

            <button
              type="button"
              className={`tool-rail-button ${activeTab === "layout" ? "active" : ""}`}
              onClick={() => setActiveTab(activeTab === "layout" ? null : "layout")}
              title="Layout & Cut Guide Settings"
            >
              <Sliders size={19} />
              <span className="tool-rail-label">Guides</span>
              <span className="tool-rail-badge">{dpi} DPI</span>
            </button>
          </nav>

          {/* Expandable Settings Sub-Sidebar Drawer */}
          {activeTab && (
            <aside className="editor-sub-sidebar">
              <div className="sub-sidebar-header">
                <h4 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "#3d3856" }}>
                  {activeTab === "photos" && "Photo Uploads & Gallery"}
                  {activeTab === "photoPreset" && "Target Photo Print Size"}
                  {activeTab === "sheetPreset" && "Output Paper / Sheet Size"}
                  {activeTab === "layout" && "Layout & Cut-Guide Settings"}
                </h4>
                <button
                  type="button"
                  onClick={() => setActiveTab(null)}
                  className="sub-sidebar-close-btn"
                  title="Collapse Drawer"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="sub-sidebar-content">
                {activeTab === "photos" && (
                  <>
                    <UploadZone
                      onPhotosAdded={handlePhotosAdded}
                      photoCount={photos.length}
                    />
                    <PhotoThumbGrid
                      photos={photos}
                      onRemovePhoto={handleRemovePhoto}
                      onDuplicatePhoto={handleDuplicatePhoto}
                      onMovePhoto={handleMovePhoto}
                      onOpenCropModal={(photo) => setActiveCropPhoto(photo)}
                    />
                  </>
                )}

                {activeTab === "photoPreset" && (
                  <PresetPicker
                    selectedPresetId={photoPresetId}
                    onSelectPreset={(id) => setPhotoPresetId(id)}
                    photoOrientation={photoOrientation}
                    onChangePhotoOrientation={(o) => setPhotoOrientation(o)}
                    customPhotoSize={customPhotoSize}
                    onChangeCustomSize={(size) => setCustomPhotoSize(size)}
                  />
                )}

                {activeTab === "sheetPreset" && (
                  <SheetPicker
                    selectedSheetId={sheetPresetId}
                    onSelectSheet={(id) => setSheetPresetId(id)}
                    sheetOrientation={sheetOrientation}
                    onChangeSheetOrientation={(o) => setSheetOrientation(o)}
                  />
                )}

                {activeTab === "layout" && (
                  <LayoutControls
                    showCutGuides={showCutGuides}
                    onToggleCutGuides={setShowCutGuides}
                    cutGuideStyle={cutGuideStyle}
                    onChangeCutGuideStyle={setCutGuideStyle}
                    marginIn={marginIn}
                    onChangeMargin={setMarginIn}
                    gutterIn={gutterIn}
                    onChangeGutter={setGutterIn}
                    dpi={dpi}
                    onChangeDpi={setDpi}
                    frameBgColor={frameBgColor}
                    onChangeFrameBgColor={setFrameBgColor}
                    showSequenceLabels={showSequenceLabels}
                    onToggleSequenceLabels={setShowSequenceLabels}
                  />
                )}
              </div>
            </aside>
          )}

          {/* Main Canvas Viewport (Zero-scroll, full screen visibility) */}
          <main className="editor-canvas-viewport">
            <SheetPreview
              sheets={sheets}
              photoPreset={activePhotoPreset}
              sheetPreset={activeSheetPreset}
              gridInfo={gridInfo}
              photoCount={photos.length}
              onUpdatePhotoCrop={handleUpdatePhotoCrop}
              onOpenCropModal={(photo) => setActiveCropPhoto(photo)}
            />

            <ExportBar
              sheets={sheets}
              sheetPreset={activeSheetPreset}
              photoCount={photos.length}
              onGenerateLayout={handleGenerateLayout}
              isGenerating={isGenerating}
            />
          </main>

        </div>

        {/* Footer credit */}
        <footer
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            flexWrap: "wrap",
            marginTop: "20px",
            padding: "8px",
            fontSize: "13px",
            fontWeight: 600,
            color: "#7c7893",
            textAlign: "center",
          }}
        >
          <span className="footer-brand">Jpdev&reg;</span>
          <Heart size={14} color="#ff6b8a" fill="#ff6b8a" />
          <span style={{ color: "#b0acbe", fontWeight: 500 }}>Built with love by</span>
          <span className="footer-highlight">jpdev</span>
          <span style={{ color: "#b0acbe", fontWeight: 500 }}>for aesthetic finds</span>
        </footer>

      </div>

      {/* Per-Photo Crop & Pan Override Modal */}
      {activeCropPhoto && (
        <CropModal
          photo={activeCropPhoto}
          photoPreset={activePhotoPreset}
          onSave={handleSaveCrop}
          onApplyToAll={handleApplyToAllCrops}
          onClose={() => setActiveCropPhoto(null)}
        />
      )}

      {/* User Guide Modal */}
      {showGuideModal && (
        <GuideModal onClose={() => setShowGuideModal(false)} />
      )}
    </div>
  );
}
