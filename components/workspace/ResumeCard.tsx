"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Copy, Trash2, MoreVertical, Type } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { ResumeRow, ResumeTemplate } from "@/lib/types/resume";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardAction,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/* ------------------------------------------------------------------ */
/*  Template colour mapping                                            */
/* ------------------------------------------------------------------ */

const TEMPLATE_COLORS: Record<ResumeTemplate, { bar: string; bg: string; text: string }> = {
  classic:      { bar: "bg-blue-500",   bg: "bg-blue-50",   text: "text-blue-600" },
  modern:       { bar: "bg-violet-500", bg: "bg-violet-50", text: "text-violet-600" },
  minimal:      { bar: "bg-emerald-500",bg: "bg-emerald-50",text: "text-emerald-600" },
  creative:     { bar: "bg-amber-500",  bg: "bg-amber-50",  text: "text-amber-600" },
  professional: { bar: "bg-indigo-500", bg: "bg-indigo-50", text: "text-indigo-600" },
  academic:     { bar: "bg-teal-500",   bg: "bg-teal-50",   text: "text-teal-600" },
};

const TEMPLATE_LABELS: Record<ResumeTemplate, string> = {
  classic: "Classic",
  modern: "Modern",
  minimal: "Minimal",
  creative: "Creative",
  professional: "Professional",
  academic: "Academic",
};

/* ------------------------------------------------------------------ */
/*  Relative time helper                                               */
/* ------------------------------------------------------------------ */

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

/* ------------------------------------------------------------------ */
/*  ResumeCard                                                         */
/* ------------------------------------------------------------------ */

interface ResumeCardProps {
  resume: ResumeRow;
}

export function ResumeCard({ resume }: ResumeCardProps) {
  const router = useRouter();
  const colors = TEMPLATE_COLORS[resume.template] ?? TEMPLATE_COLORS.classic;
  const label = TEMPLATE_LABELS[resume.template] ?? "Classic";

  const [renameOpen, setRenameOpen] = useState(false);
  const [renameValue, setRenameValue] = useState(resume.title);
  const [renameLoading, setRenameLoading] = useState(false);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  /* ---- Rename ---- */
  async function handleRename() {
    const trimmed = renameValue.trim();
    if (!trimmed || trimmed === resume.title) {
      setRenameOpen(false);
      return;
    }
    setRenameLoading(true);
    try {
      const supabase = createClient();
      await supabase.from("resumes").update({ title: trimmed }).eq("id", resume.id);
      setRenameOpen(false);
      router.refresh();
    } finally {
      setRenameLoading(false);
    }
  }

  /* ---- Duplicate ---- */
  async function handleDuplicate() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from("resumes").insert({
      user_id: user.id,
      title: `${resume.title} (Copy)`,
      template: resume.template,
      content: resume.content,
    });
    router.refresh();
  }

  /* ---- Delete ---- */
  async function handleDelete() {
    setDeleteLoading(true);
    try {
      const supabase = createClient();
      await supabase.from("resumes").delete().eq("id", resume.id);
      setDeleteOpen(false);
      router.refresh();
    } finally {
      setDeleteLoading(false);
    }
  }

  return (
    <>
      <Card
        className="group relative cursor-pointer overflow-hidden p-0 transition-shadow hover:shadow-md"
        onClick={() => router.push(`/editor/${resume.id}`)}
      >
        {/* Coloured top bar */}
        <div className={`h-1 w-full ${colors.bar}`} />

        <CardHeader className="px-4 pt-3 pb-3">
          {/* Template badge */}
          <CardDescription>
            <span
              className={`inline-flex items-center rounded px-1.5 py-0.5 text-[11px] font-medium ${colors.bg} ${colors.text}`}
            >
              {label}
            </span>
          </CardDescription>

          <CardTitle className="truncate">{resume.title}</CardTitle>

          <CardDescription>Edited {timeAgo(resume.updated_at)}</CardDescription>

          {/* Actions dropdown */}
          <CardAction>
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    className="cursor-pointer opacity-0 transition-opacity group-hover:opacity-100"
                    onClick={(e) => e.stopPropagation()}
                  />
                }
              >
                <MoreVertical className="size-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent side="bottom" align="end" sideOffset={4}>
                <DropdownMenuItem
                  className="cursor-pointer"
                  onClick={(e) => { e.stopPropagation(); router.push(`/editor/${resume.id}`); }}
                >
                  <Pencil className="size-4" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    setRenameValue(resume.title);
                    setRenameOpen(true);
                  }}
                >
                  <Type className="size-4" />
                  Rename
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="cursor-pointer"
                  onClick={(e) => { e.stopPropagation(); handleDuplicate(); }}
                >
                  <Copy className="size-4" />
                  Duplicate
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="cursor-pointer"
                  variant="destructive"
                  onClick={(e) => { e.stopPropagation(); setDeleteOpen(true); }}
                >
                  <Trash2 className="size-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </CardAction>
        </CardHeader>
      </Card>

      {/* Rename dialog */}
      <Dialog open={renameOpen} onOpenChange={setRenameOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Rename Resume</DialogTitle>
            <DialogDescription>Enter a new title for your resume.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-2 py-2">
            <Label htmlFor={`rename-${resume.id}`}>Title</Label>
            <Input
              id={`rename-${resume.id}`}
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleRename(); }}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button
              onClick={handleRename}
              disabled={!renameValue.trim() || renameLoading}
              className="cursor-pointer"
            >
              {renameLoading ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent size="sm">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete resume?</AlertDialogTitle>
            <AlertDialogDescription>
              &ldquo;{resume.title}&rdquo; will be permanently deleted. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="cursor-pointer">Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="cursor-pointer bg-destructive text-white hover:bg-destructive/90"
              onClick={handleDelete}
              disabled={deleteLoading}
            >
              {deleteLoading ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
