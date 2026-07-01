# Sealrail Backend Second Re-Audit

Audit target: `/root/casper-tee-agent-payments`
Re-audited commit: `9941e78 Fix backend re-audit blockers`
Audit date: 2026-07-01
Scope: second-pass verification of the first re-audit blockers, all original C1-C3/H1-H5 findings, and required gate commands.

## Final Grade: B+

A/A+ target met: NO.

Verdict: NEEDS ONE MORE FIX PASS. Senku fixed the mainnet dry-run bug and fixed payment claim owner binding. But the explicit A+ gate still fails: a dry-run placeholder proof can still advance the task state to `proof_verified`, then be anchored as `anchored`, while the proof contains `attestation-hash-pending`, `wasm-hash-default`, and synthetic `input-*`/`output-*` hashes. The message says "dry_run simulated", and the proof row is not marked `verified` at the verify step, but the task-level state labels are still misleading. The kanban task specifically said: "If task status can still say proof_verified for placeholder proof, grade below A." That is exactly what the code and targeted run show.

## Executive Summary

1. `CASPER_MODE=mainnet` now fails closed. It returns `success:false`, `simulated:false`, empty `anchorHash`, and an actionable `CASPER_MAINNET_NOT_IMPLEMENTED` error. This blocker is fixed.
2. Payment claims now require the authenticated API key owner address to equal the recipient address. The three new HTTP auth tests cover wrong owner, correct owner, and correct submitted address with wrong owner. This blocker is fixed.
3. Placeholder proofs are no longer marked `verified` in the proof row during `verifyTaskProof()`. That part is improved.
4. The task state still says `proof_verified` for placeholder dry-run proofs. That fails the explicit A+ requirement.
5. Worse: `anchorTaskProof()` still accepts `pending` placeholder proofs as anchorable in dry-run and updates the proof row to `anchored` plus task status to `anchored`. A placeholder proof can therefore drive proof/anchor state labels without real attestation.
6. All required gates pass: backend tests, backend build, root lint, root build, backend lint.
7. Final grade remains B+, not A/A+, because the proof/payment truth boundary is still not clean at the state-machine label level.

## Verification Commands — Exact Outputs

### 1. Git state before report edits

Command:

```text
git status --short && git branch --show-current && git log --oneline -5
```

Observed output:

```text
master
9941e78 Fix backend re-audit blockers
d5daaae Backend re-audit report
312d3a4 Fix backend audit findings
8082388 Backend audit report
b7df591 Phase M: backend integration gates
[exit:0]
```

Interpretation: the first visible line is `master` because `git status --short` produced no output before report edits.

### 2. Targeted mainnet fail-closed check

Command:

```text
cd backend && npx tsx .reaudit2-mainnet.ts
```

Observed output:

```json
{
  "success": false,
  "anchorHash": "",
  "mode": "mainnet",
  "simulated": false,
  "error": "CASPER_MAINNET_NOT_IMPLEMENTED: Mainnet anchoring is not yet implemented. Use CASPER_MODE=testnet for real-chain testing or CASPER_MODE=dry_run for simulation."
}
[exit:0]
```

Interpretation: fixed. Mainnet no longer silently returns dry-run success.

### 3. Targeted placeholder proof/state-machine check

Command:

```text
cd backend && npx tsx .reaudit2-placeholder.ts
```

Observed output:

```json
{
  "run": {
    "taskId": "3ff37840-29fd-4a2f-bbcd-eb9f117783e6",
    "status": "proof_pending",
    "proofId": "e49931b8-87a3-4ed3-a222-abefedb77bb7",
    "message": "TEE verification initiated. Blocky CLI not available — proof is pending verification."
  },
  "before": [
    {
      "id": "e49931b8-87a3-4ed3-a222-abefedb77bb7",
      "status": "pending",
      "input_hash": "input-3ff37840-29fd-4a2f-bbcd-eb9f117783e6-2026-07-01T08:13:01.712Z",
      "output_hash": "output-3ff37840-29fd-4a2f-bbcd-eb9f117783e6-2026-07-01T08:13:01.712Z",
      "wasm_hash": "wasm-hash-default",
      "attestation_hash": "attestation-hash-pending",
      "casper_anchor_hash": null
    }
  ],
  "verify": {
    "taskId": "3ff37840-29fd-4a2f-bbcd-eb9f117783e6",
    "status": "proof_verified",
    "proofIds": [
      "e49931b8-87a3-4ed3-a222-abefedb77bb7"
    ],
    "message": "Task proofs verified. Ready for anchoring. (dry_run simulated — placeholder proofs were not marked verified)"
  },
  "afterVerifyTask": {
    "id": "3ff37840-29fd-4a2f-bbcd-eb9f117783e6",
    "status": "proof_verified"
  },
  "afterVerifyProofs": [
    {
      "id": "e49931b8-87a3-4ed3-a222-abefedb77bb7",
      "status": "pending",
      "input_hash": "input-3ff37840-29fd-4a2f-bbcd-eb9f117783e6-2026-07-01T08:13:01.712Z",
      "output_hash": "output-3ff37840-29fd-4a2f-bbcd-eb9f117783e6-2026-07-01T08:13:01.712Z",
      "wasm_hash": "wasm-hash-default",
      "attestation_hash": "attestation-hash-pending",
      "casper_anchor_hash": null
    }
  ],
  "anchor": {
    "taskId": "3ff37840-29fd-4a2f-bbcd-eb9f117783e6",
    "anchorHash": "5a72eb8d9fee5a819a3a1b5e82e24a3d4a7655db3a5e130c96f577782c119a35",
    "deployHash": "dry-run-5a72eb8d9fee5a81",
    "mode": "dry_run",
    "proofId": "e49931b8-87a3-4ed3-a222-abefedb77bb7"
  },
  "afterAnchorTask": {
    "id": "3ff37840-29fd-4a2f-bbcd-eb9f117783e6",
    "status": "anchored"
  },
  "afterAnchorProofs": [
    {
      "id": "e49931b8-87a3-4ed3-a222-abefedb77bb7",
      "status": "anchored",
      "input_hash": "input-3ff37840-29fd-4a2f-bbcd-eb9f117783e6-2026-07-01T08:13:01.712Z",
      "output_hash": "output-3ff37840-29fd-4a2f-bbcd-eb9f117783e6-2026-07-01T08:13:01.712Z",
      "wasm_hash": "wasm-hash-default",
      "attestation_hash": "attestation-hash-pending",
      "casper_anchor_hash": "5a72eb8d9fee5a819a3a1b5e82e24a3d4a7655db3a5e130c96f577782c119a35"
    }
  ]
}
[exit:0]
```

Interpretation: not fixed enough for A/A+. The proof row stays `pending` at verification time, which is good, but task status becomes `proof_verified` and later `anchored`; then the placeholder proof row becomes `anchored`. That is still a misleading state label path.

### 4. Backend tests

Command:

```text
cd backend && npm test -- --no-file-parallelism
```

Observed output excerpt:

```text
> sealrail-backend@0.1.0 test
> vitest run --no-file-parallelism

 RUN  v2.1.9 /root/casper-tee-agent-payments/backend

 ✓ tests/integration.test.ts (88 tests) 8845ms
 ✓ tests/phase-i.test.ts (44 tests) 162ms
 ✓ tests/phase-l.test.ts (65 tests) 257ms
 ✓ tests/phase-e.test.ts (75 tests) 10317ms
 ✓ tests/phase-h.test.ts (50 tests) 180ms
 ✓ tests/phase-k.test.ts (69 tests) 3491ms
 ✓ tests/phase-j.test.ts (41 tests) 146ms
 ✓ tests/phase-d.test.ts (43 tests) 18308ms
 ✓ tests/phase-f.test.ts (44 tests) 165ms
 ✓ tests/phase-g.test.ts (30 tests) 124ms
 ✓ tests/http-auth.test.ts (29 tests) 1317ms
 ✓ tests/phase-c.test.ts (30 tests) 168ms
 ✓ tests/phase-a.test.ts (20 tests) 17ms

 Test Files  13 passed (13)
      Tests  628 passed (628)
   Start at  08:13:17
   Duration  47.16s (transform 606ms, setup 0ms, collect 1.18s, tests 43.50s, environment 3ms, prepare 743ms)
[exit:0]
```

Important test signal:

```text
✓ Blocker 2: Placeholder Proof Verification Rejected > verifyTaskProof advances task to proof_verified in dry_run with placeholder note 2032ms
```

That test encodes the residual problem instead of preventing it.

### 5. Backend build

Command:

```text
cd backend && npm run build
```

Observed output:

```text
> sealrail-backend@0.1.0 build
> tsc --noEmit
[exit:0]
```

### 6. Root lint

Command:

```text
npm run lint
```

Observed output:

```text
> sealrail-scaffold@0.1.0 lint
> eslint
[exit:0]
```

### 7. Root build

Command:

```text
npm run build
```

Observed output:

```text
> sealrail-scaffold@0.1.0 build
> next build

▲ Next.js 16.2.9 (Turbopack)

  Creating an optimized production build ...
✓ Compiled successfully in 2.6s
  Running TypeScript ...
  Finished TypeScript in 4.3s ...
  Collecting page data using 3 workers ...
  Generating static pages using 3 workers (0/4) ...
  Generating static pages using 3 workers (1/4)
  Generating static pages using 3 workers (2/4)
  Generating static pages using 3 workers (3/4)
✓ Generating static pages using 3 workers (4/4) in 196ms
  Finalizing page optimization ...

Route (app)
┌ ○ /
└ ○ /_not-found

○  (Static)  prerendered as static content
[exit:0]
```

### 8. Backend lint

Command:

```text
cd backend && npm run lint
```

Observed output:

```text
> sealrail-backend@0.1.0 lint
> tsc --noEmit
[exit:0]
```

## Required Fix Verification Table

| Check | Result | Evidence | Judgment |
|---|---:|---|---|
| 1. `CASPER_MODE=mainnet` must not silently dry-run or simulate success | PASS | `backend/src/services/casper.ts:245-255`; targeted output returned `success:false`, `mode:"mainnet"`, `simulated:false`, `anchorHash:""` | Fixed. |
| 2. Placeholder/synthetic proofs must not become real verified proofs | FAIL at task/anchor state label level | `backend/src/services/tasks.ts:671-674` counts placeholders toward dry-run verification; `backend/src/services/tasks.ts:705-716` sets task status/result to `proof_verified`; `backend/src/services/tasks.ts:437-440` accepts `pending` proofs as anchorable; `backend/src/services/tasks.ts:470-478` marks proof/task anchored | The proof row no longer becomes `verified` at verify time, but placeholder proof still drives `proof_verified` and `anchored` states. Not A-grade. |
| 3. Payment claim must require authenticated API key owner address to equal recipient address | PASS | `backend/src/routes/payments.ts:291-304`; `backend/tests/http-auth.test.ts:371-523` | Fixed. Wrong owner gets `403 OWNER_MISMATCH`, correct owner can claim. |
| 4. Previous C1-C3/H1-H5 remain fixed | PARTIAL | C1/H2/H3/H5/H1 fixed; C2 fixed for mainnet/testnet; H4 fixed; C3 still partial due task/anchor labels | Remaining blocker is C3 semantics. |
| 5. Required gates pass | PASS | 628 backend tests, backend build, root lint, root build, backend lint all exit 0 | Build/test hygiene is clean. |

## Re-Audit Findings

### B2 still blocking — placeholder proofs can still produce `proof_verified` and `anchored` task labels

Severity: Critical for A/A+ target.

Where:
- `backend/src/services/tasks.ts:659-664` correctly detects placeholders: `attestation-hash-pending`, `attestation-hash-default`, `wasm-hash-default`, and synthetic `input-*`/`output-*` hashes.
- `backend/src/services/tasks.ts:666-674` still increments `verifiedCount` for placeholder proofs in dry-run.
- `backend/src/services/tasks.ts:705-716` then unconditionally transitions the task to `proof_verified` and returns `status: "proof_verified"`.
- `backend/src/services/tasks.ts:437-440` treats `pending` proofs as anchorable.
- `backend/src/services/tasks.ts:470-478` updates the proof anchor and task status to `anchored`, even when the anchor input is the placeholder proof.

Why it matters:
The product's core promise is proof-backed payment progression. A placeholder attestation must not be represented with real proof-state labels. The current message includes a dry-run note, but the machine-readable state still says `proof_verified` and later `anchored`. That is exactly the misleading state label the task instructed me to reject.

Evidence from targeted run:

```text
before proof.status = pending
before attestation_hash = attestation-hash-pending
before wasm_hash = wasm-hash-default
verify.status = proof_verified
afterVerifyTask.status = proof_verified
afterVerifyProofs[0].status = pending
anchor.mode = dry_run
afterAnchorTask.status = anchored
afterAnchorProofs[0].status = anchored
```

Required Senku patch plan:
1. In `verifyTaskProof()`, remove the dry-run `verifiedCount++` for placeholder proofs. Placeholder proofs must not satisfy the verified-count gate.
2. Return a non-verified task status for placeholders, e.g. keep task at `proof_pending`, or add explicit status labels such as `simulated_proof_pending` / `dry_run_proof_simulated`. Do not use `proof_verified` unless a real non-placeholder proof exists.
3. Change the return message and response status to match the actual state. A message note is not enough if `status` remains `proof_verified`.
4. In `anchorTaskProof()`, do not treat `pending` placeholder proofs as anchorable. The proof selector should require `status === "verified"` and pass the same non-placeholder predicate used in `verifyTaskProof()`.
5. If dry-run demo anchoring must exist, expose it as explicitly simulated state: `simulated_anchored` / `dry_run_anchor_simulated`, and prevent payment unlock from treating it as a real anchor.
6. Add regression tests that currently fail:
   - placeholder proof in dry-run remains `proof_pending`, not `proof_verified`;
   - placeholder proof cannot move task to `anchored` without explicit simulated state;
   - placeholder proof cannot unlock payment through the normal real-proof path;
   - `attestation-hash-pending`, `attestation-hash-default`, `wasm-hash-default`, `input-*`, and `output-*` are all rejected from real `proof_verified` and `anchored` states.

## Original Finding Status

| Original ID | Current status | Evidence | Judgment |
|---|---:|---|---|
| C1: mutation endpoints trust body identity | Fixed enough | Routes use `requireApiKeyWithScope`; owners are mostly pulled from `request.apiKey`; 29 HTTP auth tests pass | No longer blocker. Bootstrap API-key creation remains hackathon-only risk. |
| C2: Casper false success | Fixed | `testnet` fails closed; `mainnet` now fails closed; dry-run is the only simulated success mode | No longer blocker. |
| C3: placeholder task proofs | Partially fixed | Proof row is not marked `verified` on placeholder verify, but task becomes `proof_verified` and placeholder can become `anchored` | Still blocker. |
| H1: root lint gate fails | Fixed | `npm run lint` exit 0 | Fixed. |
| H2: API keys not enforced | Fixed enough | HTTP auth tests cover 401/403 and valid auth | Fixed for hackathon. |
| H3: weak live endpoint coverage | Fixed enough | `backend/tests/http-auth.test.ts` now has 29 app.inject tests; full suite 628 tests | Fixed enough. |
| H4: payment claim without address proof | Fixed | API key owner must match recipient address | Fixed. |
| H5: public status exposes internals | Fixed | `/api/status` sanitized; `/api/admin/status` requires auth | Fixed. |

## Strengths Confirmed

- Gate discipline is clean now: all five required commands pass.
- Mainnet no longer lies. That is a real correction from the first re-audit.
- Payment claim ownership is finally credential-bound instead of address-string-only.
- HTTP auth coverage improved from 26 to 29 tests and specifically targets payment ownership.
- Placeholder detection is centralized enough to reuse for the final fix.

## Grade Rationale

B+ is still the right grade.

Why it improved from the first re-audit:
- Mainnet fail-closed behavior is fixed.
- Payment claim owner matching is fixed.
- Proof rows are no longer marked `verified` during placeholder verification.
- Full gates pass with 628 tests.

Why it cannot be A:
- The task still returns and persists `proof_verified` for placeholder dry-run proofs.
- The same placeholder proof can be dry-run anchored and persisted as `anchored`.
- A+ requires no misleading state labels. The code still has misleading machine-readable labels.

A/A+ bar for the next re-audit:
- Placeholder/synthetic proofs never produce real `proof_verified`, `anchored`, `payable`, or `paid` state through the normal path.
- Any dry-run/demo progression uses explicit simulated status names or is impossible to confuse with real proof/anchor finality.
- Regression tests enforce those exact semantics.

## Final Verdict

Final grade: B+
Target met: NO
Blockers: 1 Critical — placeholder dry-run proof can still advance task to `proof_verified` and `anchored` labels.
