"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Plus, Trash2, GraduationCap, FolderOpen, Briefcase, Wrench } from "lucide-react";
import type { ResumeContent, SectionType } from "@/lib/types/resume";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { PersonalSection } from "./sections/PersonalSection";
import { EducationSection } from "./sections/EducationSection";
import { ProjectsSection } from "./sections/ProjectsSection";
import { ExperienceSection } from "./sections/ExperienceSection";
import { SkillsSection } from "./sections/SkillsSection";

const SECTION_META: Record<SectionType, { icon: typeof GraduationCap; label: string }> = {
  education:  { icon: GraduationCap, label: "Education" },
  projects:   { icon: FolderOpen,    label: "Projects" },
  experience: { icon: Briefcase,     label: "Experience" },
  skills:     { icon: Wrench,        label: "Skills" },
};

interface FormPanelProps {
  content: ResumeContent;
  onChange: (content: ResumeContent) => void;
}

export function FormPanel({ content, onChange }: FormPanelProps) {
  const activeSections = content.sections ?? [];
  const availableSections = (Object.keys(SECTION_META) as SectionType[]).filter(
    (s) => !activeSections.includes(s),
  );

  function addSection(type: SectionType) {
    onChange({ ...content, sections: [...activeSections, type] });
  }

  function removeSection(type: SectionType) {
    onChange({ ...content, sections: activeSections.filter((s) => s !== type) });
  }

  function moveSection(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= activeSections.length) return;
    const next = [...activeSections];
    [next[index], next[target]] = [next[target], next[index]];
    onChange({ ...content, sections: next });
  }

  return (
    <div className="flex flex-col gap-4 p-5">
      {/* Personal Information — fixed, cannot be removed */}
      <PersonalSection
        data={content.personal}
        onChange={(personal) => onChange({ ...content, personal })}
      />

      {/* Dynamic sections */}
      {activeSections.map((type, i) => (
        <CollapsibleSection
          key={type}
          type={type}
          content={content}
          onChange={onChange}
          onRemove={() => removeSection(type)}
          isFirst={i === 0}
          isLast={i === activeSections.length - 1}
          onMoveUp={() => moveSection(i, -1)}
          onMoveDown={() => moveSection(i, 1)}
        />
      ))}

      {/* Add section button */}
      {availableSections.length > 0 && (
        <DropdownMenu>
          <DropdownMenuTrigger className="btn-hover-border flex h-9 w-full cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-dashed border-border text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
            <Plus className="size-4" />
            Add Section
          </DropdownMenuTrigger>
          <DropdownMenuContent align="center" sideOffset={4}>
            {availableSections.map((type) => {
              const meta = SECTION_META[type];
              return (
                <DropdownMenuItem
                  key={type}
                  className="cursor-pointer gap-2"
                  onClick={() => addSection(type)}
                >
                  <meta.icon className="size-4" />
                  {meta.label}
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Collapsible section wrapper for dynamic sections                    */
/* ------------------------------------------------------------------ */

function CollapsibleSection({
  type,
  content,
  onChange,
  onRemove,
  isFirst,
  isLast,
  onMoveUp,
  onMoveDown,
}: {
  type: SectionType;
  content: ResumeContent;
  onChange: (content: ResumeContent) => void;
  onRemove: () => void;
  isFirst: boolean;
  isLast: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const meta = SECTION_META[type];

  return (
    <section className="rounded-lg border border-border">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3">
        <button
          type="button"
          className="flex flex-1 cursor-pointer items-center gap-2 text-sm font-semibold tracking-tight transition-colors hover:text-foreground"
          onClick={() => setCollapsed(!collapsed)}
        >
          {meta.label}
          <ChevronDown className={`size-4 text-muted-foreground transition-transform ${collapsed ? "-rotate-90" : ""}`} />
        </button>
        <div className="flex items-center gap-0.5">
          <Button
            variant="ghost" size="icon-xs"
            className="cursor-pointer text-muted-foreground hover:text-foreground disabled:opacity-30"
            disabled={isFirst} onClick={onMoveUp}
          >
            <ChevronUp className="size-3.5" />
          </Button>
          <Button
            variant="ghost" size="icon-xs"
            className="cursor-pointer text-muted-foreground hover:text-foreground disabled:opacity-30"
            disabled={isLast} onClick={onMoveDown}
          >
            <ChevronDown className="size-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon-xs"
            className="cursor-pointer text-muted-foreground hover:text-destructive"
            onClick={onRemove}
            aria-label={`Remove ${meta.label}`}
          >
            <Trash2 className="size-3.5" />
          </Button>
        </div>
      </div>

      {/* Content */}
      {!collapsed && (
        <div className="border-t border-border px-4 pb-4 pt-3">
          {type === "education" && (
            <EducationSection items={content.education} onChange={(education) => onChange({ ...content, education })} />
          )}
          {type === "projects" && (
            <ProjectsSection items={content.projects} onChange={(projects) => onChange({ ...content, projects })} />
          )}
          {type === "experience" && (
            <ExperienceSection items={content.experience} onChange={(experience) => onChange({ ...content, experience })} />
          )}
          {type === "skills" && (
            <SkillsSection items={content.skills} onChange={(skills) => onChange({ ...content, skills })} />
          )}
        </div>
      )}
    </section>
  );
}
