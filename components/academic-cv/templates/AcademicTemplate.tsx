"use client";

import { PageBreakAvoid } from "@/components/shared/PageBreakAvoid";
import { BulletItem } from "@/components/shared/BulletItem";
import {
  BODY_SIZE, SECTION_TITLE_SIZE, NAME_SIZE,
  LINE_STYLE,
  getFontFamily, boldFontStyle,
} from "@/lib/template-styles";
import type {
  AcademicCVContent,
  AcademicSectionType,
  ResumeLanguage,
  AcademicEducationItem,
  AcademicExperienceItem,
  TeachingItem,
  PublicationItem,
  PresentationItem,
  GrantAwardItem,
  ServiceItem,
  ReferenceItem,
  AcademicEducationExtraFieldType,
} from "@/lib/types/academic-cv";
import type { ContactField, SkillGroup } from "@/lib/types/resume";
import { formatDegreeField } from "@/lib/json-utils";

const SECTION_TITLES_ZH: Record<AcademicSectionType, string> = {
  researchInterests:       "研究兴趣",
  education:               "教育经历",
  researchExperience:      "研究经历",
  teachingExperience:      "教学经历",
  industryExperience:      "工作经历",
  publications:            "学术成果",
  manuscriptsUnderReview:  "在投论文",
  conferencePresentations: "学术报告",
  grantsAndAwards:         "荣誉奖项",
  professionalService:     "学术服务",
  technicalSkills:         "专业技能",
  references:              "推荐人列表",
};

const SECTION_TITLES_EN: Record<AcademicSectionType, string> = {
  researchInterests:       "Research Interests",
  education:               "Education",
  researchExperience:      "Research Experience",
  teachingExperience:      "Teaching Experience",
  industryExperience:      "Industry Experience",
  publications:            "Publications",
  manuscriptsUnderReview:  "Manuscripts under Review",
  conferencePresentations: "Conference Presentations",
  grantsAndAwards:         "Grants & Awards",
  professionalService:     "Professional Service",
  technicalSkills:         "Technical Skills",
  references:              "Referees",
};

/* ---- Helpers ---- */

function SectionTitle({ type, lang, fontFamily }: { type: AcademicSectionType; lang: ResumeLanguage; fontFamily: string }) {
  const title = lang === "zh" ? SECTION_TITLES_ZH[type] : SECTION_TITLES_EN[type];
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

/* ---- Contact rendering (copied from GeneralTemplate) ---- */

function formatContact(field: ContactField): React.ReactNode {
  switch (field.type) {
    case "email":
      return <a href={`mailto:${field.value}`} style={{ color: "#1a4dc2" }}>{field.value}</a>;
    case "phone":
      return `${field.countryCode ?? ""} ${field.value}`.trim();
    case "location":
    case "addressLine1":
    case "addressLine2":
    case "addressLine3":
      return field.value;
    case "website":
      return <a href={field.value} style={{ color: "#1a4dc2" }}>{field.label || field.value}</a>;
    default:
      return field.value;
  }
}

/* ---- Personal header (same as GeneralTemplate) ---- */

function PersonalHeader({ personal, fontFamily, language }: { personal: AcademicCVContent["personal"]; fontFamily: string; language: ResumeLanguage }) {
  const contacts = personal.contacts ?? [];
  const hasPhoto = !!personal.photo;

  const ADDRESS_TYPES = ["location", "addressLine1", "addressLine2", "addressLine3"] as const;
  const addressContacts = contacts.filter(c => (ADDRESS_TYPES as readonly string[]).includes(c.type));
  const otherContacts = contacts.filter(c => !(ADDRESS_TYPES as readonly string[]).includes(c.type));

  const nameEl = (
    <h1 className="leading-tight" style={{ fontSize: NAME_SIZE, ...boldFontStyle(language, fontFamily) }}>
      {personal.fullName || (language === "zh" ? "姓名" : "Your Name")}
    </h1>
  );

  const addressEl = addressContacts.length > 0 && (
    <div style={{ fontSize: BODY_SIZE }}>
      {addressContacts.map(c => c.value.trim() && <p key={c.id}>{formatContact(c)}</p>)}
    </div>
  );

  if (hasPhoto) {
    const mainOthers = otherContacts.filter(c => c.type !== "website");
    const websites = otherContacts.filter(c => c.type === "website");
    const contactsEl = otherContacts.length > 0 && (
      <div style={{ fontSize: BODY_SIZE }}>
        {mainOthers.length > 0 && (
          <div>{mainOthers.map((f, i) => <span key={f.id}>{i > 0 && " | "}{formatContact(f)}</span>)}</div>
        )}
        {websites.length > 0 && (
          <div>{websites.map((f, i) => <span key={f.id}>{i > 0 && " | "}{formatContact(f)}</span>)}</div>
        )}
      </div>
    );
    return (
      <div className="relative mb-1" style={{ paddingRight: "90px" }}>
        {nameEl}
        <div className="mt-1">{addressEl}{contactsEl}</div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={personal.photo} alt="" style={{ position: "absolute", top: "50%", transform: "translateY(-50%)", right: 0, width: "74px", height: "92px", objectFit: "cover", borderRadius: "2px" }} />
      </div>
    );
  }

  const contactsEl = otherContacts.length > 0 && (
    <p style={{ fontSize: BODY_SIZE }}>
      {otherContacts.map((f, i) => <span key={f.id}>{i > 0 && " | "}{formatContact(f)}</span>)}
    </p>
  );

  return (
    <div className="mb-2 text-center">
      {nameEl}
      <div className="mt-1">{addressEl}{contactsEl}</div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Section blocks                                                      */
/* ------------------------------------------------------------------ */

function ResearchInterestsBlock({ value, lang, fontFamily }: { value: string; lang: ResumeLanguage; fontFamily: string }) {
  if (!value.trim()) return null;
  return (
    <PageBreakAvoid className="mb-2">
      <SectionTitle type="researchInterests" lang={lang} fontFamily={fontFamily} />
      <p style={{ ...LINE_STYLE, paddingLeft: 0, textAlign: "justify" }}>{value}</p>
    </PageBreakAvoid>
  );
}

function AcademicEducationBlock({ items, lang, fontFamily }: { items: AcademicEducationItem[]; lang: ResumeLanguage; fontFamily: string }) {
  if (items.length === 0) return null;
  return (
    <section className="mb-2">
      {items.map((edu, index) => {
        const dateText = [edu.startDate, edu.endDate].filter(Boolean).join(" – ");
        const degreeLine = formatDegreeField(edu.degree, edu.field, lang);
        return (
          <PageBreakAvoid key={edu.id} style={index > 0 ? { marginTop: "6px" } : undefined}>
            {index === 0 && <SectionTitle type="education" lang={lang} fontFamily={fontFamily} />}
            <div>
              <div className="flex items-baseline justify-between gap-2" style={{ ...LINE_STYLE, paddingLeft: 0 }}>
                <span style={boldFontStyle(lang, fontFamily)}>{edu.institution}</span>
                <span className="shrink-0" style={boldFontStyle(lang, fontFamily)}>{edu.location}</span>
              </div>
              {degreeLine && (
                <div className="flex items-baseline justify-between gap-2" style={{ ...LINE_STYLE, paddingLeft: 0 }}>
                  <span>{degreeLine}</span>
                  {dateText && <span className="shrink-0">{dateText}</span>}
                </div>
              )}
              {(edu.extraFields ?? []).map(ef => {
                if (!ef.value) return null;
                const PREFIXES: Record<AcademicEducationExtraFieldType, { en: string; zh: string }> = {
                  grade:         { en: "Grade: ",          zh: "成绩：" },
                  researchField: { en: "Research Field: ", zh: "研究方向：" },
                  awards:        { en: "Awards: ",         zh: "获奖情况：" },
                  custom:        { en: "",                 zh: "" },
                };
                const prefix = ef.type === "custom"
                  ? (ef.label ? `${ef.label}: ` : "")
                  : PREFIXES[ef.type][lang === "zh" ? "zh" : "en"];
                return <BulletItem key={ef.id}>{prefix}{ef.value}</BulletItem>;
              })}
            </div>
          </PageBreakAvoid>
        );
      })}
    </section>
  );
}

function ExperienceLikeBlock({ items, type, lang, fontFamily }: { items: AcademicExperienceItem[]; type: AcademicSectionType; lang: ResumeLanguage; fontFamily: string }) {
  if (items.length === 0) return null;
  return (
    <section className="mb-2">
      {items.map((exp, index) => {
        const descriptions = exp.descriptions ?? [];
        const dateText = [exp.startDate, exp.endDate].filter(Boolean).join(" – ");
        return (
          <PageBreakAvoid key={exp.id} style={index > 0 ? { marginTop: "6px" } : undefined}>
            {index === 0 && <SectionTitle type={type} lang={lang} fontFamily={fontFamily} />}
            <div>
              <div className="flex items-baseline justify-between gap-2" style={{ ...LINE_STYLE, paddingLeft: 0 }}>
                <span style={boldFontStyle(lang, fontFamily)}>{exp.organization}</span>
                <span className="shrink-0" style={boldFontStyle(lang, fontFamily)}>{exp.location}</span>
              </div>
              {(exp.role || exp.researchGroup || exp.department) && (
                <div className="flex items-baseline justify-between gap-2" style={{ ...LINE_STYLE, paddingLeft: 0 }}>
                  <span>
                    {[exp.role, exp.researchGroup, exp.department].filter(Boolean).join(" | ")}
                  </span>
                  {dateText && <span className="shrink-0">{dateText}</span>}
                </div>
              )}
              {descriptions.map(desc => desc.value ? <BulletItem key={desc.id}>{desc.value}</BulletItem> : null)}
            </div>
          </PageBreakAvoid>
        );
      })}
    </section>
  );
}

function TeachingBlock({ items, lang, fontFamily }: { items: TeachingItem[]; lang: ResumeLanguage; fontFamily: string }) {
  if (items.length === 0) return null;
  return (
    <section className="mb-2">
      {items.map((item, index) => {
        const descriptions = item.descriptions ?? [];
        const dateText = [item.startDate, item.endDate].filter(Boolean).join(" – ");
        return (
          <PageBreakAvoid key={item.id} style={index > 0 ? { marginTop: "6px" } : undefined}>
            {index === 0 && <SectionTitle type="teachingExperience" lang={lang} fontFamily={fontFamily} />}
            <div>
              <div className="flex items-baseline justify-between gap-2" style={{ ...LINE_STYLE, paddingLeft: 0 }}>
                <span style={boldFontStyle(lang, fontFamily)}>{item.institution}</span>
                <span className="shrink-0" style={boldFontStyle(lang, fontFamily)}>{item.location}</span>
              </div>
              {item.role && (
                <div className="flex items-baseline justify-between gap-2" style={{ ...LINE_STYLE, paddingLeft: 0 }}>
                  <span>{item.role}</span>
                  {dateText && <span className="shrink-0">{dateText}</span>}
                </div>
              )}
              {item.course && (
                <BulletItem>{lang === "zh" ? "课程：" : "Course: "}{item.course}</BulletItem>
              )}
              {descriptions.map(desc => desc.value ? <BulletItem key={desc.id}>{desc.value}</BulletItem> : null)}
            </div>
          </PageBreakAvoid>
        );
      })}
    </section>
  );
}

function PublicationsBlock({ items, type, lang, fontFamily }: { items: PublicationItem[]; type: AcademicSectionType; lang: ResumeLanguage; fontFamily: string }) {
  if (items.length === 0) return null;
  return (
    <section className="mb-2">
      {items.map((item, index) =>
        item.citation ? (
          <PageBreakAvoid key={item.id}>
            {index === 0 && <SectionTitle type={type} lang={lang} fontFamily={fontFamily} />}
            <BulletItem>{item.citation}</BulletItem>
          </PageBreakAvoid>
        ) : null
      )}
    </section>
  );
}

function PresentationsBlock({ items, lang, fontFamily }: { items: PresentationItem[]; lang: ResumeLanguage; fontFamily: string }) {
  if (items.length === 0) return null;
  return (
    <section className="mb-2">
      {items.map((item, index) => {
        const row2Left = [item.type, item.title].filter(Boolean).join(" | ");
        return (
          <PageBreakAvoid key={item.id} style={index > 0 ? { marginTop: "4px" } : undefined}>
            {index === 0 && <SectionTitle type="conferencePresentations" lang={lang} fontFamily={fontFamily} />}
            <div>
              <div className="flex items-baseline justify-between gap-2" style={{ ...LINE_STYLE, paddingLeft: 0 }}>
                <span style={boldFontStyle(lang, fontFamily)}>{item.event}</span>
                {item.location && <span className="shrink-0" style={boldFontStyle(lang, fontFamily)}>{item.location}</span>}
              </div>
              {(row2Left || item.date) && (
                <div className="flex items-baseline justify-between gap-2" style={{ ...LINE_STYLE, paddingLeft: 0 }}>
                  <span>{row2Left}</span>
                  {item.date && <span className="shrink-0">{item.date}</span>}
                </div>
              )}
            </div>
          </PageBreakAvoid>
        );
      })}
    </section>
  );
}

function GrantsAwardsBlock({ items, lang, fontFamily }: { items: GrantAwardItem[]; lang: ResumeLanguage; fontFamily: string }) {
  if (items.length === 0) return null;
  return (
    <section className="mb-2">
      {items.map((item, index) => (
        <PageBreakAvoid key={item.id} style={index > 0 ? { marginTop: "2px" } : undefined}>
          {index === 0 && <SectionTitle type="grantsAndAwards" lang={lang} fontFamily={fontFamily} />}
          <div className="flex items-baseline justify-between gap-2" style={{ ...LINE_STYLE, paddingLeft: 0, fontFamily }}>
            <span>{item.title}</span>
            {item.date && <span className="shrink-0">{item.date}</span>}
          </div>
        </PageBreakAvoid>
      ))}
    </section>
  );
}

function ServiceBlock({ items, lang, fontFamily }: { items: ServiceItem[]; lang: ResumeLanguage; fontFamily: string }) {
  if (items.length === 0) return null;
  return (
    <section className="mb-2">
      {items.map((item, index) => {
        const roleOrg = [item.role, item.organization].filter(Boolean).join(", ");
        return (
          <PageBreakAvoid key={item.id} style={index > 0 ? { marginTop: "2px" } : undefined}>
            {index === 0 && <SectionTitle type="professionalService" lang={lang} fontFamily={fontFamily} />}
            <div className="flex items-baseline justify-between gap-2" style={{ ...LINE_STYLE, paddingLeft: 0, fontFamily }}>
              <span>{roleOrg}</span>
              {item.date && <span className="shrink-0">{item.date}</span>}
            </div>
          </PageBreakAvoid>
        );
      })}
    </section>
  );
}

function TechnicalSkillsBlock({ items, lang, fontFamily }: { items: SkillGroup[]; lang: ResumeLanguage; fontFamily: string }) {
  if (items.length === 0) return null;
  return (
    <section className="mb-2">
      {items.map((group, index) => (
        <PageBreakAvoid key={group.id}>
          {index === 0 && <SectionTitle type="technicalSkills" lang={lang} fontFamily={fontFamily} />}
          <div style={{ ...LINE_STYLE, paddingLeft: 0 }}>
            {group.category && <><span style={boldFontStyle(lang, fontFamily)}>{group.category}:</span>{" "}</>}
            {group.items}
          </div>
        </PageBreakAvoid>
      ))}
    </section>
  );
}

function ReferencesBlock({ items, lang, fontFamily }: { items: ReferenceItem[]; lang: ResumeLanguage; fontFamily: string }) {
  if (items.length === 0) return null;
  return (
    <section className="mb-2">
      {items.map((item, index) => {
        const titlePart = item.title ? `, ${item.title}` : "";
        const relPart = item.relationship ? ` (${item.relationship})` : "";
        const row1Suffix = titlePart + relPart;
        const contactParts = [
          item.phone ? `Phone: ${item.phone}` : null,
          item.email ? `Email: ${item.email}` : null,
        ].filter(Boolean).join(" | ");
        return (
          <PageBreakAvoid key={item.id} style={index > 0 ? { marginTop: "8px" } : undefined}>
            {index === 0 && <SectionTitle type="references" lang={lang} fontFamily={fontFamily} />}
            <div>
              <div style={{ ...LINE_STYLE, paddingLeft: 0 }}>
                <span style={boldFontStyle(lang, fontFamily)}>{item.name}</span>
                {row1Suffix && <span style={{ fontFamily }}>{row1Suffix}</span>}
              </div>
              {item.address && (
                <div style={{ ...LINE_STYLE, paddingLeft: 0, fontFamily }}>{item.address}</div>
              )}
              {contactParts && (
                <div style={{ ...LINE_STYLE, paddingLeft: 0, fontFamily }}>{contactParts}</div>
              )}
            </div>
          </PageBreakAvoid>
        );
      })}
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Section renderer map                                                */
/* ------------------------------------------------------------------ */

type SectionRenderer = (content: AcademicCVContent, lang: ResumeLanguage, fontFamily: string) => React.ReactNode;

const SECTION_RENDERERS: Record<AcademicSectionType, SectionRenderer> = {
  researchInterests:       (c, l, f) => <ResearchInterestsBlock key="researchInterests" value={c.researchInterests ?? ""} lang={l} fontFamily={f} />,
  education:               (c, l, f) => <AcademicEducationBlock key="education" items={c.education} lang={l} fontFamily={f} />,
  researchExperience:      (c, l, f) => <ExperienceLikeBlock key="researchExperience" items={c.researchExperience} type="researchExperience" lang={l} fontFamily={f} />,
  teachingExperience:      (c, l, f) => <TeachingBlock key="teachingExperience" items={c.teachingExperience} lang={l} fontFamily={f} />,
  industryExperience:      (c, l, f) => <ExperienceLikeBlock key="industryExperience" items={c.industryExperience} type="industryExperience" lang={l} fontFamily={f} />,
  publications:            (c, l, f) => <PublicationsBlock key="publications" items={c.publications} type="publications" lang={l} fontFamily={f} />,
  manuscriptsUnderReview:  (c, l, f) => <PublicationsBlock key="manuscriptsUnderReview" items={c.manuscriptsUnderReview} type="manuscriptsUnderReview" lang={l} fontFamily={f} />,
  conferencePresentations: (c, l, f) => <PresentationsBlock key="conferencePresentations" items={c.conferencePresentations} lang={l} fontFamily={f} />,
  grantsAndAwards:         (c, l, f) => <GrantsAwardsBlock key="grantsAndAwards" items={c.grantsAndAwards} lang={l} fontFamily={f} />,
  professionalService:     (c, l, f) => <ServiceBlock key="professionalService" items={c.professionalService} lang={l} fontFamily={f} />,
  technicalSkills:         (c, l, f) => <TechnicalSkillsBlock key="technicalSkills" items={c.technicalSkills} lang={l} fontFamily={f} />,
  references:              (c, l, f) => <ReferencesBlock key="references" items={c.references} lang={l} fontFamily={f} />,
};

/* ------------------------------------------------------------------ */
/*  Main template                                                       */
/* ------------------------------------------------------------------ */

interface AcademicTemplateProps {
  content: AcademicCVContent;
  language?: ResumeLanguage;
}

export function AcademicTemplate({ content, language = "en" }: AcademicTemplateProps) {
  const activeSections = content.sections ?? [];
  const hasContent = content.personal.fullName || activeSections.length > 0;
  const fontFamily = getFontFamily(language);

  return (
    <div
      data-cv-root
      className="relative bg-white text-black"
      style={{ width: "794px", minHeight: "1123px", paddingTop: "32px", paddingRight: "48px", paddingBottom: "48px", paddingLeft: "48px", fontFamily }}
    >
      <PersonalHeader personal={content.personal} fontFamily={fontFamily} language={language} />

      {!hasContent && (
        <p className="mt-24 text-center text-sm text-gray-400">
          Fill in the form on the left to see your CV here.
        </p>
      )}

      {activeSections.map(type => SECTION_RENDERERS[type](content, language, fontFamily))}
    </div>
  );
}
