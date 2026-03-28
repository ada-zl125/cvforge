"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Trash2, Settings, MoreHorizontal, Copy } from "lucide-react";
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
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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

const SETTINGS_TEMPLATES: { value: ResumeTemplate; label: string; bg: string; text: string }[] = [
  { value: "classic",  label: "Classic",  bg: "bg-blue-50",  text: "text-blue-600" },
  { value: "academic", label: "Academic", bg: "bg-teal-50",  text: "text-teal-600" },
];

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

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsTitle, setSettingsTitle] = useState(resume.title);
  const [settingsTemplate, setSettingsTemplate] = useState(resume.template);
  const [settingsLoading, setSettingsLoading] = useState(false);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  /* ---- Settings (title + template) ---- */
  async function handleSettingsSave() {
    const trimmed = settingsTitle.trim();
    if (!trimmed) return;
    const titleChanged = trimmed !== resume.title;
    const templateChanged = settingsTemplate !== resume.template;
    if (!titleChanged && !templateChanged) {
      setSettingsOpen(false);
      return;
    }
    setSettingsLoading(true);
    try {
      const supabase = createClient();
      const updates: Record<string, string> = {};
      if (titleChanged) updates.title = trimmed;
      if (templateChanged) updates.template = settingsTemplate;
      await supabase.from("resumes").update(updates).eq("id", resume.id);
      setSettingsOpen(false);
      router.refresh();
    } finally {
      setSettingsLoading(false);
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
          {/* Top row: badge + three-dot menu */}
          <div className="flex items-start justify-between">
            <span
              className={`inline-flex items-center rounded px-1.5 py-0.5 text-[11px] font-medium ${colors.bg} ${colors.text}`}
            >
              {label}
            </span>

            {/* Three-dot menu */}
            <DropdownMenu>
              <DropdownMenuTrigger
                className="flex size-7 cursor-pointer items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreHorizontal className="size-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" sideOffset={4} onClick={(e) => e.stopPropagation()}>
                <DropdownMenuItem className="cursor-pointer gap-2" onClick={() => { setSettingsOpen(true); setSettingsTitle(resume.title); setSettingsTemplate(resume.template); }}>
                  <Settings className="size-4" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer gap-2" onClick={() => handleDuplicate()}>
                  <Copy className="size-4" />
                  Duplicate
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="cursor-pointer gap-2 text-destructive focus:text-destructive" onClick={() => setDeleteOpen(true)}>
                  <Trash2 className="size-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Title + date */}
          <div className="flex flex-col gap-1.5">
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

          {/* Edit button */}
          <button
            type="button"
            className="flex cursor-pointer items-center gap-1 self-start rounded-[5px] px-2 py-1 text-xs font-medium text-foreground hover:bg-muted"
            onClick={(e) => { e.stopPropagation(); router.push(`/editor/${resume.id}`); }}
          >
            <Pencil className="size-3.5" />
            Edit
          </button>
        </div>
      </div>

      {/* Settings dialog (title + template) — matches CreateResumeModal style */}
      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Resume Settings</DialogTitle>
            <DialogDescription>Update the title and template for your resume.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            {/* Title input */}
            <div className="grid gap-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor={`settings-title-${resume.id}`}>Title</Label>
                <span className={`text-xs ${settingsTitle.length > TITLE_MAX_LENGTH ? "text-destructive" : "text-muted-foreground"}`}>
                  {settingsTitle.length}/{TITLE_MAX_LENGTH}
                </span>
              </div>
              <Input
                id={`settings-title-${resume.id}`}
                value={settingsTitle}
                onChange={(e) => setSettingsTitle(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") handleSettingsSave(); }}
                className={settingsTitle.length > TITLE_MAX_LENGTH ? "border-destructive focus:border-destructive" : ""}
                autoFocus
              />
              {settingsTitle.length > TITLE_MAX_LENGTH && (
                <p className="text-xs text-destructive">Title must be {TITLE_MAX_LENGTH} characters or fewer.</p>
              )}
            </div>

            {/* Template picker */}
            <div className="grid gap-2">
              <Label>Template</Label>
              <div className="flex gap-2">
                {SETTINGS_TEMPLATES.map((t) => {
                  const active = settingsTemplate === t.value;
                  return (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() => setSettingsTemplate(t.value)}
                      className={`cursor-pointer rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                        active
                          ? `${t.bg} ${t.text} border-current`
                          : "border-border text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                      }`}
                    >
                      {t.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={handleSettingsSave}
              disabled={!settingsTitle.trim() || settingsTitle.length > TITLE_MAX_LENGTH || settingsLoading}
              className="cursor-pointer"
            >
              {settingsLoading ? "Saving..." : "Save"}
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
