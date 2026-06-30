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

## Blocky status

Blocky AS CLI installed (bky-as, bky-c). Local verification path working. Hosted TEE API key requested from info@blocky.rocks — no response yet.

## Casper status

- Rust nightly, wasm32 target, cargo-odra, casper-client installed.
- CSPR.cloud key in /root/.env (REDACTED — never shared).
- Odra contract not built yet (Phase B).

## Build rules

- Backend first, frontend last.
- Phase at a time, gated by tests.
- No secrets in code, docs, logs, or chat.
- Public-facing surfaces use TEE language only.
- No skeleton, no stub, no placeholder — real working code from step one.
- Kanban: Senku (builder agent) executes Phases A–M. Mide directs via Muzan.

## Next

Phase B: Odra proof registry contract (Rust/Odra, cargo odra build, cargo odra test).
