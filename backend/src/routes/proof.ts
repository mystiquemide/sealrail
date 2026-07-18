// ────────────────────────────────────────
// Sealrail Proof Routes
// POST /api/proofs/verify - TEE verification endpoint
// Phase C
// Audit fix C1+H2: Auth required on verification endpoint
// ────────────────────────────────────────

import type { FastifyInstance } from "fastify";

import type { InvoiceRiskInput } from "../types.js";
import { verify } from "../services/blocky.js";
import { getProofDetail, getProofById, listProofs } from "../services/tasks.js";
import { requireApiKeyWithScope } from "../middleware/auth.js";
import { API_SCOPES } from "../types.js";

// ── Request schema for validation ────────

const verifySchema = {
  type: "object",
  required: [
    "task_id",
    "invoice_id",
    "vendor",
    "buyer",
    "amount_usd",
    "currency",
    "due_days",
    "line_items",
    "ai_suggested_risk",
  ],
  properties: {
    task_id: { type: "string", minLength: 1 },
    invoice_id: { type: "string", minLength: 1 },
    vendor: { type: "string" },
    buyer: { type: "string" },
    amount_usd: { type: "number", minimum: 0 },
    currency: { type: "string" },
    due_days: { type: "integer", minimum: 0 },
    line_items: { type: "array", items: { type: "string" } },
    ai_suggested_risk: { type: "number", minimum: 0, maximum: 100 },
  },
};

/**
 * Register proof-related routes on the Fastify instance.
 */
export function registerProofRoutes(app: FastifyInstance): void {
  // ── GET /api/proofs/:proofId ────────────
  // Canonical proof receipt - public, no auth required.
  // Returns proof detail with task context and payment state.
  app.get<{ Params: { proofId: string } }>(
    "/api/proofs/:proofId",
    async (request, reply) => {
      const { proofId } = request.params;

      const detail = getProofDetail(proofId);
      if (!detail) {
        return reply.status(404).send({
          error: "PROOF_NOT_FOUND",
          message: `No proof found with id '${proofId}'`,
        });
      }

      return reply.status(200).send(detail);
    }
  );

  // ── GET /api/proofs ─────────────────────
  // List recent proofs (public). Newest first, lightweight rows.
  // Optional ?limit=N (1-200, default 50).
  app.get<{ Querystring: { limit?: string } }>(
    "/api/proofs",
    async (request, reply) => {
      const parsed = Number.parseInt(request.query.limit ?? "", 10);
      const limit = Number.isFinite(parsed) && parsed > 0 ? parsed : 50;
      const proofs = listProofs(limit);
      return reply.status(200).send({ proofs, count: proofs.length });
    }
  );

  // ── POST /api/proofs/verify ────────────
  // Runs full TEE verification: attest + verify + claims validation
  // Requires proofs:write scope.
  app.post<{ Body: InvoiceRiskInput }>(
    "/api/proofs/verify",
    {
      schema: {
        body: verifySchema,
      },
      preHandler: [requireApiKeyWithScope([API_SCOPES.PROOFS_WRITE])],
    },
    // lgtm[js/missing-rate-limiting] buildApp installs a root onRequest limiter before all route registration.
    async (request, reply) => {
      const input = request.body as InvoiceRiskInput;

      const result = await verify(input);

      if (result.status === "verified") {
        return reply.status(200).send({
          verified: true,
          task_id: input.task_id,
          claims: result.claims,
          output: result.output,
        });
      }

      // Determine HTTP status from error code
      const statusMap: Record<string, number> = {
        CLI_NOT_FOUND: 503,
        TIMEOUT: 504,
        ATTESTATION_FAILED: 502,
        VERIFICATION_FAILED: 502,
        RETRY_EXHAUSTED: 502,
        CODE_HASH_MISSING: 422,
        TASK_ID_MISMATCH: 422,
        INVALID_OUTPUT: 422,
      };

      const httpStatus = statusMap[result.errorCode] || 500;

      return reply.status(httpStatus).send({
        verified: false,
        task_id: input.task_id,
        error: result.errorCode,
        message: result.message,
      });
    }
  );
}
