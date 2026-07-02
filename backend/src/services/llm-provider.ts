// ────────────────────────────────────────
// Sealrail LLM Provider Service
// Phase N: Provider-agnostic LLM client for agent execution
// ────────────────────────────────────────

import type { LlmProvider, LlmCompletionResponse, LlmProviderErrorCode } from "../types.js";
import { config } from "../config.js";

// ── Error class ───────────────────────────

export class LlmProviderError extends Error {
  code: LlmProviderErrorCode;
  constructor(code: LlmProviderErrorCode, message: string) {
    super(message);
    this.name = "LlmProviderError";
    this.code = code;
  }
}

// ── OpenAI-compatible provider ────────────

class OpenAICompatibleProvider implements LlmProvider {
  name = "openai_compatible";

  isConfigured(): boolean {
    return !!(config.llmApiBaseUrl && config.llmApiKey);
  }

  async complete(
    prompt: string,
    options?: { temperature?: number; maxTokens?: number }
  ): Promise<LlmCompletionResponse> {
    if (!this.isConfigured()) {
      // Check which piece is missing for a better error message
      if (!config.llmApiKey && config.llmApiBaseUrl) {
        throw new LlmProviderError(
          "API_KEY_MISSING",
          "LLM provider is partially configured: API base URL is set but API key is missing. Set LLM_API_KEY."
        );
      }
      if (config.llmApiKey && !config.llmApiBaseUrl) {
        throw new LlmProviderError(
          "API_KEY_MISSING",
          "LLM provider is partially configured: API key is set but base URL is missing. Set LLM_API_BASE_URL."
        );
      }
      throw new LlmProviderError(
        "PROVIDER_NOT_CONFIGURED",
        "LLM provider is not configured. Set LLM_API_BASE_URL and LLM_API_KEY environment variables."
      );
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), config.llmTimeoutMs);

    try {
      const response = await fetch(`${config.llmApiBaseUrl}/v1/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${config.llmApiKey}`,
        },
        body: JSON.stringify({
          model: config.llmModel,
          messages: [
            { role: "system", content: "You are a precise, structured-output risk analysis agent. Always respond with valid JSON only. No markdown, no commentary." },
            { role: "user", content: prompt },
          ],
          temperature: options?.temperature ?? 0.1,
          max_tokens: options?.maxTokens ?? 1024,
          response_format: { type: "json_object" },
        }),
        signal: controller.signal,
      });

      if (response.status === 429) {
        throw new LlmProviderError(
          "RATE_LIMITED",
          "LLM provider returned 429 - rate limited. Retry after the window."
        );
      }

      if (!response.ok) {
        const body = await response.text().catch(() => "");
        throw new LlmProviderError(
          "API_REQUEST_FAILED",
          `LLM provider returned HTTP ${response.status}${body ? `: ${body.slice(0, 200)}` : ""}`
        );
      }

      const data = (await response.json()) as {
        choices: { message: { content: string } }[];
        model: string;
        usage?: { prompt_tokens: number; completion_tokens: number };
      };

      const content = data.choices?.[0]?.message?.content;
      if (!content) {
        throw new LlmProviderError(
          "INVALID_RESPONSE",
          "LLM provider returned an empty response."
        );
      }

      return {
        content,
        model: data.model || config.llmModel,
        usage: data.usage,
      };
    } catch (err: unknown) {
      if (err instanceof LlmProviderError) throw err;

      const msg = err instanceof Error ? err.message : String(err);

      if (msg.includes("aborted") || msg.includes("AbortError")) {
        throw new LlmProviderError(
          "TIMEOUT",
          `LLM provider request timed out after ${config.llmTimeoutMs}ms`
        );
      }

      if (msg.includes("ECONNREFUSED") || msg.includes("fetch failed")) {
        throw new LlmProviderError(
          "API_REQUEST_FAILED",
          `Cannot reach LLM provider at ${config.llmApiBaseUrl}: ${msg}`
        );
      }

      throw new LlmProviderError("UNKNOWN", msg);
    } finally {
      clearTimeout(timeout);
    }
  }
}

// ── No-op provider (when LLM is disabled) ─

class NoOpProvider implements LlmProvider {
  name = "none";

  isConfigured(): boolean {
    return false;
  }

  async complete(): Promise<LlmCompletionResponse> {
    throw new LlmProviderError(
      "PROVIDER_NOT_CONFIGURED",
      "LLM provider is set to 'none'. Agent execution requires a configured LLM provider. Set LLM_PROVIDER=openai_compatible and configure LLM_API_BASE_URL + LLM_API_KEY."
    );
  }
}

// ── Provider factory ──────────────────────

function createProvider(): LlmProvider {
  switch (config.llmProvider) {
    case "none":
      return new NoOpProvider();
    case "openai_compatible":
    default:
      return new OpenAICompatibleProvider();
  }
}

let _provider: LlmProvider | null = null;

/**
 * Get or create the configured LLM provider.
 */
export function getLlmProvider(): LlmProvider {
  if (!_provider) {
    _provider = createProvider();
  }
  return _provider;
}

/**
 * Override the LLM provider for testing.
 * Call with no arguments to reset to config-based provider.
 */
export function __setLlmProvider(provider?: LlmProvider): void {
  if (provider) {
    _provider = provider;
  } else {
    _provider = null;
  }
}

/**
 * Check if an LLM provider is configured and available.
 */
export function isLlmConfigured(): boolean {
  return getLlmProvider().isConfigured();
}

/**
 * Send a completion request through the configured LLM provider
 * with optional retry on transient errors.
 */
export async function complete(
  prompt: string,
  options?: { temperature?: number; maxTokens?: number }
): Promise<LlmCompletionResponse> {
  const provider = getLlmProvider();

  let lastError: LlmProviderError | null = null;

  for (let attempt = 1; attempt <= config.llmMaxRetries + 1; attempt++) {
    try {
      return await provider.complete(prompt, options);
    } catch (err: unknown) {
      if (err instanceof LlmProviderError) {
        lastError = err;
        // Don't retry on permanent errors
        if (
          err.code === "PROVIDER_NOT_CONFIGURED" ||
          err.code === "API_KEY_MISSING" ||
          err.code === "INVALID_RESPONSE"
        ) {
          throw err;
        }
        // Retry on transient errors
        if (attempt <= config.llmMaxRetries) {
          const delay = Math.min(500 * Math.pow(2, attempt - 1), 5000);
          await new Promise((resolve) => setTimeout(resolve, delay));
          continue;
        }
      }
      throw err;
    }
  }

  // All retries exhausted
  throw lastError || new LlmProviderError("UNKNOWN", "LLM completion failed after all retries");
}

// ── Health check ──────────────────────────

export function getLlmProviderHealth() {
  const provider = getLlmProvider();
  return {
    provider: provider.name,
    configured: provider.isConfigured(),
    model: config.llmModel,
    baseUrlConfigured: !!config.llmApiBaseUrl,
    keyConfigured: !!config.llmApiKey,
  };
}
