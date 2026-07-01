# Sealrail Project Memory

Project: Sealrail (Verified Agent Payments on Casper)
Date started: 2026-06-30
Hackathon: Casper Agentic Buildathon
Deadline: 2026-07-07 23:59 UTC
Brand: Sealrail
Positioning: No Proof without a Payment.

## Phase status

- DESIGN.md: approved by Mide.
- Frontend UI plan: written, not started.
- Backend plan: approved. docs/plans/SEALRAIL_BACKEND_IMPLEMENTATION_PLAN.md (1178 lines).
- Backend audit report: produced at docs/audits/SEALRAIL_BACKEND_AUDIT.md and docs/audits/SEALRAIL_BACKEND_AUDIT.docx for audited commit b7df591.
- Backend re-audit report: produced at docs/audits/SEALRAIL_BACKEND_REAUDIT.md and docs/audits/SEALRAIL_BACKEND_REAUDIT.docx for audited commit 312d3a4. Grade B+; A/A+ target not met until mainnet fail-closed behavior, placeholder proof advancement, and payment claim identity proof are fixed.
- Backend re-audit second pass report: produced at docs/audits/SEALRAIL_BACKEND_REAUDIT_2.md and docs/audits/SEALRAIL_BACKEND_REAUDIT_2.docx for audited commit 9941e78. Grade B+; A/A+ target not met because placeholder dry-run proofs still advance task status to `proof_verified` and can be anchored as `anchored`, even though mainnet fail-closed and payment owner_address enforcement are fixed. 628 tests pass, all gates green.
- Backend audit third pass: Placeholder proofs (attestation-hash-pending/default, wasm-hash-default, input-*/output-*) can NEVER advance task to `proof_verified`, `anchored`, or `payable` — even in dry_run. Extracted `isPlaceholderProof()` predicate; `verifyTaskProof` returns `dry_run_proof_simulated`; `anchorTaskProof` returns `dry_run_simulated` without state transition; `unlockTaskPayment` requires non-placeholder proofs. 631 tests pass, all 5 gates green. Next step: Levi final re-audit for A/A+.
- Backend Phase A: DONE. 20/20 tests passed.
- Backend Phase B: DONE. 23/23 tests passed (cargo odra test).
- Backend Phase C: DONE. 30/30 tests passed (vitest).
- Backend Phase D: DONE. 35/35 tests passed (vitest). Commit c67dad7.
- Backend Phase E: DONE. 75/75 tests passed (vitest). Commit 7787fb8.
- Backend Phase F: DONE. 44/44 tests passed (vitest). Commit 8015233.
- Backend Phase G: DONE. 30/30 tests passed (vitest). Commit 75d381a.
- Backend Phase H: DONE. 50/50 tests passed (vitest). Commit d8f728a.
- Backend Phase I: DONE. 44/44 tests passed (vitest). Commit cacb329.
- Backend Phase J: DONE. 41/41 tests passed (vitest). Commit b815023.
- Backend Phase K: DONE. 69/69 tests passed (vitest). Commit aafb7e5.
- Backend Phase L: DONE. 65/65 tests passed (vitest). Commit c187325.

## Backend Phase M deliverables

Files created in backend/ and docs/:

| File | Purpose |
|---|---|
| tests/integration.test.ts | M1+M3+M4: Full-loop integration test (88 tests) covering health/status, agent registration, verifier templates, marketplace listings, task creation, payment intents+splits+unlock+claim, TEE proof verification path, Casper anchor path, workflow template+run+ordered step execution+finalize, reputation recalculation, API key CRUD+lookup+scope checks, state machine enforcement (task/payment/recipient/workflow transitions), and error paths (nonexistent resources, owner mismatch, split validation, proof dependency resolution, unlock enforcement, workflow errors, API key errors) |
| docs/plans/VERIFICATION_GATES.md | M2: Curl-based verification runbook with copy-paste curl commands, expected HTTP status codes, expected JSON fields, 10 gates covering all API route groups, judge-safe TEE wording, placeholder values only |

Full test suite: 591 tests, 12 files, all passing. TypeScript check (tsc --noEmit): clean.

## Next Phase

Phase N: Frontend implementation (per DESIGN.md frontend UI plan). Backend is now fully complete and verified across all 10 API route groups.

## Backend Phase L deliverables

Files created/modified in backend/:

| File | Purpose |
|---|---|
| src/services/verifiers.ts | L1: Verifier template CRUD, L2: WASM hash registration + upload, L3: Test-verifier action with deterministic hash chaining |
| src/routes/verifiers.ts | L4: 6 endpoints — GET list, GET detail, POST create, POST upload (base64 WASM), PATCH update, POST test |
| src/index.ts (modified) | Registered verifier routes |
| tests/phase-l.test.ts | 65 tests: create/list/get/update, schema validation, duplicate slug, wasm hash validation, upload/register, test-verifier action, owner mismatch, nonexistent verifier, filters, A-K preservation |

API routes registered:
- GET /api/verifiers — List with filters (status, task_type, owner_address)
- GET /api/verifiers/:verifierId — Detail
- POST /api/verifiers — Register verifier template
- POST /api/verifiers/upload — Upload WASM (base64) + register template
- PATCH /api/verifiers/:verifierId — Update (owner-only)
- POST /api/verifiers/:verifierId/test — Test with sample input (deterministic hash chaining)

Full test suite: 503 tests, 11 files, all passing.

Files created/modified in backend/:

| File | Purpose |
|---|---|
| src/services/workflows.ts | H1: Workflow template CRUD, H2: Run engine with ordered step execution, H3: Step proof generation and final bundle |
| src/routes/workflows.ts | H4: 7 endpoints — create/list/get workflow, create run, get run, execute step, finalize |
| src/index.ts (modified) | Registered workflow routes |
| tests/phase-h.test.ts | 50 tests: template CRUD, run creation, ordered step execution, out-of-order rejection, finalize, nonexistent IDs, invalid states |

API routes verified via curl:
- GET /api/workflows — List with filters (category, status, owner)
- POST /api/workflows — Create template with step validation (agent existence, unique orders)
- GET /api/workflows/:workflowId — Template detail
- POST /api/workflows/:workflowId/run — Create run from active template (draft blocked)
- GET /api/workflow-runs/:runId — Run detail with template + proofs
- POST /api/workflow-runs/:runId/steps/:stepId/run — Execute ordered step (enforces sequence, agent match, single-execution)
- POST /api/workflow-runs/:runId/finalize — Bundle all verified step proofs into final proof with real SHA-256 hashes

Full test suite: 284 tests, 7 files, all passing.

## Backend Phase I deliverables

Files created/modified in backend/:

| File | Purpose |
|---|---|
| src/services/splits.ts | I1: recipient validation (role + address), I2: proof dependency resolution (verified/anchored proofs matching task/workflow), I3: per-recipient unlock with partial-unlock support |
| src/routes/payments.ts (modified) | I4: enhanced POST /splits with validation, POST /unlock with proof dependency checking, POST /claim with double-claim/wrong-recipient guards, GET /:paymentId with proof_dependencies |
| tests/phase-i.test.ts | 44 tests: split validation, proof dependency resolution, partial/full unlock, no-unlockable rejection, double-claim, wrong recipient, nonexistent payment, A-H preservation, end-to-end workflow |

API routes verified via curl:
- POST /api/payments/:paymentId/splits — Split calculation with recipient role/address validation (400 on invalid role/address/bps)
- GET /api/payments/:paymentId — Payment with split detail + per-recipient proof dependency status
- POST /api/payments/:paymentId/unlock — Per-recipient proof dependency check; partial unlock when some proofs satisfied; full unlock when all satisfied; 400 when none unlockable
- POST /api/payments/:paymentId/claim — Claim with double-claim rejection (409) and wrong-recipient rejection (403)

Full test suite: 328 tests, 8 files, all passing.

## Backend Phase J deliverables

Files created/modified in backend/:

| File | Purpose |
|---|---|
| src/services/reputation.ts | J1: Score calculator from real proof/payment/task data, J2: gatherReputationInputs, computeReputation, recalculateReputation, getReputation, computeScore pure function |
| src/services/agents.ts (modified) | Delegated getAgentReputation to reputation service; re-exports recalculateReputation |
| src/services/tasks.ts (modified) | J2: On-event recalculation hooks on task status transitions to paid/blocked and proof verification |
| src/routes/agents.ts (modified) | J3: POST /api/agents/:agentId/reputation/recalculate route with optional owner check |
| tests/phase-j.test.ts | 41 tests: score formula, bounds [0,100], deterministic output, real data gathering, paid/blocked/failed/verified inputs, recalculation behavior, recalculateAllReputations, task recalculation hooks, health, A-I preservation |

API routes verified:
- GET /api/agents/:agentId/reputation — Returns computed reputation from live records (score + all metrics)
- POST /api/agents/:agentId/reputation/recalculate — Explicit recalculation with optional owner address auth

Full test suite: 369 tests, 9 files, all passing.

## Backend Phase K deliverables

Files created/modified in backend/:

| File | Purpose |
|---|---|
| src/services/api-keys.ts | K1: Key generation (crypto.randomBytes 256-bit), scrypt hashing with per-key salt, timing-safe verification, CRUD operations (create/list/update/revoke), last_used_at tracking, health check |
| src/middleware/auth.ts | K2: Scoped middleware — requireApiKey, requireApiKeyWithScope, optionalApiKey. Extracts key from Authorization: Bearer or x-api-key header. Scope enforcement with OR logic |
| src/routes/api-keys.ts | K3: GET /api/api-keys (list by owner, prefix only), POST /api/api-keys (create, secret shown once), PATCH /api/api-keys/:keyId (update name/scopes), DELETE /api/api-keys/:keyId (soft revoke), GET /api/api-keys/health |
| src/index.ts (modified) | Registered api-keys routes and middleware types |
| tests/phase-k.test.ts | 69 tests: key generation, hashing/verification, create/list/no-secret exposure, lookup auth, invalid key rejection, scope enforcement, update, revoke, last_used_at, duplicate/security edge cases, nonexistent key, A-J preservation |

API routes verified via curl:
- POST /api/api-keys — Creates key with scrypt-hashed secret; returns raw secret once (64-char hex)
- GET /api/api-keys?owner_address=X — Lists keys with prefix only; no secret/hashed_secret exposed
- PATCH /api/api-keys/:keyId — Updates name/scopes; owner-only
- DELETE /api/api-keys/:keyId — Soft-revokes (sets revoked_at); owner-only; revoked keys excluded from list+auth
- GET /api/api-keys/health — Service health with total/active/revoked counts

Full test suite: 438 tests, 10 files, all passing.

## Backend Phase A deliverables

Files created in backend/:

| File | Purpose |
|---|---|
| package.json | Fastify 5.x, better-sqlite3, vitest, TypeScript |
| tsconfig.json | ES2022, strict mode |
| src/config.ts | Typed env loader, teeVerificationMode |
| src/db.ts | SQLite connection, WAL mode, FK enforcement |
| src/schema.ts | 12 tables with full DDL and CHECK constraints |
| src/types.ts | 11+ TypeScript model interfaces |
| src/index.ts | Fastify server, /api/health + /api/status |
| .env.example | Template env vars (no secrets) |
| tests/phase-a.test.ts | 20 tests: schema, constraints, config, WAL, tables |

Health endpoint: GET /api/health → {"status":"ok","mode":"tee_verification_mode"}

Config defaults patched by Mide:
- BLOCKY_MODE: "tee_adapter" (was "local-server")
- CASPER_MODE: "dry_run" (was "local")

## Backend Phase B deliverables

Files created in contracts/verified-agent-payments/:

| File | Purpose |
|---|---|
| Cargo.toml | Odra 2.8.2, nightly toolchain, wasm target |
| Odra.toml | Contract FQN: verified_agent_payments::VerifiedAgentPayments |
| build.rs | odra_build::build() — sets odra_module cfg flag |
| src/lib.rs | Contract: storage, types, 8 entry points, 5 events, 10 errors |
| bin/build_contract.rs | WASM build binary |
| bin/build_schema.rs | Schema generation binary |
| bin/cli.rs | Livenet CLI tool |
| tests/proof_registry.rs | 23 tests covering all entry points and error paths |

Entry points: init, register_agent, create_payment, anchor_proof, mark_payable, mark_paid, get_agent, get_payment.
Events: AgentRegistered, PaymentCreated, ProofAnchored, PaymentMarkedPayable, PaymentMarkedPaid.
Errors: NotOwner, AgentAlreadyExists, AgentNotFound, AgentInactive, PaymentAlreadyExists, PaymentNotFound, ProofAlreadyAnchored, PaymentNotVerified, PaymentNotPayable, InvalidState.
Sentinel pattern: Mapping<String, bool> for agent_registered and payment_registered existence checks.

Verification gate: cd contracts/verified-agent-payments && cargo odra test → 23/23 passed.

## Backend Phase C deliverables

Files created in backend/:

| File | Purpose |
|---|---|
| src/services/tee.ts | Blocky AS CLI client: attest-fn-call + verify-fn-call flow, claims parsing, output validation |
| src/services/blocky.ts | TEE verification wrapper: retry logic, error classification, health check |
| src/routes/proof.ts | POST /api/proofs/verify endpoint with schema validation |
| src/types.ts (extended) | Phase C types: InvoiceRiskInput, VerifiedBlockyClaims, VerificationResult, BlockyErrorCode, RetryConfig, BlockyHealthStatus |
| tests/phase-c.test.ts | 30 tests: happy path, error paths, retry exhaustion, error classification, health check, schema types |

TEE verification flow:
1. Accept InvoiceRiskInput → build fn-call JSON payload
2. bky-as attest-fn-call → parse attestation output
3. Extract enclave_attested_application_public_key + transitive_attested_function_call
4. bky-as verify-fn-call → parse VerifiedBlockyClaims
5. Validate claims (hash_of_code, task_id) + build synthetic InvoiceRiskOutput
6. Return typed VerificationResult (verified | failed)

Verification gate: cd backend && npx vitest run phase-c → 30/30 passed.
POST /api/proofs/verify registered on Fastify server.

## Backend stack

| Layer | Choice |
|---|---|
| Runtime | Node.js 20+ |
| Language | TypeScript 5.x |
| Framework | Fastify 5.x |
| Database | SQLite (better-sqlite3) |
| Tests | Vitest |
| Contract | Rust + Odra (Phase B) |

## Kanban state (2026-06-30)

| Task | ID | Status |
|---|---|---|
| Senku: backend phase kickoff | t_39582ff2 | done |
| Senku: Phase A foundation | t_6a63a78d | done |
| Senku: Phase B contract | t_0d97afe3 | done |
| Senku: Phase C adapter | t_9803c227 | done |
| Senku: Phase D casper adapter | t_c865380b | done |
| Senku: Phase E task + payment | t_2e989ae5 | done |
| Senku: Phase F agent registry | t_bb1cb4ee | done |
| Senku: Phase G marketplace | t_2fe2682c | done |
| Senku: Phase H workflows | t_c44d9742 | done |
| Senku: Phase I splits | t_a1571388 | done |
| Senku: Phase J reputation | t_39aebe66 | done |
| Senku: Phase K api keys | t_9e3d7666 | done |
| Senku: Phase L verifiers | t_cdebfeb7 | done |
| Senku: Phase M integration gates | t_7889b433 | done |

## Blocky status

Blocky AS CLI installed (bky-as, bky-c). Local verification path working. Hosted TEE API key requested from info@blocky.rocks — no response yet.

## Casper status

- Rust nightly, wasm32 target, cargo-odra, casper-client installed.
- CSPR.cloud key in /root/.env (REDACTED — never shared).
- Odra contract BUILT — Phase B complete. 23/23 tests pass.

## Build rules

- Backend first, frontend last.
- Phase at a time, gated by tests.
- No secrets in code, docs, logs, or chat.
- Public-facing surfaces use TEE language only.
- No skeleton, no stub, no placeholder — real working code from step one.
- Kanban: Senku (builder agent) executes Phases A–M. Mide directs via Muzan.


## Registration status

- Hackathon: Casper Agentic Buildathon (DoraHacks)
- Registered: Yes
- Registration date: 2026-06-30
- Deadline: 2026-07-07 23:59 UTC
- GitHub: github.com/mystiquemide/sealrail (private)
- Notion Hackathon Tracker: https://notion.so/38f1fa84b58f810780f8cff3bdae2523
- Notion Projects: https://notion.so/38f1fa84b58f81feb61dc136969d5c3b
- Progress log: cron job eb0a1c420c73 (every 6h)

## Backend Phase G deliverables

Files created/modified in backend/:

| File | Purpose |
|---|---|
| src/services/marketplace.ts | G1: Listing CRUD + G2: Listing-to-task creation link using Phase E services |
| src/routes/marketplace.ts | G3: GET/POST/PATCH marketplace endpoints with owner enforcement |
| src/index.ts (modified) | Registered marketplace routes |
| tests/phase-g.test.ts | 30 tests: create/list/get/update, owner mismatch, nonexistent, task creation, filters |

Listing model fields: id, agent_id, owner_address, title, category, summary, price_amount, currency, proof_requirement, verifier_id, reputation_score, total_verified_runs, total_paid_tasks, failure_rate, status, timestamps.

API routes verified via curl:
- GET /api/marketplace — List with filters (category, status, owner, agent)
- GET /api/marketplace/:listingId — Detail with agent summary + reputation
- POST /api/marketplace/listings — Create listing (owner checked against agent owner)
- PATCH /api/marketplace/listings/:listingId — Update owned listing
- POST /api/marketplace/:listingId/tasks — Create payment-backed task from live listing

Full test suite: 234 tests, 6 files, all passing.
