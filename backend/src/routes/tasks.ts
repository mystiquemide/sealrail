// ────────────────────────────────────────
// Sealrail Task Routes
// Phase D: POST /api/tasks/:taskId/anchor - Casper anchor endpoint
// Phase E: POST /api/tasks, GET /api/tasks/:taskId, run, verify, unlock-payment
// Audit fix C1+H2: API key auth on all mutation routes
// ────────────────────────────────────────

import type { FastifyInstance } from "fastify";

import {
  createTask,
  createTaskWithPayment,
  getTask,
  getTaskWithTrail,
  updateTaskStatus,
  listTasks,
  anchorTaskProof,
  runTaskVerification,
  verifyTaskProof,
  unlockTaskPayment,
  isValidTaskTransition,
} from "../services/tasks.js";
import { getAgentOutput, runTaskWithAgentExecution } from "../services/agent-runtime.js";
import { LlmProviderError } from "../services/llm-provider.js";
import { requireApiKey, requireApiKeyWithScope } from "../middleware/auth.js";
import { API_SCOPES } from "../types.js";
import { config } from "../config.js";
import type { Payment, Task, TaskStatus } from "../types.js";
import { listAgents } from "../services/agents.js";

// ── Request schemas ──────────────────────

const createTaskSchema = {
  type: "object",
  required: ["agent_id", "buyer_address", "total_amount", "currency"],
  properties: {
    agent_id: { type: "string", minLength: 1 },
    buyer_address: { type: "string", minLength: 1 },
    title: { type: "string" },
    task_type: { type: "string" },
    input: { type: "object" },
    total_amount: { type: "number", minimum: 0 },
    currency: { type: "string", enum: ["CSPR", "USD"] },
    unlock_rule: { type: "string", enum: ["proof_verified", "workflow_verified"] },
  },
};

const statusUpdateSchema = {
  type: "object",
  required: ["status"],
  properties: {
    status: {
      type: "string",
      enum: [
        "draft", "funded", "running", "proof_pending",
        "proof_verified", "anchored", "payable", "paid",
        "blocked", "failed",
      ],
    },
  },
};


function publicTask(task: Task): Task {
  const input = task.input as Record<string, unknown>;
  return {
    ...task,
    buyer_address: "demo-buyer",
    input: {
      invoice_id: input.invoice_id,
      amount_usd: input.amount_usd,
      terms: input.terms,
    },
  };
}

function publicPayment(payment: Payment | null): Payment | null {
  if (!payment) return null;
  return {
    ...payment,
    buyer_address: "demo-buyer",
    recipients: [],
  };
}

/**
 * Register task-related routes on the Fastify instance.
 */
export function registerTaskRoutes(app: FastifyInstance): void {

  // ── POST /api/demo/invoice-proof ─────────
  // Demo runner: executes the invoice flow server-side without exposing broad
  // write scopes to browsers. Requires a Casper-wallet-verified API key
  // unless REQUIRE_WALLET_AUTH=false (kill switch). Rate limiting still applies.
  app.post<{
    Body: {
      agent_id?: string;
      buyer_address: string;
      total_amount: number;
      currency: string;
      title?: string;
      task_type?: string;
      input?: Record<string, unknown>;
    };
  }>(
    "/api/demo/invoice-proof",
    {
      schema: { body: createTaskSchema },
      preHandler: config.requireWalletAuth ? [requireApiKey] : [],
    },
    // lgtm[js/missing-rate-limiting] buildApp installs a root onRequest limiter before all route registration.
    async (request, reply) => {
      const body = request.body;
      try {
        const agentId = body.agent_id || listAgents({ status: "active", category: "invoice" })[0]?.id;
        if (!agentId) {
          return reply.status(404).send({ error: "AGENT_NOT_FOUND", message: "No active invoice agent is registered." });
        }

        const { task, payment } = createTaskWithPayment({
          buyerAddress: request.apiKey?.owner_address ?? "demo-buyer",
          agentId,
          title: body.title,
          taskType: body.task_type,
          input: body.input,
          totalAmount: body.total_amount,
          currency: body.currency,
        });

        const runRes = await runTaskWithAgentExecution(task.id);
        verifyTaskProof(task.id);
        const anchorRes = await anchorTaskProof(task.id);
        const unlockRes = unlockTaskPayment(task.id);
        const output = getAgentOutput(task.id);
        const { proofs } = getTaskWithTrail(task.id);
        const latestProof = proofs[proofs.length - 1];

        return reply.status(200).send({
          task_id: task.id,
          payment_id: payment.id,
          proof_id: anchorRes.proofId || runRes.proofId,
          anchor_hash: anchorRes.anchorHash,
          deploy_hash: anchorRes.deployHash,
          casper_mode: anchorRes.mode,
          payment_status: unlockRes.paymentStatus,
          proof: latestProof ? {
            wasm_hash: latestProof.wasm_hash,
            attestation_hash: latestProof.attestation_hash,
          } : { wasm_hash: "pending", attestation_hash: "pending" },
          output: output ? {
            result: output.result,
            input_hash: output.input_hash,
            output_hash: output.output_hash,
            model_metadata: output.model_metadata,
            duration_ms: output.duration_ms,
          } : null,
        });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        request.log.error({ err: msg }, "Public demo invoice proof failed");
        if (msg.startsWith("INVALID") || msg.startsWith("NO_")) {
          return reply.status(400).send({ error: "DEMO_FLOW_FAILED", message: msg });
        }
        if (err instanceof LlmProviderError && err.code === "PROVIDER_NOT_CONFIGURED") {
          return reply.status(503).send({ error: "PROVIDER_NOT_CONFIGURED", message: "Agent execution is temporarily unavailable." });
        }
        return reply.status(500).send({ error: "DEMO_FLOW_FAILED", message: "Demo flow failed. Try again in a moment." });
      }
    }
  );

  // ── POST /api/tasks ────────────────────
  // Phase E: Create a payment-backed task. Requires tasks:write scope.
  app.post<{
    Body: {
      agent_id: string;
      buyer_address: string;
      title?: string;
      task_type?: string;
      input?: Record<string, unknown>;
      total_amount: number;
      currency: string;
      unlock_rule?: string;
    };
  }>(
    "/api/tasks",
    {
      schema: { body: createTaskSchema },
      preHandler: [requireApiKeyWithScope([API_SCOPES.TASKS_WRITE])],
    },
    async (request, reply) => {
      const body = request.body;

      try {
        const { task, payment } = createTaskWithPayment({
          buyerAddress: body.buyer_address,
          agentId: body.agent_id,
          title: body.title,
          taskType: body.task_type,
          input: body.input,
          totalAmount: body.total_amount,
          currency: body.currency,
          unlockRule: body.unlock_rule,
        });

        return reply.status(201).send({
          task_id: task.id,
          payment_id: payment.id,
          task_status: task.status,
          payment_status: payment.status,
          total_amount: payment.total_amount,
          currency: payment.currency,
          message: "Payment-backed task created. Task is funded.",
        });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        request.log.error({ err: msg }, "Failed to create task");

        if (msg.includes("INVALID")) {
          return reply.status(400).send({ error: "INVALID_REQUEST", message: msg });
        }
        return reply.status(500).send({ error: "CREATE_FAILED", message: "Internal server error" });
      }
    }
  );

  // ── GET /api/tasks ─────────────────────
  app.get<{ Querystring: { status?: string } }>(
    "/api/tasks",
    async (request, reply) => {
      const { status } = request.query;
      const tasks = listTasks(status as TaskStatus | undefined).map(publicTask);
      return reply.status(200).send({ tasks, count: tasks.length });
    }
  );

  // ── GET /api/tasks/:taskId ─────────────
  app.get<{ Params: { taskId: string } }>(
    "/api/tasks/:taskId",
    async (request, reply) => {
      const { taskId } = request.params;

      const { task, payment, proofs } = getTaskWithTrail(taskId);

      if (!task) {
        return reply.status(404).send({
          error: "TASK_NOT_FOUND",
          message: `No task found with id '${taskId}'`,
        });
      }

      return reply.status(200).send({
        task: publicTask(task),
        payment: publicPayment(payment),
        proofs: proofs.map((p) => ({
          id: p.id,
          agent_id: p.agent_id,
          verifier_id: p.verifier_id,
          input_hash: p.input_hash,
          output_hash: p.output_hash,
          wasm_hash: p.wasm_hash,
          attestation_hash: p.attestation_hash,
          casper_anchor_hash: p.casper_anchor_hash,
          mode: p.mode,
          status: p.status,
          created_at: p.created_at,
        })),
      });
    }
  );

  // ── PATCH /api/tasks/:taskId/status ────
  // Requires tasks:write scope.
  app.patch<{ Params: { taskId: string }; Body: { status: TaskStatus } }>(
    "/api/tasks/:taskId/status",
    {
      schema: { body: statusUpdateSchema },
      preHandler: [requireApiKeyWithScope([API_SCOPES.TASKS_WRITE])],
    },
    async (request, reply) => {
      const { taskId } = request.params;
      const { status } = request.body;

      try {
        const updated = updateTaskStatus(taskId, status);
        if (!updated) {
          return reply.status(404).send({
            error: "TASK_NOT_FOUND",
            message: `No task found with id '${taskId}'`,
          });
        }

        return reply.status(200).send({
          task_id: updated.id,
          status: updated.status,
          message: `Task status updated to '${status}'`,
        });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);

        if (msg.startsWith("INVALID_TRANSITION")) {
          return reply.status(400).send({
            error: "INVALID_TRANSITION",
            message: msg,
          });
        }
        return reply.status(500).send({ error: "UPDATE_FAILED", message: "Internal server error" });
      }
    }
  );

  // ── POST /api/tasks/:taskId/run ────────
  // Requires tasks:write scope.
  app.post<{ Params: { taskId: string } }>(
    "/api/tasks/:taskId/run",
    {
      preHandler: [requireApiKeyWithScope([API_SCOPES.TASKS_WRITE])],
    },
    async (request, reply) => {
      const { taskId } = request.params;

      try {
        const result = await runTaskWithAgentExecution(taskId);
        return reply.status(200).send({
          task_id: result.taskId,
          status: result.status,
          proof_id: result.proofId,
          agent_executed: result.agentExecuted,
          message: result.message,
        });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        request.log.error({ err: msg, taskId }, "Failed to run task verification");

        if (msg === "TASK_NOT_FOUND") {
          return reply.status(404).send({ error: "TASK_NOT_FOUND", message: msg });
        }
        if (msg.startsWith("INVALID_STATE")) {
          return reply.status(400).send({ error: "INVALID_STATE", message: msg });
        }
        if (err instanceof LlmProviderError && err.code === "PROVIDER_NOT_CONFIGURED") {
          return reply.status(503).send({
            error: "PROVIDER_NOT_CONFIGURED",
            message: "Agent execution requires a configured LLM provider. Set LLM_API_BASE_URL and LLM_API_KEY.",
          });
        }
        if (msg.startsWith("AGENT_UNAVAILABLE")) {
          return reply.status(503).send({ error: "AGENT_UNAVAILABLE", message: msg });
        }
        return reply.status(500).send({ error: "RUN_FAILED", message: "Internal server error" });
      }
    }
  );

  // ── POST /api/tasks/:taskId/verify ─────
  // Requires tasks:write scope.
  app.post<{ Params: { taskId: string } }>(
    "/api/tasks/:taskId/verify",
    {
      preHandler: [requireApiKeyWithScope([API_SCOPES.TASKS_WRITE])],
    },
    // lgtm[js/missing-rate-limiting] buildApp installs a root onRequest limiter before all route registration.
    async (request, reply) => {
      const { taskId } = request.params;

      try {
        const result = verifyTaskProof(taskId);
        return reply.status(200).send({
          task_id: result.taskId,
          status: result.status,
          proof_ids: result.proofIds,
          message: result.message,
        });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        request.log.error({ err: msg, taskId }, "Failed to verify task proof");

        if (msg === "TASK_NOT_FOUND") {
          return reply.status(404).send({ error: "TASK_NOT_FOUND", message: msg });
        }
        if (msg.startsWith("INVALID_STATE") || msg.startsWith("NO_PROOFS")) {
          return reply.status(400).send({ error: "INVALID_STATE", message: msg });
        }
        return reply.status(500).send({ error: "VERIFY_FAILED", message: "Internal server error" });
      }
    }
  );

  // ── POST /api/tasks/:taskId/anchor ──────
  // Requires tasks:write scope.
  app.post<{ Params: { taskId: string } }>(
    "/api/tasks/:taskId/anchor",
    {
      preHandler: [requireApiKeyWithScope([API_SCOPES.TASKS_WRITE])],
    },
    async (request, reply) => {
      const { taskId } = request.params;

      try {
        const result = await anchorTaskProof(taskId);

        return reply.status(200).send({
          task_id: result.taskId,
          anchor_hash: result.anchorHash,
          deploy_hash: result.deployHash,
          mode: config.teeVerificationMode,
          casper_mode: result.mode,
          proof_id: result.proofId,
        });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        request.log.error({ err: msg, taskId }, "Failed to anchor task proof");

        if (msg.startsWith("INVALID")) {
          return reply.status(400).send({ error: "INVALID_STATE", message: msg });
        }
        return reply.status(500).send({
          error: "ANCHOR_FAILED",
          message: "Failed to anchor task proof. Check server logs for details.",
          task_id: taskId,
        });
      }
    }
  );

  // ── POST /api/tasks/:taskId/unlock-payment ──
  // Requires tasks:write scope.
  app.post<{ Params: { taskId: string } }>(
    "/api/tasks/:taskId/unlock-payment",
    {
      preHandler: [requireApiKeyWithScope([API_SCOPES.TASKS_WRITE])],
    },
    async (request, reply) => {
      const { taskId } = request.params;

      try {
        const result = unlockTaskPayment(taskId);
        return reply.status(200).send({
          task_id: result.taskId,
          payment_id: result.paymentId,
          task_status: result.taskStatus,
          payment_status: result.paymentStatus,
          message: result.message,
        });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        request.log.error({ err: msg, taskId }, "Failed to unlock payment");

        if (msg === "TASK_NOT_FOUND" || msg === "PAYMENT_NOT_FOUND") {
          return reply.status(404).send({ error: "NOT_FOUND", message: msg });
        }
        if (
          msg.startsWith("INVALID_STATE") ||
          msg.startsWith("NO_PAYMENT") ||
          msg.startsWith("NO_VERIFIED_PROOF") ||
          msg.startsWith("INVALID_PAYMENT_STATE")
        ) {
          return reply.status(400).send({ error: "INVALID_STATE", message: msg });
        }
        return reply.status(500).send({ error: "UNLOCK_FAILED", message: "Internal server error" });
      }
    }
  );
}
