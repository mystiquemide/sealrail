# Sealrail Backend Final Re-Audit

Audit target: `/root/casper-tee-agent-payments`
Re-audited commit: `48f03a4 Fix placeholder proof state labels`
Audit date: 2026-07-01
Scope: final verification of the A/A+ backend blockers after the third pass fix, with targeted proof-state tests and all required gates.

## Final Grade: A

A/A+ target met: YES.

Verdict: TARGET MET. The backend now clears the A-grade bar because placeholder/synthetic proofs no longer advance the task into real `proof_verified`, `anchored`, or `payable` state, `CASPER_MODE=mainnet` fails closed, payment claim is bound to the authenticated API-key owner, mutation routes remain scoped, public/admin status behavior is clean, and every required gate passes.

This is not A+ because one semantic wart remains: in dry-run simulated anchoring, the placeholder proof row itself is still updated to `status = 'anchored'` for traceability, even while the API returns `mode: "dry_run_simulated"` and the task stays at `proof_pending`. That does not unlock payment and does not advance the task, so it is not a blocker under this final task's acceptance criteria, but it should be renamed later to a simulated proof-row status if the schema grows one.

## Executive Summary

1. Placeholder proof verification is fixed at task-state level. Dry-run placeholders return `dry_run_proof_simulated`; the task remains `proof_pending`; proof rows remain `pending` after verification.
2. Placeholder anchoring no longer advances the task to `anchored`; dry-run returns `mode: "dry_run_simulated"`; payment unlock rejects because the task is still `proof_pending`.
3. All five placeholder patterns are rejected outside dry-run: `attestation-hash-pending`, `attestation-hash-default`, `wasm-hash-default`, `input-*`, and `output-*`.
4. Mainnet anchoring fails closed with `success:false`, empty `anchorHash`, `mode:"mainnet"`, `simulated:false`, and `CASPER_MAINNET_NOT_IMPLEMENTED`.
5. Payment claim owner binding is fixed: route checks `request.apiKey.owner_address === recipient.address` and returns `OWNER_MISMATCH` otherwise.
6. Mutation routes remain protected with `requireApiKeyWithScope(...)`; `/api/status` is sanitized; `/api/admin/status` requires auth.
7. Required gates pass: backend tests, backend build, root lint, root build, backend lint.

## Required Fix Verification Table

| Check | Result | Evidence | Judgment |
|---|---:|---|---|
| 1. Placeholder/synthetic proofs must not advance task to real `proof_verified`, `anchored`, or unlockable state | PASS | `backend/src/services/tasks.ts:747-760`, `backend/src/services/tasks.ts:465-504`, `backend/src/services/tasks.ts:810-833`; targeted dry-run output keeps task `proof_pending` after verify and anchor, unlock rejects | Fixed for task/payment truth boundary. |
| 2. All relevant placeholder patterns rejected | PASS | `backend/src/services/tasks.ts:362-369`; strict targeted script rejects all five placeholder patterns with `PLACEHOLDER_PROOFS_REJECTED` / `NO_VERIFIED_PROOF` | Fixed. |
| 3. `CASPER_MODE=mainnet` must fail closed | PASS | `backend/src/services/casper.ts:245-255`; targeted output returns `success:false`, `simulated:false`, empty `anchorHash` | Fixed. |
| 4. Payment claim binds authenticated API-key owner to recipient | PASS | `backend/src/routes/payments.ts:291-305`; HTTP auth tests include wrong owner and correct owner cases | Fixed. |
| 5. Mutation routes remain auth/scoped | PASS | Route scan shows mutation routes use `requireApiKeyWithScope(...)`; `http-auth.test.ts` passes 29 tests | Fixed enough for hackathon backend. |
| 6. Status/admin health sanitized/protected | PASS | `backend/src/index.ts:73-94`; tests show `/api/admin/status` returns 401 without auth and 200 with auth | Fixed. |
| 7. Gates | PASS | 13 backend test files / 631 tests pass; all build/lint commands exit 0 | Clean. |

## Code Evidence

### Placeholder proof predicate

`backend/src/services/tasks.ts:362-369` treats all required placeholder forms as synthetic:

- `attestation-hash-default`
- `attestation-hash-pending`
- `wasm-hash-default`
- `input-*`
- `output-*`

### Verification no longer marks placeholders real

`backend/src/services/tasks.ts:747-760` returns `dry_run_proof_simulated` when dry-run has placeholder-only proofs. It does not call `updateTaskStatus(taskId, "proof_verified")` on that path. The task remains `proof_pending`.

### Anchor no longer advances task for placeholders

`backend/src/services/tasks.ts:465-504` detects placeholder-only proofs and returns `mode: "dry_run_simulated"` without transitioning the task to `anchored`.

### Unlock requires non-placeholder proof

`backend/src/services/tasks.ts:810-833` requires task status `anchored` and at least one non-placeholder `verified` or `anchored` proof before unlocking payment.

### Mainnet fail-closed

`backend/src/services/casper.ts:245-255` returns failure for mainnet instead of falling back to dry-run.

### Payment claim owner binding

`backend/src/routes/payments.ts:291-305` requires the authenticated API-key owner address to match the recipient address before allowing claim.

## Targeted Verification Outputs

### 1. Dry-run placeholder proof state test

Command:

```text
cd backend && npx tsx .final-reaudit-placeholder-dryrun.ts
```

Observed output excerpt:

```json
{
  "run": {
    "status": "proof_pending",
    "message": "TEE verification initiated. Blocky CLI not available - proof is pending verification."
  },
  "beforeProofs": [
    {
      "status": "pending",
      "input_hash": "input-fe226384-a006-44fc-9d3d-ede195ed6aaf-2026-07-01T08:58:32.326Z",
      "output_hash": "output-fe226384-a006-44fc-9d3d-ede195ed6aaf-2026-07-01T08:58:32.326Z",
      "wasm_hash": "wasm-hash-default",
      "attestation_hash": "attestation-hash-pending",
      "casper_anchor_hash": null
    }
  ],
  "verify": {
    "status": "dry_run_proof_simulated",
    "message": "Dry-run simulated: placeholder proofs remain pending (no real attestation data). Task is NOT proof_verified. Run TEE verification to produce real proofs."
  },
  "afterVerifyTask": {
    "status": "proof_pending"
  },
  "afterVerifyProofs": [
    {
      "status": "pending",
      "wasm_hash": "wasm-hash-default",
      "attestation_hash": "attestation-hash-pending",
      "casper_anchor_hash": null
    }
  ],
  "anchor": {
    "mode": "dry_run_simulated"
  },
  "afterAnchorTask": {
    "status": "proof_pending"
  },
  "unlockError": "INVALID_STATE: Task must be 'anchored' before unlocking payment. Current: 'proof_pending'. Verify proof and anchor first.",
  "paymentAfter": {
    "status": "intent_created",
    "recipients": []
  }
}
```

Interpretation: fixed at the task/payment state level. The task never becomes `proof_verified`, `anchored`, or `payable`; payment remains not unlockable.

Observed non-blocker from same output:

```json
"afterAnchorProofs": [
  {
    "status": "anchored",
    "wasm_hash": "wasm-hash-default",
    "attestation_hash": "attestation-hash-pending",
    "casper_anchor_hash": "1e0b7290d0944f0ca70d1c495e438d91cd077bcc755f0fa0453c756bdf58a0be"
  }
]
```

This proof-row label is still sloppy. It is not a blocker because the API mode is `dry_run_simulated`, the task is still `proof_pending`, and payment unlock rejects. It should still be cleaned up before production if schema changes are allowed.

### 2. Strict-mode placeholder pattern rejection

Command:

```text
cd backend && npx tsx .final-reaudit-placeholder-strict.ts
```

Observed output excerpt:

```json
{
  "patterns": [
    { "label": "attestation-hash-pending" },
    { "label": "attestation-hash-default" },
    { "label": "wasm-hash-default" },
    { "label": "input-*" },
    { "label": "output-*" }
  ],
  "verifyError": "PLACEHOLDER_PROOFS_REJECTED: Task has placeholder proofs that cannot be verified outside dry_run mode. Run TEE verification to produce real attestation data.",
  "taskAfterVerifyAttempt": {
    "status": "proof_pending"
  },
  "proofsAfterVerifyAttempt": [
    { "status": "pending", "attestation_hash": "attestation-hash-pending", "casper_anchor_hash": null },
    { "status": "pending", "attestation_hash": "attestation-hash-default", "casper_anchor_hash": null },
    { "status": "pending", "wasm_hash": "wasm-hash-default", "casper_anchor_hash": null },
    { "status": "pending", "input_hash": "input-placeholder-d", "casper_anchor_hash": null },
    { "status": "pending", "output_hash": "output-placeholder-e", "casper_anchor_hash": null }
  ],
  "anchorError": "NO_VERIFIED_PROOF: Task has proofs but none are non-placeholder, verified, or anchorable. Placeholder proofs cannot be anchored through the normal path."
}
```

Interpretation: fixed. Every mandated placeholder form is rejected from real verification and normal anchoring.

### 3. Mainnet fail-closed

Command:

```text
cd backend && npx tsx .final-reaudit-mainnet.ts
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
```

Interpretation: fixed. Mainnet no longer silently returns dry-run success.

## Required Gate Outputs

### Backend tests

Command:

```text
cd backend && npm test -- --no-file-parallelism
```

Observed output excerpt:

```text
> sealrail-backend@0.1.0 test
> vitest run --no-file-parallelism

 RUN  v2.1.9 /root/casper-tee-agent-payments/backend

 ✓ tests/integration.test.ts (88 tests) 8895ms
 ✓ tests/phase-i.test.ts (44 tests) 185ms
 ✓ tests/phase-l.test.ts (65 tests) 267ms
 ✓ tests/phase-e.test.ts (75 tests) 8354ms
 ✓ tests/phase-d.test.ts (46 tests) 14335ms
 ✓ tests/phase-h.test.ts (50 tests) 170ms
 ✓ tests/phase-k.test.ts (69 tests) 3459ms
 ✓ tests/phase-j.test.ts (41 tests) 150ms
 ✓ tests/phase-f.test.ts (44 tests) 156ms
 ✓ tests/phase-g.test.ts (30 tests) 121ms
 ✓ tests/http-auth.test.ts (29 tests) 1343ms
 ✓ tests/phase-c.test.ts (30 tests) 194ms
 ✓ tests/phase-a.test.ts (20 tests) 16ms

 Test Files  13 passed (13)
      Tests  631 passed (631)
   Duration  41.47s
```

Important regression tests observed:

```text
✓ Blocker 2: Placeholder Proof Verification Rejected > verifyTaskProof does NOT mark placeholder proofs as 'verified' in DB
✓ Blocker 2: Placeholder Proof Verification Rejected > verifyTaskProof returns simulated status in dry_run with placeholder proofs and does NOT advance task
✓ Blocker 2: Placeholder Proof Verification Rejected > verifyTaskProof rejects when all proofs are placeholders outside dry_run
✓ Blocker 2: Placeholder Proof Verification Rejected > verifyTaskProof throws NO_REAL_PROOFS when no non-placeholder proofs exist
```

### Backend build

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

### Root lint

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

### Root build

Command:

```text
npm run build
```

Observed output excerpt:

```text
> sealrail-scaffold@0.1.0 build
> next build

▲ Next.js 16.2.9 (Turbopack)

  Creating an optimized production build ...
✓ Compiled successfully in 2.6s
  Running TypeScript ...
  Finished TypeScript in 4.2s ...
  Collecting page data using 3 workers ...
✓ Generating static pages using 3 workers (4/4) in 174ms
  Finalizing page optimization ...

Route (app)
┌ ○ /
└ ○ /_not-found
[exit:0]
```

### Backend lint

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

## Original Finding Status

| Original ID | Final status | Evidence | Judgment |
|---|---:|---|---|
| C1: Mutation endpoints trust body identity | Fixed | Mutation routes use API-key middleware and owner from authenticated key | No longer blocker. |
| C2: Casper false success | Fixed | Mainnet/testnet fail closed; only explicit dry-run simulates | No longer blocker. |
| C3: placeholder task proofs | Fixed at task/payment boundary | Placeholder verification returns `dry_run_proof_simulated`; task remains `proof_pending`; unlock rejects | No longer blocker. |
| H1: root lint gate fails | Fixed | Root lint exits 0 | Fixed. |
| H2: API keys not enforced | Fixed enough | 29 HTTP auth tests pass | Fixed. |
| H3: weak live endpoint coverage | Fixed enough | 631 total tests, including integration and HTTP auth suite | Fixed. |
| H4: payment claim without address proof | Fixed | API key owner must match recipient address | Fixed. |
| H5: public status exposes internals | Fixed | `/api/status` sanitized, `/api/admin/status` auth-protected | Fixed. |

## Remaining Non-Blockers

1. Dry-run simulated anchor still writes `proofs.status = 'anchored'` on the placeholder proof row via `updateProofAnchor()`. It does not move task state, does not create unlockability, and API response says `mode: "dry_run_simulated"`, so it does not block A. But for production-grade semantics, add explicit proof statuses such as `simulated_anchored` or stop mutating placeholder proof rows during dry-run demo anchoring.
2. `POST /api/api-keys` remains bootstrap-capable. Acceptable for hackathon/demo, but production needs an admin setup flow.
3. Default dry-run remains a demo mode. That is fine because testnet/mainnet no longer falsely succeed.

## Grade Rationale

A is justified because all previous critical/high blockers are closed and the mandatory verification gates pass. The core product invariant now holds at task/payment state level: no placeholder proof can make a task genuinely verified, anchored, payable, or paid through the normal flow.

A+ is withheld because proof-row semantics are still imperfect in dry-run simulated anchoring. It is not dangerous in the current flow, but it is still an audit-trail cleanliness issue.

## Final Verdict

Final grade: A
Target met: YES
Blockers: 0
Remaining non-blockers: 3
