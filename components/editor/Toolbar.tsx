"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check, Loader2, FileDown, FileText, FileType } from "lucide-react";
import type { ResumeTemplate, ResumeContent } from "@/lib/types/resume";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

type SaveStatus = "saved" | "saving" | "unsaved";

const TEMPLATE_COLORS: Record<ResumeTemplate, { bg: string; text: string }> = {
  classic:      { bg: "bg-blue-50",    text: "text-blue-600" },
  modern:       { bg: "bg-violet-50",  text: "text-violet-600" },
  minimal:      { bg: "bg-emerald-50", text: "text-emerald-600" },
  creative:     { bg: "bg-amber-50",   text: "text-amber-600" },
  professional: { bg: "bg-indigo-50",  text: "text-indigo-600" },
  academic:     { bg: "bg-teal-50",    text: "text-teal-600" },
};

const TEMPLATE_LABELS: Record<ResumeTemplate, string> = {
  classic: "Classic",
  modern: "Modern",
  minimal: "Minimal",
  creative: "Creative",
  professional: "Professional",
  academic: "Academic",
};

interface ToolbarProps {
  title: string;
  template: ResumeTemplate;
  content: ResumeContent;
  saveStatus: SaveStatus;
  onTitleChange: (title: string) => void;
}

export function Toolbar({ title, template, content, saveStatus, onTitleChange }: ToolbarProps) {
  const [exporting, setExporting] = useState(false);
  const colors = TEMPLATE_COLORS[template] ?? TEMPLATE_COLORS.classic;
  const label = TEMPLATE_LABELS[template] ?? "Classic";
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(title);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setEditValue(title);
  }, [title]);

  useEffect(() => {
    if (editing) inputRef.current?.select();
  }, [editing]);

  async function handleExportPDF() {
    setExporting(true);
    try {
      const res = await fetch("/api/export/pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, title }),
      });
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${title || "resume"}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("PDF export error:", err);
    } finally {
      setExporting(false);
    }
  }

  function commitTitle() {
    const trimmed = editValue.trim();
    if (trimmed && trimmed !== title) {
      onTitleChange(trimmed);
    } else {
      setEditValue(title);
    }
    setEditing(false);
  }

  return (
    <header className="flex h-14 shrink-0 items-center gap-4 border-b border-border bg-card px-4">
      {/* Back button */}
      <Button
        variant="ghost"
        size="icon-sm"
        className="cursor-pointer"
        onClick={() => router.push("/workspace")}
        aria-label="Back to workspace"
      >
        <ArrowLeft className="size-4" />
      </Button>

      {/* Template badge */}
      <span className={`inline-flex items-center rounded px-1.5 py-0.5 text-[11px] font-medium ${colors.bg} ${colors.text}`}>
        {label}
      </span>

      {/* Title — click to rename */}
      {editing ? (
        <Input
          ref={inputRef}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={commitTitle}
          onKeyDown={(e) => {
            if (e.key === "Enter") commitTitle();
            if (e.key === "Escape") {
              setEditValue(title);
              setEditing(false);
            }
          }}
          className="h-7 max-w-64 text-sm font-medium"
        />
      ) : (
        <button
          type="button"
          className="cursor-pointer rounded px-2 py-1 text-sm font-medium text-foreground transition-colors hover:bg-muted"
          onClick={() => setEditing(true)}
        >
          {title}
        </button>
      )}

      {/* Save status */}
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        {saveStatus === "saved" && (
          <>
            <Check className="size-3.5 text-emerald-500" />
            <span>Saved</span>
          </>
        )}
        {saveStatus === "saving" && (
          <>
            <Loader2 className="size-3.5 animate-spin" />
            <span>Saving...</span>
          </>
        )}
        {saveStatus === "unsaved" && (
          <span className="text-amber-500">Unsaved changes</span>
        )}
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Export dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger
          className="btn-hover-border inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-lg border border-border bg-background px-2.5 text-sm font-medium hover:bg-muted"
        >
          <FileDown className="size-4" />
          Export
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" sideOffset={4}>
          <DropdownMenuItem className="cursor-pointer gap-2" onClick={handleExportPDF} disabled={exporting}>
            {exporting ? <Loader2 className="size-4 animate-spin" /> : <FileText className="size-4" />}
            {exporting ? "Exporting..." : "Download PDF"}
          </DropdownMenuItem>
          <DropdownMenuItem className="cursor-pointer gap-2">
            <FileType className="size-4" />
            Download DOCX
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
