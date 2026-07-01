# Sealrail Backend A+ Re-Audit

Audit target: `/root/casper-tee-agent-payments`
Re-audited commit: `108f06b Polish simulated proof row semantics`
Audit date: 2026-07-01
Scope: final A+ verification after proof-row polish, focused on placeholder proof truthfulness, Casper mode fail-closed behavior, payment claim ownership, auth boundaries, status sanitization, and all required gates.

## Final Grade: A+

Target met: YES.

Verdict: A+ APPROVED. The previous A-grade semantic wart is fixed: dry-run simulated placeholder proof rows remain `status='pending'` and keep `casper_anchor_hash = null`. Placeholder/synthetic proofs still cannot advance tasks to `proof_verified`, `anchored`, or `payable`; cannot unlock payment; and cannot masquerade as real Casper anchors. Mainnet fail-closed, API-key owner-bound payment claims, scoped mutation auth, and sanitized public/admin status behavior remain intact. All required test, lint, and build gates pass.

## Executive Summary

1. Placeholder proof rows now stay truthful after dry-run simulated anchoring: `status='pending'`, `casper_anchor_hash: null`, and only the API response carries the simulated anchor hash.
2. Placeholder verification remains blocked from real machine state. Dry-run returns `dry_run_proof_simulated`; the task stays `proof_pending`; proof rows remain `pending`.
3. Placeholder anchoring returns `mode: "dry_run_simulated"` but does not persist anchor data and does not transition task status.
4. Payment unlock remains gated by both task status `anchored` and at least one non-placeholder `verified`/`anchored` proof.
5. `CASPER_MODE=mainnet` still fails closed with `success:false`, empty `anchorHash`, `simulated:false`, and an actionable error.
6. Payment claim remains bound to the authenticated API-key owner, not just a body-provided address string.
7. Mutation routes remain scoped by API-key permissions; `/api/status` remains sanitized; `/api/admin/status` remains authenticated.
8. Backend tests pass: 13 files, 631 tests. Backend build, backend lint, root lint, and root build all exit cleanly.

## Required Fix Verification Table

| Mandatory check | Result | Evidence | Judgment |
|---|---:|---|---|
| 1. Placeholder/synthetic proof rows never become verified/anchored and never receive `casper_anchor_hash` in simulated dry-run path | PASS | `backend/src/services/tasks.ts:492-505`; runtime probe after anchor shows proof row `status: "pending"` and `casper_anchor_hash: null` | Fixed. This is the A+ delta. |
| 2. Placeholder/synthetic proofs never advance task to `proof_verified` / `anchored` / `payable` and never unlock payment | PASS | `backend/src/services/tasks.ts:748-761`, `backend/src/services/tasks.ts:465-505`, `backend/src/services/tasks.ts:811-835`; runtime probe keeps task `proof_pending`, payment `intent_created`, and unlock rejects | Fixed. No payment unlock path from placeholder evidence. |
| 3. `CASPER_MODE=mainnet` fail-closed still holds | PASS | `backend/src/services/casper.ts:245-255`; runtime probe returns `success:false`, empty anchor hash, `mode:"mainnet"`, `simulated:false` | Fixed. No dry-run fallback in mainnet. |
| 4. Payment claim owner binding still holds | PASS | `backend/src/routes/payments.ts:291-305`; `backend/tests/http-auth.test.ts:371-523` covers wrong owner and correct owner cases | Fixed. Address body spoofing is not enough. |
| 5. Mutation scoped auth still holds | PASS | `backend/src/routes/tasks.ts:78-82`, `backend/src/routes/tasks.ts:166-170`, `backend/src/routes/tasks.ts:206-210`, `backend/src/routes/tasks.ts:239-243`, `backend/src/routes/tasks.ts:272-276`, `backend/src/routes/tasks.ts:309-313`; `backend/src/routes/payments.ts:97-101`, `backend/src/routes/payments.ts:180-184`, `backend/src/routes/payments.ts:218-222`, `backend/src/routes/payments.ts:259-263` | Fixed for audited routes. |
| 6. Sanitized status/admin protected still holds | PASS | `backend/src/index.ts:73-94`; `backend/tests/http-auth.test.ts:296-314` | Public status is minimal; detailed status requires API key. |
| 7. Required gates pass | PASS | `npm test`, `npm run build`, `npm run lint` outputs captured below | Clean. |

## Code Evidence

### Placeholder detection covers the required synthetic forms

`backend/src/services/tasks.ts:362-369` marks a proof as placeholder when it has any of these forms:

- `attestation-hash-default`
- `attestation-hash-pending`
- `wasm-hash-default`
- `input-*`
- `output-*`

### Verification refuses to promote placeholders

`backend/src/services/tasks.ts:728-761` explicitly avoids updating placeholder `pending` rows to `verified`. When placeholder-only dry-run proof data exists, it returns `status: "dry_run_proof_simulated"` and does not call `updateTaskStatus(taskId, "proof_verified")`.

### Dry-run simulated anchoring no longer mutates placeholder proof rows

`backend/src/services/tasks.ts:492-505` is the important A+ fix. It returns the simulated dry-run anchor response but does not call `updateProofAnchor(...)`, does not set proof `status='anchored'`, does not persist `casper_anchor_hash`, and does not transition the task to `anchored`.

### Unlock still requires real proof state

`backend/src/services/tasks.ts:811-835` requires task status `anchored` plus at least one non-placeholder proof with `status === "verified" || status === "anchored"` before payment unlock can proceed.

### Mainnet remains fail-closed

`backend/src/services/casper.ts:245-255` returns failure for `mainnet` with `success:false`, empty anchor hash, `simulated:false`, and `CASPER_MAINNET_NOT_IMPLEMENTED`.

### Claim ownership remains bound to authenticated API key

`backend/src/routes/payments.ts:291-305` requires `request.apiKey.owner_address === recipient.address` before claim. A matching request-body address alone is rejected.

## Targeted Runtime Verification

### 1. Placeholder dry-run proof row stays pending and unanchored

Command:

```text
cd backend && npx tsx /tmp/sealrail-a-plus-placeholder-probe.ts
```

Observed output excerpt:

```json
{
  "run": {
    "status": "proof_pending",
    "proofId": "73636b7a-e17e-4cee-864b-d87263652450"
  },
  "beforeProofs": [
    {
      "status": "pending",
      "casper_anchor_hash": null,
      "wasm_hash": "wasm-hash-default",
      "attestation_hash": "attestation-hash-pending"
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
      "casper_anchor_hash": null,
      "wasm_hash": "wasm-hash-default",
      "attestation_hash": "attestation-hash-pending"
    }
  ],
  "anchor": {
    "mode": "dry_run_simulated",
    "anchorHashLength": 64
  },
  "afterAnchorTask": {
    "status": "proof_pending"
  },
  "afterAnchorProofs": [
    {
      "status": "pending",
      "casper_anchor_hash": null,
      "wasm_hash": "wasm-hash-default",
      "attestation_hash": "attestation-hash-pending"
    }
  ],
  "unlockError": "INVALID_STATE: Task must be 'anchored' before unlocking payment. Current: 'proof_pending'. Verify proof and anchor first.",
  "paymentAfter": {
    "status": "intent_created",
    "recipients": "[]"
  }
}
```

Interpretation: the A+ requirement is satisfied. The simulated response can return an anchor hash for demo display, but the durable proof row remains pending with no `casper_anchor_hash`; the task remains `proof_pending`; payment remains locked away from claim flow.

### 2. Mainnet fail-closed probe

Command:

```text
cd backend && npx tsx /tmp/sealrail-a-plus-mainnet-probe.ts
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

Interpretation: mainnet does not silently simulate success.

## Required Gate Outputs

### Backend tests

Command:

```text
cd backend && npm test -- --no-file-parallelism
```

Observed output excerpt:

```text
Test Files  13 passed (13)
Tests  631 passed (631)
```

### Backend build

Command:

```text
cd backend && npm run build
```

Observed output excerpt:

```text
> sealrail-backend@0.1.0 build
> tsc --noEmit
```

Exit code: 0.

### Root lint

Command:

```text
npm run lint
```

Observed output excerpt:

```text
> sealrail-scaffold@0.1.0 lint
> eslint
```

Exit code: 0.

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
✓ Compiled successfully in 2.9s
✓ Generating static pages using 3 workers (4/4) in 171ms
```

Exit code: 0.

### Backend lint

Command:

```text
cd backend && npm run lint
```

Observed output excerpt:

```text
> sealrail-backend@0.1.0 lint
> tsc --noEmit
```

Exit code: 0.

## Blockers

None.

## Non-Blockers / Residual Risk

1. `dry_run_simulated` is still represented as an API response label, not a schema-level proof status. That is acceptable because durable proof truth is now correct: rows remain `pending` and unanchored.
2. Mainnet anchoring is intentionally not implemented. That is not a blocker for this audit because the required behavior is fail-closed, not production mainnet support.

## Final Verdict

A+. Target met: YES. The backend now earns A+ for this audit scope. No blockers remain in the required checks.
