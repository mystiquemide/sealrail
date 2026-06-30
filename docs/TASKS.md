# Tasks: Verified Agent Payments on Casper

Date: 2026-06-30
Phase: Master Forge Phase 2
Core positioning: No Proof without a Payment.

## Build policy

Backend/proof layer first. UI/frontend last.

During build phase, complete one task at a time and ask before moving to the next.

## Phase 2 output checklist

- [x] PRD approved
- [x] Architecture doc
- [x] Design doc
- [x] Task plan
- [x] `.env.example`
- [x] Update `memory.md`

## Phase 3 build tasks

### Task 1: Scaffold repo structure

Status: pending

Create folders:

```text
contracts/verified-agent-payments
backend
frontend
blocky/invoice-verifier
```

Acceptance criteria:

- Repo structure exists.
- `README.md` placeholder exists.
- Existing Blocky verifier from `/root/blocky-invoice-verifier` is copied into project.
- No secrets committed.

### Task 2: Build Odra proof registry contract

Status: pending

Files:

```text
contracts/verified-agent-payments/Cargo.toml
contracts/verified-agent-payments/rust-toolchain.toml
contracts/verified-agent-payments/src/lib.rs
contracts/verified-agent-payments/tests/proof_registry.rs
```

Contract:

```text
VerifiedAgentPayments
```

Entry points:

1. `register_agent`
2. `create_payment_intent`
3. `anchor_proof`
4. `mark_paid`
5. `get_agent`
6. `get_task`

Acceptance criteria:

- `cargo odra test` passes.
- Existence checks use explicit sentinel mappings.
- Proof cannot be anchored for missing task.
- Payment cannot be marked paid before proof is anchored.
- Agent must be registered before task creation.

### Task 3: Build backend skeleton

Status: pending

Recommended stack:

```text
Node.js + TypeScript + Fastify + SQLite
```

Files:

```text
backend/package.json
backend/tsconfig.json
backend/src/index.ts
backend/src/db.ts
backend/src/types.ts
backend/src/routes/tasks.ts
backend/src/services/tasks.ts
```

Acceptance criteria:

- `npm test` or equivalent passes.
- `GET /health` returns OK.
- Local SQLite DB initializes.
- No frontend yet.

### Task 4: Implement Blocky adapter

Status: pending

Files:

```text
backend/src/services/blocky.ts
blocky/invoice-verifier/main.go
blocky/invoice-verifier/fn-call.template.json
```

Behavior:

1. Build or use compiled `main.wasm`.
2. Create task-specific `fn-call.json`.
3. Run `bky-as attest-fn-call`.
4. Run `bky-as verify-fn-call`.
5. Decode base64 output.
6. Validate function name and code hash.
7. Return typed claims and decoded result.

Acceptance criteria:

- Adapter works with local-server mode.
- Output matches invoice task ID.
- Claims include expected `hash_of_code`.
- Local mode warning is exposed to API.

### Task 5: Implement Casper anchoring adapter

Status: pending

Files:

```text
backend/src/services/casper.ts
```

Behavior:

1. In local test mode, store proof as simulated deploy hash.
2. In Casper mode, call Odra/casper-client path.
3. Persist `casper_deploy_hash` to task.

Acceptance criteria:

- Local mode returns deterministic fake deploy hash labelled as local.
- Casper mode is behind env config.
- No fake live deploy claims.
- If live deploy succeeds, API returns real deploy hash.

### Task 6: Implement task API

Status: pending

Endpoints:

1. `POST /api/tasks`
2. `POST /api/tasks/:taskId/run-proof`
3. `POST /api/tasks/:taskId/anchor`
4. `POST /api/tasks/:taskId/mark-paid`
5. `GET /api/tasks/:taskId`
6. `GET /api/proofs`
7. `GET /api/agents`

Acceptance criteria:

- Full local proof loop works through HTTP calls.
- Payment state transitions are enforced.
- Invalid state transition returns 400.
- Proof hashes are persisted.

### Task 7: Backend tests and API verification

Status: pending

Tests:

1. Create task.
2. Run proof.
3. Anchor proof.
4. Mark paid.
5. Reject mark paid before proof.
6. Reject mismatched Blocky output.

Acceptance criteria:

- Automated tests pass.
- Real `curl` calls against local server pass.
- Test output saved to docs or README.

### Task 8: Build frontend dashboard

Status: pending

Pages:

1. `/`
2. `/run`
3. `/proofs`
4. `/proofs/[taskId]`
5. `/agents`

Components:

1. `ProofTimeline`
2. `PaymentStatus`
3. `HashCard`
4. `ModeBadge`
5. `AgentCard`

Acceptance criteria:

- Judge can run task run from UI.
- UI shows proof and payment states.
- Local Blocky mode is honest and clear.
- Hash copy buttons work.
- Mobile layout is usable.

### Task 9: Full QA pass

Status: pending

Checks:

1. Contract tests.
2. Backend tests.
3. Frontend build.
4. Browser smoke test.
5. Secret scan.
6. README accuracy check.

Acceptance criteria:

- No TODO placeholders in final visible UI.
- No real secrets committed.
- README does not claim hosted TEE unless key arrived.
- Run path works from clean start.

### Task 10: Run and submission assets

Status: pending

Files:

```text
README.md
docs/PRODUCT_RUN_SCRIPT.md
docs/SUBMISSION.md
```

Acceptance criteria:

- 90-second product run script exists.
- Submission summary includes Casper, Blocky, x402-style payment story.
- README has setup commands.
- Screenshots or video plan included.

## Dependency graph

```text
Task 1
  -> Task 2
  -> Task 3
      -> Task 4
      -> Task 5
          -> Task 6
              -> Task 7
                  -> Task 8
                      -> Task 9
                          -> Task 10
```

## Stretch tasks

Only after core product run works:

1. Hosted Blocky AS provider if key arrives.
2. Real Casper testnet deploy if funding/config is ready.
3. Agent reputation score.
4. Second agent template.
5. Stronger x402 integration.

## Product run script draft

1. Open dashboard.
2. Show headline: No Proof without a Payment.
3. Create an invoice verification task with payment intent.
4. Run proof.
5. Show Blocky-compatible attestation claims.
6. Show Casper proof hash/deploy reference.
7. Show payment unlocked only after proof.
8. Open proof explorer and inspect the task.

## Stop point

After Phase 2 approval, begin Phase 3 with Task 1 only.

Ask:

```text
Task 1 is ready. Should I scaffold the repo structure?
```
