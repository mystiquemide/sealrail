# Sealrail Backend Re-Audit After Fixes

Audit target: `/root/casper-tee-agent-payments`
Re-audited commit: `312d3a4 Fix backend audit findings`
Audit date: 2026-07-01
Scope: confirmation of C1-C3 and H1-H5 from `docs/audits/SEALRAIL_BACKEND_AUDIT.md`, plus backend routes/services/tests/config/docs/repo hygiene.

## Final Grade: B+

A/A+ target met: NO.

The backend is materially better than the C+ audit baseline. The required gates now pass, mutation routes are mostly protected by API-key middleware, HTTP `app.inject()` coverage exists, public status is sanitized, and Casper `testnet` fails closed. But I am not giving an A while the core proof/payment truth boundary still has two hard gaps:

1. `CASPER_MODE=mainnet` silently falls back to dry-run simulated success.
2. The default dry-run task path still advances a placeholder proof (`attestation-hash-pending`) to `proof_verified`.
3. Payment claim now requires an address string and API key, but it still does not prove the claimant controls that address or that the API key principal is bound to the recipient.

Verdict: NEEDS FIXES before calling the backend A-grade. It is demo-improved, not trust-boundary sealed.

## Verification Commands — Exact Outputs

### 1. Git state

Command:

```text
git status --short
```

Observed output:

```text
[no output]
[exit:0]
```

Context command also run:

```text
git status --short && git branch --show-current && git log --oneline -5
```

Observed output:

```text
master
312d3a4 Fix backend audit findings
8082388 Backend audit report
b7df591 Phase M: backend integration gates
1f59459 memory.md: update Phase L commit hash and Phase K hash
c187325 Phase L: verifier template backend
```

### 2. Backend tests

Command:

```text
cd backend && npm test -- --no-file-parallelism
```

Observed output excerpt:

```text
> sealrail-backend@0.1.0 test
> vitest run --no-file-parallelism

 RUN  v2.1.9 /root/casper-tee-agent-payments/backend

 ✓ tests/integration.test.ts (88 tests) 8894ms
 ✓ tests/phase-i.test.ts (44 tests) 187ms
 ✓ tests/phase-l.test.ts (65 tests) 255ms
 ✓ tests/phase-e.test.ts (75 tests) 10323ms
 ✓ tests/phase-h.test.ts (50 tests) 166ms
 ✓ tests/phase-k.test.ts (69 tests) 3540ms
 ✓ tests/phase-j.test.ts (41 tests) 144ms
 ✓ tests/phase-f.test.ts (44 tests) 171ms
 ✓ tests/phase-g.test.ts (30 tests) 124ms
 ✓ tests/phase-d.test.ts (35 tests) 10175ms
 ✓ tests/phase-c.test.ts (30 tests) 181ms
 ✓ tests/http-auth.test.ts (26 tests) 834ms
 ✓ tests/phase-a.test.ts (20 tests) 20ms

 Test Files  13 passed (13)
      Tests  617 passed (617)
   Start at  07:50:36
   Duration  38.78s (transform 612ms, setup 0ms, collect 1.24s, tests 35.01s, environment 3ms, prepare 769ms)

[exit:0]
```

### 3. Backend build

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

### 4. Root lint

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

### 5. Backend lint

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

### 6. Targeted proof/status check

Command:

```text
cd backend && npx tsx --eval <targeted re-audit checks>
```

Observed output:

```json
{
  "run": {
    "taskId": "495e3bb3-3e75-4136-a029-1b48f5be1cb9",
    "status": "proof_pending",
    "proofId": "cbd79fd3-535b-4e33-a33e-ff45b551df4d",
    "message": "TEE verification initiated. Blocky CLI not available — proof is pending verification."
  },
  "before": {
    "status": "pending",
    "attestation_hash": "attestation-hash-pending"
  },
  "verify": {
    "taskId": "495e3bb3-3e75-4136-a029-1b48f5be1cb9",
    "status": "proof_verified",
    "proofIds": [
      "cbd79fd3-535b-4e33-a33e-ff45b551df4d"
    ],
    "message": "Task proofs verified. Ready for anchoring."
  },
  "verifyError": null,
  "after": {
    "status": "verified",
    "attestation_hash": "attestation-hash-pending"
  },
  "publicStatus": {
    "status": "ok",
    "db_connected": true,
    "timestamp": "2026-07-01T07:52:30.439Z"
  },
  "adminNoAuth": 401
}
[exit:0]
```

Interpretation: H5 is fixed for public/admin status. C3 is only partially fixed: a placeholder pending attestation still advances to `proof_verified` in the default dry-run path.

### 7. Casper testnet fail-closed check

Command:

```text
CASPER_MODE=testnet anchorProof targeted check
```

Observed output:

```json
{
  "success": false,
  "anchorHash": "",
  "mode": "testnet",
  "simulated": false,
  "error": "CASPER_DEPLOY_FAILED: CASPER_ACCOUNT_KEY_MISSING: No Casper account key configured. Set CASPER_ACCOUNT_KEY_PATH env var or switch to CASPER_MODE=dry_run."
}
[exit:0]
```

Interpretation: testnet now fails closed. That part of C2 is fixed.

### 8. Casper mainnet fail-closed check

Command:

```text
CASPER_MODE=mainnet anchorProof targeted check
```

Observed output:

```json
{
  "success": true,
  "anchorHash": "f78c8f80784e7719d3c3f8b1ba656e1e01c600065e99e858e9cad43e9efede33",
  "deployHash": "dry-run-f78c8f80784e7719",
  "mode": "dry_run",
  "simulated": true
}
[exit:0]
```

Interpretation: mainnet does not fail closed. It silently simulates success. This is an A-grade blocker.

## Fix Verification Table

| Original ID | Status | Evidence | Re-audit judgment |
|---|---:|---|---|
| C1: mutation endpoints trust body identity | Mostly fixed | `backend/src/routes/agents.ts:126-153`, `backend/src/routes/marketplace.ts:122-149`, `backend/src/routes/verifiers.ts:146-172`, `backend/src/routes/api-keys.ts:51-65`, `backend/src/routes/payments.ts:98-100`, `backend/tests/http-auth.test.ts:125-204` | API key auth is now wired to most mutation routes and owner is pulled from `request.apiKey` for owner-owned resources. Bootstrap key creation remains intentionally unauthenticated. |
| C2: Casper testnet/mainnet false success | Partially fixed | `backend/src/services/casper.ts:190-225` fails testnet closed; `backend/src/services/casper.ts:234-247` sends unknown/mainnet mode to dry-run | Testnet is fixed. Mainnet is still broken because `CASPER_MODE=mainnet` returns simulated dry-run success. |
| C3: placeholder task proofs | Partially fixed | `backend/src/services/tasks.ts:521-614` calls Blocky when CLI exists; `backend/src/services/tasks.ts:646-675` still permits dry-run placeholder proof verification; targeted check proved `attestation-hash-pending` advanced to `verified` | The Blocky adapter is attempted, but the default path still advances placeholder proofs. This fails the explicit re-audit requirement. |
| H1: root lint gate fails | Fixed | `npm run lint` exit 0; `backend/package.json:11-12`; `eslint.config.mjs:15-16` | Root and backend lint/build gates pass. Backend lint is `tsc --noEmit`; root ESLint intentionally ignores `backend/**`. |
| H2: API keys not enforced | Mostly fixed | `backend/src/middleware/auth.ts:54-119`; route preHandlers across agents/marketplace/tasks/payments/verifiers/workflows/proofs/API key admin | Mutation auth exists. Remaining concern: bootstrap key creation allows arbitrary owner creation with no setup gate. Acceptable for hackathon only if documented. |
| H3: weak live endpoint coverage | Fixed enough | `backend/tests/http-auth.test.ts:83-351`; 26 app.inject tests; full suite now 617 tests | HTTP boundary coverage exists for public status, missing auth, wrong scope, valid auth, admin status, and schema validation. Still not exhaustive across every endpoint, but no longer a high blocker. |
| H4: payment claim without address proof | Partially fixed | `backend/src/routes/payments.ts:73-80`, `backend/src/routes/payments.ts:253-313` | Claim requires `recipient_id`, `address`, and `payments:write` API key. It does not prove wallet control of `address` or bind the API key principal to the recipient address. |
| H5: public status exposes internals | Fixed | `backend/src/index.ts:73-94`; targeted app.inject check: public status excludes `node_env`/`casper_mode`, admin status returns 401 without auth | Public status is sanitized and detailed status is protected. Health routes are also sanitized in agents/verifiers/workflows and mostly sanitized in marketplace. |

## Remaining Blockers for Senku

### Blocker 1 — Mainnet silently dry-runs instead of failing closed

Severity: Critical.

Where:
- `backend/src/config.ts:32` accepts `"mainnet"` as a valid `casperMode`.
- `backend/src/services/casper.ts:234-247` only handles `dry_run` and `testnet`; every other value falls through to `createDryRunAnchor()`.

Proof:

```json
{
  "success": true,
  "mode": "dry_run",
  "simulated": true
}
```

Why it blocks A/A+:
The task explicitly required Casper testnet/mainnet to fail closed instead of simulating success. Mainnet does the opposite.

Patch plan:
1. Extend `AnchorResult.mode` to include `mainnet`, or define a shared `CasperMode` type.
2. Add `createMainnetAnchor()` or route `mainnet` through the same fail-closed deploy path with mainnet chain/RPC settings.
3. In `anchorProof()`, replace the default dry-run fallback with an explicit error for unsupported modes.
4. Add tests: `CASPER_MODE=mainnet` with no client/key must return `success:false`, `simulated:false`, empty hash, and an actionable error.

### Blocker 2 — Placeholder proof still advances to `proof_verified` in dry-run

Severity: Critical.

Where:
- `backend/src/services/tasks.ts:521-614` creates a pending proof with `attestation_hash = "attestation-hash-pending"` when Blocky CLI is unavailable.
- `backend/src/services/tasks.ts:646-675` allows that pending placeholder to become verified when `config.casperMode === "dry_run" && !process.env.BKY_AS_AVAILABLE`.

Proof:

```json
"before": { "status": "pending", "attestation_hash": "attestation-hash-pending" },
"verify": { "status": "proof_verified" },
"after": { "status": "verified", "attestation_hash": "attestation-hash-pending" }
```

Why it blocks A/A+:
The re-audit explicitly required: “task proof path uses Blocky/verification adapter and does not advance with placeholder proofs.” It currently advances with placeholder proofs in the default demo path.

Patch plan:
1. Split proof states: `pending_verification` is not equivalent to `verified`.
2. Do not let `verifyTaskProof()` mark `attestation-hash-pending`, `attestation-hash-default`, `wasm-hash-default`, or synthetic `input-*`/`output-*` as verified.
3. If dry-run must support demo progression, return `dry_run_verified` or `simulated_verified` explicitly and prevent it from being represented as real `proof_verified`.
4. Add a regression test that creates a placeholder proof and asserts `verifyTaskProof()` throws `NO_REAL_PROOFS` or returns a non-verified state.

### Blocker 3 — Payment claim requires address text, not address control

Severity: High.

Where:
- `backend/src/routes/payments.ts:73-80` requires `recipient_id` and `address`.
- `backend/src/routes/payments.ts:284-289` compares the submitted address string to the stored recipient address.
- `backend/src/routes/payments.ts:261-262` requires a `payments:write` key, but the handler does not prove the key owner controls the recipient address.

Why it blocks A/A+:
This is better than recipient ID alone, but it is not identity proof. Anyone with a broad payments key and visible recipient address can submit the matching address string.

Patch plan:
1. Bind recipient claims to `request.apiKey.owner_address` or require a wallet signature over `{payment_id, recipient_id, address, nonce}`.
2. Reject if authenticated owner/signer does not equal recipient address.
3. Add replay protection if wallet signatures are used.
4. Add app.inject tests for wrong key owner, matching address without ownership, missing signature, and replay.

## Non-blocking Remaining Issues

1. Root lint now passes by ignoring `backend/**` in root ESLint and using backend `tsc --noEmit` as backend lint. This is acceptable if intentional, but it means backend style lint is really typecheck only.
2. API key bootstrap remains unauthenticated. Acceptable for hackathon if clearly documented as bootstrap-only; not production-safe.
3. `backend/src/index.ts:8-23` imports `config` before `dotenv.config()` despite the comment claiming dotenv loads first. In many test/agent flows env is set before import, so this did not break current gates, but the comment is inaccurate and the load order should be cleaned.
4. List endpoints are still largely unbounded; this was medium in the original audit and remains outside the critical fix set.

## Strengths Confirmed

- Required gates pass: backend tests, backend build, root lint, backend lint.
- HTTP boundary testing is real now: `backend/tests/http-auth.test.ts` builds the app and uses `app.inject()`.
- Missing auth and wrong scopes are tested and enforced on core mutations.
- Public `/api/status` is sanitized; detailed `/api/admin/status` is protected.
- Casper `testnet` no longer returns simulated success on missing account key.
- Error responses on several route handlers now return generic 500 messages instead of raw internal messages.

## Grade Rationale

B+ is the honest grade.

What moved up from C+:
- All required verification gates pass.
- Auth middleware is actually wired into the route layer.
- HTTP integration tests exist.
- Public status leakage is fixed.
- Testnet false-success behavior is fixed.

Why it is not A:
- Mainnet still simulates success.
- Placeholder proofs still advance to verified in the default dry-run task flow.
- Payment claim still lacks real claimant identity proof.

A-grade bar:
- No simulated success in `testnet` or `mainnet`.
- No placeholder/synthetic proof can become `proof_verified` without explicit simulated labeling.
- Payment claims prove signer/API principal owns the recipient address.

## Senku Patch Checklist

Required before re-grade to A/A+:

- [ ] Fix `CASPER_MODE=mainnet` to fail closed or perform a real mainnet deploy path; never fallback to dry-run.
- [ ] Add regression tests for mainnet fail-closed behavior.
- [ ] Prevent `attestation-hash-pending` and other placeholder proof records from becoming `verified`.
- [ ] Add regression tests proving placeholder proof verification is rejected.
- [ ] Bind payment claim to authenticated owner or wallet signature, not just address string equality.
- [ ] Add app.inject tests for claim identity mismatch.

Once these are fixed and the same gates remain green, the backend can plausibly reach A/A+.
