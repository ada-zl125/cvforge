export type AgentDocumentLanguage = "en" | "zh";

const ZH_INSTITUTION_NAMES: Record<string, string> = {
  "imperial college london": "伦敦帝国理工学院",
  "imperial college": "伦敦帝国理工学院",
  "university of huddersfield": "哈德斯菲尔德大学",
  "huddersfield university": "哈德斯菲尔德大学",
  "university of oxford": "牛津大学",
  "oxford university": "牛津大学",
  "university of cambridge": "剑桥大学",
  "cambridge university": "剑桥大学",
  "university college london": "伦敦大学学院",
  "ucl": "伦敦大学学院",
  "king's college london": "伦敦国王学院",
  "kings college london": "伦敦国王学院",
  "london school of economics": "伦敦政治经济学院",
  "london school of economics and political science": "伦敦政治经济学院",
  "the university of manchester": "曼彻斯特大学",
  "university of manchester": "曼彻斯特大学",
  "university of edinburgh": "爱丁堡大学",
  "university of bristol": "布里斯托大学",
  "university of warwick": "华威大学",
  "university of leeds": "利兹大学",
  "university of sheffield": "谢菲尔德大学",
  "university of birmingham": "伯明翰大学",
  "university of southampton": "南安普顿大学",
  "university of glasgow": "格拉斯哥大学",
  "university of nottingham": "诺丁汉大学",
  "durham university": "杜伦大学",
  "university of york": "约克大学",
};

const ZH_COUNTRY_NAMES: Record<string, string> = {
  uk: "英国",
  "u.k.": "英国",
  "united kingdom": "英国",
  england: "英国",
  usa: "美国",
  us: "美国",
  "u.s.": "美国",
  "united states": "美国",
  "united states of america": "美国",
  china: "中国",
  austria: "奥地利",
  rwanda: "卢旺达",
  france: "法国",
  germany: "德国",
  italy: "意大利",
  spain: "西班牙",
  canada: "加拿大",
  australia: "澳大利亚",
  singapore: "新加坡",
};

const ZH_CITY_NAMES: Record<string, string> = {
  london: "伦敦",
  oxford: "牛津",
  huddersfield: "哈德斯菲尔德",
  cambridge: "剑桥",
  manchester: "曼彻斯特",
  edinburgh: "爱丁堡",
  bristol: "布里斯托",
  warwick: "华威",
  leeds: "利兹",
  sheffield: "谢菲尔德",
  birmingham: "伯明翰",
  southampton: "南安普顿",
  glasgow: "格拉斯哥",
  nottingham: "诺丁汉",
  durham: "杜伦",
  york: "约克",
  beijing: "北京",
  shanghai: "上海",
  shenzhen: "深圳",
  "hong kong": "香港",
  "new orleans": "新奥尔良",
  vienna: "维也纳",
  kigali: "基加利",
};

const INSTITUTION_KEYS = new Set(["institution", "organization"]);
const LOCATION_KEYS = new Set(["location", "addressLine1", "addressLine2", "addressLine3"]);
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

function normalizeKnownInstitutionForChinese(value: string): string {
  const key = value.trim().toLowerCase();
  return ZH_INSTITUTION_NAMES[key] ?? value;
}

function normalizeLocationForChinese(value: string): string {
  const trimmed = value.trim();
  const parts = trimmed.split(",").map((part) => part.trim()).filter(Boolean);
  if (parts.length !== 2) return value;

  const first = parts[0].toLowerCase();
  const second = parts[1].toLowerCase();
  const firstCountry = ZH_COUNTRY_NAMES[first];
  const secondCountry = ZH_COUNTRY_NAMES[second];
  const firstCity = ZH_CITY_NAMES[first];
  const secondCity = ZH_CITY_NAMES[second];

  if (firstCity && secondCountry) return `${secondCountry}, ${firstCity}`;
  if (firstCountry && secondCity) return `${firstCountry}, ${secondCity}`;

  return value;
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

function normalizeStringForDocumentLanguage(key: string | undefined, value: string, documentLanguage: AgentDocumentLanguage): string {
  if (documentLanguage !== "zh") return value;
  let normalized = value;
  if (key && INSTITUTION_KEYS.has(key)) normalized = normalizeKnownInstitutionForChinese(normalized);
  if (key && LOCATION_KEYS.has(key)) normalized = normalizeLocationForChinese(normalized);
  if (key === "value") normalized = normalizeLocationForChinese(normalizeKnownInstitutionForChinese(normalized));
  return normalizeChineseDocumentPunctuation(normalized);
}

export function normalizeToolArgsForDocumentLanguage(value: unknown, documentLanguage: AgentDocumentLanguage, key?: string): unknown {
  if (typeof value === "string") return normalizeStringForDocumentLanguage(key, value, documentLanguage);
  if (Array.isArray(value)) return value.map((item) => normalizeToolArgsForDocumentLanguage(item, documentLanguage, key));
  if (!value || typeof value !== "object") return value;

  return Object.fromEntries(
    Object.entries(value).map(([entryKey, entryValue]) => [
      entryKey,
      normalizeToolArgsForDocumentLanguage(entryValue, documentLanguage, entryKey),
    ])
  );
}
