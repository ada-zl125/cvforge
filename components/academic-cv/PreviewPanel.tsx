"use client";

import type { AcademicCVContent, ResumeLanguage } from "@/lib/types/academic-cv";
import { AcademicTemplate } from "./templates/AcademicTemplate";

interface PreviewPanelProps {
  content: AcademicCVContent;
  language: ResumeLanguage;
}

export function PreviewPanel({ content, language }: PreviewPanelProps) {
  return (
    <div className="flex flex-1 items-start justify-center overflow-y-auto bg-muted/50 p-8">
      <div className="preview-a4 overflow-hidden rounded-sm border border-border shadow-lg">
        <AcademicTemplate content={content} language={language} />
      </div>
    </div>
  );
}
