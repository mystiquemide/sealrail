# Sealrail Backend - Deployment Runbook

> Status: Pre-deployment prep - hosted Blocky TEE access pending.
> Last updated: 2026-07-01
> Phase: N+ (Deploy prep while Blocky access pending)

## Overview

This document covers deploying the Sealrail backend in three modes:

| Mode | Real TEE | Real Casper | Use case |
|---|---|---|---|
| `dry_run` | Simulated | Simulated | Local development, CI, demo |
| `testnet` | Blocky CLI | Casper testnet | Real-chain testing |
| `mainnet` | NOT IMPLEMENTED | NOT IMPLEMENTED | Fails closed |

## Prerequisites

### All modes

- **Node.js** 20+ (recommended: 22 LTS)
- **npm** 9+
- Git

### testnet mode (additional)

- **bky-as** CLI - Install from [blocky-as](https://github.com/blocky/blocky-as)
  ```bash
  # Check installation
  bky-as version
  ```
- **casper-client** - Install from [Casper docs](https://docs.casper.network/developers/prerequisites/)
  ```bash
  # Check installation
  casper-client --version
  ```
- **Casper account key** - Generate a key pair:
  ```bash
  casper-client keygen /path/to/keys
  # This creates: secret_key.pem, public_key.pem, public_key_hex
  ```
- **Contract deployed** - Deploy via Phase P (Odra):
  ```bash
  cd contracts/verified-agent-payments
  cargo odra build
  cargo odra deploy --network casper-test
  # Record the contract hash from the output
  ```
- **Blocky hosted access** (for real TEE verification) - Contact info@blocky.rocks.
  Currently **PENDING** - no response received yet.

## Quick Start (dry_run)

```bash
cd backend
cp .env.example .env
# Edit .env: ensure CASPER_MODE=dry_run, BLOCKY_MODE=tee_adapter
npm install
npm run dev
# Server starts on http://localhost:3001
```

## Configuration Reference

All config is read from environment variables (or `.env` via dotenv). See `.env.example` for the full list with descriptions and defaults.

### Key environment variables

| Variable | Required for | Default |
|---|---|---|
| `DATABASE_PATH` | All modes | `./data/sealrail.db` |
| `CASPER_MODE` | All modes | `dry_run` |
| `CASPER_RPC_URL` | testnet | `http://localhost:11101` |
| `CASPER_CHAIN_NAME` | testnet | `casper-net-1` |
| `CASPER_ACCOUNT_KEY_PATH` | testnet | *(empty)* |
| `CASPER_CONTRACT_HASH` | testnet | *(empty)* |
| `BLOCKY_AS_API_KEY` | testnet (real TEE) | *(empty)* |
| `BLOCKY_AS_HOST` | testnet (real TEE) | *(empty)* |
| `LLM_API_BASE_URL` | Agent execution | *(empty)* |
| `LLM_API_KEY` | Agent execution | *(empty)* |
| `LLM_PROVIDER` | Agent execution | `openai_compatible` |

## Startup Validation

On startup, the backend runs a config validation pass and logs the results:

```
Config validation:
  [WARN] bky-as CLI: bky-as CLI is not installed...
  [WARN] BLOCKY_AS_HOST: Hosted Blocky access is not configured...
```

Errors (marked `[ERROR]`) block the readiness endpoint (returns 503). Warnings (`[WARN]`) are advisory - the server starts but specific features are unavailable.

## Health & Status Endpoints

| Endpoint | Auth | Purpose |
|---|---|---|
| `GET /api/health` | None | Basic liveness: status, mode, uptime, Blocky CLI presence |
| `GET /api/status` | None | Public status: all subsystem readiness without secrets |
| `GET /api/status/detailed` | None | Same as /api/status (public-safe) |
| `GET /api/admin/status` | API Key | Full status: all subsystem details, blockers, warnings |
| `GET /api/admin/readiness` | API Key | Deployment readiness: returns 503 if any errors exist |

### Example: Admin Status

```bash
curl -H "x-api-key: YOUR_KEY" http://localhost:3001/api/admin/status
```

Response includes:
- `status`: `ok` | `degraded` | `not_ready`
- `readiness.blocky`: CLI availability, hosted config (presence only, no secrets)
- `readiness.casper`: mode, client, RPC, account key, contract hash
- `readiness.llm`: provider, configured status, model (no keys/URLs)
- `readiness.database`: connected, path, table count
- `readiness.blockers`: list of blocking issues
- `readiness.warnings`: list of non-blocking issues
- `readiness.phaseNGuarantees`: Phase N A+ guarantee status

## Blocky TEE Access Status

**Current state: PENDING.** Hosted Blocky API key was requested from info@blocky.rocks - no response yet.

Until hosted access is available:
- **dry_run mode**: Works fully. TEE verification is simulated with deterministic hashes.
- **testnet mode**: Can anchor proofs on Casper testnet, but TEE verification uses local CLI only. Real hosted TEE attestation is unavailable.
- **mainnet mode**: Fails closed. NOT IMPLEMENTED.

What happens when hosted Blocky access arrives:
1. Set `BLOCKY_AS_API_KEY` and `BLOCKY_AS_HOST` in `.env`
2. Set `BLOCKY_MODE=tee_adapter` (or hosted_tee when supported)
3. Restart the backend - config validation will show Blocky as ready
4. Real TEE attestation+verification flow activates for non-dry_run modes

## Phase N Guarantees

The backend maintains these A+ guarantees from Phase N:

1. **No fake LLM success**: LLM failures throw honestly (503/500) - no silent fallback.
2. **No pending proof fallback**: Eligible agent tasks that fail do NOT create placeholder proofs.
3. **No payment unlock without verified proof**: Placeholder proofs (`isPlaceholderProof()`) can NEVER advance task/payment state.
4. **Agent runtime available**: `GET /api/agents/runtime/health` reports runtime status and supported task types.

Verify guarantees are intact by running: `cd backend && npm test -- --no-file-parallelism`

## Deployment Targets

### Vercel (Next.js frontend)

The frontend (`/` root of repo) deploys to Vercel. The backend runs separately (not on Vercel - Fastify + SQLite is stateful).

### Railway / VPS (Backend)

Recommended for the backend:
```bash
# Railway example
railway up --service sealrail-backend
railway variables set \
  CASPER_MODE=testnet \
  CASPER_RPC_URL=https://node.testnet.casper.network/rpc \
  CASPER_CHAIN_NAME=casper-test \
  CASPER_ACCOUNT_KEY_PATH=/app/keys/secret_key.pem \
  CASPER_CONTRACT_HASH=hash-02f9771e9cd4d91c40705563074bc323d45a341a11987464367ac909cc845846 \
  BLOCKY_AS_API_KEY=<when available> \
  BLOCKY_AS_HOST=<when available> \
  LLM_API_BASE_URL=<your provider> \
  LLM_API_KEY=<your key>
```

## Build Verification

```bash
cd backend
npm run lint        # TypeScript type-check (tsc --noEmit)
npm run build       # Same as lint (types only - no emit)
npm test -- --no-file-parallelism  # Full test suite
```

## Remaining Access Needed for Phase Q (Real TEE Hookup)

- **Blocky hosted API key** - Pending from info@blocky.rocks
- **Blocky hosted API endpoint** - Will be provided with the API key

Once these arrive, Phase Q can proceed: real TEE attestation with hosted Blocky enclave verification.

## Recommended Next Phase

After this deploy prep:
1. **Phase Q**: Real TEE hookup when Blocky access arrives
2. **Phase R**: Production deployment (Vercel + Railway/VPS)
3. **Phase S**: Product walkthrough video (2-3 min)
4. **Phase T**: README and public launch assets
