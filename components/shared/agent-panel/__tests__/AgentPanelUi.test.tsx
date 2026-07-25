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
});
