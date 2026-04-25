"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, FileText, GraduationCap, Mail, Github, Star } from "lucide-react";
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

/* ---- Cover letter create dialog (English-only) ---- */

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

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="entry-create-dialog overflow-hidden p-0 sm:max-w-[420px]">
        <DialogHeader className="entry-create-dialog-header px-5 pb-4 pt-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-black/40 bg-black/[0.035]">
              <Mail className="h-4 w-4 text-black" />
            </div>
            <div className="min-w-0">
              <DialogTitle className="text-[15px] font-semibold leading-tight">{tr.createNewCoverLetter}</DialogTitle>
              <DialogDescription className="mt-1 leading-relaxed text-gray-600">{tr.createNewCoverLetterDesc}</DialogDescription>
            </div>
          </div>
        </DialogHeader>
        <div className="grid gap-5 px-5 py-5">
          <div className="grid gap-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="doc-title" className="text-sm font-medium">{tr.titleLabel}</Label>
              <span className={`text-xs ${titleTooLong ? "text-destructive" : "text-muted-foreground"}`}>
                {docTitle.length}/{TITLE_MAX}
              </span>
            </div>
            <Input
              id="doc-title"
              value={docTitle}
              onChange={(e) => setDocTitle(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && docTitle.trim()) onCreate(docTitle.trim()); }}
              placeholder={tr.coverLetterTitlePlaceholder}
              className={`entry-dialog-input h-10 ${titleTooLong ? "border-destructive" : ""}`}
              autoFocus
            />
            {titleTooLong && <p className="text-xs text-destructive">{tr.titleTooLong(TITLE_MAX)}</p>}
          </div>
          <div className="grid gap-2">
            <Label className="text-sm font-medium">{tr.languageLabel}</Label>
            <div className="flex gap-2">
              <span className="entry-dialog-language-active cursor-default rounded-lg px-3 py-2 text-sm font-medium">
                English
              </span>
            </div>
          </div>
        </div>
        <DialogFooter className="entry-create-dialog-footer">
          <Button variant="outline" className="entry-dialog-cancel cursor-pointer" onClick={() => onOpenChange(false)}>
            {tr.cancel}
          </Button>
          <Button variant="outline" className="entry-dialog-action cursor-pointer" onClick={() => canCreate && onCreate(docTitle.trim())} disabled={!canCreate}>
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

function CreateDialog({ open, onOpenChange, icon, title, description, placeholder, onCreate }: CreateDialogProps) {
  const { lang } = useUILanguage();
  const tr = t[lang];
  const [docTitle, setDocTitle] = useState("");
  const [docLang, setDocLang] = useState<ResumeLanguage>("en");
  const titleTooLong = docTitle.length > TITLE_MAX;
  const canCreate = docTitle.trim().length > 0 && !titleTooLong;

  function handleOpenChange(next: boolean) {
    if (next) { setDocTitle(""); setDocLang("en"); }
    onOpenChange(next);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="entry-create-dialog overflow-hidden p-0 sm:max-w-[420px]">
        <DialogHeader className="entry-create-dialog-header px-5 pb-4 pt-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-black/40 bg-black/[0.035]">
              {icon}
            </div>
            <div className="min-w-0">
              <DialogTitle className="text-[15px] font-semibold leading-tight">{title}</DialogTitle>
              <DialogDescription className="mt-1 leading-relaxed text-gray-600">{description}</DialogDescription>
            </div>
          </div>
        </DialogHeader>
        <div className="grid gap-5 px-5 py-5">
          <div className="grid gap-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="doc-title" className="text-sm font-medium">{tr.titleLabel}</Label>
              <span className={`text-xs ${titleTooLong ? "text-destructive" : "text-muted-foreground"}`}>
                {docTitle.length}/{TITLE_MAX}
              </span>
            </div>
            <Input
              id="doc-title"
              value={docTitle}
              onChange={(e) => setDocTitle(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && canCreate) onCreate(docTitle.trim(), docLang); }}
              placeholder={placeholder}
              className={`entry-dialog-input h-10 ${titleTooLong ? "border-destructive" : ""}`}
              autoFocus
            />
            {titleTooLong && <p className="text-xs text-destructive">{tr.titleTooLong(TITLE_MAX)}</p>}
          </div>
          <div className="grid gap-2">
            <Label className="text-sm font-medium">{tr.languageLabel}</Label>
            <div className="flex gap-2">
              {LANGUAGE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setDocLang(opt.value)}
                  className={`entry-dialog-language cursor-pointer rounded-lg px-3 py-2 text-sm font-medium ${
                    docLang === opt.value
                      ? "entry-dialog-language-active"
                      : "text-muted-foreground"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>
        <DialogFooter className="entry-create-dialog-footer">
          <Button variant="outline" className="entry-dialog-cancel cursor-pointer" onClick={() => onOpenChange(false)}>
            {tr.cancel}
          </Button>
          <Button variant="outline" className="entry-dialog-action cursor-pointer" onClick={() => canCreate && onCreate(docTitle.trim(), docLang)} disabled={!canCreate}>
            {tr.create}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ---- Entry page ---- */

const GITHUB_REPO = "ada-zl125/cvforge";
const GITHUB_URL = `https://github.com/${GITHUB_REPO}`;
const GITHUB_STARS_CACHE_KEY = "cvforge_github_stars";
const GITHUB_STARS_CACHE_TTL_MS = 60 * 60 * 1000;

interface GitHubStarsCache {
  count: number;
  fetchedAt: number;
}

function formatStars(n: number): string {
  if (n < 100) return String(n);

  const value = Math.floor(n / 100) / 10;
  return `${Number.isInteger(value) ? value.toFixed(0) : value.toFixed(1)}k`;
}

function readCachedStars(now: number): number | null {
  try {
    const raw = localStorage.getItem(GITHUB_STARS_CACHE_KEY);
    if (!raw) return null;

    const cached = JSON.parse(raw) as Partial<GitHubStarsCache>;
    if (
      typeof cached.count !== "number" ||
      typeof cached.fetchedAt !== "number" ||
      now - cached.fetchedAt > GITHUB_STARS_CACHE_TTL_MS
    ) return null;

    return cached.count;
  } catch {
    return null;
  }
}

export default function EntryPage() {
  const router = useRouter();
  const { lang } = useUILanguage();
  const tr = t[lang];

  const [resumeOpen, setResumeOpen] = useState(false);
  const [academicOpen, setAcademicOpen] = useState(false);
  const [coverLetterOpen, setCoverLetterOpen] = useState(false);
  const [stars, setStars] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;

    queueMicrotask(() => {
      const cached = readCachedStars(Date.now());
      if (cancelled) return;

      if (cached !== null) {
        setStars(cached);
        return;
      }

      fetch(`https://api.github.com/repos/${GITHUB_REPO}`)
        .then((r) => r.json())
        .then((d) => {
          if (cancelled || typeof d.stargazers_count !== "number") return;
          setStars(d.stargazers_count);
          localStorage.setItem(
            GITHUB_STARS_CACHE_KEY,
            JSON.stringify({ count: d.stargazers_count, fetchedAt: Date.now() })
          );
        })
        .catch(() => {});
    });

    return () => {
      cancelled = true;
    };
  }, []);

  const template: ResumeTemplate = "general";

  function handleCreateResume(title: string, resumeLang: ResumeLanguage) {
    try {
      localStorage.setItem(RESUME_STORAGE_KEY, JSON.stringify({ title, template, language: resumeLang, content: defaultResumeContent }));
    } catch { /* ignore quota errors */ }
    router.push("/editor");
  }

  function handleCreateAcademicCv(title: string, cvLang: ResumeLanguage) {
    try {
      localStorage.setItem(ACADEMIC_CV_STORAGE_KEY, JSON.stringify({ title, template, language: cvLang, content: defaultResumeContent }));
    } catch { /* ignore quota errors */ }
    router.push("/academic-cv");
  }

  function handleCreateCoverLetter(title: string) {
    try {
      localStorage.setItem(COVER_LETTER_STORAGE_KEY, JSON.stringify({ title, template: "classic", content: defaultCoverLetterContent }));
    } catch { /* ignore quota errors */ }
    router.push("/cover-letter");
  }

  const entryItems = [
    { num: "01", title: tr.createCv,         desc: tr.entryResumeDesc,       onClick: () => setResumeOpen(true) },
    { num: "02", title: tr.createAcademicCv,  desc: tr.entryAcademicDesc,     onClick: () => setAcademicOpen(true) },
    { num: "03", title: tr.createCoverLetter, desc: tr.entryCoverLetterDesc,  onClick: () => setCoverLetterOpen(true) },
  ];

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-white">
      {/* Header */}
      <header className="relative z-10 flex items-center justify-between px-8 py-5 lg:px-12">
        <Link href="/" className="inline-flex items-center bg-transparent" aria-label="CVForge home">
          <Image
            src="/logo-text-horizontal.png"
            alt="CVForge"
            width={1262}
            height={329}
            priority
            className="h-8 w-auto bg-transparent object-contain"
          />
        </Link>
        <div className="flex items-center gap-3">
          <LanguageSwitcher />
          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 rounded-md border border-gray-300 px-2.5 py-1 text-xs text-gray-600 transition-colors hover:border-gray-500 hover:text-gray-900"
          >
            <Github className="h-3.5 w-3.5" />
            <span className="flex items-center gap-1 tabular-nums">
              <Star className="h-3 w-3 fill-current" />
              {stars !== null ? formatStars(stars) : "—"}
            </span>
          </a>
        </div>
      </header>

      {/* Main */}
      <main className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 py-12 lg:py-16">
        <div className="w-full max-w-xl">

          {/* Hero */}
          <div className="mb-14 text-center">
            <h1 className="text-4xl font-bold leading-[1.1] tracking-tight text-[#0f0f0f] lg:text-5xl">
              {tr.heroTitle}
            </h1>
            <p className="mt-4 text-[15px] leading-relaxed text-gray-700">
              {tr.heroSubtitle}
            </p>
            <a
              href={GITHUB_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-5 inline-flex items-center gap-2 rounded-full border border-gray-300 px-4 py-1.5 text-sm text-gray-600 transition-colors hover:border-gray-500 hover:text-gray-900"
            >
              <Github className="h-4 w-4" />
              <span>GitHub</span>
              <Star className="h-3.5 w-3.5 fill-current" />
              {stars !== null ? (
                <span className="tabular-nums font-medium">{formatStars(stars)}</span>
              ) : (
                <span className="text-gray-300">—</span>
              )}
            </a>
          </div>

          {/* Entry items */}
          <div className="border-t border-gray-100">
            <div className="ml-2 divide-y divide-gray-100">
              {entryItems.map((item) => (
                <button
                  key={item.num}
                  type="button"
                  onClick={item.onClick}
                  className="group flex w-full cursor-pointer items-center gap-5 border-l-2 border-l-transparent px-3 py-5 text-left transition-colors duration-200 hover:border-l-[#0f0f0f] hover:bg-gray-50/72"
                >
                  <span className="w-7 shrink-0 text-sm tabular-nums text-gray-500 transition-colors duration-200 group-hover:text-gray-700">
                    {item.num}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="text-[15px] font-semibold text-gray-900">{item.title}</div>
                    <div className="mt-0.5 truncate whitespace-nowrap text-sm text-gray-600">{item.desc}</div>
                  </div>
                  <ArrowRight className="h-4 w-4 shrink-0 -translate-x-5 text-gray-400 transition-all duration-300 ease-in-out group-hover:translate-x-0 group-hover:text-gray-800" />
                </button>
              ))}
            </div>
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 px-8 pb-7 pt-2 lg:px-12">
        <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
          <span className="text-xs text-gray-400">{tr.footer}</span>
          <span className="select-none text-xs text-gray-200">·</span>
          <Link href="/privacy" className="text-xs text-gray-400 transition-colors hover:text-gray-700">
            {tr.privacyPolicy}
          </Link>
          <span className="select-none text-xs text-gray-200">·</span>
          <Link href="/terms" className="text-xs text-gray-400 transition-colors hover:text-gray-700">
            {tr.termsOfService}
          </Link>
        </div>
      </footer>

      {/* Dialogs */}
      <CreateDialog
        open={resumeOpen}
        onOpenChange={setResumeOpen}
        icon={<FileText className="h-4 w-4 text-black" />}
        title={tr.createNewResume}
        description={tr.createNewResumeDesc}
        placeholder={tr.resumeTitlePlaceholder}
        onCreate={handleCreateResume}
      />
      <CreateDialog
        open={academicOpen}
        onOpenChange={setAcademicOpen}
        icon={<GraduationCap className="h-4 w-4 text-black" />}
        title={tr.createNewAcademicCv}
        description={tr.createNewAcademicCvDesc}
        placeholder={tr.academicCvTitlePlaceholder}
        onCreate={handleCreateAcademicCv}
      />
      <CreateCoverLetterDialog
        open={coverLetterOpen}
        onOpenChange={setCoverLetterOpen}
        onCreate={handleCreateCoverLetter}
      />
    </div>
  );
}
