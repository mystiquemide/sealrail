// Sealrail Backend - Environment Config Loader
// Reads from process.env; callers should load dotenv before importing config.

function envStr(key: string, fallback: string): string {
  return process.env[key] ?? fallback;
}

function envInt(key: string, fallback: number): number {
  const v = process.env[key];
  if (v === undefined) return fallback;
  const n = parseInt(v, 10);
  return isNaN(n) ? fallback : n;
}

export const config = {
  // Database
  databasePath: envStr("DATABASE_PATH", "./data/sealrail.db"),

  // Blocky AS (TEE verification adapter)
  blockyMode: envStr("BLOCKY_MODE", "tee_adapter"),
  blockyAsApiKey: envStr("BLOCKY_AS_API_KEY", ""),
  blockyAsHost: envStr("BLOCKY_AS_HOST", ""),
  blockyConfigPath: envStr("BLOCKY_CONFIG_PATH", ""),
  blockyWasmDir: envStr("BLOCKY_WASM_DIR", "../blocky/invoice-verifier"),

  // Casper Network
  casperRpcUrl: envStr("CASPER_RPC_URL", "http://localhost:11101"),
  casperChainName: envStr("CASPER_CHAIN_NAME", "casper-net-1"),
  casperAccountKeyPath: envStr("CASPER_ACCOUNT_KEY_PATH", ""),
  csprCloudApiKey: envStr("CSPR_CLOUD_API_KEY", ""),
  csprCloudToken: envStr("CSPR_CLOUD_TOKEN", ""),
  casperContractHash: envStr("CASPER_CONTRACT_HASH", ""),
  casperMode: envStr("CASPER_MODE", "dry_run") as "dry_run" | "testnet" | "mainnet",

  // Server
  port: envInt("PORT", 3001),
  host: envStr("HOST", "0.0.0.0"),
  nodeEnv: envStr("NODE_ENV", "development") as "development" | "production" | "test",
  frontendOrigin: envStr("FRONTEND_ORIGIN", "http://localhost:3000"),

  // Security
  apiKeyScryptSaltLength: envInt("API_KEY_SCRYPT_SALT_LENGTH", 32),
  apiKeyHashLength: envInt("API_KEY_HASH_LENGTH", 64),
  // Requests per minute per client IP. 0 disables rate limiting (local dev
  // and tests); set a positive value on any internet-facing deployment.
  rateLimitMax: envInt("RATE_LIMIT_MAX", 0),
  // Unauthenticated key creation (self-serve onboarding). Set ALLOW_BOOTSTRAP_KEYS=false
  // to require an authenticated key for POST /api/api-keys.
  allowBootstrapKeys: envStr("ALLOW_BOOTSTRAP_KEYS", "true") !== "false",

  // Verification mode - TEE verification adapter (no hosted enclave claims)
  teeVerificationMode: "tee_verification_mode" as const,

  // Phase N: LLM Provider (agent execution runtime)
  llmProvider: envStr("LLM_PROVIDER", "openai_compatible") as "openai_compatible" | "none",
  llmApiBaseUrl: envStr("LLM_API_BASE_URL", ""),
  llmApiKey: envStr("LLM_API_KEY", ""),
  llmModel: envStr("LLM_MODEL", "gpt-4o-mini"),
  llmTimeoutMs: envInt("LLM_TIMEOUT_MS", 30000),
  llmMaxRetries: envInt("LLM_MAX_RETRIES", 2),
} as const;
