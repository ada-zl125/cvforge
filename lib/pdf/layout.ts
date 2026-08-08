import type { ResumeLanguage } from "@/lib/types/resume";

export const A4_WIDTH_PT = 595.28;
export const A4_HEIGHT_PT = 841.89;
export const RESUME_MARGINS = { top: 24, right: 36, bottom: 36, left: 36 } as const;
export const LETTER_MARGINS = { top: 36, right: 36, bottom: 36, left: 36 } as const;
export const PDF_BODY_SIZE = 11;
export const PDF_SECTION_SIZE = 12;
export const PDF_NAME_SIZE = 20;
export const PDF_BLUE = "#1a4dc2";

const FONT_REGULAR = "TermesRegular";
const FONT_BOLD = "TermesBold";
const FONT_ZH = "NotoSerifCJKSC";
const SAFE_LINK_PROTOCOLS = new Set(["http:", "https:", "mailto:", "tel:"]);

export interface PdfFontBuffers {
  regular: Uint8Array;
  bold: Uint8Array;
  chinese?: Uint8Array;
}

export interface PdfTextRun {
  text: string;
  bold?: boolean;
  color?: string;
  link?: string;
}

interface BlockBase {
  gapBefore?: number;
  gapAfter?: number;
}

export interface PdfTextBlock extends BlockBase {
  kind: "text";
  runs: PdfTextRun[];
  align?: "left" | "center" | "right" | "justify";
  bold?: boolean;
  fontSize?: number;
  lineGap?: number;
  indent?: number;
}

export interface PdfRowBlock extends BlockBase {
  kind: "row";
  left: PdfTextRun[];
  right?: PdfTextRun[];
  fontSize?: number;
  lineGap?: number;
}

export interface PdfBulletBlock extends BlockBase {
  kind: "bullet";
  runs: PdfTextRun[];
}

export interface PdfSectionBlock extends BlockBase {
  kind: "section";
  title: string;
  letterSpacing?: number;
}

export interface PdfSpacerBlock {
  kind: "spacer";
  height: number;
}

export interface PdfGroupBlock extends BlockBase {
  kind: "group";
  blocks: PdfBlock[];
}

export interface PdfHeaderBlock extends BlockBase {
  kind: "header";
  name: string;
  lines: PdfTextRun[][];
  align: "center" | "left";
  photo?: Uint8Array;
}

export type PdfBlock =
  | PdfTextBlock
  | PdfRowBlock
  | PdfBulletBlock
  | PdfSectionBlock
  | PdfSpacerBlock
  | PdfGroupBlock
  | PdfHeaderBlock;

export interface PdfLayoutOptions {
  language: ResumeLanguage;
  margins?: typeof RESUME_MARGINS | typeof LETTER_MARGINS;
}

export interface TwoColumnLayout {
  leftWidth: number;
  rightX: number;
  rightWidth: number;
  rightEdge: number;
}

export function normalizePdfLinkTarget(value: string): string | null {
  const target = value.trim();
  if (!target) return null;

  try {
    const url = new URL(target);
    if (!SAFE_LINK_PROTOCOLS.has(url.protocol)) return null;
    if ((url.protocol === "http:" || url.protocol === "https:") && !url.hostname) return null;
    if ((url.protocol === "mailto:" || url.protocol === "tel:") && !url.pathname) return null;
    return url.href;
  } catch {
    return null;
  }
}

export function computeTwoColumnLayout(
  contentLeft: number,
  contentWidth: number,
  measuredRightWidth: number,
): TwoColumnLayout {
  const gap = 8;
  const rightWidth = Math.min(
    Math.max(measuredRightWidth + 2, 54),
    contentWidth * 0.42,
  );
  const rightX = contentLeft + contentWidth - rightWidth;
  return {
    leftWidth: rightX - gap - contentLeft,
    rightX,
    rightWidth,
    rightEdge: contentLeft + contentWidth,
  };
}

function blockGap(block: PdfBlock, side: "gapBefore" | "gapAfter"): number {
  if (!(side in block)) return 0;
  return (block as BlockBase)[side] ?? 0;
}

function flattenRuns(runs: readonly PdfTextRun[]): string {
  return runs.map((run) => run.text).join("");
}

function cleanText(value: string): string {
  return value.replace(/\r\n?/g, "\n");
}

export class PdfLayout {
  readonly contentLeft: number;
  readonly contentRight: number;
  readonly contentWidth: number;
  readonly pageTop: number;
  readonly pageBottom: number;

  private y: number;

  constructor(
    private readonly doc: PDFKit.PDFDocument,
    private readonly language: ResumeLanguage,
    fonts: PdfFontBuffers,
    margins: typeof RESUME_MARGINS | typeof LETTER_MARGINS = RESUME_MARGINS,
  ) {
    this.contentLeft = margins.left;
    this.contentRight = A4_WIDTH_PT - margins.right;
    this.contentWidth = this.contentRight - this.contentLeft;
    this.pageTop = margins.top;
    this.pageBottom = A4_HEIGHT_PT - margins.bottom;
    this.y = this.pageTop;

    this.doc.registerFont(FONT_REGULAR, fonts.regular);
    this.doc.registerFont(FONT_BOLD, fonts.bold);
    if (language === "zh") {
      if (!fonts.chinese) throw new Error("Chinese PDF font is unavailable");
      this.doc.registerFont(FONT_ZH, fonts.chinese);
    }
    this.addPage();
  }

  get cursorY(): number {
    return this.y;
  }

  get pageCount(): number {
    return this.doc.bufferedPageRange().count;
  }

  render(blocks: readonly PdfBlock[]): void {
    blocks.forEach((block) => this.drawBlock(block));
  }

  measureBlock(block: PdfBlock): number {
    const ownHeight = (() => {
      switch (block.kind) {
        case "spacer":
          return block.height;
        case "section":
          return 16.5;
        case "text":
          return this.measureRuns(
            block.runs,
            this.contentWidth - (block.indent ?? 0),
            block.fontSize ?? PDF_BODY_SIZE,
            block.lineGap ?? 0,
            block.bold,
          );
        case "row":
          return this.measureRow(block);
        case "bullet":
          return this.measureRuns(block.runs, this.contentWidth - 22, PDF_BODY_SIZE, 0);
        case "header":
          return this.measureHeader(block);
        case "group":
          return block.blocks.reduce((height, child) => height + this.measureBlock(child), 0);
      }
    })();

    return ownHeight + blockGap(block, "gapBefore") + blockGap(block, "gapAfter");
  }

  private addPage(): void {
    this.doc.addPage({
      size: [A4_WIDTH_PT, A4_HEIGHT_PT],
      margins: {
        top: this.pageTop,
        right: A4_WIDTH_PT - this.contentRight,
        bottom: A4_HEIGHT_PT - this.pageBottom,
        left: this.contentLeft,
      },
    });
    this.y = this.pageTop;
  }

  private remainingHeight(): number {
    return this.pageBottom - this.y;
  }

  private ensureSpace(height: number): void {
    if (height <= this.remainingHeight() || this.y === this.pageTop) return;
    this.addPage();
  }

  private setFont(bold = false, size = PDF_BODY_SIZE, color = "#000000"): void {
    this.doc.font(this.language === "zh" ? FONT_ZH : bold ? FONT_BOLD : FONT_REGULAR);
    this.doc.fontSize(size).fillColor(color).strokeColor(color);
    this.doc.lineWidth(this.language === "zh" && bold ? 0.2 : 0);
  }

  private textOptions(
    run: PdfTextRun,
    continued: boolean,
    width: number,
    align: "left" | "center" | "right" | "justify",
    lineGap: number,
  ): PDFKit.Mixins.TextOptions {
    const link = run.link ? normalizePdfLinkTarget(run.link) : null;
    return {
      width,
      align,
      lineGap,
      continued,
      fill: true,
      stroke: this.language === "zh" && !!run.bold,
      link: link ?? undefined,
      underline: false,
    };
  }

  private measureRuns(
    runs: readonly PdfTextRun[],
    width: number,
    size: number,
    lineGap: number,
    forceBold = false,
  ): number {
    const text = cleanText(flattenRuns(runs));
    if (!text) return 0;
    this.setFont(forceBold || runs.some((run) => run.bold), size);
    return this.doc.heightOfString(text, { width, lineGap });
  }

  private drawRuns(
    runs: readonly PdfTextRun[],
    x: number,
    y: number,
    width: number,
    options: {
      align?: "left" | "center" | "right" | "justify";
      fontSize?: number;
      lineGap?: number;
      forceBold?: boolean;
    } = {},
  ): void {
    const visibleRuns = runs.filter((run) => run.text.length > 0);
    const align = options.align ?? "left";
    const size = options.fontSize ?? PDF_BODY_SIZE;
    const lineGap = options.lineGap ?? 0;

    visibleRuns.forEach((run, index) => {
      const styledRun = options.forceBold ? { ...run, bold: true } : run;
      this.setFont(!!styledRun.bold, size, styledRun.color ?? "#000000");
      const textOptions = this.textOptions(
        styledRun,
        index < visibleRuns.length - 1,
        width,
        align,
        lineGap,
      );
      if (index === 0) this.doc.text(cleanText(styledRun.text), x, y, textOptions);
      else this.doc.text(cleanText(styledRun.text), textOptions);
    });
  }

  private runWidth(run: PdfTextRun, size: number): number {
    this.setFont(!!run.bold, size, run.color ?? "#000000");
    return this.doc.widthOfString(cleanText(run.text));
  }

  private drawInlineRuns(
    runs: readonly PdfTextRun[],
    x: number,
    y: number,
    width: number,
    align: "left" | "center" | "right",
    size = PDF_BODY_SIZE,
  ): void {
    const visibleRuns = runs.filter((run) => run.text.length > 0);
    const widths = visibleRuns.map((run) => this.runWidth(run, size));
    const totalWidth = widths.reduce((total, runWidth) => total + runWidth, 0);
    let cursorX = align === "center"
      ? x + Math.max(0, (width - totalWidth) / 2)
      : align === "right"
        ? x + Math.max(0, width - totalWidth)
        : x;

    visibleRuns.forEach((run, index) => {
      this.setFont(!!run.bold, size, run.color ?? "#000000");
      const link = run.link ? normalizePdfLinkTarget(run.link) : null;
      this.doc.text(cleanText(run.text), cursorX, y, {
        lineBreak: false,
        fill: true,
        stroke: this.language === "zh" && !!run.bold,
        underline: false,
      });
      if (link) this.doc.link(cursorX, y, widths[index], size * 1.25, link);
      cursorX += widths[index];
    });
  }

  private measureRow(block: PdfRowBlock): number {
    const size = block.fontSize ?? PDF_BODY_SIZE;
    const lineGap = block.lineGap ?? 0;
    const rightText = flattenRuns(block.right ?? []);
    this.setFont(block.right?.some((run) => run.bold), size);
    const rightMeasured = rightText ? this.doc.widthOfString(rightText) : 0;
    const columns = rightText
      ? computeTwoColumnLayout(this.contentLeft, this.contentWidth, rightMeasured)
      : null;
    const leftHeight = this.measureRuns(
      block.left,
      columns?.leftWidth ?? this.contentWidth,
      size,
      lineGap,
    );
    const rightHeight = columns
      ? this.measureRuns(block.right ?? [], columns.rightWidth, size, lineGap)
      : 0;
    return Math.max(leftHeight, rightHeight);
  }

  private measureHeader(block: PdfHeaderBlock): number {
    const textWidth = block.photo ? this.contentWidth - 67.5 : this.contentWidth;
    const nameHeight = this.measureRuns(
      [{ text: block.name, bold: true }],
      textWidth,
      PDF_NAME_SIZE,
      0,
      true,
    );
    const linesHeight = block.lines.reduce(
      (height, line) => height + this.measureRuns(line, textWidth, PDF_BODY_SIZE, 0),
      0,
    );
    return Math.max(nameHeight + (block.lines.length > 0 ? 3 + linesHeight : 0), block.photo ? 69 : 0);
  }

  private drawBlock(block: PdfBlock): void {
    if (block.kind === "group") {
      const height = this.measureBlock(block);
      const usablePageHeight = this.pageBottom - this.pageTop;
      if (height <= usablePageHeight) this.ensureSpace(height);
      this.y += block.gapBefore ?? 0;
      block.blocks.forEach((child) => this.drawBlock(child));
      this.y += block.gapAfter ?? 0;
      return;
    }

    if (block.kind === "spacer") {
      this.ensureSpace(block.height);
      this.y += block.height;
      return;
    }

    const height = this.measureBlock(block);
    if (block.kind !== "text" && block.kind !== "bullet") this.ensureSpace(height);
    this.y += blockGap(block, "gapBefore");

    switch (block.kind) {
      case "section":
        this.drawSection(block);
        break;
      case "text":
        this.drawText(block);
        break;
      case "row":
        this.drawRow(block);
        break;
      case "bullet":
        this.drawBullet(block);
        break;
      case "header":
        this.drawHeader(block);
        break;
    }

    this.y += blockGap(block, "gapAfter");
  }

  private drawSection(block: PdfSectionBlock): void {
    const title = this.language === "en" ? block.title.toUpperCase() : block.title;
    this.setFont(true, PDF_SECTION_SIZE);
    const options = {
      width: this.contentWidth,
      characterSpacing: block.letterSpacing ?? 0,
      fill: true,
      stroke: this.language === "zh",
      lineBreak: false,
    };
    this.doc.text(title, this.contentLeft, this.y, options);
    const titleHeight = this.doc.heightOfString(title, options);
    const ruleY = this.y + titleHeight + 0.5;
    this.doc.lineWidth(0.65).strokeColor("#000000");
    this.doc.moveTo(this.contentLeft, ruleY).lineTo(this.contentRight, ruleY).stroke();
    this.y = ruleY + 2;
  }

  private drawText(block: PdfTextBlock): void {
    const width = this.contentWidth - (block.indent ?? 0);
    const x = this.contentLeft + (block.indent ?? 0);
    const size = block.fontSize ?? PDF_BODY_SIZE;
    const lineGap = block.lineGap ?? 0;
    const height = this.measureRuns(block.runs, width, size, lineGap, block.bold);

    if (height <= this.remainingHeight()) {
      this.drawRuns(block.runs, x, this.y, width, {
        align: block.align,
        fontSize: size,
        lineGap,
        forceBold: block.bold,
      });
      this.y += height;
      return;
    }

    if (block.runs.length !== 1) {
      this.addPage();
      this.drawRuns(block.runs, x, this.y, width, {
        align: block.align,
        fontSize: size,
        lineGap,
        forceBold: block.bold,
      });
      this.y += height;
      return;
    }

    this.drawPlainTextAcrossPages(block.runs[0], x, width, {
      align: block.align,
      fontSize: size,
      lineGap,
      forceBold: block.bold,
    });
  }

  private drawPlainTextAcrossPages(
    run: PdfTextRun,
    x: number,
    width: number,
    options: {
      align?: "left" | "center" | "right" | "justify";
      fontSize: number;
      lineGap: number;
      forceBold?: boolean;
    },
  ): void {
    let remaining = cleanText(run.text).trim();

    while (remaining) {
      if (this.remainingHeight() < options.fontSize * 1.3) this.addPage();
      const chunk = this.fittingTextChunk(
        remaining,
        width,
        this.remainingHeight(),
        options.fontSize,
        options.lineGap,
        !!(options.forceBold || run.bold),
      );
      const visibleChunk = chunk.trimEnd();
      const chunkHeight = this.measureRuns(
        [{ ...run, text: visibleChunk }],
        width,
        options.fontSize,
        options.lineGap,
        options.forceBold,
      );
      this.drawRuns([{ ...run, text: visibleChunk }], x, this.y, width, options);
      this.y += chunkHeight;
      remaining = remaining.slice(chunk.length).trimStart();
      if (remaining) this.addPage();
    }
  }

  private fittingTextChunk(
    text: string,
    width: number,
    maxHeight: number,
    fontSize: number,
    lineGap: number,
    bold: boolean,
  ): string {
    const characters = Array.from(text);
    let low = 1;
    let high = characters.length;
    let best = 1;

    while (low <= high) {
      const middle = Math.floor((low + high) / 2);
      const candidate = characters.slice(0, middle).join("");
      const height = this.measureRuns([{ text: candidate, bold }], width, fontSize, lineGap, bold);
      if (height <= maxHeight) {
        best = middle;
        low = middle + 1;
      } else {
        high = middle - 1;
      }
    }

    if (best < characters.length && this.language === "en") {
      const candidate = characters.slice(0, best).join("");
      const breakIndex = Math.max(candidate.lastIndexOf(" "), candidate.lastIndexOf("\n"));
      if (breakIndex > Math.floor(best * 0.6)) best = Array.from(candidate.slice(0, breakIndex + 1)).length;
    }
    return characters.slice(0, Math.max(1, best)).join("");
  }

  private drawRow(block: PdfRowBlock): void {
    const size = block.fontSize ?? PDF_BODY_SIZE;
    const lineGap = block.lineGap ?? 0;
    const rightText = flattenRuns(block.right ?? []);
    this.setFont(block.right?.some((run) => run.bold), size);
    const rightMeasured = rightText ? this.doc.widthOfString(rightText) : 0;
    const columns = rightText
      ? computeTwoColumnLayout(this.contentLeft, this.contentWidth, rightMeasured)
      : null;
    const height = this.measureRow(block);

    this.drawRuns(block.left, this.contentLeft, this.y, columns?.leftWidth ?? this.contentWidth, {
      fontSize: size,
      lineGap,
    });
    if (columns && block.right) {
      this.drawRuns(block.right, columns.rightX, this.y, columns.rightWidth, {
        align: "right",
        fontSize: size,
        lineGap,
      });
    }
    this.y += height;
  }

  private drawBullet(block: PdfBulletBlock): void {
    const indent = 22;
    const textWidth = this.contentWidth - indent;
    const height = this.measureRuns(block.runs, textWidth, PDF_BODY_SIZE, 0);
    if (height > this.remainingHeight()) {
      if (this.y !== this.pageTop) this.addPage();
    }

    this.doc.fillColor("#000000").circle(this.contentLeft + 9.2, this.y + 6.2, 2.25).fill();
    const textBlock: PdfTextBlock = {
      kind: "text",
      runs: block.runs,
      indent,
      align: "justify",
    };
    this.drawText(textBlock);
  }

  private drawHeader(block: PdfHeaderBlock): void {
    const headerTop = this.y;
    const textWidth = block.photo ? this.contentWidth - 67.5 : this.contentWidth;
    this.drawRuns([{ text: block.name, bold: true }], this.contentLeft, this.y, textWidth, {
      align: block.align,
      fontSize: PDF_NAME_SIZE,
      forceBold: true,
    });
    this.y += this.measureRuns([{ text: block.name, bold: true }], textWidth, PDF_NAME_SIZE, 0, true);

    if (block.lines.length > 0) this.y += 3;
    block.lines.forEach((line) => {
      const lineHeight = this.measureRuns(line, textWidth, PDF_BODY_SIZE, 0);
      this.drawInlineRuns(line, this.contentLeft, this.y, textWidth, block.align);
      this.y += lineHeight;
    });

    if (block.photo) {
      const photoHeight = 69;
      const photoY = block.align === "left" ? headerTop - 7.5 : headerTop;
      const photoBytes = new Uint8Array(block.photo.byteLength);
      photoBytes.set(block.photo);
      this.doc.image(photoBytes.buffer as unknown as string, this.contentRight - 55.5, photoY, {
        width: 55.5,
        height: photoHeight,
        fit: [55.5, photoHeight],
        align: "center",
        valign: "center",
      });
      this.y = Math.max(this.y, headerTop + photoHeight);
    }
  }
}

export function textRun(text: string, options: Omit<PdfTextRun, "text"> = {}): PdfTextRun {
  return { text, ...options };
}

export function textBlock(
  text: string,
  options: Omit<PdfTextBlock, "kind" | "runs"> = {},
): PdfTextBlock {
  return { kind: "text", runs: [textRun(text)], ...options };
}

export function rowBlock(
  left: string | PdfTextRun[],
  right?: string | PdfTextRun[],
): PdfRowBlock {
  return {
    kind: "row",
    left: typeof left === "string" ? [textRun(left)] : left,
    right: typeof right === "string" ? [textRun(right)] : right,
  };
}

export function bulletBlock(text: string | PdfTextRun[]): PdfBulletBlock {
  return {
    kind: "bullet",
    runs: typeof text === "string" ? [textRun(text)] : text,
    gapBefore: 2.5,
  };
}

export function sectionBlock(title: string, letterSpacing = 0): PdfSectionBlock {
  return { kind: "section", title, letterSpacing };
}

export function groupBlock(
  blocks: PdfBlock[],
  options: Omit<PdfGroupBlock, "kind" | "blocks"> = {},
): PdfGroupBlock {
  return { kind: "group", blocks, ...options };
}
