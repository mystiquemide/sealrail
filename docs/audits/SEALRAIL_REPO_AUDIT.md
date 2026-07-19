# Sealrail - Repo Audit & Improvement Plan

Date: 2026-07-02
Audited commit: b83bc12
Companion report: SEALRAIL_ELITE_HACKATHON_AUDIT.md (reviewer-facing view; this one is engineering-facing)

---

## 1. Executive Summary

Overall health: B+. The core engineering is unusually strong for a hackathon repo, with 751 backend tests across 15 files, a deployed and tested Odra contract, strict TypeScript throughout, and a service/route layering that's held up through 14 build phases. The grade is dragged down by everything around the code rather than in it.

Top 3 risks:

1. The repo is private with a boilerplate README and no LICENSE, so reviewers can't evaluate it at all.
2. `POST /api/api-keys` is unauthenticated and trusts caller-supplied `owner_address`, undermining the ownership model every other route enforces.
3. The test suite is environment-dependent (12 failures on any machine without the `bky-as` CLI), so the repo's strongest evidence of quality looks broken to a fresh cloner.

Top 3 opportunities: a real README is a two-hour fix with the highest payoff of anything in this plan, a minimal CI workflow would make the 739 green tests visible and permanent, and wiring one real testnet anchor into the demo path converts the deployed contract from a footnote into the headline.

## 2. Repo Map

Purpose: proof-gated agent payment rail for the Casper Agentic Buildathon. Agents get paid only after TEE-verified proof, anchored on Casper. Maturity: late-stage hackathon build, 5 days to deadline, phases R/S/T (deploy, video, submission) outstanding.

Stack: Next.js 16 App Router + React 19 + Tailwind 4 + CSS Modules (frontend), Fastify 5 + better-sqlite3 + Vitest on Node (backend), Rust + Odra 2.8.2 (Casper contract, deployed to testnet).

| Directory | What it is |
|---|---|
| `app/` (19 pages) + `components/` (48 files) | Frontend, all wired to the real backend via `lib/api.ts` |
| `lib/` | Typed API client (291 lines), mirrored API types (248), demo-session bootstrap (101) |
| `backend/src/` (11.3k lines) | routes/ (10 route files) → services/ (17 service files) → db/schema, 12 tables |
| `backend/tests/` (15 files) | Phase-gated suites A through N plus integration and deploy-prep |
| `contracts/verified-agent-payments/` | Odra contract, 8 entry points, 23/23 tests, live on testnet |
| `docs/` | PRD, architecture, design, 5 audit reports, plans, plus 13 committed .docx duplicates |

Surprises: `memory.md` (64KB of internal agent build memory) is committed at the root, the root package is still named `sealrail-scaffold`, and there's no CI, no frontend tests, and no LICENSE despite five formal backend audit passes.

## 3. Audit Report

### Security

- Critical (for the trust model, moderate in demo context): `POST /api/api-keys` has no `preHandler`, so `request.apiKey` is always undefined and owner attribution comes from the request body or defaults to the literal string `"bootstrap"` (`backend/src/routes/api-keys.ts:85-89`). Anyone who can reach the API can mint keys for any owner address, including scoped-admin keys for someone else's identity. Every other mutating route enforces ownership (e.g. `:129`, `:176` use `requireApiKeyWithScope`), which makes this the one hole in an otherwise consistent model. Fact, verified in source. (Post-audit decision: kept frictionless for reviewer demo; harden with an env flag per Task 1.2.)
- Medium: no rate limiting and no security headers on the backend (`@fastify/rate-limit` and `@fastify/helmet` absent from `backend/package.json`). Matters once deployed publicly in Phase R, since key creation and LLM-invoking task runs are both unmetered.
- Low: CORS origin comes from a single `FRONTEND_ORIGIN` env var (`backend/src/index.ts`), fine, just remember to set it in Phase R.
- Healthy: no secrets in tracked files (scanned), `.gitignore` correctly covers `.env*`, DB files, and key material. API secrets are scrypt-hashed with per-key salt and timing-safe comparison (`backend/src/services/api-keys.ts`).

### Testing

- High: the suite is environment-dependent. 11 phase-c tests fail without the `bky-as` CLI installed, and `phase-deploy-prep.test.ts:420` fails because the CLI-missing warning legitimately contains `https://github.com/blocky/blocky-as` while the test bans all URLs in validation messages. Verified by running the suite on 2026-07-02 (739/751 on WSL Node 24). Consequence: a reviewer running `npm test` on a clean clone sees 12 red tests on the repo's flagship claim. Judgment: the URL test should assert on secret patterns, not all URLs, and phase-c should skip-with-reason when the CLI is absent.
- Medium: zero frontend tests (no test runner in root `package.json`). The pure state modules (`components/run/run-state.ts`, `components/workflow-detail/workflow-detail-state.ts`, `components/proofs/proofs-data.ts`) are exactly the kind of logic that's cheap to unit test and already extracted for it. Calibrated to maturity: acceptable to skip for the hackathon, listed for honesty.
- Strength: backend tests assert behavior (state transitions, error codes, secret non-exposure), not just execution, and each phase suite re-verifies prior phases.

### Architecture & Design

- Healthy overall: consistent route → service → db layering, no circular dependencies observed, services are cohesive per domain. `backend/src/services/tasks.ts` at 913 lines is the largest hotspot but remains one domain's state machine rather than a god file. Light-review areas: `contracts/` internals (previously audited 23/23) and `docs/`.
- Low: `lib/api-types.ts` is a hand-mirrored copy of backend types, which will drift silently the next time a backend model changes. Fine for now, a shared types package or generation step is the eventual fix.

### Code Quality

- Healthy: strict TS both sides, `tsc --noEmit` clean, lint clean, error handling is structured (`ApiClientError` on the frontend, coded errors on the backend). The 2026-07-02 UX fix pass removed the main frontend inconsistencies (dead error branch, false copy confirmations, duplicated backend-unreachable strings now in `lib/copy.ts`).
- Low: the four clipboard handlers remain four near-identical implementations (`app/run/page.tsx`, `app/proofs/[proofId]/page.tsx`, `app/workflows/[workflowId]/page.tsx`, `app/api-keys/page.tsx`). A `useCopyFeedback()` hook would collapse them, cosmetic at this point.

### Performance

- Medium: `/proofs` does an N+1 fan-out, `listTasks()` then `getTaskDetail()` per task in parallel (`app/proofs/page.tsx:25-31`), because no bulk proof-list endpoint exists. Fine at demo scale, degrades linearly with task count. Same pattern on `/owner` for reputations.
- Healthy elsewhere: SQLite WAL mode, static prerendering where possible, no blocking calls in async paths spotted.

### Dependencies

- Healthy: Next 16.2.9 / React 19.2.4 / Fastify 5 / Tailwind 4 are all current. Lockfiles committed for both packages. Vitest 2 is one major behind, harmless. No unmaintained or heavy packages. No license field in either package.json and no LICENSE file, which is the only real issue here.

### DevEx & Operations

- High: no CI at all (no `.github/workflows`). All quality gates (751 tests, tsc, lint) run only on someone's machine, and the Windows-native install is broken for the backend (better-sqlite3 needs MSVC, works only via WSL). CI on ubuntu-latest would make the suite pass cleanly and publicly on every push.
- Medium: setup friction is undocumented. The WSL requirement, the two dev servers, the port mismatch note buried in `.env.example:23-25`, and the `FRONTEND_ORIGIN` var live only in tribal memory (`memory.md`). `backend/DEPLOYMENT.md` exists and is good, but nothing at the root points to it.
- Low: root package still named `sealrail-scaffold` (`package.json:2`).

### Documentation

- Critical (for this repo's purpose): `README.md` is untouched create-next-app boilerplate, all 36 lines of it. The repo's actual documentation (PRD, architecture, five audit reports, deployment runbook, in-app docs page content) is extensive but unreachable from the front door. This is the single worst effort-to-visibility mismatch in the project.
- Medium: internal artifacts committed at root and in docs/: `memory.md` (64KB), 13 `.docx` binary duplicates of markdown files, `AIRA_FORENSIC_TEARDOWN.md` and other unrelated planning docs. Judgment: the audit reports help you, the rest reads as clutter. (Post-audit decision: pruning deferred.)

### Strengths

Test discipline that most production repos don't have, a genuinely deployed and verified testnet contract, fail-closed safety invariants that survived five adversarial audit passes, honest UI states end to end, clean secret hygiene, and a consistent layered backend that stayed coherent across 14 incremental phases.

## 4. Improvement Strategy

Theme 1 - The repo hides its own quality. Boilerplate README, private visibility, no LICENSE, no CI, clutter at root. Target state: a stranger understands and trusts the project in 60 seconds from the GitHub landing page. Principle: evidence you can't see doesn't exist.

Theme 2 - Quality gates are machine-dependent. Tests pass only on the right WSL setup, 12 fail on clean clones. Target state: `npm test` is green on a fresh ubuntu machine, enforced by CI. Principle: a test suite that needs a specific laptop proves nothing.

Theme 3 - One auth hole in a consistent model. Key creation bypasses the ownership enforcement everything else follows. Target state: bootstrap is either explicitly dev-only or removed. Principle: an invariant with one exception isn't an invariant.

Explicitly not fixing before the deadline: frontend unit tests, the shared-types drift, the N+1 fan-outs, the clipboard hook, rate limiting beyond a basic plugin. All are real but none moves the submission, and refactors this week add risk without payoff.

Done looks like: repo public, README rewritten, LICENSE present, CI green on push, 751/751 or documented-skip on clean clone, key-creation path locked down, zero Critical findings.

## 5. Task Plan

### Milestone 0 - Safety Net

| # | Task | Effort | Risk | Depends |
|---|---|---|---|---|
| 0.1 | Add GitHub Actions CI: backend tests + tsc on ubuntu, frontend lint + build | S | None | - |

### Milestone 1 - Critical Fixes

| # | Task | Effort | Risk | Depends |
|---|---|---|---|---|
| 1.1 | Fix environment-dependent tests (skip phase-c with reason when CLI absent, narrow the URL assertion) | S | Low | - |
| 1.2 | Gate `POST /api/api-keys`: require auth, or restrict bootstrap to dev / `ALLOW_BOOTSTRAP_KEYS=true` | M | Medium (frontend session bootstrap depends on it) | - |
| 1.3 | Rewrite README.md | S | None | - |
| 1.4 | Add MIT LICENSE, fix package name, make repo public | S | None | 1.3 |

### Milestone 2 - High Leverage

| # | Task | Effort | Risk | Depends |
|---|---|---|---|---|
| 2.1 | Phase R deploy (Vercel + backend host), set FRONTEND_ORIGIN, LLM key, add @fastify/rate-limit | L | Medium | 1.2 |
| 2.2 | Wire one showcase testnet anchor into the demo path | M | Medium | 2.1 |
| 2.3 | Prune/relocate internal artifacts (memory.md, .docx files) - DEFERRED per Mide | S | Low | - |

### Milestone 3 - Quality & Polish (post-deadline)

Frontend unit tests for the pure state modules, `useCopyFeedback()` hook, bulk proof-list endpoint, shared types package.

### Quick wins (do immediately)

0.1, 1.1, 1.3, 1.4 - all S-effort, and together they flip the repo from "can't evaluate" to "green CI, real README, public, licensed."

### Top-3 implementation sketches

1.3 README: positioning line, what-it-does in 4 bullets, architecture diagram (ASCII is fine), contract hash with testnet.cspr.live link, test counts with the honest caveat, quickstart (WSL note for backend), links to `backend/DEPLOYMENT.md` and `docs/audits/`. Steal content from `components/docs/docs-content.ts`, it's already written.

1.1 Tests: in `phase-c.test.ts`, detect CLI presence once (`which bky-as`) and `describe.skipIf` the dependent blocks with a message. In `phase-deploy-prep.test.ts:418-422`, replace the blanket `not.toContain("https://")` with assertions that no message matches key-like patterns (`/sk-[a-zA-Z0-9]/`, hex-of-length-N) and allowlist the known install-docs URL. Gotcha: keep the secret-leak intent, don't just delete the test.

1.2 Key creation: add `optionalApiKey` preHandler so authenticated attribution actually works, then branch: if no key and not development, require `ALLOW_BOOTSTRAP_KEYS=true` (set it in the deployed reviewer demo per Mide's frictionless decision, default off elsewhere). Gotcha: `http-auth.test.ts` and phase-k tests exercise this route, update expectations.

## 6. Open Questions - RESOLVED (Mide, 2026-07-02)

1. Deployed demo key bootstrap: frictionless (open bootstrap stays on for reviewers).
2. LLM provider/key for the deployed backend: undecided - this blocks Phase R and the demo video.
3. memory.md / .docx pruning: deferred until later.
4. Testnet anchoring in demo: showcase anchor (one real anchor linked in the UI, not per-run).
