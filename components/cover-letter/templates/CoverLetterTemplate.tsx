"use client";

import type { CoverLetterContent } from "@/lib/types/cover-letter";

/* ------------------------------------------------------------------ */
/*  A4 page: 794px × 1123px at 96 DPI, 1.27cm (48px) margins         */
/*  Font: Times New Roman, 11pt, black on white                        */
/* ------------------------------------------------------------------ */

const FONT = "'Times New Roman', SimSun, serif";
const BODY_SIZE = "11pt";
const LINE_HEIGHT = "16pt";

const baseStyle: React.CSSProperties = {
  fontFamily: FONT,
  fontSize: BODY_SIZE,
  lineHeight: LINE_HEIGHT,
  color: "#000",
};

interface Props {
  content: CoverLetterContent;
}

export function CoverLetterTemplate({ content }: Props) {
  const { sender, date, recipient, paragraphs } = content;
  const salutation = recipient.salutation ?? recipient.name;

  return (
    <div
      className="relative bg-white text-black"
      style={{
        width: "794px",
        minHeight: "1123px",
        padding: "48px",
        fontFamily: FONT,
      }}
    >
      {/* ── Sender block (top-right) ── */}
      <div style={{ ...baseStyle, textAlign: "right", marginBottom: "40px" }}>
        {sender.name && <div>{sender.name}</div>}
        {sender.addressLine1 && <div>{sender.addressLine1}</div>}
        {sender.addressLine2 && <div>{sender.addressLine2}</div>}
      </div>

      {/* ── Date ── */}
      {date && (
        <div style={{ ...baseStyle, marginBottom: "16pt" }}>{date}</div>
      )}

      {/* ── Recipient block ── */}
      {(recipient.name || recipient.department || recipient.institution || recipient.addressLine1 || recipient.addressLine2) && (
        <div style={{ ...baseStyle, marginBottom: "16pt" }}>
          {recipient.name && <div>{recipient.name}</div>}
          {recipient.department && <div>{recipient.department}</div>}
          {recipient.institution && <div>{recipient.institution}</div>}
          {recipient.addressLine1 && <div>{recipient.addressLine1}</div>}
          {recipient.addressLine2 && <div>{recipient.addressLine2}</div>}
        </div>
      )}

      {/* ── Salutation ── */}
      {salutation && (
        <div style={{ ...baseStyle, marginBottom: "12pt" }}>
          Dear {salutation}:
        </div>
      )}

      {/* ── Body paragraphs ── */}
      {paragraphs.map((p) =>
        p.text ? (
          <p key={p.id} style={{ ...baseStyle, marginBottom: "10pt", marginTop: 0 }}>
            {p.text}
          </p>
        ) : null,
      )}

      {/* ── Closing ── */}
      {sender.name && (
        <div style={{ ...baseStyle, marginTop: "16pt" }}>
          <div>Sincerely,</div>
          <div style={{ marginTop: "36pt" }}>{sender.name}</div>
        </div>
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
