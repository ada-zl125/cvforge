"use client";

import type { ResumeContent, ResumeLanguage, ContactField, EducationItem, ExperienceItem, ProjectItem, SkillGroup, SectionType } from "@/lib/types/resume";

interface AcademicTemplateProps {
  content: ResumeContent;
  language?: ResumeLanguage;
}

/* ------------------------------------------------------------------ */
/*  A4 page: 210mm × 297mm ≈ 794px × 1123px at 96 DPI                */
/*  Narrow margins: 1.27cm ≈ 48px                                     */
/*  EN: Times New Roman, serif; bold = weight 700                      */
/*  ZH body: Songti SC Regular (weight 400)                            */
/*  ZH bold: Songti SC Black (weight 900) — section titles, row-1      */
/*  Name: 20pt bold, everything else: 11pt                             */
/* ------------------------------------------------------------------ */

const FONT_EN = "'Times New Roman', SimSun, serif";
const FONT_ZH = "'Times New Roman', 'Songti SC', serif";
const BODY_SIZE = "11pt";
const SECTION_TITLE_SIZE = "12pt";
const NAME_SIZE = "20pt";

/* ---- Chinese section title mapping ---- */

const SECTION_TITLES_ZH: Record<SectionType, string> = {
  education: "教育经历",
  experience: "工作经历",
  projects: "项目经历",
  skills: "技能",
};

const SECTION_TITLES_EN: Record<SectionType, string> = {
  education: "Education",
  experience: "Experience",
  projects: "Projects",
  skills: "Skills",
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

function getFontFamily(lang: ResumeLanguage): string {
  return lang === "zh" ? FONT_ZH : FONT_EN;
}

/** Returns fontFamily + fontWeight for bold elements.
 *  ZH: Songti SC Black (900); EN: Times New Roman bold (700). */
function boldFontStyle(lang: ResumeLanguage, fontFamily: string): React.CSSProperties {
  return {
    fontFamily: lang === "zh" ? FONT_ZH : fontFamily,
    fontWeight: lang === "zh" ? 900 : 700,
  };
}

/* ---- Shared style builders ---- */

const LINE_STYLE: React.CSSProperties = {
  fontSize: BODY_SIZE,
  lineHeight: "13pt",
  marginTop: "0.15pt",
  marginBottom: 0,
  paddingLeft: "0.2cm",
  paddingRight: 0,
  letterSpacing: "-0.01em",
};

const BULLET_ROW_STYLE: React.CSSProperties = {
  fontSize: BODY_SIZE,
  lineHeight: "13pt",
  marginTop: "0.15pt",
  marginBottom: 0,
  display: "flex",
  alignItems: "baseline",
  letterSpacing: "-0.01em",
};

/** Bullet dot: sits at 0.2cm, occupies 0.4cm width so text starts at 0.6cm */
const BULLET_DOT_STYLE: React.CSSProperties = {
  marginLeft: "0.2cm",
  width: "0.4cm",
  flexShrink: 0,
  fontSize: "11pt",
};

/* ---- Shared helpers ---- */

function SectionTitle({ type, lang, fontFamily }: { type: SectionType; lang: ResumeLanguage; fontFamily: string }) {
  const title = getSectionTitle(type, lang);
  return (
    <div className="mb-1">
      <h2
        style={{ fontSize: SECTION_TITLE_SIZE, ...boldFontStyle(lang, fontFamily) }}
        className={`tracking-normal ${lang === "en" ? "uppercase" : ""}`}
      >
        {title}
      </h2>
      <div className="mt-0.5 border-t border-black" />
    </div>
  );
}

function BulletItem({ children }: { children: React.ReactNode }) {
  return (
    <div style={BULLET_ROW_STYLE}>
      <span style={BULLET_DOT_STYLE}>●</span>
      <span style={{ flex: 1 }}>{children}</span>
    </div>
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
      <SectionTitle type="education" lang={lang} fontFamily={fontFamily} />
      <div className="space-y-1.5">
        {items.map((edu) => {
          const extraFields = edu.extraFields ?? [];
          const dateText = [edu.startDate, edu.endDate].filter(Boolean).join(" – ");

          // Chinese: "学位: {degree}, {field}" e.g. "学位: 理学学士, 计算机科学与技术"
          // English: "Degree: {degree} {field}" e.g. "Degree: BSc Computer Science"
          let degreeLine: string;
          if (lang === "zh") {
            const combined = [edu.degree, edu.field].filter(Boolean).join(", ");
            degreeLine = combined ? `学位: ${combined}` : "";
          } else {
            const combined = [edu.degree, edu.field].filter(Boolean).join(" ");
            degreeLine = combined ? `Degree: ${combined}` : "";
          }

          return (
            <div key={edu.id}>
              {/* Row 1: Institution (left, bold) | Location (right, bold) */}
              <div className="flex items-baseline justify-between gap-2" style={{ ...LINE_STYLE, paddingLeft: 0 }}>
                <span style={boldFontStyle(lang, fontFamily)}>{edu.institution}</span>
                <span className="shrink-0" style={boldFontStyle(lang, fontFamily)}>{edu.location}</span>
              </div>
              {/* Row 2: bullet • Degree info (left) | date range (right) */}
              {degreeLine && (
                <div style={BULLET_ROW_STYLE}>
                  <span style={BULLET_DOT_STYLE}>●</span>
                  <span style={{ flex: 1, display: "flex", justifyContent: "space-between", gap: "0.5em" }}>
                    <span>{degreeLine}</span>
                    {dateText && <span className="shrink-0">{dateText}</span>}
                  </span>
                </div>
              )}
              {/* Extra fields as bullet list */}
              {extraFields.map((ef) => (
                <BulletItem key={ef.id} >{getExtraFieldLabel(ef.label, lang)}: {ef.value}</BulletItem>
              ))}
            </div>
          );
        })}
      </div>
    </section>
  );
}

function ExperienceBlock({ items, lang, fontFamily }: { items: ExperienceItem[]; lang: ResumeLanguage; fontFamily: string }) {
  if (items.length === 0) return null;
  return (
    <section className="mb-2">
      <SectionTitle type="experience" lang={lang} fontFamily={fontFamily} />
      <div className="space-y-1.5">
        {items.map((exp) => {
          const descriptions = exp.descriptions ?? [];
          const dateText = [exp.startDate, exp.endDate].filter(Boolean).join(" – ");

          return (
            <div key={exp.id}>
              {/* Row 1: Company (left, bold) | Location (right, bold) */}
              <div className="flex items-baseline justify-between gap-2" style={{ ...LINE_STYLE, paddingLeft: 0 }}>
                <span style={boldFontStyle(lang, fontFamily)}>{exp.company}</span>
                <span className="shrink-0" style={boldFontStyle(lang, fontFamily)}>{exp.location}</span>
              </div>
              {/* Row 2: Position (left) | date range (right) */}
              {exp.position && (
                <div className="flex items-baseline justify-between gap-2" style={{ ...LINE_STYLE, paddingLeft: 0 }}>
                  <span>{exp.position}</span>
                  {dateText && <span className="shrink-0">{dateText}</span>}
                </div>
              )}
              {/* Description bullet items */}
              {descriptions.map((desc) =>
                desc.value ? <BulletItem key={desc.id} >{desc.value}</BulletItem> : null
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

function ProjectsBlock({ items, lang, fontFamily }: { items: ProjectItem[]; lang: ResumeLanguage; fontFamily: string }) {
  if (items.length === 0) return null;
  return (
    <section className="mb-2">
      <SectionTitle type="projects" lang={lang} fontFamily={fontFamily} />
      <div className="space-y-1.5">
        {items.map((proj) => {
          const descriptions = proj.descriptions ?? [];
          const dateText = [proj.startDate, proj.endDate].filter(Boolean).join(" – ");
          const hasWebsite = proj.websiteLabel && proj.websiteUrl;

          return (
            <div key={proj.id}>
              {/* Row 1: Project Name [| Website] (left, bold) | date range (right) */}
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
              {/* Description bullet items */}
              {descriptions.map((desc) =>
                desc.value ? <BulletItem key={desc.id} >{desc.value}</BulletItem> : null
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

function SkillsBlock({ items, lang, fontFamily }: { items: SkillGroup[]; lang: ResumeLanguage; fontFamily: string }) {
  if (items.length === 0) return null;
  return (
    <section className="mb-2">
      <SectionTitle type="skills" lang={lang} fontFamily={fontFamily} />
      <div>
        {items.map((group) => (
          <div key={group.id} style={{ ...LINE_STYLE, paddingLeft: 0 }}>
            <span style={boldFontStyle(lang, fontFamily)}>{group.category}:</span>{" "}
            {group.items}
          </div>
        ))}
      </div>
    </section>
  );
}

/* ---- Section renderer (respects content.sections order) ---- */

type SectionRenderer = (content: ResumeContent, lang: ResumeLanguage, fontFamily: string) => React.ReactNode;

const SECTION_RENDERERS: Record<SectionType, SectionRenderer> = {
  education: (c, l, f) => <EducationBlock key="education" items={c.education} lang={l} fontFamily={f} />,
  experience: (c, l, f) => <ExperienceBlock key="experience" items={c.experience} lang={l} fontFamily={f} />,
  projects: (c, l, f) => <ProjectsBlock key="projects" items={c.projects} lang={l} fontFamily={f} />,
  skills: (c, l, f) => <SkillsBlock key="skills" items={c.skills} lang={l} fontFamily={f} />,
};

/* ---- Main template ---- */

export function GeneralTemplate({ content, language = "en" }: AcademicTemplateProps) {
  const activeSections = content.sections ?? [];
  const hasContent = content.personal.fullName || activeSections.length > 0;
  const fontFamily = getFontFamily(language);

  return (
    <div
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
