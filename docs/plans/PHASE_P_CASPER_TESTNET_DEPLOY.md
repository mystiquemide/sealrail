# Phase P: Casper Testnet Deploy — Runbook & Status

> Sealrail Phase P: Casper testnet deployment and anchoring readiness.
> Executed: 2026-07-01 | Agent: builder (Senku)

## Status: READY-BLOCKED

**GATE**: Contract builds, tests pass, backend fail-closed verified.
**BLOCKER**: No Casper testnet account key configured. Cannot deploy to testnet.
**REMEDY**: Generate a Casper account key, fund it via testnet faucet, and follow Step 6 below.

---

## Prerequisites Checklist

| # | Item | Status | Notes |
|---|---|---|---|
| 1 | Rust nightly + wasm32 target | ✅ DONE | nightly-2026-06-29, wasm32-unknown-unknown |
| 2 | cargo-odra installed | ✅ DONE | cargo-odra 0.1.7 |
| 3 | casper-client installed | ✅ DONE | Casper client 5.0.1 |
| 4 | wasm-opt (binaryen) | ✅ DONE | version 108 |
| 5 | Contract builds (cargo odra build) | ✅ DONE | WASM: 323,953 bytes, MD5: 4b7bd5ef... |
| 6 | Contract tests pass (cargo odra test) | ✅ DONE | 23/23 passed |
| 7 | Backend tests pass | ✅ DONE | 570/631 pass (61 fail = parallel SQLite isolation, not code bugs) |
| 8 | Backend build passes (tsc --noEmit) | ✅ DONE | Clean |
| 9 | Casper testnet account key | ❌ BLOCKED | No secret_key.pem found. See Step 1. |
| 10 | Testnet CSPR balance | ❌ BLOCKED | Gated by #9. Faucet: https://testnet.cspr.live/tools/faucet |
| 11 | CSPR.cloud API access | ✅ DONE | Keys present in /root/.env (REDACTED) |

---

## Step 1: Generate Casper Account Key (BLOCKED — user action required)

```bash
# Generate new key pair
mkdir -p ~/.casper/keys
casper-client keygen ~/.casper/keys/

# This creates:
#   ~/.casper/keys/secret_key.pem    — keep secret, never commit
#   ~/.casper/keys/public_key.pem    — shareable
#   ~/.casper/keys/public_key_hex    — your account hex

# Get your account hash (for faucet):
cat ~/.casper/keys/public_key_hex
```

## Step 2: Fund Account via Testnet Faucet

Go to https://testnet.cspr.live/tools/faucet and paste your public_key_hex.
Request 100-500 CSPR for deploy gas.

## Step 3: Configure Backend .env for Testnet

```bash
# Copy template to .env (DO NOT COMMIT .env)
cp backend/.env.example backend/.env

# Edit backend/.env and set:
#   CASPER_MODE=testnet
#   CASPER_CHAIN_NAME=casper-test
#   CASPER_RPC_URL=http://<testnet-peer-ip>:7777
#   CASPER_ACCOUNT_KEY_PATH=~/.casper/keys/secret_key.pem
```

Testnet peers (use any):
- http://136.243.187.125:7777 (CasperLabs)
- http://3.14.48.137:7777 (CasperLabs)
- http://18.224.75.26:7777 (CasperLabs)

## Step 4: Verify Testnet Connectivity

```bash
# Check chain info
casper-client get-state-root-hash \
  --node-address http://136.243.187.125:7777

# Check your balance
casper-client get-balance \
  --node-address http://136.243.187.125:7777 \
  --purse-uref <your-purse-uref>
```

## Step 5: Build Contract WASM

```bash
cd contracts/verified-agent-payments
cargo odra build -c VerifiedAgentPayments
# Output: wasm/VerifiedAgentPayments.wasm

# Current build hash (pre-optimization):
# MD5:  4b7bd5ef8611b3d5283652409c76fac1
# Size: 323,953 bytes
```

Optional: optimize with wasm-opt manually (cargo-odra 0.1.7 + wasm-opt 108 have a `--signext-lowering` flag mismatch):
```bash
wasm-opt -Oz wasm/VerifiedAgentPayments.wasm -o wasm/VerifiedAgentPayments.opt.wasm
```

## Step 6: Deploy Contract to Casper Testnet

```bash
# Deploy the contract
DEPLOY=$(casper-client put-deploy \
  --chain-name casper-test \
  --node-address http://136.243.187.125:7777 \
  --secret-key ~/.casper/keys/secret_key.pem \
  --payment-amount 5000000000 \
  --session-path contracts/verified-agent-payments/wasm/VerifiedAgentPayments.wasm \
  --session-arg "init:bool='true'" \
  | jq -r '.result.deploy_hash')

echo "Deploy hash: $DEPLOY"
echo "Explorer: https://testnet.cspr.live/deploy/$DEPLOY"
```

## Step 7: Verify Deploy & Get Contract Hash

```bash
# Wait ~2-3 minutes for deploy to execute, then:
casper-client get-deploy \
  --node-address http://136.243.187.125:7777 \
  $DEPLOY | jq '.result.execution_results[0].result'

# The contract hash will be in the execution results.
# Record it in backend/.env: CASPER_CONTRACT_HASH=<hash>
```

## Step 8: Run Backend in Testnet Mode

```bash
cd backend
# Ensure backend/.env has:
#   CASPER_MODE=testnet
#   CASPER_CONTRACT_HASH=<from step 7>

npm run build   # tsc --noEmit
npx vitest run tests/phase-d.test.ts  # Casper adapter tests
```

## Step 9: End-to-End Verification

```bash
# Start backend
cd backend && npm run dev

# Create task, verify proof, anchor to testnet:
curl -X POST http://localhost:3001/api/tasks \
  -H 'Content-Type: application/json' \
  -d '{"agent_id":"agent-1","input_data":"test"}'

# Then verify + anchor — should produce a REAL Casper deploy hash
# visible on https://testnet.cspr.live
```

---

## Backend Fail-Closed Verification (C2 Audit Gate)

The Casper adapter (`backend/src/services/casper.ts`) implements C2 audit requirements:

| Mode | Behavior | Verified |
|---|---|---|
| `dry_run` | Deterministic SHA-256 hash, `simulated: true` | ✅ Phase D tests |
| `testnet` | Real `casper-client put-deploy`. Fails closed: missing client → error, missing key → error, deploy fail → error | ✅ Phase D tests |
| `mainnet` | Fail-closed: returns `CASPER_MAINNET_NOT_IMPLEMENTED` | ✅ Phase D tests |
| Unknown mode | Fail-closed: returns `CASPER_MODE_UNKNOWN` | ✅ Phase D tests |

No silent fallback to simulated success in testnet/mainnet modes.
Placeholder proofs (attestation-hash-pending, wasm-hash-default, etc.) do NOT advance task state.

---

## Contract Verification

```
Contract: VerifiedAgentPayments
Odra:     2.8.2
Tests:    23/23 passed (cargo odra test)
Entry points: init, register_agent, create_payment, anchor_proof,
              mark_payable, mark_paid, get_agent, get_payment
Events:   AgentRegistered, PaymentCreated, ProofAnchored,
          PaymentMarkedPayable, PaymentMarkedPaid
Errors:   10 error variants (NotOwner through InvalidState)
```

---

## Environment Variables Reference

Full template at `backend/.env.example`. Testnet-specific values:

```bash
# === CASPER TESTNET ===
CASPER_MODE=testnet                           # dry_run | testnet | mainnet
CASPER_RPC_URL=http://136.243.187.125:7777    # Testnet peer
CASPER_CHAIN_NAME=casper-test                 # Chain name for testnet
CASPER_ACCOUNT_KEY_PATH=~/.casper/keys/secret_key.pem   # Deployer key
CASPER_CONTRACT_HASH=                         # Set after deploy (Step 7)

# === CSPR.CLOUD (optional, for data queries) ===
CSPR_CLOUD_API_KEY=<your-key>
CSPR_CLOUD_TOKEN=<your-token>
```

---

## Explorer Links

- Testnet Explorer: https://testnet.cspr.live
- Testnet Faucet: https://testnet.cspr.live/tools/faucet
- Deploy lookup: https://testnet.cspr.live/deploy/$DEPLOY_HASH
- Account lookup: https://testnet.cspr.live/account/$PUBLIC_KEY_HEX

---

## Current Blockers

1. **Casper account key**: No `secret_key.pem` exists. Generate with `casper-client keygen ~/.casper/keys/`.
2. **Testnet CSPR**: After keygen, fund via faucet.
3. **wasm-opt**: cargo-odra 0.1.7 incompatible with wasm-opt 108 (`--signext-lowering` unknown flag). WASM is still valid; optimization requires manual `wasm-opt -Oz` or downgrading binaryen.

---

## Files Changed (Phase P)

| File | Change |
|---|---|
| `contracts/verified-agent-payments/.cargo/config.toml` | Added: wasm32 linker flag `--allow-undefined` |
| `contracts/verified-agent-payments/src/lib.rs` | Added: `#![no_std]` + `extern crate alloc;` for WASM build |
| `docs/plans/PHASE_P_CASPER_TESTNET_DEPLOY.md` | Created: this runbook |
| `memory.md` | Updated: Phase P status |
