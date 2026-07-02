import { defaultAcademicCVContent, defaultCoverLetterContent, defaultResumeContent } from "@/lib/defaults";
import { mergeDegreeField, stripDegreeField, stripResumeLegacyContacts, withId } from "@/lib/json-utils";
import type {
  AcademicCVContent,
  AcademicCVTemplate,
  AcademicEducationExtraField,
  AcademicEducationItem,
  AcademicExperienceItem,
  GrantAwardItem,
  PresentationItem,
  PublicationItem,
  ReferenceItem,
  ResumeLanguage,
  ServiceItem,
  TeachingItem,
} from "@/lib/types/academic-cv";
import type {
  AwardItem,
  DescriptionField,
  EducationExtraField,
  EducationItem,
  ExperienceItem,
  ProjectItem,
  ResumeContent,
  ResumeTemplate,
  SkillGroup,
} from "@/lib/types/resume";
import type {
  AddressLine,
  CoverLetterContent,
  CoverLetterTemplate,
  ParagraphItem,
} from "@/lib/types/cover-letter";

type JsonRecord = Record<string, unknown>;

function record(value: unknown): JsonRecord {
  return value && typeof value === "object" ? value as JsonRecord : {};
}

function mergePersonal<TPersonal extends object>(
  defaultPersonal: TPersonal,
  value: unknown,
): TPersonal {
  return {
    ...defaultPersonal,
    ...record(value),
  };
}

function withoutPhoto<TPersonal extends { photo?: unknown }>(personal: TPersonal): Omit<TPersonal, "photo"> {
  const next = { ...personal };
  delete next.photo;
  return next;
}

// normalise imported data before it enters editor state.
export function normalizeResumeContent(rawContent: unknown, language: ResumeLanguage): ResumeContent {
  const raw = record(rawContent);
  const merged: ResumeContent = {
    ...defaultResumeContent,
    ...raw,
    personal: mergePersonal(defaultResumeContent.personal, raw.personal),
    experience: withId<ExperienceItem>(raw.experience).map((item) => ({
      ...item,
      descriptions: withId<DescriptionField>(item.descriptions),
    })),
    education: withId<EducationItem>(raw.education).map((item) => {
      const mergedDegree = mergeDegreeField(item, language);
      return {
        ...mergedDegree,
        extraFields: withId<EducationExtraField>(mergedDegree.extraFields),
      };
    }),
    skills: withId<SkillGroup>(raw.skills),
    projects: withId<ProjectItem>(raw.projects).map((item) => ({
      ...item,
      descriptions: withId<DescriptionField>(item.descriptions),
    })),
    awards: withId<AwardItem>(raw.awards),
  };

  return stripResumeLegacyContacts(merged);
}

export function normalizeAcademicCVContent(rawContent: unknown, language: ResumeLanguage): AcademicCVContent {
  const raw = record(rawContent);
  return {
    ...defaultAcademicCVContent,
    ...raw,
    personal: mergePersonal(defaultAcademicCVContent.personal, raw.personal),
    education: withId<AcademicEducationItem>(raw.education).map((item) => {
      const mergedDegree = mergeDegreeField(item, language);
      return {
        ...mergedDegree,
        extraFields: withId<AcademicEducationExtraField>(mergedDegree.extraFields),
      };
    }),
    researchExperience: withId<AcademicExperienceItem>(raw.researchExperience).map((item) => ({
      ...item,
      descriptions: withId<DescriptionField>(item.descriptions),
    })),
    teachingExperience: withId<TeachingItem>(raw.teachingExperience).map((item) => ({
      ...item,
      descriptions: withId<DescriptionField>(item.descriptions),
    })),
    industryExperience: withId<AcademicExperienceItem>(raw.industryExperience).map((item) => ({
      ...item,
      descriptions: withId<DescriptionField>(item.descriptions),
    })),
    publications: withId<PublicationItem>(raw.publications),
    manuscriptsUnderReview: withId<PublicationItem>(raw.manuscriptsUnderReview),
    conferencePresentations: withId<PresentationItem>(raw.conferencePresentations),
    grantsAndAwards: withId<GrantAwardItem>(raw.grantsAndAwards),
    professionalService: withId<ServiceItem>(raw.professionalService),
    technicalSkills: withId<SkillGroup>(raw.technicalSkills),
    references: withId<ReferenceItem>(raw.references),
  };
}

export function normalizeCoverLetterContent(rawContent: unknown): CoverLetterContent {
  const raw = record(rawContent);
  const sender = record(raw.sender);
  const recipient = record(raw.recipient);

  return {
    ...defaultCoverLetterContent,
    ...raw,
    sender: {
      ...defaultCoverLetterContent.sender,
      ...sender,
      addressLines: withId<AddressLine>(sender.addressLines),
    },
    recipient: {
      ...defaultCoverLetterContent.recipient,
      ...recipient,
      addressLines: withId<AddressLine>(recipient.addressLines),
    },
    paragraphs: withId<ParagraphItem>(raw.paragraphs),
  };
}

export function createResumeExportPayload(params: {
  title: string;
  template: ResumeTemplate;
  language: ResumeLanguage;
  content: ResumeContent;
}) {
  const sanitizedContent = stripResumeLegacyContacts(params.content);

  return {
    _type: "cvforge-resume",
    title: params.title,
    template: params.template,
    language: params.language,
    content: {
      ...sanitizedContent,
      personal: withoutPhoto(sanitizedContent.personal),
      education: stripDegreeField(sanitizedContent.education),
    },
  };
}

export function createAcademicCVExportPayload(params: {
  title: string;
  template: AcademicCVTemplate;
  language: ResumeLanguage;
  content: AcademicCVContent;
}) {
  return {
    _type: "cvforge-academic-cv",
    title: params.title,
    template: params.template,
    language: params.language,
    content: {
      ...params.content,
      personal: withoutPhoto(params.content.personal),
      education: stripDegreeField(params.content.education),
    },
  };
}

export function createCoverLetterExportPayload(params: {
  title: string;
  template: CoverLetterTemplate;
  content: CoverLetterContent;
}) {
  return {
    _type: "cvforge-cover-letter",
    title: params.title,
    template: params.template,
    content: params.content,
  };
}
