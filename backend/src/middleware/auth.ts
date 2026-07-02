// ────────────────────────────────────────
// Sealrail API Key Authentication Middleware
// Phase K2: Validate API keys, enforce scopes
// ────────────────────────────────────────

import type { FastifyRequest, FastifyReply } from "fastify";
import { lookupApiKey } from "../services/api-keys.js";
import type { ApiKey } from "../types.js";

// ── Extended request interface ────────────

declare module "fastify" {
  interface FastifyRequest {
    /** Authenticated API key - set by requireApiKey middleware */
    apiKey?: ApiKey;
  }
}

// ── Helpers ───────────────────────────────

/**
 * Extract a raw API key secret from request headers.
 * Supports two header formats:
 *   Authorization: Bearer <raw_secret>
 *   x-api-key: <raw_secret>
 * Returns null if no key is found or the format is invalid.
 */
function extractApiKey(request: FastifyRequest): string | null {
  // Try Authorization: Bearer <key>
  const authHeader = request.headers.authorization;
  if (typeof authHeader === "string") {
    const match = authHeader.match(/^Bearer\s+(.+)$/i);
    if (match) {
      return match[1].trim();
    }
  }

  // Try x-api-key header
  const apiKeyHeader = request.headers["x-api-key"];
  if (typeof apiKeyHeader === "string" && apiKeyHeader.trim().length > 0) {
    return apiKeyHeader.trim();
  }

  return null;
}

// ── Middleware factories ───────────────────

/**
 * Middleware: Require a valid API key.
 * Sets request.apiKey on success, returns 401 on failure.
 * Does NOT check scopes - use requireApiKeyWithScope for scope enforcement.
 */
export async function requireApiKey(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const rawSecret = extractApiKey(request);

  if (!rawSecret) {
    return reply.status(401).send({
      error: "UNAUTHORIZED",
      message: "API key required. Provide via Authorization: Bearer <key> or x-api-key header.",
    });
  }

  const key = lookupApiKey(rawSecret);

  if (!key) {
    return reply.status(401).send({
      error: "UNAUTHORIZED",
      message: "Invalid or revoked API key.",
    });
  }

  // Attach authenticated key to request for downstream handlers
  request.apiKey = key;
}

/**
 * Middleware: Require a valid API key with specific scopes.
 * Sets request.apiKey on success, returns 401 on invalid key,
 * returns 403 if key is valid but lacks required scopes.
 *
 * @param requiredScopes - list of scopes, any one of which is sufficient (OR logic)
 */
export function requireApiKeyWithScope(requiredScopes: string[]) {
  return async function (request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const rawSecret = extractApiKey(request);

    if (!rawSecret) {
      return reply.status(401).send({
        error: "UNAUTHORIZED",
        message: "API key required. Provide via Authorization: Bearer <key> or x-api-key header.",
      });
    }

    const key = lookupApiKey(rawSecret);

    if (!key) {
      return reply.status(401).send({
        error: "UNAUTHORIZED",
        message: "Invalid or revoked API key.",
      });
    }

    // Check scopes - any one matching scope grants access (OR logic)
    if (requiredScopes.length > 0) {
      const hasScope = requiredScopes.some((required) => key.scopes.includes(required));
      if (!hasScope) {
        return reply.status(403).send({
          error: "FORBIDDEN",
          message: `This API key does not have the required scope. Needed: ${requiredScopes.join(" or ")}`,
        });
      }
    }

    request.apiKey = key;
  };
}

/**
 * Soft auth middleware: attempts to authenticate if a key is present,
 * but does not reject the request if no key is provided.
 * Use for endpoints that behave differently for authenticated users
 * (e.g., owner-only write vs public read).
 */
export async function optionalApiKey(
  request: FastifyRequest,
  _reply: FastifyReply
): Promise<void> {
  const rawSecret = extractApiKey(request);

  if (!rawSecret) return;

  const key = lookupApiKey(rawSecret);
  if (key) {
    request.apiKey = key;
  }
}
