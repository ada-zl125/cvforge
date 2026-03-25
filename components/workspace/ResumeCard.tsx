"use client";

import { useRouter } from "next/navigation";
import { Pencil, Copy, Trash2, MoreVertical } from "lucide-react";
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
import { Button } from "@/components/ui/button";

/* ------------------------------------------------------------------ */
/*  Template colour mapping (matches the Pencil design)               */
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

  async function handleDelete() {
    const supabase = createClient();
    await supabase.from("resumes").delete().eq("id", resume.id);
    router.refresh();
  }

  return (
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
                />
              }
            >
              <MoreVertical className="size-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent side="bottom" align="end" sideOffset={4}>
              <DropdownMenuItem
                onClick={() => router.push(`/editor/${resume.id}`)}
              >
                <Pencil className="size-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleDuplicate}>
                <Copy className="size-4" />
                Duplicate
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" onClick={handleDelete}>
                <Trash2 className="size-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </CardAction>
      </CardHeader>
    </Card>
  );
}
