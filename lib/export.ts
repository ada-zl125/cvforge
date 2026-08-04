import { toCanvas } from "html-to-image";
import jsPDF from "jspdf";
import { A4_H_MM, A4_W_MM, PAGE_W, PAGE_H, TOP, BOTTOM, CONTENT_H } from "@/lib/page-constants";
import { addPdfLinksToPage, collectPdfLinkRects } from "@/lib/pdf-links";

export type ExportFormat = "pdf" | "png";

export function exportJson(data: object, filename: string): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${filename}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

function getPreviewElement(): HTMLElement {
  const el = document.querySelector(".preview-a4 > div") as HTMLElement | null;
  if (!el) throw new Error("Resume preview element not found");
  return el;
}

async function captureCanvas(el: HTMLElement): Promise<HTMLCanvasElement> {
  return toCanvas(el, {
    pixelRatio: 4,
    backgroundColor: "#ffffff",
  });
}

function createPdfPageCanvas(source: HTMLCanvasElement, pageIndex: number): HTMLCanvasElement {
  const scale = source.width / PAGE_W;
  const page = document.createElement("canvas");
  page.width = Math.round(PAGE_W * scale);
  page.height = Math.round(PAGE_H * scale);

  const ctx = page.getContext("2d");
  if (!ctx) throw new Error("PDF page canvas context unavailable");

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, page.width, page.height);

  const sourceY = Math.round((TOP + pageIndex * CONTENT_H) * scale);
  const sourceHeight = Math.max(0, Math.min(Math.round(CONTENT_H * scale), source.height - sourceY));

  if (sourceHeight > 0) {
    ctx.drawImage(
      source,
      0,
      sourceY,
      source.width,
      sourceHeight,
      0,
      Math.round(TOP * scale),
      page.width,
      sourceHeight
    );
  }

  return page;
}

export async function exportResume(
  format: ExportFormat,
  filename = "resume"
): Promise<void> {
  const previewElement = getPreviewElement();
  const pdfLinks = format === "pdf" ? collectPdfLinkRects(previewElement) : [];
  const canvas = await captureCanvas(previewElement);

  if (format === "png") {
    const link = document.createElement("a");
    link.download = `${filename}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
    return;
  }

  const scale = canvas.width / PAGE_W;

  // Match the preview's page window calculation exactly.
  const effectiveHeightPx = canvas.height - (TOP + BOTTOM + 8) * scale;
  const pageCount = Math.max(1, Math.ceil(effectiveHeightPx / (CONTENT_H * scale)));

  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  for (let pageIndex = 0; pageIndex < pageCount; pageIndex++) {
    if (pageIndex > 0) pdf.addPage();
    const pageCanvas = createPdfPageCanvas(canvas, pageIndex);
    pdf.addImage(pageCanvas.toDataURL("image/jpeg", 0.98), "JPEG", 0, 0, A4_W_MM, A4_H_MM);
    addPdfLinksToPage(pdf, pdfLinks, pageIndex);
  }

  pdf.save(`${filename}.pdf`);
}
