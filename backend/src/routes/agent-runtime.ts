// ────────────────────────────────────────
// Sealrail Agent Runtime Routes
// Phase N: API endpoints for agent execution and output retrieval
// ────────────────────────────────────────

import type { FastifyInstance } from "fastify";

import {
  executeAgent,
  getAgentOutput,
  getAgentRuntimeHealth,
} from "../services/agent-runtime.js";
import { getLlmProviderHealth } from "../services/llm-provider.js";
import { getInvoiceRiskAgentHealth } from "../services/invoice-risk-agent.js";
import { requireApiKeyWithScope } from "../middleware/auth.js";
import { API_SCOPES } from "../types.js";
import { config } from "../config.js";

/**
 * Register agent runtime routes on the Fastify instance.
 */
export function registerAgentRuntimeRoutes(app: FastifyInstance): void {
  // ── POST /api/tasks/:taskId/execute ─────
  // Execute the assigned agent for a task. Requires tasks:write scope.
  app.post<{ Params: { taskId: string } }>(
    "/api/tasks/:taskId/execute",
    {
      preHandler: [requireApiKeyWithScope([API_SCOPES.TASKS_WRITE])],
    },
    async (request, reply) => {
      const { taskId } = request.params;

      try {
        const result = await executeAgent(taskId);
        return reply.status(200).send({
          task_id: result.taskId,
          agent_id: result.agentId,
          status: result.status,
          proof_id: result.proofId,
          output: {
            input_hash: result.output.input_hash,
            output_hash: result.output.output_hash,
            result: result.output.result,
            model_metadata: result.output.model_metadata,
            duration_ms: result.output.duration_ms,
          },
          message: result.message,
        });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        request.log.error({ err: msg, taskId }, "Agent execution failed");

        if (msg === "TASK_NOT_FOUND" || msg.startsWith("AGENT_NOT_FOUND")) {
          return reply.status(404).send({ error: "NOT_FOUND", message: msg });
        }
        if (msg.startsWith("INVALID_STATE")) {
          return reply.status(400).send({ error: "INVALID_STATE", message: msg });
        }
        if (msg.startsWith("AGENT_INACTIVE")) {
          return reply.status(400).send({ error: "AGENT_INACTIVE", message: msg });
        }
        if (
          msg.includes("PROVIDER_NOT_CONFIGURED") ||
          msg.includes("API_KEY_MISSING")
        ) {
          return reply.status(503).send({
            error: "PROVIDER_NOT_CONFIGURED",
            message:
              "Agent execution requires a configured LLM provider. Set LLM_API_BASE_URL and LLM_API_KEY environment variables.",
            details: msg,
          });
        }
        if (msg.startsWith("UNSUPPORTED_TASK_TYPE")) {
          return reply.status(400).send({ error: "UNSUPPORTED_TASK_TYPE", message: msg });
        }
        return reply.status(500).send({
          error: "EXECUTION_FAILED",
          message: "Agent execution failed. Check server logs for details.",
        });
      }
    }
  );

  // ── GET /api/tasks/:taskId/output ───────
  // Get the most recent agent execution output for a task.
  app.get<{ Params: { taskId: string } }>(
    "/api/tasks/:taskId/output",
    async (request, reply) => {
      const { taskId } = request.params;

      const output = getAgentOutput(taskId);

      if (!output) {
        return reply.status(404).send({
          error: "NO_OUTPUT",
          message: `No agent execution output found for task '${taskId}'. Execute the agent first via POST /api/tasks/:taskId/execute.`,
        });
      }

      return reply.status(200).send({
        task_id: taskId,
        output: {
          agent_id: output.agent_id,
          result: output.result,
          input_hash: output.input_hash,
          output_hash: output.output_hash,
          model_metadata: output.model_metadata,
          started_at: output.started_at,
          completed_at: output.completed_at,
          duration_ms: output.duration_ms,
        },
      });
    }
  );

  // ── GET /api/agents/runtime/health ──────
  // Public health endpoint for the agent runtime. Returns only coarse readiness
  // booleans; detailed provider/model/runtime metadata belongs in admin status.
  app.get("/api/agents/runtime/health", async (_request, reply) => {
    const runtimeHealth = getAgentRuntimeHealth();
    const llmHealth = getLlmProviderHealth();
    const invoiceRiskHealth = getInvoiceRiskAgentHealth();

    const payload = {
      status: "ok",
      runtime_ready: runtimeHealth.agentRuntimeAvailable,
      llm_configured: llmHealth.configured,
      invoice_risk_agent_ready: invoiceRiskHealth.providerConfigured,
      mode: config.teeVerificationMode,
      timestamp: new Date().toISOString(),
    };

    if (config.nodeEnv !== "production") {
      return reply.status(200).send({
        ...payload,
        runtime: runtimeHealth,
        llm: llmHealth,
        invoice_risk_agent: invoiceRiskHealth,
      });
    }

    return reply.status(200).send(payload);
  });
}
