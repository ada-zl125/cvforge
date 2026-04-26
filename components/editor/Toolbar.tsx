"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ChevronDown, FileDown, FileImage, FileJson, FileUp, Loader2, Settings, Sparkles } from "lucide-react";
import { exportResume, exportJson, type ExportFormat } from "@/lib/export";
import { withId, mergeDegreeField, stripDegreeField } from "@/lib/json-utils";
import { defaultResumeContent, TITLE_MAX } from "@/lib/defaults";
import resumeExampleEn from "@/examples/resume-example-en.json";
import resumeExampleCn from "@/examples/resume-example-cn.json";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  const [exampleDialogOpen, setExampleDialogOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleExport(format: ExportFormat) {
    setExporting(true);
    try {
      await exportResume(format, title || "resume");
    } finally {
      setExporting(false);
    }
  }

  function handleLoadExample() {
    const example = language === "zh" ? resumeExampleCn : resumeExampleEn;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const raw: any = example.content;
    const merged: ResumeContent = {
      ...defaultResumeContent,
      ...raw,
      personal: { ...defaultResumeContent.personal, ...raw.personal },
      experience: withId(raw.experience).map((e) => ({ ...e, descriptions: withId(e.descriptions) })),
      education: withId(raw.education).map((ed) => { const e = mergeDegreeField(ed, example.language); return { ...e, extraFields: withId(e.extraFields) }; }),
      skills: withId(raw.skills),
      projects: withId(raw.projects).map((p) => ({ ...p, descriptions: withId(p.descriptions) })),
      awards: withId(raw.awards),
    };
    onImport({ title, template: example.template as ResumeTemplate, language: example.language as ResumeLanguage, content: merged });
  }

  function handleExportJson() {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { photo: _photo, ...personal } = content.personal;
    exportJson({ _type: "cvforge-resume", title, template, language, content: { ...content, personal, education: stripDegreeField(content.education) } }, title || "resume");
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
          parsed._type !== "cvforge-resume" ||
          typeof parsed.content !== "object" ||
          !parsed.content?.personal ||
          !Array.isArray(parsed.content?.sections)
        ) throw new Error("invalid");
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const raw: any = parsed.content;
        const merged: ResumeContent = {
          ...defaultResumeContent,
          ...raw,
          personal: { ...defaultResumeContent.personal, ...raw.personal },
          experience: withId(raw.experience).map((e) => ({ ...e, descriptions: withId(e.descriptions) })),
          education: withId(raw.education).map((ed) => { const e = mergeDegreeField(ed, parsed.language); return { ...e, extraFields: withId(e.extraFields) }; }),
          skills: withId(raw.skills),
          projects: withId(raw.projects).map((p) => ({ ...p, descriptions: withId(p.descriptions) })),
          awards: withId(raw.awards),
        };
        onImport({ title: parsed.title, template: parsed.template, language: parsed.language, content: merged });
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

  function openSettings() {
    setDraftTitle(title);
    setDraftLanguage(language);
    setSettingsOpen(true);
  }

  const titleTooLong = draftTitle.length > TITLE_MAX;
  const canSave = draftTitle.trim().length > 0 && !titleTooLong;

  function handleSettingsSave() {
    if (!canSave) return;
    onSettingsChange(draftTitle.trim(), draftLanguage, template);
    setSettingsOpen(false);
  }

  return (
    <>
      <input ref={fileInputRef} type="file" accept=".json" className="hidden" onChange={handleImportFile} />
      <header className="editor-toolbar relative z-20 flex h-14 shrink-0 items-center gap-3 border-b border-border bg-card px-4">
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

        {/* Language switcher */}
        <LanguageSwitcher />

        {/* Spacer */}
        <div className="flex-1" />

        {/* Example button */}
        <Button
          className="btn-hover-border h-8 cursor-pointer gap-1.5 rounded-lg px-3 text-sm font-medium"
          variant="outline"
          onClick={() => setExampleDialogOpen(true)}
        >
          <Sparkles className="size-4" />
          {tr.loadExample}
        </Button>

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

      {/* Example confirmation dialog */}
      <Dialog open={exampleDialogOpen} onOpenChange={setExampleDialogOpen}>
        <DialogContent className="editor-dialog overflow-hidden p-0 sm:max-w-[420px]">
          <DialogHeader className="editor-dialog-header px-5 pb-4 pt-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-black/40 bg-black/[0.035]">
                <Sparkles className="h-4 w-4 text-foreground" />
              </div>
              <DialogTitle className="text-[15px] font-semibold leading-tight">{tr.loadExampleDialogTitle}</DialogTitle>
            </div>
            <div className="space-y-2 px-0 pt-1">
              <p className="text-sm leading-relaxed text-gray-600">
                {tr.loadExampleDialogDesc}
              </p>
              <p className="text-sm font-medium text-foreground">
                {tr.loadExampleDialogWarn}
              </p>
            </div>
          </DialogHeader>
          <DialogFooter className="editor-dialog-footer">
            <Button variant="outline" className="editor-dialog-cancel cursor-pointer" onClick={() => setExampleDialogOpen(false)}>
              {tr.cancel}
            </Button>
            <Button
              variant="outline"
              className="editor-dialog-soft-action cursor-pointer"
              onClick={() => { handleLoadExample(); setExampleDialogOpen(false); }}
            >
              {tr.loadExampleConfirm}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Settings Dialog */}
      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent className="editor-dialog overflow-hidden p-0 sm:max-w-[420px]">
          <DialogHeader className="editor-dialog-header px-5 pb-4 pt-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-black/40 bg-black/[0.035]">
                <Settings className="h-4 w-4 text-foreground" />
              </div>
              <DialogTitle className="text-[15px] font-semibold leading-tight">{tr.editorResumeSettings}</DialogTitle>
            </div>
          </DialogHeader>

          <div className="grid gap-5 px-5 pb-5 pt-3">
            {/* Title */}
            <div className="grid gap-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="settings-title" className="text-sm font-medium">{tr.titleLabel}</Label>
                <span className={`text-xs ${titleTooLong ? "text-destructive" : "text-muted-foreground"}`}>
                  {draftTitle.length}/{TITLE_MAX}
                </span>
              </div>
              <Input
                id="settings-title"
                value={draftTitle}
                onChange={(e) => setDraftTitle(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") handleSettingsSave(); }}
                className={`editor-dialog-input h-10 ${titleTooLong ? "border-destructive focus:border-destructive" : ""}`}
                autoFocus
              />
              {titleTooLong && (
                <p className="text-xs text-destructive">{tr.titleTooLong(TITLE_MAX)}</p>
              )}
            </div>

            {/* Language picker */}
            <div className="grid gap-2">
              <Label className="text-sm font-medium">{tr.languageLabel}</Label>
              <div className="flex gap-2">
                {(["en", "zh"] as const).map((lang) => (
                  <button
                    key={lang}
                    type="button"
                    onClick={() => setDraftLanguage(lang)}
                    className={`editor-dialog-language cursor-pointer rounded-lg px-3 py-2 text-sm font-medium ${
                      draftLanguage === lang
                        ? "editor-dialog-language-active"
                        : "text-muted-foreground"
                    }`}
                  >
                    {lang === "en" ? tr.langEnglish : tr.langChinese}
                  </button>
                ))}
              </div>
            </div>


          </div>

          <DialogFooter className="editor-dialog-footer">
            <Button variant="outline" className="editor-dialog-cancel cursor-pointer" onClick={() => setSettingsOpen(false)}>
              {tr.cancel}
            </Button>
            <Button variant="outline" className="editor-dialog-action cursor-pointer" onClick={handleSettingsSave} disabled={!canSave}>
              {tr.save}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
