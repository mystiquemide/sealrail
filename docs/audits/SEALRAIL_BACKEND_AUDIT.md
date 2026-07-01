# Sealrail Backend Deep Audit

Audit target: `/root/casper-tee-agent-payments`  
Audited commit: `b7df591 Phase M: backend integration gates`  
Audit date: 2026-07-01  
Scope: backend source, tests, docs/plans, package/dependency/config, repo hygiene, git state.  
Method: repo-audit methodology: discovery/mapping, evidence-based audit, improvement strategy, task plan.

## 1. Executive Summary

Overall health grade: C+.

Sealrail has a real backend foundation: Fastify 5, strict TypeScript build, SQLite schema, service-layer separation, deterministic state machines, 591 passing backend tests, API key hashing, payment split handling, verifier templates, workflows, reputation, Blocky adapter, and Casper adapter. That is above hackathon-average engineering.

The blocker is not feature volume. The blocker is trust boundary quality. Multiple mutation endpoints still trust `owner_address`, `buyer_address`, `address`, `agent_id`, and `verifier_id` from unauthenticated request bodies, while the API key middleware exists but is not attached to the product routes. The Casper path can report successful `testnet` anchoring even when no real deploy happened. The TEE/task path creates placeholder proof hashes instead of executing the Blocky verification path during task runs. The repository also has a lint gate failure in the root project, so launch-readiness is not clean despite backend tests and backend build passing.

Top 3 risks:
1. Authorization is body-claimed rather than credential-backed across core mutation routes.
2. Casper and proof paths can produce false confidence because simulated/fallback hashes are reported as successful anchors/proofs.
3. Tests are broad but mostly service-level and in-memory; they do not prove live HTTP authorization, real TEE, real Casper deploys, or production data persistence.

Top 3 opportunities:
1. Wire the existing API key middleware into all mutation routes and remove owner identity from trusted request bodies.
2. Split demo/dry-run modes from production/testnet success semantics so judges and users can see exactly what is real.
3. Add HTTP-level integration tests and CI gates for lint, build, tests, and audit.

Launch-readiness verdict: NEEDS FIXES before frontend/deploy. Safe for local demo with explicit dry-run language; not safe to present as production-grade payment/proof infrastructure yet.

## 2. Repo Map

### Purpose

Sealrail is a Casper-native proof and payment rail for AI-agent work. The product loop is: task funded -> agent runs -> proof verified -> Casper anchor recorded -> payment unlocks. This is stated in `docs/DESIGN.md:58-72`, `docs/ARCHITECTURE.md:8-17`, and `memory.md:1-8`.

### Stack

Backend:
- Node.js / TypeScript / ESM: `backend/package.json:1-12`, `backend/tsconfig.json:1-24`
- Fastify 5: `backend/package.json:13-18`, `backend/src/index.ts:6-30`
- SQLite via better-sqlite3: `backend/package.json:13-18`, `backend/src/db.ts:6-33`
- Vitest: `backend/package.json:19-25`

Frontend shell:
- Next.js 16.2.9, React 19.2.4: `package.json:11-24`
- Next build passes, but lint fails due backend files being included by root ESLint config: `eslint.config.mjs:5-16`

Contracts/docs:
- Odra/Casper contract status is tracked in `memory.md:163-183`.
- Backend implementation plan and verification runbook live in `docs/plans/SEALRAIL_BACKEND_IMPLEMENTATION_PLAN.md` and `docs/plans/VERIFICATION_GATES.md`.

### Directory inventory

- `backend/src/index.ts`: Fastify entry point, health/status routes, route registration, graceful shutdown.
- `backend/src/schema.ts`: 11 domain tables plus `system_events`, covering agents, listings, tasks, payments, recipients, proofs, verifiers, workflows, reputation, API keys.
- `backend/src/routes/*`: HTTP route handlers for proofs, tasks, payments, agents, marketplace, workflows, API keys, verifiers.
- `backend/src/services/*`: domain services and adapters.
- `backend/src/middleware/auth.ts`: API key extraction/scope middleware, currently not wired into route registration.
- `backend/tests/*.test.ts`: 12 Vitest files, 9,869 lines, service-heavy integration coverage.
- `docs/plans/VERIFICATION_GATES.md`: manual curl runbook for ten API route groups.
- `memory.md`: phase ledger and operational state.

Measured size from repository scan:
- `backend/src`: 26 TypeScript files, 9,167 lines.
- `backend/tests`: 12 TypeScript test files, 9,869 lines.
- `docs`: 15 markdown docs, 7,949 lines.
- `docs/plans`: 4 markdown docs, 2,776 lines.

### Architecture sketch

Request path:
1. `backend/src/index.ts:78-100` registers route groups.
2. Route files validate JSON bodies with Fastify schemas, then call service modules.
3. Service modules use synchronous better-sqlite3 calls through `getDb()`.
4. Domain state is persisted to SQLite tables from `backend/src/schema.ts:6-195`.
5. TEE calls shell out to `bky-as` through `backend/src/services/tee.ts:119-256`.
6. Casper calls shell out to `casper-client` or produce dry-run/simulated hashes through `backend/src/services/casper.ts:76-270`.

### What surprised me

The repo has API key authentication middleware with real scrypt hashing and timing-safe verification, but the product routes do not use it. The implementation has more backend breadth than expected for a hackathon, but the critical trust boundary is still missing.

## 3. Verification and Current Status

### Git state

Command run from `/root/casper-tee-agent-payments`:

```text
git status --short && git branch --show-current && git log --oneline -5
```

Observed output:

```text
master
b7df591 Phase M: backend integration gates
1f59459 memory.md: update Phase L commit hash and Phase K hash
c187325 Phase L: verifier template backend
aafb7e5 Phase K: API key management
4d3c9c2 memory.md: correct final Phase J commit hash
```

Interpretation: `git status --short` was clean at the beginning of the audit; the first visible line is the branch name `master`.

### Backend tests

Command:

```text
cd backend && npm test -- --no-file-parallelism
```

Observed result:

```text
Test Files  12 passed (12)
Tests       591 passed (591)
Duration    9.03s
```

Full suite files included `integration.test.ts`, `phase-a`, `phase-c`, `phase-d`, `phase-e`, `phase-f`, `phase-g`, `phase-h`, `phase-i`, `phase-j`, `phase-k`, and `phase-l`.

### Backend build

Command:

```text
cd backend && npm run build
```

Observed result:

```text
> sealrail-backend@0.1.0 build
> tsc --noEmit
```

Exit status: passed.

### Backend dependency audit

Command:

```text
cd backend && npm audit --audit-level=moderate --omit=dev
```

Observed result:

```text
found 0 vulnerabilities
```

### Backend dependency inspection

Command:

```text
cd backend && npm ls --depth=0 && npm outdated --json
```

Installed direct backend packages:

```text
@types/better-sqlite3@7.6.13
@types/node@22.20.0
@types/uuid@10.0.0
better-sqlite3@11.10.0
dotenv@16.6.1
fastify@5.9.0
tsx@4.22.4
typescript@5.9.3
uuid@11.1.1
vitest@2.1.9
```

Outdated direct packages reported: `@types/node`, `better-sqlite3`, `dotenv`, `typescript`, `uuid`, `vitest`.

### Root frontend build and lint

Command:

```text
npm run build
```

Observed result:

```text
Next.js 16.2.9 (Turbopack)
Compiled successfully
Route (app): /, /_not-found
```

Command:

```text
npm run lint
```

Observed result: failed.

Representative lint errors:

```text
backend/src/routes/payments.ts:129:47  error  Unexpected any. Specify a different type
backend/tests/integration.test.ts:867:31  error  Unexpected any. Specify a different type
backend/tests/phase-c.test.ts:120:32  error  Unexpected any. Specify a different type
backend/tests/phase-d.test.ts:403:92  error  Unexpected any. Specify a different type
backend/tests/phase-g.test.ts:142:32  error  Unexpected any. Specify a different type
backend/tests/phase-k.test.ts:158:31  error  Unexpected any. Specify a different type
```

Total lint output: 109 problems, 15 errors, 94 warnings. This is a repo-level launch gate failure.

### Live smoke test

Started backend with:

```text
cd backend && npm run start
```

Observed server logs:

```text
Database initialized — all 12 tables migrated
Server listening at http://127.0.0.1:3001
Sealrail backend running at http://0.0.0.0:3001 — mode: tee_verification_mode
```

Curl smoke checks returned 200 for:
- `/api/health`
- `/api/status`
- `/api/agents/health`
- `/api/verifiers/health`

Observed status payload included `node_env: development` and `casper_mode: dry_run`.

## 4. Audit Report

### Strengths worth preserving

1. Clear route/service separation. `backend/src/index.ts:78-100` registers route groups, and domain logic is mostly in services rather than inline route handlers.
2. SQLite setup is deterministic and uses WAL + foreign keys: `backend/src/db.ts:25-33`.
3. Schema has domain-specific CHECK constraints for status/currency/modes: examples at `backend/src/schema.ts:13-23`, `backend/src/schema.ts:59-60`, `backend/src/schema.ts:72-75`, `backend/src/schema.ts:109-110`.
4. API key secrets are not stored raw; creation uses random bytes and scrypt: `backend/src/services/api-keys.ts:34-48`.
5. Secret comparison uses `timingSafeEqual`: `backend/src/services/api-keys.ts:55-68`.
6. Split validation enforces total 10,000 bps and role constraints: `backend/src/services/splits.ts:96-145`.
7. Test suite is broad by feature count: `backend/tests/integration.test.ts:1-7` describes a full-loop suite, and the actual run passed 591 tests.
8. `.env` is ignored while `.env.example` is allowed: `.gitignore:11-13`.
9. Documentation is unusually detailed for a hackathon repo, especially `docs/plans/VERIFICATION_GATES.md:1-5` and `docs/DESIGN.md:40-45`.

### Critical findings

#### C1. Mutation endpoints trust caller-supplied identity instead of authenticated identity

Severity: Critical

Evidence:
- API key middleware exists but is only defined in `backend/src/middleware/auth.ts:54-119`; route registration in `backend/src/index.ts:78-100` attaches route groups without auth hooks.
- Agent update accepts `owner_address` in body and trusts it for owner check: `backend/src/routes/agents.ts:182-220`.
- Marketplace listing create/update trusts `owner_address` from request body: `backend/src/routes/marketplace.ts:131-214`.
- API key list/update/revoke trusts `owner_address` from query/body: `backend/src/routes/api-keys.ts:61-82`, `backend/src/routes/api-keys.ts:131-177`, `backend/src/routes/api-keys.ts:179-220`.
- Verifier create/update trusts `owner_address`: `backend/src/routes/verifiers.ts:151-205`, `backend/src/routes/verifiers.ts:270-340`.
- Payment claim accepts optional `address` and only checks it if supplied: `backend/src/routes/payments.ts:249-285`.

Why it matters:
Anyone who knows or guesses an `owner_address` can mutate or revoke resources as that owner. API keys are especially exposed because the API key management endpoints themselves are not protected by API keys or wallet signatures. This is a direct authorization bypass, not a theoretical concern.

Exact fix:
- Apply `requireApiKeyWithScope([...])` or a wallet-signature middleware to all mutation endpoints.
- Bind `request.apiKey.owner_address` to the owner instead of trusting `owner_address` in JSON bodies.
- Remove owner identity fields from mutation request schemas except during initial unauthenticated onboarding, if that flow is explicitly allowed.
- Add live HTTP tests that prove wrong/missing credentials receive 401/403.

#### C2. Casper testnet path can report success without a real deploy

Severity: Critical

Evidence:
- If `casper-client` is unavailable, `createTestnetAnchor` returns `success: true` with a simulated hash: `backend/src/services/casper.ts:203-219`.
- If no account key is configured, `submitCasperDeploy` returns a simulated deploy hash: `backend/src/services/casper.ts:189-195`.
- Any caught deploy error falls back to `success: true`: `backend/src/services/casper.ts:231-245`.
- `verifyAnchor` returns `valid: true` when no input is supplied in dry-run mode: `backend/src/services/casper.ts:285-289`.
- `verifyAnchor` returns `valid: true` when `casper-client` is unavailable in testnet mode: `backend/src/services/casper.ts:294-297`.

Why it matters:
A failed or missing Casper integration can look successful to the API and UI. For a product selling proof/payment finality on Casper, this destroys the core claim. Demo mode is acceptable; silent success fallback in `testnet` mode is not.

Exact fix:
- In `testnet`/`mainnet`, missing client, missing account key, or deploy failure must return `success: false` and a 5xx/424-style API error.
- Rename simulated paths to `dry_run` only and expose `simulated: true` in responses.
- Add tests asserting no simulated hash is emitted in non-dry-run modes.

#### C3. Task verification path creates placeholder proofs rather than running the Blocky verification flow

Severity: Critical

Evidence:
- `/api/proofs/verify` calls `verify(input)`, which reaches Blocky retry/TEE logic: `backend/src/routes/proof.ts:53-87`, `backend/src/services/blocky.ts:88-130`.
- But task execution creates a proof placeholder with string literals: `backend/src/services/tasks.ts:501-519`.
- Verification then marks pending proofs verified without validating attestation data: `backend/src/services/tasks.ts:568-584`.
- Anchoring can create a synthetic proof if none exists: `backend/src/services/tasks.ts:397-430`.

Why it matters:
The central product loop can advance to `proof_verified` and `anchored` without actual TEE verification. That is false confidence and weakens the hackathon demo if a judge follows the task route instead of the standalone proof route.

Exact fix:
- Make `runTaskVerification` call `verify()` with the task input and persist real `claims.hash_of_code`, `hash_of_input`, output hash, attestation hash, wasm hash, and status.
- Remove synthetic proof auto-creation from anchoring outside a clearly named test helper.
- Require a real verified proof before `anchorTaskProof` can proceed.

### High findings

#### H1. Root lint gate fails

Severity: High

Evidence:
- `npm run lint` produced 109 problems, 15 errors, 94 warnings.
- Root lint config includes all source and overrides only framework ignores: `eslint.config.mjs:5-16`.
- One production error is in `backend/src/routes/payments.ts:129`, where status is cast as `any`.

Why it matters:
The repo cannot claim clean launch gates. TypeScript build passes, but the lint gate fails hard. This will either break CI later or teach contributors to ignore lint.

Exact fix:
- Replace `status as any` in `backend/src/routes/payments.ts:129` with `status as PaymentStatus | undefined` and import/use the proper type.
- Clean or scope test lint errors.
- Decide whether root lint intentionally covers `backend/**`; if yes, keep it and fix all errors. If no, add an explicit backend ignore and create `backend` lint script.

#### H2. API keys exist but do not protect API-key management or business mutations

Severity: High

Evidence:
- API key service creates, lists, updates, revokes keys: `backend/src/services/api-keys.ts:121-218`, `backend/src/services/api-keys.ts:225-315`.
- Auth middleware sets `request.apiKey` on valid keys: `backend/src/middleware/auth.ts:54-78`, `backend/src/middleware/auth.ts:87-119`.
- Route files do not import or use `requireApiKey`/`requireApiKeyWithScope`; `backend/src/index.ts:78-100` registers all groups directly.

Why it matters:
The security subsystem is currently mostly ceremonial. It validates keys when called directly, but the product API does not enforce it.

Exact fix:
- Define scopes such as `agents:write`, `marketplace:write`, `tasks:write`, `payments:write`, `verifiers:write`, `api_keys:admin`.
- Add Fastify preHandler hooks to mutation routes.
- Test all unauthorized and wrong-scope cases over HTTP.

#### H3. Live endpoint coverage is weaker than test count suggests

Severity: High

Evidence:
- The integration suite imports services directly: `backend/tests/integration.test.ts:14-123`.
- It sets `process.env.DATABASE_PATH = ":memory:"` and resets DB directly: `backend/tests/integration.test.ts:140-152`.
- It does not instantiate Fastify and exercise actual HTTP schemas, headers, auth hooks, or route ordering.

Why it matters:
591 passing tests prove service functions, not the complete API boundary. Fastify schema behavior, auth hooks, request/response shapes, and endpoint ordering can still break in production.

Exact fix:
- Export a `buildApp()` factory from `backend/src/index.ts` that registers routes without listening.
- Add `app.inject()` tests for every route group, including missing field, invalid type, wrong owner, no auth, wrong scope, and not found.
- Keep service tests, but treat HTTP tests as the release gate.

#### H4. Payment claim can be attempted without address proof

Severity: High

Evidence:
- `claimSchema` only requires `recipient_id`: `backend/src/routes/payments.ts:69-76`.
- Address matching is conditional: `if (address) { ... }` at `backend/src/routes/payments.ts:262-285`.
- `claimRecipientShare` takes only `paymentId` and `recipientId`: `backend/src/services/payments.ts:388-391`.

Why it matters:
If recipient IDs are exposed in read APIs, any caller can claim an unlockable share by submitting only `recipient_id`. There is no wallet signature, API key owner binding, or required address proof.

Exact fix:
- Require authenticated claimant identity or wallet signature.
- Require `address` and verify it against the authenticated signer.
- Do not accept `recipient_id` alone as authorization.

#### H5. Backend status exposes environment and integration details publicly

Severity: High

Evidence:
- `/api/status` returns `node_env` and `casper_mode`: `backend/src/index.ts:67-75`.
- Service health can expose RPC URL, chain name, client availability, and account-key configured status: `backend/src/services/casper.ts:334-356`.
- Live smoke result showed `/api/agents/health` returned `rpcUrl: http://localhost:11101`, `clientVersion`, and `accountKeyConfigured: false`.

Why it matters:
This is useful for developers but noisy and potentially sensitive in public demos or production. Attackers learn deployment mode and integration gaps.

Exact fix:
- Keep detailed health under an authenticated `/api/admin/health` route.
- Make public health return only `{status, timestamp}` or a sanitized readiness state.

### Medium findings

#### M1. Database schema does not enforce enough referential integrity

Severity: Medium

Evidence:
- `tasks.agent_id` has no foreign key despite agents table existing: `backend/src/schema.ts:47-62`.
- `payments.task_id` and `payments.workflow_run_id` have no foreign keys: `backend/src/schema.ts:64-78`.
- `proofs.task_id`, `agent_id`, and `verifier_id` have no foreign keys: `backend/src/schema.ts:95-112`.
- Foreign keys are enabled globally: `backend/src/db.ts:27-29`, but many relationships are still text-only.

Why it matters:
The app can persist orphaned tasks, payments, proofs, and recipients. Reputation and payment dependency queries then compute on broken data.

Exact fix:
- Add foreign keys where lifecycle allows it.
- If flexible references are intentional, document them and add service-level integrity checks.
- Add migration tests for orphan rejection.

#### M2. SQLite operations are not transaction-wrapped for multi-row state changes

Severity: Medium

Evidence:
- `createTaskWithPayment` inserts payment then task as separate statements: `backend/src/services/tasks.ts:165-197`.
- `calculatePaymentSplits` deletes recipients, inserts recipients, then updates payment as separate statements: `backend/src/services/payments.ts:263-317`.
- `unlockAllSatisfiedRecipients` updates recipients/payment across several statements: `backend/src/services/splits.ts:458-543`.

Why it matters:
A mid-operation exception can leave inconsistent payment/task/split state. SQLite supports transactions; better-sqlite3 makes this easy.

Exact fix:
- Wrap multi-statement mutations with `db.transaction()`.
- Add tests that simulate throw-after-first-write and assert rollback.

#### M3. Unbounded list endpoints can grow into performance and memory problems

Severity: Medium

Evidence:
- `listTasks` returns all tasks when no status is provided: `backend/src/services/tasks.ts:283-294`.
- `listPayments` returns all payments: `backend/src/services/payments.ts:152-164`.
- `listAgents` returns all agents without limit: `backend/src/services/agents.ts:215-217`.
- `listVerifiers` returns all verifier templates: `backend/src/services/verifiers.ts:279-310`.
- Marketplace/workflow list endpoints have optional `limit` parsing, but no maximum clamp in route code: `backend/src/routes/marketplace.ts:71-91`, `backend/src/routes/workflows.ts:83-101`.

Why it matters:
A public list endpoint can degrade the process as records grow. It also increases data scraping risk.

Exact fix:
- Add default and maximum pagination to every list route.
- Validate `limit` as a bounded integer and reject `NaN`, negative, or excessive values.
- Add DB indexes for status/owner/date filters.

#### M4. Input validation is inconsistent for blockchain identifiers and money

Severity: Medium

Evidence:
- Owner/buyer/address fields are `minLength: 1` strings in routes such as `backend/src/routes/agents.ts:28-49`, `backend/src/routes/payments.ts:32-42`, `backend/src/routes/marketplace.ts:26-39`.
- Payment amounts allow zero: `backend/src/routes/payments.ts:37` and `backend/src/routes/tasks.ts:36`.
- Recipient address validation only checks non-empty string: `backend/src/services/splits.ts:104-111`.

Why it matters:
Invalid addresses and zero-value payments can enter core flows. That pollutes reputation, splits, and claim logic.

Exact fix:
- Define a Casper/account address validator or accepted demo-address regex.
- Require positive money amounts unless zero is deliberately supported.
- Normalize and validate all address fields consistently.

#### M5. TEE temp-file command path uses shell pipelines unnecessarily

Severity: Medium

Evidence:
- `attestFunctionCall` writes JSON to temp file, then calls `bash -c cat <tmp> | bky-as attest-fn-call`: `backend/src/services/tee.ts:125-138`.
- `verifyAttestation` repeats the pattern: `backend/src/services/tee.ts:211-223`.

Why it matters:
The temp filename is JSON-quoted, which helps, but using a shell pipeline is still avoidable complexity. Direct `execFile` with stdin or a child process stream is safer and clearer.

Exact fix:
- Replace `bash -c cat ... | ...` with direct spawn/execFile and pipe stdin.
- Keep temp-file cleanup only if the CLI requires file input.

#### M6. Error responses leak internal exception text

Severity: Medium

Evidence:
- Many route catch blocks return `message: msg` on 500 responses, e.g. `backend/src/routes/tasks.ts:101-109`, `backend/src/routes/payments.ts:115-119`, `backend/src/routes/verifiers.ts:250-265`, `backend/src/routes/marketplace.ts:168-181`.

Why it matters:
Internal errors can disclose implementation details, CLI paths, database details, or upstream output. Developer logs should retain details; public responses should be sanitized.

Exact fix:
- Map known domain errors to safe messages.
- For unknown 500s, return a generic message plus request ID.
- Log full details server-side only.

#### M7. Docs are stronger than README; README is still default create-next-app text

Severity: Medium

Evidence:
- Root `README.md:1-36` is the default Next.js starter text.
- Project-specific docs exist elsewhere, e.g. `docs/DESIGN.md:58-72`, `docs/ARCHITECTURE.md:8-17`, `docs/plans/VERIFICATION_GATES.md:1-15`.

Why it matters:
Judges or collaborators landing on GitHub see a generic scaffold README instead of setup commands, backend status, demo flow, and caveats.

Exact fix:
- Replace README with Sealrail-specific overview, setup, backend commands, verification gates, env vars, demo limitations, and launch status.

### Low findings

#### L1. `config` is imported before dotenv is loaded

Severity: Low

Evidence:
- `config` is imported at `backend/src/index.ts:7`.
- Dotenv is loaded later at `backend/src/index.ts:18-24`.
- `config.ts` reads `process.env` at module initialization: `backend/src/config.ts:4-45`.

Why it matters:
When running `src/index.ts`, `.env` values may not affect `config` because config was already evaluated. Tests may miss this if they set env before importing modules.

Exact fix:
- Load dotenv before importing `config`, or have `config` call `dotenv.config()` internally before reading env.

#### L2. Unused variables/imports and `any` casts show weak code hygiene

Severity: Low

Evidence:
- Lint reported 94 warnings and 15 errors.
- Examples include unused `allPaid` in `backend/src/services/payments.ts:432` and unused imports in route/test files.

Why it matters:
This is not a functional production blocker by itself, but it erodes signal in CI and makes real issues easier to miss.

Exact fix:
- Clean unused imports/variables.
- Replace test `any` casts with typed helpers or `unknown` plus narrowing.

#### L3. Duplicate state data risks divergence

Severity: Low

Evidence:
- Payment recipients are stored both in `payments.recipients` JSON and `payment_recipients` rows: `backend/src/schema.ts:73`, `backend/src/schema.ts:80-93`.
- Several services manually sync JSON after row changes: `backend/src/services/payments.ts:364-372`, `backend/src/services/splits.ts:505-533`.

Why it matters:
Dual storage creates drift risk. One stale JSON field can mislead API consumers if service code reads the wrong source.

Exact fix:
- Treat `payment_recipients` as source of truth and remove JSON duplication, or enforce a single sync path with transaction coverage.

## 5. Required Domain Coverage Notes

### Backend architecture

Good modular split by route and service. Main weakness: entrypoint both builds and listens, making HTTP tests harder. `backend/src/index.ts:113-125` starts immediately at module load.

### Services/routes

Comprehensive route set exists, but mutation routes need authentication and public response hardening.

### SQLite schema/data model

Coverage is broad and readable. Needs more foreign keys, indexes, migration/versioning strategy, and transaction wrappers.

### Tests

Backend tests pass. False confidence remains because service-level tests dominate and HTTP/auth/production integration is light.

### Security/auth/API keys

API key crypto is decent. Enforcement is missing. Owner/address body trust is the highest-risk issue.

### Casper/TEE integration

Adapters exist, but Casper success semantics and task proof creation are not strict enough for a proof/payment product. Dry-run is fine; pretending fallback success is not.

### Verifier/templates

Verifier CRUD and upload hash registration are implemented. `uploadVerifier` deliberately does not store WASM content, as documented at `backend/src/services/verifiers.ts:471-480`. That is acceptable for hackathon, but the UI must not imply retrievable WASM artifacts.

### Payments/splits

Split validation is strong on bps totals. Claim authorization is weak. Transactionality is missing.

### Workflows

Workflow routes cover templates, runs, ordered step execution, finalization: `backend/src/routes/workflows.ts:1-10`, `backend/src/routes/workflows.ts:258-350`. Needs auth, HTTP tests, and real proof coupling.

### Marketplace

Listing CRUD and listing-to-task exist. Owner checks are request-body based and need authenticated identity binding.

### Reputation

Reputation is computed from real proof/payment/task records per `memory.md:102-118`; route supports recalculation at `backend/src/routes/agents.ts:269-317`. Needs auth and resilience around stale/orphaned data.

### Docs/runbooks

Verification runbook is good. README is bad. Docs should explicitly label dry-run/testnet limitations.

### Dependency/config

Backend audit reports zero production vulnerabilities. Several direct packages are outdated. Config loading order is flawed.

### Build/devex

Backend test/build are clean. Root build is clean. Root lint fails.

### Repo hygiene

`.gitignore` protects `.env` and DB files. `backend/data/sealrail.db` is present in working tree listing but ignored by `.gitignore`; confirm it is not tracked before release. Generated audit files should be the only new files committed with `memory.md`.

## 6. Improvement Strategy

### Theme 1: Turn identity from a string into an authenticated principal

Target state: every mutation uses `request.apiKey` or a verified wallet signature, never a trusted `owner_address` field.  
Done means: missing auth returns 401, wrong scope returns 403, wrong owner returns 403, and tests prove all three.

### Theme 2: Separate demo simulation from proof/payment truth

Target state: dry-run mode is explicit, and non-dry-run modes fail closed when Casper/TEE integrations are unavailable.  
Done means: no `success: true` fallback in `testnet`, no synthetic task proofs in production paths, UI can display `dry_run` truthfully.

### Theme 3: Make the HTTP boundary the release gate

Target state: service tests remain, but every route has `app.inject()` coverage for valid, invalid, auth, and edge cases.  
Done means: CI runs lint, backend build, backend tests, root build, and HTTP route tests.

### Theme 4: Protect state consistency

Target state: multi-write operations are transactional, schema relations are enforced, and list endpoints are bounded.  
Done means: split/payment/task updates cannot half-commit, orphaned records are rejected or explicitly documented.

### Trade-offs

Do not build enterprise auth, OAuth, or multi-tenant RBAC before the hackathon. API keys plus wallet-signature verification are enough for this maturity stage. Do not replace SQLite yet; SQLite is acceptable for hackathon demo if transactions, indexes, and pagination are added.

## 7. Task Plan

### Milestone 0: Safety net

| Task | Description | Files/areas | Acceptance criteria | Effort | Risk | Dependencies |
|---|---|---|---|---|---|---|
| Add HTTP app factory | Split Fastify app construction from `listen()` so tests can use `app.inject()`. | `backend/src/index.ts`, tests | Existing server still starts; route tests can instantiate app without port bind. | M | Medium | None |
| Add route-level auth tests | Prove missing/wrong auth fails for all mutation routes. | `backend/tests/http-auth.test.ts` | Tests fail before auth wiring, pass after wiring. | M | Low | App factory |
| Fix lint gate | Remove production `any`, unused variables, or scope test lint intentionally. | backend routes/tests, ESLint config | `npm run lint` exits 0. | S/M | Low | None |

### Milestone 1: Critical fixes

| Task | Description | Files/areas | Acceptance criteria | Effort | Risk | Dependencies |
|---|---|---|---|---|---|---|
| Enforce API key scopes on mutations | Attach `requireApiKeyWithScope` to agent/listing/task/payment/verifier/workflow/API-key admin routes. | `backend/src/routes/*`, `backend/src/middleware/auth.ts` | All mutation endpoints reject missing/invalid/wrong-scope keys. | M | Medium | Auth tests |
| Remove body-claimed owner trust | Replace trusted body/query owner identity with authenticated principal. | routes/services using owner_address | Wrong owner cannot mutate or revoke resources. | M | Medium | API key scopes |
| Fail closed for Casper testnet | Remove simulated success from `testnet`; only dry-run may simulate. | `backend/src/services/casper.ts`, route tests | Missing client/key/deploy failure returns failure in testnet. | S | Medium | Mode tests |
| Replace task placeholder proof path | `runTaskVerification` must invoke Blocky verification and persist real proof data. | `backend/src/services/tasks.ts`, proof types/tests | Task run cannot reach `proof_verified` without verified claims. | L | High | TEE test fixtures |
| Require claim authorization | Require authenticated address/wallet proof for recipient claims. | `backend/src/routes/payments.ts`, `payments.ts` service | Recipient ID alone is insufficient. | M | Medium | Auth principal design |

### Milestone 2: High-leverage improvements

| Task | Description | Files/areas | Acceptance criteria | Effort | Risk | Dependencies |
|---|---|---|---|---|---|---|
| Add transactions | Wrap task+payment creation, split calculation, unlock, claim, workflow finalize. | services/tasks/payments/splits/workflows | Simulated mid-write failures roll back. | M | Medium | Tests |
| Add pagination and indexes | Bound all list endpoints and add indexes for owner/status/date filters. | schema/services/routes | Max page size enforced; DB query plan uses indexes. | M | Medium | None |
| Harden error responses | Generic 500 responses with request IDs; detailed server logs only. | all route catch blocks | No raw internal exception text in 500 JSON. | S | Low | None |
| Fix config load order | Ensure `.env` is loaded before config evaluation. | `backend/src/index.ts`, `backend/src/config.ts` | `.env` values affect runtime config. | S | Low | Tests |

### Milestone 3: Quality and polish

| Task | Description | Files/areas | Acceptance criteria | Effort | Risk | Dependencies |
|---|---|---|---|---|---|---|
| Replace starter README | Add Sealrail overview, setup, demo flow, status, limitations. | `README.md` | New contributor can run backend/frontend from README. | S | Low | None |
| Document dry-run semantics | Make dry-run/testnet/hosted TEE limitations explicit. | docs/plans, README, UI copy | No doc implies real anchor/proof when simulated. | S | Low | Casper/TEE fixes |
| Add CI workflow | Run lint, backend tests, backend build, root build. | `.github/workflows/*` | CI fails on current lint until fixed. | S | Low | Lint fix |
| Dependency refresh pass | Review outdated direct deps. | package files/lockfiles | No unplanned major jumps; smoke tests pass. | M | Medium | CI |

### Quick wins

1. Fix `backend/src/routes/payments.ts:129` `any` cast and the highest-volume lint errors.
2. Move detailed `/api/*/health` internals behind admin auth.
3. Add a README section that says current backend mode is `dry_run` unless configured otherwise.
4. Add max limit clamps to marketplace/workflow list endpoints.
5. Remove `success: true` fallback on Casper `testnet` error paths.

### Top 3 implementation sketches

1. Auth enforcement:
   - Define `ApiScope` constants.
   - Add `preHandler: requireApiKeyWithScope([scope])` to all mutation routes.
   - In services, accept `ownerAddress` from `request.apiKey.owner_address`, not body.
   - Add HTTP tests for every protected route.

2. Casper fail-closed:
   - Make `createDryRunAnchor` the only simulated success function.
   - In `createTestnetAnchor`, throw or return `success: false` if client/key/deploy fails.
   - Update routes to map failed anchoring to 424/502.
   - Keep a `mode` and `simulated` response field.

3. Real task proof path:
   - Convert task input to `InvoiceRiskInput` or task-specific verifier input.
   - Call `verify()` from `services/blocky.ts` inside `runTaskVerification`.
   - Persist actual claims and hashes.
   - Make `verifyTaskProof` validate persisted claims instead of blindly flipping pending proofs.

## 8. Open Questions

1. Should Sealrail use API keys only for the hackathon, or wallet signatures for owner-sensitive actions?
2. Is `dry_run` the only intended judging mode, or must the demo prove a real Casper testnet deploy before submission?
3. Should zero-amount payments be allowed for demo/test flows, or should all payment amounts be positive?
4. Should verifier WASM content be stored, uploaded to object storage, or intentionally hash-only for v1?
5. Does the frontend need to present API key management at launch, or can it be hidden until auth is hardened?

## 9. Top 5 Findings

1. Critical: mutation endpoints trust body/query `owner_address` and recipient fields instead of authenticated identity.
2. Critical: Casper `testnet` can report success with simulated hashes after missing client/key/errors.
3. Critical: task proof flow creates placeholder/synthetic proofs instead of using real Blocky verification.
4. High: root `npm run lint` fails with 15 errors and 94 warnings.
5. High: test count is high, but HTTP/auth/live integration coverage is not strong enough for the current claims.

## 10. Blockers Before Frontend/Deploy

Blocking before public frontend/deploy:
- Authentication/authorization must be enforced on all mutation routes.
- Casper/TEE truth semantics must be fixed to avoid false proof/anchor success.
- Root lint gate must pass or be intentionally scoped.
- README and public docs must state current dry-run/demo limitations.

Not blocking for local-only demo if clearly labeled:
- SQLite as the backing store.
- Hash-only verifier WASM registration.
- Outdated direct dependencies with no reported moderate+ production vulnerabilities.
