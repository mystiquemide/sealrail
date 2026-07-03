# SealRail Final UX Audit Report

Date: 2026-07-03
Site: https://sealrail.vercel.app
Backend: https://api-production-7409.up.railway.app
Repo: https://github.com/mystiquemide/sealrail

## Executive Summary

The final UX audit is complete. SealRail was tested live across four viewport classes: desktop, pad/tablet, wide screen, and mobile. The audit covered public routes, app routes, seeded dynamic detail routes, navigation menus, primary actions, scroll behavior, horizontal overflow, browser console errors, and live Railway backend status.

Result: **Passed**.

## Final Status

| Area | Result |
|---|---:|
| Live site reachable | Passed |
| GitHub CI | Passed |
| GitHub CodeQL | Passed |
| Frontend lint | Passed |
| Frontend tests | Passed, 36/36 |
| Production build | Passed, 22 app routes compiled |
| Railway backend reachable | Passed |
| Desktop UX audit | Passed |
| Pad/tablet UX audit | Passed |
| Wide-screen UX audit | Passed |
| Mobile UX audit | Passed |
| Route load failures | 0 |
| Horizontal overflow issues | 0 |
| Mobile menu issues | 0 |
| Browser console error routes | 0 |

## Viewports Tested

| Audit Type | Viewport |
|---|---|
| Desktop | 1440 x 1000 |
| Pad/tablet | 834 x 1112 |
| Wide screen | 1920 x 1080 |
| Mobile | 390 x 844 |

## Routes Audited

The final live audit covered 23 routes, including static pages, app pages, and seeded dynamic pages.

Core routes:

- `/`
- `/agents`
- `/api-keys`
- `/docs`
- `/judge`
- `/marketplace`
- `/owner`
- `/owner/agents/new`
- `/privacy`
- `/proofs`
- `/review`
- `/run`
- `/status`
- `/terms`
- `/verifiers`
- `/verifiers/new`
- `/workflows`

Seeded dynamic routes:

- agent detail routes from live API data
- marketplace listing detail routes from live API data
- proof detail routes using canonical proof IDs from live API data
- workflow detail routes from live API data

## Interaction Coverage

The audit clicked and/or validated:

- top navigation links
- mobile menu toggle
- mobile menu expanded state
- app navigation links
- primary CTA links
- proof detail links
- marketplace listing links
- seeded detail routes
- scroll behavior on each viewport
- page load status for all audited routes
- browser console errors during route visits
- document and element-level horizontal overflow

## Issues Found and Fixed

### 1. Mobile and tablet horizontal overflow

Affected areas:

- marketplace tables/cards
- proofs table
- API keys table
- verifiers table
- agent detail pages
- marketplace listing detail pages
- proof detail pages
- docs code blocks

Fix:

- added mobile stacking for grid/table layouts
- added `overflow-wrap: anywhere` for hashes, IDs, addresses, and schema strings
- changed docs code blocks to wrap safely on small screens
- ensured CTA/action cells do not clip on mobile

Commit:

- `7377d5e fix: tighten responsive UX layouts`

### 2. Proof detail console 404s

Problem:

The proofs table linked some proof pages by invoice title or task ID. The proof detail page recovered with fallback logic, but the browser first attempted `/api/proofs/:oldId`, producing caught 404s in the console.

Fix:

- proof rows now link to canonical proof IDs when proof records exist
- tests updated to lock the new behavior

Commit:

- `66553f0 fix: link proofs by canonical proof id`

## Verification Evidence

### GitHub / repo

Current branch:

- `master`

Final verified commit:

- `66553f0 fix: link proofs by canonical proof id`

GitHub checks:

- CI: success
- CodeQL: success

### Local verification commands

```bash
npm run lint
npm test
npm run build
```

Results:

- lint passed
- tests passed: 36 tests across 4 files
- build passed: 22 app routes compiled

### Live audit result

Final live audit command targeted:

```bash
AUDIT_BASE=https://sealrail.vercel.app node /tmp/ux-audit-fast.cjs
```

Final result summary:

| Viewport | Route failures | Overflow issues | Mobile menu issues | Console error routes |
|---|---:|---:|---:|---:|
| Desktop | 0 | 0 | 0 | 0 |
| Pad/tablet | 0 | 0 | 0 | 0 |
| Wide screen | 0 | 0 | 0 | 0 |
| Mobile | 0 | 0 | 0 | 0 |

## Railway Backend Status

Checked live endpoint:

```text
https://api-production-7409.up.railway.app/api/status
```

Observed production status:

| Field | Value |
|---|---|
| status | degraded |
| casper_mode | testnet |
| casper_contract_ready | true |
| llm_configured | true |
| db_connected | true |
| node_env | production |

Note: `status=degraded` is expected while hosted TEE / Blocky CLI pieces are not enabled. Casper testnet contract readiness, LLM config, and DB connectivity are live.

## Final Verdict

SealRail passed the requested UX audit across desktop, pad/tablet, wide screen, and mobile.

The live app at `https://sealrail.vercel.app` has no detected route failures, no horizontal overflow issues, no mobile menu failures, and no browser console error routes in the final audit pass.
