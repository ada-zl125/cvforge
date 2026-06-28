export type AgentContextSourceType = "file";

export interface AgentContextSource {
  id: string;
  type: AgentContextSourceType;
  name: string;
  text: string;
  createdAt: number;
  size?: number;
}

export const CONTEXT_SOURCE_MAX_CHARS = 50000;
export const CONTEXT_TOTAL_MAX_CHARS = 90000;
export const CONTEXT_MAX_FILE_SOURCES = 5;
export const CONTEXT_MAX_FILE_BYTES = 6 * 1024 * 1024;
export const CONTEXT_DOCUMENT_ACCEPT = [
  ".txt",
  ".md",
  ".pdf",
  "text/plain",
  "text/markdown",
  "application/pdf",
].join(",");

const SUPPORTED_DOCUMENT_EXTENSIONS = [
  ".txt",
  ".md",
  ".pdf",
];

export function truncateContextText(text: string, maxChars = CONTEXT_SOURCE_MAX_CHARS): string {
  const normalized = text.replace(/\u0000/g, "").replace(/\r\n/g, "\n").trim();
  if (normalized.length <= maxChars) return normalized;
  return `${normalized.slice(0, maxChars)}\n\n[Context source truncated]`;
}

function getFileExtension(fileName: string): string {
  const lowerName = fileName.toLowerCase();
  const dotIndex = lowerName.lastIndexOf(".");
  return dotIndex >= 0 ? lowerName.slice(dotIndex) : "";
}

export function isSupportedDocumentFile(file: File): boolean {
  return SUPPORTED_DOCUMENT_EXTENSIONS.includes(getFileExtension(file.name));
}

export function prepareContextSourceText(text: string): string {
  const normalized = text.replace(/\u0000/g, "").replace(/\r\n/g, "\n").trim();
  if (!normalized) return "";
  return truncateContextText(normalized);
}

type PdfTextItem = { str?: string; hasEOL?: boolean };
type PdfJsModule = typeof import("pdfjs-dist/legacy/build/pdf.mjs");

let pdfJsPromise: Promise<PdfJsModule> | null = null;

function getPublicAssetPath(path: string): string {
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
  const normalizedBasePath = basePath.replace(/\/+$/, "");
  return `${normalizedBasePath}${path}`;
}

function ensureMathSumPrecise(): void {
  const mathWithSum = Math as Math & { sumPrecise?: (items: Iterable<number>) => number };
  if (typeof mathWithSum.sumPrecise === "function") return;

  Object.defineProperty(Math, "sumPrecise", {
    configurable: true,
    writable: true,
    value(items: Iterable<number>) {
      let sum = 0;
      let correction = 0;

      for (const item of items) {
        const value = Number(item);
        if (!Number.isFinite(value)) return sum + value;

        const adjusted = value - correction;
        const next = sum + adjusted;
        correction = (next - sum) - adjusted;
        sum = next;
      }

      return sum;
    },
  });
}

async function extractPdfText(file: File): Promise<string> {
  ensureMathSumPrecise();
  const pdfjs = await loadPdfJs();

  const documentParams = {
    cMapPacked: true,
    cMapUrl: getPublicAssetPath("/pdfjs/cmaps/"),
    disableFontFace: true,
    isImageDecoderSupported: false,
    isOffscreenCanvasSupported: false,
    standardFontDataUrl: getPublicAssetPath("/pdfjs/standard_fonts/"),
    useSystemFonts: false,
    useWasm: false,
    useWorkerFetch: false,
    verbosity: pdfjs.VerbosityLevel.ERRORS,
  };

  const loadingTask = pdfjs.getDocument({
    ...documentParams,
    data: new Uint8Array(await file.arrayBuffer()),
  });
  const pdf = await loadingTask.promise;

  const pages: string[] = [];

  const pageErrors: unknown[] = [];

  try {
    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
      try {
        const page = await pdf.getPage(pageNumber);
        const content = await page.getTextContent();
        const pageText = content.items
          .map((item) => {
            const textItem = item as PdfTextItem;
            return `${textItem.str ?? ""}${textItem.hasEOL ? "\n" : " "}`;
          })
          .join("")
          .replace(/[ \t]+\n/g, "\n")
          .replace(/[ \t]{2,}/g, " ")
          .trim();
        if (pageText) pages.push(pageText);
      } catch (error) {
        pageErrors.push(error);
      }
    }
  } finally {
    await loadingTask?.destroy().catch(() => undefined);
  }

  if (pages.length === 0 && pageErrors.length > 0) {
    throw pageErrors[0];
  }

  return truncateContextText(pages.join("\n\n"));
}

async function loadPdfJs(): Promise<PdfJsModule> {
  pdfJsPromise ??= (async () => {
    const [pdfjs, workerModule] = await Promise.all([
      import("pdfjs-dist/legacy/build/pdf.mjs"),
      import("pdfjs-dist/legacy/build/pdf.worker.mjs"),
    ]);

    pdfjs.GlobalWorkerOptions.workerPort = null;
    (globalThis as typeof globalThis & { pdfjsWorker?: unknown }).pdfjsWorker = workerModule;

    return pdfjs;
  })();

  return pdfJsPromise;
}

export async function extractContextSourceText(file: File): Promise<string> {
  const extension = getFileExtension(file.name);
  if (extension === ".pdf") {
    return extractPdfText(file);
  }
  return prepareContextSourceText(await file.text());
}

export function buildContextInstructionContext(instruction: string | undefined): string | null {
  const normalized = truncateContextText(instruction ?? "", 12000);
  if (!normalized) return null;

  return `User project instructions. These are persistent user preferences and constraints for this editor session, not a new chat request. Follow them for future replies and document edits unless they conflict with higher priority system rules or the user's current message. If they conflict with the current user message, follow the current user message.\n\n${normalized}`;
}

export function buildReferenceContext(sources: AgentContextSource[] = []): string | null {
  if (sources.length === 0) return null;

  let used = 0;
  const sections: string[] = [];

  for (const source of sources) {
    if (used >= CONTEXT_TOTAL_MAX_CHARS) break;

    const available = CONTEXT_TOTAL_MAX_CHARS - used;
    const text = truncateContextText(source.text, Math.min(CONTEXT_SOURCE_MAX_CHARS, available));
    if (!text) continue;

    const heading = [
      `Source: ${source.name}`,
      `Type: ${source.type}`,
    ].filter(Boolean).join("\n");

    const section = `${heading}\n\n${text}`;
    sections.push(section);
    used += section.length;
  }

  if (sections.length === 0) return null;

  return `User uploaded reference context. Use these files as background material when answering the user or editing the document. The files may include profile notes, prior resumes, CVs, cover letters, job descriptions, or other application materials. Prefer facts that appear in the current document when they conflict with uploaded files. Do not invent facts that are not supported by the current document, the user's message, or uploaded files. Mention uncertainty or ask the user before using unclear personal facts. When useful, identify which source informed the answer.\n\n${sections.join("\n\n---\n\n")}`;
}
