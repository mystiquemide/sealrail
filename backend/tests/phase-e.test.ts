// ────────────────────────────────────────
// Sealrail Backend - Phase E Tests
// Task and payment state machine
// Covers E1-E5: services, routes, state enforcement
// ────────────────────────────────────────

import { describe, it, expect, beforeEach, beforeAll, afterAll } from "vitest";
import { randomUUID, createHash } from "crypto";

import { getDb, closeDb, resetDb } from "../src/db.js";

// ── Task service imports ─────────────────
import {
  createTask,
  createTaskWithPayment,
  getTask,
  getTaskWithTrail,
  updateTaskStatus,
  listTasks,
  isValidTaskTransition,
  getPaymentById,
  anchorTaskProof,
  runTaskVerification,
  verifyTaskProof,
  unlockTaskPayment,
  getTaskServiceHealth,
} from "../src/services/tasks.js";

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

import type { TaskStatus, PaymentStatus } from "../src/types.js";

// Use a test-specific file database to avoid shared-memory conflicts with other test suites
process.env.DATABASE_PATH = ":memory:";
// Force reset the singleton so this test file gets its own connection
closeDb();

// ── Test Suite ───────────────────────────

describe("Phase E: Task and Payment State Machine", () => {

  beforeEach(() => {
    resetDb();
  });

  afterAll(() => {
    closeDb();
  });

  // ═══════════════════════════════════════
  // E1: Task Service
  // ═══════════════════════════════════════

  describe("E1: Task Service - CRUD + State Transitions", () => {

    describe("createTask", () => {
      it("creates a task with default status 'draft'", () => {
        const task = createTask({ agentId: "agent-e1-001" });

        expect(task.id).toBeDefined();
        expect(task.agent_id).toBe("agent-e1-001");
        expect(task.status).toBe("draft");
        expect(task.title).toBe("Untitled Task");
        expect(task.task_type).toBe("invoice_risk");
        expect(task.payment_id).toBeNull();
      });

      it("creates a task with all custom fields", () => {
        const task = createTask({
          agentId: "custom-agent",
          buyerAddress: "0xBuyer123",
          title: "Custom Audit",
          taskType: "defi",
          input: { audit_type: "full", chains: ["Casper"] },
          paymentId: "pay-001",
        });

        expect(task.buyer_address).toBe("0xBuyer123");
        expect(task.title).toBe("Custom Audit");
        expect(task.task_type).toBe("defi");
        expect(task.input).toEqual({ audit_type: "full", chains: ["Casper"] });
        expect(task.payment_id).toBe("pay-001");
      });
    });

    describe("createTaskWithPayment", () => {
      it("creates a payment-backed task in 'funded' state", () => {
        const { task, payment } = createTaskWithPayment({
          buyerAddress: "0xBuyerFunded",
          agentId: "agent-funded",
          title: "Funded Task",
          totalAmount: 1000,
          currency: "CSPR",
        });

        expect(task.status).toBe("funded");
        expect(task.payment_id).toBe(payment.id);
        expect(payment.status).toBe("intent_created");
        expect(payment.total_amount).toBe(1000);
        expect(payment.currency).toBe("CSPR");
        expect(payment.buyer_address).toBe("0xBuyerFunded");
      });

      it("links task and payment bidirectionally", () => {
        const { task, payment } = createTaskWithPayment({
          buyerAddress: "0xLinkTest",
          agentId: "agent-link",
          totalAmount: 500,
          currency: "USD",
        });

        // Task references payment
        expect(task.payment_id).toBe(payment.id);

        // Payment references task
        expect(payment.task_id).toBe(task.id);

        // Can fetch both independently
        const fetchedTask = getTask(task.id);
        const fetchedPayment = getPayment(payment.id);
        expect(fetchedTask).not.toBeNull();
        expect(fetchedPayment).not.toBeNull();
      });

      it("task amount and currency match payment", () => {
        const { task, payment } = createTaskWithPayment({
          buyerAddress: "0xAmountCheck",
          agentId: "agent-amount",
          totalAmount: 7500,
          currency: "CSPR",
        });

        const fullPayment = getPayment(payment.id);
        expect(fullPayment!.total_amount).toBe(7500);
        expect(fullPayment!.currency).toBe("CSPR");
      });
    });

    describe("getTask / getTaskWithTrail", () => {
      it("returns null for non-existent task", () => {
        expect(getTask("non-existent")).toBeNull();
      });

      it("returns created task with all fields", () => {
        const created = createTask({
          agentId: "agent-fields",
          buyerAddress: "0xFields",
          title: "Fields Task",
          taskType: "compliance",
          input: { data: "test" },
        });

        const found = getTask(created.id);
        expect(found).not.toBeNull();
        expect(found!.id).toBe(created.id);
        expect(found!.agent_id).toBe("agent-fields");
        expect(found!.buyer_address).toBe("0xFields");
        expect(found!.task_type).toBe("compliance");
        expect(found!.input).toEqual({ data: "test" });
        expect(found!.proof_ids).toEqual([]);
      });

      it("getTaskWithTrail returns task + payment + proofs", () => {
        const { task, payment } = createTaskWithPayment({
          buyerAddress: "0xTrail",
          agentId: "agent-trail",
          totalAmount: 200,
          currency: "USD",
        });

        const trail = getTaskWithTrail(task.id);
        expect(trail.task).not.toBeNull();
        expect(trail.payment).not.toBeNull();
        expect(trail.payment!.id).toBe(payment.id);
        expect(trail.proofs).toEqual([]);
      });
    });

    describe("listTasks", () => {
      it("lists all tasks", () => {
        createTask({ agentId: "a1" });
        createTask({ agentId: "a2" });
        createTask({ agentId: "a3" });

        const tasks = listTasks();
        expect(tasks.length).toBe(3);
      });

      it("filters by status", () => {
        const t1 = createTask({ agentId: "a1" });
        updateTaskStatus(t1.id, "funded");
        createTask({ agentId: "a2" });

        const drafts = listTasks("draft");
        expect(drafts.length).toBe(1);
        expect(drafts[0].status).toBe("draft");

        const funded = listTasks("funded");
        expect(funded.length).toBe(1);
        expect(funded[0].status).toBe("funded");
      });
    });
  });

  // ═══════════════════════════════════════
  // E3: State Machine Enforcement
  // ═══════════════════════════════════════

  describe("E3: State Machine Enforcement", () => {

    describe("Task State Transitions", () => {
      it("draft → funded is valid", () => {
        expect(isValidTaskTransition("draft", "funded")).toBe(true);
      });

      it("draft → running is NOT valid (must go through funded)", () => {
        expect(isValidTaskTransition("draft", "running")).toBe(false);
      });

      it("funded → running is valid", () => {
        expect(isValidTaskTransition("funded", "running")).toBe(true);
      });

      it("running → proof_pending is valid", () => {
        expect(isValidTaskTransition("running", "proof_pending")).toBe(true);
      });

      it("proof_pending → proof_verified is valid", () => {
        expect(isValidTaskTransition("proof_pending", "proof_verified")).toBe(true);
      });

      it("proof_verified → anchored is valid", () => {
        expect(isValidTaskTransition("proof_verified", "anchored")).toBe(true);
      });

      it("anchored → payable is valid", () => {
        expect(isValidTaskTransition("anchored", "payable")).toBe(true);
      });

      it("payable → paid is valid", () => {
        expect(isValidTaskTransition("payable", "paid")).toBe(true);
      });

      it("draft → paid is NOT valid (skips all steps)", () => {
        expect(isValidTaskTransition("draft", "paid")).toBe(false);
      });

      it("any status → blocked is valid", () => {
        expect(isValidTaskTransition("draft", "blocked")).toBe(true);
        expect(isValidTaskTransition("funded", "blocked")).toBe(true);
        expect(isValidTaskTransition("running", "blocked")).toBe(true);
        expect(isValidTaskTransition("proof_verified", "blocked")).toBe(true);
      });

      it("any status → failed is valid", () => {
        expect(isValidTaskTransition("draft", "failed")).toBe(true);
        expect(isValidTaskTransition("running", "failed")).toBe(true);
        expect(isValidTaskTransition("anchored", "failed")).toBe(true);
      });

      it("blocked → draft is valid (reset)", () => {
        expect(isValidTaskTransition("blocked", "draft")).toBe(true);
      });

      it("failed → draft is valid (retry)", () => {
        expect(isValidTaskTransition("failed", "draft")).toBe(true);
      });

      it("paid → running is NOT valid (terminal paid state)", () => {
        expect(isValidTaskTransition("paid", "running")).toBe(false);
      });
    });

    describe("Payment State Transitions", () => {
      it("intent_created → locked is valid", () => {
        expect(isValidPaymentTransition("intent_created", "locked")).toBe(true);
      });

      it("locked → unlockable is valid", () => {
        expect(isValidPaymentTransition("locked", "unlockable")).toBe(true);
      });

      it("unlockable → paid is valid", () => {
        expect(isValidPaymentTransition("unlockable", "paid")).toBe(true);
      });

      it("intent_created → paid is NOT valid", () => {
        expect(isValidPaymentTransition("intent_created", "paid")).toBe(false);
      });

      it("locked → paid is NOT valid", () => {
        expect(isValidPaymentTransition("locked", "paid")).toBe(false);
      });

      it("any → blocked is valid", () => {
        expect(isValidPaymentTransition("intent_created", "blocked")).toBe(true);
        expect(isValidPaymentTransition("locked", "blocked")).toBe(true);
        expect(isValidPaymentTransition("unlockable", "blocked")).toBe(true);
      });
    });

    describe("updateTaskStatus with enforcement", () => {
      it("throws on invalid transition", () => {
        const task = createTask({ agentId: "agent-transition" });

        expect(() => updateTaskStatus(task.id, "paid")).toThrow("INVALID_TRANSITION");
      });

      it("allows valid transition and persists", () => {
        const task = createTask({ agentId: "agent-valid" });
        const updated = updateTaskStatus(task.id, "funded");

        expect(updated).not.toBeNull();
        expect(updated!.status).toBe("funded");

        const fetched = getTask(task.id);
        expect(fetched!.status).toBe("funded");
      });

      it("follows full happy-path lifecycle", () => {
        const task = createTask({ agentId: "lifecycle-agent" });

        // draft → funded
        updateTaskStatus(task.id, "funded");
        expect(getTask(task.id)!.status).toBe("funded");

        // funded → running
        updateTaskStatus(task.id, "running");
        expect(getTask(task.id)!.status).toBe("running");

        // running → proof_pending
        updateTaskStatus(task.id, "proof_pending");
        expect(getTask(task.id)!.status).toBe("proof_pending");

        // proof_pending → proof_verified
        updateTaskStatus(task.id, "proof_verified");
        expect(getTask(task.id)!.status).toBe("proof_verified");

        // proof_verified → anchored
        updateTaskStatus(task.id, "anchored");
        expect(getTask(task.id)!.status).toBe("anchored");

        // anchored → payable
        updateTaskStatus(task.id, "payable");
        expect(getTask(task.id)!.status).toBe("payable");

        // payable → paid
        updateTaskStatus(task.id, "paid");
        expect(getTask(task.id)!.status).toBe("paid");
      });

      it("returns null for non-existent task", () => {
        const result = updateTaskStatus("no-such-task", "funded");
        expect(result).toBeNull();
      });
    });

    describe("updatePaymentStatus with enforcement", () => {
      it("allows intent_created → locked", () => {
        const payment = createPaymentIntent({
          buyerAddress: "0xPayTest",
          totalAmount: 100,
          currency: "CSPR",
        });

        const updated = updatePaymentStatus(payment.id, "locked");
        expect(updated).not.toBeNull();
        expect(updated!.status).toBe("locked");
      });

      it("throws on invalid payment transition", () => {
        const payment = createPaymentIntent({
          buyerAddress: "0xBadJump",
          totalAmount: 50,
          currency: "USD",
        });

        expect(() => updatePaymentStatus(payment.id, "paid")).toThrow("INVALID_TRANSITION");
      });
    });
  });

  // ═══════════════════════════════════════
  // E2: Payment Service
  // ═══════════════════════════════════════

  describe("E2: Payment Service", () => {

    describe("createPaymentIntent", () => {
      it("creates payment with intent_created status", () => {
        const payment = createPaymentIntent({
          buyerAddress: "0xBuyer",
          totalAmount: 500,
          currency: "CSPR",
        });

        expect(payment.id).toBeDefined();
        expect(payment.status).toBe("intent_created");
        expect(payment.total_amount).toBe(500);
        expect(payment.currency).toBe("CSPR");
        expect(payment.buyer_address).toBe("0xBuyer");
        expect(payment.recipients).toEqual([]);
        expect(payment.split_hash).toBeNull();
      });

      it("defaults unlock_rule to proof_verified", () => {
        const payment = createPaymentIntent({
          buyerAddress: "0xDefaultRule",
          totalAmount: 100,
          currency: "USD",
        });

        expect(payment.unlock_rule).toBe("proof_verified");
      });

      it("accepts custom unlock_rule", () => {
        const payment = createPaymentIntent({
          buyerAddress: "0xCustomRule",
          totalAmount: 100,
          currency: "CSPR",
          unlockRule: "workflow_verified",
        });

        expect(payment.unlock_rule).toBe("workflow_verified");
      });

      it("accepts optional task_id", () => {
        const payment = createPaymentIntent({
          buyerAddress: "0xLinked",
          totalAmount: 200,
          currency: "CSPR",
          taskId: "task-xyz",
        });

        expect(payment.task_id).toBe("task-xyz");
      });
    });

    describe("calculatePaymentSplits", () => {
      it("calculates splits and transitions to locked", () => {
        const payment = createPaymentIntent({
          buyerAddress: "0xSplitter",
          totalAmount: 1000,
          currency: "CSPR",
        });

        const result = calculatePaymentSplits(payment.id, [
          { address: "0xAgent1", share_bps: 7000, role: "primary_agent" },
          { address: "0xVerifier", share_bps: 2000, role: "verifier" },
          { address: "0xPlatform", share_bps: 1000, role: "platform" },
        ]);

        expect(result.payment.status).toBe("locked");
        expect(result.splitHash).toBeDefined();
        expect(result.splitHash.length).toBe(64); // SHA-256
        expect(result.payment.recipients.length).toBe(3);
      });

      it("throws if total share_bps != 10000", () => {
        const payment = createPaymentIntent({
          buyerAddress: "0xBadSplit",
          totalAmount: 100,
          currency: "CSPR",
        });

        expect(() =>
          calculatePaymentSplits(payment.id, [
            { address: "0xAgent1", share_bps: 5000, role: "primary_agent" },
          ])
        ).toThrow("INVALID_SPLITS");
      });

      it("throws if payment is in an invalid state for splits", () => {
        const payment = createPaymentIntent({
          buyerAddress: "0xWrongState",
          totalAmount: 100,
          currency: "CSPR",
        });
        // Transition past locked to unlockable - splits can't be recalculated
        updatePaymentStatus(payment.id, "locked");
        updatePaymentStatus(payment.id, "unlockable");

        expect(() =>
          calculatePaymentSplits(payment.id, [
            { address: "0xAgent1", share_bps: 10000, role: "primary_agent" },
          ])
        ).toThrow("INVALID_STATE");
      });

      it("throws for non-existent payment", () => {
        expect(() =>
          calculatePaymentSplits("no-such-payment", [
            { address: "0xNope", share_bps: 10000, role: "primary_agent" },
          ])
        ).toThrow("PAYMENT_NOT_FOUND");
      });

      it("creates correct recipient records", () => {
        const payment = createPaymentIntent({
          buyerAddress: "0xRecCheck",
          totalAmount: 1000,
          currency: "USD",
        });

        calculatePaymentSplits(payment.id, [
          { address: "0xPrimary", share_bps: 8000, role: "primary_agent", agent_id: "ag-1" },
          { address: "0xVerif", share_bps: 2000, role: "verifier", proof_required: true },
        ]);

        const fullPayment = getPaymentWithRecipients(payment.id);
        expect(fullPayment).not.toBeNull();
        expect(fullPayment!.recipients.length).toBe(2);

        const primary = fullPayment!.recipients.find((r) => r.role === "primary_agent");
        expect(primary).toBeDefined();
        expect(primary!.share_bps).toBe(8000);
        expect(primary!.status).toBe("locked");
        expect(primary!.agent_id).toBe("ag-1");

        const verif = fullPayment!.recipients.find((r) => r.role === "verifier");
        expect(verif).toBeDefined();
        expect(verif!.share_bps).toBe(2000);
        expect(verif!.proof_required).toBe(true);
      });

      it("recalculating splits replaces old recipients", () => {
        const payment = createPaymentIntent({
          buyerAddress: "0xRecalc",
          totalAmount: 500,
          currency: "CSPR",
        });

        // First split
        calculatePaymentSplits(payment.id, [
          { address: "0xA", share_bps: 10000, role: "primary_agent" },
        ]);

        // Second split (replaces)
        calculatePaymentSplits(payment.id, [
          { address: "0xB", share_bps: 6000, role: "primary_agent" },
          { address: "0xC", share_bps: 4000, role: "verifier" },
        ]);

        const fullPayment = getPaymentWithRecipients(payment.id);
        expect(fullPayment!.recipients.length).toBe(2);
        expect(fullPayment!.recipients[0].address).toBe("0xB");
      });
    });

    describe("unlockPayment", () => {
      it("unlocks a payment with splits from locked → unlockable", () => {
        const payment = createPaymentIntent({
          buyerAddress: "0xUnlocker",
          totalAmount: 1000,
          currency: "CSPR",
        });

        calculatePaymentSplits(payment.id, [
          { address: "0xAgent", share_bps: 10000, role: "primary_agent" },
        ]);

        const result = unlockPayment(payment.id);
        expect(result.payment.status).toBe("unlockable");

        const fullPayment = getPaymentWithRecipients(payment.id);
        expect(fullPayment!.recipients[0].status).toBe("unlockable");
      });

      it("throws if no splits calculated", () => {
        const payment = createPaymentIntent({
          buyerAddress: "0xNoSplit",
          totalAmount: 100,
          currency: "USD",
        });

        expect(() => unlockPayment(payment.id)).toThrow("NO_RECIPIENTS");
      });

      it("throws if payment is not in locked state", () => {
        const payment = createPaymentIntent({
          buyerAddress: "0xBadUnlock",
          totalAmount: 100,
          currency: "CSPR",
        });

        // Add splits first so we pass the NO_RECIPIENTS check
        calculatePaymentSplits(payment.id, [
          { address: "0xAgent", share_bps: 10000, role: "primary_agent" },
        ]);
        // Now payment is locked.
        // Transition to unlockable, then try unlock again
        updatePaymentStatus(payment.id, "unlockable");

        expect(() => unlockPayment(payment.id)).toThrow("INVALID_STATE");
      });
    });

    describe("claimRecipientShare", () => {
      it("claims a recipient share when unlockable", () => {
        const payment = createPaymentIntent({
          buyerAddress: "0xClaimer",
          totalAmount: 1000,
          currency: "CSPR",
        });

        calculatePaymentSplits(payment.id, [
          { address: "0xR1", share_bps: 6000, role: "primary_agent" },
          { address: "0xR2", share_bps: 4000, role: "verifier" },
        ]);
        unlockPayment(payment.id);

        const fullPayment = getPaymentWithRecipients(payment.id);
        const r1 = fullPayment!.recipients[0];

        const result = claimRecipientShare(payment.id, r1.id);
        expect(result.recipient.status).toBe("paid");
        expect(result.message).toContain("60%"); // 6000 bps = 60%
      });

      it("throws if recipient not found", () => {
        const payment = createPaymentIntent({
          buyerAddress: "0xBadClaim",
          totalAmount: 100,
          currency: "CSPR",
        });

        calculatePaymentSplits(payment.id, [
          { address: "0xR1", share_bps: 10000, role: "primary_agent" },
        ]);
        unlockPayment(payment.id);

        expect(() => claimRecipientShare(payment.id, "no-such-recipient")).toThrow("RECIPIENT_NOT_FOUND");
      });

      it("throws if payment not unlockable", () => {
        const payment = createPaymentIntent({
          buyerAddress: "0xEarlyClaim",
          totalAmount: 100,
          currency: "CSPR",
        });

        // Payment is still intent_created, not even locked
        expect(() => claimRecipientShare(payment.id, "any-id")).toThrow("INVALID_STATE");
      });

      it("transitions payment to paid when all recipients claimed", () => {
        const payment = createPaymentIntent({
          buyerAddress: "0xAllClaimed",
          totalAmount: 500,
          currency: "CSPR",
        });

        calculatePaymentSplits(payment.id, [
          { address: "0xOnly", share_bps: 10000, role: "primary_agent" },
        ]);
        unlockPayment(payment.id);

        const fullPayment = getPaymentWithRecipients(payment.id);
        claimRecipientShare(payment.id, fullPayment!.recipients[0].id);

        const finalized = getPayment(payment.id);
        expect(finalized!.status).toBe("paid");
      });
    });

    describe("listPayments / getPaymentWithRecipients", () => {
      it("lists all payments", () => {
        createPaymentIntent({ buyerAddress: "0xB1", totalAmount: 100, currency: "CSPR" });
        createPaymentIntent({ buyerAddress: "0xB2", totalAmount: 200, currency: "USD" });

        const payments = listPayments();
        expect(payments.length).toBe(2);
      });

      it("filters payments by status", () => {
        const p1 = createPaymentIntent({ buyerAddress: "0xB1", totalAmount: 100, currency: "CSPR" });
        createPaymentIntent({ buyerAddress: "0xB2", totalAmount: 200, currency: "CSPR" });
        updatePaymentStatus(p1.id, "locked");

        const intents = listPayments("intent_created");
        expect(intents.length).toBe(1);

        const locked = listPayments("locked");
        expect(locked.length).toBe(1);
      });

      it("getPaymentWithRecipients includes resolved recipients", () => {
        const payment = createPaymentIntent({
          buyerAddress: "0xFullFetch",
          totalAmount: 800,
          currency: "CSPR",
        });

        calculatePaymentSplits(payment.id, [
          { address: "0xR1", share_bps: 10000, role: "primary_agent" },
        ]);

        const full = getPaymentWithRecipients(payment.id);
        expect(full!.recipients.length).toBe(1);
        expect(full!.recipients[0].address).toBe("0xR1");
      });
    });
  });

  // ═══════════════════════════════════════
  // Phase E Task Lifecycle Operations
  // ═══════════════════════════════════════

  describe("E1/E3: Task Lifecycle Operations", () => {

    describe("runTaskVerification", () => {
      it("advances task from funded → running → proof_pending", async () => {
        const { task } = createTaskWithPayment({
          buyerAddress: "0xRunner",
          agentId: "agent-run",
          totalAmount: 300,
          currency: "CSPR",
        });

        // Task starts as funded (payment-backed)
        expect(task.status).toBe("funded");

        // First transition to running (done inside runTaskVerification)
        const result = await runTaskVerification(task.id);

        expect(result.status).toBe("proof_pending");
        expect(result.proofId).toBeDefined();

        const updated = getTask(task.id);
        expect(updated!.status).toBe("proof_pending");
        expect(updated!.proof_ids.length).toBe(1);
      });

      it("throws if task is in draft state (not funded)", async () => {
        const task = createTask({ agentId: "agent-draft" });

        await expect(runTaskVerification(task.id)).rejects.toThrow("INVALID_STATE");
      });

      it("throws if task not found", async () => {
        await expect(runTaskVerification("no-such-task")).rejects.toThrow("TASK_NOT_FOUND");
      });

      it("runs on already-running task", async () => {
        const { task } = createTaskWithPayment({
          buyerAddress: "0xReRunner",
          agentId: "agent-rerun",
          totalAmount: 200,
          currency: "USD",
        });

        // First run
        await runTaskVerification(task.id);
        // Second run (task is proof_pending, but should be allowed since it's one of the allowed states)
        await expect(runTaskVerification(task.id)).rejects.toThrow("INVALID_STATE");
      });
    });

    describe("verifyTaskProof", () => {
      it("returns simulated status for placeholder proofs in dry_run mode", async () => {
        const { task } = createTaskWithPayment({
          buyerAddress: "0xVerifier",
          agentId: "agent-verify",
          totalAmount: 400,
          currency: "CSPR",
        });

        await runTaskVerification(task.id);

        const result = verifyTaskProof(task.id);
        // Placeholder proofs in dry_run: simulated status, task stays at proof_pending
        expect(result.status).toBe("dry_run_proof_simulated");
        expect(result.proofIds.length).toBeGreaterThan(0);

        const updated = getTask(task.id);
        expect(updated!.status).toBe("proof_pending");
      });

      it("throws if no proofs exist", () => {
        const task = createTask({ agentId: "agent-no-proof" });
        updateTaskStatus(task.id, "funded");

        expect(() => verifyTaskProof(task.id)).toThrow("NO_PROOFS");
      });

      it("throws if task has no proofs and is not in appropriate state", () => {
        const { task } = createTaskWithPayment({
          buyerAddress: "0xBadVerify",
          agentId: "agent-bad-verify",
          totalAmount: 100,
          currency: "CSPR",
        });

        // Skip running, task is "funded" with no proofs
        expect(() => verifyTaskProof(task.id)).toThrow("NO_PROOFS");
      });
    });

    describe("unlockTaskPayment", () => {
      it("unlocks payment for anchored task with verified proof", async () => {
        const { task } = createTaskWithPayment({
          buyerAddress: "0xFullUnlock",
          agentId: "agent-full-unlock",
          totalAmount: 600,
          currency: "CSPR",
        });

        // Inject a real verified proof so anchorTaskProof can find it
        const db = getDb();
        const proofId = randomUUID();
        db.prepare(`
          INSERT INTO proofs (id, task_id, agent_id, verifier_id, input_hash, output_hash,
            wasm_hash, attestation_hash, mode, status, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'verified', ?)
        `).run(
          proofId, task.id, task.agent_id, "verifier-real",
          "real-input-" + proofId.slice(0, 8), "real-output-" + proofId.slice(0, 8),
          "real-wasm-" + proofId.slice(0, 8), "real-attest-" + proofId.slice(0, 8),
          "tee_verification_mode", new Date().toISOString(),
        );
        db.prepare("UPDATE tasks SET proof_ids = ? WHERE id = ?").run(
          JSON.stringify([proofId]), task.id,
        );

        // Run the full pipeline: funded → ... → anchored
        // Task starts as 'funded' from createTaskWithPayment
        updateTaskStatus(task.id, "running");
        updateTaskStatus(task.id, "proof_pending");
        updateTaskStatus(task.id, "proof_verified");
        await anchorTaskProof(task.id);            // → anchored

        // Now unlock
        const result = unlockTaskPayment(task.id);
        expect(result.taskStatus).toBe("payable");
        expect(result.paymentStatus).toBe("unlockable");
      });

      it("throws if task not anchored", () => {
        const { task } = createTaskWithPayment({
          buyerAddress: "0xEarlyUnlock",
          agentId: "agent-early",
          totalAmount: 100,
          currency: "CSPR",
        });

        // Task is funded, not anchored
        expect(() => unlockTaskPayment(task.id)).toThrow("INVALID_STATE");
      });

      it("throws if task has no payment", () => {
        const task = createTask({ agentId: "agent-no-pay" });
        updateTaskStatus(task.id, "funded");
        updateTaskStatus(task.id, "running");
        updateTaskStatus(task.id, "proof_pending");
        updateTaskStatus(task.id, "proof_verified");
        updateTaskStatus(task.id, "anchored");

        expect(() => unlockTaskPayment(task.id)).toThrow("NO_PAYMENT");
      });

      it("rejects unlock when anchored via placeholder synthetic proof", async () => {
        const { task } = createTaskWithPayment({
          buyerAddress: "0xNoProofUnlock",
          agentId: "agent-no-proof-unlock",
          totalAmount: 100,
          currency: "CSPR",
        });

        // anchorTaskProof in dry_run creates a synthetic placeholder proof
        // and returns dry_run_simulated - but does NOT advance task to 'anchored'.
        await anchorTaskProof(task.id);

        // Placeholder/simulated proofs must never unlock real payments.
        // Task is still NOT anchored, so unlock rejects with INVALID_STATE.
        expect(() => unlockTaskPayment(task.id)).toThrow("INVALID_STATE");
      });
    });
  });

  // ═══════════════════════════════════════
  // Health Checks
  // ═══════════════════════════════════════

  describe("Service Health", () => {
    it("getTaskServiceHealth returns expected fields", () => {
      const health = getTaskServiceHealth();
      expect(health).toHaveProperty("mode");
      expect(health).toHaveProperty("casper");
      expect(health).toHaveProperty("casperMode");
      expect(health.mode).toBe("tee_verification_mode");
    });

    it("getPaymentServiceHealth returns structured data", () => {
      const health = getPaymentServiceHealth();
      expect(health.healthy).toBe(true);
      expect(typeof health.paymentCount).toBe("number");
      expect(typeof health.recipientCount).toBe("number");
    });
  });

  // ═══════════════════════════════════════
  // Recipient State Transitions
  // ═══════════════════════════════════════

  describe("Recipient State Transitions", () => {
    it("locked → unlockable is valid", () => {
      expect(isValidRecipientTransition("locked", "unlockable")).toBe(true);
    });

    it("unlockable → paid is valid", () => {
      expect(isValidRecipientTransition("unlockable", "paid")).toBe(true);
    });

    it("locked → paid is NOT valid", () => {
      expect(isValidRecipientTransition("locked", "paid")).toBe(false);
    });

    it("any → blocked is valid", () => {
      expect(isValidRecipientTransition("locked", "blocked")).toBe(true);
      expect(isValidRecipientTransition("unlockable", "blocked")).toBe(true);
    });
  });

  // ═══════════════════════════════════════
  // Preserve Phase D Behavior
  // ═══════════════════════════════════════

  describe("Phase D Compatibility", () => {
    it("anchorTaskProof still works with legacy task", async () => {
      const task = createTask({ agentId: "legacy-agent" });
      // C3: Must be funded/running for verification, then verify before anchoring
      updateTaskStatus(task.id, "funded");
      await runTaskVerification(task.id);
      verifyTaskProof(task.id);
      const result = await anchorTaskProof(task.id);

      expect(result.anchorHash).toBeDefined();
      expect(result.anchorHash.length).toBe(64);
    });

    it("anchorTaskProof auto-creates synthetic proof in dry_run mode", async () => {
      const task = createTask({ agentId: "dry-run-task" });
      // In dry_run mode, synthetic proofs are acceptable for testing
      // but return simulated mode since they are placeholders
      const result = await anchorTaskProof(task.id);

      expect(result.anchorHash).toBeDefined();
      expect(result.anchorHash.length).toBe(64);
      expect(result.mode).toBe("dry_run_simulated");
    });
  });
});
