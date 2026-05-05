import { toCanvas } from "html-to-image";
import jsPDF from "jspdf";
import { TOP, BOTTOM } from "@/lib/page-constants";

export type ExportFormat = "pdf" | "png";

export function exportJson(data: object, filename: string): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${filename}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

async function captureCanvas(): Promise<HTMLCanvasElement> {
  // Target the inner resume div, not the wrapper (which has border/shadow)
  const el = document.querySelector(".preview-a4 > div") as HTMLElement | null;
  if (!el) throw new Error("Resume preview element not found");

  return toCanvas(el, {
    pixelRatio: 4,
    backgroundColor: "#ffffff",
  });
}

export async function exportResume(
  format: ExportFormat,
  filename = "resume"
): Promise<void> {
  const canvas = await captureCanvas();

  if (format === "png") {
    const link = document.createElement("a");
    link.download = `${filename}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
    return;
  }

  // PDF — handle multi-page resumes
  const imgData = canvas.toDataURL("image/jpeg", 0.98);

  const A4_W_MM = 210;
  const A4_H_MM = 297;

  // Effective content height: exclude TOP and BOTTOM margins (matching preview calculation)
  // The "-8" accounts for alignment/floating-point precision
  const effectiveHeightPx = canvas.height - TOP - BOTTOM - 8;

  // Total rendered height in mm (preserving aspect ratio of canvas mapped to A4 width)
  const totalHeightMM = (effectiveHeightPx / canvas.width) * A4_W_MM;
  const pageCount = Math.max(
    1,
    Math.ceil(totalHeightMM / A4_H_MM)
  );

  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  for (let pageIndex = 0; pageIndex < pageCount; pageIndex++) {
    if (pageIndex > 0) pdf.addPage();
    const yOffsetMM = pageIndex * A4_H_MM;
    // Shift image up by yOffsetMM so the correct slice shows on this page
    pdf.addImage(imgData, "JPEG", 0, -yOffsetMM, A4_W_MM, totalHeightMM);
  }

  pdf.save(`${filename}.pdf`);
}
