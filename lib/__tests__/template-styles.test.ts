import { describe, expect, it } from "vitest";
import {
  AWARD_ENTRY_GAP,
  FONT_EN,
  FONT_ZH,
  SKILL_ENTRY_GAP,
  boldFontStyle,
} from "@/lib/template-styles";

describe("template typography", () => {
  it("keeps compact section entries within the page budget", () => {
    expect(SKILL_ENTRY_GAP).toBe("2px");
    expect(AWARD_ENTRY_GAP).toBe("1px");
  });

  it("uses the stronger bold weight for Chinese text", () => {
    expect(boldFontStyle("zh", FONT_ZH)).toEqual({
      fontFamily: FONT_ZH,
      fontWeight: 800,
    });
  });

  it("preserves the existing English bold weight", () => {
    expect(boldFontStyle("en", FONT_EN)).toEqual({
      fontFamily: FONT_EN,
      fontWeight: 700,
    });
  });
});
