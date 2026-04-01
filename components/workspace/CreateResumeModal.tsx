"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { ResumeTemplate, ResumeLanguage } from "@/lib/types/resume";
import { useUILanguage } from "@/lib/ui-language";
import { t } from "@/lib/translations";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

/* ------------------------------------------------------------------ */
/*  Template options                                                    */
/* ------------------------------------------------------------------ */

const TEMPLATES: { value: ResumeTemplate; label: string; bg: string; text: string }[] = [
  { value: "general", label: "General", bg: "bg-blue-50", text: "text-blue-600" },
];

const LANGUAGES: { value: ResumeLanguage; label: string }[] = [
  { value: "en", label: "English" },
  { value: "zh", label: "Chinese" },
];

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

interface CreateResumeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateResumeModal({ open, onOpenChange }: CreateResumeModalProps) {
  const router = useRouter();
  const { lang } = useUILanguage();
  const tr = t[lang];
  const [title, setTitle] = useState("");
  const [template, setTemplate] = useState<ResumeTemplate>("general");
  const [language, setLanguage] = useState<ResumeLanguage>("en");
  const [loading, setLoading] = useState(false);

  const tooLong = title.length > 50;

  async function handleCreate() {
    const trimmed = title.trim();
    if (!trimmed || tooLong) return;

    setLoading(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase.from("resumes").insert({
        user_id: user.id,
        title: trimmed,
        template,
        language,
        content: {
          personal: { fullName: "", contacts: [] },
          sections: [],
          experience: [],
          education: [],
          skills: [],
          projects: [],
        },
      });

      if (!error) {
        onOpenChange(false);
        setTitle("");
        setTemplate("general");
        setLanguage("en");
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{tr.createNewResume}</DialogTitle>
          <DialogDescription>
            {tr.createNewResumeDesc}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          {/* Title input */}
          <div className="grid gap-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="resume-title">{tr.titleLabel}</Label>
              <span className={`text-xs ${tooLong ? "text-destructive" : "text-muted-foreground"}`}>
                {title.length}/50
              </span>
            </div>
            <Input
              id="resume-title"
              placeholder={tr.resumeTitlePlaceholder}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleCreate(); }}
              className={tooLong ? "border-destructive focus:border-destructive" : ""}
              autoFocus
            />
            {tooLong && (
              <p className="text-xs text-destructive">{tr.titleTooLong(50)}</p>
            )}
          </div>

          {/* Language picker */}
          <div className="grid gap-2">
            <Label>{tr.languageLabel}</Label>
            <div className="flex gap-2">
              {LANGUAGES.map((l) => {
                const active = language === l.value;
                const label = l.value === "en" ? tr.langEnglish : tr.langChinese;
                return (
                  <button
                    key={l.value}
                    type="button"
                    onClick={() => setLanguage(l.value)}
                    className={`cursor-pointer rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                      active
                        ? "border-foreground bg-foreground/5 text-foreground"
                        : "border-border text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Template picker */}
          <div className="grid gap-2">
            <Label>{tr.templateLabel}</Label>
            <div className="flex gap-2">
              {TEMPLATES.map((tmpl) => {
                const active = template === tmpl.value;
                return (
                  <button
                    key={tmpl.value}
                    type="button"
                    onClick={() => setTemplate(tmpl.value)}
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
          <Button variant="outline" className="btn-hover-border cursor-pointer" onClick={() => onOpenChange(false)}>
            {tr.cancel}
          </Button>
          <Button
            variant="outline"
            onClick={handleCreate}
            disabled={!title.trim() || tooLong || loading}
            className="btn-hover-primary cursor-pointer"
          >
            {loading ? tr.creating : tr.create}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
