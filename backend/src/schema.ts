// ────────────────────────────────────────
// Sealrail Database Schema
// All 12 CREATE TABLE statements per SEALRAIL_BACKEND_IMPLEMENTATION_PLAN.md §4
// ────────────────────────────────────────

export const SCHEMA = `
-- 4.1 agents
CREATE TABLE IF NOT EXISTS agents (
  id TEXT PRIMARY KEY,
  owner_address TEXT NOT NULL,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  category TEXT NOT NULL CHECK(category IN ('invoice','defi','research','compliance','custom')),
  description TEXT NOT NULL DEFAULT '',
  short_pitch TEXT NOT NULL DEFAULT '',
  pricing_model TEXT NOT NULL CHECK(pricing_model IN ('fixed','per_run','workflow_split')),
  base_price REAL NOT NULL DEFAULT 0,
  currency TEXT NOT NULL CHECK(currency IN ('CSPR','USD')),
  verifier_ids TEXT NOT NULL DEFAULT '[]',
  supported_task_types TEXT NOT NULL DEFAULT '[]',
  status TEXT NOT NULL CHECK(status IN ('active','paused','draft')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 4.2 marketplace_listings
CREATE TABLE IF NOT EXISTS marketplace_listings (
  id TEXT PRIMARY KEY,
  agent_id TEXT NOT NULL REFERENCES agents(id),
  owner_address TEXT NOT NULL,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  summary TEXT NOT NULL DEFAULT '',
  price_amount REAL NOT NULL DEFAULT 0,
  currency TEXT NOT NULL CHECK(currency IN ('CSPR','USD')),
  proof_requirement TEXT NOT NULL DEFAULT 'proof_verified',
  verifier_id TEXT NOT NULL,
  reputation_score REAL NOT NULL DEFAULT 50,
  total_verified_runs INTEGER NOT NULL DEFAULT 0,
  total_paid_tasks INTEGER NOT NULL DEFAULT 0,
  failure_rate REAL NOT NULL DEFAULT 0,
  status TEXT NOT NULL CHECK(status IN ('live','paused','draft')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 4.3 tasks
CREATE TABLE IF NOT EXISTS tasks (
  id TEXT PRIMARY KEY,
  buyer_address TEXT NOT NULL DEFAULT '',
  agent_id TEXT NOT NULL,
  listing_id TEXT,
  workflow_run_id TEXT,
  title TEXT NOT NULL DEFAULT '',
  input TEXT NOT NULL DEFAULT '{}',
  task_type TEXT NOT NULL DEFAULT 'invoice_risk',
  payment_id TEXT,
  proof_ids TEXT NOT NULL DEFAULT '[]',
  status TEXT NOT NULL CHECK(status IN ('draft','funded','running','proof_pending','proof_verified','anchored','payable','paid','blocked','failed')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 4.4 payments
CREATE TABLE IF NOT EXISTS payments (
  id TEXT PRIMARY KEY,
  task_id TEXT,
  workflow_run_id TEXT,
  buyer_address TEXT NOT NULL,
  total_amount REAL NOT NULL DEFAULT 0,
  currency TEXT NOT NULL CHECK(currency IN ('CSPR','USD')),
  status TEXT NOT NULL CHECK(status IN ('intent_created','locked','unlockable','paid','blocked')),
  recipients TEXT NOT NULL DEFAULT '[]',
  split_hash TEXT,
  unlock_rule TEXT NOT NULL CHECK(unlock_rule IN ('proof_verified','workflow_verified')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 4.5 payment_recipients
CREATE TABLE IF NOT EXISTS payment_recipients (
  id TEXT PRIMARY KEY,
  payment_id TEXT NOT NULL REFERENCES payments(id),
  agent_id TEXT,
  verifier_id TEXT,
  address TEXT NOT NULL,
  share_bps INTEGER NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('primary_agent','workflow_step','verifier','platform')),
  proof_required INTEGER NOT NULL DEFAULT 1,
  proof_id TEXT,
  status TEXT NOT NULL CHECK(status IN ('locked','unlockable','paid','blocked')),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 4.6 proofs
CREATE TABLE IF NOT EXISTS proofs (
  id TEXT PRIMARY KEY,
  task_id TEXT,
  parent_proof_id TEXT,
  workflow_run_id TEXT,
  workflow_step_run_id TEXT,
  agent_id TEXT NOT NULL,
  verifier_id TEXT NOT NULL,
  input_hash TEXT NOT NULL,
  output_hash TEXT NOT NULL,
  wasm_hash TEXT NOT NULL,
  attestation_hash TEXT NOT NULL,
  casper_anchor_hash TEXT,
  mode TEXT NOT NULL CHECK(mode IN ('tee_verification_mode','hosted_tee')),
  status TEXT NOT NULL CHECK(status IN ('pending','verified','failed','anchored')),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 4.7 verifier_templates
CREATE TABLE IF NOT EXISTS verifier_templates (
  id TEXT PRIMARY KEY,
  owner_address TEXT NOT NULL,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  task_type TEXT NOT NULL,
  input_schema TEXT NOT NULL DEFAULT '{}',
  output_schema TEXT NOT NULL DEFAULT '{}',
  wasm_hash TEXT NOT NULL,
  wasm_file_url TEXT,
  mode_support TEXT NOT NULL DEFAULT '["tee_verification_mode"]',
  status TEXT NOT NULL CHECK(status IN ('draft','active','deprecated')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 4.8 workflow_templates
CREATE TABLE IF NOT EXISTS workflow_templates (
  id TEXT PRIMARY KEY,
  owner_address TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL DEFAULT 'invoice',
  steps TEXT NOT NULL DEFAULT '[]',
  payment_split_default TEXT NOT NULL DEFAULT '[]',
  status TEXT NOT NULL CHECK(status IN ('active','draft')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 4.8 workflow_runs
CREATE TABLE IF NOT EXISTS workflow_runs (
  id TEXT PRIMARY KEY,
  template_id TEXT NOT NULL,
  buyer_address TEXT NOT NULL,
  payment_id TEXT,
  status TEXT NOT NULL CHECK(status IN ('created','running','step_failed','proofs_verified','anchored','payable','paid')),
  step_runs TEXT NOT NULL DEFAULT '[]',
  final_proof_id TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 4.9 agent_reputation
CREATE TABLE IF NOT EXISTS agent_reputation (
  agent_id TEXT PRIMARY KEY REFERENCES agents(id),
  score REAL NOT NULL DEFAULT 50,
  verified_runs INTEGER NOT NULL DEFAULT 0,
  failed_runs INTEGER NOT NULL DEFAULT 0,
  paid_tasks INTEGER NOT NULL DEFAULT 0,
  blocked_tasks INTEGER NOT NULL DEFAULT 0,
  total_earned REAL NOT NULL DEFAULT 0,
  average_verification_time_ms REAL NOT NULL DEFAULT 0,
  last_proof_at TEXT,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 4.10 api_keys
CREATE TABLE IF NOT EXISTS api_keys (
  id TEXT PRIMARY KEY,
  owner_address TEXT NOT NULL,
  name TEXT NOT NULL,
  prefix TEXT NOT NULL,
  hashed_secret TEXT NOT NULL,
  scopes TEXT NOT NULL DEFAULT '[]',
  last_used_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  revoked_at TEXT
);

-- 4.11 system_events
CREATE TABLE IF NOT EXISTS system_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_type TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  payload TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
`;
