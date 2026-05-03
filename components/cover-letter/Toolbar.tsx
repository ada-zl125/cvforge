"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, ArrowLeft, ChevronDown, FileDown, FileImage, FileJson, FileUp, Loader2, Settings, Sparkles } from "lucide-react";
import { exportResume, exportJson, type ExportFormat } from "@/lib/export";
import { withId } from "@/lib/json-utils";
import { defaultCoverLetterContent, TITLE_MAX } from "@/lib/defaults";
import coverLetterExampleEn from "@/examples/cover-letter-example-en.json";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type {
  CoverLetterTemplate,
  CoverLetterContent,
  AddressLine,
  ParagraphItem,
} from "@/lib/types/cover-letter";
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

interface ImportedCoverLetterState {
  title: string;
  template: CoverLetterTemplate;
  content: CoverLetterContent;
}

interface ToolbarProps {
  title: string;
  content: CoverLetterContent;
  template: CoverLetterTemplate;
  onTitleChange: (title: string) => void;
  onImport: (state: ImportedCoverLetterState) => void;
}

export function Toolbar({ title, content, template, onTitleChange, onImport }: ToolbarProps) {
  const router = useRouter();
  const { lang } = useUILanguage();
  const tr = t[lang];

  const [exporting, setExporting] = useState(false);
  const [exampleDialogOpen, setExampleDialogOpen] = useState(false);
  const [importErrorOpen, setImportErrorOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleExport(format: ExportFormat) {
    setExporting(true);
    try {
      await exportResume(format, title || "cover-letter");
    } finally {
      setExporting(false);
    }
  }

  function handleLoadExample() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const raw: any = coverLetterExampleEn.content;
    const merged: CoverLetterContent = {
      ...defaultCoverLetterContent,
      ...raw,
      sender: {
        ...defaultCoverLetterContent.sender,
        ...raw.sender,
        addressLines: withId<AddressLine>(raw.sender?.addressLines ?? []),
      },
      recipient: {
        ...defaultCoverLetterContent.recipient,
        ...raw.recipient,
        addressLines: withId<AddressLine>(raw.recipient?.addressLines ?? []),
      },
      paragraphs: withId<ParagraphItem>(raw.paragraphs ?? []),
    };
    onImport({ title, template: coverLetterExampleEn.template as CoverLetterTemplate, content: merged });
    setExampleDialogOpen(false);
  }

  function handleExportJson() {
    exportJson({ _type: "cvforge-cover-letter", title, template, content }, title || "cover-letter");
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
          parsed._type !== "cvforge-cover-letter" ||
          typeof parsed.content !== "object" ||
          !parsed.content?.sender ||
          !Array.isArray(parsed.content?.paragraphs)
        ) throw new Error("invalid");
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const raw: any = parsed.content;
        const merged: CoverLetterContent = {
          ...defaultCoverLetterContent,
          ...raw,
          sender: {
            ...defaultCoverLetterContent.sender,
            ...raw.sender,
            addressLines: withId<AddressLine>(raw.sender?.addressLines ?? []),
          },
          recipient: {
            ...defaultCoverLetterContent.recipient,
            ...raw.recipient,
            addressLines: withId<AddressLine>(raw.recipient?.addressLines ?? []),
          },
          paragraphs: withId<ParagraphItem>(raw.paragraphs),
        };
        onImport({ title: parsed.title, template: parsed.template, content: merged });
      } catch {
        setImportErrorOpen(true);
      }
    };
    reader.readAsText(file);
  }

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [draftTitle, setDraftTitle] = useState(title);

  function openSettings() {
    setDraftTitle(title);
    setSettingsOpen(true);
  }

  const titleTooLong = draftTitle.length > TITLE_MAX;
  const canSave = draftTitle.trim().length > 0 && !titleTooLong;

  function handleSettingsSave() {
    if (!canSave) return;
    onTitleChange(draftTitle.trim());
    setSettingsOpen(false);
  }

  return (
    <>
      <input ref={fileInputRef} type="file" accept=".json" className="hidden" onChange={handleImportFile} />
      <header className="editor-toolbar relative z-20 flex h-14 shrink-0 items-center gap-3 border-b border-border bg-card px-4 transition-colors" data-toolbar>
        <Button
          variant="ghost"
          size="icon-sm"
          className="cursor-pointer"
          onClick={() => router.push("/")}
          aria-label={tr.backToHome}
        >
          <ArrowLeft className="size-4" />
        </Button>

        <span className="truncate text-sm font-medium text-foreground">{title}</span>

        <Button
          variant="ghost"
          size="icon-sm"
          className="cursor-pointer shrink-0 text-muted-foreground hover:text-foreground"
          onClick={openSettings}
          aria-label="Cover letter settings"
        >
          <Settings className="size-4" />
        </Button>

        {/* Language switcher — left of spacer */}
        <LanguageSwitcher />

        <div className="flex-1" />

        {/* Example button */}
        <Button
          className="btn-hover-border h-8 cursor-pointer gap-1.5 rounded-lg px-3 text-sm font-medium"
          variant="outline"
          onClick={() => setExampleDialogOpen(true)}
          title={tr.loadExample}
        >
          <Sparkles className="size-4" />
          <span className="hidden sm:inline">{tr.loadExample}</span>
        </Button>

        {/* Import dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              className="btn-hover-border h-8 cursor-pointer gap-1.5 rounded-lg px-3 text-sm font-medium"
              variant="outline"
              title={tr.importLabel}
            >
              <FileUp className="size-4" />
              <span className="hidden sm:inline">{tr.importLabel}</span>
              <ChevronDown className="size-3 opacity-60 hidden sm:inline" />
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
              title={exporting ? tr.exporting : tr.exportLabel}
            >
              {exporting
                ? <Loader2 className="size-4 animate-spin" />
                : <FileDown className="size-4" />}
              <span className="hidden sm:inline">{exporting ? tr.exporting : tr.exportLabel}</span>
              {!exporting && <ChevronDown className="size-3 opacity-60 hidden sm:inline" />}
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
              <p className="text-sm leading-relaxed text-gray-600">
                {tr.coverLetter.exampleAttributionPre}
                <span className="font-medium">MIT Career Advising &amp; Professional Development</span>
                {tr.coverLetter.exampleAttributionPost}
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
              onClick={handleLoadExample}
            >
              {tr.loadExampleConfirm}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Settings dialog */}
      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent className="editor-dialog overflow-hidden p-0 sm:max-w-[420px]">
          <DialogHeader className="editor-dialog-header px-5 pb-4 pt-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-black/40 bg-black/[0.035]">
                <Settings className="h-4 w-4 text-foreground" />
              </div>
              <DialogTitle className="text-[15px] font-semibold leading-tight">{tr.coverLetter.editorSettings}</DialogTitle>
            </div>
          </DialogHeader>

          <div className="grid gap-5 px-5 pb-5 pt-3">
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
