import jsPDF from "jspdf";
import { describe, expect, it, vi } from "vitest";
import { A4_H_MM, A4_W_MM, CONTENT_H, PAGE_H, PAGE_W, TOP } from "@/lib/page-constants";
import {
  addPdfLinksToPage,
  collectPdfLinkRects,
  getPdfLinkAnnotations,
  normalizePdfLinkTarget,
  type PdfLinkSourceRect,
} from "@/lib/pdf-links";

function createRect(left: number, top: number, width: number, height: number): DOMRect {
  return {
    x: left,
    y: top,
    left,
    top,
    right: left + width,
    bottom: top + height,
    width,
    height,
    toJSON: () => ({}),
  };
}

function setClientRects(element: Element, rects: DOMRect[]): void {
  element.getClientRects = () => rects as unknown as DOMRectList;
}

describe("normalizePdfLinkTarget", () => {
  it("allows absolute web and email links", () => {
    expect(normalizePdfLinkTarget(" https://Example.com/profile ")).toBe("https://example.com/profile");
    expect(normalizePdfLinkTarget("http://example.com")).toBe("http://example.com/");
    expect(normalizePdfLinkTarget("mailto:person@example.com")).toBe("mailto:person@example.com");
  });

  it("rejects relative and unsafe links", () => {
    expect(normalizePdfLinkTarget("example.com/profile")).toBeNull();
    expect(normalizePdfLinkTarget("javascript:alert(1)")).toBeNull();
    expect(normalizePdfLinkTarget("data:text/plain,hello")).toBeNull();
    expect(normalizePdfLinkTarget("mailto:")).toBeNull();
  });
});

describe("collectPdfLinkRects", () => {
  it("collects each visible line box relative to the export root", () => {
    const root = document.createElement("div");
    root.getBoundingClientRect = () => createRect(100, 50, PAGE_W, PAGE_H);

    const link = document.createElement("a");
    link.href = "https://example.com/profile";
    setClientRects(link, [
      createRect(140, 90, 80, 12),
      createRect(140, 104, 42, 12),
    ]);
    root.appendChild(link);

    const unsafeLink = document.createElement("a");
    unsafeLink.href = "javascript:alert(1)";
    setClientRects(unsafeLink, [createRect(200, 120, 40, 12)]);
    root.appendChild(unsafeLink);

    expect(collectPdfLinkRects(root)).toEqual([
      { url: "https://example.com/profile", x: 40, y: 40, width: 80, height: 12 },
      { url: "https://example.com/profile", x: 40, y: 54, width: 42, height: 12 },
    ]);
  });
});

describe("getPdfLinkAnnotations", () => {
  const xScale = A4_W_MM / PAGE_W;
  const yScale = A4_H_MM / PAGE_H;

  it("maps source coordinates onto the first PDF page", () => {
    const links: PdfLinkSourceRect[] = [
      { url: "https://example.com/", x: 80, y: 100, width: 120, height: 16 },
    ];

    expect(getPdfLinkAnnotations(links, 0)).toEqual([{
      url: "https://example.com/",
      x: 80 * xScale,
      y: 100 * yScale,
      width: 120 * xScale,
      height: 16 * yScale,
    }]);
  });

  it("clips a link across adjacent PDF pages", () => {
    const links: PdfLinkSourceRect[] = [{
      url: "mailto:person@example.com",
      x: 48,
      y: TOP + CONTENT_H - 4,
      width: 160,
      height: 10,
    }];

    expect(getPdfLinkAnnotations(links, 0)[0]).toMatchObject({
      y: (TOP + CONTENT_H - 4) * yScale,
      height: 4 * yScale,
    });
    expect(getPdfLinkAnnotations(links, 1)[0]).toMatchObject({
      y: TOP * yScale,
      height: 6 * yScale,
    });
  });

  it("ignores links outside the current page and clips horizontal overflow", () => {
    const links: PdfLinkSourceRect[] = [
      { url: "https://first.example/", x: -10, y: 100, width: 30, height: 12 },
      { url: "https://second.example/", x: 10, y: TOP + CONTENT_H + 20, width: 30, height: 12 },
    ];

    expect(getPdfLinkAnnotations(links, 0)).toEqual([{
      url: "https://first.example/",
      x: 0,
      y: 100 * yScale,
      width: 20 * xScale,
      height: 12 * yScale,
    }]);
  });
});

describe("addPdfLinksToPage", () => {
  it("writes native link annotations to the current PDF page", () => {
    const link = vi.fn();
    const links: PdfLinkSourceRect[] = [
      { url: "https://example.com/", x: 80, y: 100, width: 120, height: 16 },
    ];

    addPdfLinksToPage({ link }, links, 0);

    expect(link).toHaveBeenCalledOnce();
    expect(link).toHaveBeenCalledWith(
      80 * (A4_W_MM / PAGE_W),
      100 * (A4_H_MM / PAGE_H),
      120 * (A4_W_MM / PAGE_W),
      16 * (A4_H_MM / PAGE_H),
      { url: "https://example.com/" },
    );
  });

  it("produces URI annotations with jsPDF", () => {
    const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    addPdfLinksToPage(pdf, [
      { url: "mailto:person@example.com", x: 80, y: 100, width: 120, height: 16 },
    ], 0);

    const output = Buffer.from(pdf.output("arraybuffer")).toString("latin1");
    expect(output).toContain("/Annots");
    expect(output).toContain("/URI");
    expect(output).toContain("mailto:person@example.com");
  });
});
