// ────────────────────────────────────────
// Sealrail Backend — Phase L Tests
// Verifier template: create, list, get, update,
// schema validation, duplicate slug, wasm hash,
// upload/register, test-verifier action,
// owner mismatch, nonexistent, filters, A-K preservation
// ────────────────────────────────────────

import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { randomUUID, createHash } from "crypto";

import { getDb, closeDb, resetDb } from "../src/db.js";

// ── Verifier service imports ──────────────
import {
  createVerifier,
  getVerifier,
  listVerifiers,
  updateVerifier,
  uploadVerifier,
  testVerifier,
  hashWasmBytes,
  validateWasmHash,
  getVerifierServiceHealth,
} from "../src/services/verifiers.js";

// ── Agent service imports (for A-K preservation) ──
import {
  createAgent,
  getAgent,
  listAgents,
  updateAgent,
  getAgentReputation,
  getAgentProofs,
} from "../src/services/agents.js";

// ── Task service imports ─────────────────
import { createTask } from "../src/services/tasks.js";

// ── API key service imports (Phase K) ─────
import { createApiKey } from "../src/services/api-keys.js";

// ── Marketplace service imports (Phase G) ─
import { createListing } from "../src/services/marketplace.js";

// ── Workflow service imports (Phase H) ────
import { createWorkflow } from "../src/services/workflows.js";

import type { VerifierTemplate } from "../src/types.js";

// Use a test-specific in-memory database
process.env.DATABASE_PATH = ":memory:";
closeDb();

// ── Test Suite ───────────────────────────

describe("Phase L: Verifier Template Backend", () => {

  beforeEach(() => {
    resetDb();
  });

  afterAll(() => {
    closeDb();
  });

  // ═══════════════════════════════════════
  // L1: Verifier CRUD Operations
  // ═══════════════════════════════════════

  describe("L1: Verifier CRUD", () => {

    const validWasmHash =
      "a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6a7b8c9d0e1f2a3b4c5d6a7b8c9d0e1f2";

    describe("createVerifier", () => {
      it("creates a verifier template with all required fields", () => {
        const verifier = createVerifier({
          ownerAddress: "0xAlice",
          name: "Invoice Risk Verifier",
          taskType: "invoice_risk",
          wasmHash: validWasmHash,
        });

        expect(verifier.id).toBeDefined();
        expect(verifier.owner_address).toBe("0xAlice");
        expect(verifier.name).toBe("Invoice Risk Verifier");
        expect(verifier.slug).toBe("invoice-risk-verifier");
        expect(verifier.task_type).toBe("invoice_risk");
        expect(verifier.wasm_hash).toBe(validWasmHash);
        expect(verifier.status).toBe("draft");
        expect(verifier.mode_support).toEqual(["tee_verification_mode"]);
        expect(verifier.input_schema).toEqual({});
        expect(verifier.output_schema).toEqual({});
        expect(verifier.created_at).toBeDefined();
        expect(verifier.updated_at).toBeDefined();
      });

      it("creates a verifier with explicit active status", () => {
        const verifier = createVerifier({
          ownerAddress: "0xAlice",
          name: "Active Verifier",
          taskType: "defi_risk",
          wasmHash: validWasmHash,
          status: "active",
        });

        expect(verifier.status).toBe("active");
      });

      it("creates a verifier with description and schemas", () => {
        const verifier = createVerifier({
          ownerAddress: "0xAlice",
          name: "Schema Verifier",
          taskType: "compliance",
          wasmHash: validWasmHash,
          description: "Validates compliance reports",
          inputSchema: { report_id: "string", amount: "number" },
          outputSchema: { approved: "boolean", risk_level: "string" },
        });

        expect(verifier.description).toBe("Validates compliance reports");
        expect(verifier.input_schema).toEqual({
          report_id: "string",
          amount: "number",
        });
        expect(verifier.output_schema).toEqual({
          approved: "boolean",
          risk_level: "string",
        });
      });

      it("rejects empty name", () => {
        expect(() =>
          createVerifier({
            ownerAddress: "0xAlice",
            name: "",
            taskType: "invoice_risk",
            wasmHash: validWasmHash,
          }),
        ).toThrow("INVALID_NAME");
      });

      it("rejects whitespace-only name", () => {
        expect(() =>
          createVerifier({
            ownerAddress: "0xAlice",
            name: "   ",
            taskType: "invoice_risk",
            wasmHash: validWasmHash,
          }),
        ).toThrow("INVALID_NAME");
      });

      it("rejects empty task type", () => {
        expect(() =>
          createVerifier({
            ownerAddress: "0xAlice",
            name: "Test",
            taskType: "",
            wasmHash: validWasmHash,
          }),
        ).toThrow("INVALID_TASK_TYPE");
      });

      it("rejects duplicate slug", () => {
        createVerifier({
          ownerAddress: "0xAlice",
          name: "Invoice Risk Verifier",
          taskType: "invoice_risk",
          wasmHash: validWasmHash,
        });

        expect(() =>
          createVerifier({
            ownerAddress: "0xBob",
            name: "Invoice Risk Verifier",
            taskType: "invoice_risk",
            wasmHash: validWasmHash,
          }),
        ).toThrow("DUPLICATE_SLUG");
      });

      it("rejects slug that normalizes to same value", () => {
        createVerifier({
          ownerAddress: "0xAlice",
          name: "Invoice Risk Verifier",
          taskType: "invoice_risk",
          wasmHash: validWasmHash,
        });

        expect(() =>
          createVerifier({
            ownerAddress: "0xBob",
            name: "invoice-risk-verifier",
            taskType: "invoice_risk",
            wasmHash: validWasmHash,
          }),
        ).toThrow("DUPLICATE_SLUG");
      });
    });

    describe("getVerifier", () => {
      it("returns a verifier by ID", () => {
        const created = createVerifier({
          ownerAddress: "0xAlice",
          name: "Test Verifier",
          taskType: "invoice_risk",
          wasmHash: validWasmHash,
        });

        const found = getVerifier(created.id);
        expect(found).not.toBeNull();
        expect(found!.id).toBe(created.id);
        expect(found!.name).toBe("Test Verifier");
      });

      it("returns null for nonexistent verifier", () => {
        const found = getVerifier("nonexistent-id");
        expect(found).toBeNull();
      });
    });

    describe("listVerifiers", () => {
      it("lists all verifiers", () => {
        createVerifier({
          ownerAddress: "0xAlice",
          name: "Verifier A",
          taskType: "invoice_risk",
          wasmHash: validWasmHash,
        });
        createVerifier({
          ownerAddress: "0xBob",
          name: "Verifier B",
          taskType: "defi_risk",
          wasmHash: validWasmHash,
        });

        const list = listVerifiers();
        expect(list).toHaveLength(2);
      });

      it("filters by status", () => {
        createVerifier({
          ownerAddress: "0xAlice",
          name: "Draft Verifier",
          taskType: "invoice_risk",
          wasmHash: validWasmHash,
          status: "draft",
        });
        createVerifier({
          ownerAddress: "0xBob",
          name: "Active Verifier",
          taskType: "defi_risk",
          wasmHash: validWasmHash,
          status: "active",
        });

        const drafts = listVerifiers({ status: "draft" });
        expect(drafts).toHaveLength(1);
        expect(drafts[0].status).toBe("draft");

        const active = listVerifiers({ status: "active" });
        expect(active).toHaveLength(1);
        expect(active[0].status).toBe("active");
      });

      it("filters by task_type", () => {
        createVerifier({
          ownerAddress: "0xAlice",
          name: "Invoice Verifier",
          taskType: "invoice_risk",
          wasmHash: validWasmHash,
        });
        createVerifier({
          ownerAddress: "0xBob",
          name: "Defi Verifier",
          taskType: "defi_risk",
          wasmHash: validWasmHash,
        });

        const invoice = listVerifiers({ taskType: "invoice_risk" });
        expect(invoice).toHaveLength(1);
        expect(invoice[0].task_type).toBe("invoice_risk");
      });

      it("filters by owner_address", () => {
        createVerifier({
          ownerAddress: "0xAlice",
          name: "Alice Verifier",
          taskType: "invoice_risk",
          wasmHash: validWasmHash,
        });
        createVerifier({
          ownerAddress: "0xBob",
          name: "Bob Verifier",
          taskType: "invoice_risk",
          wasmHash: validWasmHash,
        });

        const alice = listVerifiers({ ownerAddress: "0xAlice" });
        expect(alice).toHaveLength(1);
        expect(alice[0].owner_address).toBe("0xAlice");
      });

      it("returns empty array when no verifiers", () => {
        const list = listVerifiers();
        expect(list).toEqual([]);
      });
    });

    describe("updateVerifier", () => {
      it("updates verifier name and regenerates slug", () => {
        const created = createVerifier({
          ownerAddress: "0xAlice",
          name: "Original Name",
          taskType: "invoice_risk",
          wasmHash: validWasmHash,
        });

        const updated = updateVerifier(created.id, "0xAlice", {
          name: "Updated Name",
        });

        expect(updated.name).toBe("Updated Name");
        expect(updated.slug).toBe("updated-name");
      });

      it("updates status", () => {
        const created = createVerifier({
          ownerAddress: "0xAlice",
          name: "To Activate",
          taskType: "invoice_risk",
          wasmHash: validWasmHash,
        });

        const updated = updateVerifier(created.id, "0xAlice", {
          status: "active",
        });
        expect(updated.status).toBe("active");

        const deprecated = updateVerifier(created.id, "0xAlice", {
          status: "deprecated",
        });
        expect(deprecated.status).toBe("deprecated");
      });

      it("updates description and schemas", () => {
        const created = createVerifier({
          ownerAddress: "0xAlice",
          name: "Schema Test",
          taskType: "invoice_risk",
          wasmHash: validWasmHash,
        });

        const updated = updateVerifier(created.id, "0xAlice", {
          description: "New description",
          inputSchema: { invoice_id: "string", amount: "number" },
          outputSchema: { approved: "boolean" },
        });

        expect(updated.description).toBe("New description");
        expect(updated.input_schema).toEqual({
          invoice_id: "string",
          amount: "number",
        });
        expect(updated.output_schema).toEqual({ approved: "boolean" });
      });

      it("updates wasm_hash", () => {
        const created = createVerifier({
          ownerAddress: "0xAlice",
          name: "Hash Update",
          taskType: "invoice_risk",
          wasmHash: validWasmHash,
        });

        const newHash =
          "f0e1d2c3b4a5968778695a4b3c2d1e0f9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d";
        const updated = updateVerifier(created.id, "0xAlice", {
          wasmHash: newHash,
        });
        expect(updated.wasm_hash).toBe(newHash);
      });

      it("rejects update by non-owner", () => {
        const created = createVerifier({
          ownerAddress: "0xAlice",
          name: "Owner Test",
          taskType: "invoice_risk",
          wasmHash: validWasmHash,
        });

        expect(() =>
          updateVerifier(created.id, "0xBob", { name: "Hijacked" }),
        ).toThrow("NOT_OWNER");
      });

      it("rejects update of nonexistent verifier", () => {
        expect(() =>
          updateVerifier("nonexistent-id", "0xAlice", { name: "Ghost" }),
        ).toThrow("VERIFIER_NOT_FOUND");
      });

      it("rejects update that would create duplicate slug", () => {
        createVerifier({
          ownerAddress: "0xAlice",
          name: "Existing Verifier",
          taskType: "invoice_risk",
          wasmHash: validWasmHash,
        });

        const second = createVerifier({
          ownerAddress: "0xAlice",
          name: "Second Verifier",
          taskType: "defi_risk",
          wasmHash: validWasmHash,
        });

        expect(() =>
          updateVerifier(second.id, "0xAlice", { name: "Existing Verifier" }),
        ).toThrow("DUPLICATE_SLUG");
      });
    });
  });

  // ═══════════════════════════════════════
  // L2: WASM Hash Registration
  // ═══════════════════════════════════════

  describe("L2: WASM Hash Registration", () => {

    const validWasmHash =
      "a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6a7b8c9d0e1f2a3b4c5d6a7b8c9d0e1f2";

    describe("hashWasmBytes", () => {
      it("produces a 64-char hex SHA-256 hash", () => {
        const bytes = Buffer.from("mock wasm binary content");
        const hash = hashWasmBytes(bytes);
        expect(hash).toHaveLength(64);
        expect(hash).toMatch(/^[0-9a-f]{64}$/);
      });

      it("is deterministic — same bytes produce same hash", () => {
        const bytes = Buffer.from([0x00, 0x61, 0x73, 0x6d, 0x01, 0x00, 0x00, 0x00]);
        const h1 = hashWasmBytes(bytes);
        const h2 = hashWasmBytes(bytes);
        expect(h1).toBe(h2);
      });

      it("different bytes produce different hashes", () => {
        const h1 = hashWasmBytes(Buffer.from("wasm v1"));
        const h2 = hashWasmBytes(Buffer.from("wasm v2"));
        expect(h1).not.toBe(h2);
      });
    });

    describe("validateWasmHash", () => {
      it("accepts a valid 64-char SHA-256 hash", () => {
        expect(validateWasmHash(validWasmHash)).toBe(true);
      });

      it("accepts a valid 128-char SHA3 hash", () => {
        const sha3Hash =
          "ee26b0dd4af7e749aa1a8ee3c10ae9923f618980772e473f8819a5d4940e0db27ac185f8a0e1d5f84f88bc887fd67b143732c304cc5fa9ad8e6f57f50028a8ff";
        expect(validateWasmHash(sha3Hash)).toBe(true);
      });

      it("rejects non-hex characters", () => {
        expect(validateWasmHash("g" + validWasmHash.slice(1))).toBe(false);
      });

      it("rejects uppercase hex", () => {
        expect(validateWasmHash(validWasmHash.toUpperCase())).toBe(false);
      });

      it("rejects wrong-length hash", () => {
        expect(validateWasmHash("abcdef12")).toBe(false);
        expect(validateWasmHash(validWasmHash + "00")).toBe(false);
      });

      it("rejects empty string", () => {
        expect(validateWasmHash("")).toBe(false);
      });
    });

    describe("uploadVerifier", () => {
      it("registers a verifier from base64 WASM content", () => {
        const wasmBytes = Buffer.from("mock wasm binary data for testing");
        const wasmContent = wasmBytes.toString("base64");

        const verifier = uploadVerifier({
          ownerAddress: "0xAlice",
          name: "Uploaded Verifier",
          taskType: "invoice_risk",
          wasmContent,
        });

        expect(verifier.id).toBeDefined();
        expect(verifier.name).toBe("Uploaded Verifier");
        expect(verifier.wasm_hash).toBe(hashWasmBytes(wasmBytes));
        expect(verifier.wasm_hash).toHaveLength(64);
      });

      it("accepts matching wasm_hash alongside wasm_content", () => {
        const wasmBytes = Buffer.from("test wasm payload");
        const wasmContent = wasmBytes.toString("base64");
        const computedHash = hashWasmBytes(wasmBytes);

        const verifier = uploadVerifier({
          ownerAddress: "0xAlice",
          name: "Hash Matched",
          taskType: "invoice_risk",
          wasmContent,
          wasmHash: computedHash,
        });

        expect(verifier.wasm_hash).toBe(computedHash);
      });

      it("rejects mismatched wasm_hash vs wasm_content", () => {
        const wasmBytes = Buffer.from("test wasm payload");
        const wasmContent = wasmBytes.toString("base64");

        expect(() =>
          uploadVerifier({
            ownerAddress: "0xAlice",
            name: "Hash Mismatch",
            taskType: "invoice_risk",
            wasmContent,
            wasmHash: validWasmHash, // different hash
          }),
        ).toThrow("WASM_HASH_MISMATCH");
      });

      it("accepts wasm_hash only (no content)", () => {
        const verifier = uploadVerifier({
          ownerAddress: "0xAlice",
          name: "Hash Only",
          taskType: "invoice_risk",
          wasmHash: validWasmHash,
        });

        expect(verifier.wasm_hash).toBe(validWasmHash);
      });

      it("rejects empty wasm_content", () => {
        expect(() =>
          uploadVerifier({
            ownerAddress: "0xAlice",
            name: "Empty Content",
            taskType: "invoice_risk",
            wasmContent: "",
          }),
        ).toThrow(/INVALID_WASM_CONTENT|MISSING_WASM/);
      });

      it("rejects both missing", () => {
        expect(() =>
          uploadVerifier({
            ownerAddress: "0xAlice",
            name: "No WASM",
            taskType: "invoice_risk",
          }),
        ).toThrow("MISSING_WASM");
      });

      it("rejects invalid base64 wasm_content", () => {
        expect(() =>
          uploadVerifier({
            ownerAddress: "0xAlice",
            name: "Bad Base64",
            taskType: "invoice_risk",
            wasmContent: "!!!not valid base64!!!",
          }),
        ).toThrow("INVALID_WASM_CONTENT");
      });
    });
  });

  // ═══════════════════════════════════════
  // L3: Test-Verifier Action
  // ═══════════════════════════════════════

  describe("L3: Test-Verifier Action", () => {

    const validWasmHash =
      "a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6a7b8c9d0e1f2a3b4c5d6a7b8c9d0e1f2";

    it("returns valid=true when input matches schema", () => {
      const verifier = createVerifier({
        ownerAddress: "0xAlice",
        name: "Schema Verifier",
        taskType: "invoice_risk",
        wasmHash: validWasmHash,
        inputSchema: { invoice_id: "string", amount: "number" },
        status: "active",
      });

      const result = testVerifier(verifier.id, {
        input: { invoice_id: "INV-123", amount: 5000 },
      });

      expect(result.valid).toBe(true);
      expect(result.verifier_id).toBe(verifier.id);
      expect(result.verifier_status).toBe("active");
      expect(result.input_hash).toHaveLength(64);
      expect(result.output_hash).toHaveLength(64);
      expect(result.wasm_hash).toBe(validWasmHash);
      expect(result.mode).toBe("tee_verification_mode");
      expect(result.verification_token).toHaveLength(64);
      expect(result.tested_at).toBeDefined();
      expect(result.output.result).toBe("passed");
    });

    it("returns valid=false when input misses required keys", () => {
      const verifier = createVerifier({
        ownerAddress: "0xAlice",
        name: "Strict Verifier",
        taskType: "invoice_risk",
        wasmHash: validWasmHash,
        inputSchema: { invoice_id: "string", amount: "number" },
        status: "active",
      });

      const result = testVerifier(verifier.id, {
        input: { invoice_id: "INV-123" },
      });

      expect(result.valid).toBe(false);
      expect(result.output.result).toBe("failed");
      expect(result.output.validation_errors).toBeDefined();
    });

    it("returns valid=false when input types mismatch", () => {
      const verifier = createVerifier({
        ownerAddress: "0xAlice",
        name: "Type Verifier",
        taskType: "invoice_risk",
        wasmHash: validWasmHash,
        inputSchema: { amount: "number" },
        status: "active",
      });

      const result = testVerifier(verifier.id, {
        input: { amount: "not a number" },
      });

      expect(result.valid).toBe(false);
    });

    it("accepts any input when schema is empty", () => {
      const verifier = createVerifier({
        ownerAddress: "0xAlice",
        name: "Open Verifier",
        taskType: "invoice_risk",
        wasmHash: validWasmHash,
        inputSchema: {},
        status: "active",
      });

      const result = testVerifier(verifier.id, {
        input: { anything: "goes", here: 42 },
      });

      expect(result.valid).toBe(true);
    });

    it("produces deterministic output for same input", () => {
      const verifier = createVerifier({
        ownerAddress: "0xAlice",
        name: "Deterministic",
        taskType: "invoice_risk",
        wasmHash: validWasmHash,
        inputSchema: { x: "number" },
        status: "active",
      });

      const input = { x: 42 };
      const r1 = testVerifier(verifier.id, { input });
      const r2 = testVerifier(verifier.id, { input });

      expect(r1.input_hash).toBe(r2.input_hash);
      expect(r1.verification_token).toBe(r2.verification_token);
    });

    it("produces different verification tokens for different inputs", () => {
      const verifier = createVerifier({
        ownerAddress: "0xAlice",
        name: "Token Diff",
        taskType: "invoice_risk",
        wasmHash: validWasmHash,
        inputSchema: { value: "number" },
        status: "active",
      });

      const r1 = testVerifier(verifier.id, { input: { value: 1 } });
      const r2 = testVerifier(verifier.id, { input: { value: 2 } });

      expect(r1.verification_token).not.toBe(r2.verification_token);
    });

    it("rejects test on nonexistent verifier", () => {
      expect(() =>
        testVerifier("nonexistent-id", { input: { x: 1 } }),
      ).toThrow("VERIFIER_NOT_FOUND");
    });

    it("rejects test on deprecated verifier", () => {
      const verifier = createVerifier({
        ownerAddress: "0xAlice",
        name: "Deprecated",
        taskType: "invoice_risk",
        wasmHash: validWasmHash,
        status: "draft",
      });

      // Deprecate it
      updateVerifier(verifier.id, "0xAlice", { status: "deprecated" });

      expect(() =>
        testVerifier(verifier.id, { input: { x: 1 } }),
      ).toThrow("VERIFIER_DEPRECATED");
    });

    it("rejects null input", () => {
      const verifier = createVerifier({
        ownerAddress: "0xAlice",
        name: "Reject Null",
        taskType: "invoice_risk",
        wasmHash: validWasmHash,
        status: "active",
      });

      expect(() =>
        // @ts-expect-error testing invalid input
        testVerifier(verifier.id, { input: null }),
      ).toThrow("INVALID_TEST_INPUT");
    });

    it("allows test on draft verifier (not deprecated)", () => {
      const verifier = createVerifier({
        ownerAddress: "0xAlice",
        name: "Draft Test",
        taskType: "invoice_risk",
        wasmHash: validWasmHash,
        inputSchema: { key: "string" },
        status: "draft",
      });

      const result = testVerifier(verifier.id, { input: { key: "val" } });
      expect(result.valid).toBe(true);
    });

    it("includes validation_errors on failure", () => {
      const verifier = createVerifier({
        ownerAddress: "0xAlice",
        name: "Errors Test",
        taskType: "invoice_risk",
        wasmHash: validWasmHash,
        inputSchema: { field_a: "string", field_b: "number" },
        status: "active",
      });

      const result = testVerifier(verifier.id, {
        input: { field_a: 123 },
      });

      expect(result.valid).toBe(false);
      const errors = result.output.validation_errors as string[];
      expect(errors).toBeDefined();
      expect(errors.some((e) => e.includes("field_b"))).toBe(true);
    });
  });

  // ═══════════════════════════════════════
  // L4: Schema Validation Edge Cases
  // ═══════════════════════════════════════

  describe("Schema Validation", () => {

    const validWasmHash =
      "a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6a7b8c9d0e1f2a3b4c5d6a7b8c9d0e1f2";

    it("rejects input_schema that is not a JSON object (string)", () => {
      expect(() =>
        createVerifier({
          ownerAddress: "0xAlice",
          name: "Bad Schema",
          taskType: "invoice_risk",
          wasmHash: validWasmHash,
          inputSchema: "not-an-object",
        }),
      ).toThrow("INVALID_INPUT_SCHEMA");
    });

    it("rejects input_schema that is an array", () => {
      expect(() =>
        createVerifier({
          ownerAddress: "0xAlice",
          name: "Array Schema",
          taskType: "invoice_risk",
          wasmHash: validWasmHash,
          // @ts-expect-error testing invalid input
          inputSchema: ["a", "b"],
        }),
      ).toThrow("INVALID_INPUT_SCHEMA");
    });

    it("rejects invalid JSON string as schema", () => {
      expect(() =>
        createVerifier({
          ownerAddress: "0xAlice",
          name: "Bad JSON",
          taskType: "invoice_risk",
          wasmHash: validWasmHash,
          inputSchema: "{not valid json}",
        }),
      ).toThrow("INVALID_INPUT_SCHEMA");
    });

    it("accepts JSON string that parses to an object", () => {
      const verifier = createVerifier({
        ownerAddress: "0xAlice",
        name: "String Schema",
        taskType: "invoice_risk",
        wasmHash: validWasmHash,
        inputSchema: JSON.stringify({ key: "string" }),
      });

      expect(verifier.input_schema).toEqual({ key: "string" });
    });
  });

  // ═══════════════════════════════════════
  // Health Check
  // ═══════════════════════════════════════

  describe("Verifier Service Health", () => {

    it("reports zero counts when no verifiers exist", () => {
      const health = getVerifierServiceHealth();
      expect(health.healthy).toBe(true);
      expect(health.totalVerifiers).toBe(0);
      expect(health.activeVerifiers).toBe(0);
      expect(health.draftVerifiers).toBe(0);
      expect(health.deprecatedVerifiers).toBe(0);
    });

    it("reports correct counts after creating verifiers", () => {
      const validWasmHash =
        "a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6a7b8c9d0e1f2a3b4c5d6a7b8c9d0e1f2";

      createVerifier({
        ownerAddress: "0xAlice",
        name: "Active",
        taskType: "invoice_risk",
        wasmHash: validWasmHash,
        status: "active",
      });
      createVerifier({
        ownerAddress: "0xAlice",
        name: "Draft",
        taskType: "invoice_risk",
        wasmHash: validWasmHash,
        status: "draft",
      });

      const health = getVerifierServiceHealth();
      expect(health.totalVerifiers).toBe(2);
      expect(health.activeVerifiers).toBe(1);
      expect(health.draftVerifiers).toBe(1);
      expect(health.deprecatedVerifiers).toBe(0);
    });
  });

  // ═══════════════════════════════════════
  // A-K Preservation Tests
  // ═══════════════════════════════════════

  describe("A-K Preservation", () => {

    const validWasmHash =
      "a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6a7b8c9d0e1f2a3b4c5d6a7b8c9d0e1f2";

    it("creates a verifier without breaking agent CRUD (Phase F)", () => {
      const agent = createAgent({
        ownerAddress: "0xAlice",
        name: "Preserved Agent",
        category: "invoice",
      });

      expect(agent.id).toBeDefined();
      expect(agent.name).toBe("Preserved Agent");

      // Create verifier alongside
      const verifier = createVerifier({
        ownerAddress: "0xAlice",
        name: "Coexisting Verifier",
        taskType: "invoice_risk",
        wasmHash: validWasmHash,
      });

      expect(verifier.id).toBeDefined();

      // Agent still retrievable
      const found = getAgent(agent.id);
      expect(found).not.toBeNull();
      expect(found!.name).toBe("Preserved Agent");
    });

    it("agent listing still works (Phase F)", () => {
      createAgent({
        ownerAddress: "0xAlice",
        name: "List Agent",
        category: "invoice",
      });

      const verifier = createVerifier({
        ownerAddress: "0xAlice",
        name: "List Verifier",
        taskType: "invoice_risk",
        wasmHash: validWasmHash,
      });

      expect(verifier.id).toBeDefined();

      const agents = listAgents();
      expect(agents.length).toBeGreaterThanOrEqual(1);
    });

    it("agent update still works (Phase F)", () => {
      const agent = createAgent({
        ownerAddress: "0xAlice",
        name: "Update Agent",
        category: "invoice",
      });

      const verifier = createVerifier({
        ownerAddress: "0xAlice",
        name: "Update Side",
        taskType: "invoice_risk",
        wasmHash: validWasmHash,
      });

      expect(verifier.id).toBeDefined();

      const updated = updateAgent(agent.id, "0xAlice", {
        name: "Updated Agent",
      });
      expect(updated.name).toBe("Updated Agent");
    });

    it("agent reputation still works (Phase J)", () => {
      const agent = createAgent({
        ownerAddress: "0xAlice",
        name: "Rep Agent",
        category: "invoice",
      });

      const verifier = createVerifier({
        ownerAddress: "0xAlice",
        name: "Rep Verifier",
        taskType: "invoice_risk",
        wasmHash: validWasmHash,
      });

      const rep = getAgentReputation(agent.id);
      expect(rep).toBeDefined();
      expect(rep.agent_id).toBe(agent.id);
      expect(rep.score).toBeGreaterThanOrEqual(0);
      expect(verifier.id).toBeDefined();
    });

    it("agent proofs still work (Phase F)", () => {
      const agent = createAgent({
        ownerAddress: "0xAlice",
        name: "Proof Agent",
        category: "invoice",
      });

      const verifier = createVerifier({
        ownerAddress: "0xAlice",
        name: "Proof Verifier",
        taskType: "invoice_risk",
        wasmHash: validWasmHash,
      });

      const proofs = getAgentProofs(agent.id);
      expect(proofs).toEqual([]);
      expect(verifier.id).toBeDefined();
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

      const verifier = createVerifier({
        ownerAddress: "0xAlice",
        name: "Task Verifier",
        taskType: "invoice_risk",
        wasmHash: validWasmHash,
      });

      expect(verifier.id).toBeDefined();
    });

    it("API keys still work (Phase K)", () => {
      const result = createApiKey({
        ownerAddress: "0xAlice",
        name: "Preserved Key",
      });

      expect(result.key.id).toBeDefined();

      const verifier = createVerifier({
        ownerAddress: "0xAlice",
        name: "Key Verifier",
        taskType: "invoice_risk",
        wasmHash: validWasmHash,
      });

      expect(verifier.id).toBeDefined();
    });

    it("marketplace listings still work (Phase G)", () => {
      const agent = createAgent({
        ownerAddress: "0xAlice",
        name: "Market Agent",
        category: "invoice",
      });

      const listing = createListing({
        agentId: agent.id,
        ownerAddress: "0xAlice",
        title: "Test Listing",
        category: "invoice",
        summary: "A test listing",
        priceAmount: 100,
        currency: "USD",
        verifierId: "v-test-123",
      });

      expect(listing.id).toBeDefined();

      const verifier = createVerifier({
        ownerAddress: "0xAlice",
        name: "Market Verifier",
        taskType: "invoice_risk",
        wasmHash: validWasmHash,
      });

      expect(verifier.id).toBeDefined();
    });

    it("workflows still work (Phase H)", () => {
      const agent = createAgent({
        ownerAddress: "0xAlice",
        name: "Workflow Agent",
        category: "invoice",
      });

      const workflow = createWorkflow({
        ownerAddress: "0xAlice",
        name: "Test Workflow",
        steps: [
          {
            agent_id: agent.id,
            name: "Step 1",
            order: 1,
            required: true,
            verifier_id: "v1",
            payment_share_bps: 10000,
          },
        ],
      });

      expect(workflow.id).toBeDefined();

      const verifier = createVerifier({
        ownerAddress: "0xAlice",
        name: "Workflow Verifier",
        taskType: "invoice_risk",
        wasmHash: validWasmHash,
      });

      expect(verifier.id).toBeDefined();
    });

    it("database schema has all 12 tables including verifier_templates", () => {
      const db = getDb();
      const tables = db
        .prepare(
          "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name",
        )
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
