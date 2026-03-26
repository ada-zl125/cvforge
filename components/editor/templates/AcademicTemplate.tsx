"use client";

import type { ResumeContent, ContactField, EducationItem, ExperienceItem, ProjectItem, SkillGroup, SectionType } from "@/lib/types/resume";

interface AcademicTemplateProps {
  content: ResumeContent;
}

/* ------------------------------------------------------------------ */
/*  A4 page: 210mm × 297mm ≈ 794px × 1123px at 96 DPI                */
/*  Narrow margins: 1.27cm ≈ 48px                                     */
/*  Font: Times New Roman + SimSun (serif)                             */
/*  Name: 20pt bold, everything else: 11pt                             */
/* ------------------------------------------------------------------ */

const FONT_FAMILY = "'Times New Roman', SimSun, serif";
const BODY_SIZE = "11pt";
const NAME_SIZE = "20pt";

/** Common line style: spacing before 0.15pt, after 0pt, line-height 13pt, indent left 0.2cm */
const LINE_STYLE: React.CSSProperties = {
  fontSize: BODY_SIZE,
  lineHeight: "13pt",
  marginTop: "0.15pt",
  marginBottom: 0,
  paddingLeft: "0.2cm",
  paddingRight: 0,
  letterSpacing: "-0.01em",
};

/** Bullet container: flex row, bullet at 0.2cm, text at 0.6cm */
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

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-1">
      <h2 style={{ fontSize: BODY_SIZE, fontFamily: FONT_FAMILY }} className="font-bold uppercase tracking-normal">
        {children}
      </h2>
      <div className="mt-0.5 border-t border-black" />
    </div>
  );
}

function DateRange({ start, end }: { start: string; end: string }) {
  if (!start && !end) return null;
  return (
    <span className="shrink-0">
      {start}{start && end ? " – " : ""}{end}
    </span>
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

function BulletList({ text }: { text: string }) {
  const lines = text.split("\n").filter(Boolean);
  if (lines.length === 0) return null;
  return (
    <div>
      {lines.map((line, i) => (
        <BulletItem key={i}>{line.replace(/^[-•]\s*/, "")}</BulletItem>
      ))}
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

function PersonalHeader({ personal }: { personal: ResumeContent["personal"] }) {
  const contacts = personal.contacts ?? [];
  return (
    <div className="mb-2 text-center">
      <h1 className="font-bold leading-tight" style={{ fontSize: NAME_SIZE, fontFamily: FONT_FAMILY }}>
        {personal.fullName || "Your Name"}
      </h1>
      {contacts.length > 0 && (
        <p className="mt-1" style={{ fontSize: BODY_SIZE }}>
          {contacts.map((field, i) => (
            <span key={field.id}>
              {i > 0 && " | "}
              {formatContact(field)}
            </span>
          ))}
        </p>
      )}
    </div>
  );
}

/* ---- Section blocks ---- */

function EducationBlock({ items }: { items: EducationItem[] }) {
  if (items.length === 0) return null;
  return (
    <section className="mb-2">
      <SectionTitle>Education</SectionTitle>
      <div className="space-y-1.5">
        {items.map((edu) => {
          const extraFields = edu.extraFields ?? [];
          const degreeText = [edu.degree, edu.field].filter(Boolean).join(" ");
          const dateText = [edu.startDate, edu.endDate].filter(Boolean).join(" – ");

          return (
            <div key={edu.id}>
              {/* Row 1: Institution (left, bold) | Location (right, bold) — flush left */}
              <div className="flex items-baseline justify-between gap-2" style={{ ...LINE_STYLE, paddingLeft: 0 }}>
                <span className="font-bold">{edu.institution}</span>
                <span className="shrink-0 font-bold">{edu.location}</span>
              </div>
              {/* Row 2: bullet • Degree field (left) | date range (right) */}
              {degreeText && (
                <div style={BULLET_ROW_STYLE}>
                  <span style={BULLET_DOT_STYLE}>●</span>
                  <span style={{ flex: 1, display: "flex", justifyContent: "space-between", gap: "0.5em" }}>
                    <span>Degree: {degreeText}</span>
                    {dateText && <span className="shrink-0">{dateText}</span>}
                  </span>
                </div>
              )}
              {/* Extra fields as bullet list */}
              {extraFields.map((ef) => (
                <BulletItem key={ef.id}>{ef.label}: {ef.value}</BulletItem>
              ))}
            </div>
          );
        })}
      </div>
    </section>
  );
}

function ExperienceBlock({ items }: { items: ExperienceItem[] }) {
  if (items.length === 0) return null;
  return (
    <section className="mb-2">
      <SectionTitle>Experience</SectionTitle>
      <div className="space-y-1.5">
        {items.map((exp) => {
          const descriptions = exp.descriptions ?? [];
          const dateText = [exp.startDate, exp.endDate].filter(Boolean).join(" – ");

          return (
            <div key={exp.id}>
              {/* Row 1: Company (left, bold) | Location (right, bold) — flush left */}
              <div className="flex items-baseline justify-between gap-2" style={{ ...LINE_STYLE, paddingLeft: 0 }}>
                <span className="font-bold">{exp.company}</span>
                <span className="shrink-0 font-bold">{exp.location}</span>
              </div>
              {/* Row 2: Position (left) | date range (right) — flush left */}
              {exp.position && (
                <div className="flex items-baseline justify-between gap-2" style={{ ...LINE_STYLE, paddingLeft: 0 }}>
                  <span>{exp.position}</span>
                  {dateText && <span className="shrink-0">{dateText}</span>}
                </div>
              )}
              {/* Description bullet items */}
              {descriptions.map((desc) =>
                desc.value ? <BulletItem key={desc.id}>{desc.value}</BulletItem> : null
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

function ProjectsBlock({ items }: { items: ProjectItem[] }) {
  if (items.length === 0) return null;
  return (
    <section className="mb-2">
      <SectionTitle>Projects</SectionTitle>
      <div className="space-y-1.5">
        {items.map((proj) => {
          const descriptions = proj.descriptions ?? [];
          const dateText = [proj.startDate, proj.endDate].filter(Boolean).join(" – ");
          const hasWebsite = proj.websiteLabel && proj.websiteUrl;

          return (
            <div key={proj.id}>
              {/* Row 1: Project Name [| Website] (left, bold) | date range (right) — flush left */}
              <div className="flex items-baseline justify-between gap-2" style={{ ...LINE_STYLE, paddingLeft: 0 }}>
                <span>
                  <span className="font-bold">{proj.name}</span>
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
                desc.value ? <BulletItem key={desc.id}>{desc.value}</BulletItem> : null
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

function SkillsBlock({ items }: { items: SkillGroup[] }) {
  if (items.length === 0) return null;
  return (
    <section className="mb-2">
      <SectionTitle>Skills</SectionTitle>
      <div>
        {items.map((group) => (
          <div key={group.id} style={{ ...LINE_STYLE, paddingLeft: 0 }}>
            <span className="font-bold">{group.category}:</span>{" "}
            {group.items}
          </div>
        ))}
      </div>
    </section>
  );
}

/* ---- Section renderer (respects content.sections order) ---- */

const SECTION_RENDERERS: Record<SectionType, (content: ResumeContent) => React.ReactNode> = {
  education: (c) => <EducationBlock key="education" items={c.education} />,
  experience: (c) => <ExperienceBlock key="experience" items={c.experience} />,
  projects: (c) => <ProjectsBlock key="projects" items={c.projects} />,
  skills: (c) => <SkillsBlock key="skills" items={c.skills} />,
};

/* ---- Main template ---- */

export function AcademicTemplate({ content }: AcademicTemplateProps) {
  const activeSections = content.sections ?? [];
  const hasContent = content.personal.fullName || activeSections.length > 0;

  return (
    <div
      className="relative bg-white text-black"
      style={{
        width: "794px",
        minHeight: "1123px",
        padding: "48px",
        fontFamily: FONT_FAMILY,
      }}
    >
      <PersonalHeader personal={content.personal} />

      {!hasContent && (
        <p className="mt-24 text-center text-sm text-gray-400">
          Fill in the form on the left to see your resume here.
        </p>
      )}

      {activeSections.map((type) => SECTION_RENDERERS[type](content))}
    </div>
  );
}
