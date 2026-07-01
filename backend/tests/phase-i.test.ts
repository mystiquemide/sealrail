// ────────────────────────────────────────
// Sealrail Backend — Phase I Tests
// Payment Split Engine
// Covers I1-I4: split calculation, proof dependency resolution, per-recipient unlock
// ────────────────────────────────────────

import { describe, it, expect, beforeEach, beforeAll, afterAll } from "vitest";
import { randomUUID, createHash } from "crypto";

import { getDb, closeDb, resetDb } from "../src/db.js";

// ── Payment service imports ──────────────
import {
  createPaymentIntent,
  getPayment,
  getPaymentWithRecipients,
  listPayments,
  updatePaymentStatus,
  calculatePaymentSplits,
  unlockPayment,
  claimRecipientShare,
  isValidPaymentTransition,
  isValidRecipientTransition,
  getPaymentServiceHealth,
} from "../src/services/payments.js";

// ── Task service imports ─────────────────
import {
  createTask,
  createTaskWithPayment,
  getTask,
  updateTaskStatus,
  runTaskVerification,
  verifyTaskProof,
  anchorTaskProof,
  unlockTaskPayment,
} from "../src/services/tasks.js";

// ── Split service imports ────────────────
import {
  validateRecipients,
  validateRecipientsOrThrow,
  resolveRecipientProofDependency,
  resolveAllRecipientProofDependencies,
  unlockAllSatisfiedRecipients,
  unlockRecipientIfProofSatisfied,
  getRecipientProofStatuses,
  getSplitServiceHealth,
} from "../src/services/splits.js";

// ── Agent service import ─────────────────
import { createAgent as registerAgent } from "../src/services/agents.js";

// Use in-memory database for tests
process.env.DATABASE_PATH = ":memory:";
closeDb();

// ── Helpers ──────────────────────────────

function createAgent(name: string, slug: string) {
  return registerAgent({
    ownerAddress: "0xOwner",
    name,
    slug,
    category: "invoice",
    pricingModel: "fixed",
    basePrice: 100,
    currency: "CSPR",
  });
}

function createVerifiedProof(params: {
  taskId: string;
  agentId: string;
  verifierId: string;
  workflowRunId?: string;
}): string {
  const db = getDb();
  const proofId = randomUUID();
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO proofs (id, task_id, workflow_run_id, agent_id, verifier_id,
      input_hash, output_hash, wasm_hash, attestation_hash, mode, status, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'tee_verification_mode', 'verified', ?)
  `).run(
    proofId,
    params.taskId,
    params.workflowRunId ?? null,
    params.agentId,
    params.verifierId,
    createHash("sha256").update(`input-${proofId}`).digest("hex"),
    createHash("sha256").update(`output-${proofId}`).digest("hex"),
    "wasm-hash-abc",
    createHash("sha256").update(`attest-${proofId}`).digest("hex"),
    now,
  );

  return proofId;
}

function createAnchoredProof(params: {
  taskId: string;
  agentId: string;
  verifierId: string;
}): string {
  const db = getDb();
  const proofId = randomUUID();
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO proofs (id, task_id, agent_id, verifier_id,
      input_hash, output_hash, wasm_hash, attestation_hash, casper_anchor_hash, mode, status, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'tee_verification_mode', 'anchored', ?)
  `).run(
    proofId,
    params.taskId,
    params.agentId,
    params.verifierId,
    createHash("sha256").update(`input-${proofId}`).digest("hex"),
    createHash("sha256").update(`output-${proofId}`).digest("hex"),
    "wasm-hash-abc",
    createHash("sha256").update(`attest-${proofId}`).digest("hex"),
    createHash("sha256").update(`anchor-${proofId}`).digest("hex"),
    now,
  );

  return proofId;
}

// ── Test Suite ───────────────────────────

describe("Phase I: Payment Split Engine", () => {

  beforeEach(() => {
    resetDb();
  });

  afterAll(() => {
    closeDb();
  });

  // ═══════════════════════════════════════
  // I1: Split Calculator — Validation
  // ═══════════════════════════════════════

  describe("I1: Split Calculator — Recipient Validation", () => {

    describe("validateRecipients", () => {
      it("passes for valid recipients with correct total bps", () => {
        const errors = validateRecipients([
          { address: "0xAgent", share_bps: 7000, role: "primary_agent" },
          { address: "0xVerifier", share_bps: 2000, role: "verifier" },
          { address: "0xPlatform", share_bps: 1000, role: "platform" },
        ]);

        expect(errors).toHaveLength(0);
      });

      it("rejects invalid role", () => {
        const errors = validateRecipients([
          { address: "0xBadRole", share_bps: 10000, role: "hacker" },
        ]);

        expect(errors.length).toBeGreaterThan(0);
        expect(errors[0].field).toBe("role");
        expect(errors[0].message).toContain("role must be one of");
      });

      it("rejects empty address", () => {
        const errors = validateRecipients([
          { address: "", share_bps: 10000, role: "primary_agent" },
        ]);

        expect(errors.length).toBeGreaterThan(0);
        expect(errors[0].field).toBe("address");
      });

      it("rejects whitespace-only address", () => {
        const errors = validateRecipients([
          { address: "   ", share_bps: 10000, role: "primary_agent" },
        ]);

        expect(errors.length).toBeGreaterThan(0);
        expect(errors[0].field).toBe("address");
      });

      it("rejects zero share_bps", () => {
        const errors = validateRecipients([
          { address: "0xZero", share_bps: 0, role: "primary_agent" },
        ]);

        expect(errors.length).toBeGreaterThan(0);
      });

      it("rejects share_bps > 10000", () => {
        const errors = validateRecipients([
          { address: "0xGreedy", share_bps: 15000, role: "primary_agent" },
        ]);

        expect(errors.length).toBeGreaterThan(0);
      });

      it("rejects non-integer share_bps", () => {
        const errors = validateRecipients([
          { address: "0xFloat", share_bps: 50.5, role: "primary_agent" },
        ]);

        expect(errors.length).toBeGreaterThan(0);
      });

      it("rejects total bps not equal to 10000", () => {
        const errors = validateRecipients([
          { address: "0xHalf", share_bps: 5000, role: "primary_agent" },
        ]);

        expect(errors.length).toBeGreaterThan(0);
        expect(errors[0].field).toBe("total_bps");
        expect(errors[0].message).toContain("10000");
      });

      it("rejects total bps over 10000", () => {
        const errors = validateRecipients([
          { address: "0xA", share_bps: 7000, role: "primary_agent" },
          { address: "0xB", share_bps: 4000, role: "verifier" },
        ]);

        expect(errors.length).toBeGreaterThan(0);
        expect(errors[0].field).toBe("total_bps");
      });

      it("accepts all four valid roles", () => {
        const errors = validateRecipients([
          { address: "0xPrimary", share_bps: 4000, role: "primary_agent" },
          { address: "0xStep", share_bps: 3000, role: "workflow_step" },
          { address: "0xVerifier", share_bps: 2000, role: "verifier" },
          { address: "0xPlatform", share_bps: 1000, role: "platform" },
        ]);

        expect(errors).toHaveLength(0);
      });
    });

    describe("validateRecipientsOrThrow", () => {
      it("does not throw for valid recipients", () => {
        expect(() =>
          validateRecipientsOrThrow([
            { address: "0xGood", share_bps: 10000, role: "primary_agent" },
          ])
        ).not.toThrow();
      });

      it("throws on invalid role", () => {
        expect(() =>
          validateRecipientsOrThrow([
            { address: "0xBad", share_bps: 10000, role: "invalid_role" },
          ])
        ).toThrow("INVALID_RECIPIENTS");
      });

      it("throws on empty address", () => {
        expect(() =>
          validateRecipientsOrThrow([
            { address: "", share_bps: 10000, role: "primary_agent" },
          ])
        ).toThrow("INVALID_RECIPIENTS");
      });
    });

    describe("calculatePaymentSplits with Phase I validation", () => {
      it("calculates valid splits and returns split hash", () => {
        const payment = createPaymentIntent({
          buyerAddress: "0xBuyer",
          totalAmount: 1000,
          currency: "CSPR",
        });

        validateRecipientsOrThrow([
          { address: "0xAgent", share_bps: 7000, role: "primary_agent" },
          { address: "0xVerif", share_bps: 3000, role: "verifier" },
        ]);

        const result = calculatePaymentSplits(payment.id, [
          { address: "0xAgent", share_bps: 7000, role: "primary_agent", agent_id: "ag-1" },
          { address: "0xVerif", share_bps: 3000, role: "verifier", verifier_id: "vf-1" },
        ]);

        expect(result.payment.status).toBe("locked");
        expect(result.splitHash).toHaveLength(64);
        expect(result.payment.recipients).toHaveLength(2);
      });

      it("rejects bps mismatch via the service", () => {
        const payment = createPaymentIntent({
          buyerAddress: "0xBuyer",
          totalAmount: 100,
          currency: "CSPR",
        });

        // This will fail at calculatePaymentSplits level (not validation level)
        expect(() =>
          calculatePaymentSplits(payment.id, [
            { address: "0xAgent", share_bps: 5000, role: "primary_agent" },
          ])
        ).toThrow("INVALID_SPLITS");
      });
    });
  });

  // ═══════════════════════════════════════
  // I2: Proof Dependency Resolution
  // ═══════════════════════════════════════

  describe("I2: Proof Dependency Resolution", () => {

    describe("resolveRecipientProofDependency", () => {
      it("returns satisfied=false when no proofs exist", () => {
        const agent = createAgent("Dep Agent", "dep-agent");
        const { task, payment } = createTaskWithPayment({
          buyerAddress: "0xBuyer",
          agentId: agent.id,
          totalAmount: 1000,
          currency: "CSPR",
        });

        calculatePaymentSplits(payment.id, [
          { address: "0xAgent", share_bps: 7000, role: "primary_agent", agent_id: agent.id, proof_required: true },
          { address: "0xPlatform", share_bps: 3000, role: "platform", proof_required: false },
        ]);

        const fullPayment = getPaymentWithRecipients(payment.id);
        const agentRecipient = fullPayment!.recipients.find((r) => r.role === "primary_agent")!;

        const result = resolveRecipientProofDependency(payment.id, agentRecipient.id);
        expect(result.satisfied).toBe(false);
        expect(result.proofIds).toHaveLength(0);
        expect(result.message).toContain("No verified/anchored proofs");
      });

      it("returns satisfied=true when verified proof matches", () => {
        const agent = createAgent("Proof Agent", "proof-agent");
        const { task, payment } = createTaskWithPayment({
          buyerAddress: "0xBuyer",
          agentId: agent.id,
          totalAmount: 1000,
          currency: "CSPR",
        });

        // Create a verified proof for this task + agent
        createVerifiedProof({
          taskId: task.id,
          agentId: agent.id,
          verifierId: "vf-proof",
        });

        calculatePaymentSplits(payment.id, [
          { address: "0xAgent", share_bps: 7000, role: "primary_agent", agent_id: agent.id, proof_required: true },
          { address: "0xPlatform", share_bps: 3000, role: "platform", proof_required: false },
        ]);

        const fullPayment = getPaymentWithRecipients(payment.id);
        const agentRecipient = fullPayment!.recipients.find((r) => r.role === "primary_agent")!;

        const result = resolveRecipientProofDependency(payment.id, agentRecipient.id);
        expect(result.satisfied).toBe(true);
        expect(result.proofIds.length).toBeGreaterThan(0);
      });

      it("returns satisfied=true when anchored proof matches", () => {
        const agent = createAgent("Anchored Agent", "anchored-agent");
        const { task, payment } = createTaskWithPayment({
          buyerAddress: "0xBuyer",
          agentId: agent.id,
          totalAmount: 1000,
          currency: "CSPR",
        });

        createAnchoredProof({
          taskId: task.id,
          agentId: agent.id,
          verifierId: "vf-anchored",
        });

        calculatePaymentSplits(payment.id, [
          { address: "0xAgent", share_bps: 10000, role: "primary_agent", agent_id: agent.id, proof_required: true },
        ]);

        const fullPayment = getPaymentWithRecipients(payment.id);
        const agentRecipient = fullPayment!.recipients[0];

        const result = resolveRecipientProofDependency(payment.id, agentRecipient.id);
        expect(result.satisfied).toBe(true);
      });

      it("returns satisfied=false for pending proof (not verified/anchored)", () => {
        const agent = createAgent("Pending Agent", "pending-agent");
        const { task, payment } = createTaskWithPayment({
          buyerAddress: "0xBuyer",
          agentId: agent.id,
          totalAmount: 1000,
          currency: "CSPR",
        });

        // Create a pending proof (not satisfied)
        const db = getDb();
        const proofId = randomUUID();
        db.prepare(`
          INSERT INTO proofs (id, task_id, agent_id, verifier_id,
            input_hash, output_hash, wasm_hash, attestation_hash, mode, status, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'tee_verification_mode', 'pending', ?)
        `).run(
          proofId, task.id, agent.id, "vf-pending",
          createHash("sha256").update("input").digest("hex"),
          createHash("sha256").update("output").digest("hex"),
          "wasm-hash", createHash("sha256").update("attest").digest("hex"),
          new Date().toISOString(),
        );

        calculatePaymentSplits(payment.id, [
          { address: "0xAgent", share_bps: 10000, role: "primary_agent", agent_id: agent.id, proof_required: true },
        ]);

        const fullPayment = getPaymentWithRecipients(payment.id);
        const agentRecipient = fullPayment!.recipients[0];

        const result = resolveRecipientProofDependency(payment.id, agentRecipient.id);
        expect(result.satisfied).toBe(false);
      });

      it("returns satisfied=true when proof_required=false (no proof needed)", () => {
        const { payment } = createTaskWithPayment({
          buyerAddress: "0xBuyer",
          agentId: "agent-no-proof-needed",
          totalAmount: 500,
          currency: "CSPR",
        });

        calculatePaymentSplits(payment.id, [
          { address: "0xPlatform", share_bps: 10000, role: "platform", proof_required: false },
        ]);

        const fullPayment = getPaymentWithRecipients(payment.id);
        const platformRecipient = fullPayment!.recipients[0];

        const result = resolveRecipientProofDependency(payment.id, platformRecipient.id);
        expect(result.satisfied).toBe(true);
        expect(result.message).toContain("No proof required");
      });

      it("throws for nonexistent payment", () => {
        expect(() =>
          resolveRecipientProofDependency("no-such-payment", "any-recipient")
        ).toThrow("PAYMENT_NOT_FOUND");
      });

      it("throws for nonexistent recipient", () => {
        const { payment } = createTaskWithPayment({
          buyerAddress: "0xBuyer",
          agentId: "agent-test",
          totalAmount: 100,
          currency: "CSPR",
        });

        expect(() =>
          resolveRecipientProofDependency(payment.id, "no-such-recipient")
        ).toThrow("RECIPIENT_NOT_FOUND");
      });

      it("matches proof by verifier_id", () => {
        const agent = createAgent("VerifMatch Agent", "verif-match");
        const { task, payment } = createTaskWithPayment({
          buyerAddress: "0xBuyer",
          agentId: agent.id,
          totalAmount: 1000,
          currency: "CSPR",
        });

        // Create verified proof matching verifier_id
        createVerifiedProof({
          taskId: task.id,
          agentId: "some-other-agent",
          verifierId: "vf-target",
        });

        calculatePaymentSplits(payment.id, [
          { address: "0xVerifier", share_bps: 10000, role: "verifier", verifier_id: "vf-target", proof_required: true },
        ]);

        const fullPayment = getPaymentWithRecipients(payment.id);
        const verifRecipient = fullPayment!.recipients[0];

        const result = resolveRecipientProofDependency(payment.id, verifRecipient.id);
        expect(result.satisfied).toBe(true);
      });
    });

    describe("resolveAllRecipientProofDependencies", () => {
      it("returns status for all recipients", () => {
        const agent = createAgent("AllDep Agent", "alldep-agent");
        const { task, payment } = createTaskWithPayment({
          buyerAddress: "0xBuyer",
          agentId: agent.id,
          totalAmount: 1000,
          currency: "CSPR",
        });

        // Create proof for the agent recipient
        createVerifiedProof({
          taskId: task.id,
          agentId: agent.id,
          verifierId: "vf-all",
        });

        calculatePaymentSplits(payment.id, [
          { address: "0xAgent", share_bps: 7000, role: "primary_agent", agent_id: agent.id, proof_required: true },
          { address: "0xPlatform", share_bps: 3000, role: "platform", proof_required: false },
        ]);

        const results = resolveAllRecipientProofDependencies(payment.id);
        expect(results.size).toBe(2);

        const entries = Array.from(results.entries());
        const satisfied = entries.filter(([, r]) => r.satisfied);
        const unsatisfied = entries.filter(([, r]) => !r.satisfied);

        // Platform has proof_required=false so always satisfied
        // Agent has matching proof so satisfied
        expect(satisfied.length).toBe(2);
      });
    });
  });

  // ═══════════════════════════════════════
  // I3: Per-Recipient Unlock State
  // ═══════════════════════════════════════

  describe("I3: Per-Recipient Unlock", () => {

    describe("unlockAllSatisfiedRecipients", () => {
      it("full unlock: all recipients have satisfied proofs", () => {
        const agent = createAgent("Full Agent", "full-agent");
        const { task, payment } = createTaskWithPayment({
          buyerAddress: "0xBuyer",
          agentId: agent.id,
          totalAmount: 2000,
          currency: "CSPR",
        });

        // Create verified proof for the agent
        createVerifiedProof({
          taskId: task.id,
          agentId: agent.id,
          verifierId: "vf-full",
        });

        calculatePaymentSplits(payment.id, [
          { address: "0xAgent", share_bps: 8000, role: "primary_agent", agent_id: agent.id, proof_required: true },
          { address: "0xPlatform", share_bps: 2000, role: "platform", proof_required: false },
        ]);

        const result = unlockAllSatisfiedRecipients(payment.id);

        expect(result.paymentStatus).toBe("unlockable");
        expect(result.unlockedCount).toBe(2);
        expect(result.stillLockedCount).toBe(0);
        expect(result.message).toContain("Full unlock");

        // Verify payment state
        const updated = getPayment(payment.id);
        expect(updated!.status).toBe("unlockable");
      });

      it("partial unlock: some recipients have proofs, others don't", () => {
        const agent = createAgent("Partial Agent", "partial-agent");
        const { task, payment } = createTaskWithPayment({
          buyerAddress: "0xBuyer",
          agentId: agent.id,
          totalAmount: 2000,
          currency: "CSPR",
        });

        // Create proof ONLY for the agent, NOT for the verifier
        createVerifiedProof({
          taskId: task.id,
          agentId: agent.id,
          verifierId: "vf-agent-only",
        });

        calculatePaymentSplits(payment.id, [
          { address: "0xAgent", share_bps: 6000, role: "primary_agent", agent_id: agent.id, proof_required: true },
          { address: "0xVerifier", share_bps: 3000, role: "verifier", verifier_id: "vf-missing", proof_required: true },
          { address: "0xPlatform", share_bps: 1000, role: "platform", proof_required: false },
        ]);

        const result = unlockAllSatisfiedRecipients(payment.id);

        expect(result.paymentStatus).toBe("locked"); // still locked — partial
        expect(result.unlockedCount).toBe(2); // agent + platform (platform has proof_required=false)
        expect(result.stillLockedCount).toBe(1); // verifier still locked
        expect(result.message).toContain("Partial unlock");

        // Verify recipient states
        const fullPayment = getPaymentWithRecipients(payment.id);
        const agentRec = fullPayment!.recipients.find((r) => r.role === "primary_agent")!;
        const verifRec = fullPayment!.recipients.find((r) => r.role === "verifier")!;
        const platRec = fullPayment!.recipients.find((r) => r.role === "platform")!;

        expect(agentRec.status).toBe("unlockable");
        expect(verifRec.status).toBe("locked");
        expect(platRec.status).toBe("unlockable"); // proof_required=false
      });

      it("no unlockable recipients throws error", () => {
        const { task, payment } = createTaskWithPayment({
          buyerAddress: "0xBuyer",
          agentId: "no-proof-agent",
          totalAmount: 1000,
          currency: "CSPR",
        });

        // No proofs created — but all recipients require proof
        calculatePaymentSplits(payment.id, [
          { address: "0xAgent", share_bps: 7000, role: "primary_agent", agent_id: "ag-none", proof_required: true },
          { address: "0xVerifier", share_bps: 3000, role: "verifier", verifier_id: "vf-none", proof_required: true },
        ]);

        expect(() =>
          unlockAllSatisfiedRecipients(payment.id)
        ).toThrow("NO_UNLOCKABLE_RECIPIENTS");
      });

      it("throws if payment has no splits", () => {
        const payment = createPaymentIntent({
          buyerAddress: "0xBuyer",
          totalAmount: 100,
          currency: "CSPR",
        });

        expect(() =>
          unlockAllSatisfiedRecipients(payment.id)
        ).toThrow("INVALID_STATE");
      });

      it("throws for nonexistent payment", () => {
        expect(() =>
          unlockAllSatisfiedRecipients("no-such-payment")
        ).toThrow("PAYMENT_NOT_FOUND");
      });

      it("can unlock remaining recipients after proofs are created", () => {
        const agent = createAgent("TwoStep Agent", "twostep-agent");
        const { task, payment } = createTaskWithPayment({
          buyerAddress: "0xBuyer",
          agentId: agent.id,
          totalAmount: 2000,
          currency: "CSPR",
        });

        // Create proof for agent only initially
        createVerifiedProof({
          taskId: task.id,
          agentId: agent.id,
          verifierId: "vf-step1",
        });

        calculatePaymentSplits(payment.id, [
          { address: "0xAgent", share_bps: 6000, role: "primary_agent", agent_id: agent.id, proof_required: true },
          { address: "0xVerifier", share_bps: 4000, role: "verifier", verifier_id: "vf-step2", proof_required: true },
        ]);

        // First unlock: only agent unlocks
        const result1 = unlockAllSatisfiedRecipients(payment.id);
        expect(result1.unlockedCount).toBe(1);
        expect(result1.stillLockedCount).toBe(1);

        // Now create proof for verifier
        createVerifiedProof({
          taskId: task.id,
          agentId: "any-agent",
          verifierId: "vf-step2",
        });

        // Second unlock: verifier unlocks + payment becomes fully unlockable
        const result2 = unlockAllSatisfiedRecipients(payment.id);
        expect(result2.paymentStatus).toBe("unlockable");
        expect(result2.unlockedCount).toBe(1); // just the verifier this time (agent already unlocked)

        const finalPayment = getPayment(payment.id);
        expect(finalPayment!.status).toBe("unlockable");
      });
    });

    describe("unlockRecipientIfProofSatisfied", () => {
      it("unlocks a single recipient with satisfied proof", () => {
        const agent = createAgent("Single Agent", "single-agent");
        const { task, payment } = createTaskWithPayment({
          buyerAddress: "0xBuyer",
          agentId: agent.id,
          totalAmount: 1000,
          currency: "CSPR",
        });

        createVerifiedProof({
          taskId: task.id,
          agentId: agent.id,
          verifierId: "vf-single",
        });

        calculatePaymentSplits(payment.id, [
          { address: "0xAgent", share_bps: 10000, role: "primary_agent", agent_id: agent.id, proof_required: true },
        ]);

        const fullPayment = getPaymentWithRecipients(payment.id);
        const recipient = fullPayment!.recipients[0];

        const result = unlockRecipientIfProofSatisfied(payment.id, recipient.id);
        expect(result.unlocked).toBe(true);
        expect(result.proofSatisfied).toBe(true);
        expect(result.status).toBe("unlockable");
      });

      it("does not unlock recipient without satisfied proof", () => {
        const agent = createAgent("Blocked Agent", "blocked-agent");
        const { task, payment } = createTaskWithPayment({
          buyerAddress: "0xBuyer",
          agentId: agent.id,
          totalAmount: 1000,
          currency: "CSPR",
        });

        // No proof created — dependency not satisfied

        calculatePaymentSplits(payment.id, [
          { address: "0xAgent", share_bps: 10000, role: "primary_agent", agent_id: agent.id, proof_required: true },
        ]);

        const fullPayment = getPaymentWithRecipients(payment.id);
        const recipient = fullPayment!.recipients[0];

        const result = unlockRecipientIfProofSatisfied(payment.id, recipient.id);
        expect(result.unlocked).toBe(false);
        expect(result.proofSatisfied).toBe(false);
        expect(result.status).toBe("locked");
      });
    });
  });

  // ═══════════════════════════════════════
  // I4: Split Routes + Claim Enforcement
  // ═══════════════════════════════════════

  describe("I4: Claim Enforcement", () => {

    describe("double-claim rejection", () => {
      it("claimRecipientShare rejects double-claim (Phase E existing behavior)", () => {
        const { payment } = createTaskWithPayment({
          buyerAddress: "0xBuyer",
          agentId: "claim-test-agent",
          totalAmount: 1000,
          currency: "CSPR",
        });

        calculatePaymentSplits(payment.id, [
          { address: "0xAgent", share_bps: 10000, role: "primary_agent", proof_required: false },
        ]);

        // Phase E: bulk unlock
        unlockPayment(payment.id);

        const fullPayment = getPaymentWithRecipients(payment.id);
        const recipient = fullPayment!.recipients[0];

        // First claim succeeds
        const result1 = claimRecipientShare(payment.id, recipient.id);
        expect(result1.recipient.status).toBe("paid");

        // Second claim should throw
        expect(() =>
          claimRecipientShare(payment.id, recipient.id)
        ).toThrow("INVALID_STATE");
      });
    });

    describe("wrong recipient rejection", () => {
      it("claimRecipientShare rejects nonexistent recipient_id", () => {
        const { payment } = createTaskWithPayment({
          buyerAddress: "0xBuyer",
          agentId: "wrong-recip-test",
          totalAmount: 500,
          currency: "CSPR",
        });

        calculatePaymentSplits(payment.id, [
          { address: "0xAgent", share_bps: 10000, role: "primary_agent", proof_required: false },
        ]);
        unlockPayment(payment.id);

        expect(() =>
          claimRecipientShare(payment.id, "no-such-recipient")
        ).toThrow("RECIPIENT_NOT_FOUND");
      });
    });
  });

  // ═══════════════════════════════════════
  // Phase I: Split Status Retrieval
  // ═══════════════════════════════════════

  describe("getRecipientProofStatuses", () => {
    it("returns per-recipient proof dependency status", () => {
      const agent = createAgent("Status Agent", "status-agent");
      const { task, payment } = createTaskWithPayment({
        buyerAddress: "0xBuyer",
        agentId: agent.id,
        totalAmount: 1000,
        currency: "CSPR",
      });

      createVerifiedProof({
        taskId: task.id,
        agentId: agent.id,
        verifierId: "vf-status",
      });

      calculatePaymentSplits(payment.id, [
        { address: "0xAgent", share_bps: 7000, role: "primary_agent", agent_id: agent.id, proof_required: true },
        { address: "0xPlatform", share_bps: 3000, role: "platform", proof_required: false },
      ]);

      const statuses = getRecipientProofStatuses(payment.id);

      expect(statuses.paymentId).toBe(payment.id);
      expect(statuses.paymentStatus).toBe("locked");
      expect(statuses.recipients).toHaveLength(2);

      const agentStatus = statuses.recipients.find((r) => r.role === "primary_agent")!;
      expect(agentStatus.proofSatisfied).toBe(true);
      expect(agentStatus.proofIds.length).toBeGreaterThan(0);

      const platStatus = statuses.recipients.find((r) => r.role === "platform")!;
      expect(platStatus.proofSatisfied).toBe(true); // proof_required=false
    });

    it("throws for nonexistent payment", () => {
      expect(() =>
        getRecipientProofStatuses("no-such-payment")
      ).toThrow("PAYMENT_NOT_FOUND");
    });
  });

  // ═══════════════════════════════════════
  // Phase A-H Behavior Preservation
  // ═══════════════════════════════════════

  describe("Phase A-H Behavior Preservation", () => {

    it("Phase E createPaymentIntent still works", () => {
      const payment = createPaymentIntent({
        buyerAddress: "0xPreserve",
        totalAmount: 500,
        currency: "CSPR",
      });

      expect(payment.status).toBe("intent_created");
      expect(payment.id).toBeDefined();
    });

    it("Phase E unlockPayment still works (bulk unlock)", () => {
      const { payment } = createTaskWithPayment({
        buyerAddress: "0xBuyer",
        agentId: "bulk-test-agent",
        totalAmount: 1000,
        currency: "CSPR",
      });

      calculatePaymentSplits(payment.id, [
        { address: "0xAgent", share_bps: 10000, role: "primary_agent", proof_required: false },
      ]);

      const result = unlockPayment(payment.id);
      expect(result.payment.status).toBe("unlockable");
    });

    it("Phase E claimRecipientShare still works", () => {
      const { payment } = createTaskWithPayment({
        buyerAddress: "0xBuyer",
        agentId: "claim-test",
        totalAmount: 1000,
        currency: "CSPR",
      });

      calculatePaymentSplits(payment.id, [
        { address: "0xAgent", share_bps: 10000, role: "primary_agent", proof_required: false },
      ]);
      unlockPayment(payment.id);

      const fullPayment = getPaymentWithRecipients(payment.id);
      const result = claimRecipientShare(payment.id, fullPayment!.recipients[0].id);

      expect(result.recipient.status).toBe("paid");
    });

    it("Phase E state machine transitions still enforced", () => {
      const payment = createPaymentIntent({
        buyerAddress: "0xSM",
        totalAmount: 100,
        currency: "CSPR",
      });

      expect(isValidPaymentTransition("intent_created", "locked")).toBe(true);
      expect(isValidPaymentTransition("intent_created", "paid")).toBe(false);
    });

    it("Phase E recipient transitions still enforced", () => {
      expect(isValidRecipientTransition("locked", "unlockable")).toBe(true);
      expect(isValidRecipientTransition("locked", "paid")).toBe(false);
    });
  });

  // ═══════════════════════════════════════
  // Full Workflow: Split → Proof → Unlock → Claim
  // ═══════════════════════════════════════

  describe("Full Phase I Workflow", () => {

    it("end-to-end: create payment, splits, proof, unlock, claim", () => {
      const agent = createAgent("E2E Agent", "e2e-agent");
      const { task, payment } = createTaskWithPayment({
        buyerAddress: "0xE2E",
        agentId: agent.id,
        totalAmount: 2000,
        currency: "CSPR",
      });

      // 1. Calculate splits with validation
      validateRecipientsOrThrow([
        { address: "0xPrimary", share_bps: 7000, role: "primary_agent", agent_id: agent.id, proof_required: true },
        { address: "0xVerifier", share_bps: 2000, role: "verifier", verifier_id: "vf-e2e", proof_required: true },
        { address: "0xPlatform", share_bps: 1000, role: "platform", proof_required: false },
      ]);

      calculatePaymentSplits(payment.id, [
        { address: "0xPrimary", share_bps: 7000, role: "primary_agent", agent_id: agent.id, proof_required: true },
        { address: "0xVerifier", share_bps: 2000, role: "verifier", verifier_id: "vf-e2e", proof_required: true },
        { address: "0xPlatform", share_bps: 1000, role: "platform", proof_required: false },
      ]);

      let fullPayment = getPaymentWithRecipients(payment.id);
      expect(fullPayment!.status).toBe("locked");
      expect(fullPayment!.recipients).toHaveLength(3);

      // 2. Attempt unlock before proofs — should throw (no recipients with satisfied proofs)
      // All 3 recipients require proof, so none can unlock
      calculatePaymentSplits(payment.id, [
        { address: "0xPrimary", share_bps: 7000, role: "primary_agent", agent_id: agent.id, proof_required: true },
        { address: "0xVerifier", share_bps: 2000, role: "verifier", verifier_id: "vf-e2e", proof_required: true },
        { address: "0xPlatform", share_bps: 1000, role: "platform", proof_required: true },
      ]);

      expect(() =>
        unlockAllSatisfiedRecipients(payment.id)
      ).toThrow("NO_UNLOCKABLE_RECIPIENTS");

      // Recalculate splits with platform not requiring proof (for partial unlock test)
      // Use distinct verifier IDs so the agent proof only matches the agent
      calculatePaymentSplits(payment.id, [
        { address: "0xPrimary", share_bps: 7000, role: "primary_agent", agent_id: agent.id, proof_required: true },
        { address: "0xVerifier", share_bps: 2000, role: "verifier", verifier_id: "vf-e2e-distinct", proof_required: true },
        { address: "0xPlatform", share_bps: 1000, role: "platform", proof_required: false },
      ]);

      // 3. Create proof for primary agent only (matches agent.id but not vf-e2e-distinct)
      createVerifiedProof({
        taskId: task.id,
        agentId: agent.id,
        verifierId: "vf-agent-proof",
      });

      // 4. Partial unlock: agent + platform unlockable, verifier still locked
      const unlock1 = unlockAllSatisfiedRecipients(payment.id);
      expect(unlock1.unlockedCount).toBe(2);
      expect(unlock1.stillLockedCount).toBe(1);
      expect(unlock1.paymentStatus).toBe("locked");

      // 5. Create proof for verifier (matching vf-e2e-distinct)
      createVerifiedProof({
        taskId: task.id,
        agentId: "any",
        verifierId: "vf-e2e-distinct",
      });

      // 6. Full unlock now
      const unlock2 = unlockAllSatisfiedRecipients(payment.id);
      expect(unlock2.paymentStatus).toBe("unlockable");
      expect(unlock2.unlockedCount).toBe(1); // just the verifier this round

      fullPayment = getPaymentWithRecipients(payment.id);
      const allUnlockable = fullPayment!.recipients.every((r) => r.status === "unlockable");
      expect(allUnlockable).toBe(true);

      // 7. Claim each share
      for (const recipient of fullPayment!.recipients) {
        const claimResult = claimRecipientShare(payment.id, recipient.id);
        expect(claimResult.recipient.status).toBe("paid");
      }

      // 8. Payment should now be paid
      const finalPayment = getPayment(payment.id);
      expect(finalPayment!.status).toBe("paid");
    });

    it("preserves Phase A-H payment service health", () => {
      const health = getPaymentServiceHealth();
      expect(health.healthy).toBe(true);
      expect(typeof health.paymentCount).toBe("number");
    });

    it("split service health returns expected", () => {
      const health = getSplitServiceHealth();
      expect(health.healthy).toBe(true);
      expect(health.validRoles).toContain("primary_agent");
      expect(health.satisfiedProofStatuses).toContain("verified");
    });
  });
});
