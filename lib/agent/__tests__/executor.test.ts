import { describe, expect, it } from "vitest";
import { defaultAcademicCVContent, defaultCoverLetterContent, defaultResumeContent } from "@/lib/defaults";
import { executeToolCall } from "@/lib/agent/executor";
import type { ResumeContent } from "@/lib/types/resume";
import type { AcademicCVContent } from "@/lib/types/academic-cv";
import type { CoverLetterContent } from "@/lib/types/cover-letter";

describe("agent executor", () => {
  it("updates resume education with ids, section visibility, and recent first order", () => {
    const updated = executeToolCall("resume", defaultResumeContent, "set_education", {
      items: [
        { institution: "Older University", degree: "BSc", field: "Maths", endDate: "2020" },
        { institution: "New University", degree: "Master of Science", field: "Computing", endDate: "2025" },
      ],
    }) as ResumeContent;

    expect(updated.sections).toContain("education");
    expect(updated.education.map((item) => item.institution)).toEqual([
      "New University",
      "Older University",
    ]);
    expect(updated.education[0]).toMatchObject({
      degree: "MSc in Computing",
      field: "",
    });
    expect(updated.education[0].id).toEqual(expect.any(String));
  });

  it("updates cover letter sender and paragraphs", () => {
    const withSender = executeToolCall("cover-letter", defaultCoverLetterContent, "update_sender", {
      name: "Ada Lovelace",
      address: [{ value: "London" }],
    }) as CoverLetterContent;
    const withParagraph = executeToolCall("cover-letter", withSender, "set_paragraphs", {
      items: [{ text: "I would be delighted to apply." }],
    }) as CoverLetterContent;

    expect(withParagraph.sender.name).toBe("Ada Lovelace");
    expect(withParagraph.sender.addressLines[0].id).toEqual(expect.any(String));
    expect(withParagraph.paragraphs[0]).toMatchObject({
      text: "I would be delighted to apply.",
    });
  });

  it("updates resume projects with recent first order and description ids", () => {
    const updated = executeToolCall("resume", defaultResumeContent, "set_projects", {
      items: [
        { name: "Old Project", endDate: "2021", descriptions: [{ value: "Built a CLI." }] },
        { name: "New Project", endDate: "Present", descriptions: [{ value: "Built an agent." }] },
      ],
    }) as ResumeContent;

    expect(updated.sections).toContain("projects");
    expect(updated.projects.map((item) => item.name)).toEqual(["New Project", "Old Project"]);
    expect(updated.projects[0].descriptions[0].id).toEqual(expect.any(String));
  });

  it("keeps ongoing entries first and undated entries stable", () => {
    const updated = executeToolCall("resume", defaultResumeContent, "set_experience", {
      items: [
        { company: "Undated One", descriptions: [] },
        { company: "Past", endDate: "December 2024", descriptions: [] },
        { company: "Current", endDate: "Present", descriptions: [] },
        { company: "Undated Two", descriptions: [] },
      ],
    }) as ResumeContent;

    expect(updated.experience.map((item) => item.company)).toEqual([
      "Current",
      "Past",
      "Undated One",
      "Undated Two",
    ]);
  });

  it("removes resume sections when a tool clears their content", () => {
    const content = { ...defaultResumeContent, sections: ["summary", "skills"] as ResumeContent["sections"] };
    const withoutSummary = executeToolCall("resume", content, "set_summary", { text: "" }) as ResumeContent;
    const withoutSkills = executeToolCall("resume", withoutSummary, "set_skills", { items: [] }) as ResumeContent;

    expect(withoutSkills.sections).not.toContain("summary");
    expect(withoutSkills.sections).not.toContain("skills");
  });

  it("updates academic CV research interests and references", () => {
    const withInterests = executeToolCall("academic-cv", defaultAcademicCVContent, "set_research_interests", {
      text: "Human centred AI and document automation.",
    }) as AcademicCVContent;
    const withReferences = executeToolCall("academic-cv", withInterests, "set_references", {
      items: [{ name: "Dr Ada Lovelace", email: "ada@example.com" }],
    }) as AcademicCVContent;

    expect(withReferences.researchInterests).toBe("Human centred AI and document automation.");
    expect(withReferences.sections).toEqual(expect.arrayContaining(["researchInterests", "references"]));
    expect(withReferences.references[0].id).toEqual(expect.any(String));
  });

  it("updates academic CV experience with recent first order", () => {
    const updated = executeToolCall("academic-cv", defaultAcademicCVContent, "set_research_experience", {
      items: [
        { organization: "Old Lab", role: "Assistant", endDate: "2022", descriptions: [{ value: "Prepared data." }] },
        { organization: "New Lab", role: "Researcher", endDate: "2025", descriptions: [{ value: "Led experiments." }] },
      ],
    }) as AcademicCVContent;

    expect(updated.sections).toContain("researchExperience");
    expect(updated.researchExperience.map((item) => item.organization)).toEqual(["New Lab", "Old Lab"]);
    expect(updated.researchExperience[0].descriptions?.[0].id).toEqual(expect.any(String));
  });

  it("updates academic CV publications and awards with stable ordering", () => {
    const withPublications = executeToolCall("academic-cv", defaultAcademicCVContent, "set_publications", {
      items: [
        { citation: "Lovelace, A. Early notes. 2020." },
        { citation: "Lovelace, A. Better notes. 2024." },
      ],
    }) as AcademicCVContent;
    const withAwards = executeToolCall("academic-cv", withPublications, "set_grants_and_awards", {
      items: [
        { title: "Small Grant", date: "2021" },
        { title: "Major Grant", date: "2023" },
      ],
    }) as AcademicCVContent;

    expect(withAwards.publications[0].citation).toContain("2024");
    expect(withAwards.grantsAndAwards.map((item) => item.title)).toEqual(["Major Grant", "Small Grant"]);
    expect(withAwards.sections).toEqual(expect.arrayContaining(["publications", "grantsAndAwards"]));
  });

  it("updates cover letter recipient and date without losing sender details", () => {
    const content = {
      ...defaultCoverLetterContent,
      sender: { name: "Ada Lovelace", addressLines: [{ id: "home", value: "London" }] },
    };
    const withRecipient = executeToolCall("cover-letter", content, "update_recipient", {
      name: "Hiring Team",
      salutation: "Dear Hiring Team",
      address: [{ value: "Oxford" }],
    }) as CoverLetterContent;
    const withDate = executeToolCall("cover-letter", withRecipient, "set_date", {
      date: "2 July 2026",
    }) as CoverLetterContent;

    expect(withDate.sender.name).toBe("Ada Lovelace");
    expect(withDate.recipient).toMatchObject({ name: "Hiring Team", salutation: "Dear Hiring Team" });
    expect(withDate.recipient.addressLines[0].id).toEqual(expect.any(String));
    expect(withDate.date).toBe("2 July 2026");
  });
});
