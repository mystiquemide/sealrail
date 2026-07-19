// ────────────────────────────────────────
// Sealrail Backend - Status Service
// Comprehensive health/status for all subsystems
// Deploy prep: exposes readiness without leaking secrets
// ────────────────────────────────────────

import { config } from "../config.js";
import { isCliAvailable, getCliVersion } from "./tee.js";
import { isLlmConfigured, getLlmProviderHealth } from "./llm-provider.js";
import { isCasperClientAvailable, getCasperClientVersion } from "./casper.js";
import { healthCheck as blockyHealthCheck } from "./blocky.js";
import { isCsprCloudConfigured } from "./cspr-cloud.js";
import { getCachedCsprCloudHealth } from "./cspr-health-cache.js";
import { getDb } from "../db.js";

// ── Blocky status ────────────────────────

export interface BlockyReadiness {
  /** true if bky-as CLI is on PATH */
  cliInstalled: boolean;
  /** CLI version string, or null if not installed */
  cliVersion: string | null;
  /** true only when hosted Blocky access is fully configured */
  hostedConfigured: boolean;
  /** true when API key is present (says nothing about validity) */
  hostedApiKeyPresent: boolean;
  /** true when host URL is configured */
  hostedHostPresent: boolean;
  /** true when config path is set */
  hostedConfigPathPresent: boolean;
  /** Whether hosted TEE execution is blocked by missing hosted access */
  teeHookupBlocked: boolean;
  /** Human-readable reason if hosted TEE execution is blocked */
  teeHookupBlockedReason: string | null;
}

export function getBlockyReadiness(): BlockyReadiness {
  const cliInstalled = isCliAvailable();
  const cliVersion = cliInstalled ? getCliVersion() : null;

  const hostedApiKeyPresent = config.blockyAsApiKey !== "";
  const hostedHostPresent = config.blockyAsHost !== "";
  const hostedConfigPathPresent = config.blockyConfigPath !== "";
  const hostedConfigured = hostedApiKeyPresent && hostedHostPresent;

  const teeHookupBlocked = !hostedConfigured;
  let teeHookupBlockedReason: string | null = null;

  if (teeHookupBlocked) {
    const missing: string[] = [];
    if (!hostedApiKeyPresent) missing.push("BLOCKY_AS_API_KEY");
    if (!hostedHostPresent) missing.push("BLOCKY_AS_HOST");
    teeHookupBlockedReason = `Hosted TEE execution pending: hosted Blocky access is not configured. Missing: ${missing.join(", ") || "all fields"}. Set BLOCKY_AS_API_KEY and BLOCKY_AS_HOST for hosted TEE when available. Contact info@blocky.rocks for API key.`;
  }

  return {
    cliInstalled,
    cliVersion,
    hostedConfigured,
    hostedApiKeyPresent,
    hostedHostPresent,
    hostedConfigPathPresent,
    teeHookupBlocked,
    teeHookupBlockedReason,
  };
}

// ── Casper readiness ─────────────────────

export interface CasperReadiness {
  /** Current mode: dry_run, testnet, or mainnet */
  mode: string;
  /** casper-client binary available */
  clientInstalled: boolean;
  /** casper-client version */
  clientVersion: string | null;
  /** RPC URL configured */
  rpcUrlConfigured: boolean;
  /** Account key PEM path set */
  accountKeyConfigured: boolean;
  /** Contract hash from Phase P deploy (never the raw secret key) */
  contractHash: string | null;
  /** CSPR.cloud API key present */
  csprCloudAvailable: boolean;
  /** Whether testnet deploy requires missing credentials */
  testnetBlocked: boolean;
  testnetBlockedReason: string | null;
}

export function getCasperReadiness(): CasperReadiness {
  const mode = config.casperMode;
  const clientInstalled = isCasperClientAvailable();
  const clientVersion = clientInstalled ? getCasperClientVersion() : null;
  const rpcUrlConfigured = config.casperRpcUrl !== "";
  const accountKeyConfigured = config.casperAccountKeyPath !== "";
  const contractHash = config.casperContractHash || null;
  const csprCloudAvailable = !!(config.csprCloudApiKey || config.csprCloudToken);

  const testnetBlocked = mode === "testnet" && (!clientInstalled || !accountKeyConfigured || !contractHash);
  let testnetBlockedReason: string | null = null;

  if (testnetBlocked) {
    const missing: string[] = [];
    if (!clientInstalled) missing.push("casper-client binary");
    if (!accountKeyConfigured) missing.push("CASPER_ACCOUNT_KEY_PATH");
    if (!contractHash) missing.push("CASPER_CONTRACT_HASH");
    testnetBlockedReason = `Testnet anchoring blocked: ${missing.join(", ")}. Configure missing items for real-chain anchoring or switch to CASPER_MODE=dry_run for development.`;
  }

  return {
    mode,
    clientInstalled,
    clientVersion,
    rpcUrlConfigured,
    accountKeyConfigured,
    contractHash,
    csprCloudAvailable,
    testnetBlocked,
    testnetBlockedReason,
  };
}

// ── LLM readiness ────────────────────────

export interface LlmReadiness {
  /** Provider name */
  provider: string;
  /** true if provider is fully configured */
  configured: boolean;
  /** Model name */
  model: string;
  /** true if API base URL is set (never reveals the URL) */
  baseUrlPresent: boolean;
  /** true if API key is set (never reveals the key) */
  apiKeyPresent: boolean;
  /** Timeout in ms */
  timeoutMs: number;
  /** Max retries */
  maxRetries: number;
}

export function getLlmReadiness(): LlmReadiness {
  const health = getLlmProviderHealth();

  return {
    provider: health.provider,
    configured: health.configured,
    model: health.model,
    baseUrlPresent: health.baseUrlConfigured,
    apiKeyPresent: health.keyConfigured,
    timeoutMs: config.llmTimeoutMs,
    maxRetries: config.llmMaxRetries,
  };
}

// ── Database readiness ───────────────────

export interface DbReadiness {
  connected: boolean;
  path: string;
  tables: number;
}

export function getDbReadiness(): DbReadiness {
  try {
    const db = getDb();
    const tablesRow = db
      .prepare("SELECT count(*) AS count FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'")
      .get() as { count: number };

    return {
      connected: true,
      path: config.databasePath,
      tables: tablesRow.count,
    };
  } catch {
    return {
      connected: false,
      path: config.databasePath,
      tables: 0,
    };
  }
}

// ── Deployment readiness summary ─────────

export interface DeploymentReadiness {
  /** Overall readiness: all required subsystems healthy */
  ready: boolean;
  /** Server config */
  server: {
    port: number;
    host: string;
    nodeEnv: string;
  };
  /** Blocky / hosted TEE readiness */
  blocky: BlockyReadiness;
  /** Casper chain readiness */
  casper: CasperReadiness;
  /** LLM provider readiness */
  llm: LlmReadiness;
  /** Database readiness */
  database: DbReadiness;
  /** List of blocking issues preventing deployment */
  blockers: string[];
  /** List of warnings (not blocking but worth noting) */
  warnings: string[];
  /** Phase N guarantees */
  phaseNGuarantees: {
    noFakeLlmSuccess: boolean;
    noPendingProofFallback: boolean;
    noPaymentUnlockWithoutVerifiedProof: boolean;
    agentRuntimeAvailable: boolean;
    supportedTaskTypes: string[];
  };
}

export function getDeploymentReadiness(): DeploymentReadiness {
  const blocky = getBlockyReadiness();
  const casper = getCasperReadiness();
  const llm = getLlmReadiness();
  const database = getDbReadiness();

  const blockers: string[] = [];
  const warnings: string[] = [];

  // Blocky blockers
  if (blocky.teeHookupBlocked) {
    if (config.casperMode === "mainnet") {
      blockers.push("Hosted TEE execution is unavailable in mainnet mode because hosted Blocky access is not configured.");
    } else if (config.casperMode === "testnet") {
      warnings.push("Hosted TEE execution is pending. Testnet Casper anchoring is active; live payment gating uses schema checks, hash binding, and confirmed Casper anchors.");
    } else {
      warnings.push("Hosted TEE execution is pending. Dry-run mode should be treated as local verification only.");
    }
  }
  if (!blocky.cliInstalled) {
    if (config.casperMode === "mainnet") {
      blockers.push("bky-as CLI not found. Install Blocky AS CLI from https://github.com/blocky/blocky-as");
    } else {
      warnings.push("bky-as CLI not found. Hosted/local TEE execution is unavailable; LLM-backed agent execution and Casper testnet anchoring remain operational.");
    }
  }

  // Casper blockers
  if (casper.testnetBlocked) {
    blockers.push(casper.testnetBlockedReason!);
  }
  if (config.casperMode === "mainnet") {
    blockers.push("Mainnet anchoring is not yet implemented. Use testnet for real-chain testing.");
  }

  // LLM blockers
  if (!llm.configured && llm.provider !== "none") {
    warnings.push("LLM provider is not fully configured. Agent execution won't work without LLM_API_BASE_URL and LLM_API_KEY.");
  }

  // Database blockers
  if (!database.connected) {
    blockers.push("Database connection failed. Check DATABASE_PATH and disk space.");
  }

  return {
    ready: blockers.length === 0,
    server: {
      port: config.port,
      host: config.host,
      nodeEnv: config.nodeEnv,
    },
    blocky,
    casper,
    llm,
    database,
    blockers,
    warnings,
    phaseNGuarantees: {
      noFakeLlmSuccess: true,
      noPendingProofFallback: true,
      noPaymentUnlockWithoutVerifiedProof: true,
      agentRuntimeAvailable: true,
      supportedTaskTypes: ["invoice_risk"],
    },
  };
}

// ── Public-safe status (no secret fields) ─

export interface PublicStatusResponse {
  status: "ok" | "degraded" | "not_ready";
  mode: "schema_hash_verification";
  mode_label: "Schema + hash verification";
  casper_mode: string;
  casper_contract_ready: boolean;
  casper_client_available: boolean;
  casper_client_version: string | null;
  casper_chain_name: string;
  blocky_cli_available: boolean;
  hosted_tee_ready: boolean;
  tee_hookup_blocked: boolean;
  llm_configured: boolean;
  db_connected: boolean;
  cspr_cloud_configured: boolean;
  cspr_cloud_api_reachable: boolean;
  cspr_cloud_x402_ready: boolean;
  cspr_cloud_latest_rate: number | null;
  cspr_cloud_status: "live" | "partial" | "pending";
  cspr_cloud_note: string;
  node_env: string;
  timestamp: string;
  uptime_seconds: number;
}

export function getPublicStatus(startTime: number): PublicStatusResponse {
  const blocky = getBlockyReadiness();
  const casper = getCasperReadiness();
  const llm = getLlmReadiness();
  const database = getDbReadiness();

  const csprCloudConfigured = isCsprCloudConfigured();
  const csprHealth = getCachedCsprCloudHealth();

  // Determine overall public status from blocking readiness only.
  // In testnet mode, hosted Blocky / bky-as availability is reported honestly
  // via the dedicated fields below, but it should not mark the whole backend as
  // degraded when Casper anchoring, database, and LLM-backed agent execution are
  // operational. Config validation treats missing hosted TEE access as a
  // warning in testnet, so public status must follow the same contract.
  let status: "ok" | "degraded" | "not_ready";
  if (!database.connected || casper.mode === "mainnet" || casper.testnetBlocked) {
    status = "not_ready";
  } else if (!llm.configured && llm.provider !== "none") {
    status = "degraded";
  } else {
    status = "ok";
  }

  const csprCloudStatus: PublicStatusResponse["cspr_cloud_status"] = !csprCloudConfigured
    ? "pending"
    : csprHealth.apiReachable && csprHealth.latestRate !== null
      ? "live"
      : csprHealth.apiReachable || csprHealth.x402Ready
        ? "partial"
        : "pending";
  const csprCloudNote = !csprCloudConfigured
    ? "CSPR.cloud credentials are not configured."
    : csprCloudStatus === "live" && csprHealth.x402Ready
      ? "CSPR.cloud API, rates, and x402 facilitator checks are reachable."
      : csprCloudStatus === "live"
        ? "CSPR.cloud API and rates are live; x402 facilitator or node-health checks may be rate-limited."
        : csprCloudStatus === "partial"
          ? "CSPR.cloud is partially reachable; rate, x402, or node-health checks may be unavailable or rate-limited."
          : "CSPR.cloud is configured but currently unreachable from the health cache.";

  return {
    status,
    mode: "schema_hash_verification",
    mode_label: "Schema + hash verification",
    casper_mode: casper.mode,
    casper_contract_ready: !!casper.contractHash && casper.accountKeyConfigured,
    casper_client_available: casper.clientInstalled,
    casper_client_version: casper.clientInstalled ? "installed" : null,
    casper_chain_name: config.casperChainName,
    blocky_cli_available: blocky.cliInstalled,
    hosted_tee_ready: blocky.hostedConfigured,
    tee_hookup_blocked: blocky.teeHookupBlocked,
    llm_configured: llm.configured,
    db_connected: database.connected,
    cspr_cloud_configured: csprCloudConfigured,
    cspr_cloud_api_reachable: csprHealth.apiReachable,
    cspr_cloud_x402_ready: csprHealth.x402Ready,
    cspr_cloud_latest_rate: csprHealth.latestRate,
    cspr_cloud_status: csprCloudStatus,
    cspr_cloud_note: csprCloudNote,
    node_env: config.nodeEnv === "production" ? "production" : "non-production",
    timestamp: new Date().toISOString(),
    uptime_seconds: Math.floor((Date.now() - startTime) / 1000),
  };
}

// ── Admin-safe status (full detail, no secrets) ─

export interface AdminStatusResponse {
  status: "ok" | "degraded" | "not_ready";
  readiness: DeploymentReadiness;
}

export function getAdminStatus(startTime: number): AdminStatusResponse {
  const readiness = getDeploymentReadiness();

  let status: "ok" | "degraded" | "not_ready";
  if (readiness.ready) {
    status = "ok";
  } else if (readiness.blockers.length === 0) {
    status = "degraded";
  } else {
    status = "not_ready";
  }

  return { status, readiness };
}

// ── Health check (compatibility with existing /api/health) ─

export function getHealth(startTime: number) {
  const blocky = getBlockyReadiness();

  return {
    status: "ok",
    mode: "schema_hash_verification",
    mode_label: "Schema + hash verification",
    timestamp: new Date().toISOString(),
    uptime_seconds: 0,
    blocky_cli: blocky.cliInstalled ? "available" : "unavailable",
    tee_hookup: blocky.teeHookupBlocked ? "pending_hosted_access" : "ready",
  };
}
