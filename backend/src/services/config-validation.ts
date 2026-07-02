// ────────────────────────────────────────
// Sealrail Backend - Config Validation
// Production/testnet deployment readiness checks
// Fails honestly for missing required values
// Never leaks secrets in error messages
// ────────────────────────────────────────

import { config } from "../config.js";
import { isCliAvailable } from "./tee.js";
import { isCasperClientAvailable } from "./casper.js";

// ── Validation result ────────────────────

export interface ValidationIssue {
  /** Config key that has the issue */
  key: string;
  /** Severity: error (blocks deployment) vs warning (advisory) */
  severity: "error" | "warning";
  /** Human-readable message (never contains secret values) */
  message: string;
}

export interface ValidationResult {
  /** true when no errors found (warnings are ok) */
  valid: boolean;
  /** List of all issues found */
  issues: ValidationIssue[];
}

// ── Individual validators ────────────────

function validateBlockyConfig(issues: ValidationIssue[]): void {
  const mode = config.casperMode;

  // Blocky CLI is always recommended but only required for non-dry-run
  if (!isCliAvailable()) {
    if (mode !== "dry_run") {
      issues.push({
        key: "bky-as CLI",
        severity: "error",
        message:
          "bky-as CLI is required for TEE verification in non-dry_run mode. " +
          "Install from https://github.com/blocky/blocky-as or switch to CASPER_MODE=dry_run.",
      });
    } else {
      issues.push({
        key: "bky-as CLI",
        severity: "warning",
        message:
          "bky-as CLI is not installed. Dry-run mode can simulate verification, " +
          "but real TEE attestation requires the CLI. Install from https://github.com/blocky/blocky-as",
      });
    }
  }

  // Hosted Blocky: required for production/testnet, optional for dry_run
  const hasHostedApiKey = config.blockyAsApiKey !== "";
  const hasHostedHost = config.blockyAsHost !== "";

  if (mode !== "dry_run") {
    if (!hasHostedApiKey || !hasHostedHost) {
      const missing: string[] = [];
      if (!hasHostedApiKey) missing.push("BLOCKY_AS_API_KEY");
      if (!hasHostedHost) missing.push("BLOCKY_AS_HOST");
      issues.push({
        key: "BLOCKY_AS_HOST",
        severity: "warning",
        message:
          `Hosted Blocky access is not configured. ${mode} mode will use the local Blocky adapter for TEE verification. ` +
          `Missing: ${missing.join(", ")}. Set BLOCKY_AS_API_KEY and BLOCKY_AS_HOST for hosted TEE when available. ` +
          `Contact info@blocky.rocks for an API key.`,
      });
    }
  } else {
    if (!hasHostedApiKey && !hasHostedHost) {
      issues.push({
        key: "BLOCKY_AS_HOST",
        severity: "warning",
        message:
          "Hosted Blocky access is not configured. Dry-run mode will simulate TEE verification. " +
          "Set BLOCKY_AS_API_KEY and BLOCKY_AS_HOST for real TEE verification.",
      });
    }
  }
}

function validateCasperConfig(issues: ValidationIssue[]): void {
  const mode = config.casperMode;

  // Validate mode
  if (mode === "mainnet") {
    issues.push({
      key: "CASPER_MODE",
      severity: "error",
      message:
        "Mainnet anchoring is not yet implemented. Use CASPER_MODE=testnet for real-chain testing " +
        "or CASPER_MODE=dry_run for simulated anchoring.",
    });
  }

  // Testnet validation
  if (mode === "testnet") {
    // RPC URL
    if (!config.casperRpcUrl || config.casperRpcUrl === "http://localhost:11101") {
      issues.push({
        key: "CASPER_RPC_URL",
        severity: "error",
        message:
          "CASPER_RPC_URL must point to a real testnet RPC node for testnet mode. " +
          "Set CASPER_RPC_URL=https://node.testnet.casper.network/rpc for public testnet.",
      });
    }

    // Chain name
    if (!config.casperChainName || config.casperChainName === "casper-net-1") {
      issues.push({
        key: "CASPER_CHAIN_NAME",
        severity: "error",
        message:
          "CASPER_CHAIN_NAME must be set to 'casper-test' for testnet mode. " +
          "Current: 'casper-net-1' (mainnet).",
      });
    }

    // casper-client
    if (!isCasperClientAvailable()) {
      issues.push({
        key: "casper-client",
        severity: "error",
        message:
          "casper-client binary is required for testnet anchoring. " +
          "Install from https://docs.casper.network/developers/prerequisites/",
      });
    }

    // Account key
    if (!config.casperAccountKeyPath) {
      issues.push({
        key: "CASPER_ACCOUNT_KEY_PATH",
        severity: "error",
        message:
          "A Casper account secret key PEM file is required for testnet anchoring. " +
          "Generate a key pair and set CASPER_ACCOUNT_KEY_PATH.",
      });
    }

    // Contract hash
    if (!config.casperContractHash) {
      issues.push({
        key: "CASPER_CONTRACT_HASH",
        severity: "error",
        message:
          "CASPER_CONTRACT_HASH is required for testnet mode. " +
          "Deploy the contract with Phase P and set the resulting contract hash.",
      });
    }
  }

  // Production/mainnet-specific
  if (config.nodeEnv === "production" && mode === "dry_run") {
    issues.push({
      key: "CASPER_MODE",
      severity: "warning",
      message:
        "Running in production with CASPER_MODE=dry_run. Proofs will be simulated. " +
        "Switch to testnet or mainnet for real anchoring.",
    });
  }
}

function validateLlmConfig(issues: ValidationIssue[]): void {
  if (config.llmProvider === "none") {
    // Explicitly disabled - not an error
    return;
  }

  const hasUrl = config.llmApiBaseUrl !== "";
  const hasKey = config.llmApiKey !== "";

  if (!hasUrl && !hasKey) {
    issues.push({
      key: "LLM_API_BASE_URL",
      severity: "warning",
      message:
        "LLM provider is not configured. Agent execution will not work. " +
        "Set LLM_API_BASE_URL and LLM_API_KEY to enable agent execution. " +
        'Set LLM_PROVIDER=none to suppress this warning.',
    });
  } else if (!hasKey) {
    issues.push({
      key: "LLM_API_KEY",
      severity: "warning",
      message:
        "LLM_API_KEY is not set but LLM_API_BASE_URL is configured. " +
        "Agent execution will fail without an API key.",
    });
  } else if (!hasUrl) {
    issues.push({
      key: "LLM_API_BASE_URL",
      severity: "warning",
      message:
        "LLM_API_BASE_URL is not set but LLM_API_KEY is configured. " +
        "Agent execution will fail without a base URL.",
    });
  }
}

function validateServerConfig(issues: ValidationIssue[]): void {
  if (config.port < 1 || config.port > 65535) {
    issues.push({
      key: "PORT",
      severity: "error",
      message: `Invalid port: ${config.port}. Must be between 1 and 65535.`,
    });
  }

  if (config.nodeEnv === "production" && config.host === "0.0.0.0") {
    issues.push({
      key: "HOST",
      severity: "warning",
      message:
        "HOST is set to 0.0.0.0 (all interfaces). In production, consider binding to a specific " +
        "interface or using a reverse proxy.",
    });
  }
}

function validateDatabaseConfig(issues: ValidationIssue[]): void {
  if (!config.databasePath) {
    issues.push({
      key: "DATABASE_PATH",
      severity: "error",
      message: "DATABASE_PATH is not set. A database path is required.",
    });
  }

  if (config.databasePath === ":memory:") {
    issues.push({
      key: "DATABASE_PATH",
      severity: "warning",
      message:
        "DATABASE_PATH is ':memory:' - data will be lost on restart. " +
        "Use a file path for persistent storage.",
    });
  }
}

// ── Main validator ────────────────────────

/**
 * Validate the full backend configuration for deployment readiness.
 *
 * Checks all subsystems (Blocky, Casper, LLM, server, database) and returns
 * a structured result with errors (block deployment) and warnings (advisory).
 *
 * Never leaks secret values in error messages - only reports presence/absence.
 *
 * @returns ValidationResult with valid flag and issue list
 */
export function validateDeploymentConfig(): ValidationResult {
  const issues: ValidationIssue[] = [];

  validateBlockyConfig(issues);
  validateCasperConfig(issues);
  validateLlmConfig(issues);
  validateServerConfig(issues);
  validateDatabaseConfig(issues);

  return {
    valid: issues.filter((i) => i.severity === "error").length === 0,
    issues,
  };
}

// ── Quick validation functions ────────────

/**
 * Check if the config is valid for production deployment.
 * Shortcut that returns true only when no errors exist.
 */
export function isProductionReady(): boolean {
  return validateDeploymentConfig().valid;
}

/**
 * Check if the config is valid for testnet deployment.
 * Equivalent to validateDeploymentConfig() with CASPER_MODE=testnet.
 */
export function isTestnetReady(): boolean {
  return validateDeploymentConfig().valid;
}

/**
 * Get a plain-text summary of validation issues.
 * Useful for startup logs and health checks.
 */
export function getValidationSummary(): string {
  const result = validateDeploymentConfig();
  const errors = result.issues.filter((i) => i.severity === "error");
  const warnings = result.issues.filter((i) => i.severity === "warning");

  if (errors.length === 0 && warnings.length === 0) {
    return "Config valid. All subsystems ready.";
  }

  const lines: string[] = [];
  if (errors.length > 0) {
    lines.push(`${errors.length} error(s):`);
    errors.forEach((e) => lines.push(`  [ERROR] ${e.key}: ${e.message}`));
  }
  if (warnings.length > 0) {
    lines.push(`${warnings.length} warning(s):`);
    warnings.forEach((w) => lines.push(`  [WARN] ${w.key}: ${w.message}`));
  }

  return lines.join("\n");
}
