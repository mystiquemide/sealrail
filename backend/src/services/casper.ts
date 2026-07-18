// ────────────────────────────────────────
// Sealrail Casper Anchoring Adapter
// Casper provider: dry-run + testnet modes
// Phase D1-D3: provider interface, deterministic deploy hash, casper-client path
// Audit fix C2: testnet/mainnet fail-closed - simulated success removed from non-dry-run
// ────────────────────────────────────────

import { execFile, execSync } from "child_process";
import { promisify } from "util";
import { createHash, randomUUID } from "crypto";

import { config } from "../config.js";
import { getDeployConfirmation } from "./cspr-cloud.js";

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
type DeployConfirmationResult = { confirmed: boolean; error?: string };
type DeployConfirmationFn = (deployHash: string) => Promise<DeployConfirmationResult>;
type SubmitDeployResult = { deployHash: string };
type SubmitDeployFn = (input: AnchorProofInput) => Promise<SubmitDeployResult>;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function defaultConfirmDeployExecution(deployHash: string): Promise<DeployConfirmationResult> {
  const attempts = Number(process.env.CASPER_DEPLOY_CONFIRM_ATTEMPTS ?? "12");
  const delayMs = Number(process.env.CASPER_DEPLOY_CONFIRM_DELAY_MS ?? "5000");
  let lastError = "deploy was not confirmed before timeout";

  for (let attempt = 1; attempt <= attempts; attempt++) {
    const confirmation = await getDeployConfirmation(deployHash);
    const raw = confirmation.raw as Record<string, unknown> | null;
    const executionError =
      typeof raw?.error_message === "string" && raw.error_message.length > 0
        ? raw.error_message
        : null;

    if (confirmation.found && confirmation.status === "processed" && !executionError) {
      return { confirmed: true };
    }

    lastError = confirmation.error || executionError || `status=${confirmation.status ?? "unknown"}`;
    if (executionError) break;
    if (attempt < attempts) await sleep(delayMs);
  }

  return { confirmed: false, error: lastError };
}

let _execAsync: ExecFn = promisify(execFile) as unknown as ExecFn;
let _submitCasperDeploy: SubmitDeployFn = submitCasperDeploy;
let _confirmDeployExecution: DeployConfirmationFn = defaultConfirmDeployExecution;
let _clientAvailableOverride: boolean | undefined;

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

export function __setCasperClientAvailableForTest(value?: boolean): void {
  _clientAvailableOverride = value;
}

export function __setCasperSubmitDeployAsync(fn?: SubmitDeployFn): void {
  _submitCasperDeploy = fn ?? submitCasperDeploy;
}

export function __setCasperDeployConfirmationAsync(fn?: DeployConfirmationFn): void {
  _confirmDeployExecution = fn ?? defaultConfirmDeployExecution;
}

// ── CLI path ─────────────────────────────

const CASPER_CLIENT_BIN = "casper-client";

export function isCasperClientAvailable(): boolean {
  if (_clientAvailableOverride !== undefined) return _clientAvailableOverride;
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
 * This hash is reproducible - same input always yields the same anchor hash.
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
 * No network calls - purely local computation.
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

const GAS_PAYMENT = "2500000000"; // 2.5 CSPR for gas

function secretKeyArg(): string {
  if (!config.casperAccountKeyPath) {
    throw new Error(
      "CASPER_ACCOUNT_KEY_MISSING: No Casper account key configured. " +
      "Set CASPER_ACCOUNT_KEY_PATH env var or switch to CASPER_MODE=dry_run."
    );
  }
  return config.casperAccountKeyPath;
}

function contractPackageHash(): string {
  if (!config.casperContractHash) {
    throw new Error(
      "CASPER_CONTRACT_HASH_MISSING: No contract hash configured. " +
      "Set CASPER_CONTRACT_HASH env var or switch to CASPER_MODE=dry_run."
    );
  }
  // Strip `hash-` prefix if present; casper-client expects raw hex.
  return config.casperContractHash.replace(/^hash-/, "");
}

function contractSessionArgs(entryPoint: string): string[] {
  return [
    "--session-package-hash", contractPackageHash(),
    "--session-entry-point", entryPoint,
  ];
}

function baseArgs(): string[] {
  return [
    "--chain-name", config.casperChainName,
    "--node-address", config.casperRpcUrl,
    "--secret-key", secretKeyArg(),
  ];
}

async function runCasperDeploy(sessionArgs: string[]): Promise<string> {
  const args = [
    "put-deploy",
    ...baseArgs(),
    "--payment-amount", GAS_PAYMENT,
    ...sessionArgs,
  ];

  let output: string;
  try {
    // Call casper-client directly via execFile (no bash -c) to preserve
    // single-quoted session-arg values that casper-client requires.
    const { stdout } = await _execAsync(
      CASPER_CLIENT_BIN,
      args,
      { timeout: 60000, maxBuffer: 10 * 1024 * 1024 }
    );
    output = stdout.toString();
  } catch (err: unknown) {
    const execErr = err as NodeJS.ErrnoException & { stdout?: string; stderr?: string; code?: number };
    const detail = [
      execErr.stdout?.toString() || "",
      execErr.stderr?.toString() || "",
    ].filter(Boolean).join("\n");
    const codeInfo = execErr.code !== undefined ? ` (exit ${execErr.code})` : "";
    throw new Error(
      `CASPER_CLI_FAILED${codeInfo}: casper-client exited with an error.\nCommand: casper-client ${args.join(" ")}\nOutput: ${detail.slice(0, 1000)}`
    );
  }

  try {
    // casper-client prints a deprecation banner to stdout before the JSON.
    // Strip everything before the first '{' to extract the JSON payload.
    const jsonStart = output.indexOf("{");
    const jsonText = jsonStart >= 0 ? output.slice(jsonStart) : output;
    const parsed = JSON.parse(jsonText);
    if (parsed?.result?.deploy_hash) {
      return parsed.result.deploy_hash;
    }
  } catch {
    // fall through
  }

  const match = output.match(/deploy_hash[:\s=]+"?([a-f0-9]{64})"?/i);
  if (match) return match[1];

  throw new Error(
    `CASPER_DEPLOY_PARSE_FAILED: Could not extract deploy hash. Output: ${output.slice(0, 500)}`
  );
}

/**
 * Register an agent on the Casper contract.
 * Idempotent: if agent already exists the contract reverts; caller can ignore that error.
 */
async function registerAgentOnChain(agentId: string, taskType: string): Promise<string> {
  const name = agentId;
  const verifierFn = taskType === "invoice_risk" ? "verifyInvoiceRisk" : "verifyRwaCompliance";
  const wasmHash = "0x0000000000000000000000000000000000000000000000000000000000000000";

  return runCasperDeploy([
    ...contractSessionArgs("register_agent"),
    "--session-arg", `agent_id:string='${agentId}'`,
    "--session-arg", `name:string='${name}'`,
    "--session-arg", `verifier_function:string='${verifierFn}'`,
    "--session-arg", `wasm_code_hash:string='${wasmHash}'`,
  ]);
}

/**
 * Create a payment record on the Casper contract for a task.
 * Idempotent: if payment already exists the contract reverts; caller can ignore that error.
 */
async function createPaymentOnChain(taskId: string, agentId: string): Promise<string> {
  const paymentMotes = "1000000000"; // 1 CSPR

  return runCasperDeploy([
    ...contractSessionArgs("create_payment"),
    "--session-arg", `task_id:string='${taskId}'`,
    "--session-arg", `agent_id:string='${agentId}'`,
    "--session-arg", `payment_amount:u512='${paymentMotes}'`,
  ]);
}

/**
 * Anchor proof hashes on the Casper contract.
 * This is the canonical anchoring deploy that produces the deploy hash
 * referenced as the Casper anchor in the proof receipt.
 */
async function anchorProofOnChain(
  taskId: string,
  inputHash: string,
  outputHash: string,
  attestationHash: string,
): Promise<string> {
  return runCasperDeploy([
    ...contractSessionArgs("anchor_proof"),
    "--session-arg", `task_id:string='${taskId}'`,
    "--session-arg", `input_hash:string='${inputHash}'`,
    "--session-arg", `output_hash:string='${outputHash}'`,
    "--session-arg", `attestation_hash:string='${attestationHash}'`,
  ]);
}

/**
 * Build a minimal Casper deploy that stores the anchor hash on-chain
 * by calling the deployed ProofRegistry contract.
 * Steps: register agent → create payment → anchor proof.
 * Earlier steps are best-effort (already-exists errors are swallowed);
 * only the anchor_proof deploy hash is returned as the canonical anchor.
 * Fails closed: returns error if client, key, or contract hash is missing.
 */
async function submitCasperDeploy(
  input: AnchorProofInput
): Promise<{ deployHash: string }> {
  const anchorHash = computeDryRunAnchorHash(input);

  // Step 1: Register agent on-chain (best-effort, may already exist)
  try {
    await registerAgentOnChain(input.agentId, "invoice_risk");
  } catch {
    // Agent may already be registered; continue
  }

  // Step 2: Create payment on-chain (best-effort, may already exist)
  try {
    await createPaymentOnChain(input.taskId, input.agentId);
  } catch {
    // Payment may already exist; continue
  }

  // Step 3: Anchor proof (this is the canonical deploy)
  return {
    deployHash: await anchorProofOnChain(
      input.taskId,
      input.hashOfInput,
      input.hashOfOutput,
      anchorHash,
    ),
  };
}

/**
 * Create a testnet anchor using casper-client.
 * C2: Fails closed - missing client, missing key, or deploy error = failure.
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
    const { deployHash } = await _submitCasperDeploy(input);
    const confirmation = await _confirmDeployExecution(deployHash);

    if (!confirmation.confirmed) {
      return {
        success: false,
        anchorHash: "",
        deployHash,
        mode: "testnet",
        simulated: false,
        error: `CASPER_DEPLOY_NOT_CONFIRMED: ${confirmation.error ?? "deploy execution was not confirmed"}`,
      };
    }

    return {
      success: true,
      anchorHash: deployHash,
      deployHash,
      mode: "testnet",
      simulated: false,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);

    // C2: Fail closed on any error - no fallback hash
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

  // Blocker 1: mainnet and unsupported modes must fail closed - never dry-run
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

  // Unknown/unrecognized mode - fail closed
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

  // C2: Testnet - fail if client is unavailable (no silent success)
  if (!isCasperClientAvailable()) {
    return {
      valid: false,
      error: "CASPER_CLIENT_UNAVAILABLE: Cannot verify anchor - casper-client not found.",
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
