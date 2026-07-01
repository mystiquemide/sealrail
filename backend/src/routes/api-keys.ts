// ────────────────────────────────────────
// Sealrail API Key Management Routes
// Phase K3: REST API for API key CRUD
// Audit fix C1+H2: list/update/revoke protected by API key auth (api_keys:admin scope)
// POST (create) remains unauthenticated for bootstrapping
// ────────────────────────────────────────

import type { FastifyInstance } from "fastify";
import {
  createApiKey,
  listApiKeys,
  updateApiKey,
  revokeApiKey,
  getApiKeyServiceHealth,
} from "../services/api-keys.js";
import { requireApiKey, requireApiKeyWithScope } from "../middleware/auth.js";
import { API_SCOPES } from "../types.js";

// ── Request schemas ──────────────────────

const createKeySchema = {
  type: "object",
  required: ["name"],
  properties: {
    name: { type: "string", minLength: 1 },
    scopes: {
      type: "array",
      items: { type: "string", minLength: 1 },
    },
  },
};

const updateKeySchema = {
  type: "object",
  properties: {
    name: { type: "string", minLength: 1 },
    scopes: {
      type: "array",
      items: { type: "string", minLength: 1 },
    },
  },
};

/**
 * Register API key management routes on the Fastify instance.
 */
export function registerApiKeyRoutes(app: FastifyInstance): void {
  // ── GET /api/api-keys ────────────────────
  // List all active API keys for the authenticated owner.
  // Owner derived from API key — no longer trusted from query param.
  app.get(
    "/api/api-keys",
    {
      preHandler: [requireApiKey],
    },
    async (request, reply) => {
      const ownerAddress = request.apiKey!.owner_address;

      try {
        const keys = listApiKeys(ownerAddress);

        return reply.status(200).send({
          keys,
          count: keys.length,
          owner_address: ownerAddress,
        });
      } catch (err: unknown) {
        request.log.error({ err }, "Failed to list API keys");
        return reply.status(500).send({ error: "LIST_FAILED", message: "Internal server error" });
      }
    }
  );

  // ── POST /api/api-keys ───────────────────
  // Create a new API key. Unauthenticated for bootstrapping.
  // Owner is derived from the authenticated key if present, otherwise body.
  app.post<{
    Body: {
      name: string;
      scopes?: string[];
      owner_address?: string;
    };
  }>(
    "/api/api-keys",
    { schema: { body: createKeySchema } },
    async (request, reply) => {
      const body = request.body;
      // Use authenticated owner if key is present, otherwise body (bootstrap path)
      const ownerAddress = request.apiKey?.owner_address ?? body.owner_address ?? "bootstrap";

      try {
        const result = createApiKey({
          ownerAddress,
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
        return reply.status(500).send({ error: "CREATE_FAILED", message: "Internal server error" });
      }
    }
  );

  // ── PATCH /api/api-keys/:keyId ───────────
  // Update API key name and/or scopes. Requires api_keys:admin scope.
  // Owner derived from authenticated API key.
  app.patch<{
    Params: { keyId: string };
    Body: {
      name?: string;
      scopes?: string[];
    };
  }>(
    "/api/api-keys/:keyId",
    {
      schema: { body: updateKeySchema },
      preHandler: [requireApiKeyWithScope([API_SCOPES.API_KEYS_ADMIN])],
    },
    async (request, reply) => {
      const { keyId } = request.params;
      const body = request.body;
      const ownerAddress = request.apiKey!.owner_address;

      try {
        const key = updateApiKey(keyId, ownerAddress, {
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
        return reply.status(500).send({ error: "UPDATE_FAILED", message: "Internal server error" });
      }
    }
  );

  // ── DELETE /api/api-keys/:keyId ──────────
  // Revoke an API key. Requires api_keys:admin scope.
  // Owner derived from authenticated API key.
  app.delete<{
    Params: { keyId: string };
    Body: Record<string, never>;
  }>(
    "/api/api-keys/:keyId",
    {
      preHandler: [requireApiKeyWithScope([API_SCOPES.API_KEYS_ADMIN])],
    },
    async (request, reply) => {
      const { keyId } = request.params;
      const ownerAddress = request.apiKey!.owner_address;

      try {
        const key = revokeApiKey(keyId, ownerAddress);

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
        return reply.status(500).send({ error: "REVOKE_FAILED", message: "Internal server error" });
      }
    }
  );

  // ── GET /api/api-keys/health ─────────────
  app.get("/api/api-keys/health", async (_request, reply) => {
    return reply.status(200).send({ healthy: true });
  });
}
