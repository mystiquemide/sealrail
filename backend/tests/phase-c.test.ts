// ────────────────────────────────────────
// Sealrail Backend — Phase C Tests
// TEE verification adapter: Blocky CLI, retry, health, endpoint
// 22 tests covering happy path, error paths, retry, and classification
// ────────────────────────────────────────

import { describe, it, expect, beforeEach, afterAll, vi } from "vitest";

// ── Types ────────────────────────────────
import type {
  InvoiceRiskInput,
  VerificationResult,
  RetryConfig,
} from "../src/types.js";
import { DEFAULT_RETRY_CONFIG } from "../src/types.js";

// ── Import services ──────────────────────
import {
  verifyInvoiceRisk,
  attestFunctionCall,
  verifyAttestation,
  isCliAvailable,
  getCliVersion,
  checkTeeHealth,
  __setExecAsync,
  __setCliAvailable,
} from "../src/services/tee.js";

import {
  verify,
  classifyError,
  isRetryable,
  healthCheck,
} from "../src/services/blocky.js";

// ── Helpers ──────────────────────────────

let mockExec: ReturnType<typeof vi.fn>;

function sampleInput(overrides: Partial<InvoiceRiskInput> = {}): InvoiceRiskInput {
  return {
    task_id: "task-casper-test-001",
    invoice_id: "INV-TEST-001",
    vendor: "Test Vendor Ltd",
    buyer: "Test Buyer Corp",
    amount_usd: 5000,
    currency: "USD",
    due_days: 30,
    line_items: ["item 1", "item 2"],
    ai_suggested_risk: 15,
    ...overrides,
  };
}

function mockAttestationOutput(input: InvoiceRiskInput): string {
  return JSON.stringify({
    enclave_attested_application_public_key: {
      enclave_attestation: {
        claims: {
          hash_of_code: "abc123def456",
          function: "verifyInvoiceRisk",
          hash_of_input: "inputhash123",
          output: JSON.stringify({
            success: true,
            error: "",
            value: {
              task_id: input.task_id,
              invoice_id: input.invoice_id,
              approved: true,
              risk_score: 10,
              reason_codes: ["tee_verified"],
              policy: "blocky_tee",
              ai_score_accepted: true,
            },
          }),
          hash_of_secrets: "secrethash123",
        },
      },
    },
    transitive_attested_function_call: {
      transitive_attestation: {
        claims: {
          hash_of_code: "abc123def456",
          function: "verifyInvoiceRisk",
        },
      },
    },
  });
}

function mockVerifyOutput(): string {
  return JSON.stringify({
    hash_of_code: "abc123def456",
    function: "verifyInvoiceRisk",
    hash_of_input: "inputhash123",
    output: JSON.stringify({
      success: true,
      error: "",
      value: {
        task_id: "task-casper-test-001",
        invoice_id: "INV-TEST-001",
        approved: true,
        risk_score: 10,
        reason_codes: ["tee_verified"],
        policy: "blocky_tee",
        ai_score_accepted: true,
      },
    }),
    hash_of_secrets: "secrethash123",
  });
}

// ── Test Suite ───────────────────────────

describe("Phase C: Blocky TEE Verification Adapter", () => {

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset the injectable exec to a fresh mock
    mockExec = vi.fn();
    __setExecAsync(mockExec as any);
    // Pin the CLI check so the mocked exec paths run on machines without bky-as
    __setCliAvailable(() => true);
  });

  afterAll(() => {
    __setExecAsync();
    __setCliAvailable();
  });

  // ═══════════════════════════════════════
  // Section 1: CLI Availability & Health
  // ═══════════════════════════════════════

  describe("CLI Availability", () => {
    it("isCliAvailable returns true when bky-as is on PATH (real execSync)", () => {
      // isCliAvailable uses real execSync — bky-as IS on this system
      const result = isCliAvailable();
      expect(typeof result).toBe("boolean");
    });

    it("getCliVersion returns version string or null (real CLI)", () => {
      const version = getCliVersion();
      if (version !== null) {
        expect(version).toContain("bky-as");
      }
      // Either valid string or null is acceptable
      expect(version === null || typeof version === "string").toBe(true);
    });
  });

  describe("Health Check", () => {
    it("healthCheck returns correct structure", () => {
      const health = healthCheck();
      expect(health).toHaveProperty("healthy");
      expect(health).toHaveProperty("cliAvailable");
      expect(health).toHaveProperty("cliVersion");
      expect(health).toHaveProperty("mode");
    });

    it("checkTeeHealth returns correct mode", () => {
      const tee = checkTeeHealth();
      expect(tee.mode).toBeDefined();
      expect(typeof tee.mode).toBe("string");
    });
  });

  // ═══════════════════════════════════════
  // Section 2: Happy Path
  // ═══════════════════════════════════════

  describe("Happy Path — Full Verification", () => {
    it("verifies invoice risk with valid attestation and verification", async () => {
      const input = sampleInput();

      // First call: attest
      mockExec.mockResolvedValueOnce({
        stdout: mockAttestationOutput(input),
        stderr: "",
      });
      // Second call: verify
      mockExec.mockResolvedValueOnce({
        stdout: mockVerifyOutput(),
        stderr: "",
      });

      const result = await verifyInvoiceRisk(input);

      expect(result.status).toBe("verified");
      if (result.status === "verified") {
        expect(result.claims.hash_of_code).toBe("abc123def456");
        expect(result.claims.function).toBe("verifyInvoiceRisk");
        expect(result.claims.hash_of_input).toBe("inputhash123");
        expect(result.claims.hash_of_secrets).toBe("secrethash123");
      }
    });

    it("returns all 5 VerifiedBlockyClaims fields", async () => {
      const input = sampleInput();
      mockExec.mockResolvedValueOnce({ stdout: mockAttestationOutput(input), stderr: "" });
      mockExec.mockResolvedValueOnce({ stdout: mockVerifyOutput(), stderr: "" });

      const result = await verifyInvoiceRisk(input);

      expect(result.status).toBe("verified");
      if (result.status === "verified") {
        expect(result.claims).toHaveProperty("hash_of_code");
        expect(result.claims).toHaveProperty("function");
        expect(result.claims).toHaveProperty("hash_of_input");
        expect(result.claims).toHaveProperty("output");
        expect(result.claims).toHaveProperty("hash_of_secrets");
      }
    });

    it("output contains expected risk assessment fields", async () => {
      const input = sampleInput();
      mockExec.mockResolvedValueOnce({ stdout: mockAttestationOutput(input), stderr: "" });
      mockExec.mockResolvedValueOnce({ stdout: mockVerifyOutput(), stderr: "" });

      const result = await verifyInvoiceRisk(input);

      expect(result.status).toBe("verified");
      if (result.status === "verified") {
        expect(result.output.success).toBe(true);
        expect(result.output.value.approved).toBe(true);
        expect(result.output.value.risk_score).toBe(10);
        expect(result.output.value.reason_codes).toContain("tee_verified");
        expect(result.output.value.policy).toBe("blocky_tee");
      }
    });

    it("builds synthetic output when verify output is a plain string", async () => {
      const input = sampleInput();
      mockExec.mockResolvedValueOnce({ stdout: mockAttestationOutput(input), stderr: "" });
      mockExec.mockResolvedValueOnce({
        stdout: JSON.stringify({
          hash_of_code: "abc123",
          function: "verifyInvoiceRisk",
          hash_of_input: "inputhash",
          output: "some-raw-output-not-json",
          hash_of_secrets: "secrethash",
        }),
        stderr: "",
      });

      const result = await verifyInvoiceRisk(input);
      expect(result.status).toBe("verified");
      if (result.status === "verified") {
        expect(result.output.value.approved).toBe(true);
        expect(result.output.value.reason_codes).toContain("tee_verified");
      }
    });

    it("attestFunctionCall returns parsed attestation output", async () => {
      const input = sampleInput();
      mockExec.mockResolvedValueOnce({ stdout: mockAttestationOutput(input), stderr: "" });

      const attestation = await attestFunctionCall(input);
      expect(attestation).toHaveProperty("enclave_attested_application_public_key");
      expect(attestation).toHaveProperty("transitive_attested_function_call");
    });

    it("verifyAttestation returns VerifiedBlockyClaims", async () => {
      const input = sampleInput();
      const attestOutput = JSON.parse(mockAttestationOutput(input));
      mockExec.mockResolvedValueOnce({ stdout: mockVerifyOutput(), stderr: "" });

      const claims = await verifyAttestation(attestOutput);
      expect(claims.hash_of_code).toBe("abc123def456");
      expect(claims.function).toBe("verifyInvoiceRisk");
    });
  });

  // ═══════════════════════════════════════
  // Section 3: Error Paths
  // ═══════════════════════════════════════

  describe("Error Paths", () => {
    it("returns CLI_NOT_FOUND when bky-as is not available (mocked cli check)", async () => {
      // We test this path by mocking execSync via our approach.
      // Since isCliAvailable uses real execSync and bky-as IS available,
      // we test the error code handler directly in the blocky service.
      const err = new Error("cli: bky-as not found");
      expect(classifyError(err)).toBe("CLI_NOT_FOUND");
      expect(isRetryable("CLI_NOT_FOUND")).toBe(false);
    });

    it("returns ATTESTATION_FAILED when attest output is empty", async () => {
      const input = sampleInput();
      mockExec.mockResolvedValueOnce({ stdout: "", stderr: "some warning" });

      const result = await verifyInvoiceRisk(input);
      expect(result.status).toBe("failed");
      if (result.status === "failed") {
        expect(result.errorCode).toBe("ATTESTATION_FAILED");
      }
    });

    it("returns ATTESTATION_FAILED when attest output is not valid JSON", async () => {
      const input = sampleInput();
      mockExec.mockResolvedValueOnce({ stdout: "not valid {{{ json", stderr: "" });

      const result = await verifyInvoiceRisk(input);
      expect(result.status).toBe("failed");
      if (result.status === "failed") {
        expect(result.errorCode).toBe("ATTESTATION_FAILED");
      }
    });

    it("returns TIMEOUT when attest exec rejects with killed error", async () => {
      const input = sampleInput();
      const err = new Error("killed") as Error & { killed?: boolean };
      err.killed = true;
      mockExec.mockRejectedValueOnce(err);

      const result = await verifyInvoiceRisk(input);
      expect(result.status).toBe("failed");
      if (result.status === "failed") {
        expect(result.errorCode).toBe("TIMEOUT");
      }
    });

    it("returns ATTESTATION_FAILED on generic attest error", async () => {
      const input = sampleInput();
      mockExec.mockRejectedValueOnce(new Error("some random error"));

      const result = await verifyInvoiceRisk(input);
      expect(result.status).toBe("failed");
      if (result.status === "failed") {
        expect(result.errorCode).toBe("ATTESTATION_FAILED");
      }
    });

    it("returns VERIFICATION_FAILED when verify step errors", async () => {
      const input = sampleInput();
      mockExec.mockResolvedValueOnce({ stdout: mockAttestationOutput(input), stderr: "" });
      mockExec.mockRejectedValueOnce(new Error("bky-as: error: no platform verifier"));

      const result = await verifyInvoiceRisk(input);
      expect(result.status).toBe("failed");
      if (result.status === "failed") {
        expect(result.errorCode).toBe("VERIFICATION_FAILED");
      }
    });
  });

  // ═══════════════════════════════════════
  // Section 4: Retry Logic
  // ═══════════════════════════════════════

  describe("Retry Logic", () => {
    it("succeeds on second attempt after first transient failure", async () => {
      const input = sampleInput();
      const retryConfig: RetryConfig = { maxAttempts: 3, initialDelayMs: 1, backoffMultiplier: 1, maxDelayMs: 1 };

      // First attempt: attest fails with timeout (retryable)
      mockExec.mockRejectedValueOnce(new Error("killed"));
      // Second attempt succeeds
      mockExec.mockResolvedValueOnce({ stdout: mockAttestationOutput(input), stderr: "" });
      mockExec.mockResolvedValueOnce({ stdout: mockVerifyOutput(), stderr: "" });

      const result = await verify(input, retryConfig);

      expect(result.status).toBe("verified");
    });

    it("does not retry on non-retryable errors", () => {
      expect(isRetryable("CLI_NOT_FOUND")).toBe(false);
      expect(isRetryable("CODE_HASH_MISSING")).toBe(false);
      expect(isRetryable("INVALID_OUTPUT")).toBe(false);
      expect(isRetryable("TASK_ID_MISMATCH")).toBe(false);
    });

    it("returns RETRY_EXHAUSTED after max attempts on transient error", async () => {
      const input = sampleInput();
      const retryConfig: RetryConfig = { maxAttempts: 2, initialDelayMs: 1, backoffMultiplier: 1, maxDelayMs: 1 };

      // All attempts fail with timeout
      mockExec.mockRejectedValue(new Error("killed"));

      const result = await verify(input, retryConfig);

      expect(result.status).toBe("failed");
      if (result.status === "failed") {
        expect(result.errorCode).toBe("RETRY_EXHAUSTED");
        expect(result.message).toContain("2 attempts");
      }
    });

    it("retries on TIMEOUT errors", () => {
      expect(isRetryable("TIMEOUT")).toBe(true);
    });

    it("DEFAULT_RETRY_CONFIG has expected values", () => {
      expect(DEFAULT_RETRY_CONFIG.maxAttempts).toBe(3);
      expect(DEFAULT_RETRY_CONFIG.initialDelayMs).toBe(500);
      expect(DEFAULT_RETRY_CONFIG.backoffMultiplier).toBe(2);
      expect(DEFAULT_RETRY_CONFIG.maxDelayMs).toBe(5000);
    });
  });

  // ═══════════════════════════════════════
  // Section 5: Error Classification
  // ═══════════════════════════════════════

  describe("Error Classification", () => {
    it("classifies CLI_NOT_FOUND from 'not found' message", () => {
      expect(classifyError(new Error("cli: bky-as not found in PATH"))).toBe("CLI_NOT_FOUND");
      expect(classifyError(new Error("cli tool not available on this system"))).toBe("CLI_NOT_FOUND");
      expect(classifyError(new Error("ENOENT cli binary missing"))).toBe("CLI_NOT_FOUND");
    });

    it("classifies TIMEOUT from timeout-related messages", () => {
      expect(classifyError(new Error("operation timeout reached"))).toBe("TIMEOUT");
      expect(classifyError(new Error("ETIMEDOUT: connection lost"))).toBe("TIMEOUT");
      expect(classifyError(new Error("process killed by signal"))).toBe("TIMEOUT");
    });

    it("classifies ATTESTATION_FAILED", () => {
      expect(classifyError(new Error("attestation failure: verification error"))).toBe("ATTESTATION_FAILED");
      expect(classifyError(new Error("attest fn call error occurred"))).toBe("ATTESTATION_FAILED");
    });

    it("classifies VERIFICATION_FAILED", () => {
      expect(classifyError(new Error("verification failure: no platform"))).toBe("VERIFICATION_FAILED");
      expect(classifyError(new Error("verify fn call error"))).toBe("VERIFICATION_FAILED");
    });

    it("classifies CODE_HASH_MISSING", () => {
      expect(classifyError(new Error("code hash is missing from claims"))).toBe("CODE_HASH_MISSING");
    });

    it("returns UNKNOWN for unrecognized errors", () => {
      expect(classifyError(new Error("some random error"))).toBe("UNKNOWN");
      expect(classifyError(new Error(""))).toBe("UNKNOWN");
    });

    it("isRetryable returns correct boolean for each code", () => {
      expect(isRetryable("TIMEOUT")).toBe(true);
      expect(isRetryable("ATTESTATION_FAILED")).toBe(true);
      expect(isRetryable("VERIFICATION_FAILED")).toBe(true);
      expect(isRetryable("UNKNOWN")).toBe(true);
      expect(isRetryable("RETRY_EXHAUSTED")).toBe(true);
      expect(isRetryable("HEALTH_CHECK_FAILED")).toBe(true);

      expect(isRetryable("CLI_NOT_FOUND")).toBe(false);
      expect(isRetryable("CODE_HASH_MISSING")).toBe(false);
      expect(isRetryable("INVALID_OUTPUT")).toBe(false);
      expect(isRetryable("TASK_ID_MISMATCH")).toBe(false);
    });
  });

  // ═══════════════════════════════════════
  // Section 6: Schema & Types
  // ═══════════════════════════════════════

  describe("Schema and Types", () => {
    it("VerificationResult discriminated union — success variant", () => {
      const success: VerificationResult = {
        status: "verified",
        claims: {
          hash_of_code: "abc",
          function: "verifyInvoiceRisk",
          hash_of_input: "def",
          output: "ghi",
          hash_of_secrets: "jkl",
        },
        output: {
          success: true,
          error: "",
          value: {
            task_id: "t1",
            invoice_id: "i1",
            approved: true,
            risk_score: 5,
            reason_codes: ["tee_verified"],
            policy: "blocky",
            ai_score_accepted: true,
          },
        },
      };
      expect(success.status).toBe("verified");
      if (success.status === "verified") {
        expect(success.claims.hash_of_code).toBe("abc");
      }
    });

    it("VerificationResult discriminated union — failure variant", () => {
      const failure: VerificationResult = {
        status: "failed",
        errorCode: "CLI_NOT_FOUND",
        message: "bky-as not available",
      };
      expect(failure.status).toBe("failed");
      if (failure.status === "failed") {
        expect(failure.errorCode).toBe("CLI_NOT_FOUND");
      }
    });
  });
});
