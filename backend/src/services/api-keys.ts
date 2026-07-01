// ────────────────────────────────────────
// Sealrail API Key Management Service
// Phase K1: Key generation, hashing, and CRUD
// ────────────────────────────────────────

import { randomBytes, randomUUID, scryptSync, timingSafeEqual } from "crypto";
import { getDb } from "../db.js";
import { config } from "../config.js";
import type { ApiKey } from "../types.js";

// ── Row types for DB queries ──────────────

interface ApiKeyRow {
  id: string;
  owner_address: string;
  name: string;
  prefix: string;
  hashed_secret: string;
  scopes: string;
  last_used_at: string | null;
  created_at: string;
  revoked_at: string | null;
}

// ── Secret generation ─────────────────────

const KEY_PREFIX = "sr_";

/**
 * Generate a cryptographically secure API key secret.
 * Returns the raw secret (64 hex chars) and the public prefix.
 * The raw secret is only returned once — on creation.
 */
export function generateApiKeySecret(): { rawSecret: string; prefix: string } {
  const rawSecret = randomBytes(32).toString("hex");
  const prefix = `${KEY_PREFIX}${rawSecret.slice(0, 8)}`;
  return { rawSecret, prefix };
}

/**
 * Hash a raw API key secret using scrypt.
 * Returns the hex-encoded hash for storage.
 */
export function hashSecret(rawSecret: string): string {
  const salt = randomBytes(config.apiKeyScryptSaltLength);
  const hash = scryptSync(rawSecret, salt, config.apiKeyHashLength);
  // Store salt + hash together as hex
  return `${salt.toString("hex")}:${hash.toString("hex")}`;
}

/**
 * Verify a raw API key secret against a stored hashed_secret.
 * Uses timing-safe comparison to prevent timing attacks.
 */
export function verifySecret(rawSecret: string, storedHash: string): boolean {
  const [saltHex, hashHex] = storedHash.split(":");
  if (!saltHex || !hashHex) return false;

  const salt = Buffer.from(saltHex, "hex");
  const expectedHash = Buffer.from(hashHex, "hex");

  try {
    const computedHash = scryptSync(rawSecret, salt, config.apiKeyHashLength);
    return timingSafeEqual(computedHash, expectedHash);
  } catch {
    return false;
  }
}

// ── Row mapping ───────────────────────────

function parseScopes(scopes: string): string[] {
  try {
    const parsed = JSON.parse(scopes);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function rowToApiKey(row: ApiKeyRow): ApiKey {
  return {
    id: row.id,
    owner_address: row.owner_address,
    name: row.name,
    prefix: row.prefix,
    hashed_secret: row.hashed_secret,
    scopes: parseScopes(row.scopes),
    last_used_at: row.last_used_at,
    created_at: row.created_at,
    revoked_at: row.revoked_at,
  };
}

/**
 * Strip hashed_secret from an ApiKey for list responses.
 * The secret must never be exposed after creation.
 */
function apiKeyWithoutSecret(key: ApiKey): Omit<ApiKey, "hashed_secret"> {
  const { hashed_secret, ...rest } = key;
  return rest;
}

// ── CRUD Operations ───────────────────────

export interface CreateKeyParams {
  ownerAddress: string;
  name: string;
  scopes?: string[];
}

export interface CreateKeyResult {
  key: Omit<ApiKey, "hashed_secret">;
  rawSecret: string;
}

/**
 * Create a new API key.
 * Returns the full raw secret once — it is never stored in plaintext.
 */
export function createApiKey(params: CreateKeyParams): CreateKeyResult {
  const db = getDb();
  const id = randomUUID();
  const now = new Date().toISOString();
  const { rawSecret, prefix } = generateApiKeySecret();
  const hashedSecret = hashSecret(rawSecret);
  const scopes = params.scopes ?? [];

  // Validate scopes — must be non-empty strings
  if (scopes.length > 0) {
    for (const scope of scopes) {
      if (typeof scope !== "string" || scope.trim().length === 0) {
        throw new Error("INVALID_SCOPES: All scopes must be non-empty strings");
      }
    }
  }

  // Validate name
  if (!params.name || params.name.trim().length === 0) {
    throw new Error("INVALID_NAME: API key name must not be empty");
  }

  db.prepare(`
    INSERT INTO api_keys (id, owner_address, name, prefix, hashed_secret, scopes, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    params.ownerAddress,
    params.name.trim(),
    prefix,
    hashedSecret,
    JSON.stringify(scopes),
    now,
  );

  const key = getApiKeyById(id);
  if (!key) {
    throw new Error("CREATE_FAILED: API key was created but could not be retrieved");
  }

  return {
    key: apiKeyWithoutSecret(key),
    rawSecret,
  };
}

/**
 * Get a single API key by ID (internal use — includes hashed_secret for verification).
 */
export function getApiKeyById(id: string): ApiKey | null {
  const db = getDb();
  const row = db.prepare("SELECT * FROM api_keys WHERE id = ?").get(id) as ApiKeyRow | undefined;
  if (!row) return null;
  return rowToApiKey(row);
}

/**
 * Look up an API key by its raw secret.
 * Finds matching prefix, then verifies hash.
 * Returns the full ApiKey record on match, or null on mismatch / revoked.
 * Updates last_used_at on successful validation.
 */
export function lookupApiKey(rawSecret: string): ApiKey | null {
  const db = getDb();

  // Extract prefix: sr_ + first 8 hex chars of the raw secret
  const prefix = `${KEY_PREFIX}${rawSecret.slice(0, 8)}`;

  // Find all non-revoked keys with matching prefix
  const rows = db.prepare(
    "SELECT * FROM api_keys WHERE prefix = ? AND revoked_at IS NULL"
  ).all(prefix) as ApiKeyRow[];

  for (const row of rows) {
    if (verifySecret(rawSecret, row.hashed_secret)) {
      // Update last_used_at
      db.prepare(
        "UPDATE api_keys SET last_used_at = ? WHERE id = ?"
      ).run(new Date().toISOString(), row.id);

      return rowToApiKey(row);
    }
  }

  return null;
}

/**
 * List all active (non-revoked) API keys for a given owner address.
 * Returns keys without hashed_secret.
 */
export function listApiKeys(ownerAddress: string): Omit<ApiKey, "hashed_secret">[] {
  const db = getDb();
  const rows = db.prepare(
    "SELECT * FROM api_keys WHERE owner_address = ? AND revoked_at IS NULL ORDER BY created_at DESC"
  ).all(ownerAddress) as ApiKeyRow[];

  return rows.map((row) => apiKeyWithoutSecret(rowToApiKey(row)));
}

/**
 * Update an API key's name and/or scopes.
 * Only the owner can update.
 */
export function updateApiKey(
  keyId: string,
  ownerAddress: string,
  params: { name?: string; scopes?: string[] }
): Omit<ApiKey, "hashed_secret"> {
  const db = getDb();
  const existing = getApiKeyById(keyId);

  if (!existing) {
    throw new Error("KEY_NOT_FOUND");
  }

  if (existing.revoked_at) {
    throw new Error("KEY_REVOKED");
  }

  if (existing.owner_address !== ownerAddress) {
    throw new Error("NOT_OWNER: Only the key owner can update this API key");
  }

  if (params.scopes !== undefined) {
    for (const scope of params.scopes) {
      if (typeof scope !== "string" || scope.trim().length === 0) {
        throw new Error("INVALID_SCOPES: All scopes must be non-empty strings");
      }
    }
  }

  const updates: string[] = [];
  const values: unknown[] = [];

  if (params.name !== undefined) {
    if (params.name.trim().length === 0) {
      throw new Error("INVALID_NAME: API key name must not be empty");
    }
    updates.push("name = ?");
    values.push(params.name.trim());
  }

  if (params.scopes !== undefined) {
    updates.push("scopes = ?");
    values.push(JSON.stringify(params.scopes));
  }

  if (updates.length === 0) {
    // No changes requested — return existing without secret
    return apiKeyWithoutSecret(existing);
  }

  values.push(keyId);

  db.prepare(`UPDATE api_keys SET ${updates.join(", ")} WHERE id = ?`).run(...values);

  const updated = getApiKeyById(keyId);
  if (!updated) {
    throw new Error("UPDATE_FAILED: Key was updated but could not be retrieved");
  }

  return apiKeyWithoutSecret(updated);
}

/**
 * Revoke an API key (soft delete — sets revoked_at).
 * Only the owner can revoke.
 */
export function revokeApiKey(keyId: string, ownerAddress: string): Omit<ApiKey, "hashed_secret"> {
  const db = getDb();
  const existing = getApiKeyById(keyId);

  if (!existing) {
    throw new Error("KEY_NOT_FOUND");
  }

  if (existing.revoked_at) {
    throw new Error("KEY_ALREADY_REVOKED");
  }

  if (existing.owner_address !== ownerAddress) {
    throw new Error("NOT_OWNER: Only the key owner can revoke this API key");
  }

  db.prepare(
    "UPDATE api_keys SET revoked_at = ? WHERE id = ?"
  ).run(new Date().toISOString(), keyId);

  const revoked = getApiKeyById(keyId);
  if (!revoked) {
    throw new Error("REVOKE_FAILED: Key was revoked but could not be retrieved");
  }

  return apiKeyWithoutSecret(revoked);
}

// ── Health ────────────────────────────────

export interface ApiKeyServiceHealth {
  healthy: boolean;
  totalKeys: number;
  activeKeys: number;
  revokedKeys: number;
}

export function getApiKeyServiceHealth(): ApiKeyServiceHealth {
  const db = getDb();
  const totalKeys = (
    db.prepare("SELECT COUNT(*) as cnt FROM api_keys").get() as { cnt: number }
  ).cnt;
  const activeKeys = (
    db.prepare("SELECT COUNT(*) as cnt FROM api_keys WHERE revoked_at IS NULL").get() as { cnt: number }
  ).cnt;

  return {
    healthy: true,
    totalKeys,
    activeKeys,
    revokedKeys: totalKeys - activeKeys,
  };
}
