# Full Ecosystem Build Scope

Project: Sealrail
Core positioning: No Proof without a Payment.
Status: Real working ecosystem product scope
Purpose: Define the full working product scope for Sealrail. This is not a fabricated showcase and not a partially working facade.

## 1. Decision

Sealrail is being built as a real working marketplace and agent-payment ecosystem.

Every major feature must have real product behavior:

1. Full marketplace UI backed by real agent records.
2. Multi-agent orchestration engine that actually runs workflow steps.
3. Payment splits that actually calculate and attach recipients to a payment.
4. Agent reputation scoring derived from real proof and payment records.
5. API key management with real key creation, hashing, scopes, and revoke behavior.
6. Verifier template upload or registration with real stored schemas and WASM hash metadata.
7. Agent owner dashboard backed by real owned agents, listings, tasks, proofs, and earnings.

Forbidden product direction:

```text
No fabricated marketplace
No fake listings
No fabricated agents presented as real
No non-working workflow engine
No placeholder reputation
No fake API key page
No showcase wording in product UI
No hosted TEE claims until hosted access is live
```

## 2. Product-ready ecosystem goal

Sealrail must feel like a real ecosystem for paid AI-agent work.

The product must let users perform this complete loop:

```text
Create an account or connect wallet
Register an agent
Attach a verifier
Publish an agent listing
Create a paid task from the marketplace
Run one or more agents
Verify each output
Anchor proof on Casper
Split payment across contributors
Update reputation from verified work
Inspect the proof trail
Use API keys to access the system programmatically
```

## 3. Product language rule

Do not use showcase language for the product flow. Use concrete product language instead.

Use:

```text
Run
Task
Proof run
Live run
Verification run
Invoice verification run
Marketplace task
Workflow run
```

Do not use:

```text
run
task runner
showcase agent
showcase listing
sample data
fabricated
non-working
fabricated
placeholder
coming soon
```

## 4. Final route map

Build the app around these routes.

| Route | Page name | Purpose |
|---|---|---|
| `/` | Landing page | Explain Sealrail and drive users into a real task run |
| `/run` | Task runner | Create and execute an invoice verification run |
| `/marketplace` | Marketplace | Browse live proof-backed agents |
| `/marketplace/[listingId]` | Listing detail | View one listing and start a paid task |
| `/agents` | Agent registry | Browse registered agents |
| `/agents/[agentId]` | Agent profile | Show agent details, reputation, verifiers, and proofs |
| `/owner` | Agent owner dashboard | Manage owned agents, listings, tasks, and earnings |
| `/owner/agents/new` | Register agent | Create a working agent profile |
| `/owner/agents/[agentId]` | Manage agent | Manage one owned agent |
| `/workflows` | Workflow library | Browse multi-agent workflows |
| `/workflows/new` | Create workflow | Compose a multi-agent workflow |
| `/workflows/[workflowId]` | Workflow detail | Run and inspect a workflow |
| `/verifiers` | Verifier library | Browse registered verifier templates |
| `/verifiers/new` | Register verifier | Upload or register a verifier template |
| `/proofs` | Proof explorer | Browse proof records |
| `/proofs/[proofId]` | Proof detail | Inspect one proof and payment trail |
| `/api-keys` | API key management | Create, scope, copy once, and revoke API keys |
| `/docs` | Developer docs | Explain architecture, API, contracts, and proof rules |
| `/status` | System status | Show live integration health |

## 5. Core data models

### 5.1 Agent

```ts
type Agent = {
  id: string;
  ownerAddress: string;
  name: string;
  slug: string;
  category: "invoice" | "defi" | "research" | "compliance" | "custom";
  description: string;
  shortPitch: string;
  pricingModel: "fixed" | "per_run" | "workflow_split";
  basePrice: number;
  currency: "CSPR" | "USD";
  verifierIds: string[];
  supportedTaskTypes: string[];
  status: "active" | "paused" | "draft";
  createdAt: string;
  updatedAt: string;
};
```

### 5.2 MarketplaceListing

```ts
type MarketplaceListing = {
  id: string;
  agentId: string;
  ownerAddress: string;
  title: string;
  category: string;
  summary: string;
  priceAmount: number;
  currency: "CSPR" | "USD";
  proofRequirement: string;
  verifierId: string;
  reputationScore: number;
  totalVerifiedRuns: number;
  totalPaidTasks: number;
  failureRate: number;
  status: "live" | "paused" | "draft";
  createdAt: string;
  updatedAt: string;
};
```

### 5.3 Task

```ts
type Task = {
  id: string;
  buyerAddress: string;
  agentId: string;
  listingId?: string;
  workflowRunId?: string;
  title: string;
  input: Record<string, unknown>;
  taskType: string;
  paymentId: string;
  proofIds: string[];
  status:
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
  createdAt: string;
  updatedAt: string;
};
```

### 5.4 Payment

```ts
type Payment = {
  id: string;
  taskId?: string;
  workflowRunId?: string;
  buyerAddress: string;
  totalAmount: number;
  currency: "CSPR" | "USD";
  status: "intent_created" | "locked" | "unlockable" | "paid" | "blocked";
  recipients: PaymentRecipient[];
  splitHash?: string;
  unlockRule: "proof_verified" | "workflow_verified";
  createdAt: string;
  updatedAt: string;
};

type PaymentRecipient = {
  id: string;
  agentId?: string;
  verifierId?: string;
  address: string;
  shareBps: number;
  role: "primary_agent" | "workflow_step" | "verifier" | "platform";
  proofRequired: boolean;
  proofId?: string;
  status: "locked" | "unlockable" | "paid" | "blocked";
};
```

### 5.5 Proof

```ts
type Proof = {
  id: string;
  taskId?: string;
  parentProofId?: string;
  workflowRunId?: string;
  workflowStepRunId?: string;
  agentId: string;
  verifierId: string;
  inputHash: string;
  outputHash: string;
  wasmHash: string;
  attestationHash: string;
  casperAnchorHash?: string;
  mode: "local_blocky_dev" | "hosted_blocky_tee";
  status: "pending" | "verified" | "failed" | "anchored";
  createdAt: string;
};
```

### 5.6 VerifierTemplate

```ts
type VerifierTemplate = {
  id: string;
  ownerAddress: string;
  name: string;
  slug: string;
  description: string;
  taskType: string;
  inputSchema: Record<string, unknown>;
  outputSchema: Record<string, unknown>;
  wasmHash: string;
  wasmFileUrl?: string;
  modeSupport: ("local_blocky_dev" | "hosted_blocky_tee")[];
  status: "draft" | "active" | "deprecated";
  createdAt: string;
  updatedAt: string;
};
```

### 5.7 WorkflowTemplate and WorkflowRun

```ts
type WorkflowTemplate = {
  id: string;
  ownerAddress: string;
  name: string;
  description: string;
  category: string;
  steps: WorkflowStepTemplate[];
  paymentSplitDefault: PaymentRecipient[];
  status: "active" | "draft";
};

type WorkflowStepTemplate = {
  id: string;
  order: number;
  name: string;
  agentId: string;
  verifierId: string;
  required: boolean;
  paymentShareBps: number;
};

type WorkflowRun = {
  id: string;
  templateId: string;
  buyerAddress: string;
  paymentId: string;
  status: "created" | "running" | "step_failed" | "proofs_verified" | "anchored" | "payable" | "paid";
  stepRuns: WorkflowStepRun[];
  finalProofId?: string;
  createdAt: string;
  updatedAt: string;
};

type WorkflowStepRun = {
  id: string;
  workflowRunId: string;
  stepTemplateId: string;
  agentId: string;
  verifierId: string;
  proofId?: string;
  status: "waiting" | "running" | "verified" | "failed";
  output?: Record<string, unknown>;
};
```

### 5.8 AgentReputation

```ts
type AgentReputation = {
  agentId: string;
  score: number;
  verifiedRuns: number;
  failedRuns: number;
  paidTasks: number;
  totalEarned: number;
  averageVerificationTimeMs: number;
  lastProofAt?: string;
  updatedAt: string;
};
```

### 5.9 ApiKey

```ts
type ApiKey = {
  id: string;
  ownerAddress: string;
  name: string;
  prefix: string;
  hashedSecret: string;
  scopes: string[];
  lastUsedAt?: string;
  createdAt: string;
  revokedAt?: string;
};
```

## 6. Required backend services

```text
agents service
marketplace service
tasks service
payments service
proofs service
verifiers service
workflows service
reputation service
api keys service
casper anchoring service
blocky adapter service
```

Every service must have real create, read, update, and state transition behavior where relevant.

## 7. API contracts

### Marketplace

```text
GET    /api/marketplace
GET    /api/marketplace/:listingId
POST   /api/marketplace/:listingId/tasks
POST   /api/marketplace/listings
PATCH  /api/marketplace/listings/:listingId
```

### Agents

```text
GET    /api/agents
GET    /api/agents/:agentId
POST   /api/agents
PATCH  /api/agents/:agentId
GET    /api/agents/:agentId/reputation
GET    /api/agents/:agentId/proofs
```

### Tasks

```text
POST   /api/tasks
GET    /api/tasks/:taskId
POST   /api/tasks/:taskId/run
POST   /api/tasks/:taskId/verify
POST   /api/tasks/:taskId/anchor
POST   /api/tasks/:taskId/unlock-payment
```

### Payments

```text
POST   /api/payments/intents
GET    /api/payments/:paymentId
POST   /api/payments/:paymentId/splits
POST   /api/payments/:paymentId/unlock
POST   /api/payments/:paymentId/claim
```

### Workflows

```text
GET    /api/workflows
POST   /api/workflows
GET    /api/workflows/:workflowId
POST   /api/workflows/:workflowId/run
GET    /api/workflow-runs/:runId
POST   /api/workflow-runs/:runId/steps/:stepId/run
POST   /api/workflow-runs/:runId/finalize
```

### Verifiers

```text
GET    /api/verifiers
GET    /api/verifiers/:verifierId
POST   /api/verifiers
POST   /api/verifiers/upload
PATCH  /api/verifiers/:verifierId
POST   /api/verifiers/:verifierId/test
```

### API keys

```text
GET    /api/api-keys
POST   /api/api-keys
PATCH  /api/api-keys/:keyId
DELETE /api/api-keys/:keyId
```

### Proofs

```text
GET    /api/proofs
GET    /api/proofs/:proofId
GET    /api/proofs/by-task/:taskId
POST   /api/proofs/:proofId/anchor
```

## 8. Smart contract scope

### 8.1 ProofRegistry

The Casper contract should support:

```text
register_proof(task_id, proof_hash, agent_id, verifier_hash, payment_id)
register_workflow_proof(workflow_run_id, final_proof_hash, payment_id, split_hash)
get_proof(task_id)
get_workflow_proof(workflow_run_id)
set_payment_state(payment_id, payment_state)
get_payment_state(payment_id)
```

### 8.2 Payment split anchoring

Payment splits must be real application records. For chain efficiency, the app can anchor a split bundle hash on Casper while storing full recipient details in the backend.

Required:

```text
payment_id
recipient addresses
share basis points
proof dependency per recipient
split bundle hash
final proof hash
payment state
```

## 9. Marketplace requirements

The marketplace must be backed by real agent/listing records created through the owner dashboard or backend API.

`/marketplace` must include:

```text
Header
Category filters
Live listings
Agent name
Proof requirement
Price
Reputation score
Verified run count
Start task CTA
```

`/marketplace/[listingId]` must include:

```text
Listing details
Agent owner
Verifier requirement
Pricing
Proof history
Reputation
Task input form
Create paid task action
```

No fake listings. If a listing is shown, it must exist as a MarketplaceListing record linked to an Agent record and VerifierTemplate record.

## 10. Multi-agent orchestration engine

The workflow engine must actually create workflow runs and step runs.

Minimum working workflow:

```text
Invoice Risk Workflow
Step 1: Invoice Risk Agent
Step 2: Payment Approval Agent
Step 3: Settlement Verifier
```

The engine must:

1. Create a workflow run.
2. Create one payment with split recipients.
3. Execute step runs in order.
4. Verify each step output.
5. Store one proof per step.
6. Create a final workflow proof.
7. Anchor the final proof or final proof hash on Casper.
8. Unlock each recipient based on proof dependency.

## 11. Payment splits

Payment splits must be calculated, stored, displayed, and tied to proof requirements.

Default workflow split:

```text
Invoice Risk Agent: 60 percent
Payment Approval Agent: 30 percent
Platform or verifier fee: 10 percent
```

Required UI:

```text
Recipient
Role
Share
Required proof
Current payment state
Claim status
```

## 12. Reputation scoring

Reputation must be calculated from actual records.

Inputs:

```text
verified proofs
failed proofs
paid tasks
blocked tasks
total earned
average verification time
last proof timestamp
```

Formula:

```text
score = 50
+ min(25, verified_runs * 2)
+ min(15, paid_tasks * 2)
- min(25, failed_runs * 5)
- min(15, blocked_tasks * 3)
```

Clamp score between 0 and 100.

No fake star ratings.

## 13. API key management

API key management must be real.

Required behavior:

```text
Create key
Generate secret
Show secret once
Store only hashed secret
Store prefix
Assign scopes
List keys without exposing secret
Revoke key
Track last used when used by API middleware
```

Scopes:

```text
tasks:read
tasks:write
proofs:read
agents:read
agents:write
verifiers:write
workflows:write
marketplace:write
```

## 14. Verifier template system

Verifier registration must create real VerifierTemplate records.

Required fields:

```text
name
task type
input schema
output schema
WASM hash
mode support
owner address
status
```

If file upload is available, store the uploaded WASM file. If file upload is not available yet, require a real WASM hash and metadata record.

Do not show verifier templates that are not backed by records.

## 15. Agent owner dashboard

Owner dashboard must be backed by the connected wallet or owner identity.

`/owner` must show:

```text
Owned agents
Active listings
Incoming tasks
Proof success rate
Total earned
Failed proofs
API keys shortcut
Create agent CTA
```

`/owner/agents/new` must create real Agent records.

`/owner/agents/[agentId]` must edit real owned Agent records.

## 16. Database tables

Build these tables or collections:

```text
agents
marketplace_listings
tasks
payments
payment_recipients
proofs
verifier_templates
workflow_templates
workflow_runs
workflow_step_runs
agent_reputation
api_keys
system_events
```

## 17. Build order

### Phase 1: Foundation

```text
Design tokens
Shared app shell
Database schema
Backend service folders
API route skeletons
Persistence layer
Authentication or wallet identity
```

### Phase 2: Real core run

```text
Task creation
Payment intent
Invoice agent execution
Blocky local verification
Proof record
Casper anchor adapter
Payment unlock
Proof detail
```

### Phase 3: Marketplace

```text
Create agent
Create verifier template
Create listing
Marketplace list
Listing detail
Start task from listing
Agent profile
Reputation panel
```

### Phase 4: Owner tools

```text
Owner dashboard
Create agent
Manage agent
Create listing
Verifier mapping
Task inbox
Earnings view
```

### Phase 5: Verifier templates

```text
Verifier library
Register verifier template
WASM hash registration
Schema storage
Verifier test action
Publish template action
```

### Phase 6: Workflows and splits

```text
Create workflow template
Run workflow
Step proofs
Final proof bundle
Payment split calculation
Payment split unlock state
```

### Phase 7: API keys and developer ecosystem

```text
API key creation
API key hashing
Scopes
Revoke flow
Middleware usage tracking
Docs examples
```

### Phase 8: Product readiness

```text
Empty states
Error states
Mobile responsiveness
Accessibility
Route audit
Product run screenshots
```

## 18. Product readiness checklist

The product is ready when:

- Marketplace listings are backed by real records.
- Agent creation works.
- Listing creation works.
- Task creation from listing works.
- At least one agent runs a real end-to-end proof/payment flow.
- Multi-agent workflow creates real step runs and proof records.
- Payment splits are stored and displayed from real data.
- Reputation is calculated from proof and payment records.
- API keys can be created, scoped, shown once, and revoked.
- Verifier templates can be registered and tested.
- Proof explorer links every feature back to proof records.
- Local Blocky Dev Mode is honestly labelled.
- Casper anchoring is visible as a proof object.
- Product UI uses real product language and avoids showcase language.
- No fake hosted TEE claim exists.

## 19. Key engineering principle

Do not fake any product surface.

If a page exists, it must connect to real records and real state transitions. The UI may start with an empty state, but it must not present fake users, fake agents, fake marketplace listings, fake runs, fake keys, fake reputation, or fake payments as real.
