"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, FileDown, FileImage, FileJson, FileUp, Loader2, PenLine, RotateCcw, Settings, Sparkles, WandSparkles } from "lucide-react";
import { exportDocument, exportJson, type ExportFormat } from "@/lib/export";
import { defaultAcademicCVContent, TITLE_MAX } from "@/lib/defaults";
import { createAcademicCVExportPayload, normalizeAcademicCVContent } from "@/lib/document-normalizers";
import academicCvExampleEn from "@/examples/academic-cv-example-en.json";
import academicCvExampleCn from "@/examples/academic-cv-example-cn.json";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type {
  AcademicCVTemplate,
  ResumeLanguage,
  AcademicCVContent,
} from "@/lib/types/academic-cv";
import { Button } from "@/components/ui/button";
import {
  EditorTopBar,
  editorTopBarActionClass,
  editorTopBarPrimaryActionClass,
} from "@/components/shared/EditorTopBar";
import { ExportErrorDialog } from "@/components/shared/ExportErrorDialog";
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
  isAgentMode: boolean;
  onSettingsChange: (title: string, language: ResumeLanguage, template: AcademicCVTemplate) => void;
  onImport: (state: ImportedAcademicState) => void;
  onModeToggle: () => void;
}

export function Toolbar({ title, template, language, content, isAgentMode, onSettingsChange, onImport, onModeToggle }: ToolbarProps) {
  const router = useRouter();
  const { lang } = useUILanguage();
  const tr = t[lang];

  /* ---- Export state ---- */
  const [exporting, setExporting] = useState(false);
  const [exportErrorOpen, setExportErrorOpen] = useState(false);
  const [exampleDialogOpen, setExampleDialogOpen] = useState(false);
  const [importErrorOpen, setImportErrorOpen] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleExport(format: ExportFormat) {
    setExporting(true);
    try {
      await exportDocument({
        format,
        filename: title || "academic-cv",
        kind: "academic-cv",
        content,
        language,
      });
    } catch {
      setExportErrorOpen(true);
    } finally {
      setExporting(false);
    }
  }

  function handleLoadExample() {
    const example = language === "zh" ? academicCvExampleCn : academicCvExampleEn;
    const exampleLanguage = example.language as ResumeLanguage;
    onImport({
      title,
      template: example.template as AcademicCVTemplate,
      language: exampleLanguage,
      content: normalizeAcademicCVContent(example.content, exampleLanguage),
    });
  }

  function handleExportJson() {
    exportJson(
      createAcademicCVExportPayload({ title, template, language, content }),
      title || "academic-cv"
    );
  }

  function handleReset() {
    onImport({ title, template, language, content: defaultAcademicCVContent });
    setResetOpen(false);
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
        onImport({
          title: parsed.title,
          template: parsed.template,
          language: parsed.language,
          content: normalizeAcademicCVContent(parsed.content, parsed.language),
        });
      } catch {
        setImportErrorOpen(true);
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
      <EditorTopBar
        title={title}
        eyebrow={tr.createAcademicCv}
        backLabel={tr.backToHome}
        settingsLabel={tr.academicCv.editorSettings}
        onBack={() => router.push("/")}
        onSettings={openSettings}
        afterSettingsActions={
          <Button
            variant="ghost"
            size="icon"
            onClick={onModeToggle}
            className={`${editorTopBarActionClass} agent-mode-toggle-button ${isAgentMode ? "agent-mode-toggle-button-active" : ""}`}
            title={isAgentMode ? tr.agent.switchToEditMode : tr.agent.switchToAgentMode}
            aria-label={isAgentMode ? tr.agent.switchToEditMode : tr.agent.switchToAgentMode}
          >
            {isAgentMode ? <PenLine className="size-4" /> : <WandSparkles className="size-4" />}
          </Button>
        }
        language={<LanguageSwitcher />}
        postLanguageActions={
          <Button
            className={editorTopBarActionClass}
            variant="outline"
            onClick={() => setResetOpen(true)}
            title={tr.resetBtn}
            aria-label={tr.resetBtn}
          >
            <RotateCcw className="size-4" />
          </Button>
        }
        actions={
          <>
            <Button
              className={editorTopBarActionClass}
              variant="outline"
              onClick={() => setExampleDialogOpen(true)}
              title={tr.loadExample}
              aria-label={tr.loadExample}
            >
              <Sparkles className="size-4" />
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  className={editorTopBarActionClass}
                  variant="outline"
                  title={tr.importLabel}
                  aria-label={tr.importLabel}
                >
                  <FileUp className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-44">
                <DropdownMenuItem className="cursor-pointer gap-2" onClick={() => fileInputRef.current?.click()}>
                  <FileUp className="size-4 text-muted-foreground" />
                  {tr.importJson}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  className={editorTopBarPrimaryActionClass}
                  variant="outline"
                  disabled={exporting}
                  title={exporting ? tr.exporting : tr.exportLabel}
                  aria-label={exporting ? tr.exporting : tr.exportLabel}
                >
                  {exporting
                    ? <Loader2 className="size-4 animate-spin" />
                    : <FileDown className="size-4" />}
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
          </>
        }
      />

      <ExportErrorDialog open={exportErrorOpen} onOpenChange={setExportErrorOpen} />

      {/* Import error dialog */}
      <Dialog open={importErrorOpen} onOpenChange={setImportErrorOpen}>
        <DialogContent className="editor-dialog overflow-hidden p-0 sm:max-w-[420px]">
          <DialogHeader className="editor-dialog-header px-5 pb-4 pt-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-black/40 bg-black/[0.035]">
                <AlertTriangle className="h-4 w-4 text-foreground" />
              </div>
              <DialogTitle className="text-[15px] font-semibold leading-tight">{tr.importJsonErrorTitle}</DialogTitle>
            </div>
            <div className="px-0 pt-1">
              <p className="text-sm leading-relaxed text-gray-600">{tr.importJsonError}</p>
            </div>
          </DialogHeader>
          <DialogFooter className="editor-dialog-footer">
            <Button variant="outline" className="editor-dialog-action cursor-pointer" onClick={() => setImportErrorOpen(false)}>
              {tr.close}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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

      {/* Reset confirmation dialog */}
      <Dialog open={resetOpen} onOpenChange={setResetOpen}>
        <DialogContent className="editor-dialog overflow-hidden p-0 sm:max-w-[420px]">
          <DialogHeader className="editor-dialog-header px-5 pb-4 pt-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-black/40 bg-black/[0.035]">
                <RotateCcw className="h-4 w-4 text-foreground" />
              </div>
              <DialogTitle className="text-[15px] font-semibold leading-tight">{tr.resetTitle}</DialogTitle>
            </div>
            <div className="px-0 pt-1">
              <p className="text-sm leading-relaxed text-gray-600">{tr.resetDesc}</p>
            </div>
          </DialogHeader>
          <DialogFooter className="editor-dialog-footer">
            <Button variant="outline" className="editor-dialog-cancel cursor-pointer" onClick={() => setResetOpen(false)}>
              {tr.cancel}
            </Button>
            <Button variant="outline" className="editor-dialog-soft-action cursor-pointer" onClick={handleReset}>
              {tr.resetConfirm}
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
              <DialogTitle className="text-[15px] font-semibold leading-tight">{tr.academicCv.editorSettings}</DialogTitle>
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
                {(["en", "zh"] as const).map((l) => (
                  <button
                    key={l}
                    type="button"
                    onClick={() => setDraftLanguage(l)}
                    className={`editor-dialog-language cursor-pointer rounded-lg px-3 py-2 text-sm font-medium ${
                      draftLanguage === l
                        ? "editor-dialog-language-active"
                        : "text-muted-foreground"
                    }`}
                  >
                    {l === "en" ? tr.langEnglish : tr.langChinese}
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
