import { describe, expect, it } from "vitest";
import { shouldCreateClickSpark } from "@/components/ClickSpark";

describe("ClickSpark", () => {
  it("skips clicks inside disabled controls", () => {
    const control = document.createElement("button");
    control.dataset.clickSpark = "disabled";
    const icon = document.createElement("span");
    control.appendChild(icon);

    expect(shouldCreateClickSpark(control)).toBe(false);
    expect(shouldCreateClickSpark(icon)).toBe(false);
  });

  it("keeps the effect enabled for other clicks", () => {
    expect(shouldCreateClickSpark(document.createElement("button"))).toBe(true);
    expect(shouldCreateClickSpark(null)).toBe(true);
  });
});
