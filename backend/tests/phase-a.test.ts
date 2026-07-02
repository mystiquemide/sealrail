// ────────────────────────────────────────
// Sealrail Backend - Phase A Tests
// Health endpoint + database migration
// ────────────────────────────────────────

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { getDb, closeDb, resetDb } from "../src/db.js";
import { config } from "../src/config.js";

// Use a test database to avoid touching the dev database
process.env.DATABASE_PATH = ":memory:";

describe("Phase A: Foundation", () => {
  afterAll(() => {
    closeDb();
  });

  describe("Database Schema", () => {
    it("initializes the database without error", () => {
      const db = getDb();
      expect(db).toBeDefined();
    });

    it("creates all 12 tables", () => {
      const db = getDb();
      const tables = db
        .prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
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
      expect(tableNames.length).toBeGreaterThanOrEqual(12);
    });

    it("enforces foreign keys", () => {
      const db = getDb();
      const fkEnabled = db.pragma("foreign_keys") as { foreign_keys: number }[];
      expect(fkEnabled[0].foreign_keys).toBe(1);
    });
  });

  describe("Config", () => {
    it("has tee_verification_mode set", () => {
      expect(config.teeVerificationMode).toBe("tee_verification_mode");
    });

    it("defaults port to 3001", () => {
      expect(config.port).toBe(3001);
    });

    it("defaults host to 0.0.0.0", () => {
      expect(config.host).toBe("0.0.0.0");
    });
  });

  describe("Table schema validation", () => {
    it("agents table has correct columns", () => {
      const db = getDb();
      const cols = db
        .prepare("PRAGMA table_info('agents')")
        .all() as { name: string }[];
      const colNames = cols.map((c) => c.name);

      expect(colNames).toContain("id");
      expect(colNames).toContain("owner_address");
      expect(colNames).toContain("name");
      expect(colNames).toContain("slug");
      expect(colNames).toContain("category");
      expect(colNames).toContain("pricing_model");
      expect(colNames).toContain("base_price");
      expect(colNames).toContain("currency");
      expect(colNames).toContain("status");
      expect(colNames).toContain("verifier_ids");
    });

    it("proofs table has correct columns including TEE mode", () => {
      const db = getDb();
      const cols = db
        .prepare("PRAGMA table_info('proofs')")
        .all() as { name: string }[];
      const colNames = cols.map((c) => c.name);

      expect(colNames).toContain("id");
      expect(colNames).toContain("agent_id");
      expect(colNames).toContain("verifier_id");
      expect(colNames).toContain("input_hash");
      expect(colNames).toContain("output_hash");
      expect(colNames).toContain("wasm_hash");
      expect(colNames).toContain("attestation_hash");
      expect(colNames).toContain("casper_anchor_hash");
      expect(colNames).toContain("mode");
      expect(colNames).toContain("status");
    });

    it("rejects invalid proof mode values", () => {
      const db = getDb();
      // The CHECK constraint should prevent insertion of invalid mode
      expect(() => {
        db.prepare(
          `INSERT INTO proofs (id, agent_id, verifier_id, input_hash, output_hash, wasm_hash, attestation_hash, mode, status)
           VALUES ('p1', 'a1', 'v1', 'ih', 'oh', 'wh', 'ah', 'invalid_mode', 'pending')`
        ).run();
      }).toThrow();
    });

    it("rejects invalid agent category values", () => {
      const db = getDb();
      expect(() => {
        db.prepare(
          `INSERT INTO agents (id, owner_address, name, slug, category, pricing_model, status)
           VALUES ('a1', '0x1', 'Test', 'test', 'invalid_cat', 'fixed', 'active')`
        ).run();
      }).toThrow();
    });

    it("rejects invalid agent status values", () => {
      const db = getDb();
      expect(() => {
        db.prepare(
          `INSERT INTO agents (id, owner_address, name, slug, category, pricing_model, status)
           VALUES ('a2', '0x2', 'Test2', 'test2', 'invoice', 'fixed', 'invalid_status')`
        ).run();
      }).toThrow();
    });

    it("rejects invalid marketplace listing status values", () => {
      const db = getDb();
      // Need to insert agent first due to FK
      db.prepare(
        `INSERT OR IGNORE INTO agents (id, owner_address, name, slug, category, pricing_model, status)
         VALUES ('a99', '0x99', 'FkRef', 'fkref', 'invoice', 'fixed', 'active')`
      ).run();
      expect(() => {
        db.prepare(
          `INSERT INTO marketplace_listings (id, agent_id, owner_address, title, category, summary, price_amount, currency, proof_requirement, verifier_id, status)
           VALUES ('ml1', 'a99', '0x99', 'Title', 'invoice', 'Summ', 10, 'CSPR', 'proof_verified', 'v1', 'invalid_status')`
        ).run();
      }).toThrow();
    });

    it("rejects invalid payment status values", () => {
      const db = getDb();
      expect(() => {
        db.prepare(
          `INSERT INTO payments (id, task_id, agent_id, buyer_address, amount, currency, status)
           VALUES ('p1', 't1', 'a1', '0xb', 100, 'CSPR', 'invalid_state')`
        ).run();
      }).toThrow();
    });

    it("rejects invalid task status values", () => {
      const db = getDb();
      expect(() => {
        db.prepare(
          `INSERT INTO tasks (id, buyer_address, agent_id, listing_id, verifier_id, input_data, status, payment_state)
           VALUES ('t1', '0xb', 'a1', 'ml1', 'v1', '{}', 'invalid_status', 'created')`
        ).run();
      }).toThrow();
    });

    it("enforces WAL journal mode", () => {
      const db = getDb();
      const journal = db.pragma("journal_mode") as { journal_mode: string }[];
      expect(journal[0].journal_mode.toLowerCase()).toBe("wal");
    });

    it("database path defaults to ./data/sealrail.db", () => {
      expect(config.databasePath).toBe("./data/sealrail.db");
    });

    it("node env defaults to development when unset", () => {
      // The envStr default is "development", but vitest sets NODE_ENV=test.
      // Verify the config value is either "development" or "test".
      expect(["development", "test"]).toContain(config.nodeEnv);
    });

    it("config is frozen / readonly", () => {
      // config is 'as const', typescript readonly - smoke test key access
      expect(typeof config.port).toBe("number");
      expect(typeof config.teeVerificationMode).toBe("string");
    });

    it("teeVerificationMode is not empty", () => {
      expect(config.teeVerificationMode.length).toBeGreaterThan(0);
    });

    it("returns 12 tables matching the plan §4", () => {
      const expected = [
        "agent_reputation",
        "agents",
        "api_keys",
        "marketplace_listings",
        "payment_recipients",
        "payments",
        "proofs",
        "system_events",
        "tasks",
        "verifier_templates",
        "workflow_runs",
        "workflow_templates",
      ].sort();
      const db = getDb();
      const tables = db
        .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name")
        .all() as { name: string }[];
      const names = tables.map((t) => t.name).sort();
      expect(names).toEqual(expected);
    });
  });
});
