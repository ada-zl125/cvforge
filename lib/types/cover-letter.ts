/* ------------------------------------------------------------------ */
/*  Cover Letter data types                                             */
/* ------------------------------------------------------------------ */

export type CoverLetterTemplate = "classic";

/* ---- Sender (top-right block) ---- */

export interface CoverLetterSender {
  name: string;
  addressLine1: string;
  addressLine2: string;
}

/* ---- Recipient (left block) ---- */

export interface CoverLetterRecipient {
  /** First line of address block. Falls back as salutation if `salutation` is unset. */
  name: string;
  /** Optional override for "Dear [salutation]:". If absent, `name` is used. */
  salutation?: string;
  department?: string;
  institution?: string;
  addressLine1?: string;
  addressLine2?: string;
}

/* ---- Body paragraphs ---- */

export interface ParagraphItem {
  id: string;
  text: string;
}

/* ---- Top-level content ---- */

export interface CoverLetterContent {
  sender: CoverLetterSender;
  date: string;
  recipient: CoverLetterRecipient;
  paragraphs: ParagraphItem[];
}
