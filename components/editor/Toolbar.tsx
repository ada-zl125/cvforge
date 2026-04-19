"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ChevronDown, FileDown, FileImage, FileJson, FileUp, Loader2, Settings } from "lucide-react";
import { exportResume, exportJson, type ExportFormat } from "@/lib/export";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { TITLE_MAX } from "@/lib/defaults";
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

const TEMPLATE_OPTIONS: { value: ResumeTemplate; label: string; bg: string; text: string }[] = [
  { value: "general", label: "General", bg: "bg-blue-50", text: "text-blue-600" },
];


interface ImportedResumeState {
  title: string;
  template: ResumeTemplate;
  language: ResumeLanguage;
  content: ResumeContent;
}

interface ToolbarProps {
  title: string;
  template: ResumeTemplate;
  language: ResumeLanguage;
  content: ResumeContent;
  onSettingsChange: (title: string, language: ResumeLanguage, template: ResumeTemplate) => void;
  onImport: (state: ImportedResumeState) => void;
}

export function Toolbar({ title, template, language, content, onSettingsChange, onImport }: ToolbarProps) {
  const router = useRouter();
  const { lang } = useUILanguage();
  const tr = t[lang];

  /* ---- Export state ---- */
  const [exporting, setExporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleExport(format: ExportFormat) {
    setExporting(true);
    try {
      await exportResume(format, title || "resume");
    } finally {
      setExporting(false);
    }
  }

  function handleExportJson() {
    exportJson({ _type: "easycv-resume", title, template, language, content }, title || "resume");
  }

  function handleImportFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result as string);
        if (
          parsed._type !== "easycv-resume" ||
          typeof parsed.content !== "object" ||
          !parsed.content?.personal ||
          !Array.isArray(parsed.content?.sections)
        ) throw new Error("invalid");
        onImport({ title: parsed.title, template: parsed.template, language: parsed.language, content: parsed.content });
      } catch {
        alert(tr.importJsonError);
      }
    };
    reader.readAsText(file);
  }

  /* ---- Settings dialog state ---- */
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [draftTitle, setDraftTitle] = useState(title);
  const [draftLanguage, setDraftLanguage] = useState<ResumeLanguage>(language);
  const [draftTemplate, setDraftTemplate] = useState<ResumeTemplate>(template);

  function openSettings() {
    setDraftTitle(title);
    setDraftLanguage(language);
    setDraftTemplate(template);
    setSettingsOpen(true);
  }

  const titleTooLong = draftTitle.length > TITLE_MAX;
  const canSave = draftTitle.trim().length > 0 && !titleTooLong;

  function handleSettingsSave() {
    if (!canSave) return;
    onSettingsChange(draftTitle.trim(), draftLanguage, draftTemplate);
    setSettingsOpen(false);
  }

  return (
    <>
      <input ref={fileInputRef} type="file" accept=".json" className="hidden" onChange={handleImportFile} />
      <header className="editor-toolbar flex h-14 shrink-0 items-center gap-3 border-b border-border bg-card px-4">
        {/* Back button */}
        <Button
          variant="ghost"
          size="icon-sm"
          className="cursor-pointer"
          onClick={() => router.push("/")}
          aria-label={tr.backToHome}
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
          onClick={openSettings}
          aria-label="Resume settings"
        >
          <Settings className="size-4" />
        </Button>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Language switcher */}
        <LanguageSwitcher />

        {/* Import dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              className="btn-hover-border h-8 cursor-pointer gap-1.5 rounded-lg px-3 text-sm font-medium"
              variant="outline"
            >
              <FileUp className="size-4" />
              {tr.importLabel}
              <ChevronDown className="size-3 opacity-60" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-44">
            <DropdownMenuItem className="cursor-pointer gap-2" onClick={() => fileInputRef.current?.click()}>
              <FileUp className="size-4 text-muted-foreground" />
              {tr.importJson}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Export dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              className="btn-hover-border h-8 cursor-pointer gap-1.5 rounded-lg px-3 text-sm font-medium"
              variant="outline"
              disabled={exporting}
            >
              {exporting
                ? <Loader2 className="size-4 animate-spin" />
                : <FileDown className="size-4" />}
              {exporting ? tr.exporting : tr.exportLabel}
              {!exporting && <ChevronDown className="size-3 opacity-60" />}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-44">
            <DropdownMenuItem className="cursor-pointer gap-2" onClick={() => handleExport("pdf")}>
              <FileDown className="size-4 text-muted-foreground" />
              {tr.exportPdf}
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer gap-2" onClick={() => handleExport("png")}>
              <FileImage className="size-4 text-muted-foreground" />
              {tr.exportPng}
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer gap-2" onClick={handleExportJson}>
              <FileJson className="size-4 text-muted-foreground" />
              {tr.exportJson}
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
                {(["en", "zh"] as const).map((lang) => (
                  <button
                    key={lang}
                    type="button"
                    onClick={() => setDraftLanguage(lang)}
                    className={`cursor-pointer rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                      draftLanguage === lang
                        ? "border-foreground bg-foreground/5 text-foreground"
                        : "border-border text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                    }`}
                  >
                    {lang === "en" ? tr.langEnglish : tr.langChinese}
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
