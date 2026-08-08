import { beforeEach, describe, expect, it, vi } from "vitest";
import { toCanvas } from "html-to-image";
import {
  CONTENT_H,
  TOP,
} from "@/lib/page-constants";
import {
  createPrintRoot,
  exportDocument,
  getPreviewPageCount,
  PNG_CAPTURE_PIXEL_RATIO,
} from "@/lib/export";

vi.mock("html-to-image", () => ({
  toCanvas: vi.fn(),
}));

function createPreview(scrollHeight: number): HTMLElement {
  const preview = document.createElement("div");
  preview.dataset.previewSource = "";
  preview.innerHTML = `
    <main data-cv-root style="width: 794px; min-height: 1123px">
      <section data-page-break-avoid>
        <span>University of Oxford</span>
        <time style="margin-left: auto">Sept 2022 to Sept 2023</time>
      </section>
      <a href="https://example.com">Portfolio</a>
    </main>
  `;
  Object.defineProperty(preview, "scrollHeight", { value: scrollHeight });
  document.body.appendChild(preview);
  return preview;
}

describe("preview based export", () => {
  beforeEach(() => {
    document.body.replaceChildren();
    document.title = "CVForge";
    vi.clearAllMocks();
  });

  it("uses the same page count as the live preview", () => {
    const onePage = createPreview(TOP + CONTENT_H);
    expect(getPreviewPageCount(onePage)).toBe(1);

    onePage.remove();
    const twoPages = createPreview(TOP + CONTENT_H * 2);
    expect(getPreviewPageCount(twoPages)).toBe(2);
  });

  it("clones the preview DOM into identical paginated print windows", () => {
    const preview = createPreview(TOP + CONTENT_H * 2);
    const root = createPrintRoot(preview);
    const pages = Array.from(root.querySelectorAll<HTMLElement>(".pdf-print-page"));

    expect(pages).toHaveLength(2);
    pages.forEach((page) => {
      const clonedSource = page.querySelector<HTMLElement>(".pdf-print-window > div > div");
      expect(page.textContent).toContain("University of Oxford");
      expect(page.querySelector("[data-cv-root]")).not.toBeNull();
      expect(page.querySelector("a")?.getAttribute("href")).toBe("https://example.com");
      expect(clonedSource?.innerHTML).toBe(preview.innerHTML);
      expect(page.querySelector<HTMLElement>(".pdf-print-window")?.style.top).toBe(`${TOP}px`);
      expect(page.querySelector<HTMLElement>(".pdf-print-window")?.style.height).toBe(`${CONTENT_H}px`);
    });

    expect(pages[0].querySelector<HTMLElement>(".pdf-print-window > div")?.style.transform)
      .toBe(`translateY(-${TOP}px)`);
    expect(pages[1].querySelector<HTMLElement>(".pdf-print-window > div")?.style.transform)
      .toBe(`translateY(-${TOP + CONTENT_H}px)`);
    expect(root.querySelector("[data-preview-source]")).toBeNull();
  });

  it("opens browser print only after fonts are ready and restores temporary state", async () => {
    createPreview(TOP + CONTENT_H);
    const fontsReady = Promise.resolve();
    Object.defineProperty(document, "fonts", {
      configurable: true,
      value: { ready: fontsReady },
    });
    vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => {
      callback(0);
      return 1;
    });
    const print = vi.spyOn(window, "print").mockImplementation(() => {
      expect(document.title).toBe("Ada Lovelace Resume");
      expect(document.querySelector(".pdf-print-root")).not.toBeNull();
      window.dispatchEvent(new Event("afterprint"));
    });

    await exportDocument({ format: "pdf", filename: "Ada Lovelace Resume" });

    expect(print).toHaveBeenCalledOnce();
    expect(document.title).toBe("CVForge");
    expect(document.querySelector(".pdf-print-root")).toBeNull();
    vi.unstubAllGlobals();
  });

  it("restores the original four times lossless PNG export", async () => {
    const preview = createPreview(TOP + CONTENT_H);
    const toDataURL = vi.fn(() => "data:image/png;base64,cG5n");
    vi.mocked(toCanvas).mockResolvedValue({ toDataURL } as unknown as HTMLCanvasElement);
    const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => undefined);

    await exportDocument({ format: "png", filename: "resume" });

    expect(toCanvas).toHaveBeenCalledWith(preview, {
      pixelRatio: PNG_CAPTURE_PIXEL_RATIO,
      backgroundColor: "#ffffff",
    });
    expect(PNG_CAPTURE_PIXEL_RATIO).toBe(4);
    expect(toDataURL).toHaveBeenCalledWith("image/png");
    expect(click).toHaveBeenCalledOnce();
  });
});
