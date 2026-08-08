import { toCanvas } from "html-to-image";
import {
  TOP,
  CONTENT_H,
  getPageCount,
  getPageTranslateY,
} from "@/lib/page-constants";

export type ExportFormat = "pdf" | "png";

interface DocumentExportRequest {
  format: ExportFormat;
  filename: string;
}

const PNG_CAPTURE_PIXEL_RATIO = 4;

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
  const el = document.querySelector("[data-preview-source]") as HTMLElement | null;
  if (!el) throw new Error("Resume preview element not found");
  return el;
}

async function captureCanvas(el: HTMLElement): Promise<HTMLCanvasElement> {
  return toCanvas(el, {
    pixelRatio: PNG_CAPTURE_PIXEL_RATIO,
    backgroundColor: "#ffffff",
  });
}

function downloadDataUrl(url: string, filename: string): void {
  const link = document.createElement("a");
  link.download = filename;
  link.href = url;
  link.click();
}

function createPrintPage(previewElement: HTMLElement, pageIndex: number): HTMLElement {
  const page = document.createElement("div");
  page.className = "pdf-print-page";

  const canvas = document.createElement("div");
  canvas.className = "pdf-print-canvas";

  const pageWindow = document.createElement("div");
  pageWindow.className = "pdf-print-window";
  pageWindow.style.top = `${TOP}px`;
  pageWindow.style.height = `${CONTENT_H}px`;

  const translatedContent = document.createElement("div");
  translatedContent.style.transform = `translateY(${getPageTranslateY(pageIndex)}px)`;

  const clone = previewElement.cloneNode(true) as HTMLElement;
  clone.removeAttribute("data-preview-source");

  translatedContent.appendChild(clone);
  pageWindow.appendChild(translatedContent);
  canvas.appendChild(pageWindow);
  page.appendChild(canvas);
  return page;
}

export function createPrintRoot(previewElement: HTMLElement): HTMLElement {
  const existing = document.querySelector(".pdf-print-root");
  existing?.remove();

  const root = document.createElement("div");
  root.className = "pdf-print-root";
  root.setAttribute("aria-hidden", "true");

  const pageCount = getPageCount(previewElement.scrollHeight);
  for (let pageIndex = 0; pageIndex < pageCount; pageIndex++) {
    root.appendChild(createPrintPage(previewElement, pageIndex));
  }
  return root;
}

async function waitForPrintAssets(root: HTMLElement): Promise<void> {
  if (document.fonts) await document.fonts.ready;
  await Promise.all(Array.from(root.querySelectorAll("img")).map(async (image) => {
    if (image.complete) return;
    try {
      await image.decode();
    } catch {
      throw new Error("Unable to load an image for PDF export");
    }
  }));
  await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
}

async function printPreview(filename: string): Promise<void> {
  const previewElement = getPreviewElement();
  const printRoot = createPrintRoot(previewElement);
  document.body.appendChild(printRoot);

  const originalTitle = document.title;
  let cleaned = false;
  const cleanup = () => {
    if (cleaned) return;
    cleaned = true;
    printRoot.remove();
    document.title = originalTitle;
    window.removeEventListener("afterprint", cleanup);
  };

  try {
    await waitForPrintAssets(printRoot);
    document.title = filename;
    window.addEventListener("afterprint", cleanup, { once: true });
    window.print();
  } catch (error) {
    cleanup();
    throw error;
  }
}

export async function exportDocument(request: DocumentExportRequest): Promise<void> {
  if (request.format === "pdf") {
    await printPreview(request.filename);
    return;
  }

  const previewElement = getPreviewElement();
  const canvas = await captureCanvas(previewElement);
  downloadDataUrl(canvas.toDataURL("image/png"), `${request.filename}.png`);
}
