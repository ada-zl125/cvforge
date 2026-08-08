import { formatDegreeField } from "@/lib/json-utils";
import type {
  AcademicCVContent,
  AcademicEducationExtraFieldType,
  AcademicSectionType,
} from "@/lib/types/academic-cv";
import type { CoverLetterContent } from "@/lib/types/cover-letter";
import type {
  ContactField,
  PersonalInfo,
  ResumeContent,
  ResumeLanguage,
  SectionType,
} from "@/lib/types/resume";
import {
  PDF_BLUE,
  bulletBlock,
  groupBlock,
  rowBlock,
  sectionBlock,
  textBlock,
  textRun,
  type PdfBlock,
  type PdfHeaderBlock,
  type PdfTextRun,
} from "@/lib/pdf/layout";

const RESUME_TITLES_EN: Record<SectionType, string> = {
  summary: "Summary",
  education: "Education",
  experience: "Experience",
  projects: "Projects",
  skills: "Technical Skills",
  awards: "Awards",
};

const RESUME_TITLES_ZH: Record<SectionType, string> = {
  summary: "个人简介",
  education: "教育经历",
  experience: "工作经历",
  projects: "项目经历",
  skills: "专业技能",
  awards: "荣誉奖项",
};

const ACADEMIC_TITLES_EN: Record<AcademicSectionType, string> = {
  researchInterests: "Research Interests",
  education: "Education",
  researchExperience: "Research Experience",
  teachingExperience: "Teaching Experience",
  industryExperience: "Industry Experience",
  publications: "Publications",
  manuscriptsUnderReview: "Manuscripts under Review",
  conferencePresentations: "Conference Presentations",
  grantsAndAwards: "Grants & Awards",
  professionalService: "Professional Service",
  technicalSkills: "Technical Skills",
  references: "Referees",
};

const ACADEMIC_TITLES_ZH: Record<AcademicSectionType, string> = {
  researchInterests: "研究兴趣",
  education: "教育经历",
  researchExperience: "研究经历",
  teachingExperience: "教学经历",
  industryExperience: "工作经历",
  publications: "学术成果",
  manuscriptsUnderReview: "在投论文",
  conferencePresentations: "学术报告",
  grantsAndAwards: "荣誉奖项",
  professionalService: "学术服务",
  technicalSkills: "专业技能",
  references: "推荐人列表",
};

function dateRange(startDate: string, endDate: string): string {
  return [startDate, endDate].filter(Boolean).join(" - ");
}

function contactRun(field: ContactField): PdfTextRun | null {
  const value = field.value.trim();
  if (!value) return null;

  switch (field.type) {
    case "email":
      return textRun(value, { color: PDF_BLUE, link: `mailto:${value}` });
    case "phone": {
      const display = `${field.countryCode ?? ""} ${value}`.trim();
      const target = display.replace(/[^+\d]/g, "");
      return textRun(display, { link: target ? `tel:${target}` : undefined });
    }
    case "website":
      return textRun(field.label?.trim() || value, { color: PDF_BLUE, link: value });
    default:
      return textRun(value);
  }
}

function joinedContactRuns(fields: readonly ContactField[]): PdfTextRun[] {
  const runs = fields.map(contactRun).filter((run): run is PdfTextRun => !!run);
  return runs.flatMap((run, index) => index === 0 ? [run] : [textRun(" | "), run]);
}

function headerBlock(
  personal: PersonalInfo,
  language: ResumeLanguage,
  academic: boolean,
  photo?: Uint8Array,
): PdfHeaderBlock {
  const contacts = personal.contacts ?? [];
  const lines: PdfTextRun[][] = [];

  if (academic) {
    const addressTypes = new Set(["location", "addressLine1", "addressLine2", "addressLine3"]);
    const addressContacts = contacts.filter((contact) => addressTypes.has(contact.type));
    const otherContacts = contacts.filter((contact) => !addressTypes.has(contact.type));
    addressContacts.forEach((contact) => {
      const run = contactRun(contact);
      if (run) lines.push([run]);
    });

    const mainContacts = otherContacts.filter((contact) => contact.type !== "website");
    const websites = otherContacts.filter((contact) => contact.type === "website");
    const mainRuns = joinedContactRuns(mainContacts);
    const websiteRuns = joinedContactRuns(websites);
    if (mainRuns.length > 0) lines.push(mainRuns);
    if (websiteRuns.length > 0) lines.push(websiteRuns);
  } else {
    const mainContacts = contacts.filter((contact) => contact.type !== "website");
    const websites = contacts.filter((contact) => contact.type === "website");
    const mainRuns = joinedContactRuns(mainContacts);
    const websiteRuns = joinedContactRuns(websites);
    if (mainRuns.length > 0) lines.push(mainRuns);
    if (websiteRuns.length > 0) lines.push(websiteRuns);
  }

  return {
    kind: "header",
    name: personal.fullName || (language === "zh" ? "姓名" : "Your Name"),
    lines,
    align: photo ? "left" : "center",
    photo,
    gapAfter: photo ? 3 : 6,
  };
}

function sectionTitle(type: SectionType, language: ResumeLanguage): string {
  return language === "zh" ? RESUME_TITLES_ZH[type] : RESUME_TITLES_EN[type];
}

function academicTitle(type: AcademicSectionType, language: ResumeLanguage): string {
  return language === "zh" ? ACADEMIC_TITLES_ZH[type] : ACADEMIC_TITLES_EN[type];
}

function appendEntrySection(
  target: PdfBlock[],
  title: string,
  entries: PdfBlock[][],
  letterSpacing: number,
  gapBetween = 4.5,
): void {
  entries.forEach((entry, index) => {
    target.push(groupBlock(
      index === 0 ? [sectionBlock(title, letterSpacing), ...entry] : entry,
      { gapBefore: index === 0 ? 0 : gapBetween },
    ));
  });
  if (entries.length > 0) target.push({ kind: "spacer", height: 6 });
}

function resumeSummary(content: ResumeContent, language: ResumeLanguage): PdfBlock[] {
  const value = content.summary?.trim();
  if (!value) return [];
  return [groupBlock([
    sectionBlock(sectionTitle("summary", language), language === "en" ? 0.24 : 0),
    textBlock(value, { align: "justify" }),
  ], { gapAfter: 6 })];
}

function resumeEducation(content: ResumeContent, language: ResumeLanguage): PdfBlock[] {
  const blocks: PdfBlock[] = [];
  const entries = (content.education ?? []).map((item) => {
    const entry: PdfBlock[] = [
      rowBlock([textRun(item.institution, { bold: true })], [textRun(item.location, { bold: true })]),
    ];
    const degree = formatDegreeField(item.degree, item.field, language);
    if (degree) entry.push(rowBlock(degree, dateRange(item.startDate, item.endDate)));
    (item.extraFields ?? []).forEach((field) => {
      if (!field.value) return;
      const label = language === "zh"
        ? ({ Grade: "成绩", Awards: "获奖" }[field.label] ?? field.label)
        : field.label;
      entry.push(bulletBlock(`${label ? `${label}: ` : ""}${field.value}`));
    });
    return entry;
  });
  appendEntrySection(blocks, sectionTitle("education", language), entries, language === "en" ? 0.24 : 0);
  return blocks;
}

function resumeExperience(content: ResumeContent, language: ResumeLanguage): PdfBlock[] {
  const blocks: PdfBlock[] = [];
  const entries = (content.experience ?? []).map((item) => {
    const entry: PdfBlock[] = [
      rowBlock([textRun(item.company, { bold: true })], [textRun(item.location, { bold: true })]),
    ];
    if (item.position) entry.push(rowBlock(item.position, dateRange(item.startDate, item.endDate)));
    (item.descriptions ?? []).forEach((description) => {
      if (description.value) entry.push(bulletBlock(description.value));
    });
    return entry;
  });
  appendEntrySection(blocks, sectionTitle("experience", language), entries, language === "en" ? 0.24 : 0);
  return blocks;
}

function resumeProjects(content: ResumeContent, language: ResumeLanguage): PdfBlock[] {
  const blocks: PdfBlock[] = [];
  const entries = (content.projects ?? []).map((item) => {
    const left = [textRun(item.name, { bold: true })];
    if (item.websiteLabel && item.websiteUrl) {
      left.push(textRun(" | "), textRun(item.websiteLabel, { color: PDF_BLUE, link: item.websiteUrl }));
    }
    const entry: PdfBlock[] = [rowBlock(left, dateRange(item.startDate, item.endDate))];
    (item.descriptions ?? []).forEach((description) => {
      if (description.value) entry.push(bulletBlock(description.value));
    });
    return entry;
  });
  appendEntrySection(blocks, sectionTitle("projects", language), entries, language === "en" ? 0.24 : 0);
  return blocks;
}

function resumeSkills(content: ResumeContent, language: ResumeLanguage): PdfBlock[] {
  const blocks: PdfBlock[] = [];
  const entries = (content.skills ?? []).map((group) => {
    const runs: PdfTextRun[] = [];
    if (group.category) runs.push(textRun(`${group.category}:`, { bold: true }), textRun(" "));
    runs.push(textRun(group.items));
    return [{ kind: "text", runs } satisfies PdfBlock];
  });
  appendEntrySection(blocks, sectionTitle("skills", language), entries, language === "en" ? 0.24 : 0, 0);
  return blocks;
}

function resumeAwards(content: ResumeContent, language: ResumeLanguage): PdfBlock[] {
  const blocks: PdfBlock[] = [];
  const entries = (content.awards ?? []).map((item) => [rowBlock(item.award, item.date)]);
  appendEntrySection(blocks, sectionTitle("awards", language), entries, language === "en" ? 0.24 : 0, 1.5);
  return blocks;
}

export function buildResumePdfBlocks(
  content: ResumeContent,
  language: ResumeLanguage,
  photo?: Uint8Array,
): PdfBlock[] {
  const blocks: PdfBlock[] = [headerBlock(content.personal, language, false, photo)];
  const renderers: Record<SectionType, () => PdfBlock[]> = {
    summary: () => resumeSummary(content, language),
    education: () => resumeEducation(content, language),
    experience: () => resumeExperience(content, language),
    projects: () => resumeProjects(content, language),
    skills: () => resumeSkills(content, language),
    awards: () => resumeAwards(content, language),
  };
  (content.sections ?? []).forEach((section) => blocks.push(...renderers[section]()));
  return blocks;
}

function academicEducation(content: AcademicCVContent, language: ResumeLanguage): PdfBlock[][] {
  return (content.education ?? []).map((item) => {
    const entry: PdfBlock[] = [
      rowBlock([textRun(item.institution, { bold: true })], [textRun(item.location, { bold: true })]),
    ];
    const degree = formatDegreeField(item.degree, item.field, language);
    if (degree) entry.push(rowBlock(degree, dateRange(item.startDate, item.endDate)));
    (item.extraFields ?? []).forEach((field) => {
      if (!field.value) return;
      const prefixes: Record<AcademicEducationExtraFieldType, { en: string; zh: string }> = {
        grade: { en: "Grade: ", zh: "成绩：" },
        researchField: { en: "Research Field: ", zh: "研究方向：" },
        awards: { en: "Awards: ", zh: "获奖情况：" },
        custom: { en: "", zh: "" },
      };
      const prefix = field.type === "custom"
        ? (field.label ? `${field.label}: ` : "")
        : prefixes[field.type][language];
      entry.push(bulletBlock(`${prefix}${field.value}`));
    });
    return entry;
  });
}

function academicExperience(
  items: AcademicCVContent["researchExperience"],
): PdfBlock[][] {
  return (items ?? []).map((item) => {
    const entry: PdfBlock[] = [
      rowBlock([textRun(item.organization, { bold: true })], [textRun(item.location, { bold: true })]),
    ];
    const detail = [item.role, item.researchGroup, item.department].filter(Boolean).join(" | ");
    if (detail) entry.push(rowBlock(detail, dateRange(item.startDate, item.endDate)));
    (item.descriptions ?? []).forEach((description) => {
      if (description.value) entry.push(bulletBlock(description.value));
    });
    return entry;
  });
}

function academicTeaching(content: AcademicCVContent, language: ResumeLanguage): PdfBlock[][] {
  return (content.teachingExperience ?? []).map((item) => {
    const entry: PdfBlock[] = [
      rowBlock([textRun(item.institution, { bold: true })], [textRun(item.location, { bold: true })]),
    ];
    if (item.role) entry.push(rowBlock(item.role, dateRange(item.startDate, item.endDate)));
    if (item.course) entry.push(bulletBlock(`${language === "zh" ? "课程：" : "Course: "}${item.course}`));
    (item.descriptions ?? []).forEach((description) => {
      if (description.value) entry.push(bulletBlock(description.value));
    });
    return entry;
  });
}

function academicPublications(items: AcademicCVContent["publications"]): PdfBlock[][] {
  return (items ?? []).filter((item) => item.citation).map((item) => [bulletBlock(item.citation)]);
}

function academicPresentations(content: AcademicCVContent): PdfBlock[][] {
  return (content.conferencePresentations ?? []).map((item) => {
    const entry: PdfBlock[] = [
      rowBlock([textRun(item.event, { bold: true })], item.location ? [textRun(item.location, { bold: true })] : undefined),
    ];
    const detail = [item.type, item.title].filter(Boolean).join(" | ");
    if (detail || item.date) entry.push(rowBlock(detail, item.date));
    return entry;
  });
}

function academicReferences(content: AcademicCVContent): PdfBlock[][] {
  return (content.references ?? []).map((item) => {
    const suffix = `${item.title ? `, ${item.title}` : ""}${item.relationship ? ` (${item.relationship})` : ""}`;
    const entry: PdfBlock[] = [{
      kind: "text",
      runs: [textRun(item.name, { bold: true }), textRun(suffix)],
    }];
    if (item.address) entry.push(textBlock(item.address));

    const contacts: PdfTextRun[] = [];
    if (item.phone) {
      contacts.push(textRun(`Phone: ${item.phone}`, { link: `tel:${item.phone.replace(/[^+\d]/g, "")}` }));
    }
    if (item.email) {
      if (contacts.length > 0) contacts.push(textRun(" | "));
      contacts.push(textRun(`Email: ${item.email}`, { color: PDF_BLUE, link: `mailto:${item.email}` }));
    }
    if (contacts.length > 0) entry.push({ kind: "text", runs: contacts });
    return entry;
  });
}

export function buildAcademicPdfBlocks(
  content: AcademicCVContent,
  language: ResumeLanguage,
  photo?: Uint8Array,
): PdfBlock[] {
  const blocks: PdfBlock[] = [headerBlock(content.personal, language, true, photo)];
  const add = (type: AcademicSectionType, entries: PdfBlock[][], gap = 4.5) => {
    appendEntrySection(blocks, academicTitle(type, language), entries, language === "en" ? -0.36 : 0, gap);
  };

  const renderers: Record<AcademicSectionType, () => void> = {
    researchInterests: () => {
      const value = content.researchInterests?.trim();
      if (value) add("researchInterests", [[textBlock(value, { align: "justify" })]], 0);
    },
    education: () => add("education", academicEducation(content, language)),
    researchExperience: () => add("researchExperience", academicExperience(content.researchExperience)),
    teachingExperience: () => add("teachingExperience", academicTeaching(content, language)),
    industryExperience: () => add("industryExperience", academicExperience(content.industryExperience)),
    publications: () => add("publications", academicPublications(content.publications), 0),
    manuscriptsUnderReview: () => add("manuscriptsUnderReview", academicPublications(content.manuscriptsUnderReview), 0),
    conferencePresentations: () => add("conferencePresentations", academicPresentations(content), 3),
    grantsAndAwards: () => add("grantsAndAwards", (content.grantsAndAwards ?? []).map((item) => [rowBlock(item.title, item.date)]), 1.5),
    professionalService: () => add("professionalService", (content.professionalService ?? []).map((item) => [rowBlock([item.role, item.organization].filter(Boolean).join(", "), item.date)]), 1.5),
    technicalSkills: () => add("technicalSkills", (content.technicalSkills ?? []).map((group) => [{
      kind: "text",
      runs: [
        ...(group.category ? [textRun(`${group.category}:`, { bold: true }), textRun(" ")] : []),
        textRun(group.items),
      ],
    }]), 0),
    references: () => add("references", academicReferences(content), 6),
  };

  (content.sections ?? []).forEach((section) => renderers[section]());
  return blocks;
}

export function buildCoverLetterPdfBlocks(content: CoverLetterContent): PdfBlock[] {
  const blocks: PdfBlock[] = [];
  const senderLines = [
    content.sender.name,
    ...(content.sender.addressLines ?? []).map((line) => line.value),
  ].filter(Boolean);
  if (senderLines.length > 0) {
    blocks.push(textBlock(senderLines.join("\n"), { align: "right", lineGap: 3, gapAfter: 30 }));
  }
  if (content.date) blocks.push(textBlock(content.date, { lineGap: 3, gapAfter: 16 }));

  const recipientLines = [
    content.recipient.name,
    ...(content.recipient.addressLines ?? []).map((line) => line.value),
  ].filter(Boolean);
  if (recipientLines.length > 0) {
    blocks.push(groupBlock([textBlock(recipientLines.join("\n"), { lineGap: 3 })], { gapAfter: 16 }));
  }

  const salutation = content.recipient.salutation ?? content.recipient.name;
  if (salutation) {
    blocks.push(groupBlock([textBlock(`Dear ${salutation}:`, { lineGap: 3 })], { gapAfter: 12 }));
  }

  (content.paragraphs ?? []).forEach((paragraph) => {
    if (paragraph.text) blocks.push(textBlock(paragraph.text, { lineGap: 3, gapAfter: 10 }));
  });

  if (content.sender.name) {
    blocks.push(groupBlock([
      textBlock("Sincerely,", { lineGap: 3 }),
      { kind: "spacer", height: 20 },
      textBlock(content.sender.name, { lineGap: 3 }),
    ], { gapBefore: 16 }));
  }
  return blocks;
}
