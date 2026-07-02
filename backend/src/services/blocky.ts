// ────────────────────────────────────────
// Sealrail Blocky Service
// Wraps TEE verification with retry logic,
// error classification, and health check.
// Phase C - Blocky adaptor interface
// ────────────────────────────────────────

import {
  verifyInvoiceRisk,
  checkTeeHealth,
} from "./tee.js";

import type {
  InvoiceRiskInput,
  VerificationResult,
  BlockyErrorCode,
  BlockyHealthStatus,
  RetryConfig,
} from "../types.js";
import { DEFAULT_RETRY_CONFIG } from "../types.js";

// ── Error classification ────────────────

/**
 * Classify a raw error into a BlockyErrorCode.
 * Used by retry logic to decide whether to retry or give up.
 */
export function classifyError(err: Error): BlockyErrorCode {
  const msg = err.message.toLowerCase();

  if (msg.includes("cli") && (msg.includes("not found") || msg.includes("not available") || msg.includes("enoent"))) {
    return "CLI_NOT_FOUND";
  }
  if (msg.includes("timeout") || msg.includes("etimedout") || msg.includes("killed")) {
    return "TIMEOUT";
  }
  if (msg.includes("attest") && (msg.includes("fail") || msg.includes("error") || msg.includes("no output"))) {
    return "ATTESTATION_FAILED";
  }
  if (msg.includes("verif") && (msg.includes("fail") || msg.includes("error") || msg.includes("no output"))) {
    return "VERIFICATION_FAILED";
  }
  if (msg.includes("code") && msg.includes("hash")) {
    return "CODE_HASH_MISSING";
  }
  if (msg.includes("task_id") && msg.includes("mismatch")) {
    return "TASK_ID_MISMATCH";
  }
  if (msg.includes("invalid") && msg.includes("output")) {
    return "INVALID_OUTPUT";
  }

  return "UNKNOWN";
}

/**
 * Determine whether an error is retryable.
 * Non-retryable: CLI_NOT_FOUND, CODE_HASH_MISSING, INVALID_OUTPUT, TASK_ID_MISMATCH
 * Retryable: TIMEOUT, ATTESTATION_FAILED, VERIFICATION_FAILED, UNKNOWN
 */
export function isRetryable(code: BlockyErrorCode): boolean {
  const nonRetryable: BlockyErrorCode[] = [
    "CLI_NOT_FOUND",
    "CODE_HASH_MISSING",
    "INVALID_OUTPUT",
    "TASK_ID_MISMATCH",
  ];
  return !nonRetryable.includes(code);
}

// ── Sleep helper ─────────────────────────

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ── Retry wrapper ────────────────────────

/**
 * Verify an invoice risk input with retry logic.
 * Retries on transient failures (timeouts, attestation/verification failures).
 * Does not retry on permanent failures (CLI not found, code hash missing, etc.).
 *
 * @param input - The invoice risk input to verify
 * @param retryConfig - Optional retry configuration (defaults to DEFAULT_RETRY_CONFIG)
 * @returns VerificationResult
 */
export async function verify(
  input: InvoiceRiskInput,
  retryConfig: RetryConfig = DEFAULT_RETRY_CONFIG
): Promise<VerificationResult> {
  let lastError: VerificationResult | null = null;

  for (let attempt = 1; attempt <= retryConfig.maxAttempts; attempt++) {
    const result = await verifyInvoiceRisk(input);

    if (result.status === "verified") {
      return result;
    }

    // Classify the error for retry decision
    const code = result.errorCode;
    lastError = result;

    if (!isRetryable(code)) {
      // Non-retryable - return immediately
      return result;
    }

    // Last attempt - don't sleep, return the error
    if (attempt >= retryConfig.maxAttempts) {
      break;
    }

    // Calculate backoff delay: initialDelay * backoffMultiplier^(attempt-1)
    const delay = Math.min(
      retryConfig.initialDelayMs * Math.pow(retryConfig.backoffMultiplier, attempt - 1),
      retryConfig.maxDelayMs
    );

    await sleep(delay);
  }

  // All retries exhausted
  return {
    status: "failed",
    errorCode: "RETRY_EXHAUSTED",
    message: `Verification failed after ${retryConfig.maxAttempts} attempts. Last error: [${lastError?.errorCode}] ${lastError?.message}`,
  };
}

// ── Health check ─────────────────────────

/**
 * Check the health of the Blocky TEE verification service.
 * Verifies CLI availability, version, and operational mode.
 */
export function healthCheck(): BlockyHealthStatus {
  const tee = checkTeeHealth();

  if (!tee.cliAvailable) {
    return {
      healthy: false,
      cliAvailable: false,
      cliVersion: null,
      mode: tee.mode,
      error: "bky-as CLI not found on PATH. Install from https://github.com/blocky/blocky-as",
    };
  }

  return {
    healthy: true,
    cliAvailable: true,
    cliVersion: tee.cliVersion,
    mode: tee.mode,
  };
}
