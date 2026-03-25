"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { ResumeTemplate } from "@/lib/types/resume";
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

const TEMPLATES: { value: ResumeTemplate; label: string; color: string }[] = [
  { value: "classic",      label: "Classic",      color: "bg-blue-500" },
  { value: "modern",       label: "Modern",       color: "bg-violet-500" },
  { value: "minimal",      label: "Minimal",      color: "bg-emerald-500" },
  { value: "creative",     label: "Creative",     color: "bg-amber-500" },
  { value: "professional", label: "Professional", color: "bg-indigo-500" },
  { value: "academic",     label: "Academic",     color: "bg-teal-500" },
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
  const [title, setTitle] = useState("");
  const [template, setTemplate] = useState<ResumeTemplate>("classic");
  const [loading, setLoading] = useState(false);

  async function handleCreate() {
    const trimmed = title.trim();
    if (!trimmed) return;

    setLoading(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase.from("resumes").insert({
        user_id: user.id,
        title: trimmed,
        template,
        content: {
          personal: { fullName: "", email: "", phone: "", location: "", website: "", linkedin: "", summary: "" },
          experience: [],
          education: [],
          skills: [],
          projects: [],
        },
      });

      if (!error) {
        onOpenChange(false);
        setTitle("");
        setTemplate("classic");
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
          <DialogTitle>Create New Resume</DialogTitle>
          <DialogDescription>
            Give your resume a title and pick a template.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          {/* Title input */}
          <div className="grid gap-2">
            <Label htmlFor="resume-title">Title</Label>
            <Input
              id="resume-title"
              placeholder="e.g. Software Engineer Resume"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleCreate(); }}
              autoFocus
            />
          </div>

          {/* Template picker */}
          <div className="grid gap-2">
            <Label>Template</Label>
            <div className="grid grid-cols-3 gap-2">
              {TEMPLATES.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setTemplate(t.value)}
                  className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors ${
                    template === t.value
                      ? "border-foreground/20 bg-muted font-medium"
                      : "border-border hover:bg-muted/50"
                  }`}
                >
                  <span className={`size-2.5 shrink-0 rounded-full ${t.color}`} />
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            onClick={handleCreate}
            disabled={!title.trim() || loading}
            className="cursor-pointer"
          >
            {loading ? "Creating..." : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
