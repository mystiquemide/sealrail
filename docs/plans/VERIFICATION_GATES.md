# Sealrail Backend Verification Gates

Runbook for Phase M integration gates. All commands are copy-paste ready.
No secrets. Judge-safe TEE wording only.

## Prerequisites

Start the backend server:

```bash
cd backend && npm run dev
# Server starts on http://localhost:3001
```

Expected output includes: `Sealrail backend running - mode: tee_verification_mode`

---

## Gate 1: Health and Status

### 1.1 Health check

```bash
curl -s http://localhost:3001/api/health | python3 -m json.tool
```

**Expected status code:** 200
**Expected fields:** `status: "ok"`, `mode: "schema_hash_verification"`, `mode_label`, `timestamp`, `uptime_seconds`

### 1.2 Status check

```bash
curl -s http://localhost:3001/api/status | python3 -m json.tool
```

**Expected status code:** 200
**Expected fields:** `status: "ok"`, `db_connected: true`, `mode: "schema_hash_verification"`, `casper_mode`

---

## Gate 2: Agent Registration

### 2.1 Register an agent

```bash
curl -s -X POST http://localhost:3001/api/agents \
  -H "Content-Type: application/json" \
  -d '{
    "owner_address": "0xPlaceholderOwner",
    "name": "Invoice Risk Scanner",
    "category": "invoice",
    "description": "Scans invoices for financial risk indicators in a TEE",
    "short_pitch": "Fast invoice risk analysis with TEE verification",
    "pricing_model": "fixed",
    "base_price": 50,
    "currency": "USD"
  }' | python3 -m json.tool
```

**Expected status code:** 201
**Expected fields:** `agent.id`, `agent.name: "Invoice Risk Scanner"`, `agent.slug: "invoice-risk-scanner"`, `agent.status: "active"`, `message`

### 2.2 List agents

```bash
curl -s http://localhost:3001/api/agents | python3 -m json.tool
```

**Expected status code:** 200
**Expected fields:** `agents` (array), `count`

### 2.3 Get agent by ID

```bash
curl -s http://localhost:3001/api/agents/PLACEHOLDER_AGENT_ID | python3 -m json.tool
```

**Expected status code:** 200 (or 404 if ID is invalid)
**Expected fields (200):** `agent` with all registration fields

### 2.4 Get agent reputation

```bash
curl -s http://localhost:3001/api/agents/PLACEHOLDER_AGENT_ID/reputation | python3 -m json.tool
```

**Expected status code:** 200
**Expected fields:** `agent_id`, `reputation.score` (0-100), `reputation.total_completed`, `reputation.total_failed`

### 2.5 Recalculate agent reputation

```bash
curl -s -X POST http://localhost:3001/api/agents/PLACEHOLDER_AGENT_ID/reputation/recalculate \
  -H "Content-Type: application/json" \
  -d '{"owner_address": "0xPlaceholderOwner"}' | python3 -m json.tool
```

**Expected status code:** 200
**Expected fields:** `agent_id`, `reputation.score`, `computed_at`, `message`

### 2.6 Get agent proof history

```bash
curl -s http://localhost:3001/api/agents/PLACEHOLDER_AGENT_ID/proofs | python3 -m json.tool
```

**Expected status code:** 200
**Expected fields:** `agent_id`, `proofs` (array), `count`

### 2.7 Sync agent to Casper

```bash
curl -s -X POST http://localhost:3001/api/agents/PLACEHOLDER_AGENT_ID/sync | python3 -m json.tool
```

**Expected status code:** 200
**Expected fields:** `agent_id`, `registration_hash`, `mode`

---

## Gate 3: Verifier Template Registration and Test

### 3.1 Register a verifier template

```bash
curl -s -X POST http://localhost:3001/api/verifiers \
  -H "Content-Type: application/json" \
  -d '{
    "owner_address": "0xPlaceholderOwner",
    "name": "Invoice Fraud Detector",
    "task_type": "invoice_risk",
    "wasm_hash": "a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6a7b8c9d0e1f2a3b4c5d6a7b8c9d0e1f2",
    "description": "Detects invoice fraud via TEE-attested model execution",
    "input_schema": {"invoice_id": "string", "amount": "number"},
    "output_schema": {"risk_score": "number", "flags": "array"},
    "status": "active"
  }' | python3 -m json.tool
```

**Expected status code:** 201
**Expected fields:** `verifier.id`, `verifier.name`, `verifier.wasm_hash`, `verifier.status: "active"`, `message`

### 3.2 List verifier templates

```bash
curl -s http://localhost:3001/api/verifiers | python3 -m json.tool
```

**Expected status code:** 200
**Expected fields:** `verifiers` (array), `count`

### 3.3 Get verifier by ID

```bash
curl -s http://localhost:3001/api/verifiers/PLACEHOLDER_VERIFIER_ID | python3 -m json.tool
```

**Expected status code:** 200 (or 404)
**Expected fields (200):** `verifier` with all fields

### 3.4 Test a verifier (deterministic hash chaining)

```bash
curl -s -X POST http://localhost:3001/api/verifiers/PLACEHOLDER_VERIFIER_ID/test \
  -H "Content-Type: application/json" \
  -d '{"input": {"invoice_id": "INV-TEST-001", "amount": 5000}}' | python3 -m json.tool
```

**Expected status code:** 200
**Expected fields:** `result.valid`, `result.computed_hash`, `result.hash_chain`, `result.mode`

### 3.5 Update verifier (owner-only)

```bash
curl -s -X PATCH http://localhost:3001/api/verifiers/PLACEHOLDER_VERIFIER_ID \
  -H "Content-Type: application/json" \
  -d '{"owner_address": "0xPlaceholderOwner", "status": "deprecated"}' | python3 -m json.tool
```

**Expected status code:** 200 (or 403 if wrong owner)
**Expected fields (200):** `verifier`, `message`

---

## Gate 4: Marketplace Listing Creation

### 4.1 Create a marketplace listing

```bash
curl -s -X POST http://localhost:3001/api/marketplace/listings \
  -H "Content-Type: application/json" \
  -d '{
    "agent_id": "PLACEHOLDER_AGENT_ID",
    "owner_address": "0xPlaceholderOwner",
    "title": "Invoice Risk Auto-Scan",
    "category": "invoice",
    "summary": "TEE-attested invoice risk scanning service",
    "price_amount": 25,
    "currency": "USD",
    "proof_requirement": "proof_verified",
    "verifier_id": "PLACEHOLDER_VERIFIER_ID"
  }' | python3 -m json.tool
```

**Expected status code:** 201
**Expected fields:** `listing.id`, `listing.title`, `listing.price_amount: 25`, `listing.status: "live"`, `message`

### 4.2 List marketplace listings

```bash
curl -s http://localhost:3001/api/marketplace | python3 -m json.tool
```

**Expected status code:** 200
**Expected fields:** `listings` (array), `count`

### 4.3 Get listing detail

```bash
curl -s http://localhost:3001/api/marketplace/PLACEHOLDER_LISTING_ID | python3 -m json.tool
```

**Expected status code:** 200 (or 404)
**Expected fields (200):** `listing`, `agent_summary`, `reputation`

### 4.4 Update listing (owner-only)

```bash
curl -s -X PATCH http://localhost:3001/api/marketplace/listings/PLACEHOLDER_LISTING_ID \
  -H "Content-Type: application/json" \
  -d '{"owner_address": "0xPlaceholderOwner", "status": "paused"}' | python3 -m json.tool
```

**Expected status code:** 200 (or 403 if wrong owner)
**Expected fields (200):** `listing`, `message`

---

## Gate 5: Task Creation and Lifecycle

### 5.1 Create task from listing

```bash
curl -s -X POST http://localhost:3001/api/marketplace/PLACEHOLDER_LISTING_ID/tasks \
  -H "Content-Type: application/json" \
  -d '{
    "buyer_address": "0xPlaceholderBuyer",
    "input": {"invoice_id": "INV-2026-001", "vendor": "PlaceholderCorp"}
  }' | python3 -m json.tool
```

**Expected status code:** 201
**Expected fields:** `task.id`, `task.status: "funded"`, `payment.total_amount`, `payment.currency`, `message`

### 5.2 Create payment-backed task directly

```bash
curl -s -X POST http://localhost:3001/api/tasks \
  -H "Content-Type: application/json" \
  -d '{
    "agent_id": "PLACEHOLDER_AGENT_ID",
    "buyer_address": "0xPlaceholderBuyer",
    "title": "Direct Task",
    "task_type": "invoice_risk",
    "total_amount": 100,
    "currency": "USD",
    "unlock_rule": "proof_verified"
  }' | python3 -m json.tool
```

**Expected status code:** 201
**Expected fields:** `task_id`, `payment_id`, `task_status: "funded"`, `payment_status: "intent_created"`

### 5.3 List tasks

```bash
curl -s http://localhost:3001/api/tasks | python3 -m json.tool
```

**Expected status code:** 200
**Expected fields:** `tasks` (array), `count`

### 5.4 Get task with full trail

```bash
curl -s http://localhost:3001/api/tasks/PLACEHOLDER_TASK_ID | python3 -m json.tool
```

**Expected status code:** 200 (or 404)
**Expected fields (200):** `task`, `payment`, `proofs` (array)

### 5.5 Run TEE verification

```bash
curl -s -X POST http://localhost:3001/api/tasks/PLACEHOLDER_TASK_ID/run | python3 -m json.tool
```

**Expected status code:** 200
**Expected fields:** `task_id`, `status: "proof_pending"`, `proof_id`, `message`

### 5.6 Verify TEE proof

```bash
curl -s -X POST http://localhost:3001/api/tasks/PLACEHOLDER_TASK_ID/verify | python3 -m json.tool
```

**Expected status code:** 200
**Expected fields:** `task_id`, `status: "proof_verified"`, `proof_ids` (array), `message`

### 5.7 Anchor proof on Casper

```bash
curl -s -X POST http://localhost:3001/api/tasks/PLACEHOLDER_TASK_ID/anchor | python3 -m json.tool
```

**Expected status code:** 200
**Expected fields:** `task_id`, `anchor_hash`, `mode`, `casper_mode`, `proof_id`

### 5.8 Unlock payment

```bash
curl -s -X POST http://localhost:3001/api/tasks/PLACEHOLDER_TASK_ID/unlock-payment | python3 -m json.tool
```

**Expected status code:** 200
**Expected fields:** `task_id`, `payment_id`, `task_status: "payable"`, `payment_status: "unlockable"`, `message`

### 5.9 Reject unlock before anchor

```bash
# Create a new task (status stays "funded") and try to unlock immediately
TASK_ID=$(curl -s -X POST http://localhost:3001/api/tasks \
  -H "Content-Type: application/json" \
  -d '{"agent_id":"PLACEHOLDER_AGENT_ID","buyer_address":"0xTest","total_amount":10,"currency":"USD"}' \
  | python3 -c "import sys,json;print(json.load(sys.stdin)['task_id'])")

curl -s -X POST http://localhost:3001/api/tasks/$TASK_ID/unlock-payment | python3 -m json.tool
```

**Expected status code:** 400
**Expected fields:** `error: "INVALID_STATE"`, `message` (must mention 'anchored' requirement)

---

## Gate 6: Payment Split, Unlock, and Claim

### 6.1 Create payment intent

```bash
curl -s -X POST http://localhost:3001/api/payments/intents \
  -H "Content-Type: application/json" \
  -d '{
    "buyer_address": "0xPlaceholderBuyer",
    "total_amount": 1000,
    "currency": "USD",
    "unlock_rule": "proof_verified"
  }' | python3 -m json.tool
```

**Expected status code:** 201
**Expected fields:** `payment_id`, `status: "intent_created"`, `total_amount: 1000`, `currency: "USD"`, `unlock_rule`, `message`

### 6.2 Calculate payment splits

```bash
curl -s -X POST http://localhost:3001/api/payments/PLACEHOLDER_PAYMENT_ID/splits \
  -H "Content-Type: application/json" \
  -d '{
    "recipients": [
      {"address": "0xPrimaryAgent", "share_bps": 7000, "role": "primary_agent", "agent_id": "PLACEHOLDER_AGENT_ID", "proof_required": true},
      {"address": "0xVerifierNode", "share_bps": 2000, "role": "verifier", "verifier_id": "PLACEHOLDER_VERIFIER_ID", "proof_required": true},
      {"address": "0xPlatformFee", "share_bps": 1000, "role": "platform", "proof_required": false}
    ]
  }' | python3 -m json.tool
```

**Expected status code:** 200
**Expected fields:** `payment_id`, `status: "locked"`, `split_hash`, `recipients` (array of 3)

### 6.3 Reject splits with basis-point mismatch

```bash
curl -s -X POST http://localhost:3001/api/payments/PLACEHOLDER_PAYMENT_ID_2/splits \
  -H "Content-Type: application/json" \
  -d '{
    "recipients": [
      {"address": "0xTest", "share_bps": 5000, "role": "primary_agent"}
    ]
  }' | python3 -m json.tool
```

**Expected status code:** 400
**Expected fields:** `error: "INVALID_REQUEST"`, `message` (must mention total share_bps != 10000)

### 6.4 Get payment with recipients

```bash
curl -s http://localhost:3001/api/payments/PLACEHOLDER_PAYMENT_ID | python3 -m json.tool
```

**Expected status code:** 200
**Expected fields:** `payment` (with recipients array), `proof_dependencies`

### 6.5 Unlock payment

```bash
curl -s -X POST http://localhost:3001/api/payments/PLACEHOLDER_PAYMENT_ID/unlock | python3 -m json.tool
```

**Expected status code:** 200
**Expected fields:** `payment_id`, `payment_status`, `total_recipients`, `unlocked_count`, `still_locked_count`, `recipient_results`

### 6.6 Claim recipient share

```bash
# First get a recipient ID from the payment
RECIPIENT_ID=$(curl -s http://localhost:3001/api/payments/PLACEHOLDER_PAYMENT_ID \
  | python3 -c "import sys,json;print(json.load(sys.stdin)['payment']['recipients'][0]['id'])")

curl -s -X POST http://localhost:3001/api/payments/PLACEHOLDER_PAYMENT_ID/claim \
  -H "Content-Type: application/json" \
  -d "{\"recipient_id\": \"$RECIPIENT_ID\"}" | python3 -m json.tool
```

**Expected status code:** 200
**Expected fields:** `payment_id`, `recipient_id`, `recipient_status: "paid"`, `share_bps`, `message`

### 6.7 Reject double claim

```bash
# Run the same claim command a second time
curl -s -X POST http://localhost:3001/api/payments/PLACEHOLDER_PAYMENT_ID/claim \
  -H "Content-Type: application/json" \
  -d "{\"recipient_id\": \"$RECIPIENT_ID\"}" | python3 -m json.tool
```

**Expected status code:** 409
**Expected fields:** `error: "ALREADY_CLAIMED"`, `message` (must mention double-claim or already claimed)

### 6.8 Reject claim with wrong recipient address

```bash
curl -s -X POST http://localhost:3001/api/payments/PLACEHOLDER_PAYMENT_ID/claim \
  -H "Content-Type: application/json" \
  -d '{"recipient_id": "VALID_RECIPIENT_ID", "address": "0xWrongAddress"}' | python3 -m json.tool
```

**Expected status code:** 403
**Expected fields:** `error: "WRONG_RECIPIENT"`, `message`

---

## Gate 7: Workflow Template, Run, Step Execution, and Finalize

### 7.1 Create workflow template

```bash
curl -s -X POST http://localhost:3001/api/workflows \
  -H "Content-Type: application/json" \
  -d '{
    "owner_address": "0xPlaceholderOwner",
    "name": "Invoice Processing Pipeline",
    "description": "Multi-step TEE-attested invoice processing",
    "category": "invoice",
    "steps": [
      {"id": "step-parse", "order": 0, "name": "Parse Invoice", "agent_id": "PLACEHOLDER_AGENT_ID", "verifier_id": "PLACEHOLDER_VERIFIER_ID", "required": true},
      {"id": "step-analyze", "order": 1, "name": "Analyze Risk", "agent_id": "PLACEHOLDER_AGENT_ID_2", "verifier_id": "PLACEHOLDER_VERIFIER_ID_2", "required": true}
    ],
    "status": "active"
  }' | python3 -m json.tool
```

**Expected status code:** 201
**Expected fields:** `workflow.id`, `workflow.name`, `workflow.steps` (array of 2), `workflow.status: "active"`

### 7.2 List workflows

```bash
curl -s http://localhost:3001/api/workflows | python3 -m json.tool
```

**Expected status code:** 200
**Expected fields:** `workflows` (array), `count`

### 7.3 Get workflow detail

```bash
curl -s http://localhost:3001/api/workflows/PLACEHOLDER_WORKFLOW_ID | python3 -m json.tool
```

**Expected status code:** 200
**Expected fields:** `workflow` with all template fields

### 7.4 Create workflow run

```bash
curl -s -X POST http://localhost:3001/api/workflows/PLACEHOLDER_WORKFLOW_ID/run \
  -H "Content-Type: application/json" \
  -d '{"buyer_address": "0xPlaceholderBuyer"}' | python3 -m json.tool
```

**Expected status code:** 201
**Expected fields:** `run.id`, `run.status: "created"`, `message`

### 7.5 Execute step 1 (order 0)

```bash
curl -s -X POST http://localhost:3001/api/workflow-runs/PLACEHOLDER_RUN_ID/steps/step-parse/run \
  -H "Content-Type: application/json" \
  -d '{"agent_id": "PLACEHOLDER_AGENT_ID"}' | python3 -m json.tool
```

**Expected status code:** 200
**Expected fields:** `run`, `step_run.status: "completed"`, `proof`, `message`

### 7.6 Execute step 2 (order 1)

```bash
curl -s -X POST http://localhost:3001/api/workflow-runs/PLACEHOLDER_RUN_ID/steps/step-analyze/run \
  -H "Content-Type: application/json" \
  -d '{"agent_id": "PLACEHOLDER_AGENT_ID_2"}' | python3 -m json.tool
```

**Expected status code:** 200
**Expected fields:** `run`, `step_run.status: "completed"`, `proof`, `message`

### 7.7 Reject out-of-order step execution

```bash
# Create a new workflow run and try step 2 before step 1
RUN_ID=$(curl -s -X POST http://localhost:3001/api/workflows/PLACEHOLDER_WORKFLOW_ID/run \
  -H "Content-Type: application/json" \
  -d '{"buyer_address":"0xTest"}' | python3 -c "import sys,json;print(json.load(sys.stdin)['run']['id'])")

# Try step-analyze (order 1) before step-parse (order 0) - should fail
curl -s -X POST http://localhost:3001/api/workflow-runs/$RUN_ID/steps/step-analyze/run \
  -H "Content-Type: application/json" \
  -d '{"agent_id": "PLACEHOLDER_AGENT_ID_2"}' | python3 -m json.tool
```

**Expected status code:** 400
**Expected fields:** `error: "ORDER_VIOLATION"`, `message` (must mention step order)

### 7.8 Finalize workflow run

```bash
curl -s -X POST http://localhost:3001/api/workflow-runs/PLACEHOLDER_RUN_ID/finalize | python3 -m json.tool
```

**Expected status code:** 200
**Expected fields:** `run.status: "proofs_verified"`, `final_proof`, `step_proofs` (array), `step_count: 2`, `message`

### 7.9 Get workflow run status

```bash
curl -s http://localhost:3001/api/workflow-runs/PLACEHOLDER_RUN_ID | python3 -m json.tool
```

**Expected status code:** 200
**Expected fields:** `run`, `template`, `proofs`

---

## Gate 8: API Key Management

### 8.1 Create API key (secret shown once)

```bash
curl -s -X POST http://localhost:3001/api/api-keys \
  -H "Content-Type: application/json" \
  -d '{
    "owner_address": "0xPlaceholderOwner",
    "name": "Integration Key",
    "scopes": ["tasks:read", "tasks:write", "proofs:read"]
  }' | python3 -m json.tool
```

**Expected status code:** 201
**Expected fields:** `key.id`, `key.prefix`, `secret` (64-char hex string), `message`
**IMPORTANT:** Copy the `secret` value - this is the only time it is returned.

### 8.2 List API keys (prefix only, no secret)

```bash
curl -s "http://localhost:3001/api/api-keys?owner_address=0xPlaceholderOwner" | python3 -m json.tool
```

**Expected status code:** 200
**Expected fields:** `keys` (array), `count`, `owner_address`
**SECURITY CHECK:** No entry in `keys` may contain `secret`, `raw_secret`, `hashed_secret`, or `hash`.

### 8.3 Update API key

```bash
curl -s -X PATCH http://localhost:3001/api/api-keys/PLACEHOLDER_KEY_ID \
  -H "Content-Type: application/json" \
  -d '{
    "owner_address": "0xPlaceholderOwner",
    "name": "Updated Key Name",
    "scopes": ["tasks:read", "proofs:read", "proofs:write"]
  }' | python3 -m json.tool
```

**Expected status code:** 200
**Expected fields:** `key.name: "Updated Key Name"`, `key.scopes` (includes "proofs:write"), `message`

### 8.4 Reject update by wrong owner

```bash
curl -s -X PATCH http://localhost:3001/api/api-keys/PLACEHOLDER_KEY_ID \
  -H "Content-Type: application/json" \
  -d '{"owner_address": "0xNotTheOwner", "name": "Hijacked"}' | python3 -m json.tool
```

**Expected status code:** 403
**Expected fields:** `error: "FORBIDDEN"`, `message`

### 8.5 Revoke API key

```bash
curl -s -X DELETE http://localhost:3001/api/api-keys/PLACEHOLDER_KEY_ID \
  -H "Content-Type: application/json" \
  -d '{"owner_address": "0xPlaceholderOwner"}' | python3 -m json.tool
```

**Expected status code:** 200
**Expected fields:** `key.revoked_at` (not null), `message`

### 8.6 Reject use of revoked key (via service verification)

Revoked keys are excluded from listings and will be rejected by the `verifyApiKey` / `lookupApiKey` service functions. The list endpoint at Gate 8.2 should no longer include the revoked key.

---

## Gate 9: Error Paths and Enforcement

### 9.1 Nonexistent resources

```bash
# Nonexistent task
curl -s http://localhost:3001/api/tasks/nonexistent-id-00000 | python3 -m json.tool
# Expected: 404, error: "TASK_NOT_FOUND"

# Nonexistent payment
curl -s http://localhost:3001/api/payments/nonexistent-id-00000 | python3 -m json.tool
# Expected: 404, error: "PAYMENT_NOT_FOUND"

# Nonexistent agent
curl -s http://localhost:3001/api/agents/nonexistent-id-00000 | python3 -m json.tool
# Expected: 404, error: "AGENT_NOT_FOUND"

# Nonexistent listing
curl -s http://localhost:3001/api/marketplace/nonexistent-id-00000 | python3 -m json.tool
# Expected: 404, error: "LISTING_NOT_FOUND"

# Nonexistent verifier
curl -s http://localhost:3001/api/verifiers/nonexistent-id-00000 | python3 -m json.tool
# Expected: 404, error: "NOT_FOUND"

# Nonexistent workflow
curl -s http://localhost:3001/api/workflows/nonexistent-id-00000 | python3 -m json.tool
# Expected: 404, error: "WORKFLOW_NOT_FOUND"
```

### 9.2 Invalid state transitions

```bash
# Create a task and try to jump from funded → paid (invalid)
TASK_ID=$(curl -s -X POST http://localhost:3001/api/tasks \
  -H "Content-Type: application/json" \
  -d '{"agent_id":"PLACEHOLDER_AGENT_ID","buyer_address":"0xTest","total_amount":10,"currency":"USD"}' \
  | python3 -c "import sys,json;print(json.load(sys.stdin)['task_id'])")

curl -s -X PATCH http://localhost:3001/api/tasks/$TASK_ID/status \
  -H "Content-Type: application/json" \
  -d '{"status": "paid"}' | python3 -m json.tool
# Expected: 400, error: "INVALID_TRANSITION"
```

### 9.3 Owner mismatch

```bash
# Update an agent as wrong owner
curl -s -X PATCH http://localhost:3001/api/agents/PLACEHOLDER_AGENT_ID \
  -H "Content-Type: application/json" \
  -d '{"owner_address": "0xWrongOwner", "name": "Hijacked"}' | python3 -m json.tool
# Expected: 403, error: "FORBIDDEN"
```

### 9.4 Reject unlock before TEE verification + anchor

```bash
# Create a task but do NOT run verification or anchor - then try to unlock
TASK_ID=$(curl -s -X POST http://localhost:3001/api/tasks \
  -H "Content-Type: application/json" \
  -d '{"agent_id":"PLACEHOLDER_AGENT_ID","buyer_address":"0xTest","total_amount":10,"currency":"USD"}' \
  | python3 -c "import sys,json;print(json.load(sys.stdin)['task_id'])")

curl -s -X POST http://localhost:3001/api/tasks/$TASK_ID/unlock-payment | python3 -m json.tool
# Expected: 400, error: "INVALID_STATE", message must mention 'anchored'
```

### 9.5 Reject step with wrong agent

```bash
curl -s -X POST http://localhost:3001/api/workflow-runs/PLACEHOLDER_RUN_ID/steps/PLACEHOLDER_STEP_ID/run \
  -H "Content-Type: application/json" \
  -d '{"agent_id": "0xWrongAgent"}' | python3 -m json.tool
# Expected: 403, error: "FORBIDDEN", message must mention agent mismatch
```

### 9.6 Reject invalid split role

```bash
curl -s -X POST http://localhost:3001/api/payments/PLACEHOLDER_PAYMENT_ID/splits \
  -H "Content-Type: application/json" \
  -d '{
    "recipients": [
      {"address": "0xTest", "share_bps": 10000, "role": "super_admin"}
    ]
  }' | python3 -m json.tool
# Expected: 400, error: "INVALID_REQUEST", message must mention valid roles
```

---

## Gate 10: Comprehensive Service Health Checks

```bash
# API key service health
curl -s http://localhost:3001/api/api-keys/health | python3 -m json.tool
# Expected: 200, healthy: true, total/active/revoked counts

# Agent service health
curl -s http://localhost:3001/api/agents/health | python3 -m json.tool
# Expected: 200, healthy: true, agentCount

# Verifier service health
curl -s http://localhost:3001/api/verifiers/health | python3 -m json.tool
# Expected: 200, healthy: true, verifierCount

# Marketplace service health
curl -s http://localhost:3001/api/marketplace/health | python3 -m json.tool
# Expected: 200, healthy: true, listingCount

# Workflow service health
curl -s http://localhost:3001/api/workflows/health | python3 -m json.tool
# Expected: 200, healthy: true
```

---

## Summary

| Gate | Endpoint Group | Status Check |
|------|---------------|-------------|
| 1 | Health/Status | 200, mode=tee_verification_mode |
| 2 | Agents | Create 201, List 200, Reputation 200 |
| 3 | Verifiers | Create 201, Test 200 with deterministic hash |
| 4 | Marketplace | Create 201, List 200, Detail 200 |
| 5 | Tasks | Create 201, Run 200, Verify 200, Anchor 200, Unlock 200 |
| 6 | Payments | Intent 201, Splits 200, Unlock 200, Claim 200, Double-claim 409 |
| 7 | Workflows | Create 201, Run 201, Step 200, Finalize 200, Out-of-order 400 |
| 8 | API Keys | Create 201 (secret once), List 200 (no secrets), Revoke 200 |
| 9 | Error Paths | 404 for nonexistent, 400 for invalid transitions, 403 for owner mismatch |
| 10 | Health Checks | All services return healthy |
