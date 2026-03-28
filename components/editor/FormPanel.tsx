"use client";

import { useState, useCallback } from "react";
import { ChevronDown, ChevronUp, Plus, Trash2, GraduationCap, FolderOpen, Briefcase, Wrench, ChevronsUpDown, ChevronsDownUp, RotateCcw } from "lucide-react";
import type { ResumeContent, SectionType } from "@/lib/types/resume";
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

const EMPTY_CONTENT: ResumeContent = {
  personal: { fullName: "", contacts: [] },
  sections: [],
  experience: [],
  education: [],
  skills: [],
  projects: [],
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

  // Collapse state: personal + each dynamic section. Default all to collapsed.
  const [personalCollapsed, setPersonalCollapsed] = useState(true);
  const [sectionCollapsed, setSectionCollapsed] = useState<Record<string, boolean>>(() => {
    const map: Record<string, boolean> = {};
    for (const s of activeSections) map[s] = true;
    return map;
  });
  const [resetOpen, setResetOpen] = useState(false);

  const allCollapsed = personalCollapsed && activeSections.every((s) => sectionCollapsed[s] !== false);

  const toggleAll = useCallback(() => {
    const target = !allCollapsed;
    setPersonalCollapsed(target);
    setSectionCollapsed((prev) => {
      const next = { ...prev };
      for (const s of activeSections) next[s] = target;
      return next;
    });
  }, [allCollapsed, activeSections]);

  function setSectionCollapse(type: SectionType, collapsed: boolean) {
    setSectionCollapsed((prev) => ({ ...prev, [type]: collapsed }));
  }

  function addSection(type: SectionType) {
    onChange({ ...content, sections: [...activeSections, type] });
    setSectionCollapsed((prev) => ({ ...prev, [type]: false }));
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

  function handleReset() {
    onChange(EMPTY_CONTENT);
    setPersonalCollapsed(true);
    setSectionCollapsed({});
    setResetOpen(false);
  }

  return (
    <div className="flex flex-col gap-4 p-5">
      {/* Form toolbar: Collapse All / Reset */}
      <div className="flex items-center gap-1.5">
        <Button
          variant="outline"
          size="sm"
          className="btn-hover-border cursor-pointer gap-1.5 text-xs"
          onClick={toggleAll}
        >
          {allCollapsed ? <ChevronsUpDown className="size-3.5" /> : <ChevronsDownUp className="size-3.5" />}
          {allCollapsed ? "Expand All" : "Collapse All"}
        </Button>

        <Button
          variant="outline"
          size="sm"
          className="btn-hover-border cursor-pointer gap-1.5 text-xs"
          onClick={() => setResetOpen(true)}
        >
          <RotateCcw className="size-3.5" />
          Reset
        </Button>
      </div>

      {/* Personal Information — fixed, cannot be removed */}
      <PersonalSection
        data={content.personal}
        onChange={(personal) => onChange({ ...content, personal })}
        collapsed={personalCollapsed}
        onToggleCollapse={() => setPersonalCollapsed((v) => !v)}
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
          collapsed={sectionCollapsed[type] !== false}
          onToggleCollapse={() => setSectionCollapse(type, !sectionCollapsed[type])}
        />
      ))}

      {/* Add section button */}
      {availableSections.length > 0 && (
        <DropdownMenu>
          <DropdownMenuTrigger className="add-section-btn flex h-9 w-full cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-dashed border-border text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground">
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

      {/* Reset confirmation dialog */}
      <AlertDialog open={resetOpen} onOpenChange={setResetOpen}>
        <AlertDialogContent size="sm">
          <AlertDialogHeader>
            <AlertDialogTitle>Reset all content?</AlertDialogTitle>
            <AlertDialogDescription>
              This will clear all sections and personal information. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="btn-hover-border cursor-pointer">Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="outline"
              className="btn-hover-destructive cursor-pointer border-destructive/40 text-destructive hover:border-destructive hover:bg-destructive/10 hover:text-destructive"
              onClick={handleReset}
            >
              Reset
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
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
  collapsed,
  onToggleCollapse,
}: {
  type: SectionType;
  content: ResumeContent;
  onChange: (content: ResumeContent) => void;
  onRemove: () => void;
  isFirst: boolean;
  isLast: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}) {
  const meta = SECTION_META[type];

  return (
    <section className="section-card rounded-lg border border-border">
      {/* Header */}
      <div className="section-header flex items-stretch justify-between px-4">
        <button
          type="button"
          className="flex flex-1 cursor-pointer items-center gap-2 py-3 text-sm font-semibold tracking-tight transition-colors hover:text-foreground"
          onClick={onToggleCollapse}
        >
          {meta.label}
          <ChevronDown className={`size-4 text-muted-foreground transition-transform duration-200 ${collapsed ? "-rotate-90" : ""}`} />
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
