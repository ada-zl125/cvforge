"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ChevronDown, FileDown, FileImage, FileJson, FileUp, Loader2, Settings, Sparkles } from "lucide-react";
import { exportResume, exportJson, type ExportFormat } from "@/lib/export";
import { withId, mergeDegreeField, stripDegreeField } from "@/lib/json-utils";
import { defaultAcademicCVContent } from "@/lib/defaults";
import academicCvExampleEn from "@/examples/academic-cv-example-en.json";
import academicCvExampleCn from "@/examples/academic-cv-example-cn.json";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { TITLE_MAX } from "@/lib/defaults";
import type { AcademicCVTemplate, ResumeLanguage, AcademicCVContent } from "@/lib/types/academic-cv";
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


interface ImportedAcademicState {
  title: string;
  template: AcademicCVTemplate;
  language: ResumeLanguage;
  content: AcademicCVContent;
}

interface ToolbarProps {
  title: string;
  template: AcademicCVTemplate;
  language: ResumeLanguage;
  content: AcademicCVContent;
  onSettingsChange: (title: string, language: ResumeLanguage, template: AcademicCVTemplate) => void;
  onImport: (state: ImportedAcademicState) => void;
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
      await exportResume(format, title || "academic-cv");
    } finally {
      setExporting(false);
    }
  }

  function handleLoadExample() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const raw: any = (language === "zh" ? academicCvExampleCn : academicCvExampleEn).content;
    const example = language === "zh" ? academicCvExampleCn : academicCvExampleEn;
    const merged: AcademicCVContent = {
      ...defaultAcademicCVContent,
      ...raw,
      personal: { ...defaultAcademicCVContent.personal, ...raw.personal },
      education: withId(raw.education).map((ed) => { const e = mergeDegreeField(ed, example.language); return { ...e, extraFields: withId(e.extraFields) }; }),
      researchExperience: withId(raw.researchExperience).map((e) => ({ ...e, descriptions: withId(e.descriptions ?? []) })),
      teachingExperience: withId(raw.teachingExperience ?? []).map((e) => ({ ...e, descriptions: withId(e.descriptions ?? []) })),
      industryExperience: withId(raw.industryExperience).map((e) => ({ ...e, descriptions: withId(e.descriptions ?? []) })),
      publications: withId(raw.publications),
      manuscriptsUnderReview: withId(raw.manuscriptsUnderReview),
      conferencePresentations: withId(raw.conferencePresentations),
      grantsAndAwards: withId(raw.grantsAndAwards ?? []),
      professionalService: withId(raw.professionalService),
      technicalSkills: withId(raw.technicalSkills),
      references: withId(raw.references),
    };
    onImport({ title: example.title, template: example.template as AcademicCVTemplate, language: example.language as ResumeLanguage, content: merged });
  }

  function handleExportJson() {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { photo: _photo, ...personal } = content.personal;
    exportJson({ _type: "cvforge-academic-cv", title, template, language, content: { ...content, personal, education: stripDegreeField(content.education) } }, title || "academic-cv");
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
          parsed._type !== "cvforge-academic-cv" ||
          typeof parsed.content !== "object" ||
          !parsed.content?.personal ||
          !Array.isArray(parsed.content?.sections)
        ) throw new Error("invalid");
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const raw: any = parsed.content;
        const merged: AcademicCVContent = {
          ...defaultAcademicCVContent,
          ...raw,
          personal: { ...defaultAcademicCVContent.personal, ...raw.personal },
          education: withId(raw.education).map((ed) => { const e = mergeDegreeField(ed, parsed.language); return { ...e, extraFields: withId(e.extraFields) }; }),
          researchExperience: withId(raw.researchExperience).map((e) => ({ ...e, descriptions: withId(e.descriptions ?? []) })),
          teachingExperience: withId(raw.teachingExperience ?? []).map((e) => ({ ...e, descriptions: withId(e.descriptions ?? []) })),
          industryExperience: withId(raw.industryExperience).map((e) => ({ ...e, descriptions: withId(e.descriptions ?? []) })),
          publications: withId(raw.publications),
          manuscriptsUnderReview: withId(raw.manuscriptsUnderReview),
          conferencePresentations: withId(raw.conferencePresentations),
          grantsAndAwards: withId(raw.grantsAndAwards),
          professionalService: withId(raw.professionalService),
          technicalSkills: withId(raw.technicalSkills),
          references: withId(raw.references),
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
          aria-label="Academic CV settings"
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
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted">
                <Sparkles className="h-4 w-4 text-foreground" />
              </div>
              <DialogTitle>{tr.loadExampleDialogTitle}</DialogTitle>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground text-justify leading-relaxed">
                {tr.loadExampleDialogDesc}
              </p>
              <p className="text-sm font-medium text-foreground">
                {tr.loadExampleDialogWarn}
              </p>
            </div>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" className="btn-hover-border cursor-pointer" onClick={() => setExampleDialogOpen(false)}>
              {tr.cancel}
            </Button>
            <Button
              variant="outline"
              className="btn-hover-primary cursor-pointer"
              onClick={() => { handleLoadExample(); setExampleDialogOpen(false); }}
            >
              {tr.loadExampleConfirm}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Settings Dialog */}
      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{tr.academicCv.editorSettings}</DialogTitle>
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
                {(["en", "zh"] as const).map((l) => (
                  <button
                    key={l}
                    type="button"
                    onClick={() => setDraftLanguage(l)}
                    className={`cursor-pointer rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                      draftLanguage === l
                        ? "border-foreground bg-foreground/5 text-foreground"
                        : "border-border text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                    }`}
                  >
                    {l === "en" ? tr.langEnglish : tr.langChinese}
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
