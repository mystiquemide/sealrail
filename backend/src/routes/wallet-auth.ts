// ────────────────────────────────────────
// Sealrail Casper Wallet Auth Routes
// Sign-in-with-Casper: /challenge issues a nonce embedded in a real
// (never-broadcast) transaction; /verify checks the wallet's signature
// against that transaction's protocol-level hash and mints a scoped API key.
// ────────────────────────────────────────

import type { FastifyInstance } from "fastify";
import { createWalletChallenge, verifyWalletChallenge, WalletAuthError } from "../services/wallet-auth.js";
import { createApiKey } from "../services/api-keys.js";
import { API_SCOPES } from "../types.js";

const challengeSchema = {
  type: "object",
  required: ["public_key"],
  properties: {
    public_key: { type: "string", minLength: 1 },
  },
};

const verifySchema = {
  type: "object",
  required: ["public_key", "nonce", "signature"],
  properties: {
    public_key: { type: "string", minLength: 1 },
    nonce: { type: "string", minLength: 1 },
    signature: { type: "string", minLength: 1 },
  },
};

const ALL_SCOPES = Object.values(API_SCOPES);

function statusForCode(code: string): number {
  switch (code) {
    case "INVALID_PUBLIC_KEY":
    case "INVALID_SIGNATURE":
    case "NONCE_MISMATCH":
      return 400;
    case "CHALLENGE_NOT_FOUND":
    case "CHALLENGE_EXPIRED":
    case "CHALLENGE_USED":
      return 401;
    default:
      return 500;
  }
}

export function registerWalletAuthRoutes(app: FastifyInstance): void {
  // ── POST /api/auth/wallet/challenge ──────
  // Public: issues a nonce-carrying transaction for the wallet to sign.
  app.post<{ Body: { public_key: string } }>(
    "/api/auth/wallet/challenge",
    { schema: { body: challengeSchema } },
    async (request, reply) => {
      try {
        const challenge = createWalletChallenge(request.body.public_key);
        return reply.status(200).send(challenge);
      } catch (err: unknown) {
        if (err instanceof WalletAuthError) {
          return reply.status(statusForCode(err.code)).send({ error: err.code, message: err.message });
        }
        request.log.error({ err }, "Failed to create wallet challenge");
        return reply.status(500).send({ error: "CHALLENGE_FAILED", message: "Internal server error" });
      }
    }
  );

  // ── POST /api/auth/wallet/verify ─────────
  // Public: verifies the signed challenge and mints a fresh API key scoped
  // to the wallet's public key. The key secret is returned once, same
  // contract as POST /api/api-keys.
  app.post<{ Body: { public_key: string; nonce: string; signature: string } }>(
    "/api/auth/wallet/verify",
    { schema: { body: verifySchema } },
    // lgtm[js/missing-rate-limiting] buildApp installs a root onRequest limiter before all route registration.
    async (request, reply) => {
      const { public_key, nonce, signature } = request.body;
      try {
        verifyWalletChallenge(public_key, nonce, signature);

        const { key, rawSecret } = createApiKey({
          ownerAddress: public_key,
          name: "Casper Wallet session",
          scopes: ALL_SCOPES,
        });

        return reply.status(200).send({
          key_id: key.id,
          prefix: key.prefix,
          owner_address: key.owner_address,
          secret: rawSecret,
          message: "Wallet verified. Store this secret securely - it will not be shown again.",
        });
      } catch (err: unknown) {
        if (err instanceof WalletAuthError) {
          return reply.status(statusForCode(err.code)).send({ error: err.code, message: err.message });
        }
        const msg = err instanceof Error ? err.message : String(err);
        request.log.error({ err: msg }, "Wallet verification failed");
        return reply.status(500).send({ error: "VERIFY_FAILED", message: "Internal server error" });
      }
    }
  );
}
