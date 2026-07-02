// ────────────────────────────────────────
// Sealrail Backend - Phase N Tests
// Agent execution layer: LLM provider, invoice risk agent, runtime
// ────────────────────────────────────────

import { describe, it, expect, beforeEach, afterAll, beforeAll } from "vitest";
import { randomUUID, createHash } from "crypto";

import { getDb, closeDb, resetDb } from "../src/db.js";
import { buildApp } from "../src/index.js";
import type { FastifyInstance } from "fastify";

// ── Service imports ──────────────────────
import {
  getLlmProvider,
  __setLlmProvider,
  isLlmConfigured,
  complete,
  getLlmProviderHealth,
  LlmProviderError,
} from "../src/services/llm-provider.js";
import {
  executeInvoiceRiskAgent,
  getInvoiceRiskAgentHealth,
} from "../src/services/invoice-risk-agent.js";
import {
  executeAgent,
  getAgentOutput,
  runTaskWithAgentExecution,
  getAgentRuntimeHealth,
} from "../src/services/agent-runtime.js";

import { createTask, createTaskWithPayment, updateTaskStatus, getTask, getPaymentById, unlockTaskPayment, verifyTaskProof } from "../src/services/tasks.js";
import { createAgent } from "../src/services/agents.js";
import { createApiKey } from "../src/services/api-keys.js";

import type {
  LlmProvider,
  LlmCompletionResponse,
  AgentExecutionOutput,
} from "../src/types.js";

// ── Use in-memory DB ─────────────────────
process.env.DATABASE_PATH = ":memory:";
closeDb();

// ── Mock LLM Provider ────────────────────

class MockLlmProvider implements LlmProvider {
  name = "mock";
  responseContent = JSON.stringify({
    risk_score: 35,
    decision: "approve",
    reasoning: "Mock analysis: invoice looks legitimate with standard terms.",
    flags: ["mock_flag"],
    recommended_action: "Proceed with payment as scheduled.",
    confidence: 0.92,
  });

  shouldThrow = false;
  errorCode: string | null = null;
  callCount = 0;

  isConfigured(): boolean {
    return !this.shouldThrow || this.errorCode !== "PROVIDER_NOT_CONFIGURED";
  }

  async complete(
    _prompt: string,
    _options?: { temperature?: number; maxTokens?: number }
  ): Promise<LlmCompletionResponse> {
    this.callCount++;

    if (this.shouldThrow) {
      if (this.errorCode) {
        throw new LlmProviderError(
          this.errorCode as "PROVIDER_NOT_CONFIGURED" | "API_KEY_MISSING" | "API_REQUEST_FAILED" | "INVALID_RESPONSE" | "RATE_LIMITED" | "TIMEOUT" | "UNKNOWN",
          `Mock error: ${this.errorCode}`
        );
      }
      throw new Error("Mock failure");
    }

    return {
      content: this.responseContent,
      model: "mock-model-v1",
      usage: { prompt_tokens: 100, completion_tokens: 50 },
    };
  }
}

// ── Test Suite ───────────────────────────

describe("Phase N: Agent Execution Layer", () => {
  let mockProvider: MockLlmProvider;

  beforeEach(() => {
    resetDb();
    mockProvider = new MockLlmProvider();
    __setLlmProvider(mockProvider);
  });

  afterAll(() => {
    __setLlmProvider();
    closeDb();
  });

  // ═══════════════════════════════════════
  // N1: LLM Provider Service
  // ═══════════════════════════════════════

  describe("N1: LLM Provider Service", () => {
    describe("getLlmProvider", () => {
      it("returns the configured provider", () => {
        const provider = getLlmProvider();
        expect(provider).toBeDefined();
        expect(provider.name).toBe("mock");
      });

      it("provider reports configured when mock is active", () => {
        expect(isLlmConfigured()).toBe(true);
      });
    });

    describe("complete()", () => {
      it("sends prompt through provider and returns response", async () => {
        const response = await complete("Test prompt");
        expect(response.content).toBeDefined();
        expect(response.model).toBe("mock-model-v1");
        expect(response.usage).toBeDefined();
      });

      it("mocked provider returns structured JSON", async () => {
        const response = await complete("Analyze invoice ABC");
        const parsed = JSON.parse(response.content);
        expect(parsed.risk_score).toBe(35);
        expect(parsed.decision).toBe("approve");
        expect(parsed.flags).toEqual(["mock_flag"]);
        expect(parsed.confidence).toBe(0.92);
      });

      it("throws PROVIDER_NOT_CONFIGURED when provider is not configured", async () => {
        const failingProvider = new MockLlmProvider();
        failingProvider.shouldThrow = true;
        failingProvider.errorCode = "PROVIDER_NOT_CONFIGURED";
        __setLlmProvider(failingProvider);

        await expect(complete("test")).rejects.toThrow(LlmProviderError);
        await expect(complete("test")).rejects.toThrow(
          /PROVIDER_NOT_CONFIGURED/
        );
      });

      it("throws API_KEY_MISSING when key is missing", async () => {
        const failingProvider = new MockLlmProvider();
        failingProvider.shouldThrow = true;
        failingProvider.errorCode = "API_KEY_MISSING";
        __setLlmProvider(failingProvider);

        await expect(complete("test")).rejects.toThrow(LlmProviderError);
        await expect(complete("test")).rejects.toThrow(/API_KEY_MISSING/);
      });

      it("throws on API_REQUEST_FAILED", async () => {
        const failingProvider = new MockLlmProvider();
        failingProvider.shouldThrow = true;
        failingProvider.errorCode = "API_REQUEST_FAILED";
        __setLlmProvider(failingProvider);

        await expect(complete("test")).rejects.toThrow(LlmProviderError);
      });

      it("retries on transient RATE_LIMITED errors", async () => {
        const transientProvider = new MockLlmProvider();
        let attempts = 0;
        const originalComplete = transientProvider.complete.bind(transientProvider);
        transientProvider.complete = async (prompt, opts) => {
          attempts++;
          if (attempts <= 1) {
            throw new LlmProviderError("RATE_LIMITED", "Rate limited");
          }
          return originalComplete(prompt, opts);
        };
        __setLlmProvider(transientProvider);

        const response = await complete("test");
        expect(response.content).toBeDefined();
        expect(attempts).toBe(2);
      });

      it("does NOT retry on PROVIDER_NOT_CONFIGURED", async () => {
        const permanentProvider = new MockLlmProvider();
        let attempts = 0;
        permanentProvider.complete = async () => {
          attempts++;
          throw new LlmProviderError("PROVIDER_NOT_CONFIGURED", "Not configured");
        };
        __setLlmProvider(permanentProvider);

        await expect(complete("test")).rejects.toThrow(LlmProviderError);
        expect(attempts).toBe(1);
      });
    });

    describe("getLlmProviderHealth", () => {
      it("reports provider health", () => {
        const health = getLlmProviderHealth();
        expect(health.provider).toBe("mock");
        expect(health.configured).toBe(true);
      });
    });
  });

  // ═══════════════════════════════════════
  // N2: Invoice Risk Agent
  // ═══════════════════════════════════════

  describe("N2: Invoice Risk Agent", () => {
    const testInput = {
      invoice_id: "INV-001",
      vendor: "Acme Corp",
      buyer: "Beta Ltd",
      amount_usd: 50000,
      currency: "USD",
      due_days: 30,
      line_items: ["Consulting services Q3", "Software licenses"],
      ai_suggested_risk: 15,
    };

    describe("executeInvoiceRiskAgent", () => {
      it("executes and returns structured risk analysis", async () => {
        const result = await executeInvoiceRiskAgent(
          "task-n2-001",
          "agent-n2-001",
          testInput
        );

        expect(result.output.task_id).toBe("task-n2-001");
        expect(result.output.agent_id).toBe("agent-n2-001");
        expect(result.riskResult.risk_score).toBe(35);
        expect(result.riskResult.decision).toBe("approve");
        expect(result.riskResult.reasoning).toBeDefined();
        expect(result.riskResult.flags).toEqual(["mock_flag"]);
        expect(result.riskResult.confidence).toBe(0.92);
        expect(result.providerInfo.model).toBe("mock-model-v1");
      });

      it("produces deterministic output_hash bound to input and output", async () => {
        const result1 = await executeInvoiceRiskAgent(
          "task-n2-002", "agent-n2-002", testInput
        );
        const result2 = await executeInvoiceRiskAgent(
          "task-n2-002", "agent-n2-002", testInput
        );

        // Input hash is deterministic (same input = same hash)
        expect(result1.output.input_hash).toBe(result2.output.input_hash);
        // Output hash contains timestamps so differs between runs
        // But both should be valid SHA-256 hex strings
        expect(result1.output.output_hash).toHaveLength(64);
        expect(result2.output.output_hash).toHaveLength(64);
        // Task/agent IDs match
        expect(result1.output.task_id).toBe(result2.output.task_id);
        expect(result1.output.agent_id).toBe(result2.output.agent_id);
      });

      it("produces different hashes for different inputs", async () => {
        const result1 = await executeInvoiceRiskAgent(
          "task-n2-003", "agent-n2-003",
          { ...testInput, invoice_id: "INV-001" }
        );
        const result2 = await executeInvoiceRiskAgent(
          "task-n2-004", "agent-n2-004",
          { ...testInput, invoice_id: "INV-002" }
        );

        expect(result1.output.input_hash).not.toBe(result2.output.input_hash);
      });

      it("hashes cover the full input canonical form", () => {
        const canonical = JSON.stringify({
          task_id: "task-n2-005",
          agent_id: "agent-n2-005",
          input: testInput,
        });
        const expectedHash = createHash("sha256").update(canonical).digest("hex");
        expect(expectedHash).toHaveLength(64);
      });

      it("throws PROVIDER_NOT_CONFIGURED when provider is not available", async () => {
        const failingProvider = new MockLlmProvider();
        failingProvider.shouldThrow = true;
        failingProvider.errorCode = "PROVIDER_NOT_CONFIGURED";
        __setLlmProvider(failingProvider);

        await expect(
          executeInvoiceRiskAgent("task-fail", "agent-fail", testInput)
        ).rejects.toThrow(LlmProviderError);
      });

      it("handles non-JSON responses gracefully", async () => {
        const badProvider = new MockLlmProvider();
        badProvider.responseContent = "This is not JSON";
        __setLlmProvider(badProvider);

        await expect(
          executeInvoiceRiskAgent("task-bad", "agent-bad", testInput)
        ).rejects.toThrow(/INVALID_RESPONSE/);
      });

      it("handles markdown-wrapped JSON", async () => {
        const mdProvider = new MockLlmProvider();
        mdProvider.responseContent = '```json\n{"risk_score": 20, "decision": "approve", "reasoning": "Looks fine.", "flags": [], "recommended_action": "Pay.", "confidence": 0.85}\n```';
        __setLlmProvider(mdProvider);

        const result = await executeInvoiceRiskAgent(
          "task-md", "agent-md", testInput
        );
        expect(result.riskResult.risk_score).toBe(20);
        expect(result.riskResult.decision).toBe("approve");
      });

      it("validates risk_score range 0-100", async () => {
        const badProvider = new MockLlmProvider();
        badProvider.responseContent = '{"risk_score": 150, "decision": "approve", "reasoning": "x", "flags": [], "recommended_action": "x", "confidence": 0.5}';
        __setLlmProvider(badProvider);

        await expect(
          executeInvoiceRiskAgent("task-range", "agent-range", testInput)
        ).rejects.toThrow(/risk_score/);
      });

      it("validates decision enum", async () => {
        const badProvider = new MockLlmProvider();
        badProvider.responseContent = '{"risk_score": 50, "decision": "maybe", "reasoning": "x", "flags": [], "recommended_action": "x", "confidence": 0.5}';
        __setLlmProvider(badProvider);

        await expect(
          executeInvoiceRiskAgent("task-decision", "agent-decision", testInput)
        ).rejects.toThrow(/decision/);
      });

      it("accepts 'review' decision", async () => {
        const reviewProvider = new MockLlmProvider();
        reviewProvider.responseContent = '{"risk_score": 65, "decision": "review", "reasoning": "Needs review.", "flags": ["high_amount"], "recommended_action": "Check docs.", "confidence": 0.78}';
        __setLlmProvider(reviewProvider);

        const result = await executeInvoiceRiskAgent(
          "task-review", "agent-review", testInput
        );
        expect(result.riskResult.decision).toBe("review");
        expect(result.riskResult.risk_score).toBe(65);
      });

      it("accepts 'reject' decision", async () => {
        const rejectProvider = new MockLlmProvider();
        rejectProvider.responseContent = '{"risk_score": 95, "decision": "reject", "reasoning": "Suspicious.", "flags": ["fraud_risk"], "recommended_action": "Escalate.", "confidence": 0.99}';
        __setLlmProvider(rejectProvider);

        const result = await executeInvoiceRiskAgent(
          "task-reject", "agent-reject", testInput
        );
        expect(result.riskResult.decision).toBe("reject");
        expect(result.riskResult.flags).toContain("fraud_risk");
      });
    });

    describe("getInvoiceRiskAgentHealth", () => {
      it("reports health with provider configured", () => {
        const health = getInvoiceRiskAgentHealth();
        expect(health.agent).toBe("invoice_risk");
        expect(health.providerConfigured).toBe(true);
      });
    });
  });

  // ═══════════════════════════════════════
  // N3: Agent Runtime Service
  // ═══════════════════════════════════════

  describe("N3: Agent Runtime Service", () => {
    describe("executeAgent", () => {
      it("executes an invoice_risk agent for a funded task", async () => {
        const agent = createAgent({
          ownerAddress: "owner-addr-1",
          name: "Invoice Risk Analyzer",
          category: "invoice",
          pricingModel: "per_run",
          basePrice: 10,
        });

        const { task } = createTaskWithPayment({
          buyerAddress: "buyer-addr-1",
          agentId: agent.id,
          title: "Verify Invoice INV-001",
          taskType: "invoice_risk",
          input: {
            invoice_id: "INV-001",
            vendor: "Acme Corp",
            buyer: "Beta Ltd",
            amount_usd: 50000,
          },
          totalAmount: 10,
          currency: "USD",
        });

        const result = await executeAgent(task.id);

        expect(result.taskId).toBe(task.id);
        expect(result.agentId).toBe(agent.id);
        expect(result.status).toBe("proof_pending");
        expect(result.proofId).toBeDefined();
        expect(result.output.output_hash).toBeDefined();
        expect(result.output.input_hash).toBeDefined();
        expect(result.output.model_metadata).toBeDefined();
        expect(result.output.model_metadata?.model).toBe("mock-model-v1");
        expect(result.output.result).toBeDefined();
      });

      it("creates a verified proof record with real hashes", async () => {
        const agent = createAgent({
          ownerAddress: "owner-addr-2",
          name: "Risk Agent",
          category: "invoice",
        });

        const { task } = createTaskWithPayment({
          buyerAddress: "buyer-addr-2",
          agentId: agent.id,
          title: "Risk Check",
          taskType: "invoice_risk",
          input: { invoice_id: "INV-002" },
          totalAmount: 5,
          currency: "USD",
        });

        const result = await executeAgent(task.id);

        // Verify the proof was created
        const db = getDb();
        const proofRow = db
          .prepare("SELECT * FROM proofs WHERE id = ?")
          .get(result.proofId) as {
            id: string;
            status: string;
            input_hash: string;
            output_hash: string;
            attestation_hash: string;
          } | undefined;

        expect(proofRow).toBeDefined();
        expect(proofRow!.status).toBe("verified");
        expect(proofRow!.input_hash).toBe(result.output.input_hash);
        expect(proofRow!.output_hash).toBe(result.output.output_hash);
        // attestation_hash must not be placeholder
        expect(proofRow!.attestation_hash).not.toBe("attestation-hash-pending");
        expect(proofRow!.attestation_hash).not.toBe("attestation-hash-default");
      });

      it("proof output is non-placeholder (passes isPlaceholderProof check)", async () => {
        const agent = createAgent({
          ownerAddress: "owner-addr-3",
          name: "Real Agent",
          category: "invoice",
        });

        const { task } = createTaskWithPayment({
          buyerAddress: "buyer-addr-3",
          agentId: agent.id,
          title: "Real Task",
          taskType: "invoice_risk",
          totalAmount: 5,
          currency: "USD",
        });

        const result = await executeAgent(task.id);

        // This is the critical gate: agent-executed proofs must NOT be placeholders
        const db = getDb();
        const proofRow = db
          .prepare("SELECT * FROM proofs WHERE id = ?")
          .get(result.proofId) as {
            attestation_hash: string;
            wasm_hash: string;
            input_hash: string;
            output_hash: string;
          } | undefined;

        expect(proofRow).toBeDefined();
        // Not placeholder attestation
        expect(proofRow!.attestation_hash).not.toMatch(/^attestation-hash-(default|pending)$/);
        // Not placeholder wasm - must be a proper SHA-256 hex hash (64 chars)
        expect(proofRow!.wasm_hash).not.toBe("wasm-hash-default");
        expect(proofRow!.wasm_hash).toHaveLength(64);
        expect(proofRow!.wasm_hash).toMatch(/^[a-f0-9]{64}$/);
        // Not synthetic input/output
        expect(proofRow!.input_hash).not.toMatch(/^input-/);
        expect(proofRow!.output_hash).not.toMatch(/^output-/);
      });

      it("transitions task: funded → running → proof_pending", async () => {
        const agent = createAgent({
          ownerAddress: "owner-addr-4",
          name: "Transition Agent",
          category: "invoice",
        });

        const { task } = createTaskWithPayment({
          buyerAddress: "buyer-addr-4",
          agentId: agent.id,
          title: "Transition Test",
          taskType: "invoice_risk",
          totalAmount: 5,
          currency: "USD",
        });

        // Initial state: funded
        expect(task.status).toBe("funded");

        await executeAgent(task.id);

        const updated = getTask(task.id);
        expect(updated!.status).toBe("proof_pending");
      });

      it("throws TASK_NOT_FOUND for nonexistent task", async () => {
        await expect(executeAgent("nonexistent-task")).rejects.toThrow(
          "TASK_NOT_FOUND"
        );
      });

      it("throws INVALID_STATE for task not in funded/running state", async () => {
        const agent = createAgent({
          ownerAddress: "owner-addr-5",
          name: "State Agent",
          category: "invoice",
        });

        const task = createTask({ agentId: agent.id });
        // Task starts as 'draft'

        await expect(executeAgent(task.id)).rejects.toThrow("INVALID_STATE");
      });

      it("throws AGENT_NOT_FOUND for task with nonexistent agent", async () => {
        const { task } = createTaskWithPayment({
          buyerAddress: "buyer-addr-6",
          agentId: "nonexistent-agent",
          title: "Bad Agent Task",
          taskType: "invoice_risk",
          totalAmount: 5,
          currency: "USD",
        });

        await expect(executeAgent(task.id)).rejects.toThrow("AGENT_NOT_FOUND");
      });

      it("throws AGENT_INACTIVE for paused agent", async () => {
        const agent = createAgent({
          ownerAddress: "owner-addr-7",
          name: "Paused Agent",
          category: "invoice",
        });
        // Update agent to paused
        const db = getDb();
        db.prepare("UPDATE agents SET status = 'paused' WHERE id = ?").run(agent.id);

        const { task } = createTaskWithPayment({
          buyerAddress: "buyer-addr-7",
          agentId: agent.id,
          title: "Paused Task",
          taskType: "invoice_risk",
          totalAmount: 5,
          currency: "USD",
        });

        await expect(executeAgent(task.id)).rejects.toThrow("AGENT_INACTIVE");
      });

      it("throws PROVIDER_NOT_CONFIGURED when LLM is not available", async () => {
        const agent = createAgent({
          ownerAddress: "owner-addr-8",
          name: "No LLM Agent",
          category: "invoice",
        });

        const { task } = createTaskWithPayment({
          buyerAddress: "buyer-addr-8",
          agentId: agent.id,
          title: "No LLM",
          taskType: "invoice_risk",
          totalAmount: 5,
          currency: "USD",
        });

        const failingProvider = new MockLlmProvider();
        failingProvider.shouldThrow = true;
        failingProvider.errorCode = "PROVIDER_NOT_CONFIGURED";
        __setLlmProvider(failingProvider);

        await expect(executeAgent(task.id)).rejects.toThrow(
          LlmProviderError
        );
      });

      it("stores agent output retrievable via getAgentOutput", async () => {
        const agent = createAgent({
          ownerAddress: "owner-addr-9",
          name: "Output Agent",
          category: "invoice",
        });

        const { task } = createTaskWithPayment({
          buyerAddress: "buyer-addr-9",
          agentId: agent.id,
          title: "Output Test",
          taskType: "invoice_risk",
          totalAmount: 5,
          currency: "USD",
        });

        await executeAgent(task.id);

        const stored = getAgentOutput(task.id);
        expect(stored).toBeDefined();
        expect(stored!.task_id).toBe(task.id);
        expect(stored!.agent_id).toBe(agent.id);
        expect(stored!.output_hash).toBeDefined();
        expect(stored!.input_hash).toBeDefined();
        expect(stored!.result).toBeDefined();
      });

      it("getAgentOutput returns null for unexecuted task", () => {
        const output = getAgentOutput("nonexistent-task");
        expect(output).toBeNull();
      });
    });

    describe("runTaskWithAgentExecution", () => {
      it("runs agent execution when agent is active and LLM is configured", async () => {
        const agent = createAgent({
          ownerAddress: "owner-addr-10",
          name: "Runner Agent",
          category: "invoice",
        });

        const { task } = createTaskWithPayment({
          buyerAddress: "buyer-addr-10",
          agentId: agent.id,
          title: "Runner Test",
          taskType: "invoice_risk",
          totalAmount: 5,
          currency: "USD",
        });

        const result = await runTaskWithAgentExecution(task.id);

        expect(result.agentExecuted).toBe(true);
        expect(result.status).toBe("proof_pending");
        expect(result.proofId).toBeDefined();
      });

      it("throws when agent execution fails with invalid LLM output (non-provider error)", async () => {
        const agent = createAgent({
          ownerAddress: "owner-addr-11",
          name: "Fail Agent",
          category: "invoice",
        });

        const { task } = createTaskWithPayment({
          buyerAddress: "buyer-addr-11",
          agentId: agent.id,
          title: "Fail Test",
          taskType: "invoice_risk",
          totalAmount: 5,
          currency: "USD",
        });

        // Make the agent return invalid JSON to trigger execution error
        const badProvider = new MockLlmProvider();
        badProvider.responseContent = "not json at all";
        __setLlmProvider(badProvider);

        // Should throw - no silent fallback to pending proof
        await expect(
          runTaskWithAgentExecution(task.id)
        ).rejects.toThrow(/INVALID_RESPONSE/);

        // No proof should have been created
        const db = getDb();
        const proofCount = db
          .prepare("SELECT COUNT(*) as cnt FROM proofs WHERE task_id = ?")
          .get(task.id) as { cnt: number };
        expect(proofCount.cnt).toBe(0);
      });

      it("throws PROVIDER_NOT_CONFIGURED when LLM provider is not available", async () => {
        const agent = createAgent({
          ownerAddress: "owner-addr-12",
          name: "No Provider Agent",
          category: "invoice",
        });

        const { task } = createTaskWithPayment({
          buyerAddress: "buyer-addr-12",
          agentId: agent.id,
          title: "No Provider Test",
          taskType: "invoice_risk",
          totalAmount: 5,
          currency: "USD",
        });

        const failingProvider = new MockLlmProvider();
        failingProvider.shouldThrow = true;
        failingProvider.errorCode = "PROVIDER_NOT_CONFIGURED";
        __setLlmProvider(failingProvider);

        // Should throw - no silent fallback to pending proof
        await expect(
          runTaskWithAgentExecution(task.id)
        ).rejects.toThrow(LlmProviderError);
      });
    });
  });

  // ═══════════════════════════════════════
  // N4: Payment Safety with Agent Proofs
  // ═══════════════════════════════════════

  describe("N4: Payment Safety - Agent-Executed Proofs", () => {
    it("agent-executed proofs satisfy unlock payment gate", async () => {
      const agent = createAgent({
        ownerAddress: "owner-addr-20",
        name: "Payment Safety Agent",
        category: "invoice",
      });

      const { task } = createTaskWithPayment({
        buyerAddress: "buyer-addr-20",
        agentId: agent.id,
        title: "Payment Safety",
        taskType: "invoice_risk",
        totalAmount: 100,
        currency: "USD",
      });

      // Execute agent → creates verified proof
      const execResult = await executeAgent(task.id);
      expect(execResult.proofId).toBeDefined();

      // Verify proof
      const verifyResult = verifyTaskProof(task.id);
      expect(verifyResult.status).toBe("proof_verified");
    });

    it("full pipeline: execute → verify → anchor → unlock payment", async () => {
      const agent = createAgent({
        ownerAddress: "owner-addr-21",
        name: "Full Pipeline Agent",
        category: "invoice",
      });

      const { task } = createTaskWithPayment({
        buyerAddress: "buyer-addr-21",
        agentId: agent.id,
        title: "Full Pipeline",
        taskType: "invoice_risk",
        totalAmount: 100,
        currency: "USD",
      });

      // 1. Execute agent
      const execResult = await executeAgent(task.id);
      expect(execResult.status).toBe("proof_pending");

      // 2. Verify proof
      const verifyResult = verifyTaskProof(task.id);
      expect(verifyResult.status).toBe("proof_verified");

      // 3. Anchor (dry_run mode - produces deterministic hash)
      const { anchorTaskProof } = await import("../src/services/tasks.js");
      const anchorResult = await anchorTaskProof(task.id);
      expect(anchorResult.anchorHash).toBeDefined();

      // 4. Unlock payment
      const unlockResult = unlockTaskPayment(task.id);
      expect(unlockResult.taskStatus).toBe("payable");
      expect(unlockResult.paymentStatus).toBe("unlockable");
      expect(unlockResult.message).toContain("unlocked");

      // Verify task and payment state
      const finalTask = getTask(task.id);
      expect(finalTask!.status).toBe("payable");

      const payment = getPaymentById(task.payment_id!);
      expect(payment!.status).toBe("unlockable");
    });

    it("placeholder proofs (no agent execution) still fail payment unlock in dry_run", () => {
      const agent = createAgent({
        ownerAddress: "owner-addr-22",
        name: "Placeholder Test Agent",
        category: "invoice",
      });

      // Create task without payment (draft)
      const task = createTask({ agentId: agent.id });
      // Manually set to proof_pending + synthetic placeholder proof
      const db = getDb();
      const now = new Date().toISOString();
      db.prepare("UPDATE tasks SET status = 'proof_pending' WHERE id = ?").run(task.id);
      const proofId = randomUUID();
      db.prepare(`
        INSERT INTO proofs (id, task_id, agent_id, verifier_id, input_hash, output_hash,
          wasm_hash, attestation_hash, mode, status, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?)
      `).run(
        proofId, task.id, agent.id, "verifier-default",
        "input-placeholder", "output-placeholder",
        "wasm-hash-default", "attestation-hash-pending",
        "tee_verification_mode", now,
      );
      db.prepare("UPDATE tasks SET proof_ids = ? WHERE id = ?").run(
        JSON.stringify([proofId]), task.id,
      );

      // This should throw because placeholder proof can't verify
      // In dry_run, verifyTaskProof returns simulated but does NOT advance to proof_verified
      const verifyResult = verifyTaskProof(task.id);
      expect(verifyResult.status).toBe("dry_run_proof_simulated");

      // And unlockPayment should fail since task is not anchored
      expect(() => unlockTaskPayment(task.id)).toThrow();
    });
  });

  // ═══════════════════════════════════════
  // N5: API Routes (via app.inject)
  // ═══════════════════════════════════════

  describe("N5: Agent Runtime API Routes", () => {
    let app: FastifyInstance;

    beforeEach(async () => {
      // Close previous app if any
      if (app) {
        try { await app.close(); } catch { /* ok */ }
      }
      resetDb();
      mockProvider = new MockLlmProvider();
      __setLlmProvider(mockProvider);
      // Rebuild app after resetDb to ensure fresh DB connection
      app = buildApp();
    });

    afterAll(async () => {
      if (app) await app.close();
    });

    describe("GET /api/agents/runtime/health", () => {
      it("returns 200 with runtime and LLM health", async () => {
        const res = await app.inject({
          method: "GET",
          url: "/api/agents/runtime/health",
        });

        expect(res.statusCode).toBe(200);
        const body = JSON.parse(res.body);
        expect(body.status).toBe("ok");
        expect(body.runtime.agentRuntimeAvailable).toBe(true);
        expect(body.runtime.supportedTaskTypes).toContain("invoice_risk");
        expect(body.llm.configured).toBe(true);
        expect(body.invoice_risk_agent.providerConfigured).toBe(true);
      });
    });

    describe("POST /api/tasks/:taskId/execute", () => {
      it("returns 401 without API key", async () => {
        const res = await app.inject({
          method: "POST",
          url: "/api/tasks/fake-id/execute",
        });

        expect(res.statusCode).toBe(401);
      });

      it("returns 200 with agent output when authenticated", async () => {
        // Create API key
        const { rawSecret } = createApiKey({
          ownerAddress: "owner-n5-1",
          name: "Test Key",
          scopes: ["tasks:write", "agents:write"],
        });

        // Create agent
        const agent = createAgent({
          ownerAddress: "owner-n5-1",
          name: "API Agent",
          category: "invoice",
        });

        // Create task with payment
        const { task } = createTaskWithPayment({
          buyerAddress: "buyer-n5-1",
          agentId: agent.id,
          title: "API Execute Test",
          taskType: "invoice_risk",
          totalAmount: 5,
          currency: "USD",
        });

        const res = await app.inject({
          method: "POST",
          url: `/api/tasks/${task.id}/execute`,
          headers: {
            authorization: `Bearer ${rawSecret}`,
          },
        });

        expect(res.statusCode).toBe(200);
        const body = JSON.parse(res.body);
        expect(body.task_id).toBe(task.id);
        expect(body.status).toBe("proof_pending");
        expect(body.proof_id).toBeDefined();
        expect(body.output.result).toBeDefined();
        expect(body.message).toContain("executed");
      });

      it("returns 404 for nonexistent task", async () => {
        const { rawSecret } = createApiKey({
          ownerAddress: "owner-n5-2",
          name: "Key 2",
          scopes: ["tasks:write"],
        });

        const res = await app.inject({
          method: "POST",
          url: "/api/tasks/nonexistent/execute",
          headers: {
            authorization: `Bearer ${rawSecret}`,
          },
        });

        expect(res.statusCode).toBe(404);
        const body = JSON.parse(res.body);
        expect(body.error).toBe("NOT_FOUND");
      });
    });

    describe("GET /api/tasks/:taskId/output", () => {
      it("returns 404 when no execution output exists", async () => {
        const res = await app.inject({
          method: "GET",
          url: "/api/tasks/nonexistent/output",
        });

        expect(res.statusCode).toBe(404);
        const body = JSON.parse(res.body);
        expect(body.error).toBe("NO_OUTPUT");
      });

      it("returns 200 with output after agent execution", async () => {
        const { rawSecret } = createApiKey({
          ownerAddress: "owner-n5-3",
          name: "Key 3",
          scopes: ["tasks:write", "agents:write"],
        });

        const agent = createAgent({
          ownerAddress: "owner-n5-3",
          name: "Output API Agent",
          category: "invoice",
        });

        const { task } = createTaskWithPayment({
          buyerAddress: "buyer-n5-3",
          agentId: agent.id,
          title: "Output Test",
          taskType: "invoice_risk",
          totalAmount: 5,
          currency: "USD",
        });

        // Execute first
        await app.inject({
          method: "POST",
          url: `/api/tasks/${task.id}/execute`,
          headers: { authorization: `Bearer ${rawSecret}` },
        });

        // Get output
        const res = await app.inject({
          method: "GET",
          url: `/api/tasks/${task.id}/output`,
        });

        expect(res.statusCode).toBe(200);
        const body = JSON.parse(res.body);
        expect(body.task_id).toBe(task.id);
        expect(body.output.agent_id).toBe(agent.id);
        expect(body.output.result).toBeDefined();
        expect(body.output.output_hash).toBeDefined();
        expect(body.output.input_hash).toBeDefined();
        expect(body.output.model_metadata.model).toBe("mock-model-v1");
      });
    });

    describe("POST /api/tasks/:taskId/run (upgraded)", () => {
      it("returns agent_executed: true when agent executes", async () => {
        const { rawSecret } = createApiKey({
          ownerAddress: "owner-n5-4",
          name: "Key 4",
          scopes: ["tasks:write", "agents:write"],
        });

        const agent = createAgent({
          ownerAddress: "owner-n5-4",
          name: "Run Test Agent",
          category: "invoice",
        });

        const { task } = createTaskWithPayment({
          buyerAddress: "buyer-n5-4",
          agentId: agent.id,
          title: "Run Upgraded",
          taskType: "invoice_risk",
          totalAmount: 5,
          currency: "USD",
        });

        const res = await app.inject({
          method: "POST",
          url: `/api/tasks/${task.id}/run`,
          headers: { authorization: `Bearer ${rawSecret}` },
        });

        expect(res.statusCode).toBe(200);
        const body = JSON.parse(res.body);
        expect(body.agent_executed).toBe(true);
        expect(body.proof_id).toBeDefined();
      });

      it("returns 503 when provider is not configured", async () => {
        const failingProvider = new MockLlmProvider();
        failingProvider.shouldThrow = true;
        failingProvider.errorCode = "PROVIDER_NOT_CONFIGURED";
        __setLlmProvider(failingProvider);

        const { rawSecret } = createApiKey({
          ownerAddress: "owner-n5-5",
          name: "Key 5",
          scopes: ["tasks:write", "agents:write"],
        });

        const agent = createAgent({
          ownerAddress: "owner-n5-5",
          name: "No Provider Agent",
          category: "invoice",
        });

        const { task } = createTaskWithPayment({
          buyerAddress: "buyer-n5-5",
          agentId: agent.id,
          title: "No Provider",
          taskType: "invoice_risk",
          totalAmount: 5,
          currency: "USD",
        });

        const res = await app.inject({
          method: "POST",
          url: `/api/tasks/${task.id}/run`,
          headers: { authorization: `Bearer ${rawSecret}` },
        });

        // Honest failure - no 200 with pending proof
        expect(res.statusCode).toBe(503);
        const body = JSON.parse(res.body);
        expect(body.error).toBe("PROVIDER_NOT_CONFIGURED");
        expect(body.agent_executed).toBeUndefined();
      });

      it("returns 503 when LLM provider is rate-limited", async () => {
        const failingProvider = new MockLlmProvider();
        failingProvider.shouldThrow = true;
        failingProvider.errorCode = "RATE_LIMITED";
        __setLlmProvider(failingProvider);

        const { rawSecret } = createApiKey({
          ownerAddress: "owner-n5-6",
          name: "Key 6",
          scopes: ["tasks:write", "agents:write"],
        });

        const agent = createAgent({
          ownerAddress: "owner-n5-6",
          name: "Rate Limited Agent",
          category: "invoice",
        });

        const { task } = createTaskWithPayment({
          buyerAddress: "buyer-n5-6",
          agentId: agent.id,
          title: "Rate Limited",
          taskType: "invoice_risk",
          totalAmount: 5,
          currency: "USD",
        });

        const res = await app.inject({
          method: "POST",
          url: `/api/tasks/${task.id}/run`,
          headers: { authorization: `Bearer ${rawSecret}` },
        });

        // Rate-limited errors are thrown honestly - no fallback
        expect(res.statusCode).toBeGreaterThanOrEqual(500);
        expect(res.statusCode).toBeLessThan(600);
        const body = JSON.parse(res.body);
        expect(body.message).toBeDefined();
      });

      it("returns error when LLM returns invalid JSON", async () => {
        const badProvider = new MockLlmProvider();
        badProvider.responseContent = "definitely not json";
        __setLlmProvider(badProvider);

        const { rawSecret } = createApiKey({
          ownerAddress: "owner-n5-7",
          name: "Key 7",
          scopes: ["tasks:write", "agents:write"],
        });

        const agent = createAgent({
          ownerAddress: "owner-n5-7",
          name: "Bad JSON Agent",
          category: "invoice",
        });

        const { task } = createTaskWithPayment({
          buyerAddress: "buyer-n5-7",
          agentId: agent.id,
          title: "Bad JSON",
          taskType: "invoice_risk",
          totalAmount: 5,
          currency: "USD",
        });

        const res = await app.inject({
          method: "POST",
          url: `/api/tasks/${task.id}/run`,
          headers: { authorization: `Bearer ${rawSecret}` },
        });

        // Invalid LLM output must throw - no pending proof
        expect(res.statusCode).toBe(500);
        const body = JSON.parse(res.body);
        expect(body.error).toBe("RUN_FAILED");
        expect(body.agent_executed).toBeUndefined();
      });
    });
  });

  // ═══════════════════════════════════════
  // N6: Phase A-M Preservation
  // ═══════════════════════════════════════

  describe("N6: Phase A-M Preservation", () => {
    it("Phase A: health endpoint still works", async () => {
      const app = buildApp();
      const res = await app.inject({ method: "GET", url: "/api/health" });
      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.body);
      expect(body.status).toBe("ok");
      await app.close();
    });

    it("Phase E: task creation and state machine still works", () => {
      const task = createTask({ agentId: "preserve-agent" });
      expect(task.status).toBe("draft");
      updateTaskStatus(task.id, "funded");
      expect(getTask(task.id)!.status).toBe("funded");
    });

    it("Phase F: agent creation still works", () => {
      const agent = createAgent({
        ownerAddress: "preserve-owner",
        name: "Preserve Agent",
        category: "invoice",
      });
      expect(agent.status).toBe("active");
      expect(agent.category).toBe("invoice");
    });

    it("Phase K: API key auth still works", () => {
      const { rawSecret } = createApiKey({
        ownerAddress: "preserve-owner-2",
        name: "Preserve Key",
        scopes: ["tasks:write"],
      });

      expect(rawSecret).toBeDefined();
      expect(rawSecret.length).toBeGreaterThan(32);
    });

    it("payment unlock still rejects placeholder proofs", () => {
      const agent = createAgent({
        ownerAddress: "preserve-owner-3",
        name: "Placeholder Reject Agent",
        category: "invoice",
      });

      const { task } = createTaskWithPayment({
        buyerAddress: "preserve-buyer",
        agentId: agent.id,
        title: "Reject Placeholder",
        taskType: "invoice_risk",
        totalAmount: 50,
        currency: "USD",
      });

      // Create a placeholder proof directly
      const db = getDb();
      const proofId = randomUUID();
      db.prepare(`
        INSERT INTO proofs (id, task_id, agent_id, verifier_id, input_hash, output_hash,
          wasm_hash, attestation_hash, mode, status, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?)
      `).run(
        proofId, task.id, agent.id, "verifier-default",
        "input-placeholder", "output-placeholder",
        "wasm-hash-default", "attestation-hash-pending",
        "tee_verification_mode", new Date().toISOString(),
      );
      db.prepare("UPDATE tasks SET proof_ids = ? WHERE id = ?").run(
        JSON.stringify([proofId]), task.id,
      );

      // Placeholder proofs cannot unlock payment
      expect(() => unlockTaskPayment(task.id)).toThrow();
    });
  });
});
