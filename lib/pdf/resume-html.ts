/**
 * Renders ResumeContent to a self-contained HTML document for PDF/PNG generation.
 * Mirrors AcademicTemplate layout with all styles inlined (no Tailwind dependency).
 */

import type {
  ResumeContent,
  ResumeLanguage,
  ContactField,
  EducationItem,
  ExperienceItem,
  ProjectItem,
  SkillGroup,
  SectionType,
} from "@/lib/types/resume";

/* ---- constants ---- */

const FONT_EN = "'Times New Roman', SimSun, serif";
const FONT_ZH = "'Times New Roman', SimSun, serif";
const BODY_SIZE = "11pt";
const NAME_SIZE = "20pt";
const LINK_COLOR = "#1a4dc2";
const LETTER_SPACING = "-0.01em";

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

function getFontFamily(lang: ResumeLanguage): string {
  return lang === "zh" ? FONT_ZH : FONT_EN;
}

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

/* ---- helpers ---- */

function esc(text: unknown): string {
  const s = typeof text === "string" ? text : String(text ?? "");
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatContact(field: ContactField): string {
  switch (field.type) {
    case "email":
      return `<a href="mailto:${esc(field.value)}" style="color:${LINK_COLOR};text-decoration:none">${esc(field.value)}</a>`;
    case "phone":
      return esc(`${field.countryCode ?? ""} ${field.value}`.trim());
    case "location":
      return esc(field.value);
    case "website":
      return `<a href="${esc(field.value)}" style="color:${LINK_COLOR};text-decoration:none">${esc(field.label || field.value)}</a>`;
    default:
      return esc(field.value);
  }
}

function bulletItem(text: string): string {
  return `<div style="font-size:${BODY_SIZE};line-height:13pt;margin-top:0.15pt;margin-bottom:0;display:flex;align-items:baseline;letter-spacing:${LETTER_SPACING}">
    <span style="margin-left:0.2cm;width:0.4cm;flex-shrink:0;font-size:11pt">●</span>
    <span style="flex:1">${esc(text)}</span>
  </div>`;
}

function flushRow(left: string, right: string, leftBold = false, rightBold = false): string {
  const ls = leftBold ? "font-weight:bold;" : "";
  const rs = rightBold ? "font-weight:bold;" : "";
  return `<div style="font-size:${BODY_SIZE};line-height:13pt;margin-top:0.15pt;margin-bottom:0;padding-left:0;letter-spacing:${LETTER_SPACING};display:flex;justify-content:space-between;align-items:baseline;gap:0.5em">
    <span style="${ls}">${left}</span>
    <span style="flex-shrink:0;${rs}">${right}</span>
  </div>`;
}

function sectionTitle(type: SectionType, lang: ResumeLanguage, fontFamily: string): string {
  const title = getSectionTitle(type, lang);
  const textTransform = lang === "en" ? "text-transform:uppercase;" : "";
  return `<div style="margin-bottom:4px">
    <h2 style="font-size:${BODY_SIZE};font-family:${fontFamily};font-weight:bold;${textTransform}letter-spacing:normal;margin:0">${esc(title)}</h2>
    <div style="margin-top:2px;border-top:1px solid black"></div>
  </div>`;
}

/* ---- section renderers ---- */

function renderPersonalHeader(personal: ResumeContent["personal"], fontFamily: string): string {
  const contacts = personal.contacts ?? [];
  let html = `<div style="margin-bottom:8px;text-align:center">`;
  html += `<h1 style="font-size:${NAME_SIZE};font-family:${fontFamily};font-weight:bold;line-height:1.1;margin:0">${esc(personal.fullName || "Your Name")}</h1>`;
  if (contacts.length > 0) {
    html += `<p style="font-size:${BODY_SIZE};margin:4px 0 0 0">${contacts.map(formatContact).join(" | ")}</p>`;
  }
  html += `</div>`;
  return html;
}

function renderEducation(items: EducationItem[], lang: ResumeLanguage, fontFamily: string): string {
  if (items.length === 0) return "";
  let html = `<section style="margin-bottom:8px">${sectionTitle("education", lang, fontFamily)}<div>`;
  for (const edu of items) {
    const extraFields = edu.extraFields ?? [];
    const dateText = [edu.startDate, edu.endDate].filter(Boolean).join(" – ");

    let degreeLine: string;
    if (lang === "zh") {
      const combined = [edu.degree, edu.field].filter(Boolean).join(", ");
      degreeLine = combined ? `学位: ${combined}` : "";
    } else {
      const combined = [edu.degree, edu.field].filter(Boolean).join(" ");
      degreeLine = combined ? `Degree: ${combined}` : "";
    }

    html += `<div style="margin-bottom:6px">`;
    html += flushRow(esc(edu.institution), esc(edu.location), true, true);
    if (degreeLine) {
      html += `<div style="font-size:${BODY_SIZE};line-height:13pt;margin-top:0.15pt;margin-bottom:0;display:flex;align-items:baseline;letter-spacing:${LETTER_SPACING}">
        <span style="margin-left:0.2cm;width:0.4cm;flex-shrink:0;font-size:11pt">●</span>
        <span style="flex:1;display:flex;justify-content:space-between;gap:0.5em">
          <span>${esc(degreeLine)}</span>
          ${dateText ? `<span style="flex-shrink:0">${esc(dateText)}</span>` : ""}
        </span>
      </div>`;
    }
    for (const ef of extraFields) {
      html += bulletItem(`${getExtraFieldLabel(ef.label, lang)}: ${ef.value}`);
    }
    html += `</div>`;
  }
  html += `</div></section>`;
  return html;
}

function renderExperience(items: ExperienceItem[], lang: ResumeLanguage, fontFamily: string): string {
  if (items.length === 0) return "";
  let html = `<section style="margin-bottom:8px">${sectionTitle("experience", lang, fontFamily)}<div>`;
  for (const exp of items) {
    const descriptions = exp.descriptions ?? [];
    const dateText = [exp.startDate, exp.endDate].filter(Boolean).join(" – ");

    html += `<div style="margin-bottom:6px">`;
    html += flushRow(esc(exp.company), esc(exp.location), true, true);
    if (exp.position) {
      html += flushRow(esc(exp.position), dateText ? esc(dateText) : "");
    }
    for (const desc of descriptions) {
      if (desc.value) html += bulletItem(desc.value);
    }
    html += `</div>`;
  }
  html += `</div></section>`;
  return html;
}

function renderProjects(items: ProjectItem[], lang: ResumeLanguage, fontFamily: string): string {
  if (items.length === 0) return "";
  let html = `<section style="margin-bottom:8px">${sectionTitle("projects", lang, fontFamily)}<div>`;
  for (const proj of items) {
    const descriptions = proj.descriptions ?? [];
    const dateText = [proj.startDate, proj.endDate].filter(Boolean).join(" – ");
    const hasWebsite = proj.websiteLabel && proj.websiteUrl;

    let nameHtml = `<span style="font-weight:bold">${esc(proj.name)}</span>`;
    if (hasWebsite) {
      nameHtml += ` | <a href="${esc(proj.websiteUrl)}" style="color:${LINK_COLOR};text-decoration:none">${esc(proj.websiteLabel)}</a>`;
    }

    html += `<div style="margin-bottom:6px">`;
    html += `<div style="font-size:${BODY_SIZE};line-height:13pt;margin-top:0.15pt;margin-bottom:0;padding-left:0;letter-spacing:${LETTER_SPACING};display:flex;justify-content:space-between;align-items:baseline;gap:0.5em">
      <span>${nameHtml}</span>
      ${dateText ? `<span style="flex-shrink:0">${esc(dateText)}</span>` : ""}
    </div>`;
    for (const desc of descriptions) {
      if (desc.value) html += bulletItem(desc.value);
    }
    html += `</div>`;
  }
  html += `</div></section>`;
  return html;
}

function renderSkills(items: SkillGroup[], lang: ResumeLanguage, fontFamily: string): string {
  if (items.length === 0) return "";
  let html = `<section style="margin-bottom:8px">${sectionTitle("skills", lang, fontFamily)}<div>`;
  for (const group of items) {
    html += `<div style="font-size:${BODY_SIZE};line-height:13pt;margin-top:0.15pt;margin-bottom:0;padding-left:0;letter-spacing:${LETTER_SPACING}">
      <span style="font-weight:bold">${esc(group.category)}:</span> ${esc(group.items)}
    </div>`;
  }
  html += `</div></section>`;
  return html;
}

/* ---- section dispatch ---- */

const SECTION_RENDERERS: Record<SectionType, (content: ResumeContent, lang: ResumeLanguage, fontFamily: string) => string> = {
  education: (c, l, f) => renderEducation(c.education, l, f),
  experience: (c, l, f) => renderExperience(c.experience, l, f),
  projects: (c, l, f) => renderProjects(c.projects, l, f),
  skills: (c, l, f) => renderSkills(c.skills, l, f),
};

/* ---- main export ---- */

export function renderResumeHTML(content: ResumeContent, language: ResumeLanguage = "en"): string {
  const fontFamily = getFontFamily(language);
  const activeSections = content.sections ?? [];

  const body = [
    renderPersonalHeader(content.personal, fontFamily),
    ...activeSections.map((type) => SECTION_RENDERERS[type](content, language, fontFamily)),
  ].join("\n");

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    @page { size: A4; margin: 0; }
    body {
      width: 210mm;
      min-height: 297mm;
      font-family: ${fontFamily};
      color: black;
      background: white;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
  </style>
</head>
<body>
  <div style="width:210mm;min-height:297mm;padding:1.27cm;font-family:${fontFamily}">
    ${body}
  </div>
</body>
</html>`;
}
