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
- Backend Phase A: DONE. 20/20 tests passed.
- Backend Phase B: DONE. 23/23 tests passed (cargo odra test).
- Backend Phase C: DONE. 30/30 tests passed (vitest).

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

## Next

Phase D: Casper anchoring adapter (backend/src/services/casper.ts).
