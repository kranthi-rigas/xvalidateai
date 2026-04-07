import * as pdfjsLib from "pdfjs-dist";
import pdfWorker from "pdfjs-dist/build/pdf.worker?url";
import jsPDF from "jspdf";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

/**
 * Fetches a PDF, stamps every page with a diagonal org-id watermark
 * (identical style to the assessment report), and triggers a download.
 *
 * Uses only pdfjs-dist and jsPDF — both already in the project.
 *
 * @param {string} url           - Static path e.g. "/documents/foo.pdf"
 * @param {string} filename      - Downloaded filename
 * @param {string} watermarkText - Org ID, uppercased automatically
 */
export async function downloadPdfWithWatermark(url, filename, watermarkText) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Failed to fetch document: ${url}`);
  const arrayBuffer = await response.arrayBuffer();

  const pdfDoc = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const numPages = pdfDoc.numPages;

  // Determine orientation from first page
  const firstPage = await pdfDoc.getPage(1);
  const firstVp = firstPage.getViewport({ scale: 1 });
  const isLandscape = firstVp.width > firstVp.height;

  const pdf = new jsPDF(isLandscape ? "l" : "p", "mm", "a4");
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();

  for (let pageNum = 1; pageNum <= numPages; pageNum++) {
    if (pageNum > 1) pdf.addPage();

    const page = await pdfDoc.getPage(pageNum);

    // Scale to match A4 output resolution (2× for clarity)
    const SCALE = 2;
    const viewport = page.getViewport({ scale: SCALE });

    const canvas = document.createElement("canvas");
    canvas.width = viewport.width;
    canvas.height = viewport.height;

    await page.render({ canvasContext: canvas.getContext("2d"), viewport }).promise;

    // Page content fills the full A4
    pdf.addImage(canvas.toDataURL("image/jpeg", 0.92), "JPEG", 0, 0, pageW, pageH);

    // Diagonal watermark on top — same logic as ProjectDetailsModern
    drawWatermark(pdf, watermarkText, pageW, pageH);
  }

  pdf.save(filename);
}

/* ── Watermark — matches ProjectDetailsModern exactly ───────────────────── */
function drawWatermark(pdf, text, pageW, pageH) {
  const label = text.toUpperCase();
  pdf.saveGraphicsState();
  pdf.setGState(new pdf.GState({ opacity: 0.15 }));
  pdf.setFont("helvetica", "bold");
  pdf.setTextColor(180, 180, 180);
  const maxWidth = pageW * 0.65;
  let fontSize = 140;
  pdf.setFontSize(fontSize);
  while (pdf.getTextWidth(label) > maxWidth && fontSize > 20) {
    fontSize -= 2;
    pdf.setFontSize(fontSize);
  }
  pdf.text(label, pageW / 2, pageH / 2, {
    align: "center",
    baseline: "middle",
    angle: 45,
  });
  pdf.restoreGraphicsState();
}
