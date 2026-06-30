// ────────────────────────────────────────
// Sealrail Task Routes
// Phase D: POST /api/tasks/:taskId/anchor — Casper anchor endpoint
// Phase E: POST /api/tasks, GET /api/tasks/:taskId, run, verify, unlock-payment
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
import { config } from "../config.js";
import type { TaskStatus } from "../types.js";

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

/**
 * Register task-related routes on the Fastify instance.
 */
export function registerTaskRoutes(app: FastifyInstance): void {
  // ── POST /api/tasks ────────────────────
  // Phase E: Create a payment-backed task.
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
    { schema: { body: createTaskSchema } },
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
        return reply.status(500).send({ error: "CREATE_FAILED", message: msg });
      }
    }
  );

  // ── GET /api/tasks ─────────────────────
  // List all tasks, optionally filtered by status.
  app.get<{ Querystring: { status?: string } }>(
    "/api/tasks",
    async (request, reply) => {
      const { status } = request.query;
      const tasks = listTasks(status as TaskStatus | undefined);
      return reply.status(200).send({ tasks, count: tasks.length });
    }
  );

  // ── GET /api/tasks/:taskId ─────────────
  // Get a single task with full proof and payment trail.
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
        task,
        payment,
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
  // Update task status with state machine enforcement.
  app.patch<{ Params: { taskId: string }; Body: { status: TaskStatus } }>(
    "/api/tasks/:taskId/status",
    { schema: { body: statusUpdateSchema } },
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
          previous_status: getTask(taskId)?.status,
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
        return reply.status(500).send({ error: "UPDATE_FAILED", message: msg });
      }
    }
  );

  // ── POST /api/tasks/:taskId/run ────────
  // Phase E: Execute TEE verification for a task.
  app.post<{ Params: { taskId: string } }>(
    "/api/tasks/:taskId/run",
    async (request, reply) => {
      const { taskId } = request.params;

      try {
        const result = await runTaskVerification(taskId);
        return reply.status(200).send({
          task_id: result.taskId,
          status: result.status,
          proof_id: result.proofId,
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
        return reply.status(500).send({ error: "RUN_FAILED", message: msg });
      }
    }
  );

  // ── POST /api/tasks/:taskId/verify ─────
  // Phase E: Validate proof/attestation state.
  app.post<{ Params: { taskId: string } }>(
    "/api/tasks/:taskId/verify",
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
        return reply.status(500).send({ error: "VERIFY_FAILED", message: msg });
      }
    }
  );

  // ── POST /api/tasks/:taskId/anchor ──────
  // Phase D: Casper anchor endpoint.
  // Anchors a task's proof to Casper.
  app.post<{ Params: { taskId: string } }>(
    "/api/tasks/:taskId/anchor",
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
          message: msg,
          task_id: taskId,
        });
      }
    }
  );

  // ── POST /api/tasks/:taskId/unlock-payment ──
  // Phase E: Enforce proof + anchor before payment unlock.
  app.post<{ Params: { taskId: string } }>(
    "/api/tasks/:taskId/unlock-payment",
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
        return reply.status(500).send({ error: "UNLOCK_FAILED", message: msg });
      }
    }
  );
}
