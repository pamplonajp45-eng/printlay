import React, { useState } from "react";
import {
  Download,
  FileDown,
  Printer,
  Archive,
  Loader2,
  Sparkles,
} from "lucide-react";
import {
  exportToPdf,
  exportSheetPng,
  exportAllPngsZip,
  triggerBrowserPrint,
} from "../lib/exportEngine";

export default function ExportBar({
  sheets,
  sheetPreset,
  photoCount,
  onGenerateLayout,
  isGenerating,
}) {
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [isExportingZip, setIsExportingZip] = useState(false);
  const [isPreparingPrint, setIsPreparingPrint] = useState(false);
  const [pdfProgress, setPdfProgress] = useState({ current: 0, total: 0 });
  const [zipProgress, setZipProgress] = useState({ current: 0, total: 0 });

  const handleDownloadPdf = async () => {
    if (!sheets || sheets.length === 0) return;
    setIsExportingPdf(true);
    setPdfProgress({ current: 1, total: sheets.length });

    // Yield execution to allow React state to render loading spinner immediately
    await new Promise((r) => setTimeout(r, 50));

    try {
      await exportToPdf(
        sheets,
        sheetPreset,
        `printlay-layout-${Date.now()}.pdf`,
        (curr, tot) => {
          setPdfProgress({ current: curr, total: tot });
        },
      );
    } catch (err) {
      console.error("PDF export failed:", err);
    }
    setIsExportingPdf(false);
  };

  const handleDownloadZip = async () => {
    if (!sheets || sheets.length === 0) return;
    setIsExportingZip(true);
    setZipProgress({ current: 1, total: sheets.length });

    await new Promise((r) => setTimeout(r, 50));

    try {
      if (sheets.length === 1) {
        exportSheetPng(sheets[0].canvas, 0, `printlay-sheet-1.png`);
      } else {
        await exportAllPngsZip(
          sheets,
          `printlay-sheets-${Date.now()}.zip`,
          (curr, tot) => {
            setZipProgress({ current: curr, total: tot });
          },
        );
      }
    } catch (err) {
      console.error("ZIP/PNG export failed:", err);
    }
    setIsExportingZip(false);
  };

  const handlePrint = async () => {
    if (!sheets || sheets.length === 0) return;
    setIsPreparingPrint(true);
    await new Promise((r) => setTimeout(r, 50));
    try {
      await triggerBrowserPrint(sheets, sheetPreset);
    } catch (err) {
      console.error("Print dialog failed:", err);
    }
    setIsPreparingPrint(false);
  };

  return (
    <div
      className="glass-card floating-export-bar"
      style={{
        padding: "16px 24px",
        position: "sticky",
        bottom: "20px",
        zIndex: 100,
        boxShadow: "0 12px 40px rgba(99, 91, 166, 0.25)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "14px",
        }}
      >
        {/* Left side info */}
        <div>
          <h4
            className="heading"
            style={{ margin: 0, fontSize: 16, color: "#3d3856" }}
          >
            {sheets.length > 0
              ? `${sheets.length} Print-Ready Sheet${sheets.length > 1 ? "s" : ""} Generated`
              : `${photoCount} Photo${photoCount === 1 ? "" : "s"} Ready`}
          </h4>
          <p style={{ margin: "2px 0 0", fontSize: 12, color: "#7c7893" }}>
            {sheets.length > 0
              ? `Formatted for ${sheetPreset.name} (${sheetPreset.wIn}″ × ${sheetPreset.hIn}″)`
              : "Click generate to create print sheet layout"}
          </p>
        </div>

        {/* Action buttons */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            flexWrap: "wrap",
          }}
        >
          {/* Main Generate / Re-generate Button */}
          <button
            onClick={onGenerateLayout}
            disabled={photoCount === 0 || isGenerating}
            className="bubble-button-primary"
            style={{
              padding: "12px 24px",
              fontSize: 14,
              opacity: photoCount === 0 ? 0.5 : 1,
              cursor: photoCount === 0 ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            {isGenerating ? (
              <>
                <Loader2 className="spinner" size={16} /> Laying out...
              </>
            ) : (
              <>
                {sheets.length > 0
                  ? "Re-Generate Layout"
                  : `Generate Layout (${photoCount})`}
              </>
            )}
          </button>

          {sheets.length > 0 && (
            <>
              {/* PDF Download */}
              <button
                onClick={handleDownloadPdf}
                disabled={isExportingPdf}
                className="bubble-button-accent"
                style={{
                  padding: "12px 20px",
                  fontSize: 14,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
                title="Download print-ready multi-page PDF"
              >
                {isExportingPdf ? (
                  <Loader2 className="spinner" size={16} />
                ) : (
                  <FileDown size={16} />
                )}
                {isExportingPdf
                  ? `Building PDF (${pdfProgress.current}/${pdfProgress.total})...`
                  : "Download PDF"}
              </button>

              {/* PNG / ZIP Download */}
              <button
                onClick={handleDownloadZip}
                disabled={isExportingZip}
                className="bubble-button-secondary"
                style={{
                  padding: "12px 18px",
                  fontSize: 14,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
                title={
                  sheets.length === 1
                    ? "Download PNG Sheet"
                    : "Download ZIP of all PNG sheets"
                }
              >
                {isExportingZip ? (
                  <Loader2 className="spinner" size={16} />
                ) : sheets.length === 1 ? (
                  <Download size={16} />
                ) : (
                  <Archive size={16} />
                )}
                {isExportingZip
                  ? `Building ZIP (${zipProgress.current}/${zipProgress.total})...`
                  : sheets.length === 1
                    ? "Download PNG"
                    : "Download PNGs (ZIP)"}
              </button>

              {/* Native Print Button */}
              <button
                onClick={handlePrint}
                disabled={isPreparingPrint}
                className="bubble-button-secondary"
                style={{
                  padding: "12px 18px",
                  fontSize: 14,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
                title="Open browser print dialog with 100% scale CSS sizing"
              >
                {isPreparingPrint ? (
                  <Loader2 className="spinner" size={16} />
                ) : (
                  <Printer size={16} />
                )}
                {isPreparingPrint ? "Preparing..." : "Print"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
