"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check, Loader2, FileDown, FileText, FileType } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

type SaveStatus = "saved" | "saving" | "unsaved";

interface ToolbarProps {
  title: string;
  saveStatus: SaveStatus;
  onTitleChange: (title: string) => void;
}

export function Toolbar({ title, saveStatus, onTitleChange }: ToolbarProps) {
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
          className="btn-hover-border inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-lg border border-border bg-background px-2.5 text-sm font-medium transition-colors hover:bg-muted"
        >
          <FileDown className="size-4" />
          Export
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" sideOffset={4}>
          <DropdownMenuItem className="cursor-pointer gap-2">
            <FileText className="size-4" />
            Download PDF
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
