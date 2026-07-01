// ────────────────────────────────────────
// Sealrail Shared Type Definitions
// All 11 core model types + supporting types
// Derived from FULL_ECOSYSTEM_BUILD_SCOPE.md §5
// ────────────────────────────────────────

// ── Enums ───────────────────────────────

export type AgentCategory = "invoice" | "defi" | "research" | "compliance" | "custom";
export type AgentPricingModel = "fixed" | "per_run" | "workflow_split";
export type AgentStatus = "active" | "paused" | "draft";
export type Currency = "CSPR" | "USD";

export type ListingStatus = "live" | "paused" | "draft";

export type TaskStatus =
  | "draft"
  | "funded"
  | "running"
  | "proof_pending"
  | "proof_verified"
  | "anchored"
  | "payable"
  | "paid"
  | "blocked"
  | "failed";

export type PaymentStatus =
  | "intent_created"
  | "locked"
  | "unlockable"
  | "paid"
  | "blocked";

export type UnlockRule = "proof_verified" | "workflow_verified";

export type RecipientRole = "primary_agent" | "workflow_step" | "verifier" | "platform";
export type RecipientStatus = "locked" | "unlockable" | "paid" | "blocked";

export type ProofMode = "tee_verification_mode" | "hosted_tee";
export type ProofStatus = "pending" | "verified" | "failed" | "anchored";

// ── API Key Scopes (audit fix C1+H2) ──

export const API_SCOPES = {
  AGENTS_WRITE: "agents:write",
  MARKETPLACE_WRITE: "marketplace:write",
  TASKS_WRITE: "tasks:write",
  PAYMENTS_WRITE: "payments:write",
  VERIFIERS_WRITE: "verifiers:write",
  WORKFLOWS_WRITE: "workflows:write",
  API_KEYS_ADMIN: "api_keys:admin",
  PROOFS_WRITE: "proofs:write",
} as const;

export type ApiScope = (typeof API_SCOPES)[keyof typeof API_SCOPES];

// ── Phase C: Blocky TEE verification types ──

export interface InvoiceRiskInput {
  task_id: string;
  invoice_id: string;
  vendor: string;
  buyer: string;
  amount_usd: number;
  currency: string;
  due_days: number;
  line_items: string[];
  ai_suggested_risk: number;
}

export interface InvoiceRiskOutput {
  success: boolean;
  error: string;
  value: {
    task_id: string;
    invoice_id: string;
    approved: boolean;
    risk_score: number;
    reason_codes: string[];
    policy: string;
    ai_score_accepted: boolean;
  };
}

export interface VerifiedBlockyClaims {
  hash_of_code: string;
  function: string;
  hash_of_input: string;
  output: string;
  hash_of_secrets: string;
}

export type BlockyErrorCode =
  | "CLI_NOT_FOUND"
  | "ATTESTATION_FAILED"
  | "VERIFICATION_FAILED"
  | "INVALID_OUTPUT"
  | "TASK_ID_MISMATCH"
  | "CODE_HASH_MISSING"
  | "RETRY_EXHAUSTED"
  | "HEALTH_CHECK_FAILED"
  | "TIMEOUT"
  | "UNKNOWN";

export interface RetryConfig {
  maxAttempts: number;
  initialDelayMs: number;
  backoffMultiplier: number;
  maxDelayMs: number;
}

export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxAttempts: 3,
  initialDelayMs: 500,
  backoffMultiplier: 2,
  maxDelayMs: 5000,
};

export type VerificationResult =
  | { status: "verified"; claims: VerifiedBlockyClaims; output: InvoiceRiskOutput }
  | { status: "failed"; errorCode: BlockyErrorCode; message: string };

export interface BlockyHealthStatus {
  healthy: boolean;
  cliAvailable: boolean;
  cliVersion: string | null;
  mode: ProofMode;
  error?: string;
}

export type VerifierStatus = "draft" | "active" | "deprecated";

// ── Phase N: Agent execution output types ─

/** Structured output from an agent execution run. */
export interface AgentExecutionOutput {
  /** The task this output belongs to */
  task_id: string;
  /** The agent that produced this output */
  agent_id: string;
  /** Agent-specific structured result (varies by agent type) */
  result: Record<string, unknown>;
  /** ISO-8601 timestamp when execution started */
  started_at: string;
  /** ISO-8601 timestamp when execution completed */
  completed_at: string;
  /** Duration in milliseconds */
  duration_ms: number;
  /** SHA-256 hash of the full result (input + output binding) */
  output_hash: string;
  /** SHA-256 hash of the task input */
  input_hash: string;
  /** Provider/model metadata (only safe fields — no keys) */
  model_metadata: {
    provider: string;
    model: string;
  } | null;
}

/** Invoice Risk Agent specific output. */
export interface InvoiceRiskAgentResult {
  risk_score: number;
  decision: "approve" | "review" | "reject";
  reasoning: string;
  flags: string[];
  recommended_action: string;
  confidence: number;
}

/** LLM provider completion response shape. */
export interface LlmCompletionResponse {
  content: string;
  model: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
  };
}

/** LLM provider interface — swappable backends. */
export interface LlmProvider {
  name: string;
  complete(prompt: string, options?: { temperature?: number; maxTokens?: number }): Promise<LlmCompletionResponse>;
  isConfigured(): boolean;
}

/** LLM provider error codes. */
export type LlmProviderErrorCode =
  | "PROVIDER_NOT_CONFIGURED"
  | "API_KEY_MISSING"
  | "API_REQUEST_FAILED"
  | "INVALID_RESPONSE"
  | "RATE_LIMITED"
  | "TIMEOUT"
  | "UNKNOWN";

export type WorkflowStatus = "active" | "draft";
export type WorkflowRunStatus =
  | "created"
  | "running"
  | "step_failed"
  | "proofs_verified"
  | "anchored"
  | "payable"
  | "paid";

export type WorkflowStepRunStatus = "waiting" | "running" | "verified" | "failed";

// ── 1. Agent ────────────────────────────

export interface Agent {
  id: string;
  owner_address: string;
  name: string;
  slug: string;
  category: AgentCategory;
  description: string;
  short_pitch: string;
  pricing_model: AgentPricingModel;
  base_price: number;
  currency: Currency;
  verifier_ids: string[];
  supported_task_types: string[];
  status: AgentStatus;
  created_at: string;
  updated_at: string;
}

// ── 2. MarketplaceListing ───────────────

export interface MarketplaceListing {
  id: string;
  agent_id: string;
  owner_address: string;
  title: string;
  category: string;
  summary: string;
  price_amount: number;
  currency: Currency;
  proof_requirement: string;
  verifier_id: string;
  reputation_score: number;
  total_verified_runs: number;
  total_paid_tasks: number;
  failure_rate: number;
  status: ListingStatus;
  created_at: string;
  updated_at: string;
}

// ── 3. Task ─────────────────────────────

export interface Task {
  id: string;
  buyer_address: string;
  agent_id: string;
  listing_id: string | null;
  workflow_run_id: string | null;
  title: string;
  input: Record<string, unknown>;
  task_type: string;
  payment_id: string | null;
  proof_ids: string[];
  status: TaskStatus;
  created_at: string;
  updated_at: string;
}

// ── 4. Payment ──────────────────────────

export interface Payment {
  id: string;
  task_id: string | null;
  workflow_run_id: string | null;
  buyer_address: string;
  total_amount: number;
  currency: Currency;
  status: PaymentStatus;
  recipients: PaymentRecipient[];
  split_hash: string | null;
  unlock_rule: UnlockRule;
  created_at: string;
  updated_at: string;
}

// ── 5. PaymentRecipient ─────────────────

export interface PaymentRecipient {
  id: string;
  payment_id: string;
  agent_id: string | null;
  verifier_id: string | null;
  address: string;
  share_bps: number;
  role: RecipientRole;
  proof_required: boolean;
  proof_id: string | null;
  status: RecipientStatus;
  created_at: string;
}

// ── 6. Proof ────────────────────────────

export interface Proof {
  id: string;
  task_id: string | null;
  parent_proof_id: string | null;
  workflow_run_id: string | null;
  workflow_step_run_id: string | null;
  agent_id: string;
  verifier_id: string;
  input_hash: string;
  output_hash: string;
  wasm_hash: string;
  attestation_hash: string;
  casper_anchor_hash: string | null;
  mode: ProofMode;
  status: ProofStatus;
  created_at: string;
}

// ── 7. VerifierTemplate ─────────────────

export interface VerifierTemplate {
  id: string;
  owner_address: string;
  name: string;
  slug: string;
  description: string;
  task_type: string;
  input_schema: Record<string, unknown>;
  output_schema: Record<string, unknown>;
  wasm_hash: string;
  wasm_file_url: string | null;
  mode_support: ProofMode[];
  status: VerifierStatus;
  created_at: string;
  updated_at: string;
}

// ── 8. WorkflowTemplate ─────────────────

export interface WorkflowTemplate {
  id: string;
  owner_address: string;
  name: string;
  description: string;
  category: string;
  steps: WorkflowStepTemplate[];
  payment_split_default: PaymentRecipient[];
  status: WorkflowStatus;
  created_at: string;
  updated_at: string;
}

export interface WorkflowStepTemplate {
  id: string;
  order: number;
  name: string;
  agent_id: string;
  verifier_id: string;
  required: boolean;
  payment_share_bps: number;
}

// ── 9. WorkflowRun ──────────────────────

export interface WorkflowRun {
  id: string;
  template_id: string;
  buyer_address: string;
  payment_id: string | null;
  status: WorkflowRunStatus;
  step_runs: WorkflowStepRun[];
  final_proof_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface WorkflowStepRun {
  id: string;
  workflow_run_id: string;
  step_template_id: string;
  agent_id: string;
  verifier_id: string;
  proof_id: string | null;
  status: WorkflowStepRunStatus;
  output: Record<string, unknown> | null;
}

// ── 10. AgentReputation ─────────────────

export interface AgentReputation {
  agent_id: string;
  score: number;
  verified_runs: number;
  failed_runs: number;
  paid_tasks: number;
  blocked_tasks: number;
  total_earned: number;
  average_verification_time_ms: number;
  last_proof_at: string | null;
  updated_at: string;
}

// ── 11. ApiKey ──────────────────────────

export interface ApiKey {
  id: string;
  owner_address: string;
  name: string;
  prefix: string;
  hashed_secret: string;
  scopes: string[];
  last_used_at: string | null;
  created_at: string;
  revoked_at: string | null;
}

// ── 12. SystemEvent ─────────────────────

export interface SystemEvent {
  id: number;
  event_type: string;
  entity_type: string;
  entity_id: string;
  payload: Record<string, unknown>;
  created_at: string;
}

// ── Health ──────────────────────────────

export interface HealthResponse {
  status: "ok";
  mode: "tee_verification_mode";
  timestamp: string;
  uptime_seconds: number;
}
