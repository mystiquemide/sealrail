// ────────────────────────────────────────
// Sealrail Task Routes
// POST /api/tasks/:taskId/anchor — Casper anchor endpoint
// Phase D: Verification gate
// ────────────────────────────────────────

import type { FastifyInstance } from "fastify";

import { anchorTaskProof } from "../services/tasks.js";
import { config } from "../config.js";

/**
 * Register task-related routes on the Fastify instance.
 */
export function registerTaskRoutes(app: FastifyInstance): void {
  // ── POST /api/tasks/:taskId/anchor ──────
  // Anchors a task's proof to Casper.
  // Returns the deterministic anchor hash with mode label.
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

        return reply.status(500).send({
          error: "ANCHOR_FAILED",
          message: msg,
          task_id: taskId,
        });
      }
    }
  );
}
