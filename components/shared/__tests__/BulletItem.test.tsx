import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { BulletItem } from "@/components/shared/BulletItem";

describe("BulletItem", () => {
  it("keeps long text intact while allowing the flex content to shrink", () => {
    const value = "123123123123123123123123123123123123123123123123";
    const markup = renderToStaticMarkup(<BulletItem>{value}</BulletItem>);

    expect(markup).toContain(value);
    expect(markup).toContain("min-width:0");
  });
});
