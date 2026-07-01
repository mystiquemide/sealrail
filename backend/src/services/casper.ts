// ────────────────────────────────────────
// Sealrail Casper Anchoring Adapter
// Casper provider: dry-run + testnet modes
// Phase D1-D3: provider interface, deterministic deploy hash, casper-client path
// Audit fix C2: testnet/mainnet fail-closed — simulated success removed from non-dry-run
// ────────────────────────────────────────

import { execFile, execSync } from "child_process";
import { promisify } from "util";
import { createHash, randomUUID } from "crypto";

import { config } from "../config.js";

// ── Types ────────────────────────────────

export interface AnchorProofInput {
  taskId: string;
  proofId: string;
  agentId: string;
  verifierId: string;
  hashOfCode: string;
  hashOfInput: string;
  hashOfOutput: string;
  wasmHash: string;
  teeMode: string;
}

export interface AnchorResult {
  success: boolean;
  anchorHash: string;
  mode: "dry_run" | "testnet" | "mainnet";
  /** True only for dry_run mode */
  simulated: boolean;
  deployHash?: string;
  error?: string;
}

// ── Executor (injectable for testing) ────

type ExecResult = { stdout: string; stderr: string };
type ExecFn = (cmd: string, args: string[], opts: Record<string, unknown>) => Promise<ExecResult>;

let _execAsync: ExecFn = promisify(execFile) as unknown as ExecFn;

/**
 * Override the exec function for testing.
 * Call with no arguments to restore the default.
 */
export function __setCasperExecAsync(fn?: ExecFn): void {
  if (fn) {
    _execAsync = fn;
  } else {
    _execAsync = promisify(execFile) as unknown as ExecFn;
  }
}

// ── CLI path ─────────────────────────────

const CASPER_CLIENT_BIN = "casper-client";

export function isCasperClientAvailable(): boolean {
  try {
    execSync(`which ${CASPER_CLIENT_BIN}`, { stdio: "pipe" });
    return true;
  } catch {
    return false;
  }
}

export function getCasperClientVersion(): string | null {
  try {
    const output = execSync(`${CASPER_CLIENT_BIN} --version`, { timeout: 5000 });
    return output.toString().trim();
  } catch {
    return null;
  }
}

// ── Deterministic anchor hash (dry-run) ──

/**
 * Compute a deterministic anchor hash for dry-run mode.
 * Uses SHA-256 of all proof fields + a salt derived from the task ID.
 * This hash is reproducible — same input always yields the same anchor hash.
 */
function computeDryRunAnchorHash(input: AnchorProofInput): string {
  const canonical = [
    input.taskId,
    input.proofId,
    input.agentId,
    input.verifierId,
    input.hashOfCode,
    input.hashOfInput,
    input.hashOfOutput,
    input.wasmHash,
    input.teeMode,
    // Domain separator to prevent cross-mode collision
    "sealrail-casper-anchor-dry-run-v1",
  ].join("|");

  return createHash("sha256").update(canonical).digest("hex");
}

/**
 * Create a dry-run anchor with a deterministic deploy hash.
 * No network calls — purely local computation.
 * Only mode where success: true with simulated data is acceptable.
 */
export async function createDryRunAnchor(
  input: AnchorProofInput
): Promise<AnchorResult> {
  const anchorHash = computeDryRunAnchorHash(input);

  // The deploy hash in dry-run mode is the same as the anchor hash,
  // prefixed to indicate it's a dry-run.
  const deployHash = `dry-run-${anchorHash.slice(0, 16)}`;

  return {
    success: true,
    anchorHash,
    deployHash,
    mode: "dry_run",
    simulated: true,
  };
}

// ── Testnet anchor via casper-client ─────

/**
 * Build a minimal Casper deploy that stores the anchor hash on-chain.
 * Fails closed: returns error if client is missing, account key missing, or deploy fails.
 */
async function submitCasperDeploy(
  input: AnchorProofInput
): Promise<{ deployHash: string }> {
  const anchorHash = computeDryRunAnchorHash(input);

  const paymentAmount = "100000000"; // 0.1 CSPR for gas
  const chainName = config.casperChainName;
  const nodeAddress = config.casperRpcUrl;

  // C2: Require account key — fail if missing (no simulated hashes)
  if (!config.casperAccountKeyPath) {
    throw new Error(
      "CASPER_ACCOUNT_KEY_MISSING: No Casper account key configured. " +
      "Set CASPER_ACCOUNT_KEY_PATH env var or switch to CASPER_MODE=dry_run."
    );
  }

  const args = [
    "put-deploy",
    "--chain-name", chainName,
    "--node-address", nodeAddress,
    "--secret-key", config.casperAccountKeyPath,
    "--payment-amount", paymentAmount,
    "--session-arg", `anchor_hash:string='${anchorHash}'`,
  ];

  const { stdout, stderr } = await _execAsync(
    "bash",
    ["-c", `${CASPER_CLIENT_BIN} ${args.join(" ")} 2>&1`],
    { timeout: 30000, maxBuffer: 10 * 1024 * 1024 }
  );

  const output = stdout.toString();
  // casper-client outputs the deploy hash in JSON format
  try {
    const parsed = JSON.parse(output);
    if (parsed?.result?.deploy_hash) {
      return { deployHash: parsed.result.deploy_hash };
    }
  } catch {
    // Output might not be JSON; try to extract deploy hash from text
    const match = output.match(/deploy_hash[:\s=]+"?([a-f0-9]{64})"?/i);
    if (match) {
      return { deployHash: match[1] };
    }
  }

  throw new Error(
    `CASPER_DEPLOY_PARSE_FAILED: casper-client succeeded but could not extract deploy hash. Output: ${output.slice(0, 500)}`
  );
}

/**
 * Create a testnet anchor using casper-client.
 * C2: Fails closed — missing client, missing key, or deploy error = failure.
 * No simulated success fallback in testnet mode.
 */
export async function createTestnetAnchor(
  input: AnchorProofInput
): Promise<AnchorResult> {
  // C2: Fail if casper-client is not available (no fallback)
  if (!isCasperClientAvailable()) {
    return {
      success: false,
      anchorHash: "",
      mode: "testnet",
      simulated: false,
      error: "CASPER_CLIENT_UNAVAILABLE: casper-client binary not found. Install casper-client or use CASPER_MODE=dry_run.",
    };
  }

  try {
    const { deployHash } = await submitCasperDeploy(input);

    return {
      success: true,
      anchorHash: deployHash,
      deployHash,
      mode: "testnet",
      simulated: false,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);

    // C2: Fail closed on any error — no fallback hash
    return {
      success: false,
      anchorHash: "",
      mode: "testnet",
      simulated: false,
      error: `CASPER_DEPLOY_FAILED: ${msg}`,
    };
  }
}

// ── Main anchoring entry point ───────────

/**
 * Anchor a proof to Casper (or produce a deterministic hash in dry-run mode).
 * Dispatches to dry-run or testnet mode based on config.casperMode.
 */
export async function anchorProof(input: AnchorProofInput): Promise<AnchorResult> {
  const mode = config.casperMode;

  if (mode === "dry_run") {
    return createDryRunAnchor(input);
  }

  if (mode === "testnet") {
    return createTestnetAnchor(input);
  }

  // Blocker 1: mainnet and unsupported modes must fail closed — never dry-run
  // Only dry_run mode is allowed to return simulated success.
  if (mode === "mainnet") {
    return {
      success: false,
      anchorHash: "",
      mode: "mainnet",
      simulated: false,
      error: "CASPER_MAINNET_NOT_IMPLEMENTED: Mainnet anchoring is not yet implemented. " +
        "Use CASPER_MODE=testnet for real-chain testing or CASPER_MODE=dry_run for simulation.",
    };
  }

  // Unknown/unrecognized mode — fail closed
  return {
    success: false,
    anchorHash: "",
    mode: "dry_run",
    simulated: false,
    error: `CASPER_MODE_UNKNOWN: Unsupported mode '${mode}'. Use dry_run, testnet, or mainnet.`,
  };
}

// ── Anchor verification ──────────────────

/**
 * Verify that an anchor hash exists and is valid.
 * C2: In testnet, fail honestly when client is unavailable.
 */
export async function verifyAnchor(
  anchorHash: string,
  input?: AnchorProofInput
): Promise<{ valid: boolean; error?: string }> {
  const mode = config.casperMode;

  if (mode === "dry_run") {
    // Dry-run: re-compute and compare
    if (!input) {
      return { valid: false, error: "Cannot verify dry-run anchor without input data" };
    }
    const expected = computeDryRunAnchorHash(input);
    return { valid: anchorHash === expected };
  }

  // C2: Testnet — fail if client is unavailable (no silent success)
  if (!isCasperClientAvailable()) {
    return {
      valid: false,
      error: "CASPER_CLIENT_UNAVAILABLE: Cannot verify anchor — casper-client not found.",
    };
  }

  try {
    const { stdout } = await _execAsync(
      CASPER_CLIENT_BIN,
      [
        "get-deploy",
        "--node-address", config.casperRpcUrl,
        anchorHash,
      ],
      { timeout: 15000, maxBuffer: 5 * 1024 * 1024 }
    );

    const output = stdout.toString();
    try {
      const parsed = JSON.parse(output);
      if (parsed?.result?.deploy) {
        return { valid: true };
      }
    } catch {
      // Non-JSON output
    }

    // Check if the deploy exists in the output
    if (output.includes("deploy") || output.includes(anchorHash)) {
      return { valid: true };
    }

    return { valid: false, error: `Deploy ${anchorHash} not found on chain` };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { valid: false, error: msg };
  }
}

// ── Health check ─────────────────────────

export interface CasperHealth {
  healthy: boolean;
  clientAvailable: boolean;
  clientVersion: string | null;
  mode: string;
  rpcUrl: string;
  chainName: string;
  accountKeyConfigured: boolean;
}

export function getCasperHealth(): CasperHealth {
  const clientAvailable = isCasperClientAvailable();
  const clientVersion = getCasperClientVersion();

  return {
    healthy: clientAvailable || config.casperMode === "dry_run",
    clientAvailable,
    clientVersion,
    mode: config.casperMode,
    rpcUrl: config.casperRpcUrl,
    chainName: config.casperChainName,
    accountKeyConfigured: !!config.casperAccountKeyPath,
  };
}
