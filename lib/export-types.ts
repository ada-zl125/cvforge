export type ExportFormat = "pdf" | "png";

export interface DocumentExportRequest {
  format: ExportFormat;
  filename: string;
}
