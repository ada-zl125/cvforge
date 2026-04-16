"use client";

import { useState, useCallback } from "react";
import { ChevronsUpDown, ChevronsDownUp, RotateCcw } from "lucide-react";
import type { CoverLetterContent } from "@/lib/types/cover-letter";
import { defaultCoverLetterContent } from "@/lib/defaults";
import { useUILanguage } from "@/lib/ui-language";
import { t } from "@/lib/translations";
import { Button } from "@/components/ui/button";
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
import { SenderSection } from "./sections/SenderSection";
import { RecipientSection } from "./sections/RecipientSection";
import { ParagraphsSection } from "./sections/ParagraphsSection";

interface FormPanelProps {
  content: CoverLetterContent;
  onChange: (content: CoverLetterContent) => void;
}

export function FormPanel({ content, onChange }: FormPanelProps) {
  const { lang } = useUILanguage();
  const tr = t[lang];
  const cl = tr.coverLetter;

  const [senderCollapsed, setSenderCollapsed] = useState(false);
  const [recipientCollapsed, setRecipientCollapsed] = useState(false);
  const [paragraphsCollapsed, setParagraphsCollapsed] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);

  const allCollapsed = senderCollapsed && recipientCollapsed && paragraphsCollapsed;

  const toggleAll = useCallback(() => {
    const target = !allCollapsed;
    setSenderCollapsed(target);
    setRecipientCollapsed(target);
    setParagraphsCollapsed(target);
  }, [allCollapsed]);

  function handleReset() {
    onChange(defaultCoverLetterContent);
    setResetOpen(false);
  }

  return (
    <div className="flex flex-col gap-4 p-5">
      {/* Toolbar */}
      <div className="flex items-center gap-1.5">
        <Button
          variant="outline"
          size="sm"
          className="btn-hover-border cursor-pointer gap-1.5 text-xs"
          onClick={toggleAll}
        >
          {allCollapsed ? <ChevronsUpDown className="size-3.5" /> : <ChevronsDownUp className="size-3.5" />}
          {allCollapsed ? tr.expandAll : tr.collapseAll}
        </Button>

        <Button
          variant="outline"
          size="sm"
          className="btn-hover-border cursor-pointer gap-1.5 text-xs"
          onClick={() => setResetOpen(true)}
        >
          <RotateCcw className="size-3.5" />
          {tr.resetBtn}
        </Button>
      </div>

      {/* Sender Info */}
      <SenderSection
        data={content.sender}
        onChange={(sender) => onChange({ ...content, sender })}
        collapsed={senderCollapsed}
        onToggleCollapse={() => setSenderCollapsed((v) => !v)}
      />

      {/* Date & Recipient */}
      <RecipientSection
        data={content.recipient}
        date={content.date}
        onDateChange={(date) => onChange({ ...content, date })}
        onChange={(recipient) => onChange({ ...content, recipient })}
        collapsed={recipientCollapsed}
        onToggleCollapse={() => setRecipientCollapsed((v) => !v)}
      />

      {/* Body Paragraphs */}
      <ParagraphsSection
        items={content.paragraphs}
        onChange={(paragraphs) => onChange({ ...content, paragraphs })}
        collapsed={paragraphsCollapsed}
        onToggleCollapse={() => setParagraphsCollapsed((v) => !v)}
      />

      {/* Reset dialog */}
      <AlertDialog open={resetOpen} onOpenChange={setResetOpen}>
        <AlertDialogContent size="sm">
          <AlertDialogHeader>
            <AlertDialogTitle>{cl.resetTitle}</AlertDialogTitle>
            <AlertDialogDescription>{cl.resetDesc}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="btn-hover-border cursor-pointer">{tr.cancel}</AlertDialogCancel>
            <AlertDialogAction
              variant="outline"
              className="btn-hover-destructive cursor-pointer border-destructive/40 text-destructive hover:border-destructive hover:bg-destructive/10 hover:text-destructive"
              onClick={handleReset}
            >
              {tr.resetConfirm}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
