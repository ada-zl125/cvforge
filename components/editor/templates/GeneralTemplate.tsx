"use client";

import type { ResumeContent, ResumeLanguage, ContactField, EducationItem, ExperienceItem, ProjectItem, SkillGroup, AwardItem, SectionType } from "@/lib/types/resume";
import { PageBreakAvoid } from "@/components/shared/PageBreakAvoid";
import { BulletItem } from "@/components/shared/BulletItem";
import {
  BODY_SIZE, SECTION_TITLE_SIZE, NAME_SIZE,
  LINE_STYLE, BULLET_ROW_STYLE, BULLET_DOT_STYLE,
  getFontFamily, boldFontStyle,
} from "@/lib/template-styles";

interface AcademicTemplateProps {
  content: ResumeContent;
  language?: ResumeLanguage;
}

/* ---- Section title maps ---- */

const SECTION_TITLES_ZH: Record<SectionType, string> = {
  summary: "个人简介",
  education: "教育经历",
  experience: "工作经历",
  projects: "项目经历",
  skills: "专业技能",
  awards: "荣誉奖项",
};

const SECTION_TITLES_EN: Record<SectionType, string> = {
  summary: "Summary",
  education: "Education",
  experience: "Experience",
  projects: "Projects",
  skills: "Technical Skills",
  awards: "Awards",
};

const EXTRA_FIELD_LABELS_ZH: Record<string, string> = {
  Grade: "成绩",
  Awards: "获奖",
};

function getSectionTitle(type: SectionType, lang: ResumeLanguage): string {
  return lang === "zh" ? SECTION_TITLES_ZH[type] : SECTION_TITLES_EN[type];
}

function getExtraFieldLabel(label: string, lang: ResumeLanguage): string {
  if (lang === "zh" && EXTRA_FIELD_LABELS_ZH[label]) return EXTRA_FIELD_LABELS_ZH[label];
  return label;
}

function SectionTitle({ type, lang, fontFamily }: { type: SectionType; lang: ResumeLanguage; fontFamily: string }) {
  const title = getSectionTitle(type, lang);
  return (
    <div className="mb-0.5">
      <h2
        style={{ fontSize: SECTION_TITLE_SIZE, letterSpacing: "-0.03em", ...boldFontStyle(lang, fontFamily) }}
        className={`${lang === "en" ? "uppercase" : ""}`}
      >
        {title}
      </h2>
      <div className="border-t border-black" />
    </div>
  );
}

function SummaryBlock({ summary, lang, fontFamily }: { summary: string; lang: ResumeLanguage; fontFamily: string }) {
  if (!summary.trim()) return null;
  return (
    <PageBreakAvoid className="mb-2">
      <SectionTitle type="summary" lang={lang} fontFamily={fontFamily} />
      <p style={{ ...LINE_STYLE, paddingLeft: 0 }}>{summary}</p>
    </PageBreakAvoid>
  );
}

/* ---- Contact rendering ---- */

function formatContact(field: ContactField): React.ReactNode {
  switch (field.type) {
    case "email":
      return (
        <a href={`mailto:${field.value}`} style={{ color: "#1a4dc2" }}>
          {field.value}
        </a>
      );
    case "phone":
      return `${field.countryCode ?? ""} ${field.value}`.trim();
    case "location":
      return field.value;
    case "website":
      return (
        <a href={field.value} style={{ color: "#1a4dc2" }}>
          {field.label || field.value}
        </a>
      );
    default:
      return field.value;
  }
}

/* ---- Personal header ---- */

function PersonalHeader({ personal, fontFamily, language }: { personal: ResumeContent["personal"]; fontFamily: string; language: ResumeLanguage }) {
  const contacts = personal.contacts ?? [];
  const hasPhoto = !!personal.photo;

  const nameEl = (
    <h1 className="leading-tight" style={{ fontSize: NAME_SIZE, ...boldFontStyle(language, fontFamily) }}>
      {personal.fullName || (language === "zh" ? "姓名" : "Your Name")}
    </h1>
  );

  if (hasPhoto) {
    // With photo: non-website contacts on first line, each website on its own line
    const mainContacts = contacts.filter((c) => c.type !== "website");
    const websites = contacts.filter((c) => c.type === "website");
    const headerMinHeight = websites.length > 0 ? "88px" : "76px";
    const contactsEl = contacts.length > 0 && (
      <div className="mt-1" style={{ fontSize: BODY_SIZE }}>
        {mainContacts.length > 0 && (
          <div>
            {mainContacts.map((field, i) => (
              <span key={field.id}>
                {i > 0 && " | "}
                {formatContact(field)}
              </span>
            ))}
          </div>
        )}
        {websites.length > 0 && (
          <div>
            {websites.map((field, i) => (
              <span key={field.id}>
                {i > 0 && " | "}
                {formatContact(field)}
              </span>
            ))}
          </div>
        )}
      </div>
    );

    return (
      <div className="relative mb-1" style={{ paddingRight: "90px", minHeight: headerMinHeight }}>
        {nameEl}
        {contactsEl}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={personal.photo}
          alt=""
          style={{ position: "absolute", top: "-10px", right: 0, width: "74px", height: "92px", objectFit: "cover", borderRadius: "2px" }}
        />
      </div>
    );
  }

  const contactsEl = contacts.length > 0 && (
    <p className="mt-1" style={{ fontSize: BODY_SIZE }}>
      {contacts.map((field, i) => (
        <span key={field.id}>
          {i > 0 && " | "}
          {formatContact(field)}
        </span>
      ))}
    </p>
  );

  return (
    <div className="mb-2 text-center">
      {nameEl}
      {contactsEl}
    </div>
  );
}

/* ---- Section blocks ---- */

function EducationBlock({ items, lang, fontFamily }: { items: EducationItem[]; lang: ResumeLanguage; fontFamily: string }) {
  if (items.length === 0) return null;
  return (
    <section className="mb-2">
      {items.map((edu, index) => {
        const extraFields = edu.extraFields ?? [];
        const dateText = [edu.startDate, edu.endDate].filter(Boolean).join(" – ");

        let degreeLine: string;
        if (lang === "zh") {
          degreeLine = [edu.field, edu.degree].filter(Boolean).join("");
        } else {
          const combined = [edu.degree, edu.field].filter(Boolean).join(" ");
          degreeLine = combined ? `Degree: ${combined}` : "";
        }

        return (
          <PageBreakAvoid key={edu.id} style={index > 0 ? { marginTop: "6px" } : undefined}>
            {index === 0 && <SectionTitle type="education" lang={lang} fontFamily={fontFamily} />}
            <div>
              <div className="flex items-baseline justify-between gap-2" style={{ ...LINE_STYLE, paddingLeft: 0 }}>
                <span style={boldFontStyle(lang, fontFamily)}>{edu.institution}</span>
                <span className="shrink-0" style={boldFontStyle(lang, fontFamily)}>{edu.location}</span>
              </div>
              {degreeLine && (
                <div style={BULLET_ROW_STYLE}>
                  <span style={BULLET_DOT_STYLE}>●</span>
                  <span style={{ flex: 1, display: "flex", justifyContent: "space-between", gap: "0.5em" }}>
                    <span>{degreeLine}</span>
                    {dateText && <span className="shrink-0">{dateText}</span>}
                  </span>
                </div>
              )}
              {extraFields.map((ef) => {
                if (!ef.value) return null;
                const label = getExtraFieldLabel(ef.label, lang);
                return <BulletItem key={ef.id}>{label ? `${label}: ` : ""}{ef.value}</BulletItem>;
              })}
            </div>
          </PageBreakAvoid>
        );
      })}
    </section>
  );
}

function ExperienceBlock({ items, lang, fontFamily }: { items: ExperienceItem[]; lang: ResumeLanguage; fontFamily: string }) {
  if (items.length === 0) return null;
  return (
    <section className="mb-2">
      {items.map((exp, index) => {
        const descriptions = exp.descriptions ?? [];
        const dateText = [exp.startDate, exp.endDate].filter(Boolean).join(" – ");

        return (
          <PageBreakAvoid key={exp.id} style={index > 0 ? { marginTop: "6px" } : undefined}>
            {index === 0 && <SectionTitle type="experience" lang={lang} fontFamily={fontFamily} />}
            <div>
              <div className="flex items-baseline justify-between gap-2" style={{ ...LINE_STYLE, paddingLeft: 0 }}>
                <span style={boldFontStyle(lang, fontFamily)}>{exp.company}</span>
                <span className="shrink-0" style={boldFontStyle(lang, fontFamily)}>{exp.location}</span>
              </div>
              {exp.position && (
                <div className="flex items-baseline justify-between gap-2" style={{ ...LINE_STYLE, paddingLeft: 0 }}>
                  <span>{exp.position}</span>
                  {dateText && <span className="shrink-0">{dateText}</span>}
                </div>
              )}
              {descriptions.map((desc) =>
                desc.value ? <BulletItem key={desc.id}>{desc.value}</BulletItem> : null
              )}
            </div>
          </PageBreakAvoid>
        );
      })}
    </section>
  );
}

function ProjectsBlock({ items, lang, fontFamily }: { items: ProjectItem[]; lang: ResumeLanguage; fontFamily: string }) {
  if (items.length === 0) return null;
  return (
    <section className="mb-2">
      {items.map((proj, index) => {
        const descriptions = proj.descriptions ?? [];
        const dateText = [proj.startDate, proj.endDate].filter(Boolean).join(" – ");
        const hasWebsite = proj.websiteLabel && proj.websiteUrl;

        return (
          <PageBreakAvoid key={proj.id} style={index > 0 ? { marginTop: "6px" } : undefined}>
            {index === 0 && <SectionTitle type="projects" lang={lang} fontFamily={fontFamily} />}
            <div>
              <div className="flex items-baseline justify-between gap-2" style={{ ...LINE_STYLE, paddingLeft: 0 }}>
                <span>
                  <span style={boldFontStyle(lang, fontFamily)}>{proj.name}</span>
                  {hasWebsite && (
                    <>
                      {" | "}
                      <a href={proj.websiteUrl} style={{ color: "#1a4dc2" }}>{proj.websiteLabel}</a>
                    </>
                  )}
                </span>
                {dateText && <span className="shrink-0">{dateText}</span>}
              </div>
              {descriptions.map((desc) =>
                desc.value ? <BulletItem key={desc.id}>{desc.value}</BulletItem> : null
              )}
            </div>
          </PageBreakAvoid>
        );
      })}
    </section>
  );
}

function SkillsBlock({ items, lang, fontFamily }: { items: SkillGroup[]; lang: ResumeLanguage; fontFamily: string }) {
  if (items.length === 0) return null;
  return (
    <section className="mb-2">
      {items.map((group, index) => (
        <PageBreakAvoid key={group.id}>
          {index === 0 && <SectionTitle type="skills" lang={lang} fontFamily={fontFamily} />}
          <div style={{ ...LINE_STYLE, paddingLeft: 0 }}>
            {group.category && <><span style={boldFontStyle(lang, fontFamily)}>{group.category}:</span>{" "}</>}
            {group.items}
          </div>
        </PageBreakAvoid>
      ))}
    </section>
  );
}

function AwardsBlock({ items, lang, fontFamily }: { items: AwardItem[]; lang: ResumeLanguage; fontFamily: string }) {
  if (items.length === 0) return null;
  return (
    <section className="mb-2">
      {items.map((item, index) => (
        <PageBreakAvoid key={item.id} style={index > 0 ? { marginTop: "2px" } : undefined}>
          {index === 0 && <SectionTitle type="awards" lang={lang} fontFamily={fontFamily} />}
          <div className="flex items-baseline justify-between gap-2" style={{ ...LINE_STYLE, paddingLeft: 0, fontFamily }}>
            <span>{item.award}</span>
            {item.date && <span className="shrink-0">{item.date}</span>}
          </div>
        </PageBreakAvoid>
      ))}
    </section>
  );
}

/* ---- Section renderer (respects content.sections order) ---- */

type SectionRenderer = (content: ResumeContent, lang: ResumeLanguage, fontFamily: string) => React.ReactNode;

const SECTION_RENDERERS: Record<SectionType, SectionRenderer> = {
  summary: (c, l, f) => <SummaryBlock key="summary" summary={c.summary ?? ""} lang={l} fontFamily={f} />,
  education: (c, l, f) => <EducationBlock key="education" items={c.education} lang={l} fontFamily={f} />,
  experience: (c, l, f) => <ExperienceBlock key="experience" items={c.experience} lang={l} fontFamily={f} />,
  projects: (c, l, f) => <ProjectsBlock key="projects" items={c.projects} lang={l} fontFamily={f} />,
  skills: (c, l, f) => <SkillsBlock key="skills" items={c.skills} lang={l} fontFamily={f} />,
  awards: (c, l, f) => <AwardsBlock key="awards" items={c.awards ?? []} lang={l} fontFamily={f} />,
};

/* ---- Main template ---- */

export function GeneralTemplate({ content, language = "en" }: AcademicTemplateProps) {
  const activeSections = content.sections ?? [];
  const hasContent = content.personal.fullName || activeSections.length > 0;
  const fontFamily = getFontFamily(language);

  return (
    <div
      data-cv-root
      className="relative bg-white text-black"
      style={{
        width: "794px",
        minHeight: "1123px",
        padding: "48px",
        fontFamily,
      }}
    >
      <PersonalHeader personal={content.personal} fontFamily={fontFamily} language={language} />

      {!hasContent && (
        <p className="mt-24 text-center text-sm text-gray-400">
          Fill in the form on the left to see your resume here.
        </p>
      )}

      {activeSections.map((type) => SECTION_RENDERERS[type](content, language, fontFamily))}
    </div>
  );
}
