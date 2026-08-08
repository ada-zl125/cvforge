import type { PdfDocumentRequest } from "@/lib/export-types";
import {
  buildAcademicPdfBlocks,
  buildCoverLetterPdfBlocks,
  buildResumePdfBlocks,
} from "@/lib/pdf/document-blocks";
import {
  A4_HEIGHT_PT,
  A4_WIDTH_PT,
  LETTER_MARGINS,
  PdfLayout,
  RESUME_MARGINS,
  type PdfFontBuffers,
} from "@/lib/pdf/layout";

const PDF_MAX_BYTES_PER_PAGE = 2_000_000;
const FONT_PATHS = {
  regular: "/fonts/texgyretermes-regular.otf",
  bold: "/fonts/texgyretermes-bold.otf",
  chinese: "/fonts/noto-serif-cjk-sc-regular.otf",
} as const;

const fontCache = new Map<string, Promise<Uint8Array>>();

export interface GeneratedPdf {
  blob: Blob;
  pageCount: number;
}

function assetUrl(path: string): string {
  const basePath = (process.env.NEXT_PUBLIC_BASE_PATH ?? "").replace(/\/+$/, "");
  return `${basePath}${path}`;
}

async function fetchFont(path: string): Promise<Uint8Array> {
  const url = assetUrl(path);
  const cached = fontCache.get(url);
  if (cached) return cached;

  const pending = fetch(url).then(async (response) => {
    if (!response.ok) throw new Error(`Unable to load PDF font ${url}`);
    return new Uint8Array(await response.arrayBuffer());
  });
  fontCache.set(url, pending);

  try {
    return await pending;
  } catch (error) {
    fontCache.delete(url);
    throw error;
  }
}

async function loadFonts(language: PdfDocumentRequest["language"]): Promise<PdfFontBuffers> {
  const [regular, bold, chinese] = await Promise.all([
    fetchFont(FONT_PATHS.regular),
    fetchFont(FONT_PATHS.bold),
    language === "zh" ? fetchFont(FONT_PATHS.chinese) : Promise.resolve(undefined),
  ]);
  return { regular, bold, chinese };
}

function photoData(request: PdfDocumentRequest): string | undefined {
  if (request.kind === "cover-letter") return undefined;
  return request.content.personal.photo;
}

async function blobToImage(blob: Blob): Promise<HTMLImageElement> {
  const url = URL.createObjectURL(blob);
  try {
    const image = new Image();
    image.decoding = "async";
    image.src = url;
    await image.decode();
    return image;
  } finally {
    URL.revokeObjectURL(url);
  }
}

function canvasToJpeg(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("Unable to encode PDF photo"));
    }, "image/jpeg", quality);
  });
}

async function preparePhoto(dataUrl: string | undefined): Promise<Uint8Array | undefined> {
  if (!dataUrl) return undefined;

  try {
    const sourceBlob = await fetch(dataUrl).then((response) => response.blob());
    if (typeof document === "undefined" || typeof Image === "undefined") {
      return new Uint8Array(await sourceBlob.arrayBuffer());
    }

    const image = await blobToImage(sourceBlob);
    const canvas = document.createElement("canvas");
    canvas.width = 148;
    canvas.height = 184;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("PDF photo canvas is unavailable");

    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, canvas.width, canvas.height);
    const scale = Math.max(canvas.width / image.naturalWidth, canvas.height / image.naturalHeight);
    const width = image.naturalWidth * scale;
    const height = image.naturalHeight * scale;
    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = "high";
    context.drawImage(image, (canvas.width - width) / 2, (canvas.height - height) / 2, width, height);

    const optimized = await canvasToJpeg(canvas, 0.82);
    const selected = optimized.size < sourceBlob.size ? optimized : sourceBlob;
    return new Uint8Array(await selected.arrayBuffer());
  } catch {
    return undefined;
  }
}

function collectPdfBlob(doc: PDFKit.PDFDocument): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const chunks: ArrayBuffer[] = [];
    doc.on("data", (chunk: Uint8Array) => {
      const copy = new Uint8Array(chunk.byteLength);
      copy.set(chunk);
      chunks.push(copy.buffer);
    });
    doc.on("error", reject);
    doc.on("end", () => resolve(new Blob(chunks, { type: "application/pdf" })));
    doc.end();
  });
}

export async function createPdfBlob(
  request: PdfDocumentRequest,
  fonts: PdfFontBuffers,
  photo?: Uint8Array,
): Promise<GeneratedPdf> {
  const { default: PDFDocument } = await import("pdfkit/js/pdfkit.standalone.js");
  const doc = new PDFDocument({
    autoFirstPage: false,
    bufferPages: true,
    compress: true,
    size: [A4_WIDTH_PT, A4_HEIGHT_PT],
    info: {
      Title: request.filename,
      Creator: "CVForge",
      Producer: "CVForge",
    },
  });

  const margins = request.kind === "cover-letter" ? LETTER_MARGINS : RESUME_MARGINS;
  const layout = new PdfLayout(doc, request.language, fonts, margins);

  switch (request.kind) {
    case "resume":
      layout.render(buildResumePdfBlocks(request.content, request.language, photo));
      break;
    case "academic-cv":
      layout.render(buildAcademicPdfBlocks(request.content, request.language, photo));
      break;
    case "cover-letter":
      layout.render(buildCoverLetterPdfBlocks(request.content));
      break;
  }

  const pageCount = layout.pageCount;
  const blob = await collectPdfBlob(doc);
  if (blob.size > pageCount * PDF_MAX_BYTES_PER_PAGE) {
    throw new Error("PDF export exceeds the two megabyte per page limit");
  }
  return { blob, pageCount };
}

export async function renderPdfBlob(request: PdfDocumentRequest): Promise<Blob> {
  const [fonts, photo] = await Promise.all([
    loadFonts(request.language),
    preparePhoto(photoData(request)),
  ]);
  return (await createPdfBlob(request, fonts, photo)).blob;
}
