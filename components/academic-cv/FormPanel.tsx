"use client";

import { useState, useCallback, useMemo } from "react";
import {
  Search, GraduationCap, FlaskConical, BookOpen, Briefcase, BookMarked,
  FileText, Mic, Award, Users, Wrench, UserCheck,
  ChevronDown, ChevronUp, Plus, Trash2, ChevronsUpDown, ChevronsDownUp, RotateCcw,
} from "lucide-react";
import type { AcademicCVContent, AcademicSectionType, ResumeLanguage } from "@/lib/types/academic-cv";
import { defaultAcademicCVContent } from "@/lib/defaults";
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
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { PersonalSection } from "@/components/editor/sections/PersonalSection";
import { SkillsSection } from "@/components/editor/sections/SkillsSection";
import { ResearchInterestsSection } from "./sections/ResearchInterestsSection";
import { AcademicEducationSection } from "./sections/AcademicEducationSection";
import { AcademicExperienceSection } from "./sections/AcademicExperienceSection";
import { TeachingSection } from "./sections/TeachingSection";
import { PublicationsSection } from "./sections/PublicationsSection";
import { PresentationsSection } from "./sections/PresentationsSection";
import { GrantsAwardsSection } from "./sections/GrantsAwardsSection";
import { ServiceSection } from "./sections/ServiceSection";
import { ReferencesSection } from "./sections/ReferencesSection";

const SECTION_META: Record<AcademicSectionType, { icon: typeof GraduationCap; label: string; labelZh: string }> = {
  researchInterests:       { icon: Search,        label: "Research Interests",        labelZh: "研究兴趣" },
  education:               { icon: GraduationCap, label: "Education",                 labelZh: "教育经历" },
  researchExperience:      { icon: FlaskConical,  label: "Research Experience",       labelZh: "科研经历" },
  teachingExperience:      { icon: BookOpen,      label: "Teaching Experience",       labelZh: "教学经历" },
  industryExperience:      { icon: Briefcase,     label: "Industry Experience",       labelZh: "工业界经历" },
  publications:            { icon: BookMarked,    label: "Publications",              labelZh: "已发表论文" },
  manuscriptsUnderReview:  { icon: FileText,      label: "Manuscripts under Review",  labelZh: "在投论文" },
  conferencePresentations: { icon: Mic,           label: "Conference Presentations",  labelZh: "会议报告" },
  grantsAndAwards:         { icon: Award,         label: "Grants & Awards",           labelZh: "科研资助与荣誉" },
  professionalService:     { icon: Users,         label: "Professional Service",      labelZh: "学术服务" },
  technicalSkills:         { icon: Wrench,        label: "Technical Skills",          labelZh: "技术技能" },
  references:              { icon: UserCheck,     label: "Referees",                  labelZh: "推荐人" },
};

interface FormPanelProps {
  content: AcademicCVContent;
  onChange: (content: AcademicCVContent) => void;
  language: ResumeLanguage;
}

export function FormPanel({ content, onChange, language }: FormPanelProps) {
  const { lang } = useUILanguage();
  const tr = t[lang];
  const activeSections = useMemo(() => content.sections ?? [], [content.sections]);
  const availableSections = (Object.keys(SECTION_META) as AcademicSectionType[]).filter(
    (s) => !activeSections.includes(s),
  );

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

  function setSectionCollapse(type: AcademicSectionType, collapsed: boolean) {
    setSectionCollapsed((prev) => ({ ...prev, [type]: collapsed }));
  }

  function addSection(type: AcademicSectionType) {
    onChange({ ...content, sections: [...activeSections, type] });
    setSectionCollapsed((prev) => ({ ...prev, [type]: false }));
  }

  function removeSection(type: AcademicSectionType) {
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
    onChange(defaultAcademicCVContent);
    setPersonalCollapsed(true);
    setSectionCollapsed({});
    setResetOpen(false);
  }

  return (
    <div className="flex flex-col gap-4 p-5">
      {/* Form toolbar */}
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

      {/* Personal Information — fixed, cannot be removed */}
      <PersonalSection
        data={content.personal}
        onChange={(personal) => onChange({ ...content, personal })}
        collapsed={personalCollapsed}
        onToggleCollapse={() => setPersonalCollapsed((v) => !v)}
        language={language}
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
          language={language}
        />
      ))}

      {/* Add section button */}
      {availableSections.length > 0 && (
        <DropdownMenu>
          <DropdownMenuTrigger className="add-section-btn flex h-9 w-full cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-dashed border-border text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground">
            <Plus className="size-4" />
            {tr.addSection}
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
                  {language === "zh" ? meta.labelZh : meta.label}
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
            <AlertDialogTitle>{tr.resetTitle}</AlertDialogTitle>
            <AlertDialogDescription>
              {tr.resetDesc}
            </AlertDialogDescription>
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

/* ------------------------------------------------------------------ */
/*  Collapsible section wrapper                                          */
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
  language,
}: {
  type: AcademicSectionType;
  content: AcademicCVContent;
  onChange: (content: AcademicCVContent) => void;
  onRemove: () => void;
  isFirst: boolean;
  isLast: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  language: ResumeLanguage;
}) {
  const meta = SECTION_META[type];
  const sectionLabel = language === "zh" ? meta.labelZh : meta.label;

  return (
    <section className="section-card rounded-lg border border-border">
      {/* Header */}
      <div className="section-header flex items-stretch justify-between px-4">
        <button
          type="button"
          className="flex flex-1 cursor-pointer items-center gap-2 py-3 text-sm font-semibold tracking-tight transition-colors hover:text-foreground"
          onClick={onToggleCollapse}
        >
          {sectionLabel}
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
          {type === "researchInterests" && (
            <ResearchInterestsSection
              value={content.researchInterests ?? ""}
              onChange={(v) => onChange({ ...content, researchInterests: v })}
            />
          )}
          {type === "education" && (
            <AcademicEducationSection
              items={content.education}
              onChange={(education) => onChange({ ...content, education })}
              language={language}
            />
          )}
          {type === "researchExperience" && (
            <AcademicExperienceSection
              items={content.researchExperience}
              onChange={(items) => onChange({ ...content, researchExperience: items })}
              language={language}
              orgPlaceholder={language === "zh" ? "清华大学" : "MIT CSAIL"}
            />
          )}
          {type === "industryExperience" && (
            <AcademicExperienceSection
              items={content.industryExperience}
              onChange={(items) => onChange({ ...content, industryExperience: items })}
              language={language}
              orgPlaceholder={language === "zh" ? "谷歌公司" : "Google"}
              optionalFields={["department", "descriptions"]}
            />
          )}
          {type === "teachingExperience" && (
            <TeachingSection
              items={content.teachingExperience}
              onChange={(items) => onChange({ ...content, teachingExperience: items })}
              language={language}
            />
          )}
          {type === "publications" && (
            <PublicationsSection
              items={content.publications}
              onChange={(items) => onChange({ ...content, publications: items })}
              language={language}
            />
          )}
          {type === "manuscriptsUnderReview" && (
            <PublicationsSection
              items={content.manuscriptsUnderReview}
              onChange={(items) => onChange({ ...content, manuscriptsUnderReview: items })}
              language={language}
            />
          )}
          {type === "conferencePresentations" && (
            <PresentationsSection
              items={content.conferencePresentations}
              onChange={(items) => onChange({ ...content, conferencePresentations: items })}
              language={language}
            />
          )}
          {type === "grantsAndAwards" && (
            <GrantsAwardsSection
              items={content.grantsAndAwards}
              onChange={(items) => onChange({ ...content, grantsAndAwards: items })}
              language={language}
            />
          )}
          {type === "professionalService" && (
            <ServiceSection
              items={content.professionalService}
              onChange={(items) => onChange({ ...content, professionalService: items })}
              language={language}
            />
          )}
          {type === "technicalSkills" && (
            <SkillsSection
              items={content.technicalSkills}
              onChange={(items) => onChange({ ...content, technicalSkills: items })}
              language={language}
            />
          )}
          {type === "references" && (
            <ReferencesSection
              items={content.references}
              onChange={(items) => onChange({ ...content, references: items })}
              language={language}
            />
          )}
        </div>
      )}
    </section>
  );
}
