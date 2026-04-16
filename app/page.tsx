"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FilePlus, GraduationCap, FileText, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { LanguageSwitcher } from "@/components/ui/language-switcher";
import { useUILanguage } from "@/lib/ui-language";
import { t } from "@/lib/translations";
import {
  defaultResumeContent,
  defaultCoverLetterContent,
  RESUME_STORAGE_KEY,
  ACADEMIC_CV_STORAGE_KEY,
  COVER_LETTER_STORAGE_KEY,
  TITLE_MAX,
} from "@/lib/defaults";
import type { ResumeTemplate, ResumeLanguage } from "@/lib/types/resume";

const LANGUAGE_OPTIONS: { value: ResumeLanguage; label: string }[] = [
  { value: "en", label: "English" },
  { value: "zh", label: "中文" },
];

/* ---- Cover letter create dialog (English-only, no language picker) ---- */

interface CreateCoverLetterDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (title: string) => void;
}

function CreateCoverLetterDialog({ open, onOpenChange, onCreate }: CreateCoverLetterDialogProps) {
  const { lang } = useUILanguage();
  const tr = t[lang];

  const [docTitle, setDocTitle] = useState("");
  const titleTooLong = docTitle.length > TITLE_MAX;
  const canCreate = docTitle.trim().length > 0 && !titleTooLong;

  function handleOpenChange(next: boolean) {
    if (next) setDocTitle("");
    onOpenChange(next);
  }

  function handleCreate() {
    if (!canCreate) return;
    onCreate(docTitle.trim());
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <Mail className="h-4 w-4 text-primary" />
            </div>
            <div>
              <DialogTitle>{tr.createNewCoverLetter}</DialogTitle>
              <DialogDescription className="mt-0.5">{tr.createNewCoverLetterDesc}</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="grid gap-4 py-1">
          <div className="grid gap-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="doc-title">{tr.titleLabel}</Label>
              <span className={`text-xs ${titleTooLong ? "text-destructive" : "text-muted-foreground"}`}>
                {docTitle.length}/{TITLE_MAX}
              </span>
            </div>
            <Input
              id="doc-title"
              value={docTitle}
              onChange={(e) => setDocTitle(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleCreate(); }}
              placeholder={tr.coverLetterTitlePlaceholder}
              className={titleTooLong ? "border-destructive" : ""}
              autoFocus
            />
            {titleTooLong && (
              <p className="text-xs text-destructive">{tr.titleTooLong(TITLE_MAX)}</p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" className="btn-hover-border cursor-pointer" onClick={() => onOpenChange(false)}>
            {tr.cancel}
          </Button>
          <Button
            variant="outline"
            className="btn-hover-primary cursor-pointer"
            onClick={handleCreate}
            disabled={!canCreate}
          >
            {tr.create}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ---- Shared create dialog ---- */

interface CreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  icon: React.ReactNode;
  title: string;
  description: string;
  placeholder: string;
  onCreate: (title: string, lang: ResumeLanguage) => void;
}

function CreateDialog({
  open,
  onOpenChange,
  icon,
  title,
  description,
  placeholder,
  onCreate,
}: CreateDialogProps) {
  const { lang } = useUILanguage();
  const tr = t[lang];

  const [docTitle, setDocTitle] = useState("");
  const [docLang, setDocLang] = useState<ResumeLanguage>("en");

  const titleTooLong = docTitle.length > TITLE_MAX;
  const canCreate = docTitle.trim().length > 0 && !titleTooLong;

  function handleOpenChange(next: boolean) {
    if (next) {
      setDocTitle("");
      setDocLang("en");
    }
    onOpenChange(next);
  }

  function handleCreate() {
    if (!canCreate) return;
    onCreate(docTitle.trim(), docLang);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              {icon}
            </div>
            <div>
              <DialogTitle>{title}</DialogTitle>
              <DialogDescription className="mt-0.5">{description}</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="grid gap-4 py-1">
          {/* Title */}
          <div className="grid gap-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="doc-title">{tr.titleLabel}</Label>
              <span className={`text-xs ${titleTooLong ? "text-destructive" : "text-muted-foreground"}`}>
                {docTitle.length}/{TITLE_MAX}
              </span>
            </div>
            <Input
              id="doc-title"
              value={docTitle}
              onChange={(e) => setDocTitle(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleCreate(); }}
              placeholder={placeholder}
              className={titleTooLong ? "border-destructive" : ""}
              autoFocus
            />
            {titleTooLong && (
              <p className="text-xs text-destructive">{tr.titleTooLong(TITLE_MAX)}</p>
            )}
          </div>

          {/* Language */}
          <div className="grid gap-2">
            <Label>{tr.languageLabel}</Label>
            <div className="flex gap-2">
              {LANGUAGE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setDocLang(opt.value)}
                  className={`cursor-pointer rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                    docLang === opt.value
                      ? "border-foreground bg-foreground/5 text-foreground"
                      : "border-border text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" className="btn-hover-border cursor-pointer" onClick={() => onOpenChange(false)}>
            {tr.cancel}
          </Button>
          <Button
            variant="outline"
            className="btn-hover-primary cursor-pointer"
            onClick={handleCreate}
            disabled={!canCreate}
          >
            {tr.create}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ---- Entry page ---- */

export default function EntryPage() {
  const router = useRouter();
  const { lang } = useUILanguage();
  const tr = t[lang];

  const [resumeOpen, setResumeOpen] = useState(false);
  const [academicOpen, setAcademicOpen] = useState(false);
  const [coverLetterOpen, setCoverLetterOpen] = useState(false);

  const template: ResumeTemplate = "general";

  function handleCreateResume(title: string, resumeLang: ResumeLanguage) {
    try {
      localStorage.setItem(
        RESUME_STORAGE_KEY,
        JSON.stringify({ title, template, language: resumeLang, content: defaultResumeContent }),
      );
    } catch { /* ignore quota errors */ }
    router.push("/editor");
  }

  function handleCreateAcademicCv(title: string, cvLang: ResumeLanguage) {
    try {
      localStorage.setItem(
        ACADEMIC_CV_STORAGE_KEY,
        JSON.stringify({ title, template, language: cvLang, content: defaultResumeContent }),
      );
    } catch { /* ignore quota errors */ }
    router.push("/academic-cv");
  }

  function handleCreateCoverLetter(title: string) {
    try {
      localStorage.setItem(
        COVER_LETTER_STORAGE_KEY,
        JSON.stringify({ title, template: "classic", content: defaultCoverLetterContent }),
      );
    } catch { /* ignore quota errors */ }
    router.push("/cover-letter");
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Navbar */}
      <header className="flex h-14 items-center justify-between border-b border-border px-6">
        <span className="text-base font-semibold tracking-tight">
          Easy<span className="text-primary">CV</span>
        </span>
        <LanguageSwitcher />
      </header>

      {/* Main */}
      <main className="flex flex-1 flex-col items-center justify-center px-6 py-16">
        <div className="w-full max-w-2xl space-y-10">
          {/* Page heading */}
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight">{tr.appTagline}</h1>
            <p className="text-sm text-muted-foreground">{tr.createCvDesc}</p>
          </div>

          {/* Tool grid */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {/* Resume card */}
            <button
              type="button"
              onClick={() => setResumeOpen(true)}
              className="group flex flex-col gap-4 rounded-xl border border-border bg-card p-6 text-left transition-all duration-200 hover:border-primary/40 hover:shadow-md hover:shadow-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 transition-colors group-hover:bg-primary/15">
                <FilePlus className="h-5 w-5 text-primary" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium">{tr.createCv}</p>
                <p className="text-xs text-muted-foreground leading-relaxed">{tr.createCvDesc}</p>
              </div>
            </button>

            {/* Academic CV card */}
            <button
              type="button"
              onClick={() => setAcademicOpen(true)}
              className="group flex flex-col gap-4 rounded-xl border border-border bg-card p-6 text-left transition-all duration-200 hover:border-primary/40 hover:shadow-md hover:shadow-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 transition-colors group-hover:bg-primary/15">
                <GraduationCap className="h-5 w-5 text-primary" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium">{tr.createAcademicCv}</p>
                <p className="text-xs text-muted-foreground leading-relaxed">{tr.createAcademicCvDesc}</p>
              </div>
            </button>

            {/* Cover Letter card */}
            <button
              type="button"
              onClick={() => setCoverLetterOpen(true)}
              className="group flex flex-col gap-4 rounded-xl border border-border bg-card p-6 text-left transition-all duration-200 hover:border-primary/40 hover:shadow-md hover:shadow-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 transition-colors group-hover:bg-primary/15">
                <Mail className="h-5 w-5 text-primary" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium">{tr.createCoverLetter}</p>
                <p className="text-xs text-muted-foreground leading-relaxed">{tr.createCoverLetterDesc}</p>
              </div>
            </button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border">
        <div className="flex h-12 items-center justify-center gap-3 px-6">
          <span className="text-xs text-muted-foreground">{tr.footer}</span>
          <span className="text-muted-foreground/40 text-xs">·</span>
          <Link href="/privacy" className="text-xs text-muted-foreground transition-colors hover:text-foreground">
            {tr.privacyPolicy}
          </Link>
          <span className="text-muted-foreground/40 text-xs">·</span>
          <Link href="/terms" className="text-xs text-muted-foreground transition-colors hover:text-foreground">
            {tr.termsOfService}
          </Link>
        </div>
      </footer>

      {/* Create Resume dialog */}
      <CreateDialog
        open={resumeOpen}
        onOpenChange={setResumeOpen}
        icon={<FileText className="h-4 w-4 text-primary" />}
        title={tr.createNewResume}
        description={tr.createNewResumeDesc}
        placeholder={tr.resumeTitlePlaceholder}
        onCreate={handleCreateResume}
      />

      {/* Create Academic CV dialog */}
      <CreateDialog
        open={academicOpen}
        onOpenChange={setAcademicOpen}
        icon={<GraduationCap className="h-4 w-4 text-primary" />}
        title={tr.createNewAcademicCv}
        description={tr.createNewAcademicCvDesc}
        placeholder={tr.academicCvTitlePlaceholder}
        onCreate={handleCreateAcademicCv}
      />

      {/* Create Cover Letter dialog */}
      <CreateCoverLetterDialog
        open={coverLetterOpen}
        onOpenChange={setCoverLetterOpen}
        onCreate={handleCreateCoverLetter}
      />
    </div>
  );
}
