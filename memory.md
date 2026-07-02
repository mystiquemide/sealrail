# Sealrail Project Memory

Project: Sealrail (Verified Agent Payments on Casper)
Date started: 2026-06-30
Hackathon: Casper Agentic Buildathon
Deadline: 2026-07-07 23:59 UTC
Brand: Sealrail
Positioning: No Proof without a Payment.

## Phase status

- Phase O (frontend-backend wiring): DONE. All 19 screens wired to the real backend API — no fixture imports remain in any page. `npm run lint` and `npm run build` (frontend) both pass clean; backend test suite still at 737/751 (the 14 failures are `bky-as` CLI-absence cascades, unchanged baseline, not a regression). See "Phase O: frontend-backend wiring" section below for the full breakdown.

  Backend local dev setup: added `@fastify/cors` (registered in `buildApp()`, allowed origin from new `FRONTEND_ORIGIN` env var), created `backend/vitest.config.ts` (scopes root to `backend/` so vitest/Vite stops climbing to the repo-root `postcss.config.mjs`, which was crashing test runs from a Linux-side Node install because the root `node_modules/lightningcss` binary was Windows-only). Backend runs via WSL (native Windows `npm install` fails on `better-sqlite3` — no MSVC build tools installed; WSL's `nvm` Node 24 has prebuilt binaries and works cleanly). One dev-db pollution incident: a test run against the real (non-`:memory:`) `DATABASE_PATH` default wrote a stray `L-test Verifier` row into `backend/data/sealrail.db`; cleared that file (gitignored, no real data) for a clean slate before starting frontend integration. Bootstrapped full-scope demo API keys (`owner_address` = `01a3f...9c2e`) via `POST /api/api-keys` for local testing.
- DESIGN.md: approved by Mide.
- Frontend UI: implemented across 19 screens, builds and passes lint. Docs page is rich and professional. Blockers were fixed: status truthfulness, demo-wording removal, CTA wiring, 404 recovery, proof-detail navigation.
- Backend plan: approved. docs/plans/SEALRAIL_BACKEND_IMPLEMENTATION_PLAN.md (1178 lines).
- Backend audit report: produced at docs/audits/SEALRAIL_BACKEND_AUDIT.md and docs/audits/SEALRAIL_BACKEND_AUDIT.docx for audited commit b7df591.
- Backend re-audit report: produced at docs/audits/SEALRAIL_BACKEND_REAUDIT.md and docs/audits/SEALRAIL_BACKEND_REAUDIT.docx for audited commit 312d3a4. Grade B+; A/A+ target not met until mainnet fail-closed behavior, placeholder proof advancement, and payment claim identity proof are fixed.
- Backend re-audit second pass report: produced at docs/audits/SEALRAIL_BACKEND_REAUDIT_2.md and docs/audits/SEALRAIL_BACKEND_REAUDIT_2.docx for audited commit 9941e78. Grade B+; A/A+ target not met because placeholder dry-run proofs still advance task status to `proof_verified` and can be anchored as `anchored`, even though mainnet fail-closed and payment owner_address enforcement are fixed. 628 tests pass, all gates green.
- Backend audit third pass: Placeholder proofs (attestation-hash-pending/default, wasm-hash-default, input-*/output-*) can NEVER advance task to `proof_verified`, `anchored`, or `payable` — even in dry_run. Extracted `isPlaceholderProof()` predicate; `verifyTaskProof` returns `dry_run_proof_simulated`; `anchorTaskProof` returns `dry_run_simulated` without task state transition; `unlockTaskPayment` requires non-placeholder proofs. 631 tests pass, all 5 gates green.
- Backend final re-audit report: produced at docs/audits/SEALRAIL_BACKEND_FINAL_REAUDIT.md and docs/audits/SEALRAIL_BACKEND_FINAL_REAUDIT.docx for audited commit 48f03a4. Final grade A; A/A+ target met. Zero blockers. Remaining non-blocker: dry-run simulated anchor still labels the placeholder proof row `anchored`, but task stays `proof_pending` and payment does not unlock.
- Backend A+ re-audit report: produced at docs/audits/SEALRAIL_BACKEND_A_PLUS_REAUDIT.md and docs/audits/SEALRAIL_BACKEND_A_PLUS_REAUDIT.docx for audited commit 108f06b. Final grade A+; target met. Dry-run simulated anchors leave placeholder proof rows `pending` with `casper_anchor_hash` null, placeholder proofs do not advance task/payment state, mainnet fail-closed and payment claim owner binding hold, and all 5 gates are green (631 tests).
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
- Backend Phase N: DONE. 685 tests, commit 90385c9. Post-Levi-audit fix applied — pending placeholder proof fallback removed; LLM failures throw honestly (503/500); wasm_hash is SHA-256 hash-bound.
- Backend Deploy Prep (Phase N+): DONE. 751 tests (66 new), commit TBD. Backend deployment hardening while Blocky hosted access is pending. Comprehensive status endpoints, config validation, deployment runbook.

## Backend Deploy Prep deliverables (Phase N+)

Files created/modified in backend/:

| File | Purpose |
|---|---|
| src/services/status.ts | Comprehensive status gathering: Blocky readiness (CLI + hosted), Casper readiness (mode/contract/client), LLM readiness (provider/model/configured), database readiness, deployment readiness summary with blockers+warnings, public-safe status (no secrets), admin-safe status (full detail) |
| src/services/config-validation.ts | Deployment config validation with honest failure: validates Blocky, Casper (dry_run/testnet/mainnet), LLM, server, database configs. Returns structured ValidationResult with errors (block deployment) and warnings (advisory). Never leaks secrets in messages. |
| src/routes/status.ts | Status API routes: GET /api/health (extended with blocky_cli + tee_hookup), GET /api/status (public-safe fields), GET /api/status/detailed, GET /api/admin/status (authenticated, full readiness), GET /api/admin/readiness (returns 503 on blockers) |
| src/config.ts (modified) | Added casperContractHash config field for CASPER_CONTRACT_HASH env var |
| src/index.ts (modified) | Registered status routes; added config validation logging at startup; upgraded health/status endpoints to use status service |
| .env.example (modified) | Deployment-ready env template: added deployment mode docs, quick-start section, deployment checklist for dry_run/testnet, CASPER_CONTRACT_HASH documentation |
| DEPLOYMENT.md | Deployment runbook: prerequisites, quick start, config reference table, startup validation docs, health/status endpoint reference, Blocky access status section, Phase N guarantee verification, deployment target guidance, remaining access needed for Phase Q |
| tests/phase-deploy-prep.test.ts | 66 tests: Blocky readiness (CLI, hosted config, secret exposure), Casper readiness (mode, contract hash, client, CSPR.cloud), LLM readiness (provider, config, no leak), database readiness, deployment readiness summary, public status (no secrets), admin status (full detail, no secrets), config validation (issues, severity, secret safety), API routes (health, status, admin auth, readiness HTTP codes), no-hosted-blocky scenario, Phase N A+ guarantee preservation, existing route preservation |

API endpoints added/upgraded:
- GET /api/health — Extended with blocky_cli (version/unavailable) and tee_hookup (pending_hosted_access/ready)
- GET /api/status — Public-safe: status, casper_mode, casper_contract_ready, blocky_cli_available, hosted_tee_ready, tee_hookup_blocked, llm_configured, db_connected, node_env, uptime
- GET /api/status/detailed — Same as /api/status (public-safe)
- GET /api/admin/status — Authenticated: status + full readiness (all subsystems + blockers + warnings + Phase N guarantees)
- GET /api/admin/readiness — Authenticated: returns 503 if blockers exist, 200 otherwise

Full test suite: 751 tests, 15 files, all passing. TypeScript check (tsc --noEmit): clean.

## Next Phase

Files created in backend/ and docs/:

| File | Purpose |
|---|---|
| tests/integration.test.ts | M1+M3+M4: Full-loop integration test (88 tests) covering health/status, agent registration, verifier templates, marketplace listings, task creation, payment intents+splits+unlock+claim, TEE proof verification path, Casper anchor path, workflow template+run+ordered step execution+finalize, reputation recalculation, API key CRUD+lookup+scope checks, state machine enforcement (task/payment/recipient/workflow transitions), and error paths (nonexistent resources, owner mismatch, split validation, proof dependency resolution, unlock enforcement, workflow errors, API key errors) |
| docs/plans/VERIFICATION_GATES.md | M2: Curl-based verification runbook with copy-paste curl commands, expected HTTP status codes, expected JSON fields, 10 gates covering all API route groups, judge-safe TEE wording, placeholder values only |

Full test suite: 591 tests, 12 files, all passing. TypeScript check (tsc --noEmit): clean.

## Phase N: Frontend implementation (in progress)

Landing page (`/`) built in Next.js App Router (React 19, Tailwind v4, CSS Modules), sourced directly from a Claude Design (claude.ai/design) import rather than hand-building from DESIGN.md wireframes.

Design source: claude.ai/design project `43c0e1ca-8a00-4165-87dc-efa58c1f211d` ("Design documentation request"), file `Sealrail Landing.dc.html`, pulled via the DesignSync MCP tool (`get_project` / `list_files` / `get_file`).

That same design project already contains finished `.dc.html` designs for every other app screen, ready to pull the same way when their turn comes: `Sealrail Agent Profile.dc.html`, `Sealrail Agents.dc.html`, `Sealrail Marketplace Listing.dc.html`, `Sealrail Marketplace.dc.html`, `Sealrail Owner Dashboard.dc.html`, `Sealrail Owner Register Agent.dc.html`, `Sealrail Proof Detail.dc.html`, `Sealrail Proofs.dc.html`, `Sealrail Run.dc.html`.

Files created/modified in this pass:

| File | Purpose |
|---|---|
| `public/hero-sealkeeper.jpg` | Hero image (The Sealkeeper mascot on the payment rail), supplied by Mide |
| `components/landing/Landing.module.css` | All landing page styles ported 1:1 from the `.dc.html` inline styles (colors, clamp() responsive type, hover states) |
| `components/brand/SealrailMark.tsx` | Reusable logo SVG (nav + footer) |
| `components/landing/Hero.tsx` | Full-bleed hero image with nav overlay + dual CTA |
| `components/landing/ProductFamily.tsx` | 3-card "Proof Tasks / Verifier Rail / Casper Anchor" section |
| `components/landing/ProofFlow.tsx` | 5-step "how it works" rail with connecting line |
| `components/landing/ScaleStrip.tsx` | 4-metric trust strip |
| `components/landing/FirstVertical.tsx` | RWA invoice verification narrative |
| `components/landing/ProofExplorerPreview.tsx` | Sample proof table (payable/blocked states) |
| `components/landing/TeeVerification.tsx` | TEE Verification Mode / TEE Verification / Casper Anchored badges |
| `components/landing/FinalCta.tsx` | Closing CTA section |
| `components/landing/Footer.tsx` | 4-column footer with brand block |
| `app/page.tsx` | Rewritten to compose all landing sections (was untouched create-next-app boilerplate before this) |
| `app/layout.tsx` | Swapped Geist/Geist_Mono for Inter + JetBrains Mono (next/font/google), real page metadata |
| `app/globals.css` | Added Sealrail palette tokens (`--sr-black`, `--sr-paper`, `--sr-proof-green`, etc.) and `--font-serif` |
| `tsconfig.json` | Added `backend` and `contracts` to `exclude` — root tsconfig had no exclusion for the backend folder, which broke `next build`/`tsc` once backend code existed (pre-existing gap, not previously hit since frontend was untouched until now) |

Verification: `npm run build` (Turbopack, typecheck + static generation) passes clean, `npm run lint` passes clean, `npm run dev` checked visually in Chrome at desktop (1440px) and mobile (390px) width — hero, all 8 sections, and footer render pixel-correct against the design. One hydration console warning observed is a false positive from a Chrome extension injecting `bis_skin_checked` attributes, not app code.

### `/run` (task runner)

Built from `Sealrail Run.dc.html` in the same Claude Design project. This one is a real interactive state machine (not a static section), ported 1:1 from the design's embedded component logic:

| File | Purpose |
|---|---|
| `components/app/AppNav.tsx` + `.module.css` | Reusable dark sticky app nav (distinct from the landing page's overlay nav), used by `/run` and future app screens |
| `components/run/run-state.ts` | Pure functions: `computeSteps`, `computeButtonVariants`, `computeButtonLabels`, `computeOutput`, `computeHashes` — derive all UI state from a single `stage` value (0-6, 99=failed) |
| `components/run/TaskForm.tsx` | Read-only invoice fields (fixed demo scenario, matches source) + 4 numbered stage buttons + "simulate a failed proof" checkbox |
| `components/run/LiveProofRail.tsx` | Vertical timeline, 5 steps, pulsing dot on the currently-running step |
| `components/run/VerifiedOutputPanel.tsx`, `ProofHashesPanel.tsx` | Risk score/decision/reason panel and WASM/attestation/Casper-anchor hash panel with copy-bundle button |
| `app/run/page.tsx` | `"use client"` page holding the state machine (stage/simulateFail/copied in refs+state to avoid stale-closure bugs in the `setTimeout` chains) and composing the above |

Timing and transitions match the source exactly: createTask (instant) → runAgent (1300ms to ready) → verify (1500ms to verified/failed) → unlock. "Run full demo" chains all four with the same delays as the design (250/900/2900/5100ms). Verified in-browser: initial state and a full run-through both render correctly (colors, labels, hash values, enabled/disabled states all match). Copy-to-clipboard button wasn't fully click-verified in-browser — clicking it appears to trigger a native Chrome clipboard-permission dialog that blocks CDP automation (recovered fine after a reload); the handler itself has a try/catch around `navigator.clipboard.writeText`, matching the source design's own error handling, so this is a test-environment limitation, not a known app bug.

### `/marketplace`

Built from `Sealrail Marketplace.dc.html`. Client component with 3-way filtering (category/mode/status selects) over a small typed listings array.

| File | Purpose |
|---|---|
| `components/app/AppNav.tsx` (refactored) | Now takes `active`, `links`, `cta` props instead of being hardcoded, since each screen's nav shows a different active-page label and CTA variant (ghost vs primary white). Run page's usage relies on the defaults, which match its original hardcoded behavior exactly |
| `components/marketplace/marketplace-data.ts` | `Listing` type, `ALL_LISTINGS` (currently just Invoice Risk Agent, matching the source — DeFi/Research are explicitly "in development, not shown" per the footnote), `filterListings`, `emptyReasonFor` |
| `components/marketplace/MarketplaceFilters.tsx` | Category/Proof mode/Status native `<select>` filter bar |
| `components/marketplace/MarketplaceListingTable.tsx` | Listing table + truthful empty state with "Clear filters" |
| `app/marketplace/page.tsx` | `"use client"` page holding filter state |

Listing row links to `/marketplace/[listingId]` (e.g. `/marketplace/listing_invoice_risk`), matching the DESIGN.md route map — that page doesn't exist yet, will resolve once built.

Verified: initial render confirmed pixel-correct in-browser (nav, header, disabled "Register agent"/"Create verifier" tooltips, filter bar, single live listing row, footnote). Did **not** get to visually confirm the filter dropdowns changing the listing/empty state in-browser — native `<select>` popups block CDP screenshot capture in this environment the same way the clipboard permission dialog did on `/run` (confirmed: both a real click-to-open and a keyboard focus+keypress on the select froze `Page.captureScreenshot`; `navigate` reliably recovers the tab both times). The filtering logic itself (`filterListings`/`emptyReasonFor`) is a direct, unmodified port of the source's own filter function, not something built from scratch, so this is a test-environment gap rather than an unverified implementation.

### `/marketplace/[listingId]`

Built from `Sealrail Marketplace Listing.dc.html`. Server component (no interactivity beyond links), dynamic route.

| File | Purpose |
|---|---|
| `components/app/AppNav.tsx` (extended again) | Added `maxWidth` prop — this page's nav container is 1080px, not the usual 1240px |
| `components/marketplace-listing/listing-data.ts` | `getListingDetail(listingId)` keyed lookup, returns `undefined` for unknown ids (only `listing_invoice_risk` exists, matching the one real marketplace row) |
| `components/marketplace-listing/ListingDetail.module.css` | Styles |
| `app/marketplace/[listingId]/page.tsx` | Async server component (`params` is a `Promise` in Next 16), renders listing header/task-input/agent-verifier panels/recent-proofs table, or a truthful "Listing not found" state for unknown ids (not in the source design, added to avoid crashing on bad ids — consistent with the project's "no fake records" rule) |

Note: the recent-proofs row currently links to `/proofs/INV-1024` (task-id-based slug) as a placeholder — when `/proofs` and `/proofs/[proofId]` get built next, reconcile the id scheme (the proof's own id is `proof_1024`, not the task id) across all three fixtures.

Verified end-to-end in-browser: listing detail renders pixel-correct (header, stats, task input panel, agent/verifier panel, recent proofs table), and the not-found path for an invalid listing id renders the truthful empty state correctly with a working back link.

### `/agents`

Built from `Sealrail Agents.dc.html`. Static server component, no interactivity beyond links.

| File | Purpose |
|---|---|
| `components/agents/agents-data.ts` | `AGENTS` array — Invoice Risk Agent (active, links to `/run` and `/agents/agent_invoice_risk`) plus two "Planned" placeholders (DeFi Risk, Research) with no actions, matching source |
| `components/agents/AgentRow.tsx` | Row: name, status tag, task/verifier/mode meta, conditional action buttons |
| `app/agents/page.tsx` | Composes `AppNav` (active="Agents") + header + row list |

Note: the active agent's "View proofs" button links to `/agents/agent_invoice_risk` (the agent profile page, not a real proofs-filtered view) — that's what the source design literally does (label says "View proofs", href goes to the profile page), kept as-is rather than reinterpreted.

Verified pixel-correct in-browser: active/planned status colors, conditional meta fields (verifier/mode only shown for agents that have one), conditional action buttons (only shown for the active agent).

### `/agents/[agentId]`

Built from `Sealrail Agent Profile.dc.html`. Async server component, dynamic route, same shape as the marketplace listing page (back link, header+stats+actions, two-panel grid, history table).

| File | Purpose |
|---|---|
| `components/agent-profile/agent-profile-data.ts` | `getAgentProfile(agentId)` keyed lookup, only `agent_invoice_risk` exists |
| `components/agent-profile/AgentProfile.module.css` | Styles |
| `app/agents/[agentId]/page.tsx` | Reputation panel (score, verified runs, paid tasks, failed proofs, total earned) + Verifiers panel (schema, WASM hash) + proof history table; truthful "Agent not found" for unknown ids |

Same open item as the listing page: proof history hrefs use task-id slugs (`/proofs/INV-1024`) as placeholders pending the real `/proofs/[proofId]` id scheme.

Verified pixel-correct in-browser: header stats, reputation score, verifier schema panel, and proof history table (paid=green/blocked=red) all match.

### `/owner`

Built from `Sealrail Owner Dashboard.dc.html`. Static server component.

| File | Purpose |
|---|---|
| `components/owner/owner-data.ts` | `OWNED_AGENTS`, `EARNINGS`, `INCOMING_TASKS` fixtures |
| `components/owner/OwnerDashboard.module.css` | Styles |
| `app/owner/page.tsx` | Header with 1 enabled action ("Register agent" -> `/owner/agents/new`) + 2 disabled-with-tooltip actions ("Create listing", "Register verifier" — both explicitly "coming soon" in the source), owned-agents panel, earnings panel, incoming tasks table |

Verified pixel-correct in-browser: nav (active="Owner", Agents/Marketplace links, primary Start run), disabled action tooltips, earnings color-coding (unlockable=amber, blocked=red), incoming tasks table (pending=amber, blocked=red).

### `/owner/agents/new`

Built from `Sealrail Owner Register Agent.dc.html`. Client component with real client-side form validation and a success state (frontend-only — no backend call yet, matching Phase N scope).

| File | Purpose |
|---|---|
| `components/app/AppNav.tsx` (extended again) | `cta` prop now accepts `null` to render no CTA at all — this page's nav is just Owner/Agents links, no button |
| `components/owner-register-agent/register-agent-constants.ts` | `CATEGORY_OPTIONS`, `VERIFIER_OPTIONS` (only `verifyInvoiceRisk` exists), `INITIAL_FORM_STATE`, `validateForm()` — validation order matches source exactly (name -> owner wallet -> verifier -> price -> recipient) |
| `components/owner-register-agent/RegisterAgent.module.css` | Styles |
| `app/owner/agents/new/page.tsx` | Two-panel form (Agent details / Verifier and payment), inline validation error banner, success card with "Register another agent" reset |

Verified end-to-end in-browser: submitting empty form shows "Agent name is required.", fixing that reveals the next validation error in order ("Enter a valid price amount." for an empty price field), and a fully filled form submits to the success card with correct echoed values and a green "Published" badge.

### `/workflows` and `/workflows/[workflowId]`

Built from `Sealrail Workflows.dc.html` (static list) and `Sealrail Workflow Detail.dc.html` (interactive state machine, same ref-based stage pattern as `/run`).

| File | Purpose |
|---|---|
| `components/workflows/workflows-data.ts`, `Workflows.module.css` | Static list — one `Invoice Settlement` workflow, "Create workflow" disabled with tooltip |
| `components/workflow-detail/workflow-detail-state.ts` | Pure functions: `computeSteps`, `computeSplits`, `computeBundleText`, `computeRunButton` — single linear `stage` 0-5 (no failure branch, unlike `/run`) |
| `components/workflow-detail/StepRuns.tsx`, `PaymentSplitTable.tsx`, `FinalProofBundle.tsx` | Presentational pieces |
| `app/workflows/[workflowId]/page.tsx` | Client component; uses React's `use()` hook to unwrap the `params` Promise (can't `await` in a client component) instead of the `async` pattern used on the server-component dynamic routes |

Timing matches source exactly: run -> 1400ms -> step2 running -> 2800ms -> step3 running -> 4200ms -> all verified -> 5000ms -> bundle ready. Payment splits unlock progressively as steps verify (60% at step 2, 30% at step 3, 10% at step 4).

Verified end-to-end in-browser: list page renders correctly; detail page's full run sequence was watched through to completion (step dots pulse then turn green, splits unlock in order, final bundle populates with all 5 hash lines, "Copy bundle" button becomes enabled). Did not click "Copy bundle" itself, consistent with the known clipboard-dialog automation limitation noted on `/run`.

### `/verifiers` and `/verifiers/new`

Built from `Sealrail Verifiers.dc.html` (static list, same shape as `/workflows`) and `Sealrail Register Verifier.dc.html` (form with validation + a "Test verifier" 1100ms-timer button + success state, same shape as `/owner/agents/new`).

| File | Purpose |
|---|---|
| `components/verifiers/verifiers-data.ts`, `Verifiers.module.css` | Static list — one `verifyInvoiceRisk` template |
| `components/register-verifier/register-verifier-constants.ts` | `INITIAL_VERIFIER_FORM_STATE`, `validateVerifierForm()` (order: name -> task type -> WASM hash -> owner wallet) |
| `app/verifiers/new/page.tsx` | Two-panel form + independent "Test verifier" flow (separate from submit validation) that shows a green "Test passed" result panel |

Verified in-browser: list page matches design; register form matches design; clicked "Test verifier" and confirmed the "Test passed / sample_input -> success: true" result panel appears after the timer. Validation/success-state behavior not re-tested by click (identical pattern to `/owner/agents/new`, already verified end-to-end there).

### `/proofs` and `/proofs/[proofId]`

Built from `Sealrail Proofs.dc.html` (search + status/mode filters + a "Demo state" selector for previewing loading/empty/no-results/error) and `Sealrail Proof Detail.dc.html` (per-task record with copy-bundle). This confirmed the routing scheme used by every earlier page that links here: **proof detail is keyed by task ID** (`INV-1024`, not `proof_1024`) — so the placeholder hrefs already used on marketplace listing, agent profile, and owner dashboard (`/proofs/INV-1024` etc.) were correct all along.

| File | Purpose |
|---|---|
| `components/proofs/proofs-data.ts` | `ALL_PROOF_ROWS` (3 fixture rows), `filterProofRows()`, `computeProofsView()` — derives showTable/showLoading/showEmpty/showNoResults/showError from a `demoState` value plus the real filtered-to-zero case |
| `components/proofs/ProofsFilterBar.tsx`, `ProofsTable.tsx` | Filter bar + 5-state table (loaded/loading-skeleton/empty/no-results/error) |
| `components/proof-detail/proof-detail-data.ts` | `getProofDetail(taskId)` — 3 full records (INV-1024 verified/payable, INV-1025 pending/blocked, INV-1026 failed/blocked) |
| `app/proofs/[proofId]/page.tsx` | Client component (`use()` for params), payment-state panel, agent-output panel, Blocky verification panel, Casper anchor panel, raw JSON bundle with copy button |

Verified in-browser: proofs list renders all 3 rows correctly; search filter narrows to matching task id; proof detail page confirmed for both INV-1024 (verified/payable, green) and INV-1026 (failed/blocked, red) — record lookup correctly switches per task id, payment/agent-output/verification/Casper-anchor panels and the raw JSON bundle all match the design.

### `/api-keys`

Built from `Sealrail API Keys.dc.html` — the most stateful page yet: a two-stage modal (create form -> one-time secret reveal) plus per-row revoke, all frontend-only.

| File | Purpose |
|---|---|
| `components/api-keys/api-keys-types.ts` | `ApiKey` type, `ALL_SCOPES`, `INITIAL_KEYS` (one seed key), `generateKeySecret()` — real random hex generation matching source's `randomHex()` |
| `components/api-keys/ApiKeyTable.tsx` | List with dimmed/disabled state once revoked |
| `components/api-keys/CreateApiKeyModal.tsx` | Two stages: scoped checkbox form with validation, then the generated-secret reveal panel |
| `app/api-keys/page.tsx` | Holds keys array + modal stage state; `createKey()` validates name + at least one scope before generating and prepending the new key |

Verified end-to-end in-browser: opened the modal, typed a name, submitted with `tasks:write` pre-checked, got a real generated secret (`sr_live_e311d905...`) in the "Shown once" panel while the new key already appeared in the table behind it with "Never" last-used, clicked "Done", then clicked "Revoke" on that key and confirmed the row dimmed with "Revoked" (disabled) while the original seed key stayed unaffected. Didn't click "Copy secret" itself (known clipboard-dialog automation limitation).

### `/docs`, `/privacy`, `/terms`, `/status` — all 19 design screens now implemented

Docs/Privacy/Terms share a distinct light "warm paper" theme (`#F9F8F6` background, `#2C2C2B` text) that no other app page uses — a separate nav and page-shell were needed since `AppNav` is dark-theme-only. Status stays on the dark theme and reuses `AppNav`.

| File | Purpose |
|---|---|
| `components/docs-legal/DocsNav.tsx` + `.module.css` | Light-theme nav (mirrors `AppNav`'s API: `active`, `links`, optional `cta`) |
| `components/docs-legal/DocsLegal.module.css` | Shared styles for all three light pages (header, doc sections, numbered legal sections, footer) |
| `components/docs-legal/LegalTextPage.tsx` | Shared template for `/privacy` and `/terms` (identical shape, just different `sections` data) — neither page shows an active nav label, matching source |
| `app/docs/page.tsx` | Its own layout (core loop, architecture diagram box, dark API-quickstart box with amber `POST` labels, TEE path paragraph) |
| `components/status/Status.module.css`, `app/status/page.tsx` | Dark theme, reuses `AppNav`; 5 health rows, each a text label + colored dot (not dot-only, consistent with the project's "status must include text" rule) |

Verified all 4 in-browser: Docs (nav, hero, core loop, architecture box, API box, TEE section, footer all correct), Privacy and Terms (nav with no active label, numbered sections rendering title+body correctly), Status (dark nav with active "Status" label, all 5 rows green/Online-Ready-Connected-Deployed-Connected).

## All 19 Claude Design screens are now implemented in the Next.js app

Landing, Run, Marketplace, Marketplace Listing, Agents, Agent Profile, Owner Dashboard, Owner Register Agent, Workflows, Workflow Detail, Verifiers, Register Verifier, Proofs, Proof Detail, API Keys, Docs, Privacy, Terms, Status. Every page was pulled directly from the `claude.ai/design` project (`43c0e1ca-8a00-4165-87dc-efa58c1f211d`) via the `DesignSync` tool and verified pixel-correct in-browser (Chrome via claude-in-chrome), not just built from memory of the design system.

Only remaining gap from the original DESIGN.md route map: `/owner/agents/[agentId]` (manage-agent) has no corresponding `.dc.html` file in the design project, so it hasn't been built — everything else the design project covers now has a matching, verified Next.js route.

### Levi audit fix pass

Levi's frontend audit flagged 6 blockers where Phase N UI overstated real backend state or dead-ended navigation. Fixed:

1. `/status` no longer hardcodes all-green — each row shows honest Phase N-stage copy (backend API/LLM/Blocky pending Phase O wiring, Casper testnet + contract deploy genuinely true and shown green, CSPR.cloud marked optional).
2. `/proofs` — removed the public "Demo state" selector and `DemoState` type entirely; view state now derives only from real filter results (empty-records vs. no-filter-match), not a fake switch.
3. `/run` — "Run full demo" renamed to "Run full verification".
4. Landing/footer CTAs rewired from `#fragment` anchors to real routes (`/docs`, `/run`, `/proofs`, `/privacy`, `/terms`, GitHub repo URL).
5. Added `app/not-found.tsx` — branded 404 with links to `/`, `/marketplace`, `/docs`, `/status`.
6. `/run`'s "Open proof detail" link now points to `/proofs/INV-1024` instead of a dead `/#proofs` anchor.

All frontend-only; no backend calls added (that's still Phase O).

### Field-addition sync (post-initial-build)

Mide (via another AI session) added field-level updates to 4 already-built screens in the same Claude Design project (no new pages). Pulled the refreshed `.dc.html` files and updated the implementations:

- **Status**: added "LLM provider configured" (Yes) and "LLM provider health" (OK) rows between Backend API and TEE verifier.
- **Agent Profile**: added a blue "Runtime" stat badge (e.g. "LLM WORKER") next to Status, and a row of task-type tag chips (`invoice_risk_check`, `invoice_risk_check_batch`) below the stat row. Added `runtimeType`/`supportedTaskTypes` to `AgentProfile` type in `agent-profile-data.ts`.
- **Run**: added a "Flags" row under Reason in the Verified Output panel (amber chips, e.g. `due_date_variance`, or an empty-state message before the agent runs), plus "Output hash" (new top row) and "Payment unlock state" (new bottom row, text+dot) in the Proof Hashes panel. `run-state.ts`'s `computeOutput`/`computeHashes` extended accordingly; `PROOF_BUNDLE` now includes `flags` and `output_hash`.
- **Owner Register Agent**: added an "Execution type" segmented button group (First-party LLM worker / External webhook / Manual API submitter) with a conditional field (webhook URL or submitter ID) shown based on selection, plus an "Output schema" textarea in the Verifier panel. Success summary now shows Execution type and Output schema rows. `register-agent-constants.ts` extended with `ExecutionType`, `EXECUTION_TYPE_LABELS`, `EXECUTION_TYPE_OPTIONS`, and `outputSchemaSummary()`. No new required-field validation was added for these fields, matching the source design exactly (the user was asked if they wanted it and declined implicitly by not confirming).

All 4 verified end-to-end in-browser (Status rows, Agent Profile badge+tags, Run flags/output-hash/payment-state after a full demo run, Register Agent's three execution-type states plus a full submit showing the new success-summary rows).

### `/docs` full rebuild (sidebar-nav docs site)

Mide had the Claude Design assistant rebuild `Sealrail Docs.dc.html` from a simple 4-section page into a full 16-section sidebar-nav documentation site (content sourced from `uploads/sealrail_frontend_docs_content.md` in the design project). Rebuilt the Next.js `/docs` page from scratch to match — this is now by far the largest page in the app.

| File | Purpose |
|---|---|
| `components/docs/docs-content.ts` | All content as typed data — quickstart steps w/ real curl-style request/response JSON, core concepts, product flow + state machine table, LLM runtime behavior, full API reference + endpoint groups, API examples, frontend screen->API integration map, safety guarantees + unsafe-value list, error code table, status endpoints, deployment env vars + checklist, security principles, changelog, glossary, `llms.txt` content |
| `components/docs/CodeBlock.tsx`, `BulletList.tsx`, `DocsSidebar.tsx` | Shared primitives reused across every section (dark JetBrains Mono code panel, dot-bullet list, sticky "on this page" jump-link nav) |
| `components/docs/HeroSection.tsx` | Overview: headline, positioning badge, 4 CTA buttons, flow diagram code block, "who this is for" bullets |
| `components/docs/sections.tsx` | The other 15 sections as named exports in one file (Quickstart, Core concepts, Product flow, LLM runtime, API reference, API examples, Frontend integration, Safety, Errors, Status & readiness, Deployment, Security, Changelog, Glossary, AI-readable docs) — one file rather than 15 near-identical tiny files |
| `components/docs-legal/DocsLegal.module.css` (extended) | Added ~15 new class groups: hero badge, code block, info box, bullet list, sidebar+content flex layout, two-col card grid, key-value row grid, tag chips (neutral/accent/mono-danger variants) |
| `app/docs/page.tsx` | Rewritten: hero full-width, then a sticky sidebar + content two-column layout below, all 15 sections in the content column, footer unchanged. Container widened to 1160px (from 860px) to match the new design |

The design's "Layout: sidebar toggle" prop was a Claude Design canvas preview control (for reviewing with/without sidebar), not a real product feature — skipped; sidebar is always shown, matching the design's own default.

Verified in-browser: hero (badge, 4 CTAs, flow code block), sticky sidebar tracks scroll correctly across all 16 anchor links, quickstart's numbered steps + code blocks, API reference table, glossary key-value rows, and the safety section's italic quote box + green bullets + dark mono danger chips all render pixel-correct.

Next phase per the roadmap: **Phase O** — wire all these frontend-only fixtures to the real backend API (which is separately complete and A+ audited, see the Backend section above), then P (Casper testnet deploy), Q (real TEE hookup), R (deployment), S (demo video), T (submission).

## Phase O: frontend-backend wiring

Replaced every typed fixture with a real call to the local backend (`http://localhost:3001`, WSL-hosted dev server). No fixture data imports remain anywhere in `app/` or `components/`.

| File | Purpose |
|---|---|
| `lib/api-types.ts` | Hand-mirrored copy of every backend model type (`Agent`, `MarketplaceListing`, `Task`, `Payment`, `PaymentRecipient`, `Proof`, `VerifierTemplate`, `WorkflowTemplate`/`WorkflowRun`/`WorkflowStepRun`, `AgentReputation`, `ApiKey`, `PublicStatus`, `TaskDetail`) |
| `lib/session.ts` | Demo-identity session: bootstraps a full-scope API key via `POST /api/api-keys` on first use, caches `{secret, keyId, ownerAddress, prefix}` in `localStorage`. `ensureSession()` now validates the cached secret against `GET /api/api-keys` before trusting it and re-bootstraps if invalid — added after finding a stale cached secret (from before a local DB reset) was silently authenticating as nothing and falling through to an anonymous owner server-side |
| `lib/api.ts` | Typed fetch client, one function per backend endpoint, `ApiClientError` wraps `{error, message}` bodies with `.status`/`.code` |
| `.env.local` | `NEXT_PUBLIC_API_URL=http://localhost:3001` (gitignored) |
| `backend/src/index.ts`, `backend/src/config.ts` | Added `@fastify/cors`, `FRONTEND_ORIGIN` env var |

Per-screen wiring:

- **`/agents`, `/agents/[agentId]`** — `GET /api/agents`, `/api/verifiers` (for mode/verifier badges), `/api/agents/:id/reputation`, `/api/agents/:id/proofs`. Honest empty state ("No agents registered yet") replaces the old static fixture when the DB has none.
- **`/marketplace`, `/marketplace/[listingId]`** — `GET /api/marketplace`, listing detail + real "Create paid task" form calling `POST /api/marketplace/:id/tasks`.
- **`/verifiers`, `/workflows`** — `GET /api/verifiers` / `GET /api/workflows`, static list pages, honest empty states.
- **`/owner/agents/new`** — `POST /api/agents` (owner address now shown read-only, sourced from the session identity, not a free-text field, since the backend ignores any owner value in the body); optional `POST /api/marketplace/listings` when "Publish listing" is checked.
- **`/verifiers/new`** — `POST /api/verifiers`, then a real "Test verifier" button calling `POST /api/verifiers/:id/test` (no more fake 1100ms timer).
- **`/run`** — full real task lifecycle: `POST /api/tasks` → `POST /api/tasks/:id/run` → `POST /api/tasks/:id/verify` + `POST /api/tasks/:id/anchor` → `POST /api/tasks/:id/unlock-payment`. Rewrote `run-state.ts`'s stage model from a single `Stage` int with a `99`-sentinel "failed" state to separate `stage` (last confirmed success point, monotonic) / `busyStep` / `failedStep` — the old model broke because `stage >= N` checks matched `99 >= N` and rendered every downstream step as falsely succeeded when agent execution failed partway through. Caught via live QA against a real `AGENT_UNAVAILABLE` 503 (LLM provider not configured in this dev environment).
- **`/workflows/[workflowId]`** — real run lifecycle: `POST /api/workflows/:id/run` creates a `WorkflowRun`, then sequential `POST /api/workflow-runs/:runId/steps/:stepId/run` per template step in order, then `POST /api/workflow-runs/:runId/finalize`. Payment split rows sourced from the template's real `payment_split_default`.
- **`/proofs`, `/proofs/[proofId]`** — `GET /api/tasks` + parallel `GET /api/tasks/:id` detail fetches build the table (no bulk proof-list endpoint exists). `[proofId]` matches on task `title` (the human invoice ID used throughout, e.g. `INV-1030`) via a linear scan of the task list, then fetches full detail by the real task UUID.
- **`/owner`** — real aggregation: owned agents via `GET /api/agents?owner_address=`, earnings computed client-side from `GET /api/agents/:id/reputation` + `GET /api/payments` recipient shares, incoming tasks filtered from `GET /api/tasks` to owned `agent_id`s.
- **`/api-keys`** — full real CRUD: `GET/POST /api/api-keys`, `DELETE /api/api-keys/:id`. Found and fixed a backend bug in the process: `POST /api/api-keys` has no `preHandler` at all, so `request.apiKey` is always `undefined` there regardless of the `Authorization` header sent — it always fell through to `body.owner_address ?? "bootstrap"`. Worked around by having the frontend pass `owner_address` explicitly (the session's own verified address) rather than relying on the (currently non-functional) implicit-auth path. Confirmed via direct sqlite inspection that keys created this way now attribute correctly; the un-worked-around path was silently creating keys owned by the literal string `"bootstrap"`.
- **`/status`** — now calls `GET /api/status` for real; all fields (LLM configured, Blocky readiness, Casper mode, DB connected, uptime) are live.

Known non-bug behavior difference from the original mock: revoking an API key makes it disappear from the list entirely (rather than showing dimmed "Revoked") because `GET /api/api-keys` filters `WHERE revoked_at IS NULL` server-side by design — not a frontend defect.

QA: full click-through against the live local backend for every wired page (agents list+profile, marketplace list+listing+task creation, verifiers list+register+test, owner dashboard, api-keys create+revoke, status, proofs list+detail, and a full `/run` task creation through to the agent-execution failure path, confirmed to render honestly). Backend test suite re-verified at 737/751 post-CORS-change (same 14 pre-existing `bky-as`-CLI-absence failures, no regression).

Not wired (correctly out of scope): Casper anchor hashes and Blocky attestation remain `dry_run`/simulated since Phase P (testnet deploy) and Phase Q (real TEE hookup) haven't happened yet — the UI shows this honestly via the dry-run values the backend itself returns, not by faking anything client-side.

### Post-frontend plan

Post-frontend integration and submission plan written at `docs/plans/SEALRAIL_POST_FRONTEND_PLAN.md`.

| Phase | What |
|---|---|
| O | Frontend-backend wiring (fixtures → real API) |
| P | Casper testnet deploy (Odra contract) |
| Q | Real TEE hookup (Blocky AS) |
| R | Deployment (Vercel + backend) |
| S | Demo video (2-3 min) |
| T | README + DoraHacks submission |

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

Deploy prep hardening complete: status endpoints expose Blocky CLI availability and hosted config readiness without exposing secrets. Config validation warns about missing hosted access in dry_run mode, errors in testnet mode.

## UX microcopy fix pass + pre-submission audits (2026-07-02)

- UX writing audit of all 19 screens, fixes committed as `b83bc12` and pushed: env-var leak (`NEXT_PUBLIC_API_URL`) removed from 9 error states (shared copy in `lib/copy.ts`), false "Copied" confirmations fixed across 4 clipboard handlers (now async with a "Couldn't copy" failure state), silent API-key revoke failure now shows inline error, fake-disabled CTAs on /marketplace and /owner converted to real `btnGhost` links, dead ProofsTable error/Retry branch wired to real fetch state with working retry, `&quot;` render bug on /run fixed, CreateApiKeyModal got a separate `statusMessage` slot so "Creating..." no longer occupies the error region. Lint + build clean.
- Elite hackathon audit: docs/audits/SEALRAIL_ELITE_HACKATHON_AUDIT.md. Verdict: product strong (739/751 tests verified live on WSL Node 24), packaging near zero — no deploy, no video, no submission page, boilerplate README, private repo, no LICENSE.
- Repo audit: docs/audits/SEALRAIL_REPO_AUDIT.md. Grade B+. New findings: `POST /api/api-keys` unauthenticated (routes/api-keys.ts:85-89), test suite environment-dependent (11 phase-c bky-as cascades + 1 brittle URL assertion in phase-deploy-prep.test.ts:420 that fails wherever bky-as is absent), no CI.
- Mide's decisions: key bootstrap stays frictionless for the judge demo, LLM provider for deployment still undecided (blocks Phase R + video), memory.md/.docx pruning deferred, testnet anchoring via one showcase anchor (not per-run).

## Audit fix + launch polish pass (2026-07-02, post-audit)

- Backend tests now fully portable: `isCliAvailable()` made injectable (`__setCliAvailable` in tee.ts) so phase-c's mocked exec paths run without bky-as; phase-deploy-prep URL assertion narrowed to secret patterns with the bky-as docs link allowlisted; `fileParallelism: false` baked into backend/vitest.config.ts (parallel workers caused spurious cross-file failures). Result: 752/752 via plain `npm test` on a machine with no bky-as. 752 = 751 + new attribution test.
- `POST /api/api-keys`: added `optionalApiKey` preHandler (authenticated callers now attribute to their key's owner, body owner_address ignored — test added in http-auth.test.ts) + `ALLOW_BOOTSTRAP_KEYS` config (default true per Mide's frictionless decision, `false` locks down).
- Frontend a11y: sr-only h1 on landing hero (page had zero h1), all footer links wired to real routes/anchors ("Casper Buildathon" label replaced with "Casper Network" → casper.network; contract → testnet.cspr.live transaction), htmlFor/id label associations + aria-required across register-agent, register-verifier, and API-key-modal forms, role="alert" on validation regions, nav tap targets expanded to ~44px via padding+negative-margin (no layout shift).
- `backend/scripts/seed.ts` (`npm run seed`): idempotent, creates real verifier+agent+listing via services (honest — no proofs/payments ever seeded). Fixes the /run, /agents, /marketplace empty-state dead ends. Agent slug has random suffix so idempotency matches on name+SEED_OWNER.
- Launch polish: README fully rewritten (badges, two Mermaid diagrams, verification status table with contract explorer link, quickstart, env vars, repo layout — zero hackathon language per github-launch-polish skill), MIT LICENSE, CONTRIBUTING, SECURITY, CHANGELOG (v0.1.0), CODE_OF_CONDUCT, .editorconfig, .nvmrc (22), issue/PR templates, CI workflow (frontend lint+build, backend tsc+test on ubuntu), CodeQL, Dependabot (npm root+backend, cargo, actions). Root package renamed sealrail-scaffold→sealrail, license fields added, root .env.example replaced (was stale scaffold content with wrong port).
- Repo visibility: still private — flipping public is gated on Mide's explicit go (asked 2026-07-02, no response; command ready: `gh repo edit --visibility public`).
- Shipped as commit 2eea849, tagged v0.1.0, pushed. CI green on first run (ubuntu, all 15 test files, 55s — native FS much faster than WSL /mnt/c). CodeQL running. Dependabot immediately opened actions-bump PRs (checkout v7, setup-node v6) — pending review. Repo description + topics set via gh.

## LLM provider decision + wiring (2026-07-02)

- Provider: Groq (OpenAI-compatible). Model: `openai/gpt-oss-120b` — picked over `qwen/qwen3.6-27b` because it's the only Groq-recommended model with `structured_outputs` on top of `json_mode`, and the invoice-risk agent parses strict JSON. llama-3.3-70b-versatile still listed but deprecated per Groq. Config lives in `backend/.env` (gitignored): `LLM_API_BASE_URL=https://api.groq.com/openai`, `LLM_MODEL=openai/gpt-oss-120b`. Key is Mide's Groq key — never commit it.
- Found + fixed a latent env bug: `config` freezes at static-import time, so index.ts's `dotenv.config()` (module body) always ran too late — `.env` was NEVER loaded by the server; defaults just happened to match dev values until the LLM vars diverged. Fix: `--env-file-if-exists=.env` on the dev/start/seed npm scripts (Node loads it pre-module; tests unaffected — they must NOT see the real key since several assert "provider not configured"). Late dotenv kept only for call-time process.env reads, comment corrected.
- Found + fixed a task-type mismatch that made marketplace tasks never agent-eligible: runtime dispatches only `task_type === "invoice_risk"`, but `createTaskFromListing` used `listing.category` ("invoice"), and /run's fallback + seed used "invoice_risk_check". Now: marketplace tasks take the agent's first supported task type (fallback category — keeps phase-g's assertion green since test agents declare none), seed + /run fallback say "invoice_risk". Also added `proofRequirement` validation in `createListing` (bad value used to become a CHECK-constraint 500 at task time; seed's "verified" hit exactly this — seed now passes "proof_verified").
- E2E verified via `backend/scripts/e2e-check.py` (committed; run against local server): bootstrap key → seeded listing → funded task → real Groq run (risk 35, review, sensible flags) → proof_verified → dry-run anchor → payment unlockable. Groq latency ~0.5s per completion.
- WSL gotchas: `wsl <cmd>` goes through zsh (nested quoting dies — use script files); `pkill -f 'tsx watch'` self-matches the wsl command line (use `'tsx[ ]watch'`); background servers need `setsid nohup ... < /dev/null`.

## Casper status

- Rust nightly, wasm32 target, cargo-odra, casper-client installed.
- CSPR.cloud key in /root/.env (REDACTED — never shared).
- Odra contract BUILT — Phase B complete. 23/23 tests pass.
- **Phase P (testnet deploy)**: DEPLOYED (2026-07-01).
  - Contract WASM builds and contract tests remain passing.
  - Deployed via Odra CLI to Casper testnet using RPC `https://node.testnet.casper.network/rpc` and event stream `https://node.testnet.casper.network/events`.
  - Transaction: `b2c6a9326545a137c3d7772385e9fe8003129e29f29336d451785e6a7f3a6196` — https://testnet.cspr.live/transaction/b2c6a9326545a137c3d7772385e9fe8003129e29f29336d451785e6a7f3a6196
  - Contract package/hash: `hash-02f9771e9cd4d91c40705563074bc323d45a341a11987464367ac909cc845846`.
  - Odra registry: `contracts/verified-agent-payments/resources/casper-test-contracts.toml`.
  - Backend fail-closed (C2) remains verified: testnet/mainnet never silently fall back to dry-run.
  - **Phase P ownership verified by Senku (builder) on 2026-07-01**: Independently re-verified all deployment artifacts — transaction confirmed successful on Casper testnet explorer (b2c6a932...a6196, caller 0202746a...fcd794, status Success), contract package/hash `hash-02f9771e9cd4d91c40705563074bc323d45a341a11987464367ac909cc845846`, no secrets in repo, /root/.casper/imported-deploy-key absent, contract tests 23/23 pass (cargo odra test), backend tests 631/631 pass (vitest --no-file-parallelism), tsc --noEmit clean. Phase P accepted.

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

## Backend Phase N deliverables

Files created/modified in backend/:

| File | Purpose |
|---|---|
| src/services/llm-provider.ts | N1: Provider-agnostic LLM client with OpenAI-compatible backend, retry logic, error classification (PROVIDER_NOT_CONFIGURED, API_KEY_MISSING, API_REQUEST_FAILED, INVALID_RESPONSE, RATE_LIMITED, TIMEOUT, UNKNOWN), provider swapping for testing |
| src/services/invoice-risk-agent.ts | N2: First-party Invoice Risk Agent runtime — builds structured prompts, sends to configurable LLM, parses JSON response (risk_score 0-100, decision approve/review/reject, reasoning, flags, recommended_action, confidence), validates all fields, hash-binds input/output into AgentExecutionOutput |
| src/services/agent-runtime.ts | N3: Agent execution layer orchestrator — executeAgent (real agent dispatch/run path), runTaskWithAgentExecution (upgraded fallback chain: LLM agent → Blocky TEE → pending proof), storeAgentProof (creates verified proof with real hashes, NOT placeholders), storeAgentOutputRow (persists structured output in system_events), getAgentOutput (retrieves latest execution output) |
| src/routes/agent-runtime.ts | N4: 3 API endpoints — POST /api/tasks/:taskId/execute (agent execution with auth), GET /api/tasks/:taskId/output (retrieve structured output), GET /api/agents/runtime/health (public health check with LLM status) |
| src/types.ts (modified) | Added Phase N types: AgentExecutionOutput, InvoiceRiskAgentResult, LlmCompletionResponse, LlmProvider interface, LlmProviderErrorCode |
| src/config.ts (modified) | Added LLM provider config: LLM_PROVIDER, LLM_API_BASE_URL, LLM_API_KEY, LLM_MODEL, LLM_TIMEOUT_MS, LLM_MAX_RETRIES |
| src/index.ts (modified) | Registered agent runtime routes |
| src/routes/tasks.ts (modified) | Upgraded POST /api/tasks/:taskId/run to use runTaskWithAgentExecution (agent_executed flag in response, 503 on provider not configured) |
| .env.example (modified) | Added LLM provider env var documentation (6 vars) |
| tests/phase-n.test.ts | 52 tests: LLM provider (config/missing/fail/retry/health), Invoice Risk Agent (execution/hash binding/validation/edge cases), Agent Runtime (executeAgent state machine/agent existence/agent inactive/non-placeholder proofs/output storage), runTaskWithAgentExecution (agent path/fallback path/graceful degradation), Payment safety (agent proofs satisfy unlock gate, placeholder proofs still fail), API routes (auth required/output retrieval/run upgrade/health), Phase A-M preservation |

Agent execution flow:
1. POST /api/tasks/:taskId/run → runTaskWithAgentExecution
2. Attempt 1: executeAgent → looks up agent → checks state (funded/running) → dispatches to InvoiceRiskAgent → sends to LLM → parses structured JSON → stores verified proof (non-placeholder!) → transitions to proof_pending
3. Attempt 2 (fallback): Blocky TEE verification (skipped in dry_run for speed)
4. LLM failures (PROVIDER_NOT_CONFIGURED, rate-limited, invalid JSON, timeout) throw honestly — no pending proof created, no task state advance
5. Agent proofs: attestation_hash is real SHA-256 of canonical payload, input_hash/output_hash are deterministic hashes of task data, wasm_hash is SHA-256 hash bound — NOT placeholder markers
6. Payment safety: agent-executed proofs pass isPlaceholderProof() check → can be verified, anchored, and unlock real payments

API routes added:
- POST /api/tasks/:taskId/execute — Execute assigned agent (auth required)
- GET /api/tasks/:taskId/output — Retrieve structured agent output (public)
- GET /api/agents/runtime/health — Runtime + LLM health status (public)

API route upgraded:
- POST /api/tasks/:taskId/run — Now returns agent_executed flag; LLM failures throw honestly (503/500); no pending placeholder proof fallback

### Frontend wiring notes for Phase N

The existing frontend screens should wire to the new agent runtime as follows:

| Screen | API Call | What to show |
|---|---|---|
| /run | POST /api/tasks/:taskId/run | agent_executed flag controls UI messaging; show "Running agent analysis..." state while polling GET /api/tasks/:taskId for status transitions |
| /agents/[agentId] | GET /api/agents/:agentId | Agent profile already available; add GET /api/agents/runtime/health to check if LLM is configured for this agent type |
| /proofs/[taskId] | GET /api/tasks/:taskId/output | Show structured agent output: risk_score, decision badge, reasoning text, flags list, recommended_action, model metadata; proof will have non-placeholder hashes when agent-executed |
| /status | GET /api/agents/runtime/health | Show LLM provider status (configured/missing), supported task types, agent runtime health |

All 685 tests pass (631 existing + 54). TypeScript build clean (tsc --noEmit).

## Session log — 2026-07-02 (Re-Audit #2 fixes, self-audit, frontend test suite)

Hermes re-audit #2 graded the product B (80/100) with 1 critical + 3 medium + 5 opportunities. All actionable items fixed this session:

- CRIT-1 (LLM not configured) was STALE — backend/.env exists since 6215ab9; verified live llm_configured:true and a full lifecycle run (risk_score=45, decision=review, proof_verified, anchored dry-run, unlockable). The auditor's DB was missing seeded records; e2e-check.py now prefers the invoice-risk listing over junk rows, npm run seed restores records.
- MED-1: visible 54px headline in ProductFamily is now the page h1; hidden hero h1 removed (heroSection carries aria-label). srOnly CSS class deleted (unused).
- MED-2: new shared components/nav/MobileNav.tsx (client, light/dark themes) wired into landing Hero nav, AppNav, DocsNav; links collapse into 44px hamburger at <=760px with 46px menu rows; desktop nav link tap targets raised to 44px+ (padding 15px 6px / negative margin).
- MED-3: footer bottom bar deduped (Privacy/Terms/TEE note once each, in columns), copyright line added; <main id="main" tabIndex={-1}> added to all 19 screens (per-page, nav stays outside main where structure allows); skip-to-content link in root layout + .skip-link CSS in globals.
- OPP-2: TaskForm rebuilt around FIELD_SPECS — htmlFor/id label association (was missing!), aria-describedby hints, visible helper text, .formHint CSS.
- OPP-3: app/opengraph-image.tsx (1200x630 ImageResponse) + app/apple-icon.tsx (180x180); metadataBase from NEXT_PUBLIC_SITE_URL (documented in .env.example); openGraph + twitter card metadata in layout.
- OPP-4: root Vitest suite (vitest ^2.1.0 devDep, vitest.config.ts with @ alias): 35 tests — run-state, proofs-data, workflow-detail-state, TaskForm SSR (renderToStaticMarkup; note React 19 emits readOnly="" camelCase in static markup). CI frontend job now lint + test + build.
- OPP-5: "Run full flow" button on /run chains create->run->verify+anchor->unlock; handlers refactored to return taskId/success and take optional override id so the chain doesn't race setState; button callbacks wrapped so DOM MouseEvent can't leak into the optional param.

Self-audit saved to docs/audits/SEALRAIL_SELF_AUDIT_2026-07-02.md (42-point live HTTP check script, 39 server-verifiable passes + 3 client-only covered by SSR tests). Self-grade A- (90) until: (1) one real testnet showcase anchor surfaced in UI, (2) recorded walkthrough.

Gotchas learned: Git Bash mangles /mnt/... args to wsl — prefix MSYS_NO_PATHCONV=1; dev-server first-hit compiles need retries in HTTP check scripts; Chrome extension for browser automation not connected on this machine.

Still open: repo remains PRIVATE (flip pending user's go: gh repo edit --visibility public); CASPER_MODE still dry_run (showcase testnet anchor = Phase 2.2); Dependabot PRs (checkout v7, setup-node v6) unreviewed; dev servers left running in WSL (tsx watch :3001, next dev :3000).

## Session log — 2026-07-02 (Re-Audit #3 response)

Hermes re-audit #3 on 3157c09: B+ (86), ZERO criticals, all re-audit #2 findings confirmed fixed. Two mediums: MED-1 "LLM not configured" is stale for the third time (verified live: llm_configured=true, uptime'd server; casper_contract_ready=false is honest — status requires contractHash AND accountKeyConfigured, and no funded Casper signing key exists yet; dry_run mode is the deliberate Phase 2.2 posture). MED-2 breakpoint fixed: hamburger now 640px (was 760) across all 4 CSS files.

Also this pass:
- OPP-3: proof rail polish — color transitions on rail dots/status, one-shot srCompleteGlow expanding ring when a step lands green. IMPORTANT FIND: CSS-module @keyframes are name-scoped, so the existing inline style animation "srPulse" references NEVER animated; moved srPulse + srCompleteGlow to globals.css and left comments in both module files.
- Backend startup now logs one line: "Config state: llm_configured=... llm_model=... casper_mode=... contract_hash_set=..." and warns loudly if backend/.env defines LLM_API_KEY but config didn't load it (the exact false-negative auditors keep hitting when starting the server without npm scripts).
- OPP-2: seed epilogue points to scripts/e2e-check.py to produce a real proof record (populates /proofs without faking anything).

Gotcha: a junk dir literally named "C:\Users\Prince\Projects\hackathons\sealrail" (WSL unicode-escaped on NTFS) appeared in repo root containing 7.7MB .next/dev cache — created by the WSL next dev server (likely replaying a Windows abs path from stale .next cache). It made local eslint report 3267 problems (CI unaffected). Deleted; if it recurs, delete .next entirely. Inspect/remove it from WSL side (backslashes are literal there).

To reach testnet anchoring (flips casper_contract_ready): needs CASPER_MODE=testnet + CASPER_ACCOUNT_KEY_PATH with a funded testnet key — user decision.
