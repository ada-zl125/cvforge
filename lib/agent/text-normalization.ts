export type AgentDocumentLanguage = "en" | "zh";

const HALF_WIDTH_PUNCTUATION: Record<string, string> = {
  "，": ", ",
  "；": "; ",
  "：": ": ",
  "？": "?",
  "！": "!",
  "、": ", ",
  "（": "(",
  "）": ")",
  "【": "[",
  "】": "]",
  "“": "\"",
  "”": "\"",
  "‘": "'",
  "’": "'",
  "《": "<",
  "》": ">",
  "…": "...",
};

function repairMarkdownStrongLabels(text: string): string {
  return text.replace(/\*\*([^*\n]+?):\s+\*\*/g, "**$1:**");
}

function normalizeEnglishPunctuation(text: string): string {
  return repairMarkdownStrongLabels(text
    .replace(/^(\s*)-\s+/gm, "$1* ")
    .replace(/\s*->\s*/g, " to ")
    .replace(/\s*[—–]\s*/g, ", ")
    .replace(/[，。；：？！、（）【】“”‘’《》…]/g, (char) => ({
      ...HALF_WIDTH_PUNCTUATION,
      "。": ".",
    }[char] ?? char))
    .replace(/\s+([,.;:!?，。；：！？])/g, "$1")
    .replace(/([,;:])\s*/g, "$1 ")
    .replace(/([,，])\s*([。.!?！？])/g, "$2")
    .replace(/([.!?])\s+(\d+\.\s+)/g, "$1\n$2")
    .replace(/([.!?])\s+(\*\s+)/g, "$1\n$2")
    .replace(/[ \t]{2,}/g, " ")
    .trim());
}

function normalizeChineseDocumentPunctuation(text: string): string {
  const hasChinese = /\p{Script=Han}/u.test(text);
  return repairMarkdownStrongLabels(text
    .replace(/^(\s*)-\s+/gm, "$1* ")
    .replace(/\s*->\s*/g, " 到 ")
    .replace(/\s*[—–]\s*/g, ", ")
    .replace(/[，；：？！、（）【】“”‘’《》…]/g, (char) => HALF_WIDTH_PUNCTUATION[char] ?? char)
    .replace(hasChinese ? /(?<![\w./@-])\.(?=\s|$)/g : /\.(?!)/g, "。")
    .replace(hasChinese ? /(?<=[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}A-Za-z])\.(?=\s|$)/gu : /\.(?!)/g, "。")
    .replace(/\s+([,.;:!?。])/g, "$1")
    .replace(/([,;:])\s*/g, "$1 ")
    .replace(/([,，])\s*([。.!?！？])/g, "$2")
    .replace(/([\p{Script=Han}])([A-Za-z0-9][A-Za-z0-9+#./-]*)/gu, "$1 $2")
    .replace(/([A-Za-z0-9][A-Za-z0-9+#./-]*)([\p{Script=Han}])/gu, "$1 $2")
    .replace(/([。.!?])\s+(\d+\.\s+)/g, "$1\n$2")
    .replace(/([。.!?])\s+(\*\s+)/g, "$1\n$2")
    .replace(/[ \t]{2,}/g, " ")
    .trim());
}

export function normalizeAssistantText(text: string, documentLanguage: AgentDocumentLanguage = "en"): string {
  return documentLanguage === "zh"
    ? normalizeChineseDocumentPunctuation(text)
    : normalizeEnglishPunctuation(text);
}

export function normalizeToolArgsForDocumentLanguage(
  value: unknown,
  documentLanguage: AgentDocumentLanguage
): unknown {
  if (typeof value === "string") return normalizeAssistantText(value, documentLanguage);
  if (Array.isArray(value)) return value.map((item) => normalizeToolArgsForDocumentLanguage(item, documentLanguage));
  if (!value || typeof value !== "object") return value;

  return Object.fromEntries(
    Object.entries(value).map(([entryKey, entryValue]) => [
      entryKey,
      normalizeToolArgsForDocumentLanguage(entryValue, documentLanguage),
    ])
  );
}
