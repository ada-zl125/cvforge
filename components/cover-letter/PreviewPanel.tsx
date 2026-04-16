"use client";

import type { CoverLetterContent } from "@/lib/types/cover-letter";
import { CoverLetterTemplate } from "./templates/CoverLetterTemplate";

interface Props {
  content: CoverLetterContent;
}

export function PreviewPanel({ content }: Props) {
  return (
    <div className="flex flex-1 items-start justify-center overflow-y-auto bg-muted/50 p-8">
      <div className="preview-a4 overflow-hidden rounded-sm border border-border shadow-lg">
        <CoverLetterTemplate content={content} />
      </div>
    </div>
  );
}
