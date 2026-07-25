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
export const CONTEXT_MAX_FILE_SOURCES = 5;
export const CONTEXT_MAX_FILE_BYTES = 6 * 1024 * 1024;
const PDF_PAGE_READ_WARNING = "[Warning: Some PDF pages could not be read and were omitted]";
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
type PdfTextContentChunk = { items?: PdfTextItem[] };
type PdfTextStreamPage = {
  streamTextContent: () => ReadableStream<PdfTextContentChunk>;
};
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

async function readPdfTextItems(page: PdfTextStreamPage): Promise<PdfTextItem[]> {
  const reader = page.streamTextContent().getReader();
  const items: PdfTextItem[] = [];

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value?.items) items.push(...value.items);
    }
  } finally {
    reader.releaseLock();
  }

  return items;
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
        const items = await readPdfTextItems(page);
        const pageText = items
          .map((item) => {
            const textItem = item as PdfTextItem;
            return `${textItem.str ?? ""}${textItem.hasEOL ? "\n" : " "}`;
          })
          .join("")
          .replace(/[ \t]+\n/g, "\n")
          .replace(/[ \t]{2,}/g, " ")
          .trim();
        if (pageText) pages.push(`[Page ${pageNumber}]\n${pageText}`);
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

  const extractedText = pages.join("\n\n");
  if (pageErrors.length === 0) return truncateContextText(extractedText);

  return truncateContextText(`${extractedText}\n\n${PDF_PAGE_READ_WARNING}`);
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

export function buildReferenceContext(
  sources: AgentContextSource[] = []
): string | null {
  if (sources.length === 0) return null;

  return [
    "User uploaded reference files are available to Deep Agents through the local virtual filesystem.",
    "Their contents are retrieved on demand and are not included in the initial model context.",
    ...sources.map(
      (source) =>
        `Source: ${source.name}, extracted characters: ${source.text.length}`
    ),
  ].join("\n");
}
