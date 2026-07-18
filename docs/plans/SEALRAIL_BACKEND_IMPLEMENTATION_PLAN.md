# Sealrail Backend Implementation Plan

Project: Sealrail on Casper
Core positioning: No Proof without a Payment.
Phase: Backend-only implementation kickoff
Date: 2026-06-30
Author: Master Forge backend/architect/security lens
Constraints: Casper Odra, Blocky AS verification adapter, SQLite

## 0. Phase boundary

This plan covers backend implementation only. Frontend implementation is deferred per user instruction. The DESIGN.md frontend UI direction is approved, but no frontend code ships in this phase.

Do not:
- Build frontend pages
- Deploy to any environment
- Expose secrets, API keys, or wallet credentials
- Overstate hosted enclave execution before the hosted service is fully connected
- Use implementation-mode language in public/judge-facing output

Do:
- Build every backend service, route, and data model
- Wire the Blocky adapter through its real CLI path
- Implement the Odra contract with full test coverage
- Implement the payment state machine with enforcement
- Build the marketplace backend, orchestration engine, split calculator, reputation scorer, API key manager, and verifier template store
- Return verifiable test output and curl-based verification gates

## 1. Technology stack

```text
Backend runtime:    Node.js 20+ with TypeScript 5.x
HTTP framework:     Fastify 5.x (preferred) or Express 5.x
Persistence:        SQLite via better-sqlite3 (synchronous, fast, zero-config)
Contract language:  Rust with Odra framework (Casper smart contract)
Attestation CLI:    bky-as, bky-c through the TEE verification adapter
Casper CLI:         casper-client, cargo-odra
Hashing:            Node.js crypto (SHA-256, SHA3-512)
Key hashing:        crypto.scryptSync or argon2
Package manager:    npm
```

Why SQLite and not PostgreSQL for this phase:
1. Zero external dependency for hackathon judging.
2. better-sqlite3 is synchronous and fast enough for single-server workloads.
3. Schema migration is built into the startup path (no external migration tool).
4. Upgrade path to PostgreSQL is documented but not built now.

## 2. Exact backend build order

Build one phase at a time. Each phase gates on passing tests before the next begins.

### Phase A: Foundation

| Step | Deliverable | Files |
|---|---|---|
| A1 | Backend package and config | `backend/package.json`, `backend/tsconfig.json`, `backend/.env.example` |
| A2 | Database schema and migration | `backend/src/db.ts`, `backend/src/schema.ts` |
| A3 | Shared type definitions | `backend/src/types.ts` |
| A4 | Fastify server with health check | `backend/src/index.ts` |
| A5 | Environment config loader | `backend/src/config.ts` |

Verification gate:
```bash
curl http://localhost:3001/health
# {"status":"ok","mode":"tee_verification_mode"}
```

### Phase B: Odra proof registry contract

| Step | Deliverable | Files |
|---|---|---|
| B1 | Cargo project scaffold | `contracts/verified-agent-payments/Cargo.toml`, `rust-toolchain.toml` |
| B2 | Contract storage and types | `contracts/verified-agent-payments/src/lib.rs` |
| B3 | Entry points (register, create, anchor, mark paid) | same file |
| B4 | Events and error enums | same file |
| B5 | Contract tests | `contracts/verified-agent-payments/tests/proof_registry.rs` |

Verification gate:
```bash
cd contracts/verified-agent-payments && cargo odra test
# All tests pass
```

### Phase C: Blocky adapter service

| Step | Deliverable | Files |
|---|---|---|
| C1 | Blocky provider interface | `backend/src/services/blocky.ts` |
| C2 | TEE verification adapter path | same file |
| C3 | Verification and claims parsing | same file |
| C4 | Output validation (task_id, function name, code hash) | same file |

Verification gate:
```bash
curl -X POST http://localhost:3001/api/internal/blocky/test -H "Content-Type: application/json" -d '{"task_id":"test-001","invoice_id":"INV-001","vendor":"Test","buyer":"Test","amount_usd":1000,"currency":"USD","due_days":30,"line_items":[],"ai_suggested_risk":20}'
# Returns verified Blocky claims with expected hash_of_code
```

### Phase D: Casper anchoring adapter

| Step | Deliverable | Files |
|---|---|---|
| D1 | Casper provider interface (dry-run / testnet) | `backend/src/services/casper.ts` |
| D2 | Dry-run mode: deterministic deploy hash for backend verification | same file |
| D3 | Testnet mode: casper-client deploy path | same file |
| D4 | Task persistence with anchor hash | integration with `backend/src/services/tasks.ts` |

Verification gate:
```bash
curl -X POST http://localhost:3001/api/tasks/anchored-001/anchor
# Returns deterministic anchor hash with mode=tee_verification_mode label
```

### Phase E: Core task and payment state machine

| Step | Deliverable | Files |
|---|---|---|
| E1 | Task service (create, read, state transitions) | `backend/src/services/tasks.ts` |
| E2 | Payment service (intent, split, unlock, claim) | `backend/src/services/payments.ts` |
| E3 | State machine enforcement (valid transitions only) | embedded in services |
| E4 | Task API routes | `backend/src/routes/tasks.ts` |
| E5 | Payment API routes | `backend/src/routes/payments.ts` |

Verification gate:
```bash
# Full loop via curl
curl -X POST http://localhost:3001/api/tasks -d '{...}'
# {"task_id":"...","payment_state":"funded"}
curl -X POST http://localhost:3001/api/tasks/.../run-proof
# {"verified":true,"attestation_hash":"..."}
curl -X POST http://localhost:3001/api/tasks/.../anchor
# {"payment_state":"anchored","casper_anchor_hash":"..."}
curl -X POST http://localhost:3001/api/tasks/.../unlock-payment
# {"payment_state":"payable"}
# Reject invalid transitions with 400
```

### Phase F: Agent registry service

| Step | Deliverable | Files |
|---|---|---|
| F1 | Agent service (CRUD) | `backend/src/services/agents.ts` |
| F2 | Agent API routes | `backend/src/routes/agents.ts` |
| F3 | Agent-Casper registration sync | integration with casper.ts |

### Phase G: Marketplace backend

| Step | Deliverable | Files |
|---|---|---|
| G1 | Listing service (CRUD) | `backend/src/services/marketplace.ts` |
| G2 | Listing-task creation link | same file |
| G3 | Marketplace API routes | `backend/src/routes/marketplace.ts` |

### Phase H: Multi-agent orchestration engine

| Step | Deliverable | Files |
|---|---|---|
| H1 | Workflow template service | `backend/src/services/workflows.ts` |
| H2 | Workflow run engine (ordered step execution) | same file |
| H3 | Step proof generation and final bundle | same file |
| H4 | Workflow API routes | `backend/src/routes/workflows.ts` |

### Phase I: Payment split engine

| Step | Deliverable | Files |
|---|---|---|
| I1 | Split calculator (share basis points) | `backend/src/services/splits.ts` |
| I2 | Split proof dependency resolution | same file |
| I3 | Split unlock per-recipient state | same file |
| I4 | Split API routes | `backend/src/routes/payments.ts` (extends Phase E) |

### Phase J: Reputation scoring engine

| Step | Deliverable | Files |
|---|---|---|
| J1 | Score calculator (real proof/payment data) | `backend/src/services/reputation.ts` |
| J2 | Periodic or on-event recalculation | same file |
| J3 | Reputation API routes | `backend/src/routes/agents.ts` (extends Phase F) |

### Phase K: API key management

| Step | Deliverable | Files |
|---|---|---|
| K1 | Key generation and hashing service | `backend/src/services/api-keys.ts` |
| K2 | Scoped middleware | `backend/src/middleware/auth.ts` |
| K3 | Key management API routes | `backend/src/routes/api-keys.ts` |

### Phase L: Verifier template backend

| Step | Deliverable | Files |
|---|---|---|
| L1 | Verifier template service (CRUD) | `backend/src/services/verifiers.ts` |
| L2 | WASM hash registration | same file |
| L3 | Test-verifier action | same file |
| L4 | Verifier API routes | `backend/src/routes/verifiers.ts` |

### Phase M: Backend integration tests and verification gates

| Step | Deliverable | Files |
|---|---|---|
| M1 | Full-loop integration test script | `backend/tests/integration.test.ts` |
| M2 | Curl-based verification runbook | `docs/plans/VERIFICATION_GATES.md` |
| M3 | State machine enforcement tests | same test file |
| M4 | Error path tests | same test file |

## 3. Complete API route map

All routes are prefixed with `/api`. Authentication is wallet-address-based for owner operations; read operations are public.

### 3.1 Health and status

```text
GET /api/health
GET /api/status
```

### 3.2 Tasks

```text
POST   /api/tasks                          Create a payment-backed task
GET    /api/tasks/:taskId                  Get full task with proof trail
POST   /api/tasks/:taskId/run              Execute agent + run Blocky attestation
POST   /api/tasks/:taskId/verify           Verify Blocky attestation claims
POST   /api/tasks/:taskId/anchor           Anchor proof hash on Casper
POST   /api/tasks/:taskId/unlock-payment   Transition payment to payable
```

### 3.3 Payments

```text
POST   /api/payments/intents               Create a payment intent
GET    /api/payments/:paymentId            Get payment with split detail
POST   /api/payments/:paymentId/splits     Calculate and store payment splits
POST   /api/payments/:paymentId/unlock     Unlock payment after proof
POST   /api/payments/:paymentId/claim      Claim a recipient share
```

### 3.4 Proofs

```text
GET    /api/proofs                         List proofs with filters
GET    /api/proofs/:proofId                Get single proof detail
GET    /api/proofs/by-task/:taskId         Get proofs for a task
POST   /api/proofs/:proofId/anchor         Re-anchor proof on Casper
```

### 3.5 Agents

```text
GET    /api/agents                         List registered agents
GET    /api/agents/:agentId                Get agent profile
POST   /api/agents                         Register a new agent (owner auth)
PATCH  /api/agents/:agentId                Update agent (owner auth)
GET    /api/agents/:agentId/reputation     Get agent reputation
GET    /api/agents/:agentId/proofs         Get agent proof history
```

### 3.6 Marketplace

```text
GET    /api/marketplace                    List live listings
GET    /api/marketplace/:listingId         Get listing detail
POST   /api/marketplace/listings           Create listing (owner auth)
PATCH  /api/marketplace/listings/:listingId Update listing (owner auth)
POST   /api/marketplace/:listingId/tasks   Create task from listing
```

### 3.7 Workflows

```text
GET    /api/workflows                      List workflow templates
POST   /api/workflows                      Create workflow template
GET    /api/workflows/:workflowId          Get workflow detail
POST   /api/workflows/:workflowId/run      Create and start a workflow run
GET    /api/workflow-runs/:runId           Get workflow run status
POST   /api/workflow-runs/:runId/steps/:stepId/run  Execute one step
POST   /api/workflow-runs/:runId/finalize  Finalize and bundle proofs
```

### 3.8 Verifiers

```text
GET    /api/verifiers                      List verifier templates
GET    /api/verifiers/:verifierId          Get verifier detail
POST   /api/verifiers                      Register verifier template
POST   /api/verifiers/upload               Upload WASM + register template
PATCH  /api/verifiers/:verifierId          Update verifier
POST   /api/verifiers/:verifierId/test     Test verifier with sample input
```

### 3.9 API keys

```text
GET    /api/api-keys                       List API keys (prefix only, no secret)
POST   /api/api-keys                       Create API key (secret shown once)
PATCH  /api/api-keys/:keyId                Update key scopes or name
DELETE /api/api-keys/:keyId                Revoke key
```

### 3.10 Owner dashboard data

```text
GET    /api/owner/dashboard                Aggregated owner stats
GET    /api/owner/agents                   List owned agents
GET    /api/owner/listings                 List owned listings
GET    /api/owner/tasks                    List tasks for owned agents
GET    /api/owner/earnings                 Earnings summary
```

## 4. Data models (backend persistence)

All models use the types defined in `docs/FULL_ECOSYSTEM_BUILD_SCOPE.md` section 5. Below are the SQLite table schemas.

### 4.1 agents

```sql
CREATE TABLE agents (
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
```

### 4.2 marketplace_listings

```sql
CREATE TABLE marketplace_listings (
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
```

### 4.3 tasks

```sql
CREATE TABLE tasks (
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
```

### 4.4 payments

```sql
CREATE TABLE payments (
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
```

### 4.5 payment_recipients

```sql
CREATE TABLE payment_recipients (
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
```

### 4.6 proofs

```sql
CREATE TABLE proofs (
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
```

### 4.7 verifier_templates

```sql
CREATE TABLE verifier_templates (
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
```

### 4.8 workflow_templates and workflow_runs

```sql
CREATE TABLE workflow_templates (
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

CREATE TABLE workflow_runs (
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
```

### 4.9 agent_reputation

```sql
CREATE TABLE agent_reputation (
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
```

### 4.10 api_keys

```sql
CREATE TABLE api_keys (
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
```

### 4.11 system_events

```sql
CREATE TABLE system_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_type TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  payload TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
```

## 5. Odra contract scope (Casper on-chain)

Contract name: `VerifiedAgentPayments`

### 5.1 Storage

```rust
pub struct VerifiedAgentPayments {
    owner: Var<Address>,
    agents: Mapping<String, AgentRecord>,
    agent_registered: Mapping<String, bool>,
    tasks: Mapping<String, TaskRecord>,
    task_registered: Mapping<String, bool>,
    payment_states: Mapping<String, String>,
}
```

Sentinel mappings for existence checks (OdraVM Mapping can return defaults).

### 5.2 Entry points

```rust
pub fn init(&mut self)
pub fn register_agent(&mut self, agent_id: String, name: String, verifier_function: String, wasm_code_hash: String)
pub fn create_payment_intent(&mut self, task_id: String, agent_id: String, payment_amount: U512)
pub fn anchor_proof(&mut self, task_id: String, input_hash: String, output_hash: String, attestation_hash: String)
pub fn mark_paid(&mut self, task_id: String)
pub fn get_agent(&self, agent_id: String) -> Option<AgentRecord>
pub fn get_task(&self, task_id: String) -> Option<TaskRecord>
pub fn get_payment_state(&self, task_id: String) -> Option<String>
```

### 5.3 Events

```rust
AgentRegistered { agent_id: String, owner: Address }
PaymentIntentCreated { task_id: String, agent_id: String, amount: U512 }
ProofAnchored { task_id: String, attestation_hash: String }
PaymentMarkedPaid { task_id: String }
```

### 5.4 Errors

```rust
NotOwner
AgentNotFound
AgentInactive
AgentAlreadyExists
TaskNotFound
TaskAlreadyExists
ProofAlreadyAnchored
ProofMissing
PaymentNotVerified
```

### 5.5 Contract test cases

1. `register_agent` creates agent with correct fields
2. `register_agent` rejects duplicate agent_id
3. `create_payment_intent` with valid agent succeeds
4. `create_payment_intent` with unknown agent fails
5. `anchor_proof` for existing task succeeds
6. `anchor_proof` for missing task fails
7. `anchor_proof` twice for same task fails
8. `mark_paid` before proof anchor fails
9. `mark_paid` after proof anchor succeeds
10. `get_agent` / `get_task` return correct records

## 6. Proof and payment state machine

### 6.1 Payment state transitions

```
funded -> proof_pending -> proof_verified -> anchored -> payable -> paid
  |            |                |               |           |        |
  +----> blocked               +----> failed    +----> blocked       |
  +----> failed                                                      |
  +----> blocked
```

Valid transitions enforced:
- `funded` -> `proof_pending` (on agent execution start)
- `proof_pending` -> `proof_verified` (on Blocky verification pass)
- `proof_pending` -> `failed` (on Blocky verification failure)
- `proof_pending` -> `blocked` (on unrecoverable error)
- `proof_verified` -> `anchored` (on Casper anchor success)
- `proof_verified` -> `blocked` (on Casper anchor failure)
- `anchored` -> `payable` (on payment unlock)
- `payable` -> `paid` (on payment claim)

Invalid transitions return HTTP 400 with reason.

### 6.2 Required proof data per transition

Every transition must carry:

| From | To | Required data stored |
|---|---|---|
| funded | proof_pending | agent_id, input_hash |
| proof_pending | proof_verified | attestation_hash, wasm_hash, output_hash, claims |
| proof_verified | anchored | casper_anchor_hash, input_hash, output_hash, attestation_hash |
| anchored | payable | unlock_rule satisfied |
| payable | paid | claim reference or tx hash |

### 6.3 Blocky attestation mapping to proof record

```text
Blocky verified claim        ->  Proof record field
─────────────────────────────────────────────────────
hash_of_code                 ->  wasm_hash
hash_of_input                ->  input_hash
output (decoded)             ->  output_hash (hashed)
attestation file hash        ->  attestation_hash
Casper deploy/transaction    ->  casper_anchor_hash
```

## 7. Marketplace backend rules

### 7.1 Listing creation rules

1. Agent must exist and be `active`.
2. At least one verifier must be attached to the agent.
3. `verifier_id` on the listing must match one of the agent's `verifier_ids`.
4. Listing status starts as `draft`; owner must explicitly set to `live`.
5. Reputation is pulled from `agent_reputation` at read time, not stored on the listing.

### 7.2 Task creation from listing

1. Listing must be `live`.
2. Agent must be `active`.
3. Task is created with `listing_id` reference.
4. Payment intent is created with the listing's price and currency.
5. Task status starts as `funded`.

## 8. Multi-agent orchestration backend scope

### 8.1 Workflow template structure

A workflow template contains an ordered array of steps. Each step references:
- `agentId` - which agent executes the step
- `verifierId` - which verifier checks the output
- `paymentShareBps` - share in basis points (10000 = 100%)

### 8.2 Workflow run execution rules

1. Create workflow run from template.
2. Create one payment with all step recipients pre-configured.
3. Execute steps in order; each step is a mini task run:
   a. Run agent (generate output).
   b. Run Blocky attestation on output.
   c. Verify attestation claims.
   d. Store proof record for the step.
4. After all steps pass, create a final proof bundle.
5. Final proof hash = SHA-256(step_proof_1.hash + step_proof_2.hash + ... + step_proof_N.hash).
6. Anchor final proof hash on Casper.
7. Unlock each recipient share based on their proof dependency.

### 8.3 Step failure handling

If any step fails:
1. Mark the step as `failed`.
2. Mark the workflow run as `step_failed`.
3. Block the corresponding recipient share.
4. Do not unlock any subsequent steps.

## 9. Payment split data rules

### 9.1 Split calculation

Inputs:
- Total payment amount from the task or workflow run.
- Recipient list with `shareBps` per recipient.

Validation:
```text
sum of all shareBps MUST equal 10000.
No recipient may have shareBps < 1.
No payment may have zero recipients.
```

### 9.2 Split proof dependency

Each recipient has `proofRequired: boolean`.
- If true: the recipient's share is locked until their proof is verified.
- If false: the recipient's share unlocks when the aggregate payment unlocks.

For workflows: each step's agent share is locked until that step's proof is `verified`.

### 9.3 Split hash

```text
split_hash = SHA-256(
  payment_id +
  recipient[0].address + recipient[0].shareBps +
  recipient[1].address + recipient[1].shareBps +
  ... +
  recipient[N].address + recipient[N].shareBps
)
```

This hash is anchored on Casper alongside the final proof hash for workflows.

### 9.4 Recipient state machine

```text
locked -> unlockable -> paid
  |           |
  +----> blocked
```

A recipient becomes `unlockable` when:
- `proofRequired` is false AND the payment aggregate is `unlockable`, OR
- `proofRequired` is true AND the recipient's proof is `verified` AND the payment aggregate is `unlockable`.

## 10. Reputation scoring rules

### 10.1 Formula

```text
score = 50
  + min(25, verified_runs * 2)
  + min(15, paid_tasks * 2)
  - min(25, failed_runs * 5)
  - min(15, blocked_tasks * 3)

Clamp final score to [0, 100].
```

### 10.2 Data sources

All inputs come from real database records:
- `verified_runs`: count of proofs with status `verified` or `anchored` for this agent.
- `failed_runs`: count of proofs with status `failed` for this agent.
- `paid_tasks`: count of tasks with status `paid` for this agent.
- `blocked_tasks`: count of tasks with status `blocked` for this agent.
- `total_earned`: sum of payment amounts for paid tasks.
- `average_verification_time_ms`: average time between proof `pending` and `verified`.
- `last_proof_at`: timestamp of most recent proof.

### 10.3 Recalculation trigger

Reputation is recalculated:
1. When a proof transitions to `verified` or `failed`.
2. When a task transitions to `paid` or `blocked`.
3. On explicit request via internal admin endpoint.
4. No fabricated or placeholder scores.

## 11. API key security rules

### 11.1 Key generation

```text
1. Generate a cryptographically random 32-byte value.
2. Encode as base64url for the raw key.
3. Prefix: first 8 characters of the raw key in base64url (for display).
4. Hashed secret: scrypt(raw_key, salt, 64) stored as hex.
5. Raw key is returned ONCE in the create response.
6. After the response, raw key is NOT stored and cannot be recovered.
```

### 11.2 Key format

```text
sk_<base64url-encoded-32-bytes>
```

Example: `sk_aB3xK9mW2pQ7vR5tY8nL1cF4dJ6hM0sA`

### 11.3 Authentication middleware

1. Extract `Authorization: Bearer sk_...` header.
2. Split the key into prefix and body.
3. Look up key by prefix (indexed query).
4. Verify the hashed secret against the full key body.
5. Check `revoked_at IS NULL`.
6. Check required scope against key's scopes array.
7. Update `last_used_at` on success.
8. Return 401 on any failure.

### 11.4 Scopes

```text
tasks:read        - Read task data
tasks:write       - Create and manage tasks
proofs:read       - Read proof data
agents:read       - Read agent data
agents:write      - Create and manage agents (owner-level)
verifiers:write   - Register and manage verifier templates
workflows:write   - Create and run workflows
marketplace:write - Create and manage listings
```

### 11.5 Key management endpoints

- Create: returns raw key once. Stores hashed.
- List: returns id, name, prefix, scopes, created_at, last_used_at, revoked_at. Never returns secret.
- Patch: update name and/or scopes.
- Delete: sets `revoked_at` to now. Does not delete the row (audit trail).

## 12. Verifier template backend rules

### 12.1 Registration requirements

1. `name` and `slug` are required. Slug must be unique.
2. `taskType` must be a recognized type.
3. `inputSchema` must be valid JSON schema (validated at registration).
4. `outputSchema` must be valid JSON schema.
5. `wasmHash` must be a 128-character hex string (SHA3-512).
6. `modeSupport` must be a non-empty array of supported modes.
7. Status starts as `draft`. Owner must explicitly promote to `active`.

### 12.2 WASM file upload

If WASM file upload is available:
1. Accept multipart upload.
2. Compute SHA3-512 hash of the uploaded bytes.
3. Validate that the computed hash matches the declared `wasmHash`.
4. Store the file with a path like `verifiers/<verifier_id>/function.wasm`.
5. Set `wasmFileUrl` to the stored path.

If upload is not available yet:
1. Require a `wasmHash` field.
2. Store metadata only.
3. The `test` action will look for the WASM file at a known path.

### 12.3 Test verifier action

```text
POST /api/verifiers/:verifierId/test
Body: { "task_id": "...", "input": { ... } }

1. Load the verifier template record.
2. Locate the WASM file (from wasmFileUrl or known path).
3. Build a fn-call.json with the input.
4. Run bky-as attest-fn-call.
5. Run bky-as verify-fn-call.
6. Return decoded output and claims.
```

### 12.4 Supported modes

```text
tee_verification_mode - TEE verification adapter mode
hosted_tee - Hosted TEE service path
```

Every verifier must declare which modes it supports. The default is `["tee_verification_mode"]`.

## 13. File structure (complete backend)

```text
casper-tee-agent-payments/
  contracts/
    verified-agent-payments/
      Cargo.toml
      rust-toolchain.toml
      src/lib.rs
      tests/proof_registry.rs
  backend/
    package.json
    tsconfig.json
    .env.example
    src/
      index.ts                  # Fastify server entry point
      config.ts                 # Environment config loader
      db.ts                     # SQLite connection and migration runner
      schema.ts                 # CREATE TABLE statements
      types.ts                  # Shared TypeScript types
      middleware/
        auth.ts                 # API key authentication middleware
        error-handler.ts        # Global error handler
      routes/
        health.ts
        tasks.ts
        payments.ts
        proofs.ts
        agents.ts
        marketplace.ts
        workflows.ts
        verifiers.ts
        api-keys.ts
        owner.ts
      services/
        tasks.ts
        payments.ts
        proofs.ts
        agents.ts
        marketplace.ts
        workflows.ts
        splits.ts
        reputation.ts
        verifiers.ts
        api-keys.ts
        blocky.ts               # Blocky AS adapter
        casper.ts               # Casper anchoring adapter
      utils/
        hashing.ts              # SHA-256, SHA3-512, scrypt helpers
        id-generator.ts         # Task/payment/proof ID generation
        json-schema.ts          # JSON schema validation
    tests/
      integration.test.ts
      state-machine.test.ts
  blocky/
    invoice-verifier/
      main.go
      go.mod
      go.sum
      main.wasm
      fn-call.template.json
```

## 14. Environment variables

```text
# Required
DATABASE_PATH=./data/sealrail.db

# Blocky
BLOCKY_MODE=local-server
BLOCKY_AS_API_KEY=
BLOCKY_AS_HOST=
BLOCKY_CONFIG_PATH=
BLOCKY_WASM_DIR=../blocky/invoice-verifier

# Casper
CASPER_RPC_URL=http://localhost:11101
CASPER_CHAIN_NAME=casper-net-1
CASPER_ACCOUNT_KEY_PATH=
CSPR_CLOUD_API_KEY=
CSPR_CLOUD_TOKEN=
CASPER_MODE=local

# Server
PORT=3001
HOST=0.0.0.0
NODE_ENV=development

# Security
API_KEY_SCRYPT_SALT_LENGTH=32
API_KEY_HASH_LENGTH=64
```

## 15. Test commands

### 15.1 Contract tests

```bash
cd contracts/verified-agent-payments
cargo odra test
```

### 15.2 Backend unit tests

```bash
cd backend
npm test
```

### 15.3 Backend integration tests (with running server)

```bash
cd backend
npm run dev &
sleep 2
npm run test:integration
```

### 15.4 Curl-based verification gates

Full loop test:
```bash
# 1. Health check
curl -s http://localhost:3001/api/health | jq .

# 2. Register an agent
curl -s -X POST http://localhost:3001/api/agents \
  -H "Content-Type: application/json" \
  -d '{"name":"Invoice Risk Agent","category":"invoice","pricingModel":"fixed","basePrice":10,"currency":"CSPR","verifierIds":["vfr-invoice-risk-v1"],"supportedTaskTypes":["invoice_risk"]}' | jq .

# 3. Create a task
curl -s -X POST http://localhost:3001/api/tasks \
  -H "Content-Type: application/json" \
  -d '{"agentId":"agent-001","invoice_id":"INV-2026-001","vendor":"Lagos Solar","buyer":"RWA Pool A","amount_usd":4200,"currency":"USD","due_days":30,"line_items":["solar panels"],"ai_suggested_risk":20,"payment_amount":"1.0","payment_currency":"CSPR"}' | jq .

# 4. Run proof
curl -s -X POST http://localhost:3001/api/tasks/<task_id>/run-proof | jq .

# 5. Anchor on Casper
curl -s -X POST http://localhost:3001/api/tasks/<task_id>/anchor | jq .

# 6. Unlock payment
curl -s -X POST http://localhost:3001/api/tasks/<task_id>/unlock-payment | jq .

# 7. Get full proof trail
curl -s http://localhost:3001/api/tasks/<task_id> | jq .
```

### 15.4 State machine enforcement tests

```bash
# Attempt mark-paid before proof (must fail)
curl -s -X POST http://localhost:3001/api/tasks/<task_id>/unlock-payment | jq .
# Expected: 400, "Payment not verified"

# Attempt anchor for non-existent task (must fail)
curl -s -X POST http://localhost:3001/api/tasks/nonexistent/anchor | jq .
# Expected: 404
```

## 16. Verification gates (completion criteria)

Before any phase is considered complete, these gates must pass:

### Gate 1: Contract integrity
- [ ] `cargo odra test` passes all 10 test cases.
- [ ] Sentintel mappings prevent default-value errors.
- [ ] All error paths are exercised in tests.

### Gate 2: Blocky adapter
- [ ] `bky-as attest-fn-call` runs against custom WASM and returns valid attestation.
- [ ] `bky-as verify-fn-call` succeeds on the attestation output.
- [ ] Decoded output contains matching `task_id`.
- [ ] `hash_of_code` matches expected WASM SHA3-512.
- [ ] `function` field is `verifyInvoiceRisk`.

### Gate 3: Full proof/payment loop (curl)
- [ ] Task created with `payment_state: funded`.
- [ ] Proof run returns `verified: true` and `attestation_hash`.
- [ ] Anchor returns `casper_anchor_hash`.
- [ ] Payment unlock succeeds after anchor.
- [ ] Proof explorer returns the anchored record.

### Gate 4: State machine enforcement
- [ ] Invalid transition from `funded` to `payable` rejected with 400.
- [ ] Invalid transition from `funded` to `paid` rejected with 400.
- [ ] Mark paid before proof anchor rejected with 400.
- [ ] Duplicate proof anchor rejected.

### Gate 5: Marketplace backend
- [ ] Listing creation requires valid agent and verifier.
- [ ] Task creation from listing links to listing.
- [ ] Listing query returns only `live` listings unless owner filter is applied.

### Gate 6: Multi-agent orchestration
- [ ] Workflow run creates step runs in order.
- [ ] Step failure blocks subsequent steps.
- [ ] Final proof hash is correct aggregate.
- [ ] Payment splits are calculated and stored per recipient.

### Gate 7: Payment splits
- [ ] Sum of shareBps equals 10000.
- [ ] Recipient unlock depends on proof verification.
- [ ] Split hash is deterministic.

### Gate 8: Reputation scoring
- [ ] Score is calculated from real proof and payment records.
- [ ] Score is clamped to [0, 100].
- [ ] Recalculation fires on proof/task state changes.
- [ ] No fabricated scores.

### Gate 9: API key security
- [ ] Raw key is returned once at creation.
- [ ] Hashed secret stored, not raw key.
- [ ] List endpoint never returns secret.
- [ ] Revocation sets `revoked_at` and authentication rejects revoked keys.
- [ ] Scope enforcement rejects unauthorized operations.

### Gate 10: Verifier template
- [ ] Template registration requires valid input/output schemas.
- [ ] WASM hash must be 128-char hex.
- [ ] Test action runs Blocky attestation with the registered WASM.
- [ ] Mode support is declared honestly.

## 17. Language and naming rules for backend

Every response, log, and error message must follow these rules:

Allowed (judge/public-facing):
```text
Schema + hash verification
Schema + hash verification
Verified through the attestation verifier
Built for TEE verification
Proof hash anchored on Casper
Payment unlocked after proof
local_blocky_dev (internal mode constant, not user-facing)
```

Forbidden (until hosted TEE is live):
```text
Ran inside a real TEE
Production TEE verified
Hosted Blocky TEE proof completed
Confidential compute proof
Real enclave execution
run / sample / fabricated / placeholder / coming soon
local / development mode (user-facing)
```

Mode labels in API responses:
```json
{
  "mode": "local_blocky_dev",
  "mode_label": "Schema + hash verification",
  "mode_note": "Uses Blocky AS attestation service. Hosted TEE path available behind configuration."
}
```

## 18. Dependency graph

```text
Phase A (Foundation)
  |
  +---> Phase B (Odra contract)
  |
  +---> Phase C (Blocky adapter)
  |
  +---> Phase D (Casper adapter)
  |
  +---> Phase E (Tasks + Payments + State machine)
          |
          +---> Phase F (Agent registry)
          |       |
          |       +---> Phase G (Marketplace)
          |       |
          |       +---> Phase J (Reputation)
          |
          +---> Phase H (Workflows)
          |       |
          |       +---> Phase I (Payment splits)
          |
          +---> Phase K (API keys)
          |
          +---> Phase L (Verifier templates)
          |
          +---> Phase M (Integration tests + verification gates)
```

## 19. Stop point

After this plan is approved, proceed to Phase A (Foundation). Each phase gates on verified tests before the next begins.

Do not proceed to any frontend work. Do not deploy. Do not expose secrets.
