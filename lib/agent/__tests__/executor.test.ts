import { describe, expect, it } from "vitest";
import { defaultCoverLetterContent, defaultResumeContent } from "@/lib/defaults";
import { executeToolCall } from "@/lib/agent/executor";
import type { ResumeContent } from "@/lib/types/resume";
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
});

