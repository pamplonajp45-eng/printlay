import { jsPDF } from "jspdf";
import JSZip from "jszip";
import { saveAs } from "file-saver";

const yieldToMain = () => new Promise((resolve) => setTimeout(resolve, 0));

/**
 * Exports generated sheet canvases to a multi-page PDF document at exact physical inch scale.
 * Optimized with high-speed JPEG encoding and async event loop yielding to keep UI responsive.
 *
 * @param {Array<{ canvas: HTMLCanvasElement }>} sheets
 * @param {Object} sheetPreset - Sheet preset object with wIn and hIn
 * @param {string} fileName - Destination filename
 * @param {Function} [onProgress] - Optional callback (current, total)
 */
export async function exportToPdf(sheets, sheetPreset, fileName = "printlay-layout.pdf", onProgress) {
  if (!sheets || sheets.length === 0) return;

  await yieldToMain();

  const wIn = sheetPreset.wIn || 8.267;
  const hIn = sheetPreset.hIn || 11.693;
  const orientation = wIn > hIn ? "landscape" : "portrait";

  const pdf = new jsPDF({
    orientation,
    unit: "in",
    format: [wIn, hIn],
    compress: true,
  });

  for (let i = 0; i < sheets.length; i++) {
    if (onProgress) onProgress(i + 1, sheets.length);
    await yieldToMain();

    if (i > 0) {
      pdf.addPage([wIn, hIn], orientation);
    }

    // High quality JPEG encoding is ~10x faster than PNG for multi-megapixel print canvases
    const dataUrl = sheets[i].canvas.toDataURL("image/jpeg", 0.95);
    pdf.addImage(dataUrl, "JPEG", 0, 0, wIn, hIn, undefined, "FAST");
    
    await yieldToMain();
  }

  pdf.save(fileName);
}

/**
 * Downloads a single sheet canvas as a PNG file.
 */
export function exportSheetPng(sheetCanvas, index = 0, fileName = "") {
  const name = fileName || `printlay-sheet-${index + 1}.png`;
  sheetCanvas.toBlob((blob) => {
    if (blob) {
      saveAs(blob, name);
    }
  }, "image/png");
}

/**
 * Bundles all sheet canvases into a single ZIP archive with async event loop yielding.
 */
export async function exportAllPngsZip(sheets, fileName = "printlay-sheets.zip", onProgress) {
  if (!sheets || sheets.length === 0) return;

  await yieldToMain();

  const zip = new JSZip();

  for (let i = 0; i < sheets.length; i++) {
    if (onProgress) onProgress(i + 1, sheets.length);
    await yieldToMain();

    const sheetCanvas = sheets[i].canvas;
    const blob = await new Promise((resolve) => sheetCanvas.toBlob(resolve, "image/png"));
    if (blob) {
      zip.file(`sheet-${i + 1}.png`, blob);
    }
  }

  const zipBlob = await zip.generateAsync({ type: "blob" }, (metadata) => {
    if (onProgress) onProgress(sheets.length, sheets.length, metadata.percent);
  });
  saveAs(zipBlob, fileName);
}

/**
 * Triggers native browser print with custom CSS @page rules matching the sheet size.
 */
export async function triggerBrowserPrint(sheets, sheetPreset, onProgress) {
  if (!sheets || sheets.length === 0) return;

  await yieldToMain();

  const wIn = sheetPreset.wIn || 8.267;
  const hIn = sheetPreset.hIn || 11.693;

  const dataUrls = [];
  for (let i = 0; i < sheets.length; i++) {
    if (onProgress) onProgress(i + 1, sheets.length);
    await yieldToMain();
    dataUrls.push(sheets[i].canvas.toDataURL("image/jpeg", 0.95));
  }

  const iframe = document.createElement("iframe");
  iframe.style.position = "fixed";
  iframe.style.right = "0";
  iframe.style.bottom = "0";
  iframe.style.width = "0";
  iframe.style.height = "0";
  iframe.style.border = "none";
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow.document;

  const imgTags = dataUrls
    .map((dataUrl) => `<div class="page"><img src="${dataUrl}" /></div>`)
    .join("\n");

  doc.open();
  doc.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>PrintLay Print</title>
        <style>
          @page {
            size: ${wIn}in ${hIn}in;
            margin: 0;
          }
          html, body {
            margin: 0;
            padding: 0;
            background: #ffffff;
            width: ${wIn}in;
          }
          .page {
            width: ${wIn}in;
            height: ${hIn}in;
            page-break-after: always;
            page-break-inside: avoid;
            display: flex;
            align-items: center;
            justify-content: center;
            overflow: hidden;
          }
          .page:last-child {
            page-break-after: auto;
          }
          img {
            width: 100%;
            height: 100%;
            object-fit: contain;
            display: block;
          }
        </style>
      </head>
      <body>
        ${imgTags}
      </body>
    </html>
  `);
  doc.close();

  iframe.contentWindow.focus();
  setTimeout(() => {
    iframe.contentWindow.print();
    setTimeout(() => {
      if (document.body.contains(iframe)) {
        document.body.removeChild(iframe);
      }
    }, 1000);
  }, 300);
}
