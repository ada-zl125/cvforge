"use client";

import type { AcademicCVContent, ResumeLanguage } from "@/lib/types/academic-cv";
import { PaginatedPreviewPanel } from "@/components/shared/PaginatedPreviewPanel";
import { AcademicTemplate } from "./templates/AcademicTemplate";

interface PreviewPanelProps {
  content: AcademicCVContent;
  language: ResumeLanguage;
}

export function PreviewPanel({ content, language }: PreviewPanelProps) {
  return (
    <PaginatedPreviewPanel>
      <AcademicTemplate content={content} language={language} />
    </PaginatedPreviewPanel>
  );
}
