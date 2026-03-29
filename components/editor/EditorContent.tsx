"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import type { ResumeRow, ResumeContent, ResumeTemplate, ResumeLanguage } from "@/lib/types/resume";
import { Toolbar } from "./Toolbar";
import { FormPanel } from "./FormPanel";
import { PreviewPanel } from "./PreviewPanel";

const AUTOSAVE_DELAY = 1500;

interface EditorContentProps {
  resume: ResumeRow;
}

export function EditorContent({ resume }: EditorContentProps) {
  const [template, setTemplate] = useState<ResumeTemplate>(resume.template);
  const [language, setLanguage] = useState<ResumeLanguage>(resume.language ?? "en");
  const [title, setTitle] = useState(resume.title);
  const [content, setContent] = useState<ResumeContent>(resume.content);
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "unsaved">("saved");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestRef = useRef({ title, content, template, language });

  useEffect(() => {
    latestRef.current = { title, content, template, language };
  }, [title, content, template, language]);

  const persist = useCallback(async () => {
    setSaveStatus("saving");
    try {
      const supabase = createClient();

      // Verify browser session exists before attempting update
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.error("[persist] No active browser session — user may need to re-login");
        setSaveStatus("unsaved");
        return;
      }

      const { title: t, content: c, template: tmpl, language: lang } = latestRef.current;
      const { error } = await supabase
        .from("resumes")
        .update({ title: t, content: c, template: tmpl, language: lang, updated_at: new Date().toISOString() })
        .eq("id", resume.id);

      if (error) {
        // Log all properties including non-enumerable (e.g. native Error.message/stack)
        console.error("[persist] Supabase update failed:", JSON.stringify(error, Object.getOwnPropertyNames(error)));
      }
      setSaveStatus(error ? "unsaved" : "saved");
    } catch (err) {
      console.error("[persist] Unexpected error:", err instanceof Error ? err.message : err);
      setSaveStatus("unsaved");
    }
  }, [resume.id]);

  const scheduleSave = useCallback(() => {
    setSaveStatus("unsaved");
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(persist, AUTOSAVE_DELAY);
  }, [persist]);

  function handleContentChange(newContent: ResumeContent) {
    setContent(newContent);
    scheduleSave();
  }

  // Called from Settings dialog — applies all three fields atomically and saves immediately
  function handleSettingsChange(newTitle: string, newLanguage: ResumeLanguage, newTemplate: ResumeTemplate) {
    setTitle(newTitle);
    setLanguage(newLanguage);
    setTemplate(newTemplate);
    // Update latestRef synchronously so persist() reads new values before useEffect runs
    latestRef.current = { ...latestRef.current, title: newTitle, language: newLanguage, template: newTemplate };
    if (timerRef.current) clearTimeout(timerRef.current);
    persist();
  }

  function handleManualSave() {
    if (timerRef.current) clearTimeout(timerRef.current);
    persist();
  }

  return (
    <div className="flex h-screen flex-col">
      <Toolbar
        title={title}
        template={template}
        language={language}
        content={content}
        saveStatus={saveStatus}
        onSettingsChange={handleSettingsChange}
      />

      <div className="flex flex-1 overflow-hidden">
        {/* Left: Form panel (40%) */}
        <div className="w-2/5 shrink-0 overflow-y-auto border-r border-border">
          <FormPanel content={content} onChange={handleContentChange} saveStatus={saveStatus} onSave={handleManualSave} />
        </div>

        {/* Right: Preview panel (60%) */}
        <PreviewPanel content={content} language={language} />
      </div>
    </div>
  );
}
