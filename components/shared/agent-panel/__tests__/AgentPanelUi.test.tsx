import type { ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import {
  AssistantMessageBubble,
  UserMessageBubble,
} from "@/components/shared/agent-panel/AgentPanelUi";

vi.mock("@/components/FadeContent", () => ({
  default: ({
    children,
    className,
  }: {
    children: ReactNode;
    className?: string;
  }) => <div className={className}>{children}</div>,
}));

describe("agent message bubbles", () => {
  it("renders a user message without hidden visibility state", () => {
    const markup = renderToStaticMarkup(
      <UserMessageBubble content="Visible user message" />,
    );

    expect(markup).toContain("Visible user message");
    expect(markup).not.toContain("invisible");
    expect(markup).not.toContain("visibility:hidden");
  });

  it("renders an assistant message without hidden visibility state", () => {
    const markup = renderToStaticMarkup(
      <AssistantMessageBubble
        content="Visible assistant message"
        reasoningLabel="Reasoning"
      />,
    );

    expect(markup).toContain("Visible assistant message");
    expect(markup).not.toContain("invisible");
    expect(markup).not.toContain("visibility:hidden");
  });

  it("renders reasoning as compact Markdown without enabling raw HTML", () => {
    const markup = renderToStaticMarkup(
      <AssistantMessageBubble
        content="Done"
        reasoning={"**Plan**\n\n- Read context\n- Update document\n\n****\n\n<script>alert('x')</script>"}
        reasoningLabel="Reasoning"
      />,
    );

    expect(markup).toContain("<strong");
    expect(markup).toContain("<ul");
    expect(markup).toContain("<hr");
    expect(markup).not.toContain("**Plan**");
    expect(markup).not.toContain("<script>");
    expect(markup).toContain("&lt;script&gt;");
    expect(markup).toContain("text-[11px]");
  });
});
