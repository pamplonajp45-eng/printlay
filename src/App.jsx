import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import Header from "./components/Header";
import UploadZone from "./components/UploadZone";
import PhotoThumbGrid from "./components/PhotoThumbGrid";
import PresetPicker from "./components/PresetPicker";
import SheetPicker from "./components/SheetPicker";
import LayoutControls from "./components/LayoutControls";
import SheetPreview from "./components/SheetPreview";
import CropModal from "./components/CropModal";
import GuideModal from "./components/GuideModal";
import TextControls from "./components/TextControls";
import { Heart, Upload, Image, FileText, Sliders, X, Type } from "lucide-react";

import { PHOTO_PRESETS, SHEET_PRESETS, getOrientedPreset } from "./lib/presets";
import { cropToCanvas, loadImage } from "./lib/cropEngine";
import { generateSheetCanvases, calculateGridInfo } from "./lib/layoutEngine";
import {
  exportToPdf,
  exportSheetPng,
  exportAllPngsZip,
  triggerBrowserPrint,
} from "./lib/exportEngine";
import { saveSession, loadSession, clearSessionStorage } from "./lib/storage";

export default function App() {
  const [theme, setTheme] = useState(
    () => localStorage.getItem("printlay-theme") || "light",
  );
  const [photos, setPhotos] = useState([]);
  const [photoPresetId, setPhotoPresetId] = useState("polaroidClassic");
  const [sheetPresetId, setSheetPresetId] = useState("a4");
  const [photoOrientation, setPhotoOrientation] = useState("portrait");
  const [sheetOrientation, setSheetOrientation] = useState("portrait");
  const [customPhotoSize, setCustomPhotoSize] = useState({
    wIn: 3.0,
    hIn: 4.0,
    unit: "in",
  });

  const [showCutGuides, setShowCutGuides] = useState(true);
  const [cutGuideStyle, setCutGuideStyle] = useState("dashed");
  const [cutGuideColor, setCutGuideColor] = useState("#b0b0be");
  const [cutGuideOpacity, setCutGuideOpacity] = useState(1);
  const [marginIn, setMarginIn] = useState(0.25);
  const [gutterIn, setGutterIn] = useState(0.1);
  const [dpi, setDpi] = useState(300);
  const [frameBgColor, setFrameBgColor] = useState("#ffffff");
  const [showSequenceLabels, setShowSequenceLabels] = useState(false);
  const [pageLabel, setPageLabel] = useState({ text: "", position: "bottom-right", fontSize: 9, enabled: false });
  const [pageLabels, setPageLabels] = useState({});

  const [sheets, setSheets] = useState([]);
  const generationTokenRef = useRef(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeCropPhoto, setActiveCropPhoto] = useState(null);
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [activeTab, setActiveTab] = useState("photoPreset"); // "photos" | "photoPreset" | "sheetPreset" | "layout" | null
  const [textPreview, setTextPreview] = useState(null);

  useEffect(() => {
    localStorage.setItem("printlay-theme", theme);
    const favicon = document.querySelector('link[rel="icon"]');
    if (favicon) {
      favicon.href =
        theme === "dark" ? "/printlay-logo-dark.svg" : "/printlay-logo.svg";
    }
  }, [theme]);

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
      base =
        PHOTO_PRESETS.find((p) => p.id === photoPresetId) || PHOTO_PRESETS[0];
    }
    return getOrientedPreset(base, photoOrientation);
  }, [photoPresetId, customPhotoSize, photoOrientation]);

  const activeSheetPreset = useMemo(() => {
    const base =
      SHEET_PRESETS.find((s) => s.id === sheetPresetId) || SHEET_PRESETS[0];
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
        if (session.photos && session.photos.length > 0)
          setPhotos(session.photos);
        if (session.photoPresetId) setPhotoPresetId(session.photoPresetId);
        if (session.sheetPresetId) setSheetPresetId(session.sheetPresetId);
        if (session.photoOrientation)
          setPhotoOrientation(session.photoOrientation);
        if (session.sheetOrientation)
          setSheetOrientation(session.sheetOrientation);
        if (session.customPhotoSize)
          setCustomPhotoSize(session.customPhotoSize);
        if (session.showCutGuides !== undefined)
          setShowCutGuides(session.showCutGuides);
        if (session.cutGuideStyle) setCutGuideStyle(session.cutGuideStyle);
        if (session.cutGuideColor) setCutGuideColor(session.cutGuideColor);
        if (typeof session.cutGuideOpacity === "number")
          setCutGuideOpacity(session.cutGuideOpacity);
        if (session.marginIn !== undefined) setMarginIn(session.marginIn);
        if (session.gutterIn !== undefined) setGutterIn(session.gutterIn);
        if (session.dpi) setDpi(session.dpi);
        if (session.frameBgColor) setFrameBgColor(session.frameBgColor);
        if (session.showSequenceLabels !== undefined)
          setShowSequenceLabels(session.showSequenceLabels);
        if (session.pageLabel)
          setPageLabel({
            text: "",
            position: "bottom-right",
            fontSize: 9,
            enabled: false,
            ...session.pageLabel,
          });
        if (session.pageLabels) setPageLabels(session.pageLabels);
      }
    }
    restoreSession();
  }, []);

  // Save session when relevant state updates (debounced — writing base64 data
  // URLs to IndexedDB on every drag frame is wasteful)
  useEffect(() => {
    const timer = setTimeout(() => {
      saveSession({
        photos,
        photoPresetId,
        sheetPresetId,
        photoOrientation,
        sheetOrientation,
        customPhotoSize,
        showCutGuides,
        cutGuideStyle,
        cutGuideColor,
        cutGuideOpacity,
        marginIn,
        gutterIn,
        dpi,
        frameBgColor,
        showSequenceLabels,
        pageLabel,
        pageLabels,
      });
    }, 500);
    return () => clearTimeout(timer);
  }, [
    photos,
    photoPresetId,
    sheetPresetId,
    photoOrientation,
    sheetOrientation,
    customPhotoSize,
    showCutGuides,
    cutGuideStyle,
    cutGuideColor,
    cutGuideOpacity,
    marginIn,
    gutterIn,
    dpi,
    frameBgColor,
    showSequenceLabels,
    pageLabel,
    pageLabels,
  ]);

  // Layout Generation Logic
  const handleGenerateLayout = useCallback(async () => {
    if (photos.length === 0) {
      setSheets([]);
      return;
    }

    // Token guard: discard results of stale generations when a newer one starts
    const token = ++generationTokenRef.current;

    setIsGenerating(true);

    // Yield frame to allow React to paint loading spinner on screen
    await new Promise((resolve) => setTimeout(resolve, 50));
    if (token !== generationTokenRef.current) return;

    try {
      // 1. Crop all photos to canvas using cropEngine with event-loop yielding
      const previewPhotos = photos.map((photo) => {
        if (
          !textPreview ||
          (textPreview.targetMode !== "all" &&
            textPreview.targetMode !== photo.id)
        ) {
          return photo;
        }
        return {
          ...photo,
          textOverlays: textPreview.overlay?.text?.trim()
            ? [textPreview.overlay]
            : photo.textOverlays || [],
        };
      });
      const croppedCanvases = [];
      for (let i = 0; i < previewPhotos.length; i++) {
        const photo = previewPhotos[i];
        const loadedImg = await loadImage(photo.url || photo.dataUrl);
        const canvas = cropToCanvas(loadedImg, activePhotoPreset, {
          dpi,
          cropSettings: photo.cropSettings,
          filter: photo.filter || "none",
          filterIntensity:
            typeof photo.filterIntensity === "number"
              ? photo.filterIntensity
              : 1,
          frameBgColor,
          textOverlays: photo.textOverlays || [],
        });
        croppedCanvases.push(canvas);

        // Yield main thread every 4 photos
        if (i % 4 === 0) {
          await new Promise((resolve) => setTimeout(resolve, 0));
          if (token !== generationTokenRef.current) return;
        }
      }

      // 2. Lay out cropped photo canvases onto sheet(s) using layoutEngine
      const generatedSheets = generateSheetCanvases(
        croppedCanvases,
        activePhotoPreset,
        activeSheetPreset,
        previewPhotos,
        {
          dpi,
          marginIn,
          gutterIn,
          showCutGuides,
          cutGuideStyle,
          cutGuideColor,
          cutGuideOpacity,
          showSequenceLabels,
          pageLabel,
          pageLabelOverrides: pageLabels,
        },
      );

      if (token !== generationTokenRef.current) return;
      setSheets(generatedSheets);
    } catch (err) {
      console.error("Layout generation failed:", err);
    } finally {
      if (token === generationTokenRef.current) {
        setIsGenerating(false);
      }
    }
  }, [
    photos,
    activePhotoPreset,
    activeSheetPreset,
    dpi,
    marginIn,
    gutterIn,
    showCutGuides,
    cutGuideStyle,
    cutGuideColor,
    cutGuideOpacity,
    frameBgColor,
    showSequenceLabels,
    pageLabel,
    pageLabels,
    textPreview,
  ]);

  // Auto re-generate layout when photos or key settings change (debounced so
  // drag-panning and text typing coalesce into one regeneration instead of one
  // full re-crop per mousemove/keystroke)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (photos.length > 0) {
        handleGenerateLayout();
      } else {
        setSheets([]);
      }
    }, 180);
    return () => clearTimeout(timer);
  }, [handleGenerateLayout, photos.length]);

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

  // Text Overlay Handlers
  const handleUpdatePhotoText = useCallback((photoId, textOverlays) => {
    setPhotos((prev) =>
      prev.map((p) => (p.id === photoId ? { ...p, textOverlays } : p)),
    );
  }, []);

  const handleApplyTextToAll = useCallback((textOverlays) => {
    setPhotos((prev) => prev.map((p) => ({ ...p, textOverlays })));
  }, []);

  const handleRemoveTextFromAll = useCallback(() => {
    setPhotos((prev) => prev.map((p) => ({ ...p, textOverlays: [] })));
  }, []);

  // Per-page label (waybill) override handler
  const handleUpdatePageLabel = useCallback((sheetIndex, text) => {
    setPageLabels((prev) => ({ ...prev, [String(sheetIndex)]: { text } }));
  }, []);

  // Drag-to-position the page label on the preview (updates the global X/Y —
  // same values the sliders in Page Label controls use)
  const handleUpdatePageLabelPosition = useCallback((x, y) => {
    setPageLabel((prev) => ({
      ...prev,
      x: Math.max(0, Math.min(1, x)),
      y: Math.max(0, Math.min(1, y)),
    }));
  }, []);

  const handleDownloadPdf = useCallback(async () => {
    if (!sheets || sheets.length === 0) return;
    await exportToPdf(
      sheets,
      activeSheetPreset,
      `printlay-layout-${Date.now()}.pdf`,
    );
  }, [sheets, activeSheetPreset]);

  const handleDownloadZip = useCallback(async () => {
    if (!sheets || sheets.length === 0) return;
    if (sheets.length === 1) {
      exportSheetPng(sheets[0].canvas, 0, "printlay-sheet-1.png");
    } else {
      await exportAllPngsZip(sheets, `printlay-sheets-${Date.now()}.zip`);
    }
  }, [sheets]);

  const handlePrint = useCallback(async () => {
    if (!sheets || sheets.length === 0) return;
    await triggerBrowserPrint(sheets, activeSheetPreset);
  }, [sheets, activeSheetPreset]);

  const handleUpdatePhotoCrop = useCallback((photoId, newCropSettings) => {
    setPhotos((prev) =>
      prev.map((p) =>
        p.id === photoId ? { ...p, cropSettings: newCropSettings } : p,
      ),
    );
  }, []);

  const handleUpdatePhotoFilter = useCallback(
    (photoId, newFilter, newIntensity) => {
      setPhotos((prev) =>
        prev.map((p) =>
          p.id === photoId
            ? {
                ...p,
                filter: newFilter !== undefined ? newFilter : p.filter,
                filterIntensity:
                  newIntensity !== undefined
                    ? newIntensity
                    : (p.filterIntensity ?? 1),
              }
            : p,
        ),
      );
    },
    [],
  );

  // Photos that fit on one page (used for "apply filter to page N" feature).
  // For continuous sheets perSheet is "Unlimited", so compute it from rows.
  const photosPerPage = useMemo(() => {
    if (typeof gridInfo.perSheet === "number" && gridInfo.perSheet > 0) {
      return gridInfo.perSheet;
    }
    const cols = gridInfo.cols || 1;
    return cols * Math.max(1, Math.ceil(photos.length / cols));
  }, [gridInfo, photos.length]);

  const totalPages = Math.max(1, Math.ceil(photos.length / photosPerPage));

  const handleApplyFilterToAll = useCallback((newFilter, newIntensity) => {
    setPhotos((prev) =>
      prev.map((p) => ({
        ...p,
        filter: newFilter !== undefined ? newFilter : p.filter,
        filterIntensity:
          newIntensity !== undefined ? newIntensity : (p.filterIntensity ?? 1),
      })),
    );
  }, []);

  // Apply a filter (and intensity) only to the photos that land on a page
  const handleApplyFilterToPage = useCallback(
    (pageNum, newFilter, newIntensity) => {
      const start = (pageNum - 1) * photosPerPage;
      const end = start + photosPerPage;
      setPhotos((prev) =>
        prev.map((p, i) =>
          i >= start && i < end
            ? {
                ...p,
                filter: newFilter !== undefined ? newFilter : p.filter,
                filterIntensity:
                  newIntensity !== undefined
                    ? newIntensity
                    : (p.filterIntensity ?? 1),
              }
            : p,
        ),
      );
    },
    [photosPerPage],
  );

  // Crop Modal Handlers
  const handleSaveCrop = (
    newSettings,
    newFilter,
    newIntensity,
    newTextOverlays,
  ) => {
    if (!activeCropPhoto) return;
    setPhotos((prev) =>
      prev.map((p) =>
        p.id === activeCropPhoto.id
          ? {
              ...p,
              cropSettings: newSettings,
              filter: newFilter !== undefined ? newFilter : p.filter,
              filterIntensity:
                newIntensity !== undefined
                  ? newIntensity
                  : (p.filterIntensity ?? 1),
              textOverlays:
                newTextOverlays !== undefined
                  ? newTextOverlays
                  : p.textOverlays || [],
            }
          : p,
      ),
    );
    setActiveCropPhoto(null);
  };

  const handleApplyToAllCrops = (newSettings, newFilter, newIntensity) => {
    setPhotos((prev) =>
      prev.map((p) => ({
        ...p,
        cropSettings: { ...newSettings },
        ...(newFilter !== undefined ? { filter: newFilter } : {}),
        ...(newIntensity !== undefined
          ? { filterIntensity: newIntensity }
          : {}),
      })),
    );
    setActiveCropPhoto(null);
  };

  return (
    <div className={`app-bg-wrapper theme-${theme}`} data-theme={theme}>
      <div className="app-main-container">
        {/* Header */}
        <Header
          photoCount={photos.length}
          theme={theme}
          onToggleTheme={() =>
            setTheme((current) => (current === "light" ? "dark" : "light"))
          }
          onClearSession={handleClearSession}
          onOpenInfo={() => setShowGuideModal(true)}
          sheets={sheets}
          isGenerating={isGenerating}
          onGenerateLayout={handleGenerateLayout}
          onDownloadPdf={handleDownloadPdf}
          onDownloadZip={handleDownloadZip}
          onPrint={handlePrint}
        />

        {/* Canva-Style Editor Workspace Layout */}
        <div
          className={`editor-workspace-layout ${activeTab ? "" : "drawer-closed"}`}
        >
          {/* Slim Vertical Tool Rail (Far Left) */}
          <nav className="editor-tool-rail">
            <button
              type="button"
              className={`tool-rail-button ${activeTab === "photos" ? "active" : ""}`}
              onClick={() =>
                setActiveTab(activeTab === "photos" ? null : "photos")
              }
              title="Upload & View Photos"
            >
              <Upload size={19} />
              <span className="tool-rail-label">Uploads</span>
              <span className="tool-rail-badge">{photos.length} photos</span>
            </button>

            <button
              type="button"
              className={`tool-rail-button ${activeTab === "photoPreset" ? "active" : ""}`}
              onClick={() =>
                setActiveTab(activeTab === "photoPreset" ? null : "photoPreset")
              }
              title="Select Target Photo Size"
            >
              <Image size={19} />
              <span className="tool-rail-label">Photo Size</span>
              <span className="tool-rail-badge">{activePhotoPreset.name}</span>
            </button>

            <button
              type="button"
              className={`tool-rail-button ${activeTab === "sheetPreset" ? "active" : ""}`}
              onClick={() =>
                setActiveTab(activeTab === "sheetPreset" ? null : "sheetPreset")
              }
              title="Select Output Paper / Sheet Size"
            >
              <FileText size={19} />
              <span className="tool-rail-label">Paper Size</span>
              <span className="tool-rail-badge">{activeSheetPreset.name}</span>
            </button>

            <button
              type="button"
              className={`tool-rail-button ${activeTab === "layout" ? "active" : ""}`}
              onClick={() =>
                setActiveTab(activeTab === "layout" ? null : "layout")
              }
              title="Layout & Cut Guide Settings"
            >
              <Sliders size={19} />
              <span className="tool-rail-label">Guides</span>
              <span className="tool-rail-badge">{dpi} DPI</span>
            </button>

            <button
              type="button"
              className={`tool-rail-button ${activeTab === "text" ? "active" : ""}`}
              onClick={() => setActiveTab(activeTab === "text" ? null : "text")}
              title="Add Text Overlays to Photos"
            >
              <Type size={19} />
              <span className="tool-rail-label">Text</span>
              <span className="tool-rail-badge">
                {photos.filter((p) =>
                  p.textOverlays?.some((o) => o.text?.trim()),
                ).length > 0
                  ? `${photos.filter((p) => p.textOverlays?.some((o) => o.text?.trim())).length} with text`
                  : "Add text"}
              </span>
            </button>
          </nav>

          {/* Expandable Settings Sub-Sidebar Drawer */}
          {activeTab && (
            <aside className="editor-sub-sidebar">
              <div className="sub-sidebar-header">
                <h4
                  style={{
                    margin: 0,
                    fontSize: 15,
                    fontWeight: 700,
                    color: "#3d3856",
                  }}
                >
                  {activeTab === "photos" && "Photo Uploads & Gallery"}
                  {activeTab === "photoPreset" && "Target Photo Print Size"}
                  {activeTab === "sheetPreset" && "Output Paper / Sheet Size"}
                  {activeTab === "layout" && "Layout & Cut-Guide Settings"}
                  {activeTab === "text" && "Freeform Text Editor"}
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
                      onUpdatePhotoFilter={handleUpdatePhotoFilter}
                      onApplyFilterToAll={handleApplyFilterToAll}
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
                    cutGuideColor={cutGuideColor}
                    onChangeCutGuideColor={setCutGuideColor}
                    cutGuideOpacity={cutGuideOpacity}
                    onChangeCutGuideOpacity={setCutGuideOpacity}
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
                    pageLabel={pageLabel}
                    onChangePageLabel={setPageLabel}
                  />
                )}

                {activeTab === "text" && (
                  <TextControls
                    photos={photos}
                    onUpdatePhotoText={handleUpdatePhotoText}
                    onApplyTextToAll={handleApplyTextToAll}
                    onRemoveTextFromAll={handleRemoveTextFromAll}
                    onPreviewChange={setTextPreview}
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
              onUpdatePageLabel={handleUpdatePageLabel}
              onUpdatePageLabelPosition={handleUpdatePageLabelPosition}
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
          <span style={{ color: "#b0acbe", fontWeight: 500 }}>
            Built with love by
          </span>
          <span className="footer-highlight">jpdev</span>
          <span style={{ color: "#b0acbe", fontWeight: 500 }}>
            for Acethetic Finds
          </span>
        </footer>
      </div>

      {/* Per-Photo Crop & Pan Override Modal */}
      {activeCropPhoto && (
        <CropModal
          photo={activeCropPhoto}
          photoPreset={activePhotoPreset}
          onSave={handleSaveCrop}
          onApplyToAll={handleApplyToAllCrops}
          onApplyTextToAll={handleApplyTextToAll}
          onApplyFilterToPage={handleApplyFilterToPage}
          totalPages={totalPages}
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
