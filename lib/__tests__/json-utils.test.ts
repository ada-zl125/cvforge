import { describe, expect, it } from "vitest";
import {
  formatDegreeField,
  stripDegreeField,
  stripResumeLegacyContacts,
  withId,
} from "@/lib/json-utils";

describe("JSON utils", () => {
  it("adds ids and formats degree fields", () => {
    const items = withId<{ id?: string; value: string }>([{ value: "first" }]);

    expect(items[0]).toMatchObject({ value: "first" });
    expect(items[0].id).toEqual(expect.any(String));
    expect(formatDegreeField("MSc", "Computing", "en")).toBe("MSc in Computing");
  });

  it("strips legacy fields before export", () => {
    const content = stripResumeLegacyContacts({
      personal: {
        contacts: [
          { type: "email", value: "ada@example.com" },
          { type: "addressLine1", value: "Old address" },
        ],
      },
    });

    expect(content.personal.contacts).toEqual([{ type: "email", value: "ada@example.com" }]);
    expect(stripDegreeField([{ degree: "MSc", field: "Computing" }])).toEqual([{ degree: "MSc" }]);
  });
});

