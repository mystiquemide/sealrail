// ────────────────────────────────────────
// Sealrail Invoice Risk Agent
// Phase N: First-party LLM-powered invoice risk analysis agent
// ────────────────────────────────────────

import { createHash } from "crypto";
import { complete, isLlmConfigured, LlmProviderError } from "./llm-provider.js";
import type {
  InvoiceRiskAgentResult,
  AgentExecutionOutput,
  LlmCompletionResponse,
} from "../types.js";

// ── Prompt builder ────────────────────────

interface InvoiceRiskInputData {
  invoice_id: string;
  vendor: string;
  buyer: string;
  amount_usd: number;
  currency: string;
  due_days: number;
  line_items: string[];
  ai_suggested_risk: number;
}

function buildPrompt(input: InvoiceRiskInputData): string {
  return `Analyze this invoice for risk factors and return a structured JSON assessment.

INVOICE DATA:
- Invoice ID: ${input.invoice_id}
- Vendor: ${input.vendor}
- Buyer: ${input.buyer}
- Amount: ${input.amount_usd} ${input.currency}
- Payment terms: Due in ${input.due_days} days
- Line items: ${input.line_items.join(", ") || "none specified"}
- AI-suggested risk score: ${input.ai_suggested_risk}/100

Analyze for the following risk factors:
1. Unusual amount vs. typical invoice patterns
2. Vendor legitimacy indicators
3. Payment term anomalies
4. Line item completeness and specificity
5. Currency and compliance flags

Return ONLY a JSON object with this exact structure:
{
  "risk_score": <number 0-100, where 0=safe, 100=extreme risk>,
  "decision": "<approve | review | reject>",
  "reasoning": "<concise analysis, 2-3 sentences>",
  "flags": ["<specific risk flag if any>", ...],
  "recommended_action": "<specific next step recommendation>",
  "confidence": <number 0.0-1.0 representing model confidence>
}`;
}

// ── Response parser ───────────────────────

function parseRiskResponse(content: string): InvoiceRiskAgentResult {
  // Extract JSON from the response (handle possible markdown wrapping)
  let jsonText = content.trim();

  // Strip markdown code fences if present
  const jsonMatch = jsonText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (jsonMatch) {
    jsonText = jsonMatch[1].trim();
  }

  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(jsonText);
  } catch {
    throw new Error(
      `INVALID_RESPONSE: LLM did not return valid JSON. Raw response: ${content.slice(0, 500)}`
    );
  }

  // Validate required fields
  const riskScore = typeof parsed.risk_score === "number" ? parsed.risk_score : NaN;
  if (isNaN(riskScore) || riskScore < 0 || riskScore > 100) {
    throw new Error(
      `INVALID_RESPONSE: risk_score must be a number between 0 and 100. Got: ${parsed.risk_score}`
    );
  }

  const decision = parsed.decision;
  if (decision !== "approve" && decision !== "review" && decision !== "reject") {
    throw new Error(
      `INVALID_RESPONSE: decision must be 'approve', 'review', or 'reject'. Got: ${decision}`
    );
  }

  const reasoning =
    typeof parsed.reasoning === "string" && parsed.reasoning.trim()
      ? parsed.reasoning.trim()
      : "No reasoning provided.";

  const flags = Array.isArray(parsed.flags) ? parsed.flags.map(String) : [];

  const recommendedAction =
    typeof parsed.recommended_action === "string" && parsed.recommended_action.trim()
      ? parsed.recommended_action.trim()
      : "Manual review recommended.";

  const confidence =
    typeof parsed.confidence === "number" ? parsed.confidence : 0.5;

  return {
    risk_score: Math.round(riskScore),
    decision: decision as InvoiceRiskAgentResult["decision"],
    reasoning,
    flags,
    recommended_action: recommendedAction,
    confidence: Math.min(1, Math.max(0, confidence)),
  };
}

// ── Agent executor ────────────────────────

export interface InvoiceRiskExecutionResult {
  output: AgentExecutionOutput;
  riskResult: InvoiceRiskAgentResult;
  providerInfo: { provider: string; model: string };
}

/**
 * Execute the Invoice Risk Agent for a given task.
 *
 * This is the first-party agent runtime: it takes structured task input,
 * sends it to a configurable LLM provider, parses the structured response,
 * and binds the input/output into a hash-sealed proof record.
 *
 * @param taskId - The task being executed
 * @param agentId - The agent performing the analysis
 * @param input - The invoice risk input data
 * @returns The execution result with hashed output binding
 */
export async function executeInvoiceRiskAgent(
  taskId: string,
  agentId: string,
  input: InvoiceRiskInputData
): Promise<InvoiceRiskExecutionResult> {
  // 1. Verify provider is configured
  if (!isLlmConfigured()) {
    throw new LlmProviderError(
      "PROVIDER_NOT_CONFIGURED",
      "Cannot execute Invoice Risk Agent: no LLM provider configured. Set LLM_API_BASE_URL and LLM_API_KEY."
    );
  }

  const startedAt = new Date().toISOString();

  // 2. Build and send the prompt
  const prompt = buildPrompt(input);
  let response: LlmCompletionResponse;

  try {
    response = await complete(prompt, { temperature: 0.1, maxTokens: 1024 });
  } catch (err: unknown) {
    if (err instanceof LlmProviderError) {
      throw err; // Re-throw provider errors as-is
    }
    const msg = err instanceof Error ? err.message : String(err);
    throw new Error(`Agent execution failed: ${msg}`);
  }

  // 3. Parse the structured output
  const riskResult = parseRiskResponse(response.content);

  const completedAt = new Date().toISOString();
  const durationMs =
    new Date(completedAt).getTime() - new Date(startedAt).getTime();

  // 4. Hash-bind input and output for proof path
  const inputCanonical = JSON.stringify({
    task_id: taskId,
    agent_id: agentId,
    input,
  });
  const outputCanonical = JSON.stringify({
    task_id: taskId,
    agent_id: agentId,
    result: riskResult,
    started_at: startedAt,
    completed_at: completedAt,
  });

  const inputHash = createHash("sha256").update(inputCanonical).digest("hex");
  const outputHash = createHash("sha256").update(outputCanonical).digest("hex");

  // 5. Build the execution output
  const output: AgentExecutionOutput = {
    task_id: taskId,
    agent_id: agentId,
    result: riskResult as unknown as Record<string, unknown>,
    started_at: startedAt,
    completed_at: completedAt,
    duration_ms: durationMs,
    output_hash: outputHash,
    input_hash: inputHash,
    model_metadata: {
      provider: "openai_compatible",
      model: response.model,
    },
  };

  return {
    output,
    riskResult,
    providerInfo: {
      provider: "openai_compatible",
      model: response.model,
    },
  };
}

// ── Health ────────────────────────────────

export function getInvoiceRiskAgentHealth() {
  return {
    agent: "invoice_risk",
    providerConfigured: isLlmConfigured(),
  };
}
