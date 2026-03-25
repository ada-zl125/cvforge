"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Copy, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { ResumeRow, ResumeTemplate } from "@/lib/types/resume";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

/* ------------------------------------------------------------------ */
/*  Template colour mapping                                            */
/* ------------------------------------------------------------------ */

const TEMPLATE_COLORS: Record<ResumeTemplate, { bar: string; bg: string; text: string; hex: string }> = {
  classic:      { bar: "bg-blue-500",    bg: "bg-blue-50",    text: "text-blue-600",    hex: "#3b82f6" },
  modern:       { bar: "bg-violet-500",  bg: "bg-violet-50",  text: "text-violet-600",  hex: "#8b5cf6" },
  minimal:      { bar: "bg-emerald-500", bg: "bg-emerald-50", text: "text-emerald-600", hex: "#10b981" },
  creative:     { bar: "bg-amber-500",   bg: "bg-amber-50",   text: "text-amber-600",   hex: "#f59e0b" },
  professional: { bar: "bg-indigo-500",  bg: "bg-indigo-50",  text: "text-indigo-600",  hex: "#6366f1" },
  academic:     { bar: "bg-teal-500",    bg: "bg-teal-50",    text: "text-teal-600",    hex: "#14b8a6" },
};

const TEMPLATE_LABELS: Record<ResumeTemplate, string> = {
  classic: "Classic",
  modern: "Modern",
  minimal: "Minimal",
  creative: "Creative",
  professional: "Professional",
  academic: "Academic",
};

const TITLE_MAX_LENGTH = 50;

/* ------------------------------------------------------------------ */
/*  Relative time helper                                               */
/* ------------------------------------------------------------------ */

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

function truncateTitle(title: string): string {
  if (title.length <= TITLE_MAX_LENGTH) return title;
  return title.slice(0, TITLE_MAX_LENGTH) + "…";
}

/* ------------------------------------------------------------------ */
/*  ResumeCard                                                         */
/* ------------------------------------------------------------------ */

interface ResumeCardProps {
  resume: ResumeRow;
}

export function ResumeCard({ resume }: ResumeCardProps) {
  const router = useRouter();
  const colors = TEMPLATE_COLORS[resume.template] ?? TEMPLATE_COLORS.classic;
  const label = TEMPLATE_LABELS[resume.template] ?? "Classic";

  const [renameOpen, setRenameOpen] = useState(false);
  const [renameValue, setRenameValue] = useState(resume.title);
  const [renameLoading, setRenameLoading] = useState(false);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  /* ---- Rename ---- */
  async function handleRename() {
    const trimmed = renameValue.trim();
    if (!trimmed || trimmed === resume.title) {
      setRenameOpen(false);
      return;
    }
    setRenameLoading(true);
    try {
      const supabase = createClient();
      await supabase.from("resumes").update({ title: trimmed }).eq("id", resume.id);
      setRenameOpen(false);
      router.refresh();
    } finally {
      setRenameLoading(false);
    }
  }

  /* ---- Duplicate ---- */
  async function handleDuplicate() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from("resumes").insert({
      user_id: user.id,
      title: `${resume.title} (Copy)`,
      template: resume.template,
      content: resume.content,
    });
    router.refresh();
  }

  /* ---- Delete ---- */
  async function handleDelete() {
    setDeleteLoading(true);
    try {
      const supabase = createClient();
      await supabase.from("resumes").delete().eq("id", resume.id);
      setDeleteOpen(false);
      router.refresh();
    } finally {
      setDeleteLoading(false);
    }
  }

  return (
    <>
      {/* Card — matches workspace-page.pen design */}
      {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */}
      <div
        className="resume-card group cursor-pointer overflow-hidden rounded-[10px] border border-border bg-card transition-all duration-200 ease-out"
        style={{ "--card-accent": colors.hex } as React.CSSProperties}
        onClick={() => router.push(`/editor/${resume.id}`)}
      >
        {/* Colour bar (4px) */}
        <div className={`h-1 w-full ${colors.bar}`} />

        {/* Card body */}
        <div className="flex flex-col gap-3 px-4 py-3.5">
          {/* Top section: badge → title → date */}
          <div className="flex flex-col gap-2">
            <span
              className={`inline-flex w-fit items-center rounded px-1.5 py-0.5 text-[11px] font-medium ${colors.bg} ${colors.text}`}
            >
              {label}
            </span>
            <p
              className="text-sm font-semibold text-foreground"
              title={resume.title.length > TITLE_MAX_LENGTH ? resume.title : undefined}
            >
              {truncateTitle(resume.title)}
            </p>
            <p className="text-xs text-muted-foreground">
              Edited {timeAgo(resume.updated_at)}
            </p>
          </div>

          {/* Action buttons row */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              className="flex cursor-pointer items-center gap-1 rounded-[5px] px-2 py-1 text-xs font-medium text-foreground hover:bg-muted"
              onClick={(e) => { e.stopPropagation(); router.push(`/editor/${resume.id}`); }}
            >
              <Pencil className="size-3.5" />
              Edit
            </button>

            <Separator orientation="vertical" className="!h-3.5" />

            <button
              type="button"
              className="flex cursor-pointer items-center gap-1 rounded-[5px] px-2 py-1 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
              onClick={(e) => { e.stopPropagation(); handleDuplicate(); }}
            >
              <Copy className="size-3.5" />
              Duplicate
            </button>

            <Separator orientation="vertical" className="!h-3.5" />

            <button
              type="button"
              className="flex cursor-pointer items-center gap-1 rounded-[5px] px-2 py-1 text-xs font-medium text-destructive hover:bg-destructive/10"
              onClick={(e) => { e.stopPropagation(); setDeleteOpen(true); }}
            >
              <Trash2 className="size-3.5" />
              Delete
            </button>
          </div>
        </div>
      </div>

      {/* Rename dialog */}
      <Dialog open={renameOpen} onOpenChange={setRenameOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Rename Resume</DialogTitle>
            <DialogDescription>Enter a new title for your resume.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-2 py-2">
            <Label htmlFor={`rename-${resume.id}`}>Title</Label>
            <Input
              id={`rename-${resume.id}`}
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleRename(); }}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button
              onClick={handleRename}
              disabled={!renameValue.trim() || renameLoading}
              className="cursor-pointer"
            >
              {renameLoading ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent size="sm">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete resume?</AlertDialogTitle>
            <AlertDialogDescription>
              &ldquo;{resume.title}&rdquo; will be permanently deleted. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="btn-hover-border cursor-pointer">Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="outline"
              className="btn-hover-destructive cursor-pointer border-destructive/40 text-destructive hover:border-destructive hover:bg-destructive/10 hover:text-destructive"
              onClick={handleDelete}
              disabled={deleteLoading}
            >
              {deleteLoading ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
