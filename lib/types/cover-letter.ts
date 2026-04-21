/* ------------------------------------------------------------------ */
/*  Cover Letter data types                                             */
/* ------------------------------------------------------------------ */

export type CoverLetterTemplate = "classic";

/* ---- Repeatable address line ---- */

export interface AddressLine {
  id: string;
  value: string;
}

/* ---- Sender (top-right block) ---- */

export interface CoverLetterSender {
  name: string;
  addressLines: AddressLine[];
}

/* ---- Recipient (left block) ---- */

export interface CoverLetterRecipient {
  name: string;
  salutation?: string;
  addressLines: AddressLine[];
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
