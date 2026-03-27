"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import type { ResumeRow, ResumeContent } from "@/lib/types/resume";
import type { ResumeTemplate } from "@/lib/types/resume";
import { Toolbar } from "./Toolbar";
import { FormPanel } from "./FormPanel";
import { PreviewPanel } from "./PreviewPanel";

const AUTOSAVE_DELAY = 1500;

interface EditorContentProps {
  resume: ResumeRow;
}

export function EditorContent({ resume }: EditorContentProps) {
  const template: ResumeTemplate = resume.template;
  const [title, setTitle] = useState(resume.title);
  const [content, setContent] = useState<ResumeContent>(resume.content);
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "unsaved">("saved");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestRef = useRef({ title, content });

  useEffect(() => {
    latestRef.current = { title, content };
  }, [title, content]);

  const persist = useCallback(async () => {
    setSaveStatus("saving");
    const supabase = createClient();
    const { title: t, content: c } = latestRef.current;
    const { error } = await supabase
      .from("resumes")
      .update({ title: t, content: c, updated_at: new Date().toISOString() })
      .eq("id", resume.id);
    setSaveStatus(error ? "unsaved" : "saved");
  }, [resume.id]);

  const scheduleSave = useCallback(() => {
    setSaveStatus("unsaved");
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(persist, AUTOSAVE_DELAY);
  }, [persist]);

  function handleTitleChange(newTitle: string) {
    setTitle(newTitle);
    scheduleSave();
  }

  function handleContentChange(newContent: ResumeContent) {
    setContent(newContent);
    scheduleSave();
  }

  return (
    <div className="flex h-screen flex-col">
      <Toolbar
        title={title}
        template={template}
        content={content}
        saveStatus={saveStatus}
        onTitleChange={handleTitleChange}
      />

      <div className="flex flex-1 overflow-hidden">
        {/* Left: Form panel (40%) */}
        <div className="w-2/5 shrink-0 overflow-y-auto border-r border-border">
          <FormPanel content={content} onChange={handleContentChange} />
        </div>

        {/* Right: Preview panel (60%) */}
        <PreviewPanel content={content} />
      </div>
    </div>
  );
}
