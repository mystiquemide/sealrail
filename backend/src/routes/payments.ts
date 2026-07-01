// ────────────────────────────────────────
// Sealrail Payment Routes
// Phase E5: Payment intent, splits, unlock, claim
// Phase I4: Split proof dependency resolution + per-recipient unlock
// Audit fix C1+H2+H4: API key auth on mutations, claim requires authenticated identity
// ────────────────────────────────────────

import type { FastifyInstance } from "fastify";

import {
  createPaymentIntent,
  getPayment,
  getPaymentWithRecipients,
  listPayments,
  updatePaymentStatus,
  calculatePaymentSplits,
  unlockPayment,
  claimRecipientShare,
} from "../services/payments.js";

import {
  validateRecipients,
  validateRecipientsOrThrow,
  resolveRecipientProofDependency,
  resolveAllRecipientProofDependencies,
  unlockAllSatisfiedRecipients,
  unlockRecipientIfProofSatisfied,
  getRecipientProofStatuses,
} from "../services/splits.js";
import { requireApiKey, requireApiKeyWithScope } from "../middleware/auth.js";
import { API_SCOPES } from "../types.js";
import type { PaymentStatus } from "../types.js";

// ── Request schemas ──────────────────────

const createIntentSchema = {
  type: "object",
  required: ["buyer_address", "total_amount", "currency"],
  properties: {
    buyer_address: { type: "string", minLength: 1 },
    total_amount: { type: "number", minimum: 0 },
    currency: { type: "string", enum: ["CSPR", "USD"] },
    unlock_rule: { type: "string", enum: ["proof_verified", "workflow_verified"] },
    task_id: { type: "string" },
  },
};

const splitsSchema = {
  type: "object",
  required: ["recipients"],
  properties: {
    recipients: {
      type: "array",
      items: {
        type: "object",
        required: ["address", "share_bps", "role"],
        properties: {
          address: { type: "string", minLength: 1 },
          share_bps: { type: "integer", minimum: 0, maximum: 10000 },
          role: {
            type: "string",
            enum: ["primary_agent", "workflow_step", "verifier", "platform"],
          },
          agent_id: { type: "string" },
          verifier_id: { type: "string" },
          proof_required: { type: "boolean" },
        },
      },
    },
  },
};

const claimSchema = {
  type: "object",
  required: ["recipient_id", "address"],
  properties: {
    recipient_id: { type: "string", minLength: 1 },
    address: { type: "string", minLength: 1 },
  },
};

/**
 * Register payment-related routes on the Fastify instance.
 */
export function registerPaymentRoutes(app: FastifyInstance): void {
  // ── POST /api/payments/intents ─────────
  // Requires payments:write scope.
  app.post<{
    Body: {
      buyer_address: string;
      total_amount: number;
      currency: string;
      unlock_rule?: string;
      task_id?: string;
    };
  }>(
    "/api/payments/intents",
    {
      schema: { body: createIntentSchema },
      preHandler: [requireApiKeyWithScope([API_SCOPES.PAYMENTS_WRITE])],
    },
    async (request, reply) => {
      const body = request.body;

      try {
        const payment = createPaymentIntent({
          buyerAddress: body.buyer_address,
          totalAmount: body.total_amount,
          currency: body.currency,
          unlockRule: body.unlock_rule,
          taskId: body.task_id,
        });

        return reply.status(201).send({
          payment_id: payment.id,
          status: payment.status,
          total_amount: payment.total_amount,
          currency: payment.currency,
          unlock_rule: payment.unlock_rule,
          message: "Payment intent created.",
        });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        request.log.error({ err: msg }, "Failed to create payment intent");
        return reply.status(500).send({ error: "CREATE_FAILED", message: "Internal server error" });
      }
    }
  );

  // ── GET /api/payments ──────────────────
  app.get<{ Querystring: { status?: string } }>(
    "/api/payments",
    async (request, reply) => {
      const statusParam = request.query.status as PaymentStatus | undefined;
      const payments = listPayments(statusParam);
      return reply.status(200).send({ payments, count: payments.length });
    }
  );

  // ── GET /api/payments/:paymentId ───────
  app.get<{ Params: { paymentId: string } }>(
    "/api/payments/:paymentId",
    async (request, reply) => {
      const { paymentId } = request.params;

      const payment = getPaymentWithRecipients(paymentId);
      if (!payment) {
        return reply.status(404).send({
          error: "PAYMENT_NOT_FOUND",
          message: `No payment found with id '${paymentId}'`,
        });
      }

      let proofStatuses = null;
      try {
        proofStatuses = getRecipientProofStatuses(paymentId);
      } catch {
        // Non-fatal
      }

      return reply.status(200).send({ payment, proof_dependencies: proofStatuses });
    }
  );

  // ── POST /api/payments/:paymentId/splits ──
  // Requires payments:write scope.
  app.post<{
    Params: { paymentId: string };
    Body: {
      recipients: {
        address: string;
        share_bps: number;
        role: string;
        agent_id?: string;
        verifier_id?: string;
        proof_required?: boolean;
      }[];
    };
  }>(
    "/api/payments/:paymentId/splits",
    {
      schema: { body: splitsSchema },
      preHandler: [requireApiKeyWithScope([API_SCOPES.PAYMENTS_WRITE])],
    },
    async (request, reply) => {
      const { paymentId } = request.params;
      const { recipients } = request.body;

      try {
        validateRecipientsOrThrow(recipients);

        const result = calculatePaymentSplits(paymentId, recipients);

        return reply.status(200).send({
          payment_id: result.payment.id,
          status: result.payment.status,
          split_hash: result.splitHash,
          recipients: result.payment.recipients,
          message: `Splits calculated: ${recipients.length} recipients, ${result.splitHash.slice(0, 16)}...`,
        });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        request.log.error({ err: msg, paymentId }, "Failed to calculate splits");

        if (msg === "PAYMENT_NOT_FOUND") {
          return reply.status(404).send({ error: "NOT_FOUND", message: msg });
        }
        if (msg.startsWith("INVALID_STATE") || msg.startsWith("INVALID_SPLITS") || msg.startsWith("INVALID_RECIPIENTS")) {
          return reply.status(400).send({ error: "INVALID_REQUEST", message: msg });
        }
        return reply.status(500).send({ error: "SPLITS_FAILED", message: "Internal server error" });
      }
    }
  );

  // ── POST /api/payments/:paymentId/unlock ──
  // Requires payments:write scope.
  app.post<{ Params: { paymentId: string } }>(
    "/api/payments/:paymentId/unlock",
    {
      preHandler: [requireApiKeyWithScope([API_SCOPES.PAYMENTS_WRITE])],
    },
    async (request, reply) => {
      const { paymentId } = request.params;

      try {
        const result = unlockAllSatisfiedRecipients(paymentId);

        return reply.status(200).send({
          payment_id: result.paymentId,
          payment_status: result.paymentStatus,
          total_recipients: result.totalRecipients,
          unlocked_count: result.unlockedCount,
          still_locked_count: result.stillLockedCount,
          recipient_results: result.results,
          message: result.message,
        });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        request.log.error({ err: msg, paymentId }, "Failed to unlock payment");

        if (msg === "PAYMENT_NOT_FOUND") {
          return reply.status(404).send({ error: "NOT_FOUND", message: msg });
        }
        if (msg.startsWith("INVALID_STATE") || msg.startsWith("NO_RECIPIENTS") || msg.startsWith("NO_UNLOCKABLE_RECIPIENTS")) {
          return reply.status(400).send({ error: "INVALID_STATE", message: msg });
        }
        return reply.status(500).send({ error: "UNLOCK_FAILED", message: "Internal server error" });
      }
    }
  );

  // ── POST /api/payments/:paymentId/claim ──
  // H4: Requires API key auth + address matching recipient.
  app.post<{
    Params: { paymentId: string };
    Body: { recipient_id: string; address: string };
  }>(
    "/api/payments/:paymentId/claim",
    {
      schema: { body: claimSchema },
      preHandler: [requireApiKeyWithScope([API_SCOPES.PAYMENTS_WRITE])],
    },
    async (request, reply) => {
      const { paymentId } = request.params;
      const { recipient_id, address } = request.body;

      try {
        // H4: Require address and verify it matches the recipient
        const payment = getPaymentWithRecipients(paymentId);
        if (!payment) {
          return reply.status(404).send({
            error: "PAYMENT_NOT_FOUND",
            message: `No payment found with id '${paymentId}'`,
          });
        }
        const recipient = payment.recipients.find((r) => r.id === recipient_id);
        if (!recipient) {
          return reply.status(404).send({
            error: "RECIPIENT_NOT_FOUND",
            message: `No recipient found with id '${recipient_id}'`,
          });
        }
        if (recipient.address !== address) {
          return reply.status(403).send({
            error: "WRONG_RECIPIENT",
            message: `Address '${address}' does not match recipient '${recipient_id}'. Only the designated recipient address may claim.`,
          });
        }

        // Check unlockability
        if (recipient.status === "paid") {
          return reply.status(409).send({
            error: "ALREADY_CLAIMED",
            message: `Recipient '${recipient_id}' has already claimed their share.`,
          });
        }
        if (recipient.status !== "unlockable") {
          return reply.status(400).send({
            error: "NOT_UNLOCKABLE",
            message: `Recipient '${recipient_id}' is not yet unlockable (current: '${recipient.status}').`,
          });
        }

        const result = claimRecipientShare(paymentId, recipient_id);

        return reply.status(200).send({
          payment_id: paymentId,
          recipient_id: result.recipient.id,
          recipient_status: result.recipient.status,
          share_bps: result.recipient.share_bps,
          message: result.message,
        });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        request.log.error({ err: msg, paymentId, recipient_id }, "Failed to claim share");

        if (msg === "PAYMENT_NOT_FOUND" || msg === "RECIPIENT_NOT_FOUND") {
          return reply.status(404).send({ error: "NOT_FOUND", message: msg });
        }
        if (msg.startsWith("INVALID_STATE")) {
          return reply.status(400).send({ error: "INVALID_STATE", message: msg });
        }
        return reply.status(500).send({ error: "CLAIM_FAILED", message: "Internal server error" });
      }
    }
  );
}
