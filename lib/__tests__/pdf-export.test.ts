// @vitest-environment node

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";
import { beforeAll, describe, expect, it } from "vitest";
import academicExampleEn from "@/examples/academic-cv-example-en.json";
import academicExampleZh from "@/examples/academic-cv-example-cn.json";
import coverLetterExample from "@/examples/cover-letter-example-en.json";
import resumeExampleEn from "@/examples/resume-example-en.json";
import resumeExampleZh from "@/examples/resume-example-cn.json";
import type { PdfDocumentRequest } from "@/lib/export-types";
import { computeTwoColumnLayout, type PdfFontBuffers } from "@/lib/pdf/layout";
import { createPdfBlob, type GeneratedPdf } from "@/lib/pdf/render-pdf";
import type { AcademicCVContent } from "@/lib/types/academic-cv";
import type { CoverLetterContent } from "@/lib/types/cover-letter";
import type { ResumeContent } from "@/lib/types/resume";

const FIXTURE_DIRECTORY = resolve("tmp/pdfs");
let fonts: PdfFontBuffers;

beforeAll(async () => {
  const [regular, bold, chinese] = await Promise.all([
    readFile(resolve("public/fonts/texgyretermes-regular.otf")),
    readFile(resolve("public/fonts/texgyretermes-bold.otf")),
    readFile(resolve("public/fonts/noto-serif-cjk-sc-regular.otf")),
  ]);
  fonts = { regular, bold, chinese };
});

async function pdfText(pdf: GeneratedPdf): Promise<{ text: string; annotationCount: number }> {
  const bytes = new Uint8Array(await pdf.blob.arrayBuffer());
  const document = await getDocument({ data: bytes }).promise;
  const pages: string[] = [];
  let annotationCount = 0;

  for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber++) {
    const page = await document.getPage(pageNumber);
    const text = await page.getTextContent();
    pages.push(text.items.map((item) => "str" in item ? item.str : "").join(" "));
    annotationCount += (await page.getAnnotations()).length;
  }
  return { text: pages.join("\n"), annotationCount };
}

async function generate(request: PdfDocumentRequest, fixtureName: string): Promise<GeneratedPdf> {
  const pdf = await createPdfBlob(request, fonts);
  if (process.env.WRITE_PDF_FIXTURES === "1") {
    await mkdir(FIXTURE_DIRECTORY, { recursive: true });
    await writeFile(resolve(FIXTURE_DIRECTORY, fixtureName), new Uint8Array(await pdf.blob.arrayBuffer()));
  }
  return pdf;
}

function expectCompactPdf(pdf: GeneratedPdf): void {
  expect(pdf.blob.type).toBe("application/pdf");
  expect(pdf.blob.size).toBeLessThan(1_000_000 * pdf.pageCount);
}

describe("PDF layout", () => {
  it("pins the right column to the content edge", () => {
    const columns = computeTwoColumnLayout(36, 523.28, 82.5);
    expect(columns.rightX + columns.rightWidth).toBeCloseTo(559.28, 5);
    expect(columns.rightEdge).toBeCloseTo(559.28, 5);
    expect(columns.leftWidth).toBeGreaterThan(300);
  });
});

describe("selectable PDF export", () => {
  it("exports an English resume with searchable text and link annotations", async () => {
    const pdf = await generate({
      kind: "resume",
      filename: "resume-en",
      language: "en",
      content: resumeExampleEn.content as unknown as ResumeContent,
    }, "resume-en.pdf");
    const extracted = await pdfText(pdf);

    expectCompactPdf(pdf);
    expect(extracted.text).toContain("Zachary Lee");
    expect(extracted.text).toContain("University of Oxford");
    expect(extracted.text).toContain("Sept 2022 - Sept 2023");
    expect(extracted.annotationCount).toBeGreaterThan(0);
  }, 30_000);

  it("exports a Chinese resume without missing text", async () => {
    const content = resumeExampleZh.content as unknown as ResumeContent;
    const pdf = await generate({
      kind: "resume",
      filename: "resume-zh",
      language: "zh",
      content,
    }, "resume-zh.pdf");
    const extracted = await pdfText(pdf);

    expectCompactPdf(pdf);
    expect(extracted.text).toContain(content.personal.fullName);
    expect(extracted.text).toContain("教育经历");
    expect(extracted.text).toContain("工作经历");
  }, 30_000);

  it("exports English and Chinese academic CVs with multiple pages", async () => {
    const englishContent = academicExampleEn.content as unknown as AcademicCVContent;
    const chineseContent = academicExampleZh.content as unknown as AcademicCVContent;
    const [englishPdf, chinesePdf] = await Promise.all([
      generate({
        kind: "academic-cv",
        filename: "academic-cv-en",
        language: "en",
        content: englishContent,
      }, "academic-cv-en.pdf"),
      generate({
        kind: "academic-cv",
        filename: "academic-cv-zh",
        language: "zh",
        content: chineseContent,
      }, "academic-cv-zh.pdf"),
    ]);
    const [englishText, chineseText] = await Promise.all([pdfText(englishPdf), pdfText(chinesePdf)]);

    expectCompactPdf(englishPdf);
    expectCompactPdf(chinesePdf);
    expect(englishPdf.pageCount).toBeGreaterThan(1);
    expect(englishText.text).toContain("RESEARCH EXPERIENCE");
    expect(chineseText.text).toContain(chineseContent.personal.fullName);
    expect(chineseText.text).toContain("学术成果");
  }, 30_000);

  it("exports a standard cover letter on one page", async () => {
    const content = coverLetterExample.content as unknown as CoverLetterContent;
    const pdf = await generate({
      kind: "cover-letter",
      filename: "cover-letter-en",
      language: "en",
      content,
    }, "cover-letter-en.pdf");
    const extracted = await pdfText(pdf);

    expectCompactPdf(pdf);
    expect(pdf.pageCount).toBe(1);
    expect(extracted.text).toContain("Student Enviro Eng");
    expect(extracted.text).toContain("Sincerely,");
  }, 30_000);

  it("splits very long cover letter paragraphs safely", async () => {
    const content = structuredClone(coverLetterExample.content) as unknown as CoverLetterContent;
    content.paragraphs[0].text = `${content.paragraphs[0].text}\n\n`.repeat(8);
    const pdf = await createPdfBlob({
      kind: "cover-letter",
      filename: "cover-letter-long",
      language: "en",
      content,
    }, fonts);
    const extracted = await pdfText(pdf);

    expectCompactPdf(pdf);
    expect(pdf.pageCount).toBeGreaterThan(1);
    expect(extracted.text).toContain("Sincerely,");
  }, 30_000);

  it("embeds an optional resume photo without rasterizing text", async () => {
    const onePixelPng = Uint8Array.from(Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
      "base64",
    ));
    const pdf = await createPdfBlob({
      kind: "resume",
      filename: "resume-photo",
      language: "en",
      content: resumeExampleEn.content as unknown as ResumeContent,
    }, fonts, onePixelPng);
    const extracted = await pdfText(pdf);

    expectCompactPdf(pdf);
    expect(extracted.text).toContain("Zachary Lee");
  }, 30_000);
});
