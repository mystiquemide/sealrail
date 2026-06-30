# Architecture: Verified Agent Payments on Casper

Date: 2026-06-30
Phase: Master Forge Phase 2
Core positioning: No Proof without a Payment.
First product vertical: RWA invoice verification agent

## 1. Architecture goal

Build a payment-backed proof layer for AI-agent work on Casper.

The product must prove three things in one judge-friendly flow:

1. A user created a payment-backed task.
2. An AI-agent result was checked by a Blocky-compatible verifier.
3. The resulting proof hash was anchored on Casper.

## 2. System overview

```text
User / Judge Dashboard
        |
        v
Backend API
        |
        +-- Agent Task Service
        |       |
        |       +-- creates task
        |       +-- tracks payment state
        |       +-- stores proof state
        |
        +-- Blocky Adapter
        |       |
        |       +-- local-server provider now
        |       +-- hosted-TEE provider when Blocky key arrives
        |       +-- verifies attestation claims
        |
        +-- Casper Anchoring Service
        |       |
        |       +-- calls Odra proof registry
        |       +-- stores attestation hash and output hash
        |
        +-- x402-style Payment Gate
                |
                +-- requested
                +-- proof_pending
                +-- proof_verified
                +-- payable
                +-- paid
```

## 3. Components

### 3.1 Frontend Dashboard

Purpose: give judges a clear proof trail.

Pages:

| Page | Purpose |
|---|---|
| `/` | Product story and primary task run CTA |
| `/run` | Submit invoice task and run proof flow |
| `/proofs` | Browse anchored proofs |
| `/proofs/[taskId]` | Inspect one proof in detail |
| `/agents` | View registered agents and code hashes |

Key UI states:

```text
Payment intent created
Agent output generated
Blocky verification running
Proof verified
Anchoring on Casper
Payment unlocked
```

### 3.2 Backend API

Recommended stack:

```text
Node.js / TypeScript
Fastify or Express
SQLite for hackathon local persistence
CLI adapters for bky-as, bky-c, and casper-client
```

Why this stack:

1. Fast to build.
2. Easy frontend integration.
3. Easy shelling out to Blocky CLI and Casper CLI.
4. Good enough for hackathon proof.

### 3.3 Blocky Adapter

Interface:

```ts
type BlockyMode = "local-server" | "hosted-tee";

interface BlockyProvider {
  mode: BlockyMode;
  attestInvoiceRisk(input: InvoiceRiskInput): Promise<BlockyAttestationResult>;
  verifyAttestation(attestationPath: string): Promise<VerifiedBlockyClaims>;
}
```

Current provider:

```text
local-server provider
```

Uses:

```bash
cat fn-call.json | bky-as attest-fn-call > out.json
jq '{ enclave_attested_application_public_key: .enclave_attested_application_public_key.enclave_attestation, transitive_attested_function_call: .transitive_attestation }' out.json | bky-as verify-fn-call > verified.json
```

Correction for implementation: use exact verified command already tested:

```bash
jq '{ enclave_attested_application_public_key: .enclave_attested_application_public_key.enclave_attestation, transitive_attested_function_call: .transitive_attested_function_call.transitive_attestation }' out.json | bky-as verify-fn-call > verified.json
```

Hosted provider later changes config:

```toml
host = "HOSTED_BLOCKY_TEE_SERVER"
auth_token = "BLOCKY_AS_API_KEY"
```

### 3.4 Casper Proof Registry

Purpose: store proof metadata on Casper.

Odra contract modules:

```text
AgentRegistry
ProofRegistry
PaymentIntentRegistry
```

For qualification, these can live in one contract:

```text
VerifiedAgentPayments
```

Contract responsibilities:

1. Register an agent.
2. Create a payment-backed task intent.
3. Anchor proof hashes.
4. Mark task as verified.
5. Expose getters for dashboard.

### 3.5 Payment Gate

The payment layer is modelled first as state because the hackathon core is proof + Casper transaction.

Payment states:

```text
requested -> proof_pending -> proof_verified -> payable -> paid
```

Minimum viable behavior:

1. User creates task with payment intent amount.
2. Task starts as `requested`.
3. Backend generates/verifies Blocky proof.
4. Casper proof registry marks task as `proof_verified`.
5. UI marks it `payable`.
6. User or user action marks `paid`.

Stretch:

```text
integrate real x402 flow for machine payment request/settlement
```

## 4. Data models

### 4.1 Agent

```ts
type Agent = {
  agentId: string;
  owner: string;
  name: string;
  description: string;
  taskType: "invoice_risk";
  verifierFunction: "verifyInvoiceRisk";
  wasmCodeHash: string;
  blockyMode: "local-server" | "hosted-tee";
  active: boolean;
  createdAt: string;
};
```

### 4.2 Task

```ts
type AgentTask = {
  taskId: string;
  agentId: string;
  invoiceId: string;
  paymentAmount: string;
  paymentCurrency: "CSPR" | "USD";
  paymentState: "requested" | "proof_pending" | "proof_verified" | "payable" | "paid" | "failed";
  inputHash?: string;
  outputHash?: string;
  attestationHash?: string;
  casperDeployHash?: string;
  verified: boolean;
  createdAt: string;
  updatedAt: string;
};
```

### 4.3 Invoice input

```ts
type InvoiceRiskInput = {
  task_id: string;
  invoice_id: string;
  vendor: string;
  buyer: string;
  amount_usd: number;
  currency: string;
  due_days: number;
  line_items: string[];
  ai_suggested_risk: number;
};
```

### 4.4 Verified output

```ts
type InvoiceRiskOutput = {
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
};
```

### 4.5 Blocky claims

```ts
type VerifiedBlockyClaims = {
  hash_of_code: string;
  function: string;
  hash_of_input: string;
  output: string;
  hash_of_secrets: string;
};
```

## 5. Backend API contracts

### POST `/api/tasks`

Creates a payment-backed invoice verification task.

Request:

```json
{
  "invoice_id": "INV-2026-TEE-001",
  "vendor": "Lagos Solar Logistics Ltd",
  "buyer": "RWA Credit Pool A",
  "amount_usd": 4200,
  "currency": "USD",
  "due_days": 30,
  "line_items": ["solar panel shipment", "customs documentation"],
  "ai_suggested_risk": 20,
  "payment_amount": "1.0",
  "payment_currency": "CSPR"
}
```

Response:

```json
{
  "task_id": "task-casper-run-001",
  "payment_state": "requested"
}
```

### POST `/api/tasks/:taskId/run-proof`

Runs Blocky attestation and verification.

Response:

```json
{
  "task_id": "task-casper-run-001",
  "blocky_mode": "local-server",
  "verified": true,
  "claims": {
    "hash_of_code": "...",
    "hash_of_input": "...",
    "hash_of_secrets": "..."
  },
  "output": {
    "approved": true,
    "risk_score": 10
  },
  "attestation_hash": "80d086e89c3261c617cfac916e6b02b5b9e6649769734375c3a3595f7b95cd44"
}
```

### POST `/api/tasks/:taskId/anchor`

Anchors proof hash on Casper.

Response:

```json
{
  "task_id": "task-casper-run-001",
  "casper_deploy_hash": "...",
  "payment_state": "proof_verified"
}
```

### POST `/api/tasks/:taskId/mark-paid`

Marks verified task as paid for run/payment-gate purposes.

Response:

```json
{
  "task_id": "task-casper-run-001",
  "payment_state": "paid"
}
```

### GET `/api/tasks/:taskId`

Returns full proof trail.

### GET `/api/proofs`

Returns proof explorer list.

### GET `/api/agents`

Returns registered agents.

## 6. Odra contract design

Contract name:

```text
VerifiedAgentPayments
```

Storage:

```rust
pub struct VerifiedAgentPayments {
    owner: Var<Address>,
    agents: Mapping<String, AgentRecord>,
    agent_registered: Mapping<String, bool>,
    tasks: Mapping<String, TaskRecord>,
    task_registered: Mapping<String, bool>,
}
```

Use explicit sentinel mappings because OdraVM `Mapping<Address, T>` can return defaults in local tests. Use sentinel pattern for all critical existence checks.

Types:

```rust
#[odra::odra_type]
pub struct AgentRecord {
    pub owner: Address,
    pub name: String,
    pub verifier_function: String,
    pub wasm_code_hash: String,
    pub active: bool,
}

#[odra::odra_type]
pub struct TaskRecord {
    pub agent_id: String,
    pub task_id: String,
    pub payment_amount: U512,
    pub payment_state: String,
    pub input_hash: String,
    pub output_hash: String,
    pub attestation_hash: String,
    pub verified: bool,
}
```

Entry points:

```rust
pub fn init(&mut self)
pub fn register_agent(&mut self, agent_id: String, name: String, verifier_function: String, wasm_code_hash: String)
pub fn create_payment_intent(&mut self, task_id: String, agent_id: String, payment_amount: U512)
pub fn anchor_proof(&mut self, task_id: String, input_hash: String, output_hash: String, attestation_hash: String)
pub fn mark_paid(&mut self, task_id: String)
pub fn get_agent(&self, agent_id: String) -> Option<AgentRecord>
pub fn get_task(&self, task_id: String) -> Option<TaskRecord>
```

Events:

```rust
AgentRegistered
PaymentIntentCreated
ProofAnchored
PaymentMarkedPaid
```

Errors:

```rust
NotOwner
AgentNotFound
AgentInactive
TaskNotFound
TaskAlreadyExists
ProofAlreadyAnchored
ProofMissing
PaymentNotVerified
```

## 7. File structure

```text
casper-tee-agent-payments/
  memory.md
  README.md
  .env.example
  docs/
    PRD.md
    PRD.docx
    ARCHITECTURE.md
    DESIGN.md
    TASKS.md
  contracts/
    verified-agent-payments/
      Cargo.toml
      rust-toolchain.toml
      src/lib.rs
      tests/proof_registry.rs
  backend/
    package.json
    src/
      index.ts
      db.ts
      services/blocky.ts
      services/casper.ts
      services/tasks.ts
      routes/tasks.ts
      types.ts
  frontend/
    package.json
    src/
      app/page.tsx
      app/run/page.tsx
      app/proofs/page.tsx
      app/proofs/[taskId]/page.tsx
      components/ProofTimeline.tsx
      components/PaymentStatus.tsx
      lib/api.ts
  blocky/
    invoice-verifier/
      main.go
      go.mod
      fn-call.template.json
```

## 8. Environment variables

```text
CSPR_CLOUD_API_KEY
CSPR_CLOUD_TOKEN
CASPER_RPC_URL
CASPER_CHAIN_NAME
CASPER_ACCOUNT_KEY_PATH
BLOCKY_MODE
BLOCKY_AS_API_KEY
BLOCKY_AS_HOST
BLOCKY_CONFIG_PATH
DATABASE_URL
```

## 9. Security notes

1. Never commit real API keys.
2. Never claim local Blocky mode is a real TEE.
3. Hash sensitive inputs before anchoring on-chain.
4. Keep invoice product data synthetic.
5. Validate that `hash_of_code` matches expected WASM hash before accepting proof.
6. Validate function name is exactly `verifyInvoiceRisk`.
7. Validate decoded output references the same `task_id`.

## 10. Build sequencing

Backend/proof layer first:

1. Odra proof registry contract.
2. Contract tests.
3. Backend task store.
4. Blocky adapter using existing local proof path.
5. Casper anchoring adapter.
6. Payment state machine.
7. Frontend dashboard.
8. README and product run script.

## 11. Acceptance gate for Phase 2

Phase 2 is complete when these files exist:

1. `docs/ARCHITECTURE.md`
2. `docs/DESIGN.md`
3. `docs/TASKS.md`
4. `.env.example`
5. Updated `memory.md`

Next phase after approval:

```text
Phase 2.5 backend/code audit plan, then Phase 3 build task 1: Odra proof registry contract.
```
