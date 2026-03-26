"use client";

import type { ResumeContent } from "@/lib/types/resume";
import { AcademicTemplate } from "./templates/AcademicTemplate";

interface PreviewPanelProps {
  content: ResumeContent;
}

export function PreviewPanel({ content }: PreviewPanelProps) {
  return (
    <div className="flex flex-1 items-start justify-center overflow-y-auto bg-muted/50 p-8">
      <div className="shadow-lg">
        <AcademicTemplate content={content} />
      </div>
    </div>
  );
}
