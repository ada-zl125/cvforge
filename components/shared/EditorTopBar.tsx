"use client";

import { ArrowLeft, Settings } from "lucide-react";
import AnimatedContent from "@/components/AnimatedContent";
import SpotlightCard from "@/components/SpotlightCard";
import { Button } from "@/components/ui/button";

interface EditorTopBarProps {
  title: string;
  eyebrow: string;
  backLabel: string;
  settingsLabel: string;
  language: React.ReactNode;
  afterSettingsActions?: React.ReactNode;
  postLanguageActions?: React.ReactNode;
  actions: React.ReactNode;
  onBack: () => void;
  onSettings: () => void;
}

export const editorTopBarActionClass =
  "editor-topbar-action size-8 cursor-pointer rounded-full p-0";

export const editorTopBarPrimaryActionClass =
  "editor-topbar-primary-action size-8 cursor-pointer rounded-full p-0";

export function EditorTopBar({
  title,
  eyebrow,
  backLabel,
  settingsLabel,
  language,
  afterSettingsActions,
  postLanguageActions,
  actions,
  onBack,
  onSettings,
}: EditorTopBarProps) {
  return (
    <header className="editor-toolbar relative z-20 shrink-0 border-b border-black/10 px-3" data-toolbar>
      <SpotlightCard
        className="h-[52px]"
        spotlightColor="rgba(0, 0, 0, 0)"
      >
        <div className="flex h-full items-center gap-2 pt-1">
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <Button
              variant="ghost"
              size="icon-sm"
              className="editor-topbar-back cursor-pointer"
              onClick={onBack}
              aria-label={backLabel}
              title={backLabel}
            >
              <ArrowLeft className="size-4" />
            </Button>

            <div className="min-w-0 border-l border-black/10 pl-3">
              <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-gray-500">
                {eyebrow}
              </div>
              <div className="truncate text-sm font-semibold leading-5 text-foreground">
                {title}
              </div>
            </div>
          </div>

          <AnimatedContent
            distance={10}
            direction="horizontal"
            duration={0.36}
            threshold={0}
            className="flex shrink-0 items-center gap-1.5"
          >
            <Button
              variant="outline"
              size="icon"
              className="editor-topbar-action"
              onClick={onSettings}
              aria-label={settingsLabel}
              title={settingsLabel}
            >
              <Settings className="size-4" />
            </Button>
            {afterSettingsActions && (
              <div className="editor-topbar-actions flex items-center gap-1.5">
                {afterSettingsActions}
              </div>
            )}
            <div className="editor-topbar-language flex items-center">
              {language}
            </div>
            {postLanguageActions && (
              <div className="editor-topbar-actions flex items-center gap-1.5">
                {postLanguageActions}
              </div>
            )}
            <div className="editor-topbar-actions flex items-center gap-1.5">
              {actions}
            </div>
          </AnimatedContent>
        </div>
      </SpotlightCard>
    </header>
  );
}
