import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Download, FileDown, Printer,
  X, Scissors, PanelRightClose, PanelRightOpen, FileCode2,
} from "lucide-react";
import {
  getBleedShape, getSafeDistanceMm, BLEED_STEP_MM, MAX_BLEED_MM, MAX_CUT_INSET_MM, CUT_INSET_STEP_MM,
} from "../lib/bleedGeometry";
import { A4 } from "../lib/layout";
import { planBleedSheets } from "../lib/bleedSheets";
import { renderSheet } from "../lib/renderSheet";
import { downloadPng, downloadPdf, printCanvas, downloadText } from "../lib/exportSheet";
import { buildCutPaths, buildCutSvg, buildCutDxf } from "../lib/cutFile";
import { resolveBleedMm } from "../hooks/useBleedSettings";
import { useBleedLayers, useBleedWarnings } from "../hooks/useBleedWarnings";
import BleedSheetSvg from "./BleedSheetSvg";
import BleedLayers from "./BleedLayers";
import BleedItemList from "./BleedItemList";

const PX_PER_MM = 96 / 25.4; // 100% zoom = real size on a 96 dpi screen
const ZOOM_STEPS = [0.5, 0.75, 1, 1.25, 1.5, 2];
const PANEL_KEY = "printlay.bleedCutPanel.v1";
const WARNINGS_KEY = "printlay.bleedCutWarnings.v1";
const ORIENT_KEY = "printlay.bleedCutOrientation.v1";
const A4_LANDSCAPE = { widthMm: A4.heightMm, heightMm: A4.widthMm };
const EXPORT_DPI = 300;

/** Warning badges: OFF unless the user turned them on. */
function readShowWarnings() {
  try {
    return localStorage.getItem(WARNINGS_KEY) === "on";
  } catch {
    return false;
  }
}

/** Paper orientation for the bleed sheet: portrait unless the user picked landscape. */
function readOrientation() {
  try {
    return localStorage.getItem(ORIENT_KEY) === "landscape" ? "landscape" : "portrait";
  } catch {
    return "portrait";
  }
}

function readPanelOpen() {
  try {
    return localStorage.getItem(PANEL_KEY) !== "closed";
  } catch {
    return true;
  }
}

function SliderRow({ label, value, min, max, step, onChange }) {
  return (
    <label className="bcp-slider">
      <span className="bcp-slider__label">{label}</span>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} />
      <span className="bcp-slider__value">{(+value).toFixed(2)} mm</span>
    </label>
  );
}

/**
 * Full-workspace bleed-cut preview. All geometry comes from bleedGeometry.js
 * and layout.js; exports go through renderSheet with the SAME slots.
 */
export default function BleedCutPreview({
  photos, preset, photoPresets, croppedCanvases, dpi, settings, onUpdateSettings, onSetBleed,
  onCalibrate, onExported, onClose,
}) {
  const [sheetIndex, setSheetIndex] = useState(0);
  const [zoom, setZoom] = useState(null); // null = fit
  const [fitScale, setFitScale] = useState(2);
  const [panelOpen, setPanelOpen] = useState(readPanelOpen);
  const [orientation, setOrientationState] = useState(readOrientation);
  const setOrientation = (o) => {
    setOrientationState(o);
    try {
      localStorage.setItem(ORIENT_KEY, o);
    } catch {
      /* storage blocked: keep in memory */
    }
  };
  // The sheet everything uses: layout, preview, exports and cut files
  const sheetSize = orientation === "landscape" ? A4_LANDSCAPE : A4;
  const [hovered, setHovered] = useState(null);
  const [busy, setBusy] = useState(null);
  const [showWarnings, setShowWarningsState] = useState(readShowWarnings);
  const setShowWarnings = (on) => {
    setShowWarningsState(on);
    try {
      localStorage.setItem(WARNINGS_KEY, on ? "on" : "off");
    } catch {
      /* storage blocked: keep in memory */
    }
  };
  const stageRef = useRef(null);
  const { layers, toggleLayer } = useBleedLayers();

  const bleedMm = resolveBleedMm(settings, preset);
  const { cutInsetMm, gapMm, marginMm, allowRotate } = settings;

  const presets = useMemo(
    () => (photoPresets?.length === photos.length ? photoPresets : photos.map(() => preset)),
    [photoPresets, photos, preset],
  );

  // One bleed shape per distinct size (each size may have its own bleed override).
  // Per-photo presets are cached objects, so a Set keeps this to a few shapes.
  const shapeByPreset = useMemo(() => {
    const map = new Map();
    for (const p of new Set([preset, ...presets])) {
      // Bleed follows the notch / window: ink runs past the cut line into them, the rest stays white
      map.set(p, getBleedShape(p, resolveBleedMm(settings, p), cutInsetMm));
    }
    return map;
  }, [preset, presets, settings, cutInsetMm]);
  const getShape = useCallback((p) => shapeByPreset.get(p), [shapeByPreset]);

  const plan = useMemo(
    () => planBleedSheets({ presets, getShape, settings: { gapMm, marginMm, allowRotate }, sheet: sheetSize }),
    [presets, getShape, gapMm, marginMm, allowRotate, sheetSize],
  );
  const sheetCount = Math.max(1, plan.pages.length);
  const sheet = Math.min(sheetIndex, sheetCount - 1);
  const items = useMemo(() => plan.pages[sheet] ?? [], [plan, sheet]);
  const canvases = useMemo(() => items.map((it) => croppedCanvases?.[it.index] ?? null), [items, croppedCanvases]);
  // Overlap check uses the largest bleed on the sheet
  const sheetBleedMm = items.reduce((m, it) => Math.max(m, it.shape.bleedMm), bleedMm);
  const warnings = useBleedWarnings({
    items, bleedShape: getShape(preset), croppedCanvases: canvases, preset, dpi, bleedMm: sheetBleedMm, sheet: sheetSize, marginMm,
  });

  // Fit-to-view: measure the stage
  useEffect(() => {
    const el = stageRef.current;
    if (!el) return undefined;
    const measure = () => {
      const w = el.clientWidth - 64;
      const h = el.clientHeight - 64;
      if (w > 0 && h > 0) setFitScale(Math.min(w / sheetSize.widthMm, h / sheetSize.heightMm));
    };
    // ResizeObserver also fires once right after observe(), which does the first fit
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [panelOpen, sheetSize]);

  const scale = zoom == null ? fitScale : zoom * PX_PER_MM;
  const zoomPct = Math.round((scale / PX_PER_MM) * 100);
  const stepZoom = (dir) => {
    setZoom((z) => {
      const cur = z ?? fitScale / PX_PER_MM;
      return dir > 0
        ? ZOOM_STEPS.find((s) => s > cur + 0.01) ?? ZOOM_STEPS[ZOOM_STEPS.length - 1]
        : [...ZOOM_STEPS].reverse().find((s) => s < cur - 0.01) ?? ZOOM_STEPS[0];
    });
  };
  const goSheet = (d) => setSheetIndex(Math.min(sheetCount - 1, Math.max(0, sheet + d)));

  // Keyboard: arrows = sheet, +/- = zoom, 0 = fit, Esc = close
  useEffect(() => {
    const onKey = (e) => {
      const tag = e.target?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || e.target?.isContentEditable) return;
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (e.key === "ArrowLeft" || e.key === "ArrowUp") goSheet(-1);
      else if (e.key === "ArrowRight" || e.key === "ArrowDown") goSheet(1);
      else if (e.key === "+" || e.key === "=") stepZoom(1);
      else if (e.key === "-" || e.key === "_") stepZoom(-1);
      else if (e.key === "0") setZoom(null);
      else if (e.key === "Escape") onClose();
      else return;
      e.preventDefault();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const togglePanel = () => {
    setPanelOpen((open) => {
      try {
        localStorage.setItem(PANEL_KEY, open ? "closed" : "open");
      } catch {
        /* ignore */
      }
      return !open;
    });
  };

  // Exports: same slots + transform as the preview, rendered at 300 dpi
  // Artwork only: no printed guide lines (they show on the sticker edge after
  // cutting). The cut path lives in the Cut SVG / DXF files instead.
  const renderExport = (background) => {
    const canvas = document.createElement("canvas");
    renderSheet(canvas, {
      sheet: sheetSize,
      dpi: EXPORT_DPI,
      slots: items.map((it, i) => ({ ...it, image: canvases[i] })),
      background,
      showCutGuide: false,
      showBleed: false,
    });
    return canvas;
  };
  const runExport = async (kind) => {
    if (busy || items.length === 0) return;
    setBusy(kind);
    if (kind === "png" || kind === "pdf" || kind === "print") onExported?.(kind);
    try {
      const name = `printlay-bleed-sheet-${sheet + 1}`;
      if (kind === "svg") {
        // Artwork without printed guides (the cut paths are the guides) + exact cut lines, one A4 file
        const art = renderExport("#ffffff").toDataURL("image/png");
        const svg = buildCutSvg({ paths: buildCutPaths(items), sheet: sheetSize, artworkDataUrl: art, title: name });
        downloadText(svg, `${name}-cut.svg`, "image/svg+xml");
      } else if (kind === "dxf") {
        // Silhouette Studio Basic (no SVG): print PNG (no guides, true A4 at 300 DPI)
        // + DXF cut lines with a blue page frame for one-step alignment
        await downloadPng(renderExport("#ffffff"), `${name}-print.png`, EXPORT_DPI);
        // Real size (mm). Silhouette Studio fits DXF imports to its own size, so the
        // blue page frame is there to resize it back to exactly the page.
        const dxf = buildCutDxf({ paths: buildCutPaths(items), sheet: sheetSize, pageFrame: true });
        downloadText(dxf, `${name}-cut.dxf`, "application/dxf");
      } else if (kind === "png") await downloadPng(renderExport(null), `${name}.png`, EXPORT_DPI);
      else if (kind === "pdf") await downloadPdf(renderExport("#ffffff"), sheetSize, `${name}.pdf`);
      else printCanvas(renderExport("#ffffff"), sheetSize);
    } catch (err) {
      console.error("Bleed export failed", err);
    } finally {
      setBusy(null);
    }
  };

  const fixGap = (mm) => onUpdateSettings({ gapMm: Math.min(10, Math.ceil(mm * 2) / 2) });
  const noPhotos = photos.length === 0;
  const tooBig = !noPhotos && plan.capacity === 0;

  return (
    <div className="bcp">
      <header className="bcp-topbar">
        <div className="bcp-title">
          <Scissors size={17} />
          <h2>Bleed-cut preview</h2>
          <span className="bcp-muted">{plan.mixed ? "Mixed sizes" : presets[0]?.name || preset?.name || "Custom"} · A4 {orientation}</span>
        </div>

        <div className="bcp-group" role="group" aria-label="Sheet">
          <button type="button" className="bcp-icon-btn" onClick={() => goSheet(-1)} disabled={sheet === 0} title="Previous sheet (←)">
            <ChevronLeft size={16} />
          </button>
          <span className="bcp-pager">Sheet {sheet + 1} / {sheetCount}</span>
          <button type="button" className="bcp-icon-btn" onClick={() => goSheet(1)} disabled={sheet >= sheetCount - 1} title="Next sheet (→)">
            <ChevronRight size={16} />
          </button>
        </div>

        <div className="bcp-group" role="group" aria-label="Paper orientation">
          <button type="button" className={`bcp-chip ${orientation === "portrait" ? "active" : ""}`}
            onClick={() => setOrientation("portrait")} aria-pressed={orientation === "portrait"} title="A4 portrait (210 × 297 mm)">
            Portrait
          </button>
          <button type="button" className={`bcp-chip ${orientation === "landscape" ? "active" : ""}`}
            onClick={() => setOrientation("landscape")} aria-pressed={orientation === "landscape"} title="A4 landscape (297 × 210 mm)">
            Landscape
          </button>
        </div>

        <div className="bcp-group" role="group" aria-label="Zoom">
          <button type="button" className={`bcp-chip ${zoom == null ? "active" : ""}`} onClick={() => setZoom(null)} title="Fit (0)">
            Fit
          </button>
          <button type="button" className="bcp-icon-btn" onClick={() => stepZoom(-1)} title="Zoom out (−)"><ZoomOut size={15} /></button>
          <select
            className="bcp-zoom-select"
            value={zoom == null ? "fit" : String(zoom)}
            onChange={(e) => setZoom(e.target.value === "fit" ? null : Number(e.target.value))}
            aria-label="Zoom level"
          >
            <option value="fit">{zoomPct}%</option>
            {ZOOM_STEPS.map((z) => <option key={z} value={String(z)}>{z * 100}%</option>)}
          </select>
          <button type="button" className="bcp-icon-btn" onClick={() => stepZoom(1)} title="Zoom in (+)"><ZoomIn size={15} /></button>
        </div>

        <div className="bcp-group bcp-actions">
          <button type="button" className="bcp-btn" onClick={() => runExport("png")} disabled={!!busy || !items.length}
            title="Print-ready PNG of this sheet, 300 dpi, transparent outside the bleed">
            <Download size={14} /> {busy === "png" ? "Preparing…" : "PNG"}
          </button>
          <button type="button" className="bcp-btn" onClick={() => runExport("pdf")} disabled={!!busy || !items.length}
            title="Exact-size A4 PDF of this sheet, 300 dpi">
            <FileDown size={14} /> {busy === "pdf" ? "Preparing…" : "PDF"}
          </button>
          <button type="button" className="bcp-btn" onClick={() => runExport("svg")} disabled={!!busy || !items.length}
            title="Silhouette cut file (SVG): artwork + exact cut lines on one A4 page. Drag into Silhouette Studio (Designer Edition or higher).">
            <FileCode2 size={14} /> {busy === "svg" ? "Preparing…" : "Cut SVG"}
          </button>
          <button type="button" className="bcp-btn bcp-btn--ghost" onClick={() => runExport("dxf")} disabled={!!busy || !items.length}
            title="For Silhouette Studio Basic Edition (no SVG): downloads a print PNG (true A4, 300 DPI) and a DXF cut file. Open both, place each at X 0 / Y 0, delete the blue page frame, then print & cut.">
            <FileCode2 size={14} /> {busy === "dxf" ? "Preparing…" : "Studio Basic"}
          </button>
          <button type="button" className="bcp-btn bcp-btn--ghost" onClick={() => runExport("print")} disabled={!!busy || !items.length}
            title="Print this sheet at 100% / actual size">
            <Printer size={14} /> Print
          </button>
          <button type="button" className="bcp-icon-btn" onClick={togglePanel} title={panelOpen ? "Hide panel" : "Show panel"}>
            {panelOpen ? <PanelRightClose size={16} /> : <PanelRightOpen size={16} />}
          </button>
          <button type="button" className="bcp-icon-btn" onClick={onClose} title="Close preview (Esc)"><X size={16} /></button>
        </div>
      </header>

      <div className="bcp-body">
        <div className="bcp-stage" ref={stageRef}>
          <div className="bcp-paper" style={{ width: sheetSize.widthMm * scale, height: sheetSize.heightMm * scale }}>
            <BleedSheetSvg
              sheet={sheetSize}
              marginMm={marginMm}
              items={items}
              canvases={canvases}
              cutInsetMm={cutInsetMm}
              layers={layers}
              scale={scale}
              hovered={hovered}
            />
          </div>
          {(noPhotos || tooBig) && (
            <p className="bcp-empty">
              {noPhotos ? "Upload photos to preview the bleed and cut lines." : "This size with bleed does not fit inside the page margin."}
            </p>
          )}
        </div>

        {panelOpen && (
          <aside className="bcp-panel">
            <section className="bcp-section">
              <h4 className="bcp-section__title">Bleed &amp; cut</h4>
              <SliderRow label="Bleed" value={bleedMm} min={0} max={MAX_BLEED_MM} step={BLEED_STEP_MM} onChange={onSetBleed} />
              <SliderRow label="Cut inset" value={cutInsetMm} min={0} max={MAX_CUT_INSET_MM} step={CUT_INSET_STEP_MM}
                onChange={(v) => onUpdateSettings({ cutInsetMm: v })} />
              <SliderRow label="Gap" value={gapMm} min={0} max={10} step={0.5} onChange={(v) => onUpdateSettings({ gapMm: v })} />
              <p className="bcp-muted">
                {plan.mixed && !plan.grid ? "Mixed sizes, one size per row" : `${plan.capacity} per sheet${plan.mixed ? " (mixed name tags)" : ""}`} · {photos.length} photo{photos.length !== 1 ? "s" : ""} · safe zone {getSafeDistanceMm(bleedMm, cutInsetMm)} mm inside cut
              </p>
              <button
                type="button"
                className="bcp-btn bcp-btn--ghost bcp-btn--block"
                onClick={onCalibrate}
                title="Prints one A4 page with this shape at 0, 1, 1.5 and 2 mm bleed. Cut it once on your Silhouette and use the smallest bleed that shows no white edge."
              >
                <Scissors size={14} /> Print bleed calibration sheet
              </button>
            </section>

            <BleedLayers layers={layers} toggleLayer={toggleLayer} />

            <BleedItemList
              itemInfos={warnings.itemInfos}
              warningsByIndex={warnings.byIndex}
              fixGapMm={warnings.fixGapMm}
              onFixGap={fixGap}
              onHover={setHovered}
              showWarnings={showWarnings}
              onToggleWarnings={setShowWarnings}
            />
          </aside>
        )}
      </div>
    </div>
  );
}
