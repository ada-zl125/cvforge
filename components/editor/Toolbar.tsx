"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check, Loader2, FileDown, FileText, Image, Settings } from "lucide-react";
import type { ResumeTemplate, ResumeLanguage, ResumeContent } from "@/lib/types/resume";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LanguageSwitcher } from "@/components/ui/language-switcher";
import { useUILanguage } from "@/lib/ui-language";
import { t } from "@/lib/translations";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

type SaveStatus = "saved" | "saving" | "unsaved";

const TEMPLATE_OPTIONS: { value: ResumeTemplate; label: string; bg: string; text: string }[] = [
  { value: "general", label: "General", bg: "bg-blue-50", text: "text-blue-600" },
];

const LANGUAGE_OPTIONS: { value: ResumeLanguage; label: string }[] = [
  { value: "en", label: "English" },
  { value: "zh", label: "Chinese" },
];

const TITLE_MAX = 50;

interface ToolbarProps {
  title: string;
  template: ResumeTemplate;
  language: ResumeLanguage;
  content: ResumeContent;
  saveStatus: SaveStatus;
  onSettingsChange: (title: string, language: ResumeLanguage, template: ResumeTemplate) => void;
}

export function Toolbar({ title, template, language, content, saveStatus, onSettingsChange }: ToolbarProps) {
  const router = useRouter();
  const { lang } = useUILanguage();
  const tr = t[lang];
  const [exportingFormat, setExportingFormat] = useState<"pdf" | "png" | null>(null);

  /* ---- Settings dialog state ---- */
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [draftTitle, setDraftTitle] = useState(title);
  const [draftLanguage, setDraftLanguage] = useState<ResumeLanguage>(language);
  const [draftTemplate, setDraftTemplate] = useState<ResumeTemplate>(template);

  // Sync drafts when dialog opens
  useEffect(() => {
    if (settingsOpen) {
      setDraftTitle(title);
      setDraftLanguage(language);
      setDraftTemplate(template);
    }
  }, [settingsOpen, title, language, template]);

  const titleTooLong = draftTitle.length > TITLE_MAX;
  const canSave = draftTitle.trim().length > 0 && !titleTooLong;

  function handleSettingsSave() {
    if (!canSave) return;
    onSettingsChange(draftTitle.trim(), draftLanguage, draftTemplate);
    setSettingsOpen(false);
  }

  /* ---- Export ---- */
  async function handleExport(format: "pdf" | "png") {
    setExportingFormat(format);
    try {
      const res = await fetch(`/api/export/${format}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, title, language }),
      });
      if (!res.ok) throw new Error(`${format.toUpperCase()} export failed`);
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

  return (
    <>
      <header className="editor-toolbar flex h-14 shrink-0 items-center gap-3 border-b border-border bg-card px-4">
        {/* Back button */}
        <Button
          variant="ghost"
          size="icon-sm"
          className="cursor-pointer"
          onClick={() => router.push("/workspace")}
          aria-label={tr.backToWorkspace}
        >
          <ArrowLeft className="size-4" />
        </Button>

        {/* Title (static) */}
        <span className="truncate text-sm font-medium text-foreground">{title}</span>

        {/* Settings button */}
        <Button
          variant="ghost"
          size="icon-sm"
          className="cursor-pointer shrink-0 text-muted-foreground hover:text-foreground"
          onClick={() => setSettingsOpen(true)}
          aria-label="Resume settings"
        >
          <Settings className="size-4" />
        </Button>

        {/* Save status */}
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          {saveStatus === "saved" && (
            <>
              <Check className="size-3.5 text-emerald-500" />
              <span>{tr.savedStatus}</span>
            </>
          )}
          {saveStatus === "saving" && (
            <>
              <Loader2 className="size-3.5 animate-spin" />
              <span>{tr.savingStatus}</span>
            </>
          )}
          {saveStatus === "unsaved" && (
            <span className="text-amber-500">{tr.unsavedStatus}</span>
          )}
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Language switcher */}
        <LanguageSwitcher />

        {/* Export dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger className="btn-hover-border inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-lg border border-border bg-background px-2.5 text-sm font-medium hover:bg-muted">
            <FileDown className="size-4" />
            {tr.exportLabel}
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" sideOffset={4} className="min-w-[160px]">
            <DropdownMenuItem className="cursor-pointer gap-2 whitespace-nowrap" onClick={() => handleExport("pdf")} disabled={exportingFormat !== null}>
              {exportingFormat === "pdf" ? <Loader2 className="size-4 animate-spin" /> : <FileText className="size-4" />}
              {exportingFormat === "pdf" ? tr.exporting : tr.downloadPdf}
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer gap-2 whitespace-nowrap" onClick={() => handleExport("png")} disabled={exportingFormat !== null}>
              {exportingFormat === "png" ? <Loader2 className="size-4 animate-spin" /> : <Image className="size-4" />}
              {exportingFormat === "png" ? tr.exporting : tr.downloadPng}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </header>

      {/* Settings Dialog */}
      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{tr.editorResumeSettings}</DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-2">
            {/* Title */}
            <div className="grid gap-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="settings-title">{tr.titleLabel}</Label>
                <span className={`text-xs ${titleTooLong ? "text-destructive" : "text-muted-foreground"}`}>
                  {draftTitle.length}/{TITLE_MAX}
                </span>
              </div>
              <Input
                id="settings-title"
                value={draftTitle}
                onChange={(e) => setDraftTitle(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") handleSettingsSave(); }}
                className={titleTooLong ? "border-destructive focus:border-destructive" : ""}
                autoFocus
              />
              {titleTooLong && (
                <p className="text-xs text-destructive">{tr.titleTooLong(TITLE_MAX)}</p>
              )}
            </div>

            {/* Language picker */}
            <div className="grid gap-2">
              <Label>{tr.languageLabel}</Label>
              <div className="flex gap-2">
                {LANGUAGE_OPTIONS.map((l) => (
                  <button
                    key={l.value}
                    type="button"
                    onClick={() => setDraftLanguage(l.value)}
                    className={`cursor-pointer rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                      draftLanguage === l.value
                        ? "border-foreground bg-foreground/5 text-foreground"
                        : "border-border text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                    }`}
                  >
                    {l.value === "en" ? tr.langEnglish : tr.langChinese}
                  </button>
                ))}
              </div>
            </div>

            {/* Template picker */}
            <div className="grid gap-2">
              <Label>{tr.templateLabel}</Label>
              <div className="flex gap-2">
                {TEMPLATE_OPTIONS.map((tmpl) => (
                  <button
                    key={tmpl.value}
                    type="button"
                    onClick={() => setDraftTemplate(tmpl.value)}
                    className={`cursor-pointer rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                      draftTemplate === tmpl.value
                        ? `${tmpl.bg} ${tmpl.text} border-current`
                        : "border-border text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                    }`}
                  >
                    {tr.templateGeneral}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" className="btn-hover-border cursor-pointer" onClick={() => setSettingsOpen(false)}>
              {tr.cancel}
            </Button>
            <Button variant="outline" className="btn-hover-primary cursor-pointer" onClick={handleSettingsSave} disabled={!canSave}>
              {tr.save}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
