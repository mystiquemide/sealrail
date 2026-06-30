// ────────────────────────────────────────
// Sealrail Payment Routes
// Phase E5: Payment intent, splits, unlock, claim
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
  required: ["recipient_id"],
  properties: {
    recipient_id: { type: "string", minLength: 1 },
  },
};

/**
 * Register payment-related routes on the Fastify instance.
 */
export function registerPaymentRoutes(app: FastifyInstance): void {
  // ── POST /api/payments/intents ─────────
  // Phase E: Create a payment intent.
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
    { schema: { body: createIntentSchema } },
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
        return reply.status(500).send({ error: "CREATE_FAILED", message: msg });
      }
    }
  );

  // ── GET /api/payments ──────────────────
  // List all payments, optionally filtered.
  app.get<{ Querystring: { status?: string } }>(
    "/api/payments",
    async (request, reply) => {
      const { status } = request.query;
      const payments = listPayments(status as any);
      return reply.status(200).send({ payments, count: payments.length });
    }
  );

  // ── GET /api/payments/:paymentId ───────
  // Get a single payment with recipients/splits.
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

      return reply.status(200).send({ payment });
    }
  );

  // ── POST /api/payments/:paymentId/splits ──
  // Phase E: Calculate and store payment splits.
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
    { schema: { body: splitsSchema } },
    async (request, reply) => {
      const { paymentId } = request.params;
      const { recipients } = request.body;

      try {
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
        if (msg.startsWith("INVALID_STATE") || msg.startsWith("INVALID_SPLITS")) {
          return reply.status(400).send({ error: "INVALID_REQUEST", message: msg });
        }
        return reply.status(500).send({ error: "SPLITS_FAILED", message: msg });
      }
    }
  );

  // ── POST /api/payments/:paymentId/unlock ──
  // Phase E: Unlock payment (enforces valid state).
  app.post<{ Params: { paymentId: string } }>(
    "/api/payments/:paymentId/unlock",
    async (request, reply) => {
      const { paymentId } = request.params;

      try {
        const result = unlockPayment(paymentId);

        return reply.status(200).send({
          payment_id: result.payment.id,
          status: result.payment.status,
          recipients: result.payment.recipients,
          message: result.message,
        });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        request.log.error({ err: msg, paymentId }, "Failed to unlock payment");

        if (msg === "PAYMENT_NOT_FOUND") {
          return reply.status(404).send({ error: "NOT_FOUND", message: msg });
        }
        if (msg.startsWith("INVALID_STATE") || msg.startsWith("NO_RECIPIENTS")) {
          return reply.status(400).send({ error: "INVALID_STATE", message: msg });
        }
        return reply.status(500).send({ error: "UNLOCK_FAILED", message: msg });
      }
    }
  );

  // ── POST /api/payments/:paymentId/claim ──
  // Phase E: Claim a recipient's share.
  app.post<{
    Params: { paymentId: string };
    Body: { recipient_id: string };
  }>(
    "/api/payments/:paymentId/claim",
    { schema: { body: claimSchema } },
    async (request, reply) => {
      const { paymentId } = request.params;
      const { recipient_id } = request.body;

      try {
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
        return reply.status(500).send({ error: "CLAIM_FAILED", message: msg });
      }
    }
  );
}
