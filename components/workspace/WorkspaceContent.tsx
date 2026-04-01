"use client";

import { useState } from "react";
import type { ResumeRow } from "@/lib/types/resume";
import { useUILanguage } from "@/lib/ui-language";
import { t } from "@/lib/translations";
import { Sidebar } from "./Sidebar";
import { ResumeCard } from "./ResumeCard";
import { EmptyState } from "./EmptyState";
import { CreateResumeModal } from "./CreateResumeModal";

interface WorkspaceContentProps {
  resumes: ResumeRow[];
  userEmail: string;
  displayName: string | null;
  provider: string;
}

export function WorkspaceContent({ resumes, userEmail, displayName, provider }: WorkspaceContentProps) {
  const [createOpen, setCreateOpen] = useState(false);
  const { lang } = useUILanguage();
  const tr = t[lang];

  return (
    <div className="flex h-screen overflow-hidden bg-muted/30">
      <Sidebar userEmail={userEmail} displayName={displayName} provider={provider} onNewResume={() => setCreateOpen(true)} />

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
          ) : (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-4">
              {resumes.map((resume) => (
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
