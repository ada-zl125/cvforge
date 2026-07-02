import { describe, expect, it } from "vitest";
import {
  normalizeAcademicCVContent,
  createAcademicCVExportPayload,
  createResumeExportPayload,
  normalizeCoverLetterContent,
  normalizeResumeContent,
} from "@/lib/document-normalizers";

describe("document normalisers", () => {
  it("normalises resume imports with ids and merged degrees", () => {
    const content = normalizeResumeContent({
      personal: { fullName: "Ada Lovelace" },
      sections: ["education", "experience"],
      education: [{
        institution: "Imperial College London",
        degree: "MSc",
        field: "Computing",
      }],
      experience: [{
        company: "Analytical Engines",
        descriptions: [{ value: "Built useful tools" }],
      }],
    }, "en");

    expect(content.personal.fullName).toBe("Ada Lovelace");
    expect(content.education[0]).toMatchObject({
      institution: "Imperial College London",
      degree: "MSc in Computing",
      field: "",
    });
    expect(content.education[0].id).toEqual(expect.any(String));
    expect(content.experience[0].descriptions[0].id).toEqual(expect.any(String));
  });

  it("falls back to default resume collections for empty imports", () => {
    const content = normalizeResumeContent(null, "en");

    expect(content.personal).toMatchObject({ fullName: "", contacts: [] });
    expect(content.sections).toEqual([]);
    expect(content.education).toEqual([]);
    expect(content.projects).toEqual([]);
  });

  it("strips private and legacy resume fields from JSON export", () => {
    const payload = createResumeExportPayload({
      title: "My Resume",
      template: "general",
      language: "en",
      content: {
        personal: {
          fullName: "Ada",
          photo: "data:image/jpeg;base64,abc",
          contacts: [
            { id: "email", type: "email", value: "ada@example.com" },
            { id: "old", type: "addressLine1", value: "Old address" },
          ],
        },
        sections: ["education"],
        summary: "",
        education: [{
          id: "edu",
          institution: "Test University",
          degree: "MSc in Computing",
          field: "",
          location: "London, UK",
          startDate: "2024",
          endDate: "2025",
          extraFields: [],
        }],
        experience: [],
        skills: [],
        projects: [],
        awards: [],
      },
    });

    expect(payload.content.personal).toEqual({
      fullName: "Ada",
      contacts: [{ id: "email", type: "email", value: "ada@example.com" }],
    });
    expect(payload.content.education[0]).not.toHaveProperty("field");
  });

  it("keeps Chinese degree formatting compact during resume import", () => {
    const content = normalizeResumeContent({
      education: [{
        institution: "伦敦大学学院",
        degree: "硕士",
        field: "计算机科学",
      }],
    }, "zh");

    expect(content.education[0]).toMatchObject({
      degree: "计算机科学硕士",
      field: "",
    });
  });

  it("normalises cover letter address lines and paragraphs", () => {
    const content = normalizeCoverLetterContent({
      sender: { name: "Ada", addressLines: [{ value: "London" }] },
      recipient: { name: "Hiring Team" },
      paragraphs: [{ text: "I am interested in this role." }],
    });

    expect(content.sender.addressLines[0]).toMatchObject({ value: "London" });
    expect(content.sender.addressLines[0].id).toEqual(expect.any(String));
    expect(content.paragraphs[0].id).toEqual(expect.any(String));
  });

  it("normalises academic CV research experience descriptions", () => {
    const content = normalizeAcademicCVContent({
      personal: { fullName: "Ada Lovelace" },
      sections: ["researchExperience"],
      researchExperience: [{
        organization: "Imperial College London",
        descriptions: [{ value: "Studied agent workflows" }],
      }],
    }, "en");

    expect(content.researchExperience[0].organization).toBe("Imperial College London");
    expect(content.researchExperience[0].id).toEqual(expect.any(String));
    expect(content.researchExperience[0].descriptions?.[0].id).toEqual(expect.any(String));
  });

  it("normalises academic CV publication style lists with ids", () => {
    const content = normalizeAcademicCVContent({
      publications: [{ citation: "Lovelace, A. Notes on engines. 1843." }],
      conferencePresentations: [{ event: "AI UK", title: "Useful agents", date: "2026" }],
      references: [{ name: "Dr Smith", email: "smith@example.com" }],
    }, "en");

    expect(content.publications[0].id).toEqual(expect.any(String));
    expect(content.conferencePresentations[0].id).toEqual(expect.any(String));
    expect(content.references[0].id).toEqual(expect.any(String));
  });

  it("strips academic CV photo and legacy education field on export", () => {
    const payload = createAcademicCVExportPayload({
      title: "Academic CV",
      template: "academic",
      language: "en",
      content: {
        personal: { fullName: "Ada", photo: "data:image/jpeg;base64,abc", contacts: [] },
        sections: ["education"],
        education: [{
          id: "edu",
          institution: "Oxford",
          degree: "DPhil",
          field: "Computer Science",
          location: "Oxford, UK",
          startDate: "2023",
          endDate: "2026",
          extraFields: [],
        }],
        researchExperience: [],
        teachingExperience: [],
        industryExperience: [],
        publications: [],
        manuscriptsUnderReview: [],
        conferencePresentations: [],
        grantsAndAwards: [],
        professionalService: [],
        technicalSkills: [],
        references: [],
      },
    });

    expect(payload.content.personal).not.toHaveProperty("photo");
    expect(payload.content.education[0]).not.toHaveProperty("field");
  });
});
