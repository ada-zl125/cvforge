import { toCanvas } from "html-to-image";
import { PAGE_W, TOP, BOTTOM, CONTENT_H } from "@/lib/page-constants";
import {
  encodeCanvasWithinBudget,
  EXPORT_CAPTURE_PIXEL_RATIO,
  EXPORT_MAX_BYTES_PER_PAGE,
  EXPORT_PREFERRED_BYTES_PER_PAGE,
  PNG_ENCODING_PROFILES,
} from "@/lib/export-compression";
import type { DocumentExportRequest } from "@/lib/export-types";

export type { DocumentExportRequest, ExportFormat } from "@/lib/export-types";

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
    pixelRatio: EXPORT_CAPTURE_PIXEL_RATIO,
    backgroundColor: "#ffffff",
  });
}

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.download = filename;
  link.href = url;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

export async function exportDocument(request: DocumentExportRequest): Promise<void> {
  if (request.format === "pdf") {
    const { renderPdfBlob } = await import("@/lib/pdf/render-pdf");
    const blob = await renderPdfBlob(request);
    downloadBlob(blob, `${request.filename}.pdf`);
    return;
  }

  const previewElement = getPreviewElement();
  const canvas = await captureCanvas(previewElement);
  const scale = canvas.width / PAGE_W;

  // Match the preview's page window calculation exactly.
  const effectiveHeightPx = canvas.height - (TOP + BOTTOM + 8) * scale;
  const pageCount = Math.max(1, Math.ceil(effectiveHeightPx / (CONTENT_H * scale)));

  const encoded = await encodeCanvasWithinBudget(
    canvas,
    "image/png",
    PNG_ENCODING_PROFILES,
    EXPORT_PREFERRED_BYTES_PER_PAGE * pageCount,
    EXPORT_MAX_BYTES_PER_PAGE * pageCount,
  );
  downloadBlob(encoded.value, `${request.filename}.png`);
}
