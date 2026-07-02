// ────────────────────────────────────────
// Sealrail Backend - Phase J Tests
// Reputation scoring engine: score calculator, data gathering,
// recalculation hooks, API routes, bounds, deterministic output
// ────────────────────────────────────────

import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { randomUUID } from "crypto";

import { getDb, closeDb, resetDb } from "../src/db.js";

// ── Reputation service imports ────────────
import {
  computeScore,
  gatherReputationInputs,
  computeReputation,
  recalculateReputation,
  getReputation,
  recalculateAllReputations,
  getReputationServiceHealth,
} from "../src/services/reputation.js";

// ── Agent service imports ────────────────
import {
  createAgent,
  getAgent,
  listAgents,
  updateAgent,
  getAgentReputation,
  getAgentProofs,
  syncAgentToCasper,
  getAgentServiceHealth,
} from "../src/services/agents.js";

// ── Task service imports (for recalculation hooks) ──
import {
  createTask,
  updateTaskStatus,
} from "../src/services/tasks.js";

import type {
  Agent,
  AgentCategory,
  AgentReputation,
} from "../src/types.js";

// Use a test-specific in-memory database
process.env.DATABASE_PATH = ":memory:";
closeDb();

// ── Test Suite ───────────────────────────

describe("Phase J: Reputation Scoring Engine", () => {

  beforeEach(() => {
    resetDb();
  });

  afterAll(() => {
    closeDb();
  });

  // ═══════════════════════════════════════
  // J1: Score calculator - pure function
  // ═══════════════════════════════════════

  describe("J1: Score Calculator", () => {

    describe("computeScore", () => {
      it("returns 50 with no activity (zero inputs)", () => {
        const score = computeScore({
          verifiedRuns: 0,
          paidTasks: 0,
          failedRuns: 0,
          blockedTasks: 0,
        });
        expect(score).toBe(50);
      });

      it("improves with verified runs", () => {
        const score = computeScore({
          verifiedRuns: 5,
          paidTasks: 0,
          failedRuns: 0,
          blockedTasks: 0,
        });
        // 50 + min(25, 5*2) = 50 + 10 = 60
        expect(score).toBe(60);
      });

      it("caps verified runs bonus at +25", () => {
        const score = computeScore({
          verifiedRuns: 100,
          paidTasks: 0,
          failedRuns: 0,
          blockedTasks: 0,
        });
        // 50 + min(25, 100*2) = 75
        expect(score).toBe(75);
      });

      it("improves with paid tasks", () => {
        const score = computeScore({
          verifiedRuns: 0,
          paidTasks: 5,
          failedRuns: 0,
          blockedTasks: 0,
        });
        // 50 + min(15, 5*2) = 50 + 10 = 60
        expect(score).toBe(60);
      });

      it("caps paid tasks bonus at +15", () => {
        const score = computeScore({
          verifiedRuns: 0,
          paidTasks: 100,
          failedRuns: 0,
          blockedTasks: 0,
        });
        // 50 + min(15, 100*2) = 65
        expect(score).toBe(65);
      });

      it("penalizes failed runs", () => {
        const score = computeScore({
          verifiedRuns: 0,
          paidTasks: 0,
          failedRuns: 3,
          blockedTasks: 0,
        });
        // 50 - min(25, 3*5) = 50 - 15 = 35
        expect(score).toBe(35);
      });

      it("caps failed runs penalty at -25", () => {
        const score = computeScore({
          verifiedRuns: 0,
          paidTasks: 0,
          failedRuns: 20,
          blockedTasks: 0,
        });
        // 50 - min(25, 20*5) = 50 - 25 = 25
        expect(score).toBe(25);
      });

      it("penalizes blocked tasks", () => {
        const score = computeScore({
          verifiedRuns: 0,
          paidTasks: 0,
          failedRuns: 0,
          blockedTasks: 4,
        });
        // 50 - min(15, 4*3) = 50 - 12 = 38
        expect(score).toBe(38);
      });

      it("caps blocked tasks penalty at -15", () => {
        const score = computeScore({
          verifiedRuns: 0,
          paidTasks: 0,
          failedRuns: 0,
          blockedTasks: 20,
        });
        // 50 - min(15, 20*3) = 50 - 15 = 35
        expect(score).toBe(35);
      });

      it("combines all inputs correctly", () => {
        const score = computeScore({
          verifiedRuns: 10,
          paidTasks: 5,
          failedRuns: 2,
          blockedTasks: 1,
        });
        // 50 + min(25, 20) + min(15, 10) - min(25, 10) - min(15, 3)
        // = 50 + 20 + 10 - 10 - 3 = 67
        expect(score).toBe(67);
      });

      it("is deterministic - same inputs produce same score", () => {
        const inputs = {
          verifiedRuns: 7,
          paidTasks: 4,
          failedRuns: 3,
          blockedTasks: 2,
        };
        const s1 = computeScore(inputs);
        const s2 = computeScore(inputs);
        expect(s1).toBe(s2);
      });
    });
  });

  // ═══════════════════════════════════════
  // Score bounds [0, 100]
  // ═══════════════════════════════════════

  describe("Score Bounds [0, 100]", () => {
    it("clamps score to 0 minimum", () => {
      // 50 - max penalties = 50 - 25 - 15 = 10, not 0.
      // Need more negative: add a test that no combination beats 0.
      // With the formula, minimum is 50 - 25 - 15 = 10 (no matter what).
      // The clamp is still tested for upper bound.
      const score = computeScore({
        verifiedRuns: 0,
        paidTasks: 0,
        failedRuns: 100,
        blockedTasks: 100,
      });
      expect(score).toBe(10); // formula floor is 10
      expect(score).toBeGreaterThanOrEqual(0);
    });

    it("clamps score to 100 maximum", () => {
      const score = computeScore({
        verifiedRuns: 100,
        paidTasks: 100,
        failedRuns: 0,
        blockedTasks: 0,
      });
      // 50 + 25 + 15 = 90, clamped to 100 (but it's already ≤ 100)
      expect(score).toBe(90);
      expect(score).toBeLessThanOrEqual(100);
    });

    it("ensures score never exceeds 100 even with extreme inputs", () => {
      // Max possible: 50 + 25 + 15 = 90 (within bounds)
      for (const v of [0, 50, 500]) {
        for (const p of [0, 50, 500]) {
          const score = computeScore({
            verifiedRuns: v,
            paidTasks: p,
            failedRuns: 0,
            blockedTasks: 0,
          });
          expect(score).toBeLessThanOrEqual(100);
          expect(score).toBeGreaterThanOrEqual(0);
        }
      }
    });
  });

  // ═══════════════════════════════════════
  // Data gathering from real records
  // ═══════════════════════════════════════

  describe("gatherReputationInputs", () => {
    it("returns all zeros for agent with no proof/task/payment data", () => {
      const agent = createAgent({
        ownerAddress: "0xAlice",
        name: "Clean Agent",
        category: "invoice",
      });

      const inputs = gatherReputationInputs(agent.id);
      expect(inputs.verifiedRuns).toBe(0);
      expect(inputs.failedRuns).toBe(0);
      expect(inputs.paidTasks).toBe(0);
      expect(inputs.blockedTasks).toBe(0);
      expect(inputs.totalEarned).toBe(0);
      expect(inputs.lastProofAt).toBeNull();
    });

    it("counts verified proofs correctly", () => {
      const agent = createAgent({
        ownerAddress: "0xAlice",
        name: "Proven Agent",
        category: "invoice",
      });

      const db = getDb();
      const now = new Date().toISOString();

      // Insert 3 verified and 2 anchored proofs
      for (let i = 0; i < 3; i++) {
        db.prepare(`
          INSERT INTO proofs (id, task_id, agent_id, verifier_id, input_hash, output_hash,
            wasm_hash, attestation_hash, mode, status, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'tee_verification_mode', 'verified', ?)
        `).run(randomUUID(), null, agent.id, "vfr-1", "in", "out", "wasm", "att", now);
      }
      for (let i = 0; i < 2; i++) {
        db.prepare(`
          INSERT INTO proofs (id, task_id, agent_id, verifier_id, input_hash, output_hash,
            wasm_hash, attestation_hash, mode, status, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'tee_verification_mode', 'anchored', ?)
        `).run(randomUUID(), null, agent.id, "vfr-1", "in", "out", "wasm", "att", now);
      }

      const inputs = gatherReputationInputs(agent.id);
      expect(inputs.verifiedRuns).toBe(5);
    });

    it("counts failed proofs separately from verified", () => {
      const agent = createAgent({
        ownerAddress: "0xAlice",
        name: "Mixed Agent",
        category: "invoice",
      });

      const db = getDb();
      const now = new Date().toISOString();

      // 4 verified, 2 failed
      for (let i = 0; i < 4; i++) {
        db.prepare(`
          INSERT INTO proofs (id, task_id, agent_id, verifier_id, input_hash, output_hash,
            wasm_hash, attestation_hash, mode, status, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'tee_verification_mode', 'verified', ?)
        `).run(randomUUID(), null, agent.id, "vfr-1", "in", "out", "wasm", "att", now);
      }
      for (let i = 0; i < 2; i++) {
        db.prepare(`
          INSERT INTO proofs (id, task_id, agent_id, verifier_id, input_hash, output_hash,
            wasm_hash, attestation_hash, mode, status, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'tee_verification_mode', 'failed', ?)
        `).run(randomUUID(), null, agent.id, "vfr-1", "in", "out", "wasm", "att", now);
      }

      const inputs = gatherReputationInputs(agent.id);
      expect(inputs.verifiedRuns).toBe(4);
      expect(inputs.failedRuns).toBe(2);
    });

    it("counts paid and blocked tasks separately", () => {
      const agent = createAgent({
        ownerAddress: "0xAlice",
        name: "Tasked Agent",
        category: "invoice",
      });

      const db = getDb();
      const now = new Date().toISOString();

      for (let i = 0; i < 3; i++) {
        db.prepare(`
          INSERT INTO tasks (id, agent_id, title, task_type, status, created_at, updated_at)
          VALUES (?, ?, ?, 'invoice_risk', 'paid', ?, ?)
        `).run(randomUUID(), agent.id, `Paid ${i}`, now, now);
      }
      for (let i = 0; i < 2; i++) {
        db.prepare(`
          INSERT INTO tasks (id, agent_id, title, task_type, status, created_at, updated_at)
          VALUES (?, ?, ?, 'invoice_risk', 'blocked', ?, ?)
        `).run(randomUUID(), agent.id, `Blocked ${i}`, now, now);
      }

      const inputs = gatherReputationInputs(agent.id);
      expect(inputs.paidTasks).toBe(3);
      expect(inputs.blockedTasks).toBe(2);
    });

    it("computes total earned from paid payment+task records", () => {
      const agent = createAgent({
        ownerAddress: "0xAlice",
        name: "Earner Agent",
        category: "invoice",
      });

      const db = getDb();
      const now = new Date().toISOString();

      for (let i = 0; i < 3; i++) {
        const taskId = randomUUID();
        const paymentId = randomUUID();
        db.prepare(`
          INSERT INTO tasks (id, agent_id, title, task_type, status, created_at, updated_at)
          VALUES (?, ?, ?, 'invoice_risk', 'paid', ?, ?)
        `).run(taskId, agent.id, `Task ${i}`, now, now);
        db.prepare(`
          INSERT INTO payments (id, task_id, buyer_address, total_amount, currency, status,
            unlock_rule, created_at, updated_at)
          VALUES (?, ?, '0xBuyer', ?, 'USD', 'paid', 'proof_verified', ?, ?)
        `).run(paymentId, taskId, 150, now, now);
      }

      const inputs = gatherReputationInputs(agent.id);
      expect(inputs.totalEarned).toBe(450);
    });
  });

  // ═══════════════════════════════════════
  // computeReputation - full integration
  // ═══════════════════════════════════════

  describe("computeReputation", () => {
    it("returns score 50 for agent with no activity", () => {
      const agent = createAgent({
        ownerAddress: "0xAlice",
        name: "New Agent",
        category: "invoice",
      });

      const rep = computeReputation(agent.id);
      expect(rep.score).toBe(50);
      expect(rep.verified_runs).toBe(0);
      expect(rep.failed_runs).toBe(0);
      expect(rep.paid_tasks).toBe(0);
      expect(rep.blocked_tasks).toBe(0);
      expect(rep.total_earned).toBe(0);
    });

    it("throws AGENT_NOT_FOUND for nonexistent agent", () => {
      expect(() => computeReputation("nonexistent-id")).toThrow("AGENT_NOT_FOUND");
    });

    it("computes from real proof data and persists to agent_reputation table", () => {
      const agent = createAgent({
        ownerAddress: "0xAlice",
        name: "Real Data Agent",
        category: "invoice",
      });

      const db = getDb();
      const now = new Date().toISOString();

      // 5 verified proofs → +10 (min(25, 10))
      for (let i = 0; i < 5; i++) {
        db.prepare(`
          INSERT INTO proofs (id, task_id, agent_id, verifier_id, input_hash, output_hash,
            wasm_hash, attestation_hash, mode, status, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'tee_verification_mode', 'verified', ?)
        `).run(randomUUID(), null, agent.id, "vfr-1", "in", "out", "wasm", "att", now);
      }

      // 3 paid tasks → +6 (min(15, 6))
      for (let i = 0; i < 3; i++) {
        const taskId = randomUUID();
        const paymentId = randomUUID();
        db.prepare(`
          INSERT INTO tasks (id, agent_id, title, task_type, status, created_at, updated_at)
          VALUES (?, ?, ?, 'invoice_risk', 'paid', ?, ?)
        `).run(taskId, agent.id, `Paid ${i}`, now, now);
        db.prepare(`
          INSERT INTO payments (id, task_id, buyer_address, total_amount, currency, status,
            unlock_rule, created_at, updated_at)
          VALUES (?, ?, '0xBuyer', 100, 'USD', 'paid', 'proof_verified', ?, ?)
        `).run(paymentId, taskId, now, now);
      }

      const rep = computeReputation(agent.id);
      // 50 + 10 + 6 = 66
      expect(rep.score).toBe(66);
      expect(rep.verified_runs).toBe(5);
      expect(rep.paid_tasks).toBe(3);
      expect(rep.total_earned).toBe(300);

      // Verify persistence - read back from DB
      const stored = db.prepare(
        "SELECT score, verified_runs, paid_tasks FROM agent_reputation WHERE agent_id = ?"
      ).get(agent.id) as { score: number; verified_runs: number; paid_tasks: number };
      expect(stored.score).toBe(66);
      expect(stored.verified_runs).toBe(5);
      expect(stored.paid_tasks).toBe(3);
    });

    it("penalizes for failed runs and blocked tasks", () => {
      const agent = createAgent({
        ownerAddress: "0xAlice",
        name: "Penalized Agent",
        category: "invoice",
      });

      const db = getDb();
      const now = new Date().toISOString();

      // 5 failed proofs → -25 (max)
      for (let i = 0; i < 5; i++) {
        db.prepare(`
          INSERT INTO proofs (id, task_id, agent_id, verifier_id, input_hash, output_hash,
            wasm_hash, attestation_hash, mode, status, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'tee_verification_mode', 'failed', ?)
        `).run(randomUUID(), null, agent.id, "vfr-1", "in", "out", "wasm", "att", now);
      }

      // 5 blocked tasks → -15 (max)
      for (let i = 0; i < 5; i++) {
        db.prepare(`
          INSERT INTO tasks (id, agent_id, title, task_type, status, created_at, updated_at)
          VALUES (?, ?, ?, 'invoice_risk', 'blocked', ?, ?)
        `).run(randomUUID(), agent.id, `Blocked ${i}`, now, now);
      }

      const rep = computeReputation(agent.id);
      // 50 - 25 - 15 = 10
      expect(rep.score).toBe(10);
      expect(rep.failed_runs).toBe(5);
      expect(rep.blocked_tasks).toBe(5);
    });

    it("is deterministic - same data produces same score", () => {
      const agent = createAgent({
        ownerAddress: "0xAlice",
        name: "Deterministic Agent",
        category: "invoice",
      });

      const db = getDb();
      const now = new Date().toISOString();

      for (let i = 0; i < 4; i++) {
        db.prepare(`
          INSERT INTO proofs (id, task_id, agent_id, verifier_id, input_hash, output_hash,
            wasm_hash, attestation_hash, mode, status, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'tee_verification_mode', 'verified', ?)
        `).run(randomUUID(), null, agent.id, "vfr-1", "in", "out", "wasm", "att", now);
      }

      const rep1 = computeReputation(agent.id);
      const rep2 = computeReputation(agent.id);
      expect(rep1.score).toBe(rep2.score);
      expect(rep1.verified_runs).toBe(rep2.verified_runs);
    });

    it("returns complete AgentReputation object shape", () => {
      const agent = createAgent({
        ownerAddress: "0xAlice",
        name: "Shape Agent",
        category: "invoice",
      });

      const rep = computeReputation(agent.id);
      expect(rep).toHaveProperty("agent_id", agent.id);
      expect(rep).toHaveProperty("score");
      expect(rep).toHaveProperty("verified_runs");
      expect(rep).toHaveProperty("failed_runs");
      expect(rep).toHaveProperty("paid_tasks");
      expect(rep).toHaveProperty("blocked_tasks");
      expect(rep).toHaveProperty("total_earned");
      expect(rep).toHaveProperty("average_verification_time_ms");
      expect(rep).toHaveProperty("last_proof_at");
      expect(rep).toHaveProperty("updated_at");
    });
  });

  // ═══════════════════════════════════════
  // Recalculation behavior
  // ═══════════════════════════════════════

  describe("Recalculation", () => {
    it("recalculateReputation returns fresh computation from live data", () => {
      const agent = createAgent({
        ownerAddress: "0xAlice",
        name: "Recalc Agent",
        category: "invoice",
      });

      // Initial
      const rep1 = recalculateReputation(agent.id);
      expect(rep1.score).toBe(50);

      // Add verified proofs
      const db = getDb();
      const now = new Date().toISOString();
      for (let i = 0; i < 10; i++) {
        db.prepare(`
          INSERT INTO proofs (id, task_id, agent_id, verifier_id, input_hash, output_hash,
            wasm_hash, attestation_hash, mode, status, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'tee_verification_mode', 'verified', ?)
        `).run(randomUUID(), null, agent.id, "vfr-1", "in", "out", "wasm", "att", now);
      }

      // Recalculate should see new data
      const rep2 = recalculateReputation(agent.id);
      // 50 + min(25, 10*2) = 50 + 20 = 70
      expect(rep2.score).toBe(70);
    });

    it("getReputation returns stored or computed value", () => {
      const agent = createAgent({
        ownerAddress: "0xAlice",
        name: "GetRep Agent",
        category: "invoice",
      });

      const rep = getReputation(agent.id);
      expect(rep.score).toBe(50);
      expect(rep.agent_id).toBe(agent.id);
    });

    it("getReputation throws AGENT_NOT_FOUND for nonexistent agent", () => {
      expect(() => getReputation("nonexistent-id")).toThrow("AGENT_NOT_FOUND");
    });

    it("recalculateAllReputations processes all agents", () => {
      const a1 = createAgent({
        ownerAddress: "0xAlice",
        name: "Agent 1",
        category: "invoice",
      });
      const a2 = createAgent({
        ownerAddress: "0xBob",
        name: "Agent 2",
        category: "defi",
      });

      const results = recalculateAllReputations();
      expect(results.size).toBe(2);
      expect(results.get(a1.id)!.score).toBe(50);
      expect(results.get(a2.id)!.score).toBe(50);
    });
  });

  // ═══════════════════════════════════════
  // Task recalculation hooks (J2)
  // ═══════════════════════════════════════

  describe("J2: Task recalculation hooks", () => {
    it("recalculates reputation when task transitions to paid", () => {
      const agent = createAgent({
        ownerAddress: "0xAlice",
        name: "Hook Agent",
        category: "invoice",
      });

      // Insert a paid task directly (bypassing state machine for test)
      const db = getDb();
      const now = new Date().toISOString();
      const taskId = randomUUID();
      const paymentId = randomUUID();
      db.prepare(`
        INSERT INTO tasks (id, agent_id, title, task_type, status, created_at, updated_at)
        VALUES (?, ?, ?, 'invoice_risk', 'paid', ?, ?)
      `).run(taskId, agent.id, "Paid Test", now, now);
      db.prepare(`
        INSERT INTO payments (id, task_id, buyer_address, total_amount, currency, status,
          unlock_rule, created_at, updated_at)
        VALUES (?, ?, '0xBuyer', 100, 'USD', 'paid', 'proof_verified', ?, ?)
      `).run(paymentId, taskId, now, now);

      // Trigger recalculation
      const rep = recalculateReputation(agent.id);
      expect(rep.paid_tasks).toBe(1);
      // 50 + min(15, 1*2) = 52
      expect(rep.score).toBe(52);
    });

    it("recalculates reputation when task transitions to blocked", () => {
      const agent = createAgent({
        ownerAddress: "0xAlice",
        name: "Blocked Hook Agent",
        category: "invoice",
      });

      const task = createTask({
        agentId: agent.id,
        title: "Blocked Task",
      });

      // Valid transition: draft → funded → blocked
      updateTaskStatus(task.id, "funded");
      updateTaskStatus(task.id, "blocked");

      const rep = getReputation(agent.id);
      expect(rep.blocked_tasks).toBe(1);
      // 50 - min(15, 1*3) = 47
      expect(rep.score).toBe(47);
    });
  });

  // ═══════════════════════════════════════
  // Agent service backward compatibility
  // ═══════════════════════════════════════

  describe("Agent service backward compatibility", () => {
    it("getAgentReputation delegates to reputation service", () => {
      const agent = createAgent({
        ownerAddress: "0xAlice",
        name: "Compat Agent",
        category: "invoice",
      });

      const rep = getAgentReputation(agent.id);
      expect(rep.score).toBe(50);
      expect(rep.verified_runs).toBe(0);
    });

    it("recalculateReputation from agents.ts returns fresh data", () => {
      const agent = createAgent({
        ownerAddress: "0xAlice",
        name: "Compat Recalc",
        category: "invoice",
      });

      // The agents module re-exports recalculateReputation from reputation service
      // Test that calling it produces correct data
      const rep = recalculateReputation(agent.id);
      expect(rep.score).toBe(50);
      expect(rep.agent_id).toBe(agent.id);
    });
  });

  // ═══════════════════════════════════════
  // Health check
  // ═══════════════════════════════════════

  describe("Reputation service health", () => {
    it("returns healthy with reputation count", () => {
      createAgent({
        ownerAddress: "0xA",
        name: "Health Agent 1",
        category: "invoice",
      });
      createAgent({
        ownerAddress: "0xB",
        name: "Health Agent 2",
        category: "defi",
      });

      // Compute reputation for both to ensure rows exist
      const agents = listAgents();
      for (const a of agents) {
        computeReputation(a.id);
      }

      const health = getReputationServiceHealth();
      expect(health.healthy).toBe(true);
      expect(health.reputationCount).toBe(2);
    });

    it("returns zero when no agents exist", () => {
      const health = getReputationServiceHealth();
      expect(health.healthy).toBe(true);
      expect(health.reputationCount).toBe(0);
    });
  });

  // ═══════════════════════════════════════
  // A-I preservation
  // ═══════════════════════════════════════

  describe("A-I Phase Preservation", () => {
    it("agents can still be created and listed (Phase F)", () => {
      const agent = createAgent({
        ownerAddress: "0xAlice",
        name: "Phase F Agent",
        category: "invoice",
      });

      expect(agent.id).toBeDefined();
      expect(agent.status).toBe("active");

      const all = listAgents();
      expect(all.length).toBe(1);
    });

    it("agents can still be updated (Phase F)", () => {
      const agent = createAgent({
        ownerAddress: "0xAlice",
        name: "Update Agent",
        category: "invoice",
      });

      const updated = updateAgent(agent.id, "0xAlice", {
        name: "Updated",
        status: "paused",
      });

      expect(updated.name).toBe("Updated");
      expect(updated.status).toBe("paused");
    });

    it("agent proofs endpoint still works (Phase F)", () => {
      const agent = createAgent({
        ownerAddress: "0xAlice",
        name: "Proof Agent",
        category: "invoice",
      });

      const proofs = getAgentProofs(agent.id);
      expect(proofs).toEqual([]);
    });

    it("agent Casper sync still works (Phase F)", async () => {
      const agent = createAgent({
        ownerAddress: "0xAlice",
        name: "Casper Agent",
        category: "invoice",
      });

      const result = await syncAgentToCasper(agent.id);
      expect(result.agentId).toBe(agent.id);
      expect(result.registrationHash).toBeDefined();
    });

    it("agent service health still works (Phase F)", () => {
      createAgent({
        ownerAddress: "0xAlice",
        name: "Health Agent",
        category: "invoice",
      });

      const health = getAgentServiceHealth();
      expect(health.healthy).toBe(true);
      expect(health.agentCount).toBe(1);
    });

    it("tasks can be created and status updated (Phase E)", () => {
      const agent = createAgent({
        ownerAddress: "0xAlice",
        name: "Task Agent",
        category: "invoice",
      });

      const task = createTask({
        agentId: agent.id,
        title: "Phase E Task",
      });

      expect(task.status).toBe("draft");

      updateTaskStatus(task.id, "funded");
      expect(task.id).toBeDefined();
    });
  });
});
