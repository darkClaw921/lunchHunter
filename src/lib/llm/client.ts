import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import type { LanguageModel } from "ai";

/**
 * OpenRouter LLM client (shared singleton).
 *
 * Используется Vercel AI SDK v6 (`ai` package) поверх OpenRouter провайдера.
 * Конфигурируется через переменные окружения:
 *  - OPENROUTER_API_KEY — обязательный ключ доступа к OpenRouter
 *  - OPENROUTER_MODEL   — имя модели (по умолчанию `x-ai/grok-4-fast`)
 *
 * Экспорт:
 *  - openrouter — инстанс провайдера (вызываемый объект, возвращающий модель)
 *  - getVisionModel() — возвращает LanguageModel для текущей vision-модели
 *  - LLM_MODEL_ID — нормализованное имя модели
 *
 * Ошибка выбрасывается лениво при вызове getVisionModel(), чтобы модуль
 * можно было безопасно импортировать на билд-этапе без API-ключа.
 */

export const LLM_MODEL_ID =
  process.env.OPENROUTER_MODEL?.trim() || "x-ai/grok-4-fast";

let cachedProvider: ReturnType<typeof createOpenRouter> | null = null;

export function getOpenRouter(): ReturnType<typeof createOpenRouter> {
  if (cachedProvider) return cachedProvider;
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey || apiKey.length === 0) {
    throw new Error(
      "OPENROUTER_API_KEY is not set — невозможно обратиться к LLM",
    );
  }
  cachedProvider = createOpenRouter({ apiKey });
  return cachedProvider;
}

export function getVisionModel(): LanguageModel {
  return getOpenRouter().chat(LLM_MODEL_ID);
}
