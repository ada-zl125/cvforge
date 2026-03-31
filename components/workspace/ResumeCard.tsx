"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Trash2, Settings, MoreHorizontal, Copy } from "lucide-react";
import { useUILanguage } from "@/lib/ui-language";
import { t, type Translations } from "@/lib/translations";
import { createClient } from "@/lib/supabase/client";
import type { ResumeRow, ResumeTemplate, ResumeLanguage } from "@/lib/types/resume";
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
  general: { bar: "bg-blue-500", bg: "bg-blue-50", text: "text-blue-600", hex: "#3b82f6" },
};

const TEMPLATE_LABELS: Record<ResumeTemplate, string> = {
  general: "General",
};

const SETTINGS_TEMPLATES: { value: ResumeTemplate; label: string; bg: string; text: string }[] = [
  { value: "general", label: "General", bg: "bg-blue-50", text: "text-blue-600" },
];

const SETTINGS_LANGUAGES: { value: ResumeLanguage; label: string }[] = [
  { value: "en", label: "English" },
  { value: "zh", label: "Chinese" },
];

const TITLE_MAX_LENGTH = 50;

/* ------------------------------------------------------------------ */
/*  Relative time helper                                               */
/* ------------------------------------------------------------------ */

function timeAgo(dateStr: string, tr: Translations): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return tr.justNow;
  if (mins < 60) return tr.timeMinute(mins);
  const hours = Math.floor(mins / 60);
  if (hours < 24) return tr.timeHour(hours);
  const days = Math.floor(hours / 24);
  if (days < 30) return tr.timeDay(days);
  const months = Math.floor(days / 30);
  return tr.timeMonth(months);
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
  const { lang } = useUILanguage();
  const tr = t[lang];
  const colors = TEMPLATE_COLORS[resume.template] ?? TEMPLATE_COLORS.general;
  const label = lang === "zh" ? tr.templateGeneral : (TEMPLATE_LABELS[resume.template] ?? "General");

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsTitle, setSettingsTitle] = useState(resume.title);
  const normalizedTemplate: ResumeTemplate = TEMPLATE_COLORS[resume.template] ? resume.template : "general";
  const [settingsTemplate, setSettingsTemplate] = useState(normalizedTemplate);
  const [settingsLanguage, setSettingsLanguage] = useState<ResumeLanguage>(resume.language ?? "en");
  const [settingsLoading, setSettingsLoading] = useState(false);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  /* ---- Settings (title + template) ---- */
  async function handleSettingsSave() {
    const trimmed = settingsTitle.trim();
    if (!trimmed) return;
    const titleChanged = trimmed !== resume.title;
    const templateChanged = settingsTemplate !== resume.template;
    const languageChanged = settingsLanguage !== (resume.language ?? "en");
    if (!titleChanged && !templateChanged && !languageChanged) {
      setSettingsOpen(false);
      return;
    }
    setSettingsLoading(true);
    try {
      const supabase = createClient();
      const updates: Record<string, string> = {};
      if (titleChanged) updates.title = trimmed;
      if (templateChanged) updates.template = settingsTemplate;
      if (languageChanged) updates.language = settingsLanguage;
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
      language: resume.language ?? "en",
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
                <DropdownMenuItem className="cursor-pointer gap-2" onClick={() => { setSettingsOpen(true); setSettingsTitle(resume.title); setSettingsTemplate(normalizedTemplate); setSettingsLanguage(resume.language ?? "en"); }}>
                  <Settings className="size-4" />
                  {tr.settings}
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer gap-2" onClick={() => handleDuplicate()}>
                  <Copy className="size-4" />
                  {tr.duplicate}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="cursor-pointer gap-2 text-destructive focus:text-destructive" onClick={() => setDeleteOpen(true)}>
                  <Trash2 className="size-4" />
                  {tr.delete}
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
              {tr.edited} {timeAgo(resume.updated_at, tr)}
            </p>
          </div>

          {/* Edit button */}
          <button
            type="button"
            className="flex cursor-pointer items-center gap-1 self-start rounded-[5px] px-2 py-1 text-xs font-medium text-foreground hover:bg-muted"
            onClick={(e) => { e.stopPropagation(); router.push(`/editor/${resume.id}`); }}
          >
            <Pencil className="size-3.5" />
            {tr.edit}
          </button>
        </div>
      </div>

      {/* Settings dialog (title + template) — matches CreateResumeModal style */}
      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{tr.resumeSettings}</DialogTitle>
            <DialogDescription>{tr.resumeSettingsDesc}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            {/* Title input */}
            <div className="grid gap-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor={`settings-title-${resume.id}`}>{tr.titleLabel}</Label>
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
                <p className="text-xs text-destructive">{tr.titleTooLong(TITLE_MAX_LENGTH)}</p>
              )}
            </div>

            {/* Language picker */}
            <div className="grid gap-2">
              <Label>{tr.languageLabel}</Label>
              <div className="flex gap-2">
                {SETTINGS_LANGUAGES.map((l) => {
                  const active = settingsLanguage === l.value;
                  const langLabel = l.value === "en" ? tr.langEnglish : tr.langChinese;
                  return (
                    <button
                      key={l.value}
                      type="button"
                      onClick={() => setSettingsLanguage(l.value)}
                      className={`cursor-pointer rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                        active
                          ? "border-foreground bg-foreground/5 text-foreground"
                          : "border-border text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                      }`}
                    >
                      {langLabel}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Template picker */}
            <div className="grid gap-2">
              <Label>{tr.templateLabel}</Label>
              <div className="flex gap-2">
                {SETTINGS_TEMPLATES.map((tmpl) => {
                  const active = settingsTemplate === tmpl.value;
                  return (
                    <button
                      key={tmpl.value}
                      type="button"
                      onClick={() => setSettingsTemplate(tmpl.value)}
                      className={`cursor-pointer rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                        active
                          ? `${tmpl.bg} ${tmpl.text} border-current`
                          : "border-border text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                      }`}
                    >
                      {tr.templateGeneral}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" className="btn-hover-border cursor-pointer" onClick={() => setSettingsOpen(false)}>
              {tr.cancel}
            </Button>
            <Button
              variant="outline"
              onClick={handleSettingsSave}
              disabled={!settingsTitle.trim() || settingsTitle.length > TITLE_MAX_LENGTH || settingsLoading}
              className="btn-hover-primary cursor-pointer"
            >
              {settingsLoading ? tr.saving : tr.save}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent size="sm">
          <AlertDialogHeader>
            <AlertDialogTitle>{tr.deleteResume}</AlertDialogTitle>
            <AlertDialogDescription>
              {tr.deleteDesc(resume.title)}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="btn-hover-border cursor-pointer">{tr.cancel}</AlertDialogCancel>
            <AlertDialogAction
              variant="outline"
              className="btn-hover-destructive cursor-pointer border-destructive/40 text-destructive hover:border-destructive hover:bg-destructive/10 hover:text-destructive"
              onClick={handleDelete}
              disabled={deleteLoading}
            >
              {deleteLoading ? tr.deleting : tr.delete}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
