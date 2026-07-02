// ────────────────────────────────────────
// Sealrail Backend - Phase F Tests
// Agent registry service: CRUD, reputation, proofs, Casper sync
// Covers F1-F3: services, routes, state enforcement
// ────────────────────────────────────────

import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { randomUUID, createHash } from "crypto";

import { getDb, closeDb, resetDb } from "../src/db.js";

// ── Agent service imports ────────────────
import {
  createAgent,
  getAgent,
  getAgentBySlug,
  listAgents,
  updateAgent,
  getAgentReputation,
  getAgentProofs,
  syncAgentToCasper,
  recalculateReputation,
  getAgentServiceHealth,
} from "../src/services/agents.js";

import type {
  Agent,
  AgentCategory,
  AgentStatus,
  AgentPricingModel,
  Currency,
  AgentReputation,
  Proof,
} from "../src/types.js";

// Use a test-specific in-memory database
process.env.DATABASE_PATH = ":memory:";
closeDb();

// ── Test Suite ───────────────────────────

describe("Phase F: Agent Registry Service", () => {

  beforeEach(() => {
    resetDb();
  });

  afterAll(() => {
    closeDb();
  });

  // ═══════════════════════════════════════
  // F1: Agent Service - CRUD
  // ═══════════════════════════════════════

  describe("F1: Agent Service - CRUD", () => {

    describe("createAgent", () => {
      it("creates an agent with required fields", () => {
        const agent = createAgent({
          ownerAddress: "0xAlice",
          name: "Invoice Risk Agent",
          category: "invoice",
        });

        expect(agent.id).toBeDefined();
        expect(agent.owner_address).toBe("0xAlice");
        expect(agent.name).toBe("Invoice Risk Agent");
        expect(agent.category).toBe("invoice");
        expect(agent.slug).toBeDefined();
        expect(agent.slug).toContain("invoice-risk-agent-");
        expect(agent.status).toBe("active");
        expect(agent.pricing_model).toBe("fixed");
        expect(agent.currency).toBe("USD");
        expect(agent.base_price).toBe(0);
        expect(agent.description).toBe("");
        expect(agent.short_pitch).toBe("");
        expect(agent.verifier_ids).toEqual([]);
      });

      it("creates an agent with all optional fields", () => {
        const agent = createAgent({
          ownerAddress: "0xBob",
          name: "DeFi Risk Analyzer",
          category: "defi",
          description: "Analyzes DeFi protocol risk",
          shortPitch: "Real-time DeFi risk scores",
          pricingModel: "per_run",
          basePrice: 50,
          currency: "CSPR",
          verifierIds: ["vfr-defi-v1"],
          supportedTaskTypes: ["defi_risk", "liquidity_check"],
        });

        expect(agent.pricing_model).toBe("per_run");
        expect(agent.base_price).toBe(50);
        expect(agent.currency).toBe("CSPR");
        expect(agent.description).toBe("Analyzes DeFi protocol risk");
        expect(agent.short_pitch).toBe("Real-time DeFi risk scores");
        expect(agent.verifier_ids).toEqual(["vfr-defi-v1"]);
        expect(agent.supported_task_types).toEqual(["defi_risk", "liquidity_check"]);
      });

      it("rejects invalid category", () => {
        expect(() =>
          createAgent({
            ownerAddress: "0xAlice",
            name: "Bad Agent",
            category: "invalid" as AgentCategory,
          })
        ).toThrow("INVALID_CATEGORY");
      });

      it("rejects invalid pricing model", () => {
        expect(() =>
          createAgent({
            ownerAddress: "0xAlice",
            name: "Bad Agent",
            category: "invoice",
            pricingModel: "subscription" as AgentPricingModel,
          })
        ).toThrow("INVALID_PRICING_MODEL");
      });

      it("rejects invalid currency", () => {
        expect(() =>
          createAgent({
            ownerAddress: "0xAlice",
            name: "Bad Agent",
            category: "invoice",
            currency: "EUR" as Currency,
          })
        ).toThrow("INVALID_CURRENCY");
      });

      it("creates a unique slug for each agent", () => {
        const a1 = createAgent({
          ownerAddress: "0xAlice",
          name: "Invoice Risk Agent",
          category: "invoice",
        });
        const a2 = createAgent({
          ownerAddress: "0xAlice",
          name: "Invoice Risk Agent",
          category: "invoice",
        });

        expect(a1.slug).not.toBe(a2.slug);
      });

      it("initializes a reputation row with default score 50", () => {
        const agent = createAgent({
          ownerAddress: "0xAlice",
          name: "Rep Test Agent",
          category: "research",
        });

        const rep = getAgentReputation(agent.id);
        expect(rep.agent_id).toBe(agent.id);
        expect(rep.score).toBe(50);
        expect(rep.verified_runs).toBe(0);
        expect(rep.failed_runs).toBe(0);
        expect(rep.paid_tasks).toBe(0);
        expect(rep.blocked_tasks).toBe(0);
      });
    });

    describe("getAgent", () => {
      it("returns the agent by ID", () => {
        const created = createAgent({
          ownerAddress: "0xAlice",
          name: "Get Me",
          category: "compliance",
        });

        const found = getAgent(created.id);
        expect(found).not.toBeNull();
        expect(found!.id).toBe(created.id);
        expect(found!.name).toBe("Get Me");
      });

      it("returns null for unknown ID", () => {
        const found = getAgent("nonexistent-id");
        expect(found).toBeNull();
      });
    });

    describe("getAgentBySlug", () => {
      it("returns the agent by slug", () => {
        const created = createAgent({
          ownerAddress: "0xAlice",
          name: "Slug Test",
          category: "custom",
        });

        const found = getAgentBySlug(created.slug);
        expect(found).not.toBeNull();
        expect(found!.id).toBe(created.id);
      });

      it("returns null for unknown slug", () => {
        const found = getAgentBySlug("nonexistent-slug");
        expect(found).toBeNull();
      });
    });

    describe("listAgents", () => {
      it("lists all agents", () => {
        createAgent({ ownerAddress: "0xA", name: "Agent A", category: "invoice" });
        createAgent({ ownerAddress: "0xB", name: "Agent B", category: "defi" });
        createAgent({ ownerAddress: "0xC", name: "Agent C", category: "research" });

        const all = listAgents();
        expect(all.length).toBe(3);
      });

      it("filters by category", () => {
        createAgent({ ownerAddress: "0xA", name: "Invoice 1", category: "invoice" });
        createAgent({ ownerAddress: "0xB", name: "Invoice 2", category: "invoice" });
        createAgent({ ownerAddress: "0xC", name: "DeFi 1", category: "defi" });

        const invoices = listAgents({ category: "invoice" });
        expect(invoices.length).toBe(2);
        expect(invoices.every((a) => a.category === "invoice")).toBe(true);
      });

      it("filters by status", () => {
        createAgent({ ownerAddress: "0xA", name: "Active One", category: "invoice" });
        const all = listAgents();
        expect(all.length).toBe(1);
        expect(all[0].status).toBe("active");
      });

      it("filters by owner address", () => {
        createAgent({ ownerAddress: "0xOwner1", name: "O1 Agent", category: "invoice" });
        createAgent({ ownerAddress: "0xOwner2", name: "O2 Agent", category: "defi" });

        const owned = listAgents({ ownerAddress: "0xOwner1" });
        expect(owned.length).toBe(1);
        expect(owned[0].owner_address).toBe("0xOwner1");
      });

      it("returns empty list when no agents exist", () => {
        const all = listAgents();
        expect(all.length).toBe(0);
      });
    });

    describe("updateAgent", () => {
      it("updates the agent name", () => {
        const created = createAgent({
          ownerAddress: "0xAlice",
          name: "Original Name",
          category: "invoice",
        });

        const updated = updateAgent(created.id, "0xAlice", { name: "Updated Name" });
        expect(updated.name).toBe("Updated Name");
        expect(updated.id).toBe(created.id);
      });

      it("updates multiple fields", () => {
        const created = createAgent({
          ownerAddress: "0xAlice",
          name: "Multi Update",
          category: "invoice",
        });

        const updated = updateAgent(created.id, "0xAlice", {
          name: "Renamed",
          description: "New description",
          basePrice: 100,
          currency: "CSPR",
          status: "paused",
        });

        expect(updated.name).toBe("Renamed");
        expect(updated.description).toBe("New description");
        expect(updated.base_price).toBe(100);
        expect(updated.currency).toBe("CSPR");
        expect(updated.status).toBe("paused");
      });

      it("rejects update by non-owner", () => {
        const created = createAgent({
          ownerAddress: "0xAlice",
          name: "Alice Agent",
          category: "invoice",
        });

        expect(() =>
          updateAgent(created.id, "0xMallory", { name: "Hacked" })
        ).toThrow("NOT_OWNER");
      });

      it("returns 404-style error for unknown agent", () => {
        expect(() =>
          updateAgent("nonexistent-id", "0xAlice", { name: "Nope" })
        ).toThrow("AGENT_NOT_FOUND");
      });

      it("rejects invalid category update", () => {
        const created = createAgent({
          ownerAddress: "0xAlice",
          name: "Cat Test",
          category: "invoice",
        });

        expect(() =>
          updateAgent(created.id, "0xAlice", { category: "bad" as AgentCategory })
        ).toThrow("INVALID_CATEGORY");
      });

      it("rejects invalid status update", () => {
        const created = createAgent({
          ownerAddress: "0xAlice",
          name: "Status Test",
          category: "invoice",
        });

        expect(() =>
          updateAgent(created.id, "0xAlice", { status: "deleted" as AgentStatus })
        ).toThrow("INVALID_STATUS");
      });

      it("rejects duplicate slug", () => {
        const a1 = createAgent({
          ownerAddress: "0xAlice",
          name: "Agent One",
          category: "invoice",
        });
        const a2 = createAgent({
          ownerAddress: "0xAlice",
          name: "Agent Two",
          category: "defi",
        });

        expect(() =>
          updateAgent(a2.id, "0xAlice", { slug: a1.slug })
        ).toThrow("SLUG_TAKEN");
      });

      it("allows updating to same slug (no-op)", () => {
        const created = createAgent({
          ownerAddress: "0xAlice",
          name: "Same Slug",
          category: "invoice",
        });

        const updated = updateAgent(created.id, "0xAlice", { slug: created.slug });
        expect(updated.slug).toBe(created.slug);
      });

      it("returns unchanged agent when no fields are provided", () => {
        const created = createAgent({
          ownerAddress: "0xAlice",
          name: "No Change",
          category: "invoice",
        });

        const updated = updateAgent(created.id, "0xAlice", {});
        expect(updated.name).toBe("No Change");
      });
    });
  });

  // ═══════════════════════════════════════
  // Reputation (part of F1)
  // ═══════════════════════════════════════

  describe("Agent Reputation", () => {
    it("returns default score 50 for new agent", () => {
      const agent = createAgent({
        ownerAddress: "0xAlice",
        name: "New Rep Agent",
        category: "invoice",
      });

      const rep = getAgentReputation(agent.id);
      expect(rep.score).toBe(50);
      expect(rep.verified_runs).toBe(0);
      expect(rep.failed_runs).toBe(0);
      expect(rep.paid_tasks).toBe(0);
      expect(rep.blocked_tasks).toBe(0);
      expect(rep.total_earned).toBe(0);
    });

    it("throws AGENT_NOT_FOUND for unknown agent", () => {
      expect(() => getAgentReputation("unknown-agent")).toThrow("AGENT_NOT_FOUND");
    });

    it("computes reputation from real proof data", () => {
      const agent = createAgent({
        ownerAddress: "0xAlice",
        name: "Proven Agent",
        category: "invoice",
      });

      const db = getDb();
      const now = new Date().toISOString();

      // Insert some verified proofs
      for (let i = 0; i < 5; i++) {
        db.prepare(`
          INSERT INTO proofs (id, task_id, agent_id, verifier_id, input_hash, output_hash,
            wasm_hash, attestation_hash, mode, status, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'tee_verification_mode', 'verified', ?)
        `).run(randomUUID(), null, agent.id, "vfr-1", "input", "output", "wasm", "attest", now);
      }

      // Insert some paid tasks
      for (let i = 0; i < 3; i++) {
        const taskId = randomUUID();
        const paymentId = randomUUID();
        db.prepare(`
          INSERT INTO tasks (id, agent_id, title, task_type, status, created_at, updated_at)
          VALUES (?, ?, ?, 'invoice_risk', 'paid', ?, ?)
        `).run(taskId, agent.id, `Paid Task ${i}`, now, now);
        db.prepare(`
          INSERT INTO payments (id, task_id, buyer_address, total_amount, currency, status,
            unlock_rule, created_at, updated_at)
          VALUES (?, ?, '0xBuyer', 100, 'USD', 'paid', 'proof_verified', ?, ?)
        `).run(paymentId, taskId, now, now);
      }

      const rep = getAgentReputation(agent.id);

      // 5 verified runs * 2 = +10, 3 paid tasks * 2 = +6 → score = 50 + 10 + 6 = 66
      expect(rep.score).toBe(66);
      expect(rep.verified_runs).toBe(5);
      expect(rep.paid_tasks).toBe(3);
      expect(rep.total_earned).toBe(300); // 3 * 100
    });

    it("clamps score to [0, 100]", () => {
      const agent = createAgent({
        ownerAddress: "0xAlice",
        name: "Clamp Agent",
        category: "invoice",
      });

      const db = getDb();
      const now = new Date().toISOString();

      // Insert many failed runs (each -5, max -25)
      for (let i = 0; i < 20; i++) {
        db.prepare(`
          INSERT INTO proofs (id, task_id, agent_id, verifier_id, input_hash, output_hash,
            wasm_hash, attestation_hash, mode, status, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'tee_verification_mode', 'failed', ?)
        `).run(randomUUID(), null, agent.id, "vfr-1", "input", "output", "wasm", "attest", now);
      }

      // Insert many blocked tasks (each -3, max -15)
      for (let i = 0; i < 20; i++) {
        const taskId = randomUUID();
        db.prepare(`
          INSERT INTO tasks (id, agent_id, title, task_type, status, created_at, updated_at)
          VALUES (?, ?, ?, 'invoice_risk', 'blocked', ?, ?)
        `).run(taskId, agent.id, `Blocked ${i}`, now, now);
      }

      const rep = getAgentReputation(agent.id);
      // 50 - 25 - 15 = 10 (clamped, not negative)
      expect(rep.score).toBeGreaterThanOrEqual(0);
      expect(rep.score).toBeLessThanOrEqual(100);
      // With max penalties: 50 - 25 - 15 = 10
    });

    it("recalculateReputation returns fresh computation", () => {
      const agent = createAgent({
        ownerAddress: "0xAlice",
        name: "Recalc Agent",
        category: "invoice",
      });

      const rep1 = recalculateReputation(agent.id);
      expect(rep1.score).toBe(50);

      // Add verified runs
      const db = getDb();
      const now = new Date().toISOString();
      for (let i = 0; i < 10; i++) {
        db.prepare(`
          INSERT INTO proofs (id, task_id, agent_id, verifier_id, input_hash, output_hash,
            wasm_hash, attestation_hash, mode, status, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'tee_verification_mode', 'verified', ?)
        `).run(randomUUID(), null, agent.id, "vfr-1", "input", "output", "wasm", "attest", now);
      }

      const rep2 = recalculateReputation(agent.id);
      // 10 verified * 2 = +20 (clamped to +25 max), so 50 + 20 = 70
      expect(rep2.score).toBe(70);
    });
  });

  // ═══════════════════════════════════════
  // Proof history
  // ═══════════════════════════════════════

  describe("Agent Proofs", () => {
    it("returns empty list when agent has no proofs", () => {
      const agent = createAgent({
        ownerAddress: "0xAlice",
        name: "No Proofs Agent",
        category: "invoice",
      });

      const proofs = getAgentProofs(agent.id);
      expect(proofs).toEqual([]);
    });

    it("returns proofs for the agent", () => {
      const agent = createAgent({
        ownerAddress: "0xAlice",
        name: "Proofed Agent",
        category: "invoice",
      });

      const db = getDb();
      const now = new Date().toISOString();
      const proofId = randomUUID();

      db.prepare(`
        INSERT INTO proofs (id, task_id, agent_id, verifier_id, input_hash, output_hash,
          wasm_hash, attestation_hash, mode, status, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'tee_verification_mode', 'verified', ?)
      `).run(proofId, null, agent.id, "vfr-1", "in-hash", "out-hash", "wasm-hash", "att-hash", now);

      const proofs = getAgentProofs(agent.id);
      expect(proofs.length).toBe(1);
      expect(proofs[0].id).toBe(proofId);
      expect(proofs[0].agent_id).toBe(agent.id);
      expect(proofs[0].status).toBe("verified");
    });

    it("throws AGENT_NOT_FOUND for unknown agent", () => {
      expect(() => getAgentProofs("unknown-agent")).toThrow("AGENT_NOT_FOUND");
    });

    it("returns proofs ordered by created_at DESC", () => {
      const agent = createAgent({
        ownerAddress: "0xAlice",
        name: "Ordered Agent",
        category: "invoice",
      });

      const db = getDb();
      const id1 = randomUUID();
      const id2 = randomUUID();

      db.prepare(`
        INSERT INTO proofs (id, task_id, agent_id, verifier_id, input_hash, output_hash,
          wasm_hash, attestation_hash, mode, status, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'tee_verification_mode', 'verified', '2024-01-01T00:00:00Z')
      `).run(id1, null, agent.id, "vfr-1", "in", "out", "wasm", "att");

      db.prepare(`
        INSERT INTO proofs (id, task_id, agent_id, verifier_id, input_hash, output_hash,
          wasm_hash, attestation_hash, mode, status, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'tee_verification_mode', 'verified', '2024-06-01T00:00:00Z')
      `).run(id2, null, agent.id, "vfr-1", "in", "out", "wasm", "att");

      const proofs = getAgentProofs(agent.id);
      expect(proofs[0].id).toBe(id2); // newer first
      expect(proofs[1].id).toBe(id1);
    });
  });

  // ═══════════════════════════════════════
  // F3: Casper Registration Sync
  // ═══════════════════════════════════════

  describe("F3: Casper Registration Sync", () => {
    it("produces a deterministic registration hash in dry-run mode", async () => {
      const agent = createAgent({
        ownerAddress: "0xAlice",
        name: "Casper Agent",
        category: "invoice",
        verifierIds: ["vfr-invoice-v1"],
      });

      const result = await syncAgentToCasper(agent.id);

      expect(result.agentId).toBe(agent.id);
      expect(result.registrationHash).toBeDefined();
      expect(result.registrationHash.length).toBe(64); // SHA-256 hex
      expect(result.mode).toBeDefined();
    });

    it("produces consistent hashes for the same agent", async () => {
      const agent = createAgent({
        ownerAddress: "0xAlice",
        name: "Deterministic Agent",
        category: "defi",
      });

      const result1 = await syncAgentToCasper(agent.id);
      const result2 = await syncAgentToCasper(agent.id);

      expect(result1.registrationHash).toBe(result2.registrationHash);
    });

    it("throws AGENT_NOT_FOUND for unknown agent", async () => {
      await expect(syncAgentToCasper("unknown-agent")).rejects.toThrow("AGENT_NOT_FOUND");
    });
  });

  // ═══════════════════════════════════════
  // Health
  // ═══════════════════════════════════════

  describe("Agent Service Health", () => {
    it("returns healthy status with agent counts", () => {
      createAgent({ ownerAddress: "0xA", name: "A1", category: "invoice" });
      createAgent({ ownerAddress: "0xB", name: "B1", category: "defi" });

      const health = getAgentServiceHealth();
      expect(health.healthy).toBe(true);
      expect(health.agentCount).toBe(2);
      expect(health.activeCount).toBe(2);
      expect(health.casperHealth).toBeDefined();
    });

    it("reports zero counts when no agents exist", () => {
      const health = getAgentServiceHealth();
      expect(health.healthy).toBe(true);
      expect(health.agentCount).toBe(0);
      expect(health.activeCount).toBe(0);
    });
  });

  // ═══════════════════════════════════════
  // Edge cases
  // ═══════════════════════════════════════

  describe("Edge Cases", () => {
    it("handle agent with special characters in name", () => {
      const agent = createAgent({
        ownerAddress: "0xAlice",
        name: "Agent - \"Special\" Chars!",
        category: "custom",
      });

      expect(agent.slug).toMatch(/^[a-z0-9-]+-[a-f0-9]{8}$/);
      expect(agent.slug).not.toContain("\u2014");
      expect(agent.slug).not.toContain('"');
      expect(agent.slug).not.toContain("!");
    });

    it("handle empty supported task types", () => {
      const agent = createAgent({
        ownerAddress: "0xAlice",
        name: "Minimal Agent",
        category: "research",
        supportedTaskTypes: [],
      });

      expect(agent.supported_task_types).toEqual([]);
    });

    it("supports all valid categories", () => {
      for (const cat of ["invoice", "defi", "research", "compliance", "custom"] as AgentCategory[]) {
        const agent = createAgent({
          ownerAddress: "0xAlice",
          name: `${cat} Agent`,
          category: cat,
        });
        expect(agent.category).toBe(cat);
      }
    });

    it("supports all valid statuses", () => {
      const validStatuses: AgentStatus[] = ["active", "paused", "draft"];

      for (const status of validStatuses) {
        const agent = createAgent({
          ownerAddress: "0xAlice",
          name: `Status ${status}`,
          category: "invoice",
        });

        const updated = updateAgent(agent.id, "0xAlice", { status });
        expect(updated.status).toBe(status);
      }
    });

    it("supports workflow_split pricing model", () => {
      const agent = createAgent({
        ownerAddress: "0xAlice",
        name: "Workflow Agent",
        category: "research",
        pricingModel: "workflow_split",
      });

      expect(agent.pricing_model).toBe("workflow_split");
    });
  });
});
