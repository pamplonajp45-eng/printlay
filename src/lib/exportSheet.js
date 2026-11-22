import { A4 } from "./layout";
import { setPngDpi } from "./pngDpi";

function download(blobOrUrl, filename) {
  const url = typeof blobOrUrl === "string" ? blobOrUrl : URL.createObjectURL(blobOrUrl);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  if (typeof blobOrUrl !== "string") setTimeout(() => URL.revokeObjectURL(url), 2000);
}

export function canvasToBlob(canvas, type = "image/png", quality) {
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Canvas export failed"))), type, quality)
  );
}

/**
 * Canvas rendered with background = null is transparent outside the bleed.
 * `dpi` writes the print resolution into the file, so it opens at true size
 * (e.g. 300 -> A4 in Silhouette Studio).
 */
export async function downloadPng(canvas, filename = "printlay-sheet.png", dpi = null) {
  let blob = await canvasToBlob(canvas, "image/png");
  if (dpi) {
    const bytes = setPngDpi(new Uint8Array(await blob.arrayBuffer()), dpi);
    blob = new Blob([bytes], { type: "image/png" });
  }
  download(blob, filename);
}

/**
 * Exact-size PDF: the page is the sheet size in mm and the image fills it 1:1,
 * so there is nothing for a viewer to "fit to page". Render with background "#ffffff".
 * Needs: npm i jspdf  (skip this and reuse your existing PDF code if you already have one)
 */
export async function downloadPdf(canvas, sheet = A4, filename = "printlay-sheet.pdf") {
  const { jsPDF } = await import("jspdf");
  // jsPDF swaps width/height to match `orientation`, so it must follow the sheet
  const orientation = sheet.widthMm > sheet.heightMm ? "landscape" : "portrait";
  const pdf = new jsPDF({ unit: "mm", format: [sheet.widthMm, sheet.heightMm], orientation, compress: true });
  pdf.addImage(canvas.toDataURL("image/png"), "PNG", 0, 0, sheet.widthMm, sheet.heightMm, undefined, "FAST");
  pdf.save(filename);
}

/** Opens the print dialog with the sheet at true physical size (no margins, no scaling). */
export function printCanvas(canvas, sheet = A4) {
  const iframe = document.createElement("iframe");
  iframe.style.cssText = "position:fixed;right:0;bottom:0;width:0;height:0;border:0";
  document.body.appendChild(iframe);
  const doc = iframe.contentWindow.document;
  doc.open();
  doc.write(`<!doctype html><html><head><style>
    @page { size: ${sheet.widthMm}mm ${sheet.heightMm}mm; margin: 0; }
    html, body { margin: 0; padding: 0; }
    img { display: block; width: ${sheet.widthMm}mm; height: ${sheet.heightMm}mm; }
  </style></head><body><img src="${canvas.toDataURL("image/png")}"></body></html>`);
  doc.close();
  const img = doc.querySelector("img");
  const go = () => {
    iframe.contentWindow.focus();
    iframe.contentWindow.print();
    setTimeout(() => iframe.remove(), 1500);
  };
  if (img.complete) go();
  else img.onload = go;
}
/** Saves text (SVG / DXF cut files) as a download. */
export function downloadText(text, filename, type = "text/plain") {
  download(new Blob([text], { type: `${type};charset=utf-8` }), filename);
}
