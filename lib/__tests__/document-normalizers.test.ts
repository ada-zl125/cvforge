import { describe, expect, it } from "vitest";
import {
  normalizeAcademicCVContent,
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
});
