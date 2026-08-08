import type { AcademicCVContent } from "@/lib/types/academic-cv";
import type { CoverLetterContent } from "@/lib/types/cover-letter";
import type { ResumeContent, ResumeLanguage } from "@/lib/types/resume";

export type ExportFormat = "pdf" | "png";

interface ExportRequestBase {
  format: ExportFormat;
  filename: string;
}

export type DocumentExportRequest =
  | (ExportRequestBase & {
      kind: "resume";
      content: ResumeContent;
      language: ResumeLanguage;
    })
  | (ExportRequestBase & {
      kind: "academic-cv";
      content: AcademicCVContent;
      language: ResumeLanguage;
    })
  | (ExportRequestBase & {
      kind: "cover-letter";
      content: CoverLetterContent;
      language: "en";
    });

export type PdfDocumentRequest = DocumentExportRequest extends infer Request
  ? Request extends DocumentExportRequest
    ? Omit<Request, "format">
    : never
  : never;
