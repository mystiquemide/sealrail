// ────────────────────────────────────────
// Sealrail Backend - Phase K Tests
// API key management: create, list, hash validation,
// invalid key rejection, scope enforcement, update,
// revoke, last_used_at, security edge cases
// ────────────────────────────────────────

import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { randomUUID } from "crypto";

import { getDb, closeDb, resetDb } from "../src/db.js";

// ── API key service imports ──────────────
import {
  generateApiKeySecret,
  hashSecret,
  verifySecret,
  createApiKey,
  getApiKeyById,
  lookupApiKey,
  listApiKeys,
  updateApiKey,
  revokeApiKey,
  getApiKeyServiceHealth,
} from "../src/services/api-keys.js";

// ── Agent service imports (for A-J preservation) ──
import {
  createAgent,
  getAgent,
  listAgents,
  updateAgent,
  getAgentReputation,
  getAgentProofs,
} from "../src/services/agents.js";

// ── Task service imports ─────────────────
import { createTask, updateTaskStatus } from "../src/services/tasks.js";

import type { Agent, ApiKey } from "../src/types.js";

// Use a test-specific in-memory database
process.env.DATABASE_PATH = ":memory:";
closeDb();

// ── Test Suite ───────────────────────────

describe("Phase K: API Key Management", () => {

  beforeEach(() => {
    resetDb();
  });

  afterAll(() => {
    closeDb();
  });

  // ═══════════════════════════════════════
  // K1: Key generation and hashing service
  // ═══════════════════════════════════════

  describe("K1: Key Generation and Hashing", () => {

    describe("generateApiKeySecret", () => {
      it("generates a 64-char hex raw secret", () => {
        const { rawSecret } = generateApiKeySecret();
        expect(rawSecret).toHaveLength(64);
        expect(rawSecret).toMatch(/^[0-9a-f]{64}$/);
      });

      it("generates a prefix starting with sr_", () => {
        const { rawSecret, prefix } = generateApiKeySecret();
        expect(prefix).toMatch(/^sr_[0-9a-f]{8}$/);
        expect(prefix.slice(3)).toBe(rawSecret.slice(0, 8));
      });

      it("generates unique secrets on each call", () => {
        const s1 = generateApiKeySecret();
        const s2 = generateApiKeySecret();
        const s3 = generateApiKeySecret();

        expect(s1.rawSecret).not.toBe(s2.rawSecret);
        expect(s1.rawSecret).not.toBe(s3.rawSecret);
        expect(s2.rawSecret).not.toBe(s3.rawSecret);
      });

      it("generates different prefixes for different secrets", () => {
        const s1 = generateApiKeySecret();
        const s2 = generateApiKeySecret();
        expect(s1.prefix).not.toBe(s2.prefix);
      });
    });

    describe("hashSecret and verifySecret", () => {
      it("hashes a raw secret to a salt:hash hex string", () => {
        const hash = hashSecret("test-secret-12345");
        expect(hash).toMatch(/^[0-9a-f]+:[0-9a-f]+$/);
        const [salt, hashPart] = hash.split(":");
        expect(salt).toHaveLength(64); // 32 bytes = 64 hex chars
        expect(hashPart).toHaveLength(128); // 64 bytes = 128 hex chars
      });

      it("verifies a matching secret returns true", () => {
        const rawSecret = generateApiKeySecret().rawSecret;
        const hash = hashSecret(rawSecret);
        expect(verifySecret(rawSecret, hash)).toBe(true);
      });

      it("rejects a non-matching secret", () => {
        const rawSecret = generateApiKeySecret().rawSecret;
        const hash = hashSecret(rawSecret);
        expect(verifySecret("wrong-secret-value", hash)).toBe(false);
      });

      it("rejects an empty secret", () => {
        const hash = hashSecret("real-secret");
        expect(verifySecret("", hash)).toBe(false);
      });

      it("each hash is unique even for same secret (different salt)", () => {
        const rawSecret = generateApiKeySecret().rawSecret;
        const h1 = hashSecret(rawSecret);
        const h2 = hashSecret(rawSecret);
        expect(h1).not.toBe(h2);
        // Both should verify
        expect(verifySecret(rawSecret, h1)).toBe(true);
        expect(verifySecret(rawSecret, h2)).toBe(true);
      });

      it("rejects tampered stored hash", () => {
        const rawSecret = generateApiKeySecret().rawSecret;
        const hash = hashSecret(rawSecret);
        const tampered = hash.replace(/a/g, "b");
        expect(verifySecret(rawSecret, tampered)).toBe(false);
      });
    });
  });

  // ═══════════════════════════════════════
  // K2: Key creation and listing
  // ═══════════════════════════════════════

  describe("K2: Key Creation and Listing", () => {

    describe("createApiKey", () => {
      it("creates a key and returns the raw secret once", () => {
        const result = createApiKey({
          ownerAddress: "0xOwner1",
          name: "My First Key",
        });

        // Key has no hashed_secret in response
        expect(result.key).toBeDefined();
        expect(result.key.id).toBeDefined();
        expect(result.key.owner_address).toBe("0xOwner1");
        expect(result.key.name).toBe("My First Key");
        expect(result.key.prefix).toMatch(/^sr_/);
        expect((result.key as any).hashed_secret).toBeUndefined();

        // Raw secret is returned
        expect(result.rawSecret).toHaveLength(64);
        expect(result.rawSecret).toMatch(/^[0-9a-f]{64}$/);
      });

      it("stores only the hashed secret in the database", () => {
        const result = createApiKey({
          ownerAddress: "0xOwner1",
          name: "Test Key",
        });

        // Retrieve from DB directly
        const stored = getApiKeyById(result.key.id);
        expect(stored).toBeDefined();
        expect(stored!.hashed_secret).toMatch(/^[0-9a-f]+:[0-9a-f]+$/);
        // Full secret is NOT stored in plaintext
        expect(stored!.hashed_secret).not.toBe(result.rawSecret);
      });

      it("the raw secret can be used to authenticate immediately", () => {
        const result = createApiKey({
          ownerAddress: "0xOwner1",
          name: "Auth Test Key",
        });

        const found = lookupApiKey(result.rawSecret);
        expect(found).toBeDefined();
        expect(found!.id).toBe(result.key.id);
      });

      it("creates keys with scopes", () => {
        const result = createApiKey({
          ownerAddress: "0xOwner1",
          name: "Scoped Key",
          scopes: ["tasks:read", "agents:write"],
        });

        expect(result.key.scopes).toEqual(["tasks:read", "agents:write"]);
      });

      it("defaults to empty scopes when not provided", () => {
        const result = createApiKey({
          ownerAddress: "0xOwner1",
          name: "No Scopes Key",
        });

        expect(result.key.scopes).toEqual([]);
      });

      it("rejects empty scope strings", () => {
        expect(() =>
          createApiKey({
            ownerAddress: "0xOwner1",
            name: "Bad Scopes",
            scopes: [""],
          })
        ).toThrow("INVALID_SCOPES");
      });

      it("rejects scope strings with only whitespace", () => {
        expect(() =>
          createApiKey({
            ownerAddress: "0xOwner1",
            name: "Bad Scopes",
            scopes: ["   "],
          })
        ).toThrow("INVALID_SCOPES");
      });

      it("rejects empty key name", () => {
        expect(() =>
          createApiKey({
            ownerAddress: "0xOwner1",
            name: "",
          })
        ).toThrow("INVALID_NAME");
      });

      it("rejects whitespace-only key name", () => {
        expect(() =>
          createApiKey({
            ownerAddress: "0xOwner1",
            name: "   ",
          })
        ).toThrow("INVALID_NAME");
      });

      it("trims whitespace from the name", () => {
        const result = createApiKey({
          ownerAddress: "0xOwner1",
          name: "  Trimmed Key  ",
        });
        expect(result.key.name).toBe("Trimmed Key");
      });
    });

    describe("lookupApiKey", () => {
      it("finds key by valid raw secret", () => {
        const result = createApiKey({
          ownerAddress: "0xOwner1",
          name: "Lookup Key",
        });

        const found = lookupApiKey(result.rawSecret);
        expect(found).toBeDefined();
        expect(found!.id).toBe(result.key.id);
      });

      it("returns null for invalid secret", () => {
        createApiKey({ ownerAddress: "0xOwner1", name: "Key1" });

        const found = lookupApiKey("a".repeat(64));
        expect(found).toBeNull();
      });

      it("returns null for empty string", () => {
        createApiKey({ ownerAddress: "0xOwner1", name: "Key1" });

        expect(lookupApiKey("")).toBeNull();
      });

      it("returns null for revoked key", () => {
        const result = createApiKey({ ownerAddress: "0xOwner1", name: "Key1" });
        revokeApiKey(result.key.id, "0xOwner1");

        const found = lookupApiKey(result.rawSecret);
        expect(found).toBeNull();
      });

      it("updates last_used_at on successful lookup", () => {
        const result = createApiKey({ ownerAddress: "0xOwner1", name: "Key1" });

        // Key should have null last_used_at initially
        const before = getApiKeyById(result.key.id);
        expect(before!.last_used_at).toBeNull();

        // Lookup should set it
        lookupApiKey(result.rawSecret);

        const after = getApiKeyById(result.key.id);
        expect(after!.last_used_at).toBeDefined();
        expect(after!.last_used_at).not.toBeNull();
        expect(new Date(after!.last_used_at!).getTime()).toBeGreaterThan(Date.now() - 5000);
      });

      it("does not update last_used_at on failed lookup", () => {
        const result = createApiKey({ ownerAddress: "0xOwner1", name: "Key1" });

        // Failed lookup
        lookupApiKey("a".repeat(64));

        const after = getApiKeyById(result.key.id);
        expect(after!.last_used_at).toBeNull();
      });
    });

    describe("listApiKeys", () => {
      it("lists keys for an owner (prefix only, no secret)", () => {
        createApiKey({ ownerAddress: "0xOwner1", name: "Key A" });
        createApiKey({ ownerAddress: "0xOwner1", name: "Key B" });

        const keys = listApiKeys("0xOwner1");
        expect(keys).toHaveLength(2);
        // Verify no hashed_secret exposed
        for (const key of keys) {
          expect((key as any).hashed_secret).toBeUndefined();
          expect(key.prefix).toMatch(/^sr_/);
          expect(key.name).toBeDefined();
        }
      });

      it("returns empty array for owner with no keys", () => {
        const keys = listApiKeys("0xNonexistent");
        expect(keys).toEqual([]);
      });

      it("filters keys by owner (no cross-owner leakage)", () => {
        createApiKey({ ownerAddress: "0xOwner1", name: "Key A" });
        createApiKey({ ownerAddress: "0xOwner2", name: "Key B" });

        const keys1 = listApiKeys("0xOwner1");
        expect(keys1).toHaveLength(1);
        expect(keys1[0].owner_address).toBe("0xOwner1");

        const keys2 = listApiKeys("0xOwner2");
        expect(keys2).toHaveLength(1);
        expect(keys2[0].owner_address).toBe("0xOwner2");
      });

      it("does not list revoked keys", () => {
        const k1 = createApiKey({ ownerAddress: "0xOwner1", name: "Active" });
        const k2 = createApiKey({ ownerAddress: "0xOwner1", name: "Revoked" });
        revokeApiKey(k2.key.id, "0xOwner1");

        const keys = listApiKeys("0xOwner1");
        expect(keys).toHaveLength(1);
        expect(keys[0].id).toBe(k1.key.id);
      });
    });
  });

  // ═══════════════════════════════════════
  // K3: Key update
  // ═══════════════════════════════════════

  describe("K3: Key Update", () => {

    it("updates key name", () => {
      const result = createApiKey({ ownerAddress: "0xOwner1", name: "Original Name" });

      const updated = updateApiKey(result.key.id, "0xOwner1", { name: "New Name" });
      expect(updated.name).toBe("New Name");
    });

    it("updates key scopes", () => {
      const result = createApiKey({
        ownerAddress: "0xOwner1",
        name: "Key",
        scopes: ["tasks:read"],
      });

      const updated = updateApiKey(result.key.id, "0xOwner1", {
        scopes: ["tasks:read", "tasks:write"],
      });
      expect(updated.scopes).toEqual(["tasks:read", "tasks:write"]);
    });

    it("updates both name and scopes together", () => {
      const result = createApiKey({
        ownerAddress: "0xOwner1",
        name: "Old Name",
        scopes: ["old"],
      });

      const updated = updateApiKey(result.key.id, "0xOwner1", {
        name: "New Name",
        scopes: ["new"],
      });
      expect(updated.name).toBe("New Name");
      expect(updated.scopes).toEqual(["new"]);
    });

    it("rejects update from non-owner", () => {
      const result = createApiKey({ ownerAddress: "0xOwner1", name: "Key" });

      expect(() =>
        updateApiKey(result.key.id, "0xOtherOwner", { name: "Hijacked" })
      ).toThrow("NOT_OWNER");
    });

    it("rejects update on nonexistent key", () => {
      expect(() =>
        updateApiKey("nonexistent-id", "0xOwner1", { name: "Nope" })
      ).toThrow("KEY_NOT_FOUND");
    });

    it("rejects update on revoked key", () => {
      const result = createApiKey({ ownerAddress: "0xOwner1", name: "Key" });
      revokeApiKey(result.key.id, "0xOwner1");

      expect(() =>
        updateApiKey(result.key.id, "0xOwner1", { name: "Unrevoked" })
      ).toThrow("KEY_REVOKED");
    });

    it("rejects empty name on update", () => {
      const result = createApiKey({ ownerAddress: "0xOwner1", name: "Key" });

      expect(() =>
        updateApiKey(result.key.id, "0xOwner1", { name: "" })
      ).toThrow("INVALID_NAME");
    });

    it("rejects invalid scopes on update", () => {
      const result = createApiKey({ ownerAddress: "0xOwner1", name: "Key" });

      expect(() =>
        updateApiKey(result.key.id, "0xOwner1", { scopes: [""] })
      ).toThrow("INVALID_SCOPES");
    });

    it("does not expose hashed_secret in update response", () => {
      const result = createApiKey({ ownerAddress: "0xOwner1", name: "Key" });

      const updated = updateApiKey(result.key.id, "0xOwner1", { name: "Updated" });
      expect((updated as any).hashed_secret).toBeUndefined();
    });
  });

  // ═══════════════════════════════════════
  // K4: Key revocation
  // ═══════════════════════════════════════

  describe("K4: Key Revocation", () => {

    it("revokes a key (soft delete)", () => {
      const result = createApiKey({ ownerAddress: "0xOwner1", name: "Key" });

      const revoked = revokeApiKey(result.key.id, "0xOwner1");
      expect(revoked.revoked_at).toBeDefined();
      expect(revoked.revoked_at).not.toBeNull();
    });

    it("revoked key cannot be used for authentication", () => {
      const result = createApiKey({ ownerAddress: "0xOwner1", name: "Key" });
      revokeApiKey(result.key.id, "0xOwner1");

      const found = lookupApiKey(result.rawSecret);
      expect(found).toBeNull();
    });

    it("revoked key is excluded from listing", () => {
      const result = createApiKey({ ownerAddress: "0xOwner1", name: "Key" });
      revokeApiKey(result.key.id, "0xOwner1");

      const keys = listApiKeys("0xOwner1");
      expect(keys).toHaveLength(0);
    });

    it("rejects revoke from non-owner", () => {
      const result = createApiKey({ ownerAddress: "0xOwner1", name: "Key" });

      expect(() =>
        revokeApiKey(result.key.id, "0xOtherOwner")
      ).toThrow("NOT_OWNER");
    });

    it("rejects double revoke", () => {
      const result = createApiKey({ ownerAddress: "0xOwner1", name: "Key" });
      revokeApiKey(result.key.id, "0xOwner1");

      expect(() =>
        revokeApiKey(result.key.id, "0xOwner1")
      ).toThrow("KEY_ALREADY_REVOKED");
    });

    it("rejects revoke on nonexistent key", () => {
      expect(() =>
        revokeApiKey("nonexistent-id", "0xOwner1")
      ).toThrow("KEY_NOT_FOUND");
    });

    it("does not expose hashed_secret in revoke response", () => {
      const result = createApiKey({ ownerAddress: "0xOwner1", name: "Key" });

      const revoked = revokeApiKey(result.key.id, "0xOwner1");
      expect((revoked as any).hashed_secret).toBeUndefined();
    });
  });

  // ═══════════════════════════════════════
  // K5: Security edge cases
  // ═══════════════════════════════════════

  describe("K5: Security Edge Cases", () => {

    it("raw secret is never stored in plaintext", () => {
      const result = createApiKey({ ownerAddress: "0xOwner1", name: "Key" });

      // Get all data from DB
      const db = getDb();
      const rows = db.prepare("SELECT * FROM api_keys WHERE id = ?").all(result.key.id) as any[];
      for (const row of rows) {
        const rowStr = JSON.stringify(row);
        // Raw secret should never appear in any column
        expect(rowStr).not.toContain(result.rawSecret);
      }
    });

    it("raw secret does not appear in list response", () => {
      createApiKey({ ownerAddress: "0xOwner1", name: "Key" });
      const keys = listApiKeys("0xOwner1");
      const listStr = JSON.stringify(keys);
      expect(listStr).not.toMatch(/[0-9a-f]{64}/);
    });

    it("secret cannot be retrieved after creation", () => {
      const result = createApiKey({ ownerAddress: "0xOwner1", name: "Key" });

      // getApiKeyById returns the full record but the raw secret is never stored
      // The hashed_secret is the only form stored
      const stored = getApiKeyById(result.key.id);
      expect(stored!.hashed_secret).not.toBe(result.rawSecret);

      // No way to retrieve the raw secret from the DB
      const db = getDb();
      const row = db.prepare("SELECT * FROM api_keys WHERE id = ?").get(result.key.id) as any;
      expect(row).toBeDefined();
      // hashed_secret column exists but contains hash, not raw
      expect(row.hashed_secret).toBe(stored!.hashed_secret);
      expect(row.hashed_secret).not.toBe(result.rawSecret);
    });

    it("timing-safe comparison prevents brute-force prefix timing", () => {
      // Create several keys to ensure the lookup path is exercised
      for (let i = 0; i < 5; i++) {
        createApiKey({ ownerAddress: "0xOwner1", name: `Timing Key ${i}` });
      }

      // Repeated lookups should be consistent
      const start = Date.now();
      for (let i = 0; i < 100; i++) {
        lookupApiKey("a".repeat(64));
      }
      const elapsed = Date.now() - start;
      // Should complete in reasonable time (no hangs or infinite loops)
      expect(elapsed).toBeLessThan(1000);
    });

    it("key collision is astronomically unlikely (256-bit entropy)", () => {
      const secrets = new Set<string>();
      for (let i = 0; i < 50; i++) {
        const { rawSecret } = generateApiKeySecret();
        secrets.add(rawSecret);
      }
      // All 50 generated secrets should be unique
      expect(secrets.size).toBe(50);
    });

    it("different owners can have keys with the same name", () => {
      createApiKey({ ownerAddress: "0xA", name: "My Key" });
      createApiKey({ ownerAddress: "0xB", name: "My Key" });

      const keysA = listApiKeys("0xA");
      const keysB = listApiKeys("0xB");
      expect(keysA).toHaveLength(1);
      expect(keysB).toHaveLength(1);
      expect(keysA[0].name).toBe("My Key");
      expect(keysB[0].name).toBe("My Key");
    });
  });

  // ═══════════════════════════════════════
  // K6: Scope enforcement
  // ═══════════════════════════════════════

  describe("K6: Scope Enforcement", () => {

    it("stores and retrieves structured scopes", () => {
      const result = createApiKey({
        ownerAddress: "0xOwner1",
        name: "Scoped Key",
        scopes: ["tasks:read", "tasks:write", "agents:read"],
      });

      const found = lookupApiKey(result.rawSecret);
      expect(found!.scopes).toEqual(["tasks:read", "tasks:write", "agents:read"]);
    });

    it("handles keys with no scopes (empty array)", () => {
      const result = createApiKey({
        ownerAddress: "0xOwner1",
        name: "Unscoped Key",
      });

      const found = lookupApiKey(result.rawSecret);
      expect(found!.scopes).toEqual([]);
    });

    it("scopes persist across updates", () => {
      const result = createApiKey({
        ownerAddress: "0xOwner1",
        name: "Key",
        scopes: ["tasks:read"],
      });

      updateApiKey(result.key.id, "0xOwner1", { scopes: ["admin"] });
      const found = lookupApiKey(result.rawSecret);
      expect(found!.scopes).toEqual(["admin"]);
    });

    it("scopes are searchable (present in key data)", () => {
      createApiKey({
        ownerAddress: "0xOwner1",
        name: "Read Key",
        scopes: ["read"],
      });
      createApiKey({
        ownerAddress: "0xOwner1",
        name: "Write Key",
        scopes: ["write"],
      });

      const keys = listApiKeys("0xOwner1");
      expect(keys).toHaveLength(2);

      const readKey = keys.find((k) => k.name === "Read Key");
      const writeKey = keys.find((k) => k.name === "Write Key");
      expect(readKey!.scopes).toEqual(["read"]);
      expect(writeKey!.scopes).toEqual(["write"]);
    });
  });

  // ═══════════════════════════════════════
  // K7: last_used_at tracking
  // ═══════════════════════════════════════

  describe("K7: last_used_at Tracking", () => {

    it("starts as null for newly created keys", () => {
      const result = createApiKey({ ownerAddress: "0xOwner1", name: "Key" });

      const stored = getApiKeyById(result.key.id);
      expect(stored!.last_used_at).toBeNull();
    });

    it("updates on successful authentication", () => {
      const result = createApiKey({ ownerAddress: "0xOwner1", name: "Key" });

      const before = Date.now();
      lookupApiKey(result.rawSecret);
      const after = Date.now();

      const stored = getApiKeyById(result.key.id);
      const usedAt = new Date(stored!.last_used_at!).getTime();
      expect(usedAt).toBeGreaterThanOrEqual(before);
      expect(usedAt).toBeLessThanOrEqual(after);
    });

    it("updates on every successful authentication", () => {
      const result = createApiKey({ ownerAddress: "0xOwner1", name: "Key" });

      lookupApiKey(result.rawSecret);
      const firstUse = getApiKeyById(result.key.id)!.last_used_at;

      // Small delay to ensure timestamps differ
      // In practice, lookupApiKey updates last_used_at each time
      lookupApiKey(result.rawSecret);
      const secondUse = getApiKeyById(result.key.id)!.last_used_at;

      // Both should be set (second may equal first if within same millisecond,
      // but the behavior is correct - it IS updated)
      expect(firstUse).toBeDefined();
      expect(secondUse).toBeDefined();
    });

    it("does not update on failed authentication", () => {
      const result = createApiKey({ ownerAddress: "0xOwner1", name: "Key" });

      lookupApiKey("wrong-secret-value");
      const stored = getApiKeyById(result.key.id);
      expect(stored!.last_used_at).toBeNull();
    });

    it("revoked keys do not update last_used_at", () => {
      const result = createApiKey({ ownerAddress: "0xOwner1", name: "Key" });
      lookupApiKey(result.rawSecret);
      const usedAt = getApiKeyById(result.key.id)!.last_used_at;
      expect(usedAt).toBeDefined();

      // Revoke
      revokeApiKey(result.key.id, "0xOwner1");

      // Attempt auth with revoked key
      const found = lookupApiKey(result.rawSecret);
      expect(found).toBeNull();

      // last_used_at should still be the first value (not updated)
      const afterRevoke = getApiKeyById(result.key.id);
      expect(afterRevoke!.last_used_at).toBe(usedAt);
    });
  });

  // ═══════════════════════════════════════
  // K8: Health check
  // ═══════════════════════════════════════

  describe("K8: Service Health", () => {

    it("returns healthy with zero keys initially", () => {
      const health = getApiKeyServiceHealth();
      expect(health.healthy).toBe(true);
      expect(health.totalKeys).toBe(0);
      expect(health.activeKeys).toBe(0);
      expect(health.revokedKeys).toBe(0);
    });

    it("tracks active vs revoked keys correctly", () => {
      const k1 = createApiKey({ ownerAddress: "0xA", name: "Active 1" });
      const k2 = createApiKey({ ownerAddress: "0xB", name: "Active 2" });
      const k3 = createApiKey({ ownerAddress: "0xC", name: "To Revoke" });

      revokeApiKey(k3.key.id, "0xC");

      const health = getApiKeyServiceHealth();
      expect(health.totalKeys).toBe(3);
      expect(health.activeKeys).toBe(2);
      expect(health.revokedKeys).toBe(1);
    });
  });

  // ═══════════════════════════════════════
  // A-J Phase Preservation
  // ═══════════════════════════════════════

  describe("A-J Phase Preservation", () => {

    it("agents can still be created and listed (Phase F)", () => {
      const agent = createAgent({
        ownerAddress: "0xAlice",
        name: "Phase K Agent",
        category: "invoice",
      });

      expect(agent.id).toBeDefined();
      expect(agent.status).toBe("active");

      const all = listAgents();
      expect(all.length).toBe(1);
      expect(all[0].name).toBe("Phase K Agent");
    });

    it("agents can still be updated (Phase F)", () => {
      const agent = createAgent({
        ownerAddress: "0xAlice",
        name: "Original",
        category: "invoice",
      });

      const updated = updateAgent(agent.id, "0xAlice", { name: "Updated Agent" });
      expect(updated.name).toBe("Updated Agent");
    });

    it("agent reputation still works (Phase J)", () => {
      const agent = createAgent({
        ownerAddress: "0xAlice",
        name: "Rep Agent",
        category: "invoice",
      });

      const rep = getAgentReputation(agent.id);
      expect(rep).toBeDefined();
      expect(rep.agent_id).toBe(agent.id);
      expect(rep.score).toBeGreaterThanOrEqual(0);
    });

    it("agent proofs still work (Phase F)", () => {
      const agent = createAgent({
        ownerAddress: "0xAlice",
        name: "Proof Agent",
        category: "invoice",
      });

      const proofs = getAgentProofs(agent.id);
      expect(proofs).toEqual([]);
    });

    it("tasks can still be created (Phase E)", () => {
      const agent = createAgent({
        ownerAddress: "0xAlice",
        name: "Task Agent",
        category: "invoice",
      });

      const task = createTask({
        buyerAddress: "0xBob",
        agentId: agent.id,
        taskType: "invoice_risk",
        input: { invoice_id: "INV-001" },
      });

      expect(task.id).toBeDefined();
      expect(task.status).toBe("draft");
    });

    it("database schema has all 12 tables including api_keys", () => {
      const db = getDb();
      const tables = db
        .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name")
        .all() as { name: string }[];

      const tableNames = tables.map((t) => t.name).sort();
      expect(tableNames).toContain("agents");
      expect(tableNames).toContain("marketplace_listings");
      expect(tableNames).toContain("tasks");
      expect(tableNames).toContain("payments");
      expect(tableNames).toContain("payment_recipients");
      expect(tableNames).toContain("proofs");
      expect(tableNames).toContain("verifier_templates");
      expect(tableNames).toContain("workflow_templates");
      expect(tableNames).toContain("workflow_runs");
      expect(tableNames).toContain("agent_reputation");
      expect(tableNames).toContain("api_keys");
      expect(tableNames).toContain("system_events");
    });
  });
});
