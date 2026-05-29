export type AgentContextSourceType = "file" | "linkedin";

export interface AgentContextSource {
  id: string;
  type: AgentContextSourceType;
  name: string;
  text: string;
  createdAt: number;
  size?: number;
  url?: string;
}

export const CONTEXT_SOURCE_MAX_CHARS = 50000;
export const CONTEXT_TOTAL_MAX_CHARS = 90000;
export const CONTEXT_MAX_FILE_SOURCES = 5;
export const CONTEXT_MAX_FILE_BYTES = 10 * 1024 * 1024;

export function truncateContextText(text: string, maxChars = CONTEXT_SOURCE_MAX_CHARS): string {
  const normalized = text.replace(/\u0000/g, "").replace(/\r\n/g, "\n").trim();
  if (normalized.length <= maxChars) return normalized;
  return `${normalized.slice(0, maxChars)}\n\n[Context source truncated]`;
}

export function isSupportedTextFile(file: File): boolean {
  const lowerName = file.name.toLowerCase();
  const supportedExtensions = [
    ".txt",
    ".md",
    ".markdown",
    ".json",
    ".csv",
    ".tsv",
    ".xml",
    ".html",
    ".htm",
    ".log",
    ".yaml",
    ".yml",
  ];

  return file.type.startsWith("text/") ||
    file.type === "application/json" ||
    file.type === "application/xml" ||
    supportedExtensions.some((extension) => lowerName.endsWith(extension));
}

export function isLinkedInProfileUrl(value: string): boolean {
  try {
    const url = new URL(value);
    const host = url.hostname.replace(/^www\./, "");
    return host === "linkedin.com" && /^\/in\/[^/]+\/?$/.test(url.pathname);
  } catch {
    return false;
  }
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
      source.url ? `URL: ${source.url}` : null,
    ].filter(Boolean).join("\n");

    const section = `${heading}\n\n${text}`;
    sections.push(section);
    used += section.length;
  }

  if (sections.length === 0) return null;

  return `User provided reference context. Use it as background information for the user's profile, old CV, notes, or LinkedIn page. Do not copy blindly. Prefer the current document state when there is a conflict, and ask the user before using uncertain personal facts.\n\n${sections.join("\n\n---\n\n")}`;
}
