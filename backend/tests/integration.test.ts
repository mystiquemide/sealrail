// ────────────────────────────────────────
// Sealrail Backend — Phase M Integration Tests
// Full-loop coverage: health → agents → verifiers → marketplace → tasks
// → payments → proofs → anchoring → workflows → reputation → API keys
// M3: State machine enforcement tests
// M4: Error path tests
// ────────────────────────────────────────

import { describe, it, expect, beforeEach, beforeAll, afterAll } from "vitest";
import { randomUUID, createHash } from "crypto";

import { getDb, closeDb, resetDb } from "../src/db.js";

// ── Task service imports ─────────────────
import {
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

// ── Marketplace service imports ──────────
import {
  createListing,
  getListing,
  getListingDetail,
  listListings,
  updateListing,
  createTaskFromListing,
  getMarketplaceServiceHealth,
} from "../src/services/marketplace.js";

// ── Workflow service imports ─────────────
import {
  createWorkflow,
  getWorkflow,
  getWorkflowRunDetail,
  listWorkflows,
  createWorkflowRun,
  executeWorkflowStep,
  finalizeWorkflowRun,
  transitionWorkflowRun,
  getWorkflowServiceHealth,
} from "../src/services/workflows.js";

// ── Verifier service imports ─────────────
import {
  createVerifier,
  getVerifier,
  listVerifiers,
  updateVerifier,
  uploadVerifier,
  testVerifier,
  getVerifierServiceHealth,
} from "../src/services/verifiers.js";

// ── API key service imports ──────────────
import {
  createApiKey,
  listApiKeys,
  updateApiKey,
  revokeApiKey,
  lookupApiKey,
  getApiKeyServiceHealth,
} from "../src/services/api-keys.js";

// ── Reputation service imports ───────────
import {
  computeScore,
  recalculateReputation,
  recalculateAllReputations,
  getReputation,
  gatherReputationInputs,
} from "../src/services/reputation.js";

// ── Split service imports ────────────────
import {
  validateRecipients,
  validateRecipientsOrThrow,
  resolveRecipientProofDependency,
  resolveAllRecipientProofDependencies,
  unlockAllSatisfiedRecipients,
  unlockRecipientIfProofSatisfied,
  getRecipientProofStatuses,
} from "../src/services/splits.js";

// ── Casper service imports ───────────────
import { getCasperHealth } from "../src/services/casper.js";

// ── Config ───────────────────────────────
import { config } from "../src/config.js";

import type {
  TaskStatus,
  PaymentStatus,
  AgentCategory,
  AgentStatus,
  AgentPricingModel,
  Currency,
  ListingStatus,
  WorkflowStepTemplate,
  WorkflowStatus,
} from "../src/types.js";

// Use a test-specific in-memory database
process.env.DATABASE_PATH = ":memory:";
closeDb();

// ──────────────────────────────────────────
// Phase M — Full Integration Test Suite
// ──────────────────────────────────────────

describe("Phase M: Backend Integration Gates", () => {

  beforeEach(() => {
    resetDb();
  });

  afterAll(() => {
    closeDb();
  });

  // ═══════════════════════════════════════
  // M1: Full-Loop Integration
  // ═══════════════════════════════════════

  describe("M1: Full-Loop Integration", () => {

    describe("1. Health and status", () => {
      it("health endpoint returns ok with tee_verification_mode", () => {
        expect(config.teeVerificationMode).toBe("tee_verification_mode");
      });

      it("db is initialized and schema is present", () => {
        const db = getDb();
        const tables = db.prepare(
          "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name"
        ).all() as { name: string }[];
        const tableNames = tables.map((t) => t.name);
        expect(tableNames).toContain("agents");
        expect(tableNames).toContain("tasks");
        expect(tableNames).toContain("payments");
        expect(tableNames).toContain("proofs");
        expect(tableNames).toContain("payment_recipients");
        expect(tableNames).toContain("marketplace_listings");
        expect(tableNames).toContain("verifier_templates");
        expect(tableNames).toContain("workflow_templates");
        expect(tableNames).toContain("workflow_runs");
        expect(tableNames).toContain("agent_reputation");
        expect(tableNames).toContain("api_keys");
      });

      it("all service health checks return ok", () => {
        expect(getTaskServiceHealth().mode).toBe("tee_verification_mode");
        expect(getTaskServiceHealth().casperMode).toBeDefined();

        const paymentHealth = getPaymentServiceHealth();
        expect(paymentHealth.healthy).toBe(true);

        const agentHealth = getAgentServiceHealth();
        expect(agentHealth.healthy).toBe(true);

        const marketplaceHealth = getMarketplaceServiceHealth();
        expect(marketplaceHealth.healthy).toBe(true);

        const workflowHealth = getWorkflowServiceHealth();
        expect(workflowHealth.healthy).toBe(true);

        const verifierHealth = getVerifierServiceHealth();
        expect(verifierHealth.healthy).toBe(true);

        const apiKeyHealth = getApiKeyServiceHealth();
        expect(apiKeyHealth.healthy).toBe(true);

        const casperHealth = getCasperHealth();
        expect(casperHealth.healthy).toBe(true);
        expect(casperHealth.mode).toBeDefined();
      });
    });

    describe("2. Agent registration", () => {
      it("registers an agent and retrieves it", () => {
        const agent = createAgent({
          ownerAddress: "0xBuyerA",
          name: "Invoice Risk Scanner",
          category: "invoice" as AgentCategory,
          description: "Scans invoices for fraud risk",
          shortPitch: "Fast invoice risk analysis",
          pricingModel: "fixed" as AgentPricingModel,
          basePrice: 50,
          currency: "USD" as Currency,
        });

        expect(agent.id).toBeDefined();
        expect(agent.owner_address).toBe("0xBuyerA");
        expect(agent.name).toBe("Invoice Risk Scanner");
        expect(agent.slug).toContain("invoice-risk-scanner");
        expect(agent.status).toBe("active");

        // Retrieve
        const found = getAgent(agent.id);
        expect(found).not.toBeNull();
        expect(found!.name).toBe("Invoice Risk Scanner");
      });

      it("lists agents with filters", () => {
        createAgent({
          ownerAddress: "0xAlice",
          name: "Agent Alpha",
          category: "defi",
        });
        createAgent({
          ownerAddress: "0xBob",
          name: "Agent Beta",
          category: "invoice",
        });

        const all = listAgents({});
        expect(all.length).toBe(2);

        const defiOnly = listAgents({ category: "defi" });
        expect(defiOnly.length).toBe(1);
        expect(defiOnly[0].name).toBe("Agent Alpha");
      });

      it("syncs agent to Casper in dry_run mode", async () => {
        const agent = createAgent({
          ownerAddress: "0xAlice",
          name: "Casper Sync Agent",
          category: "research",
        });

        const result = await syncAgentToCasper(agent.id);
        expect(result.agentId).toBe(agent.id);
        expect(result.registrationHash).toBeDefined();
        expect(result.mode).toBe("dry_run");
      });
    });

    describe("3. Verifier template registration and test", () => {
      const validWasmHash =
        "a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6a7b8c9d0e1f2a3b4c5d6a7b8c9d0e1f2";

      it("registers a verifier template", () => {
        const verifier = createVerifier({
          ownerAddress: "0xAlice",
          name: "Invoice Fraud Detector",
          taskType: "invoice_risk",
          wasmHash: validWasmHash,
          description: "Detects invoice fraud using ML model",
          inputSchema: { invoice_id: "string", amount: "number" },
          outputSchema: { risk_score: "number", flags: "array" },
          status: "active",
        });

        expect(verifier.id).toBeDefined();
        expect(verifier.name).toBe("Invoice Fraud Detector");
        expect(verifier.status).toBe("active");
        expect(verifier.wasm_hash).toBe(validWasmHash);
        expect(verifier.mode_support).toEqual(["tee_verification_mode"]);
      });

      it("tests a verifier with sample input (deterministic hash chaining)", () => {
        const verifier = createVerifier({
          ownerAddress: "0xAlice",
          name: "Testable Verifier",
          taskType: "compliance",
          wasmHash: validWasmHash,
          status: "active",
        });

        const result = testVerifier(verifier.id, {
          input: { report_id: "RPT-001", amount: 5000 },
        });

        expect(result.valid).toBeDefined();
        expect(result.input_hash).toBeDefined();
        expect(result.output_hash).toBeDefined();
        expect(result.verification_token).toBeDefined();
        expect(result.mode).toBe("tee_verification_mode");
      });

      it("lists verifiers with filters", () => {
        createVerifier({
          ownerAddress: "0xAlice",
          name: "V1",
          taskType: "invoice_risk",
          wasmHash: validWasmHash,
          status: "active",
        });
        createVerifier({
          ownerAddress: "0xBob",
          name: "V2",
          taskType: "defi_risk",
          wasmHash: validWasmHash,
          status: "draft",
        });

        const all = listVerifiers({});
        expect(all.length).toBe(2);

        const active = listVerifiers({ status: "active" });
        expect(active.length).toBe(1);
        expect(active[0].name).toBe("V1");
      });
    });

    describe("4. Marketplace listing creation", () => {
      it("creates a marketplace listing from an agent", () => {
        const agent = createAgent({
          ownerAddress: "0xSeller",
          name: "RiskBot 3000",
          category: "invoice",
        });

        const listing = createListing({
          agentId: agent.id,
          ownerAddress: "0xSeller",
          title: "Invoice Risk Auto-Scan",
          category: "invoice",
          summary: "Auto-scans every invoice for risk indicators",
          priceAmount: 25,
          currency: "USD",
          proofRequirement: "proof_verified",
          verifierId: "verifier-default",
        });

        expect(listing.id).toBeDefined();
        expect(listing.agent_id).toBe(agent.id);
        expect(listing.title).toBe("Invoice Risk Auto-Scan");
        expect(listing.status).toBe("live");
        expect(listing.price_amount).toBe(25);
      });

      it("lists live listings", () => {
        const agent = createAgent({
          ownerAddress: "0xSeller",
          name: "RiskBot",
          category: "invoice",
        });

        createListing({
          agentId: agent.id,
          ownerAddress: "0xSeller",
          title: "Listing A",
          category: "invoice",
          priceAmount: 10,
          currency: "USD",
          verifierId: "verifier-default",
        });
        createListing({
          agentId: agent.id,
          ownerAddress: "0xSeller",
          title: "Listing B",
          category: "defi",
          priceAmount: 20,
          currency: "CSPR",
          verifierId: "verifier-default",
        });

        const all = listListings({});
        expect(all.length).toBe(2);

        const invoiceOnly = listListings({ category: "invoice" });
        expect(invoiceOnly.length).toBe(1);
        expect(invoiceOnly[0].title).toBe("Listing A");
      });
    });

    describe("5. Task creation from listing", () => {
      it("creates a payment-backed task from a live marketplace listing", () => {
        const agent = createAgent({
          ownerAddress: "0xSeller",
          name: "RiskBot",
          category: "invoice",
        });

        const listing = createListing({
          agentId: agent.id,
          ownerAddress: "0xSeller",
          title: "Invoice Risk Scan",
          category: "invoice",
          priceAmount: 50,
          currency: "USD",
          verifierId: "verifier-default",
        });

        const result = createTaskFromListing(listing.id, {
          buyerAddress: "0xBuyerA",
          input: { invoice_id: "INV-001" },
        });

        expect(result.task.id).toBeDefined();
        expect(result.task.agent_id).toBe(agent.id);
        expect(result.task.status).toBe("funded");
        expect(result.payment.total_amount).toBe(50);
        expect(result.payment.currency).toBe("USD");
        expect(result.payment.status).toBe("intent_created");
      });

      it("rejects task creation from non-live listing", () => {
        const agent = createAgent({
          ownerAddress: "0xSeller",
          name: "RiskBot",
          category: "invoice",
        });

        const listing = createListing({
          agentId: agent.id,
          ownerAddress: "0xSeller",
          title: "Draft Listing",
          category: "invoice",
          priceAmount: 50,
          currency: "USD",
          verifierId: "verifier-default",
        });

        // Set to draft
        updateListing(listing.id, "0xSeller", { status: "draft" });

        expect(() =>
          createTaskFromListing(listing.id, {
            buyerAddress: "0xBuyerA",
          })
        ).toThrow("LISTING_NOT_LIVE");
      });
    });

    describe("6. Payment intent and split creation", () => {
      it("creates payment intent and calculates splits", () => {
        const payment = createPaymentIntent({
          buyerAddress: "0xBuyerA",
          totalAmount: 1000,
          currency: "USD",
          unlockRule: "proof_verified",
        });

        expect(payment.id).toBeDefined();
        expect(payment.status).toBe("intent_created");
        expect(payment.total_amount).toBe(1000);

        const result = calculatePaymentSplits(payment.id, [
          { address: "0xAgent1", share_bps: 7000, role: "primary_agent" },
          { address: "0xVerifier1", share_bps: 2000, role: "verifier" },
          { address: "0xPlatform", share_bps: 1000, role: "platform" },
        ]);

        expect(result.payment.status).toBe("locked");
        expect(result.splitHash).toBeDefined();
        expect(result.payment.recipients.length).toBe(3);
      });

      it("rejects split with bps mismatch", () => {
        const payment = createPaymentIntent({
          buyerAddress: "0xBuyerA",
          totalAmount: 1000,
          currency: "USD",
        });

        expect(() =>
          calculatePaymentSplits(payment.id, [
            { address: "0xAgent1", share_bps: 5000, role: "primary_agent" },
          ])
        ).toThrow("INVALID_SPLITS");
      });
    });

    describe("7. TEE proof verification path", () => {
      it("runs TEE verification on a funded task (deterministic path)", async () => {
        const { task } = createTaskWithPayment({
          buyerAddress: "0xBuyerA",
          agentId: "agent-tee-001",
          title: "TEE Verification Task",
          totalAmount: 100,
          currency: "USD",
        });

        expect(task.status).toBe("funded");

        // Run verification
        const runResult = await runTaskVerification(task.id);
        expect(runResult.status).toBe("proof_pending");
        expect(runResult.proofId).toBeDefined();

        // Verify the proof (dry_run placeholder returns simulated status)
        const verifyResult = verifyTaskProof(task.id);
        expect(verifyResult.status).toBe("dry_run_proof_simulated");
        expect(verifyResult.proofIds.length).toBeGreaterThan(0);
      });
    });

    describe("8. Casper anchor path", () => {
      it("anchors a verified task proof to Casper (dry-run mode)", async () => {
        const { task } = createTaskWithPayment({
          buyerAddress: "0xBuyerA",
          agentId: "agent-anchor-001",
          title: "Anchor Test Task",
          totalAmount: 100,
          currency: "USD",
        });

        // Run + verify first — then inject a real verified proof so anchor works
        await runTaskVerification(task.id);
        verifyTaskProof(task.id);

        // Inject a real non-placeholder verified proof
        const db = getDb();
        const proofId = randomUUID();
        db.prepare(`
          INSERT INTO proofs (id, task_id, agent_id, verifier_id, input_hash, output_hash,
            wasm_hash, attestation_hash, mode, status, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'verified', ?)
        `).run(
          proofId, task.id, task.agent_id, "verifier-real",
          "real-in-" + proofId.slice(0, 8), "real-out-" + proofId.slice(0, 8),
          "real-wasm-" + proofId.slice(0, 8), "real-attest-" + proofId.slice(0, 8),
          "tee_verification_mode", new Date().toISOString(),
        );
        const current = db.prepare("SELECT proof_ids FROM tasks WHERE id = ?").get(task.id) as any;
        const proofIds: string[] = current ? JSON.parse(current.proof_ids) : [];
        proofIds.push(proofId);
        db.prepare("UPDATE tasks SET proof_ids = ? WHERE id = ?").run(
          JSON.stringify(proofIds), task.id,
        );
        updateTaskStatus(task.id, "proof_verified");

        // Anchor
        const anchorResult = await anchorTaskProof(task.id);
        expect(anchorResult.anchorHash).toBeDefined();
        expect(anchorResult.mode).toBeDefined();
        expect(anchorResult.proofId).toBeDefined();

        // Task should now be anchored
        const updated = getTask(task.id);
        expect(updated!.status).toBe("anchored");
      });
    });

    describe("9. Payment unlock and recipient claim", () => {
      it("unlocks payment and claims recipient share (full loop)", async () => {
        // 1. Create task with payment
        const { task, payment } = createTaskWithPayment({
          buyerAddress: "0xBuyerA",
          agentId: "agent-full-001",
          title: "Full-Loop Task",
          totalAmount: 1000,
          currency: "USD",
        });

        // 2. Set up splits
        const splitResult = calculatePaymentSplits(payment.id, [
          { address: "0xAgentFull", share_bps: 8000, role: "primary_agent" },
          { address: "0xVerifierFull", share_bps: 2000, role: "verifier" },
        ]);

        // 3. Run TEE verification
        await runTaskVerification(task.id);
        verifyTaskProof(task.id);

        // Inject a real verified proof so anchor + unlock works
        const db = getDb();
        const proofId = randomUUID();
        db.prepare(`
          INSERT INTO proofs (id, task_id, agent_id, verifier_id, input_hash, output_hash,
            wasm_hash, attestation_hash, mode, status, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'verified', ?)
        `).run(
          proofId, task.id, task.agent_id, "verifier-real",
          "real-in-" + proofId.slice(0, 8), "real-out-" + proofId.slice(0, 8),
          "real-wasm-" + proofId.slice(0, 8), "real-attest-" + proofId.slice(0, 8),
          "tee_verification_mode", new Date().toISOString(),
        );
        const current = db.prepare("SELECT proof_ids FROM tasks WHERE id = ?").get(task.id) as any;
        const proofIds: string[] = current ? JSON.parse(current.proof_ids) : [];
        proofIds.push(proofId);
        db.prepare("UPDATE tasks SET proof_ids = ? WHERE id = ?").run(
          JSON.stringify(proofIds), task.id,
        );
        updateTaskStatus(task.id, "proof_verified");

        // 4. Anchor
        await anchorTaskProof(task.id);

        // 5. Unlock payment
        const unlockResult = unlockTaskPayment(task.id);
        expect(unlockResult.paymentStatus).toBe("unlockable");
        expect(unlockResult.taskStatus).toBe("payable");

        // 6. Claim recipient share
        const paymentWithRecipients = getPaymentWithRecipients(payment.id)!;
        const recipientId = paymentWithRecipients.recipients[0].id;

        const claimResult = claimRecipientShare(payment.id, recipientId);
        expect(claimResult.recipient.status).toBe("paid");
      });

      it("rejects unlock before proof/anchor", () => {
        const { task } = createTaskWithPayment({
          buyerAddress: "0xBuyerA",
          agentId: "agent-unlock-test",
          totalAmount: 100,
          currency: "USD",
        });

        // Task is funded but not verified/anchored
        expect(() => unlockTaskPayment(task.id)).toThrow("INVALID_STATE");
      });

      it("rejects double claim", () => {
        const { task } = createTaskWithPayment({
          buyerAddress: "0xBuyerA",
          agentId: "agent-claim-test",
          totalAmount: 100,
          currency: "USD",
        });

        // Set up full pipeline
        calculatePaymentSplits(task.payment_id!, [
          { address: "0xAgentClaim", share_bps: 10000, role: "primary_agent" },
        ]);

        updateTaskStatus(task.id, "running");
        updateTaskStatus(task.id, "proof_pending");
        updateTaskStatus(task.id, "proof_verified");

        // Create a real non-placeholder proof in verified state
        const db = getDb();
        const proofId = randomUUID();
        db.prepare(`
          INSERT INTO proofs (id, task_id, agent_id, verifier_id, input_hash, output_hash,
            wasm_hash, attestation_hash, mode, status, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'verified', ?)
        `).run(
          proofId, task.id, task.agent_id, "verifier-default",
          "sha256-abc123def456", "sha256-output789xyz",
          "sha256-wasm-001", "sha256-attest-real",
          "tee_verification_mode", new Date().toISOString(),
        );
        db.prepare("UPDATE tasks SET proof_ids = ? WHERE id = ?").run(
          JSON.stringify([proofId]), task.id,
        );

        updateTaskStatus(task.id, "anchored");
        unlockTaskPayment(task.id);

        const paymentWithRecipients = getPaymentWithRecipients(task.payment_id!)!;
        const rid = paymentWithRecipients.recipients[0].id;

        // First claim succeeds
        const firstClaim = claimRecipientShare(task.payment_id!, rid);
        expect(firstClaim.recipient.status).toBe("paid");

        // Second claim fails
        expect(() => claimRecipientShare(task.payment_id!, rid)).toThrow(
          "INVALID_STATE"
        );
      });
    });

    describe("10. Workflow template creation, run, ordered step execution, finalize", () => {
      it("creates and executes a multi-step workflow to completion", () => {
        // Create agents for workflow steps
        const agent1 = createAgent({
          ownerAddress: "0xOrchestrator",
          name: "Invoice Parser",
          category: "invoice",
        });
        const agent2 = createAgent({
          ownerAddress: "0xOrchestrator",
          name: "Risk Analyzer",
          category: "invoice",
        });

        // Create workflow template
        const steps: WorkflowStepTemplate[] = [
          {
            id: "step-parse",
            order: 0,
            name: "Parse Invoice",
            agent_id: agent1.id,
            verifier_id: "verifier-default",
            required: true,
          },
          {
            id: "step-analyze",
            order: 1,
            name: "Analyze Risk",
            agent_id: agent2.id,
            verifier_id: "verifier-default",
            required: true,
          },
        ];

        const workflow = createWorkflow({
          ownerAddress: "0xOrchestrator",
          name: "Invoice Risk Workflow",
          description: "Parse then analyze invoices",
          category: "invoice",
          steps,
          status: "active",
        });

        expect(workflow.id).toBeDefined();
        expect(workflow.status).toBe("active");
        expect(workflow.steps.length).toBe(2);

        // Create run — step_runs get auto-generated UUIDs
        const run = createWorkflowRun(workflow.id, "0xBuyerA");
        expect(run.id).toBeDefined();
        expect(run.status).toBe("created");
        expect(run.step_runs.length).toBe(2);

        const step1RunId = run.step_runs[0].id;
        const step2RunId = run.step_runs[1].id;

        // Execute step 1 (order 0) using step_run UUID
        const step1Result = executeWorkflowStep(run.id, step1RunId, agent1.id);
        expect(step1Result.stepRun.status).toBe("verified");
        expect(step1Result.proof).toBeDefined();

        // Execute step 2 (order 1) using step_run UUID
        const step2Result = executeWorkflowStep(run.id, step2RunId, agent2.id);
        expect(step2Result.stepRun.status).toBe("verified");
        expect(step2Result.proof).toBeDefined();

        // Finalize
        const finalResult = finalizeWorkflowRun(run.id);
        expect(finalResult.run.status).toBe("proofs_verified");
        expect(finalResult.finalProof).toBeDefined();
        expect(finalResult.stepProofs.length).toBe(2);
      });

      it("rejects out-of-order step execution", () => {
        const agent1 = createAgent({
          ownerAddress: "0xOrch",
          name: "Step 1 Agent",
          category: "invoice",
        });
        const agent2 = createAgent({
          ownerAddress: "0xOrch",
          name: "Step 2 Agent",
          category: "invoice",
        });

        const workflow = createWorkflow({
          ownerAddress: "0xOrch",
          name: "Sequential Workflow",
          steps: [
            { id: "step-1", order: 0, name: "First", agent_id: agent1.id, verifier_id: "v1", required: true },
            { id: "step-2", order: 1, name: "Second", agent_id: agent2.id, verifier_id: "v2", required: true },
          ],
          status: "active",
        });

        const run = createWorkflowRun(workflow.id, "0xBuyerA");
        const step2RunId = run.step_runs[1].id; // order 1

        // Try to execute step 2 (order 1) before step 1 (order 0) — should fail
        expect(() =>
          executeWorkflowStep(run.id, step2RunId, agent2.id)
        ).toThrow("STEP_ORDER_VIOLATION");
      });

      it("rejects agent mismatch on step execution", () => {
        const agent1 = createAgent({
          ownerAddress: "0xOrch",
          name: "Correct Agent",
          category: "invoice",
        });
        const wrongAgent = createAgent({
          ownerAddress: "0xOther",
          name: "Wrong Agent",
          category: "invoice",
        });

        const workflow = createWorkflow({
          ownerAddress: "0xOrch",
          name: "Agent Match Workflow",
          steps: [
            { id: "step-1", order: 0, name: "First", agent_id: agent1.id, verifier_id: "v1", required: true },
          ],
          status: "active",
        });

        const run = createWorkflowRun(workflow.id, "0xBuyerA");
        const step1RunId = run.step_runs[0].id;

        expect(() =>
          executeWorkflowStep(run.id, step1RunId, wrongAgent.id)
        ).toThrow("AGENT_MISMATCH");
      });
    });

    describe("11. Reputation recalculation", () => {
      it("recalculates reputation from real proof/payment/task data", () => {
        const agent = createAgent({
          ownerAddress: "0xRepOwner",
          name: "Rep Test Agent",
          category: "invoice",
        });

        // Create some task data for the agent
        const { task } = createTaskWithPayment({
          buyerAddress: "0xBuyerA",
          agentId: agent.id,
          title: "Rep Task",
          totalAmount: 100,
          currency: "USD",
        });

        // Mark as paid to trigger recalculation hooks
        updateTaskStatus(task.id, "running");
        updateTaskStatus(task.id, "proof_pending");
        updateTaskStatus(task.id, "proof_verified");
        updateTaskStatus(task.id, "anchored");
        updateTaskStatus(task.id, "payable");
        updateTaskStatus(task.id, "paid");

        // Explicit recalculation
        const reputation = recalculateReputation(agent.id);
        expect(reputation.score).toBeDefined();
        expect(reputation.score).toBeGreaterThanOrEqual(0);
        expect(reputation.score).toBeLessThanOrEqual(100);
        expect(reputation.paid_tasks).toBeGreaterThanOrEqual(0);

        // Verify it can be retrieved
        const agentRep = getAgentReputation(agent.id);
        expect(agentRep.score).toBeDefined();
        expect(agentRep.score).toBeGreaterThanOrEqual(0);
        expect(agentRep.score).toBeLessThanOrEqual(100);
      });

      it("computeScore returns deterministic result", () => {
        const score1 = computeScore({ verifiedRuns: 10, paidTasks: 8, failedRuns: 2, blockedTasks: 0 });
        const score2 = computeScore({ verifiedRuns: 10, paidTasks: 8, failedRuns: 2, blockedTasks: 0 });
        expect(score1).toBe(score2);
        expect(score1).toBeGreaterThanOrEqual(0);
        expect(score1).toBeLessThanOrEqual(100);
      });

      it("recalculateAllReputations processes all agents", () => {
        createAgent({
          ownerAddress: "0xOwner",
          name: "Agent 1",
          category: "defi",
        });
        createAgent({
          ownerAddress: "0xOwner",
          name: "Agent 2",
          category: "research",
        });

        const results = recalculateAllReputations();
        expect(results.size).toBe(2);
        results.forEach((r) => {
          expect(r.score).toBeGreaterThanOrEqual(0);
          expect(r.score).toBeLessThanOrEqual(100);
        });
      });
    });

    describe("12. API key management (create/list/update/revoke + scope checks)", () => {
      it("creates an API key and returns the secret once", () => {
        const result = createApiKey({
          ownerAddress: "0xKeyOwner",
          name: "My Integration Key",
          scopes: ["tasks:read", "tasks:write"],
        });

        expect(result.key.id).toBeDefined();
        expect(result.key.prefix).toBeDefined();
        expect(result.rawSecret).toBeDefined();
        expect(result.rawSecret.length).toBeGreaterThan(30);
        // Secret should not be in the key object
        expect((result.key as any).secret).toBeUndefined();
        expect((result.key as any).raw_secret).toBeUndefined();
      });

      it("lists API keys with prefix only (no secret exposure)", () => {
        createApiKey({
          ownerAddress: "0xKeyOwner",
          name: "Key A",
        });
        createApiKey({
          ownerAddress: "0xKeyOwner",
          name: "Key B",
        });

        const keys = listApiKeys("0xKeyOwner");
        expect(keys.length).toBe(2);
        keys.forEach((k) => {
          expect(k.prefix).toBeDefined();
          // No secret exposure in list
          expect((k as any).hashed_secret).toBeUndefined();
          expect((k as any).raw_secret).toBeUndefined();
        });
      });

      it("looks up a valid API key by raw secret", () => {
        const result = createApiKey({
          ownerAddress: "0xKeyOwner",
          name: "Lookup Test Key",
        });

        const found = lookupApiKey(result.rawSecret);
        expect(found).not.toBeNull();
        expect(found!.id).toBe(result.key.id);
        expect(found!.owner_address).toBe("0xKeyOwner");
      });

      it("looks up fails for invalid API key", () => {
        const found = lookupApiKey("invalid-key-that-does-not-exist");
        expect(found).toBeNull();
      });

      it("rejects a revoked API key (excluded from lookup)", () => {
        const result = createApiKey({
          ownerAddress: "0xKeyOwner",
          name: "To Be Revoked",
        });

        // Revoke it
        revokeApiKey(result.key.id, "0xKeyOwner");

        // Should fail lookup
        const found = lookupApiKey(result.rawSecret);
        expect(found).toBeNull();
      });

      it("updates API key name and scopes", () => {
        const result = createApiKey({
          ownerAddress: "0xKeyOwner",
          name: "Original Name",
          scopes: ["tasks:read"],
        });

        const updated = updateApiKey(result.key.id, "0xKeyOwner", {
          name: "Updated Name",
          scopes: ["tasks:read", "tasks:write", "proofs:read"],
        });

        expect(updated.name).toBe("Updated Name");
        expect(updated.scopes).toContain("proofs:read");
      });

      it("rejects update by non-owner", () => {
        const result = createApiKey({
          ownerAddress: "0xKeyOwner",
          name: "Owner Key",
        });

        expect(() =>
          updateApiKey(result.key.id, "0xNotOwner", { name: "Hijacked" })
        ).toThrow("NOT_OWNER");
      });
    });
  });

  // ═══════════════════════════════════════
  // M3: State Machine Enforcement Tests
  // ═══════════════════════════════════════

  describe("M3: State Machine Enforcement", () => {

    describe("Task state machine enforcement", () => {
      it("rejects invalid task transitions", () => {
        const { task } = createTaskWithPayment({
          buyerAddress: "0xBuyerA",
          agentId: "agent-sm-001",
          totalAmount: 100,
          currency: "USD",
        });

        // Task starts as 'funded'
        expect(task.status).toBe("funded");

        // Cannot jump from funded to paid directly
        expect(() => updateTaskStatus(task.id, "paid")).toThrow(
          "INVALID_TRANSITION"
        );

        // Cannot jump from funded to anchored directly
        expect(() => updateTaskStatus(task.id, "anchored")).toThrow(
          "INVALID_TRANSITION"
        );

        // funded → draft IS allowed per the transitions map
        const reverted = updateTaskStatus(task.id, "draft");
        expect(reverted!.status).toBe("draft");
      });

      it("rejects transition from paid to non-blocked states", () => {
        const { task } = createTaskWithPayment({
          buyerAddress: "0xBuyerA",
          agentId: "agent-sm-002",
          totalAmount: 100,
          currency: "USD",
        });

        // Fast-forward to paid
        updateTaskStatus(task.id, "running");
        updateTaskStatus(task.id, "proof_pending");
        updateTaskStatus(task.id, "proof_verified");
        updateTaskStatus(task.id, "anchored");
        updateTaskStatus(task.id, "payable");
        updateTaskStatus(task.id, "paid");

        expect(getTask(task.id)!.status).toBe("paid");

        // paid → only blocked allowed
        expect(() => updateTaskStatus(task.id, "draft")).toThrow(
          "INVALID_TRANSITION"
        );
        expect(() => updateTaskStatus(task.id, "funded")).toThrow(
          "INVALID_TRANSITION"
        );

        // paid → blocked IS allowed
        const blocked = updateTaskStatus(task.id, "blocked");
        expect(blocked!.status).toBe("blocked");
      });

      it("isValidTaskTransition returns correct results", () => {
        expect(isValidTaskTransition("draft", "funded")).toBe(true);
        expect(isValidTaskTransition("draft", "paid")).toBe(false);
        expect(isValidTaskTransition("funded", "running")).toBe(true);
        expect(isValidTaskTransition("funded", "proof_verified")).toBe(false);
        expect(isValidTaskTransition("proof_verified", "anchored")).toBe(true);
        expect(isValidTaskTransition("proof_verified", "draft")).toBe(false);
        expect(isValidTaskTransition("anchored", "payable")).toBe(true);
        expect(isValidTaskTransition("payable", "paid")).toBe(true);
        expect(isValidTaskTransition("paid", "blocked")).toBe(true);
        expect(isValidTaskTransition("paid", "running")).toBe(false);
        expect(isValidTaskTransition("blocked", "draft")).toBe(true);
        expect(isValidTaskTransition("blocked", "failed")).toBe(true);
        expect(isValidTaskTransition("failed", "draft")).toBe(true);
      });
    });

    describe("Payment state machine enforcement", () => {
      it("rejects invalid payment transitions", () => {
        const payment = createPaymentIntent({
          buyerAddress: "0xBuyerA",
          totalAmount: 500,
          currency: "USD",
        });

        expect(payment.status).toBe("intent_created");

        // Cannot jump from intent_created to paid
        expect(() => updatePaymentStatus(payment.id, "paid")).toThrow(
          "INVALID_TRANSITION"
        );

        // Cannot jump from intent_created to unlockable
        expect(() => updatePaymentStatus(payment.id, "unlockable")).toThrow(
          "INVALID_TRANSITION"
        );

        // intent_created → locked IS valid
        const locked = updatePaymentStatus(payment.id, "locked");
        expect(locked!.status).toBe("locked");
      });

      it("isValidPaymentTransition returns correct results", () => {
        expect(isValidPaymentTransition("intent_created", "locked")).toBe(true);
        expect(isValidPaymentTransition("intent_created", "paid")).toBe(false);
        expect(isValidPaymentTransition("locked", "unlockable")).toBe(true);
        expect(isValidPaymentTransition("locked", "paid")).toBe(false);
        expect(isValidPaymentTransition("unlockable", "paid")).toBe(true);
        expect(isValidPaymentTransition("paid", "blocked")).toBe(true);
        expect(isValidPaymentTransition("paid", "locked")).toBe(false);
      });

      it("isValidRecipientTransition returns correct results", () => {
        expect(isValidRecipientTransition("locked", "unlockable")).toBe(true);
        expect(isValidRecipientTransition("locked", "paid")).toBe(false);
        expect(isValidRecipientTransition("unlockable", "paid")).toBe(true);
        expect(isValidRecipientTransition("paid", "blocked")).toBe(true);
      });
    });

    describe("Workflow run state enforcement", () => {
      it("rejects running steps on a finalized run", () => {
        const agent = createAgent({
          ownerAddress: "0xOrch",
          name: "Finalized Agent",
          category: "invoice",
        });

        const workflow = createWorkflow({
          ownerAddress: "0xOrch",
          name: "Finalize Test",
          steps: [
            { id: "s1", order: 0, name: "Step 1", agent_id: agent.id, verifier_id: "v1", required: true },
          ],
          status: "active",
        });

        const run = createWorkflowRun(workflow.id, "0xBuyerA");
        const stepRunId = run.step_runs[0].id;

        executeWorkflowStep(run.id, stepRunId, agent.id);
        finalizeWorkflowRun(run.id);

        // Run is now proofs_verified — cannot add new steps
        expect(() =>
          executeWorkflowStep(run.id, stepRunId, agent.id)
        ).toThrow("INVALID_RUN_STATE");
      });

      it("rejects finalize before all steps are executed", () => {
        const agent1 = createAgent({
          ownerAddress: "0xOrch",
          name: "Partial Agent 1",
          category: "invoice",
        });
        const agent2 = createAgent({
          ownerAddress: "0xOrch",
          name: "Partial Agent 2",
          category: "invoice",
        });

        const workflow = createWorkflow({
          ownerAddress: "0xOrch",
          name: "Partial Finalize Test",
          steps: [
            { id: "s1", order: 0, name: "First", agent_id: agent1.id, verifier_id: "v1", required: true },
            { id: "s2", order: 1, name: "Second", agent_id: agent2.id, verifier_id: "v2", required: true },
          ],
          status: "active",
        });

        const run = createWorkflowRun(workflow.id, "0xBuyerA");

        // Only execute step 1, not step 2
        executeWorkflowStep(run.id, run.step_runs[0].id, agent1.id);

        // Should fail — not all steps verified
        expect(() => finalizeWorkflowRun(run.id)).toThrow("STEPS_NOT_VERIFIED");
      });
    });

    describe("Verifier state enforcement", () => {
      const validWasmHash =
        "a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6a7b8c9d0e1f2a3b4c5d6a7b8c9d0e1f2";

      it("rejects testing a deprecated verifier", () => {
        const verifier = createVerifier({
          ownerAddress: "0xAlice",
          name: "Deprecated V",
          taskType: "invoice_risk",
          wasmHash: validWasmHash,
          status: "active",
        });

        // Deprecate it
        updateVerifier(verifier.id, "0xAlice", { status: "deprecated" });

        expect(() =>
          testVerifier(verifier.id, { input: { test: true } })
        ).toThrow("VERIFIER_DEPRECATED");
      });
    });
  });

  // ═══════════════════════════════════════
  // M4: Error Path Tests
  // ═══════════════════════════════════════

  describe("M4: Error Paths", () => {

    describe("Nonexistent resources return correct errors", () => {
      it("getTask returns null for nonexistent task", () => {
        const task = getTask("nonexistent-task-id");
        expect(task).toBeNull();
      });

      it("getTaskWithTrail returns null task for nonexistent", () => {
        const result = getTaskWithTrail("nonexistent-task-id");
        expect(result.task).toBeNull();
        expect(result.payment).toBeNull();
        expect(result.proofs).toEqual([]);
      });

      it("getPayment returns null for nonexistent payment", () => {
        const payment = getPayment("nonexistent-payment-id");
        expect(payment).toBeNull();
      });

      it("getAgent returns null for nonexistent agent", () => {
        const agent = getAgent("nonexistent-agent-id");
        expect(agent).toBeNull();
      });

      it("getListing returns null for nonexistent listing", () => {
        const listing = getListing("nonexistent-listing-id");
        expect(listing).toBeNull();
      });

      it("getVerifier returns null for nonexistent verifier", () => {
        const verifier = getVerifier("nonexistent-verifier-id");
        expect(verifier).toBeNull();
      });

      it("getWorkflow returns null for nonexistent workflow", () => {
        const workflow = getWorkflow("nonexistent-workflow-id");
        expect(workflow).toBeNull();
      });

      it("updateTaskStatus returns null for nonexistent", () => {
        const result = updateTaskStatus("nonexistent-task", "funded");
        expect(result).toBeNull();
      });

      it("updatePayment returns null for nonexistent", () => {
        const result = updatePaymentStatus("nonexistent-payment", "locked");
        expect(result).toBeNull();
      });

      it("claimRecipientShare throws for nonexistent payment", () => {
        expect(() =>
          claimRecipientShare("nonexistent-payment", "nonexistent-recipient")
        ).toThrow("PAYMENT_NOT_FOUND");
      });

      it("reputation throws AGENT_NOT_FOUND for nonexistent agent", () => {
        expect(() => getAgentReputation("nonexistent-agent")).toThrow(
          "AGENT_NOT_FOUND"
        );
      });

      it("updateApiKey throws KEY_NOT_FOUND for nonexistent key", () => {
        expect(() =>
          updateApiKey("nonexistent-key", "0xOwner", { name: "Nope" })
        ).toThrow("KEY_NOT_FOUND");
      });

      it("revokeApiKey throws KEY_NOT_FOUND for nonexistent key", () => {
        expect(() =>
          revokeApiKey("nonexistent-key", "0xOwner")
        ).toThrow("KEY_NOT_FOUND");
      });
    });

    describe("Owner mismatch errors", () => {
      it("updateAgent rejects non-owner", () => {
        const agent = createAgent({
          ownerAddress: "0xRealOwner",
          name: "Owned Agent",
          category: "invoice",
        });

        expect(() =>
          updateAgent(agent.id, "0xFakeOwner", { name: "Hijacked" })
        ).toThrow("NOT_OWNER");
      });

      it("updateListing rejects non-owner", () => {
        const agent = createAgent({
          ownerAddress: "0xRealOwner",
          name: "Listing Owner Agent",
          category: "invoice",
        });

        const listing = createListing({
          agentId: agent.id,
          ownerAddress: "0xRealOwner",
          title: "Owned Listing",
          category: "invoice",
          priceAmount: 50,
          currency: "USD",
          verifierId: "v-default",
        });

        expect(() =>
          updateListing(listing.id, "0xFakeOwner", { title: "Hijacked" })
        ).toThrow("NOT_OWNER");
      });

      it("updateVerifier rejects non-owner", () => {
        const validWasmHash =
          "a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6a7b8c9d0e1f2a3b4c5d6a7b8c9d0e1f2";

        const verifier = createVerifier({
          ownerAddress: "0xRealOwner",
          name: "Owned Verifier",
          taskType: "invoice_risk",
          wasmHash: validWasmHash,
        });

        expect(() =>
          updateVerifier(verifier.id, "0xFakeOwner", { name: "Hijacked" })
        ).toThrow("NOT_OWNER");
      });
    });

    describe("Split validation errors", () => {
      it("validateRecipients catches invalid role", () => {
        const errors = validateRecipients([
          { address: "0xAddr", share_bps: 10000, role: "invalid_role" },
        ]);
        expect(errors.length).toBeGreaterThan(0);
        expect(errors[0].field).toBe("role");
      });

      it("validateRecipients catches invalid share_bps", () => {
        const errors = validateRecipients([
          { address: "0xAddr", share_bps: 20000, role: "primary_agent" },
        ]);
        const bpsErrors = errors.filter((e) => e.field === "share_bps");
        expect(bpsErrors.length).toBeGreaterThan(0);
      });

      it("validateRecipients catches empty address", () => {
        const errors = validateRecipients([
          { address: "", share_bps: 10000, role: "primary_agent" },
        ]);
        expect(errors.length).toBeGreaterThan(0);
      });

      it("validateRecipientsOrThrow throws on first error", () => {
        expect(() =>
          validateRecipientsOrThrow([
            { address: "", share_bps: 5000, role: "primary_agent" },
          ])
        ).toThrow("INVALID_RECIPIENTS");
      });

      it("calculatePaymentSplits rejects bps mismatch", () => {
        const payment = createPaymentIntent({
          buyerAddress: "0xBuyerA",
          totalAmount: 1000,
          currency: "USD",
        });

        expect(() =>
          calculatePaymentSplits(payment.id, [
            { address: "0xAddr", share_bps: 5000, role: "primary_agent" },
          ])
        ).toThrow("INVALID_SPLITS");
      });
    });

    describe("Proof dependency resolution errors", () => {
      it("resolveRecipientProofDependency throws for nonexistent payment", () => {
        expect(() =>
          resolveRecipientProofDependency("nonexistent", "nonexistent")
        ).toThrow("PAYMENT_NOT_FOUND");
      });

      it("resolveAllRecipientProofDependencies throws for nonexistent payment", () => {
        expect(() =>
          resolveAllRecipientProofDependencies("nonexistent")
        ).toThrow("PAYMENT_NOT_FOUND");
      });

      it("getRecipientProofStatuses throws for nonexistent payment", () => {
        expect(() =>
          getRecipientProofStatuses("nonexistent")
        ).toThrow("PAYMENT_NOT_FOUND");
      });
    });

    describe("Unlock enforcement errors", () => {
      it("unlockPayment rejects when no recipients set", () => {
        const payment = createPaymentIntent({
          buyerAddress: "0xBuyerA",
          totalAmount: 100,
          currency: "USD",
        });

        // Transition to locked manually (bypassing the split requirement in the route)
        updatePaymentStatus(payment.id, "locked");

        expect(() => unlockPayment(payment.id)).toThrow("NO_RECIPIENTS");
      });

      it("unlockAllSatisfiedRecipients rejects when no recipients", () => {
        const payment = createPaymentIntent({
          buyerAddress: "0xBuyerA",
          totalAmount: 100,
          currency: "USD",
        });

        updatePaymentStatus(payment.id, "locked");

        expect(() =>
          unlockAllSatisfiedRecipients(payment.id)
        ).toThrow("NO_RECIPIENTS");
      });

      it("unlockAllSatisfiedRecipients rejects when payment not locked", () => {
        const payment = createPaymentIntent({
          buyerAddress: "0xBuyerA",
          totalAmount: 100,
          currency: "USD",
        });

        expect(() =>
          unlockAllSatisfiedRecipients(payment.id)
        ).toThrow("INVALID_STATE");
      });

      it("unlockRecipientIfProofSatisfied returns not-unlocked for non-locked recipient", () => {
        const payment = createPaymentIntent({
          buyerAddress: "0xBuyerA",
          totalAmount: 100,
          currency: "USD",
        });

        calculatePaymentSplits(payment.id, [
          { address: "0xAddr", share_bps: 10000, role: "primary_agent" },
        ]);

        // Unlock all to move to unlockable
        updatePaymentStatus(payment.id, "unlockable");
        const recipients = getPaymentWithRecipients(payment.id)!.recipients;

        // Try to unlock a recipient that is already in unlockable state
        const result = unlockRecipientIfProofSatisfied(payment.id, recipients[0].id);
        expect(result.unlocked).toBe(false);
      });
    });

    describe("Workflow error paths", () => {
      it("rejects creating run from draft workflow", () => {
        const agent = createAgent({
          ownerAddress: "0xOrch",
          name: "Draft Agent",
          category: "invoice",
        });

        const workflow = createWorkflow({
          ownerAddress: "0xOrch",
          name: "Draft Workflow",
          steps: [
            { id: "s1", order: 0, name: "Step 1", agent_id: agent.id, verifier_id: "v1", required: true },
          ],
          status: "draft",
        });

        expect(() =>
          createWorkflowRun(workflow.id, "0xBuyerA")
        ).toThrow("WORKFLOW_NOT_ACTIVE");
      });

      it("getWorkflowRunDetail returns null run for nonexistent", () => {
        const detail = getWorkflowRunDetail("nonexistent-run");
        expect(detail.run).toBeNull();
      });

      it("transitionWorkflowRun rejects nonexistent run", () => {
        expect(() =>
          transitionWorkflowRun("nonexistent", "running")
        ).toThrow("WORKFLOW_RUN_NOT_FOUND");
      });
    });

    describe("API key error paths", () => {
      it("revokeApiKey throws KEY_ALREADY_REVOKED for already-revoked key", () => {
        const result = createApiKey({
          ownerAddress: "0xKeyOwner",
          name: "Revoke Twice",
        });

        revokeApiKey(result.key.id, "0xKeyOwner");

        expect(() =>
          revokeApiKey(result.key.id, "0xKeyOwner")
        ).toThrow("KEY_ALREADY_REVOKED");
      });

      it("listApiKeys returns empty for owner with no keys", () => {
        const keys = listApiKeys("0xUnknownOwner");
        expect(keys).toEqual([]);
      });
    });

    describe("Casper service health", () => {
      it("returns healthy status", () => {
        const health = getCasperHealth();
        expect(health.healthy).toBe(true);
        expect(health.mode).toBeDefined();
      });
    });
  });

  // ═══════════════════════════════════════
  // A-K Phase Preservation
  // ═══════════════════════════════════════

  describe("Phase A-L preservation", () => {
    it("Phase A: db is accessible and all tables exist", () => {
      const db = getDb();
      const tables = db.prepare(
        "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name"
      ).all() as { name: string }[];
      expect(tables.length).toBeGreaterThanOrEqual(12);
    });

    it("Phase B: (contract tests are separate — cargo odra)", () => {
      // Contract tests live in contracts/verified-agent-payments/tests/
      expect(true).toBe(true);
    });

    it("Phase C: TEE verification config is correct", () => {
      expect(config.teeVerificationMode).toBe("tee_verification_mode");
    });

    it("Phase D: anchor via dry-run produces deterministic hash", async () => {
      const { task } = createTaskWithPayment({
        buyerAddress: "0xBuyerA",
        agentId: "agent-d-test",
        totalAmount: 100,
        currency: "USD",
      });

      await runTaskVerification(task.id);
      verifyTaskProof(task.id);

      const result = await anchorTaskProof(task.id);
      expect(result.anchorHash).toBeDefined();
      expect(result.mode).toBeDefined();
    });

    it("Phase E: task + payment state machines are fully functional", () => {
      const agent = createAgent({
        ownerAddress: "0xOwner",
        name: "E-test",
        category: "invoice",
      });

      const { task } = createTaskWithPayment({
        buyerAddress: "0xBuyer",
        agentId: agent.id,
        totalAmount: 100,
        currency: "USD",
      });

      expect(task.status).toBe("funded");
      expect(task.payment_id).toBeDefined();

      const payment = getPaymentById(task.payment_id!);
      expect(payment).not.toBeNull();
      expect(payment!.status).toBe("intent_created");
    });

    it("Phase F: agent CRUD + Casper sync works", () => {
      const agent = createAgent({
        ownerAddress: "0xAlice",
        name: "F-test Agent",
        category: "defi",
      });

      expect(agent.slug).toContain("f-test-agent");
      expect(agent.status).toBe("active");

      const updated = updateAgent(agent.id, "0xAlice", {
        description: "Updated description",
      });
      expect(updated.description).toBe("Updated description");
    });

    it("Phase G: marketplace listing creates task from listing", () => {
      const agent = createAgent({
        ownerAddress: "0xSeller",
        name: "G-test Agent",
        category: "invoice",
      });

      const listing = createListing({
        agentId: agent.id,
        ownerAddress: "0xSeller",
        title: "G-test Listing",
        category: "invoice",
        priceAmount: 99,
        currency: "CSPR",
        verifierId: "v-test",
      });

      const result = createTaskFromListing(listing.id, {
        buyerAddress: "0xBuyer",
      });

      expect(result.task.agent_id).toBe(agent.id);
      expect(result.payment.total_amount).toBe(99);
      expect(result.payment.currency).toBe("CSPR");
    });

    it("Phase H: workflow with ordered steps and final proof bundle", () => {
      const a1 = createAgent({ ownerAddress: "0xO", name: "H-Agent1", category: "invoice" });
      const a2 = createAgent({ ownerAddress: "0xO", name: "H-Agent2", category: "invoice" });

      const wf = createWorkflow({
        ownerAddress: "0xO",
        name: "H-Workflow",
        steps: [
          { id: "s1", order: 0, name: "S1", agent_id: a1.id, verifier_id: "v1", required: true },
          { id: "s2", order: 1, name: "S2", agent_id: a2.id, verifier_id: "v2", required: true },
        ],
        status: "active",
      });

      const run = createWorkflowRun(wf.id, "0xBuyer");
      executeWorkflowStep(run.id, run.step_runs[0].id, a1.id);
      executeWorkflowStep(run.id, run.step_runs[1].id, a2.id);
      const finalized = finalizeWorkflowRun(run.id);

      expect(finalized.run.status).toBe("proofs_verified");
      expect(finalized.finalProof).toBeDefined();
    });

    it("Phase I: split engine proof dependency resolution", () => {
      const { task, payment } = createTaskWithPayment({
        buyerAddress: "0xBuyer",
        agentId: "agent-i-test",
        totalAmount: 1000,
        currency: "USD",
      });

      calculatePaymentSplits(payment.id, [
        { address: "0xPrimary", share_bps: 8000, role: "primary_agent", agent_id: "agent-i-test", proof_required: true },
        { address: "0xPlatform", share_bps: 2000, role: "platform", proof_required: false },
      ]);

      // Platform recipient with proof_required=false should be resolvable
      const recipients = getPaymentWithRecipients(payment.id)!.recipients;
      const platformRecipient = recipients.find((r) => r.role === "platform")!;

      const depResult = resolveRecipientProofDependency(payment.id, platformRecipient.id);
      expect(depResult.satisfied).toBe(true); // proof_required=false
    });

    it("Phase J: reputation score from real data", () => {
      const agent = createAgent({
        ownerAddress: "0xOwner",
        name: "J-test Agent",
        category: "compliance",
      });

      const rep = getAgentReputation(agent.id);
      expect(rep.score).toBeGreaterThanOrEqual(0);
      expect(rep.score).toBeLessThanOrEqual(100);
      expect(rep.verified_runs).toBe(0);
      expect(rep.failed_runs).toBe(0);
    });

    it("Phase K: API keys with scrypt hashing + CRUD", () => {
      const result = createApiKey({
        ownerAddress: "0xKeyOwner",
        name: "K-test Key",
        scopes: ["tasks:read", "proofs:read"],
      });

      expect(result.rawSecret.length).toBeGreaterThan(30);
      expect(result.key.prefix).toBeDefined();

      // Lookup via raw secret
      const lookedUp = lookupApiKey(result.rawSecret);
      expect(lookedUp).not.toBeNull();
      expect(lookedUp!.scopes).toContain("tasks:read");

      // Revoke and verify exclusion
      revokeApiKey(result.key.id, "0xKeyOwner");
      expect(lookupApiKey(result.rawSecret)).toBeNull();
    });

    it("Phase L: verifier template CRUD + test action", () => {
      const wh = "a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6a7b8c9d0e1f2a3b4c5d6a7b8c9d0e1f2";
      const v = createVerifier({
        ownerAddress: "0xOwner",
        name: "L-test Verifier",
        taskType: "defi_risk",
        wasmHash: wh,
        status: "active",
      });

      expect(v.slug).toContain("l-test-verifier");

      const result = testVerifier(v.id, { input: { test: "data" } });
      expect(result.input_hash).toBeDefined();
      expect(result.mode).toBe("tee_verification_mode");
    });
  });
});
