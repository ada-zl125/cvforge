"use client";

import type { CoverLetterContent } from "@/lib/types/cover-letter";
import { PageBreakAvoid } from "@/components/shared/PageBreakAvoid";
import { FONT_EN, BODY_SIZE } from "@/lib/template-styles";

/* ------------------------------------------------------------------ */
/*  A4 page: 794px × 1123px at 96 DPI, 1.27cm (48px) margins         */
/*  Font: Times New Roman, 11pt, black on white                        */
/* ------------------------------------------------------------------ */

const baseStyle: React.CSSProperties = {
  fontFamily: FONT_EN,
  fontSize: BODY_SIZE,
  fontWeight: 400,
  lineHeight: "16pt",
  color: "#000",
};

interface Props {
  content: CoverLetterContent;
}

export function CoverLetterTemplate({ content }: Props) {
  const { sender, date, recipient, paragraphs } = content;
  const senderAddressLines = sender.addressLines ?? [];
  const recipientAddressLines = recipient.addressLines ?? [];
  const salutation = recipient.salutation ?? recipient.name;

  const hasRecipientBlock = recipient.name || recipientAddressLines.length > 0;

  return (
    <div
      data-cv-root
      className="relative bg-white text-black"
      style={{
        width: "794px",
        minHeight: "1123px",
        padding: "48px",
        fontFamily: FONT_EN,
        fontWeight: 400,
      }}
    >
      {/* ── Sender block (top-right) ── */}
      <div style={{ ...baseStyle, textAlign: "right", marginBottom: "40px" }}>
        {sender.name && <div>{sender.name}</div>}
        {senderAddressLines.map((l) => l.value ? <div key={l.id}>{l.value}</div> : null)}
      </div>

      {/* ── Date ── */}
      {date && (
        <PageBreakAvoid style={{ ...baseStyle, marginBottom: "16pt" }}>{date}</PageBreakAvoid>
      )}

      {/* ── Recipient block ── */}
      {hasRecipientBlock && (
        <PageBreakAvoid style={{ ...baseStyle, marginBottom: "16pt" }}>
          {recipient.name && <div>{recipient.name}</div>}
          {recipientAddressLines.map((l) => l.value ? <div key={l.id}>{l.value}</div> : null)}
        </PageBreakAvoid>
      )}

      {/* ── Salutation ── */}
      {salutation && (
        <PageBreakAvoid style={{ ...baseStyle, marginBottom: "12pt" }}>
          Dear {salutation}:
        </PageBreakAvoid>
      )}

      {/* ── Body paragraphs ── */}
      {paragraphs.map((p) =>
        p.text ? (
          <PageBreakAvoid key={p.id} style={{ ...baseStyle, marginBottom: "10pt" }}>
            {p.text}
          </PageBreakAvoid>
        ) : null,
      )}

      {/* ── Closing ── */}
      {sender.name && (
        <PageBreakAvoid style={{ ...baseStyle, marginTop: "16pt" }}>
          <div>Sincerely,</div>
          <div style={{ marginTop: "20pt" }}>{sender.name}</div>
        </PageBreakAvoid>
      )}

      {/* Placeholder when empty */}
      {!sender.name && !recipient.name && paragraphs.length === 0 && (
        <p className="mt-24 text-center text-sm text-gray-400">
          Fill in the form on the left to see your cover letter here.
        </p>
      )}
    </div>
  );
}
