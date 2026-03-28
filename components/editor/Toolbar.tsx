"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check, Loader2, FileDown, FileText, Image } from "lucide-react";
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

const TEMPLATE_OPTIONS: { value: ResumeTemplate; label: string; bg: string; text: string }[] = [
  { value: "classic",  label: "Classic",  bg: "bg-blue-50",  text: "text-blue-600" },
  { value: "academic", label: "Academic", bg: "bg-teal-50",  text: "text-teal-600" },
];

interface ToolbarProps {
  title: string;
  template: ResumeTemplate;
  content: ResumeContent;
  saveStatus: SaveStatus;
  onTitleChange: (title: string) => void;
  onTemplateChange: (template: ResumeTemplate) => void;
}

export function Toolbar({ title, template, content, saveStatus, onTitleChange, onTemplateChange }: ToolbarProps) {
  const [exportingFormat, setExportingFormat] = useState<"pdf" | "png" | null>(null);
  const current = TEMPLATE_OPTIONS.find((t) => t.value === template) ?? TEMPLATE_OPTIONS[0];
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

  async function handleExport(format: "pdf" | "png") {
    setExportingFormat(format);
    try {
      const res = await fetch(`/api/export/${format}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, title }),
      });
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${title || "resume"}.${format}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(`${format.toUpperCase()} export error:`, err);
    } finally {
      setExportingFormat(null);
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
    <header className="editor-toolbar flex h-14 shrink-0 items-center gap-4 border-b border-border bg-card px-4">
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

      {/* Template selector */}
      <DropdownMenu>
        <DropdownMenuTrigger className={`inline-flex cursor-pointer items-center rounded px-1.5 py-0.5 text-[11px] font-medium transition-opacity hover:opacity-80 ${current.bg} ${current.text}`}>
          {current.label}
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" sideOffset={4}>
          {TEMPLATE_OPTIONS.map((t) => (
            <DropdownMenuItem
              key={t.value}
              className="cursor-pointer gap-2"
              onClick={() => onTemplateChange(t.value)}
            >
              <span className={`inline-flex rounded px-1.5 py-0.5 text-[10px] font-medium ${t.bg} ${t.text}`}>{t.label}</span>
              {t.value === template && <Check className="ml-auto size-3.5" />}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

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
        <DropdownMenuContent align="end" sideOffset={4} className="min-w-[160px]">
          <DropdownMenuItem className="cursor-pointer gap-2 whitespace-nowrap" onClick={() => handleExport("pdf")} disabled={exportingFormat !== null}>
            {exportingFormat === "pdf" ? <Loader2 className="size-4 animate-spin" /> : <FileText className="size-4" />}
            {exportingFormat === "pdf" ? "Exporting..." : "Download PDF"}
          </DropdownMenuItem>
          <DropdownMenuItem className="cursor-pointer gap-2 whitespace-nowrap" onClick={() => handleExport("png")} disabled={exportingFormat !== null}>
            {exportingFormat === "png" ? <Loader2 className="size-4 animate-spin" /> : <Image className="size-4" />}
            {exportingFormat === "png" ? "Exporting..." : "Download PNG"}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
