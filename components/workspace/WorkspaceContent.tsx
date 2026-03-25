"use client";

import type { ResumeRow } from "@/lib/types/resume";
import { Sidebar } from "./Sidebar";
import { ResumeCard } from "./ResumeCard";
import { EmptyState } from "./EmptyState";

interface WorkspaceContentProps {
  resumes: ResumeRow[];
  userEmail: string;
}

export function WorkspaceContent({ resumes, userEmail }: WorkspaceContentProps) {
  function handleNewResume() {
    // TODO: open create-resume modal (issue #14+)
    alert("Create resume — coming soon!");
  }

  return (
    <div className="flex h-screen overflow-hidden bg-muted/30">
      <Sidebar userEmail={userEmail} onNewResume={handleNewResume} />

      <main className="flex flex-1 flex-col overflow-y-auto">
        <div className="flex min-h-full flex-col px-10 py-9">
          {/* Header */}
          <div className={resumes.length === 0 ? "" : "mb-7"}>
            <h1 className="text-2xl font-bold tracking-tight">My Resumes</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Create and manage your professional resumes
            </p>
          </div>

          {/* Content */}
          {resumes.length === 0 ? (
            <EmptyState onNewResume={handleNewResume} />
          ) : (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-4">
              {resumes.map((resume) => (
                <ResumeCard key={resume.id} resume={resume} />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
