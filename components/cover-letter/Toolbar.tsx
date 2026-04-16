"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ChevronDown, FileDown, FileImage, Loader2, Settings } from "lucide-react";
import { exportResume, type ExportFormat } from "@/lib/export";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { TITLE_MAX } from "@/lib/defaults";
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

interface ToolbarProps {
  title: string;
  onTitleChange: (title: string) => void;
}

export function Toolbar({ title, onTitleChange }: ToolbarProps) {
  const router = useRouter();
  const { lang } = useUILanguage();
  const tr = t[lang];

  const [exporting, setExporting] = useState(false);

  async function handleExport(format: ExportFormat) {
    setExporting(true);
    try {
      await exportResume(format, title || "cover-letter");
    } finally {
      setExporting(false);
    }
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
      <header className="editor-toolbar flex h-14 shrink-0 items-center gap-3 border-b border-border bg-card px-4">
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

        <div className="flex-1" />

        <LanguageSwitcher />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              className="btn-hover-primary h-8 cursor-pointer gap-1.5 rounded-lg px-3 text-sm font-medium"
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
          <DropdownMenuContent align="end">
            <DropdownMenuItem className="cursor-pointer gap-2" onClick={() => handleExport("pdf")}>
              <FileDown className="size-4 text-muted-foreground" />
              {tr.exportPdf}
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer gap-2" onClick={() => handleExport("png")}>
              <FileImage className="size-4 text-muted-foreground" />
              {tr.exportPng}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </header>

      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{tr.coverLetter.editorSettings}</DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-2">
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
