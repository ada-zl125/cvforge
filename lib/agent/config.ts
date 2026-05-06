export const LLM_CONFIG_KEY = "cvforge_llm_config";

export interface LLMConfig {
  baseURL: string;
  apiKey: string;
  model: string;
}

export function isLLMConfigComplete(config: LLMConfig | null): config is LLMConfig {
  return !!(
    config?.baseURL.trim() &&
    config.apiKey.trim() &&
    config.model.trim()
  );
}

export function readLLMConfig(): LLMConfig | null {
  if (typeof window === "undefined") return null;
  const stored = localStorage.getItem(LLM_CONFIG_KEY);
  if (!stored) return null;
  try {
    return JSON.parse(stored) as LLMConfig;
  } catch {
    return null;
  }
}

export function writeLLMConfig(config: LLMConfig): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(LLM_CONFIG_KEY, JSON.stringify(config));
  window.dispatchEvent(new Event("llm-config-change"));
}

export function clearLLMConfig(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(LLM_CONFIG_KEY);
  window.dispatchEvent(new Event("llm-config-change"));
}
