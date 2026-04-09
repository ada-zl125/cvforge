"use client";

import { useState, useMemo } from "react";
import type { ResumeRow } from "@/lib/types/resume";
import { useUILanguage } from "@/lib/ui-language";
import { t } from "@/lib/translations";
import { Sidebar } from "./Sidebar";
import { ResumeCard } from "./ResumeCard";
import { EmptyState } from "./EmptyState";
import { CreateResumeModal } from "./CreateResumeModal";

export type FilterKey = "all" | "starred" | "recent-week" | "recent-month" | "recent-year";

const RECENT_DAYS: Partial<Record<FilterKey, number>> = {
  "recent-week": 7,
  "recent-month": 30,
  "recent-year": 365,
};

interface WorkspaceContentProps {
  resumes: ResumeRow[];
  userEmail: string;
  displayName: string | null;
  provider: string;
}

export function WorkspaceContent({ resumes, userEmail, displayName, provider }: WorkspaceContentProps) {
  const [createOpen, setCreateOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<FilterKey>("all");
  const [filterChangedAt, setFilterChangedAt] = useState<number | null>(null);
  const { lang } = useUILanguage();
  const tr = t[lang];

  const handleFilterChange = (nextFilter: FilterKey) => {
    setActiveFilter(nextFilter);
    setFilterChangedAt(nextFilter in RECENT_DAYS ? Date.now() : null);
  };

  const filtered = useMemo(() => {
    let list = [...resumes];

    if (activeFilter === "starred") {
      list = list.filter((r) => r.is_starred);
    } else if (activeFilter in RECENT_DAYS && filterChangedAt !== null) {
      const days = RECENT_DAYS[activeFilter]!;
      const cutoff = filterChangedAt - days * 24 * 60 * 60 * 1000;
      list = list.filter((r) => new Date(r.updated_at).getTime() > cutoff);
    }

    if (activeFilter === "all") {
      list.sort((a, b) => {
        if (a.is_starred !== b.is_starred) return a.is_starred ? -1 : 1;
        return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
      });
    }

    return list;
  }, [resumes, activeFilter, filterChangedAt]);

  const emptyMessage =
    activeFilter === "starred"
      ? tr.filterEmptyStarred
      : activeFilter !== "all"
      ? tr.filterEmptyRecent
      : null;

  return (
    <div className="flex h-screen overflow-hidden bg-muted/30">
      <Sidebar
        userEmail={userEmail}
        displayName={displayName}
        provider={provider}
        onNewResume={() => setCreateOpen(true)}
        activeFilter={activeFilter}
        onFilterChange={handleFilterChange}
      />

      <main className="flex flex-1 flex-col overflow-y-auto">
        <div className="flex min-h-full flex-col px-10 py-9">
          {/* Header */}
          <div className={resumes.length === 0 ? "" : "mb-7"}>
            <h1 className="text-2xl font-bold tracking-tight">{tr.myResumes}</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {tr.myResumesSubtitle}
            </p>
          </div>

          {/* Content */}
          {resumes.length === 0 ? (
            <EmptyState onNewResume={() => setCreateOpen(true)} />
          ) : filtered.length === 0 && emptyMessage ? (
            <p className="mt-2 text-sm text-muted-foreground">{emptyMessage}</p>
          ) : (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-4">
              {filtered.map((resume) => (
                <ResumeCard key={resume.id} resume={resume} />
              ))}
            </div>
          )}
        </div>
      </main>

      <CreateResumeModal open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
}
