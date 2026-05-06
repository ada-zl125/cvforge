import type { ContactField, ContactFieldType, ResumeContent, SectionType } from "@/lib/types/resume";
import type { AcademicCVContent, AcademicSectionType } from "@/lib/types/academic-cv";
import type { CoverLetterContent } from "@/lib/types/cover-letter";
import { withId } from "@/lib/json-utils";
import type { DocType } from "./tools";

function ensureUUIDs<T extends { id?: string }>(items: T[]): T[] {
  return withId<T>(items);
}

function text(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function updateContactFields(
  contacts: ContactField[],
  updates: Partial<Record<Extract<ContactFieldType, "email" | "phone" | "location" | "website">, string>>
): ContactField[] {
  const next = [...contacts];

  for (const [type, value] of Object.entries(updates) as Array<[ContactField["type"], string | undefined]>) {
    if (!value) continue;

    const existingIndex = next.findIndex((contact) => contact.type === type);
    if (existingIndex >= 0) {
      next[existingIndex] = { ...next[existingIndex], value };
    } else {
      next.push({ id: crypto.randomUUID(), type, value });
    }
  }

  return next;
}

function setResumeSection(
  content: ResumeContent,
  section: SectionType,
  hasContent: boolean
): SectionType[] {
  const sections = content.sections ?? [];
  if (hasContent) return sections.includes(section) ? sections : [...sections, section];
  return sections.filter((item) => item !== section);
}

function setAcademicSection(
  content: AcademicCVContent,
  section: AcademicSectionType,
  hasContent: boolean
): AcademicSectionType[] {
  const sections = content.sections ?? [];
  if (hasContent) return sections.includes(section) ? sections : [...sections, section];
  return sections.filter((item) => item !== section);
}

export function executeToolCall(
  docType: DocType,
  content: unknown,
  toolName: string,
  args: unknown
): unknown {
  if (docType === "resume") {
    return executeResumeToolCall(content as ResumeContent, toolName, args);
  } else if (docType === "academic-cv") {
    return executeAcademicToolCall(content as AcademicCVContent, toolName, args);
  } else if (docType === "cover-letter") {
    return executeCoverLetterToolCall(content as CoverLetterContent, toolName, args);
  }
  return content;
}

function executeResumeToolCall(content: ResumeContent, toolName: string, args: unknown): ResumeContent {
  switch (toolName) {
    case "update_personal": {
      const arg = args as { fullName?: string; email?: string; phone?: string; location?: string; website?: string };
      return {
        ...content,
        personal: {
          ...content.personal,
          fullName: arg.fullName ?? content.personal.fullName,
          contacts: updateContactFields(content.personal.contacts ?? [], {
            email: arg.email,
            phone: arg.phone,
            location: arg.location,
            website: arg.website,
          }),
        },
      };
    }
    case "set_summary": {
      const arg = args as { text: string };
      const summary = arg.text ?? "";
      return { ...content, summary, sections: setResumeSection(content, "summary", !!summary.trim()) };
    }
    case "set_experience": {
      const arg = args as { items: Array<{ id?: string; company: string; position?: string; location?: string; startDate?: string; endDate?: string; descriptions?: Array<{ id?: string; value: string }> }> };
      const experience = ensureUUIDs(
        (arg.items ?? []).map((item) => ({
          ...item,
          company: text(item.company),
          position: text(item.position),
          location: text(item.location),
          startDate: text(item.startDate),
          endDate: text(item.endDate),
          descriptions: ensureUUIDs(item.descriptions ?? []),
        }))
      ) as typeof content.experience;
      return { ...content, experience, sections: setResumeSection(content, "experience", experience.length > 0) };
    }
    case "set_education": {
      const arg = args as { items: Array<{ id?: string; institution: string; degree?: string; field?: string; location?: string; startDate?: string; endDate?: string; extraFields?: Array<{ id?: string; type: "grade" | "awards" | "custom"; label: string; value: string }> }> };
      const education = ensureUUIDs(
        (arg.items ?? []).map((e) => ({
          ...e,
          institution: text(e.institution),
          degree: text(e.degree),
          field: text(e.field),
          location: text(e.location),
          startDate: text(e.startDate),
          endDate: text(e.endDate),
          extraFields: ensureUUIDs(e.extraFields ?? []),
        }))
      ) as typeof content.education;
      return {
        ...content,
        education,
        sections: setResumeSection(content, "education", education.length > 0),
      };
    }
    case "set_skills": {
      const arg = args as { items: Array<{ id?: string; category: string; items: string }> };
      const skills = ensureUUIDs(arg.items ?? []) as typeof content.skills;
      return { ...content, skills, sections: setResumeSection(content, "skills", skills.length > 0) };
    }
    case "set_projects": {
      const arg = args as { items: Array<{ id?: string; name: string; websiteLabel?: string; websiteUrl?: string; startDate?: string; endDate?: string; descriptions?: Array<{ id?: string; value: string }> }> };
      const projects = ensureUUIDs(
        (arg.items ?? []).map((p) => ({
          ...p,
          name: text(p.name),
          websiteLabel: text(p.websiteLabel),
          websiteUrl: text(p.websiteUrl),
          startDate: text(p.startDate),
          endDate: text(p.endDate),
          descriptions: ensureUUIDs(p.descriptions ?? []),
        }))
      ) as typeof content.projects;
      return {
        ...content,
        projects,
        sections: setResumeSection(content, "projects", projects.length > 0),
      };
    }
    case "set_awards": {
      const arg = args as { items: Array<{ id?: string; award: string; date: string }> };
      const awards = ensureUUIDs(arg.items ?? []) as typeof content.awards;
      return { ...content, awards, sections: setResumeSection(content, "awards", awards.length > 0) };
    }
    case "set_sections": {
      const arg = args as { sections: Array<"summary" | "education" | "projects" | "experience" | "skills" | "awards"> };
      return { ...content, sections: arg.sections ?? [] };
    }
    default:
      return content;
  }
}

function executeAcademicToolCall(content: AcademicCVContent, toolName: string, args: unknown): AcademicCVContent {
  switch (toolName) {
    case "update_personal": {
      const arg = args as { fullName?: string; email?: string; phone?: string; location?: string; website?: string };
      return {
        ...content,
        personal: {
          ...content.personal,
          fullName: arg.fullName ?? content.personal.fullName,
          contacts: updateContactFields(content.personal.contacts ?? [], {
            email: arg.email,
            phone: arg.phone,
            location: arg.location,
            website: arg.website,
          }),
        },
      };
    }
    case "set_research_interests": {
      const arg = args as { text: string };
      const researchInterests = arg.text ?? "";
      return {
        ...content,
        researchInterests,
        sections: setAcademicSection(content, "researchInterests", !!researchInterests.trim()),
      };
    }
    case "set_education": {
      const arg = args as { items: Array<{ id?: string; institution: string; degree?: string; field?: string; location?: string; startDate?: string; endDate?: string; extraFields?: Array<{ id?: string; type: "grade" | "researchField" | "awards" | "custom"; label: string; value: string }> }> };
      const education = ensureUUIDs(
        (arg.items ?? []).map((e) => ({
          ...e,
          institution: text(e.institution),
          degree: text(e.degree),
          field: text(e.field),
          location: text(e.location),
          startDate: text(e.startDate),
          endDate: text(e.endDate),
          extraFields: ensureUUIDs(e.extraFields ?? []),
        }))
      ) as typeof content.education;
      return {
        ...content,
        education,
        sections: setAcademicSection(content, "education", education.length > 0),
      };
    }
    case "set_research_experience": {
      const arg = args as { items: Array<{ id?: string; organization: string; role?: string; researchGroup?: string; department?: string; location?: string; startDate?: string; endDate?: string; descriptions?: Array<{ id?: string; value: string }> }> };
      const researchExperience = ensureUUIDs(
        (arg.items ?? []).map((e) => ({
          ...e,
          organization: text(e.organization),
          role: text(e.role),
          researchGroup: text(e.researchGroup),
          department: text(e.department),
          location: text(e.location),
          startDate: text(e.startDate),
          endDate: text(e.endDate),
          descriptions: ensureUUIDs(e.descriptions ?? []),
        }))
      ) as typeof content.researchExperience;
      return {
        ...content,
        researchExperience,
        sections: setAcademicSection(content, "researchExperience", researchExperience.length > 0),
      };
    }
    case "set_teaching_experience": {
      const arg = args as { items: Array<{ id?: string; institution: string; role?: string; location?: string; startDate?: string; endDate?: string; course?: string; descriptions?: Array<{ id?: string; value: string }> }> };
      const teachingExperience = ensureUUIDs(
        (arg.items ?? []).map((e) => ({
          ...e,
          institution: text(e.institution),
          role: text(e.role),
          location: text(e.location),
          startDate: text(e.startDate),
          endDate: text(e.endDate),
          course: text(e.course),
          descriptions: ensureUUIDs(e.descriptions ?? []),
        }))
      ) as typeof content.teachingExperience;
      return {
        ...content,
        teachingExperience,
        sections: setAcademicSection(content, "teachingExperience", teachingExperience.length > 0),
      };
    }
    case "set_industry_experience": {
      const arg = args as { items: Array<{ id?: string; organization: string; role?: string; department?: string; location?: string; startDate?: string; endDate?: string; descriptions?: Array<{ id?: string; value: string }> }> };
      const industryExperience = ensureUUIDs(
        (arg.items ?? []).map((e) => ({
          ...e,
          organization: text(e.organization),
          role: text(e.role),
          department: text(e.department),
          location: text(e.location),
          startDate: text(e.startDate),
          endDate: text(e.endDate),
          descriptions: ensureUUIDs(e.descriptions ?? []),
        }))
      ) as typeof content.industryExperience;
      return {
        ...content,
        industryExperience,
        sections: setAcademicSection(content, "industryExperience", industryExperience.length > 0),
      };
    }
    case "set_publications": {
      const arg = args as { items: Array<{ id?: string; citation: string }> };
      const publications = ensureUUIDs(arg.items ?? []) as typeof content.publications;
      return { ...content, publications, sections: setAcademicSection(content, "publications", publications.length > 0) };
    }
    case "set_manuscripts_under_review": {
      const arg = args as { items: Array<{ id?: string; citation: string }> };
      const manuscriptsUnderReview = ensureUUIDs(arg.items ?? []) as typeof content.manuscriptsUnderReview;
      return {
        ...content,
        manuscriptsUnderReview,
        sections: setAcademicSection(content, "manuscriptsUnderReview", manuscriptsUnderReview.length > 0),
      };
    }
    case "set_conference_presentations": {
      const arg = args as { items: Array<{ id?: string; event: string; title: string; location?: string; date?: string; type?: string }> };
      const conferencePresentations = ensureUUIDs(
        (arg.items ?? []).map((item) => ({
          ...item,
          event: text(item.event),
          title: text(item.title),
          location: text(item.location),
          date: text(item.date),
          type: text(item.type),
        }))
      ) as typeof content.conferencePresentations;
      return {
        ...content,
        conferencePresentations,
        sections: setAcademicSection(content, "conferencePresentations", conferencePresentations.length > 0),
      };
    }
    case "set_grants_and_awards": {
      const arg = args as { items: Array<{ id?: string; title: string; date: string }> };
      const grantsAndAwards = ensureUUIDs(arg.items ?? []) as typeof content.grantsAndAwards;
      return { ...content, grantsAndAwards, sections: setAcademicSection(content, "grantsAndAwards", grantsAndAwards.length > 0) };
    }
    case "set_professional_service": {
      const arg = args as { items: Array<{ id?: string; role: string; organization: string; date: string }> };
      const professionalService = ensureUUIDs(arg.items ?? []) as typeof content.professionalService;
      return {
        ...content,
        professionalService,
        sections: setAcademicSection(content, "professionalService", professionalService.length > 0),
      };
    }
    case "set_technical_skills": {
      const arg = args as { items: Array<{ id?: string; category: string; items: string }> };
      const technicalSkills = ensureUUIDs(arg.items ?? []) as typeof content.technicalSkills;
      return { ...content, technicalSkills, sections: setAcademicSection(content, "technicalSkills", technicalSkills.length > 0) };
    }
    case "set_references": {
      const arg = args as { items: Array<{ id?: string; name: string; title?: string; relationship?: string; address?: string; phone?: string; email?: string }> };
      const references = ensureUUIDs(arg.items ?? []) as typeof content.references;
      return { ...content, references, sections: setAcademicSection(content, "references", references.length > 0) };
    }
    case "set_sections": {
      const arg = args as { sections: Array<"researchInterests" | "education" | "researchExperience" | "teachingExperience" | "industryExperience" | "publications" | "manuscriptsUnderReview" | "conferencePresentations" | "grantsAndAwards" | "professionalService" | "technicalSkills" | "references"> };
      return { ...content, sections: arg.sections ?? [] };
    }
    default:
      return content;
  }
}

function executeCoverLetterToolCall(content: CoverLetterContent, toolName: string, args: unknown): CoverLetterContent {
  switch (toolName) {
    case "update_sender": {
      const arg = args as { name?: string; address?: Array<{ id?: string; value: string }> };
      return {
        ...content,
        sender: {
          name: arg.name ?? content.sender.name,
          addressLines: (arg.address ? ensureUUIDs(arg.address) : content.sender.addressLines) as typeof content.sender.addressLines,
        },
      };
    }
    case "update_recipient": {
      const arg = args as { name?: string; salutation?: string; address?: Array<{ id?: string; value: string }> };
      return {
        ...content,
        recipient: {
          name: arg.name ?? content.recipient.name,
          salutation: arg.salutation ?? content.recipient.salutation,
          addressLines: (arg.address ? ensureUUIDs(arg.address) : content.recipient.addressLines) as typeof content.recipient.addressLines,
        },
      };
    }
    case "set_paragraphs": {
      const arg = args as { items: Array<{ id?: string; text: string }> };
      return { ...content, paragraphs: ensureUUIDs(arg.items ?? []) as typeof content.paragraphs };
    }
    case "set_date": {
      const arg = args as { date: string };
      return { ...content, date: arg.date ?? content.date };
    }
    default:
      return content;
  }
}
