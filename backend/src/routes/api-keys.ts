// ────────────────────────────────────────
// Sealrail API Key Management Routes
// Phase K3: REST API for API key CRUD
// GET /api/api-keys, POST /api/api-keys,
// PATCH /api/api-keys/:keyId, DELETE /api/api-keys/:keyId
// ────────────────────────────────────────

import type { FastifyInstance } from "fastify";
import {
  createApiKey,
  listApiKeys,
  updateApiKey,
  revokeApiKey,
  getApiKeyServiceHealth,
} from "../services/api-keys.js";

// ── Request schemas ──────────────────────

const createKeySchema = {
  type: "object",
  required: ["owner_address", "name"],
  properties: {
    owner_address: { type: "string", minLength: 1 },
    name: { type: "string", minLength: 1 },
    scopes: {
      type: "array",
      items: { type: "string", minLength: 1 },
    },
  },
};

const updateKeySchema = {
  type: "object",
  required: ["owner_address"],
  properties: {
    owner_address: { type: "string", minLength: 1 },
    name: { type: "string", minLength: 1 },
    scopes: {
      type: "array",
      items: { type: "string", minLength: 1 },
    },
  },
};

const listKeysSchema = {
  type: "object",
  required: ["owner_address"],
  properties: {
    owner_address: { type: "string", minLength: 1 },
  },
};

/**
 * Register API key management routes on the Fastify instance.
 */
export function registerApiKeyRoutes(app: FastifyInstance): void {
  // ── GET /api/api-keys ────────────────────
  // List all active API keys for an owner address.
  // Owner address is passed via query parameter.
  // Returns keys with prefix only — never exposes secrets.
  app.get<{
    Querystring: { owner_address: string };
  }>(
    "/api/api-keys",
    async (request, reply) => {
      const { owner_address } = request.query;

      if (!owner_address) {
        return reply.status(400).send({
          error: "MISSING_OWNER",
          message: "owner_address query parameter is required",
        });
      }

      try {
        const keys = listApiKeys(owner_address);

        return reply.status(200).send({
          keys,
          count: keys.length,
          owner_address,
        });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        request.log.error({ err: msg }, "Failed to list API keys");
        return reply.status(500).send({ error: "LIST_FAILED", message: msg });
      }
    }
  );

  // ── POST /api/api-keys ───────────────────
  // Create a new API key. Returns the raw secret once.
  // The raw secret is never stored and cannot be retrieved again.
  app.post<{
    Body: {
      owner_address: string;
      name: string;
      scopes?: string[];
    };
  }>(
    "/api/api-keys",
    { schema: { body: createKeySchema } },
    async (request, reply) => {
      const body = request.body;

      try {
        const result = createApiKey({
          ownerAddress: body.owner_address,
          name: body.name,
          scopes: body.scopes,
        });

        return reply.status(201).send({
          key: result.key,
          secret: result.rawSecret,
          message:
            "API key created successfully. Store this secret securely — it will not be shown again.",
        });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        request.log.error({ err: msg }, "Failed to create API key");

        if (msg.startsWith("INVALID_")) {
          return reply.status(400).send({ error: "INVALID_REQUEST", message: msg });
        }
        return reply.status(500).send({ error: "CREATE_FAILED", message: msg });
      }
    }
  );

  // ── PATCH /api/api-keys/:keyId ───────────
  // Update API key name and/or scopes.
  // Requires owner_address in body to verify ownership.
  app.patch<{
    Params: { keyId: string };
    Body: {
      owner_address: string;
      name?: string;
      scopes?: string[];
    };
  }>(
    "/api/api-keys/:keyId",
    { schema: { body: updateKeySchema } },
    async (request, reply) => {
      const { keyId } = request.params;
      const body = request.body;

      try {
        const key = updateApiKey(keyId, body.owner_address, {
          name: body.name,
          scopes: body.scopes,
        });

        return reply.status(200).send({
          key,
          message: "API key updated successfully.",
        });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        request.log.error({ err: msg, keyId }, "Failed to update API key");

        if (msg === "KEY_NOT_FOUND") {
          return reply.status(404).send({ error: "NOT_FOUND", message: msg });
        }
        if (msg === "KEY_REVOKED") {
          return reply.status(400).send({ error: "KEY_REVOKED", message: msg });
        }
        if (msg.startsWith("NOT_OWNER")) {
          return reply.status(403).send({ error: "FORBIDDEN", message: msg });
        }
        if (msg.startsWith("INVALID_")) {
          return reply.status(400).send({ error: "INVALID_REQUEST", message: msg });
        }
        return reply.status(500).send({ error: "UPDATE_FAILED", message: msg });
      }
    }
  );

  // ── DELETE /api/api-keys/:keyId ──────────
  // Revoke an API key (soft delete).
  // Requires owner_address in body to verify ownership.
  app.delete<{
    Params: { keyId: string };
    Body: { owner_address: string };
  }>(
    "/api/api-keys/:keyId",
    async (request, reply) => {
      const { keyId } = request.params;
      const { owner_address } = request.body ?? {};

      if (!owner_address) {
        return reply.status(400).send({
          error: "MISSING_OWNER",
          message: "owner_address is required in request body",
        });
      }

      try {
        const key = revokeApiKey(keyId, owner_address);

        return reply.status(200).send({
          key,
          message: "API key revoked successfully.",
        });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        request.log.error({ err: msg, keyId }, "Failed to revoke API key");

        if (msg === "KEY_NOT_FOUND") {
          return reply.status(404).send({ error: "NOT_FOUND", message: msg });
        }
        if (msg === "KEY_ALREADY_REVOKED") {
          return reply.status(400).send({ error: "ALREADY_REVOKED", message: msg });
        }
        if (msg.startsWith("NOT_OWNER")) {
          return reply.status(403).send({ error: "FORBIDDEN", message: msg });
        }
        return reply.status(500).send({ error: "REVOKE_FAILED", message: msg });
      }
    }
  );

  // ── GET /api/api-keys/health ─────────────
  // API key service health check.
  app.get("/api/api-keys/health", async (_request, reply) => {
    const health = getApiKeyServiceHealth();
    return reply.status(200).send(health);
  });
}
