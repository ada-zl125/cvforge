/* ------------------------------------------------------------------ */
/*  Academic CV data types                                              */
/* ------------------------------------------------------------------ */

import type { PersonalInfo, SkillGroup, ResumeLanguage, DescriptionField } from "./resume";
export type { PersonalInfo, SkillGroup, ResumeLanguage, DescriptionField };

/* ---- Section type union ---- */

export type AcademicSectionType =
  | "researchInterests"
  | "education"
  | "researchExperience"
  | "teachingExperience"
  | "industryExperience"
  | "publications"
  | "manuscriptsUnderReview"
  | "conferencePresentations"
  | "grantsAndAwards"
  | "professionalService"
  | "technicalSkills"
  | "references";

export type AcademicCVTemplate = "academic";

/* ---- Education extra fields ---- */

export type AcademicEducationExtraFieldType = "grade" | "researchField" | "awards" | "custom";

export interface AcademicEducationExtraField {
  id: string;
  type: AcademicEducationExtraFieldType;
  /** Auto-set for grade/researchField/awards; user-defined for custom */
  label: string;
  value: string;
}

/* ---- Education ---- */

export interface AcademicEducationItem {
  id: string;
  institution: string;
  degree: string;
  field: string;
  location: string;
  startDate: string;
  endDate: string;
  extraFields: AcademicEducationExtraField[];
}

/* ---- Experience-like (shared by Research + Industry) ---- */

export interface AcademicExperienceItem {
  id: string;
  organization: string;
  role: string;
  /** Research experience only */
  researchGroup?: string;
  /** Research experience only */
  department?: string;
  location: string;
  startDate: string;
  endDate: string;
  descriptions?: DescriptionField[];
}

/* ---- Teaching ---- */

export interface TeachingItem {
  id: string;
  institution: string;
  role: string;
  location: string;
  startDate: string;
  endDate: string;
  /** Optional; rendered as a key-value bullet "Course: X" */
  course?: string;
  descriptions?: DescriptionField[];
}

/* ---- Publications + Manuscripts (free-text citation) ---- */

export interface PublicationItem {
  id: string;
  /** Full citation string, user-formatted (e.g. APA, MLA, IEEE) */
  citation: string;
}

/* ---- Conference Presentations ---- */

export interface PresentationItem {
  id: string;
  event: string;
  title: string;
  location: string;
  date: string;
  /** Optional: "Oral", "Poster", "Invited", etc. Rendered on row 2 before title. */
  type?: string;
}

/* ---- Grants & Awards (merged) ---- */

export interface GrantAwardItem {
  id: string;
  title: string;
  date: string;
}

/* ---- Professional Service ---- */

export interface ServiceItem {
  id: string;
  role: string;
  organization: string;
  date: string;
}

/* ---- References ---- */

export interface ReferenceItem {
  id: string;
  name: string;
  title?: string;
  relationship?: string;
  address?: string;
  phone?: string;
  email?: string;
}

/* ---- Top-level content ---- */

export interface AcademicCVContent {
  personal: PersonalInfo;
  researchInterests?: string;
  sections: AcademicSectionType[];
  education: AcademicEducationItem[];
  researchExperience: AcademicExperienceItem[];
  teachingExperience: TeachingItem[];
  industryExperience: AcademicExperienceItem[];
  publications: PublicationItem[];
  manuscriptsUnderReview: PublicationItem[];
  conferencePresentations: PresentationItem[];
  grantsAndAwards: GrantAwardItem[];
  professionalService: ServiceItem[];
  technicalSkills: SkillGroup[];
  references: ReferenceItem[];
}
