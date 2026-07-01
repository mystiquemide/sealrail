// ────────────────────────────────────────
// Sealrail Agent Runtime Service
// Phase N: Real agent execution layer — dispatch, run, output binding
// ────────────────────────────────────────

import { randomUUID, createHash } from "crypto";
import { getDb } from "../db.js";
import { getTask, updateTaskStatus, getPaymentById } from "./tasks.js";
import { getAgent } from "./agents.js";
import { executeInvoiceRiskAgent } from "./invoice-risk-agent.js";
import { isLlmConfigured, LlmProviderError } from "./llm-provider.js";
import type {
  Task,
  TaskStatus,
  AgentExecutionOutput,
  InvoiceRiskAgentResult,
} from "../types.js";
import { config } from "../config.js";
import { recalculateReputation } from "./reputation.js";

// ── Row type ──────────────────────────────

interface AgentOutputRow {
  id: string;
  task_id: string;
  agent_id: string;
  result_json: string;
  output_hash: string;
  input_hash: string;
  started_at: string;
  completed_at: string;
  duration_ms: number;
  provider: string | null;
  model: string | null;
  created_at: string;
}

// ── Helpers ──────────────────────────────

function rowToAgentOutput(row: AgentOutputRow): AgentExecutionOutput {
  return {
    task_id: row.task_id,
    agent_id: row.agent_id,
    result: JSON.parse(row.result_json),
    started_at: row.started_at,
    completed_at: row.completed_at,
    duration_ms: row.duration_ms,
    output_hash: row.output_hash,
    input_hash: row.input_hash,
    model_metadata:
      row.provider && row.model
        ? { provider: row.provider, model: row.model }
        : null,
  };
}

// ── Agent output storage (in proofs table) ─

/**
 * Store agent execution output in a proof row.
 * The proof carries the input hash, output hash, and agent identity,
 * binding the agent's work to the proof chain.
 */
function storeAgentProof(params: {
  taskId: string;
  agentId: string;
  inputHash: string;
  outputHash: string;
  attestationHash: string;
  status?: string;
}): string {
  const db = getDb();
  const proofId = randomUUID();
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO proofs (id, task_id, agent_id, verifier_id, input_hash, output_hash,
      wasm_hash, attestation_hash, mode, status, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    proofId,
    params.taskId,
    params.agentId,
    "agent-runtime-v1",
    params.inputHash,
    params.outputHash,
    createHash("sha256")
      .update(`agent-execution:${params.agentId}`)
      .digest("hex"),
    params.attestationHash,
    config.teeVerificationMode,
    params.status ?? "verified",
    now,
  );

  return proofId;
}

/**
 * Store structured agent output metadata in the DB.
 * Uses the system_events table for persistent agent output records.
 */
function storeAgentOutputRow(params: {
  taskId: string;
  agentId: string;
  output: AgentExecutionOutput;
  proofId: string;
}): void {
  const db = getDb();
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO system_events (event_type, entity_type, entity_id, payload, created_at)
    VALUES (?, ?, ?, ?, ?)
  `).run(
    "agent_execution_completed",
    "task",
    params.taskId,
    JSON.stringify({
      agent_id: params.agentId,
      proof_id: params.proofId,
      output: params.output,
    }),
    now,
  );
}

// ── Agent output retrieval ────────────────

/**
 * Get the most recent agent execution output for a task.
 */
export function getAgentOutput(taskId: string): AgentExecutionOutput | null {
  const db = getDb();
  const rows = db
    .prepare(
      `SELECT * FROM system_events 
       WHERE entity_type = 'task' AND entity_id = ? AND event_type = 'agent_execution_completed'
       ORDER BY created_at DESC LIMIT 1`
    )
    .all(taskId) as { payload: string }[];

  if (rows.length === 0) return null;

  const payload = JSON.parse(rows[0].payload);
  return payload.output as AgentExecutionOutput;
}

// ── Main execution entry point ────────────

export interface AgentRunResult {
  taskId: string;
  agentId: string;
  status: string;
  proofId: string;
  output: AgentExecutionOutput;
  message: string;
}

/**
 * Execute a task's assigned agent.
 *
 * This is the real agent execution path — it:
 * 1. Validates the task is in a runnable state
 * 2. Looks up the assigned agent
 * 3. Dispatches to the correct agent runtime based on task type
 * 4. Stores structured output with hash binding
 * 5. Creates a verified proof record
 * 6. Advances the task state
 *
 * @param taskId - The task to execute
 * @returns The execution result
 */
export async function executeAgent(taskId: string): Promise<AgentRunResult> {
  const task = getTask(taskId);
  if (!task) {
    throw new Error("TASK_NOT_FOUND");
  }

  // Validate state: task must be funded or running
  const allowedFrom: TaskStatus[] = ["funded", "running"];
  if (!allowedFrom.includes(task.status)) {
    throw new Error(
      `INVALID_STATE: Task must be 'funded' or 'running' to execute agent. Current: '${task.status}'`
    );
  }

  // Look up the agent
  const agent = getAgent(task.agent_id);
  if (!agent) {
    throw new Error(
      `AGENT_NOT_FOUND: Agent '${task.agent_id}' does not exist. Cannot execute task.`
    );
  }

  if (agent.status !== "active") {
    throw new Error(
      `AGENT_INACTIVE: Agent '${agent.name}' (${task.agent_id}) is '${agent.status}'. Only active agents can execute tasks.`
    );
  }

  // Transition to running
  if (task.status === "funded") {
    updateTaskStatus(taskId, "running");
  }

  // Validate LLM is configured before attempting execution
  if (!isLlmConfigured()) {
    throw new LlmProviderError(
      "PROVIDER_NOT_CONFIGURED",
      "Agent execution requires a configured LLM provider. Set LLM_API_BASE_URL and LLM_API_KEY environment variables."
    );
  }

  // Dispatch based on task type
  let executionResult: {
    output: AgentExecutionOutput;
    riskResult?: InvoiceRiskAgentResult;
    providerInfo: { provider: string; model: string };
  };

  switch (task.task_type) {
    case "invoice_risk": {
      // Extract invoice data from task input
      const taskInput = task.input as Record<string, unknown>;
      const invoiceInput = {
        invoice_id: (taskInput.invoice_id as string) || task.id,
        vendor: (taskInput.vendor as string) || task.buyer_address,
        buyer: (taskInput.buyer as string) || agent.owner_address,
        amount_usd: (taskInput.amount_usd as number) || 0,
        currency: (taskInput.currency as string) || "USD",
        due_days: (taskInput.due_days as number) || 30,
        line_items: (taskInput.line_items as string[]) || [],
        ai_suggested_risk: (taskInput.ai_suggested_risk as number) || 0,
      };

      const result = await executeInvoiceRiskAgent(
        taskId,
        agent.id,
        invoiceInput,
      );
      executionResult = result;
      break;
    }

    default:
      throw new Error(
        `UNSUPPORTED_TASK_TYPE: No agent runtime for task type '${task.task_type}'. Supported: invoice_risk`
      );
  }

  // Hash-bind the output into a proof record
  const attestationHash = createHash("sha256")
    .update(
      JSON.stringify({
        task_id: taskId,
        agent_id: agent.id,
        output_hash: executionResult.output.output_hash,
        input_hash: executionResult.output.input_hash,
        provider: executionResult.providerInfo,
      })
    )
    .digest("hex");

  const proofId = storeAgentProof({
    taskId,
    agentId: agent.id,
    inputHash: executionResult.output.input_hash,
    outputHash: executionResult.output.output_hash,
    attestationHash,
    status: "verified",
  });

  // Store structured output
  storeAgentOutputRow({
    taskId,
    agentId: agent.id,
    output: executionResult.output,
    proofId,
  });

  // Link proof to task
  const db = getDb();
  const updatedProofIds = [...task.proof_ids, proofId];
  db.prepare("UPDATE tasks SET proof_ids = ? WHERE id = ?").run(
    JSON.stringify(updatedProofIds),
    taskId,
  );

  // Transition to proof_pending
  updateTaskStatus(taskId, "proof_pending");

  // Trigger reputation recalculation
  try {
    recalculateReputation(agent.id);
  } catch {
    // Silently skip — reputation should not break agent execution
  }

  return {
    taskId,
    agentId: agent.id,
    status: "proof_pending",
    proofId,
    output: executionResult.output,
    message: `Agent '${agent.name}' executed task '${task.title}'. Output verified and bound to proof ${proofId}.`,
  };
}

// ── Legacy integration: agent-aware task verification ──

/**
 * Run TEE verification with real agent execution (Phase N).
 *
 * This is the Phase N upgrade of runTaskVerification. It attempts real
 * agent execution when the task is eligible (active agent + invoice_risk
 * + configured LLM). If the agent is eligible but execution fails for any
 * reason (provider config, rate limit, invalid JSON, timeout, etc.), the
 * failure is thrown honestly — no pending proof is created.
 *
 * When agent execution is not applicable (no agent, agent inactive,
 * unsupported task type), it falls back to Blocky TEE verification if
 * available.
 *
 * There is no silent fallback to a pending placeholder proof. Either the
 * work is done honestly or the caller receives an actionable error.
 *
 * @param taskId - The task to verify
 * @returns Verification result with status
 * @throws {Error} on task-not-found, invalid state, or agent execution failure
 */
export async function runTaskWithAgentExecution(taskId: string): Promise<{
  taskId: string;
  status: string;
  proofId?: string;
  message: string;
  agentExecuted: boolean;
}> {
  const task = getTask(taskId);
  if (!task) {
    throw new Error("TASK_NOT_FOUND");
  }

  // Validate state transition: task must be funded or running
  const allowedFrom: TaskStatus[] = ["funded", "running"];
  if (!allowedFrom.includes(task.status)) {
    throw new Error(
      `INVALID_STATE: Task must be 'funded' or 'running' to execute verification. Current: '${task.status}'`
    );
  }

  // Transition to running if needed
  if (task.status === "funded") {
    updateTaskStatus(taskId, "running");
  }

  // Attempt 1: Real agent execution with LLM
  const agent = getAgent(task.agent_id);
  const isAgentEligible =
    agent &&
    agent.status === "active" &&
    task.task_type === "invoice_risk";

  if (isAgentEligible) {
    if (!isLlmConfigured()) {
      throw new LlmProviderError(
        "PROVIDER_NOT_CONFIGURED",
        "Agent execution requires a configured LLM provider. Set LLM_API_BASE_URL and LLM_API_KEY environment variables."
      );
    }

    // Execute agent — any failure (provider, rate-limit, invalid JSON,
    // timeout, etc.) is thrown honestly. No silent fallback to pending proof.
    const result = await executeAgent(taskId);
    return {
      taskId: result.taskId,
      status: result.status,
      proofId: result.proofId,
      message: `Agent executed with LLM. ${result.message}`,
      agentExecuted: true,
    };
  }

  // Attempt 2: Real Blocky TEE verification (skip if dry_run with no real TEE)
  const db = getDb();

  if (config.casperMode !== "dry_run") {
    try {
      const { isCliAvailable } = await import("./tee.js");
      if (isCliAvailable()) {
        const { verify: blockyVerify } = await import("./blocky.js");
        const verifyInput = {
          task_id: taskId,
          invoice_id: task.id,
          vendor: task.buyer_address,
          buyer: task.agent_id,
          amount_usd: 0,
          currency: "USD",
          due_days: 30,
          line_items: [],
          ai_suggested_risk: 0,
        };

        const verificationResult = await Promise.race([
          blockyVerify(verifyInput),
          new Promise<null>((resolve) => setTimeout(() => resolve(null), 3000)),
        ]);

        if (verificationResult?.status === "verified") {
          const proofId = randomUUID();
          const now = new Date().toISOString();
          db.prepare(`
            INSERT INTO proofs (id, task_id, agent_id, verifier_id, input_hash, output_hash,
              wasm_hash, attestation_hash, mode, status, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'verified', ?)
          `).run(
            proofId,
            taskId,
            task.agent_id,
            verificationResult.claims.hash_of_code || "verifier-default",
            verificationResult.claims.hash_of_input,
            verificationResult.claims.output,
            verificationResult.claims.hash_of_code,
            verificationResult.claims.hash_of_secrets,
            config.teeVerificationMode,
            now,
          );

          const updatedProofIds = [...task.proof_ids, proofId];
          db.prepare("UPDATE tasks SET proof_ids = ? WHERE id = ?").run(
            JSON.stringify(updatedProofIds),
            taskId,
          );

          updateTaskStatus(taskId, "proof_pending");

          return {
            taskId,
            status: "proof_pending",
            proofId,
            message: "TEE verification complete. Proof verified with real attestation claims.",
            agentExecuted: false,
          };
        }
      }
    } catch {
      // TEE not available — nothing to do, throw below
    }
  }

  throw new Error(
    "AGENT_UNAVAILABLE: No active agent is eligible for this task and no TEE CLI is available. Could not execute verification."
  );
}

// ── Health ────────────────────────────────

export function getAgentRuntimeHealth() {
  return {
    agentRuntimeAvailable: true,
    llmConfigured: isLlmConfigured(),
    supportedTaskTypes: ["invoice_risk"],
  };
}
