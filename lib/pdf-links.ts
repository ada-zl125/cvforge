import { A4_H_MM, A4_W_MM, CONTENT_H, PAGE_H, PAGE_W, TOP } from "@/lib/page-constants";

const SAFE_LINK_PROTOCOLS = new Set(["http:", "https:", "mailto:"]);

export interface PdfLinkSourceRect {
  url: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface PdfLinkAnnotation {
  url: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

interface PdfLinkWriter {
  link(
    x: number,
    y: number,
    width: number,
    height: number,
    options: { url: string },
  ): void;
}

export function normalizePdfLinkTarget(value: string): string | null {
  const target = value.trim();
  if (!target) return null;

  try {
    const url = new URL(target);
    if (!SAFE_LINK_PROTOCOLS.has(url.protocol)) return null;
    if ((url.protocol === "http:" || url.protocol === "https:") && !url.hostname) return null;
    if (url.protocol === "mailto:" && !url.pathname) return null;
    return url.href;
  } catch {
    return null;
  }
}

export function collectPdfLinkRects(root: HTMLElement): PdfLinkSourceRect[] {
  const rootRect = root.getBoundingClientRect();

  return Array.from(root.querySelectorAll<HTMLAnchorElement>("a[href]")).flatMap((anchor) => {
    const url = normalizePdfLinkTarget(anchor.getAttribute("href") ?? "");
    if (!url) return [];

    return Array.from(anchor.getClientRects())
      .filter((rect) => rect.width > 0 && rect.height > 0)
      .map((rect) => ({
        url,
        x: rect.left - rootRect.left,
        y: rect.top - rootRect.top,
        width: rect.width,
        height: rect.height,
      }));
  });
}

export function getPdfLinkAnnotations(
  links: readonly PdfLinkSourceRect[],
  pageIndex: number,
): PdfLinkAnnotation[] {
  const sourceTop = TOP + pageIndex * CONTENT_H;
  const sourceBottom = sourceTop + CONTENT_H;
  const xScale = A4_W_MM / PAGE_W;
  const yScale = A4_H_MM / PAGE_H;

  return links.flatMap((link) => {
    const left = Math.max(0, link.x);
    const right = Math.min(PAGE_W, link.x + link.width);
    const top = Math.max(sourceTop, link.y);
    const bottom = Math.min(sourceBottom, link.y + link.height);

    if (right <= left || bottom <= top) return [];

    return [{
      url: link.url,
      x: left * xScale,
      y: (TOP + top - sourceTop) * yScale,
      width: (right - left) * xScale,
      height: (bottom - top) * yScale,
    }];
  });
}

export function addPdfLinksToPage(
  pdf: PdfLinkWriter,
  links: readonly PdfLinkSourceRect[],
  pageIndex: number,
): void {
  getPdfLinkAnnotations(links, pageIndex).forEach(({ url, x, y, width, height }) => {
    pdf.link(x, y, width, height, { url });
  });
}
