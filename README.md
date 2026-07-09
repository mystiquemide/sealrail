# Sealrail

**The payment rail for AI-agent work. No Proof without a Payment.**

[![CI](https://github.com/mystiquemide/sealrail/actions/workflows/ci.yml/badge.svg)](https://github.com/mystiquemide/sealrail/actions/workflows/ci.yml)
[![CodeQL](https://github.com/mystiquemide/sealrail/actions/workflows/codeql.yml/badge.svg)](https://github.com/mystiquemide/sealrail/actions/workflows/codeql.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-black.svg)](LICENSE)
[![Casper Testnet](https://img.shields.io/badge/Casper-Testnet%20Anchoring%20Live-red)](https://testnet.cspr.live/deploy/5a4de9673224b4c9c597060e55911675b31e575d36fc1f3ffddad569337ff8fe)
[![Backend Tests](https://img.shields.io/badge/backend%20tests-766%20passing-brightgreen)](backend/tests)
[![Railway](https://img.shields.io/badge/deployed-Railway-%230B0D0E)](https://api.sealrail.xyz/api/status)

**Live:** [sealrail.xyz](https://sealrail.xyz) &nbsp;·&nbsp; **API:** [api.sealrail.xyz](https://api.sealrail.xyz/api/status)

AI agents produce output nobody verifies, then get paid anyway. Sealrail inverts that: an agent's payment stays locked until its output passes an independent verifier, and the resulting proof is anchored on Casper. Agents don't get paid for output. They get paid for **proven** output.

![The Sealkeeper carrying a sealed ledger tag along the payment rail](public/hero-sealkeeper.jpg)

## Product screens

| Home | Run flow |
|---|---|
| ![Sealrail homepage hero](public/screenshots/01-homepage.png) | ![Sealrail verification run flow](public/screenshots/02-run-flow.png) |

| Marketplace | Reviewer quickstart |
|---|---|
| ![Sealrail agent marketplace](public/screenshots/03-marketplace.png) | ![Sealrail reviewer quickstart page](public/screenshots/04-reviewer-quickstart.png) |

| Status | Proof detail |
|---|---|
| ![Sealrail status dashboard](public/screenshots/05-status.png) | ![Sealrail proof detail with x402-compatible receipt](public/screenshots/06-proof-detail.png) |

## How it works

Every task follows one rule, enforced by the backend state machine and covered by tests: no payment unlocks without a verified proof. Placeholder or simulated proofs can never advance a task, and that guarantee is itself under test.

```mermaid
flowchart LR
  Buyer([Buyer]) -->|fund task| API[Sealrail API]
  API -->|dispatch| Agent[Agent runtime<br/>LLM worker]
  Agent -->|hash-bound output| Verifier[Verifier<br/>schema + WASM hash]
  Verifier -->|verified proof| Casper[(Casper<br/>ProofRegistry)]
  Casper -->|anchored| Payment[Payment unlock]
  Verifier -.->|failed proof| Blocked[Payment stays blocked]
```

```mermaid
sequenceDiagram
  participant B as Buyer
  participant S as Sealrail API
  participant A as Agent (LLM)
  participant V as Verifier
  participant C as Casper

  B->>S: POST /api/tasks (funds payment intent)
  S->>A: POST /api/tasks/:id/run
  A-->>S: structured output, input/output hashes
  S->>V: verify against schema + WASM hash
  V-->>S: proof verified (or failed)
  S->>C: anchor proof hash
  C-->>S: anchor transaction
  B->>S: POST /api/tasks/:id/unlock-payment
  S-->>B: payment payable (only if proof verified)
```

## What's in the box

- **Proof-gated payments** — tasks fund a payment that unlocks only after proof verification, with per-recipient splits and claim ownership checks
- **First-party agent runtime** — the Invoice Risk Agent sends structured prompts to a configurable LLM and returns hash-bound, schema-validated output (risk score, decision, reasoning, flags)
- **RWA Compliance Agent** — a second seeded marketplace agent for real-world asset review, compliance checks, document risk, and finance operations use cases
- **Verifier registry** — templates bound to a WASM artifact hash, with input/output schemas and a test endpoint
- **Marketplace** — list live agents, inspect listing details, and create paid tasks against seeded marketplace listings
- **Proof detail pages** — `/proofs/:proofId` resolves live proof data, including verification result, task context, hashes, Casper anchor state, and payment state
- **x402-compatible receipts** — proof bundles include a payment-required receipt shape with `402`, proof requirement, unlock condition, network, and payment state metadata
- **Casper/CSPR proof metadata** — proof screens and status surfaces show anchor status, CSPR.cloud-backed deploy confirmation, explorer links, and real-time CSPR/USD rate
- **Casper Wallet sign-in** — users connect Casper Wallet, sign a nonce-carrying challenge, and receive a wallet-scoped API key for owner-sensitive actions
- **MCP server** — real `@modelcontextprotocol/sdk` stdio server with 5 tools (status, manifest, proof listing, proof detail, payment-backed task creation), callable by any MCP-compatible agent
- **CSPR.cloud integration** — deploy confirmation, CSPR/USD rate lookup, x402 facilitator status, and Casper node health all exposed via dedicated API endpoints
- **Reviewer quickstart** — `/review` gives evaluators a direct path to the live app, API status, run flow, marketplace, proof detail, product fit, and caveats
- **Workflows** — multi-step runs with ordered execution and progressive payment splits
- **Reputation** — scores computed from real proof and payment history, never hand-set
- **Casper contract** — Odra-based ProofRegistry deployed to testnet: agent registry, proof anchoring, payment state transitions
- **Product screenshots** — README includes current screens for the homepage, run flow, marketplace, reviewer quickstart, status, and proof detail
- **19-screen web app** — the full loop in a browser, with honest empty, loading, and error states throughout

## Latest product upgrades

| Upgrade | Why it matters |
|---|---|
| **Railway deployment** | Backend runs on Railway with automatic deploys from GitHub, persistent volume storage, and health monitoring — no more manual VPS restarts |
| **CSPR.cloud integration** | Real-time Casper data: deploy confirmation, CSPR/USD rate ($0.002062 at time of writing), x402 facilitator status, and node health — all live at `/api/integrations/cspr-cloud/*` |
| **Casper Wallet integration** | Connect Casper Wallet, sign a nonce-carrying challenge, and bind Sealrail sessions/API keys to a wallet-controlled Casper public key |
| **MCP server (real SDK)** | `@modelcontextprotocol/sdk` stdio server with 5 callable tools — any MCP client can read Sealrail status, inspect proofs, and create payment-backed tasks |
| `/review` quickstart | Gives evaluators one page with live links, expected flow, ecosystem fit, and known trust boundaries |
| Real proof detail routing | Prevents stale invoice/task pages; proof links now open the actual proof bundle |
| x402-compatible receipt panel | Makes the payment-required/proof-required settlement story visible in the UI and API bundle |
| Second RWA agent/listing | Makes the marketplace feel like infrastructure, not a one-off invoice workflow |
| Product screenshots in README | Lets reviewers understand the app quickly from GitHub without clicking through every route |

## Ecosystem integrations

Sealrail exposes a real integration surface for external agents and Casper ecosystem builders. CSPR.cloud and MCP are live, with further ecosystem surfaces planned.

### Implemented

| Integration | Surface | Status |
|---|---|---|
| **Casper testnet** | Live status reports `casper_mode: testnet`, deployed ProofRegistry config, Casper client 5.0.1 availability, chain readiness | ✅ Live |
| **CSPR.cloud API** | Deploy confirmation, CSPR/USD rate, x402 facilitator status, node health — 4 dedicated endpoints | ✅ Live |
| **MCP server** | `@modelcontextprotocol/sdk` stdio server, 5 tools (status, manifest, proofs, task creation) | ✅ Live |
| **Odra ProofRegistry** | Contract deployed on Casper testnet, linked from README/testnet explorer | ✅ Live |
| **x402-compatible receipts** | Proof bundles include payment-required receipt metadata, proof requirement, unlock condition, network, and payment state | ✅ Live |
| **Casper Wallet authentication** | Wallet connection + signed challenge flow via `/api/auth/wallet/challenge` and `/api/auth/wallet/verify` | ✅ Live |
| **Agent integration manifest** | `GET /api/integrations/agent-manifest` exposes capabilities, endpoints, MCP tools, trust boundaries | ✅ Live |

### Planned

| Integration | What it unlocks |
|---|---|
| Casper AI Toolkit | Agent-prompted contract interactions and Casper-native tool invocation from the runtime |
| Wallet-bound reputation | Deeper reputation and marketplace stats tied to wallet-owned agent/verifier history |
| External agent frameworks | Adapters so autonomous agent runtimes can call Sealrail as a proof-gated payment rail |

The manifest is intentionally public and secret-free. It gives other builders a stable way to discover how to create payment-backed tasks, run agent verification, anchor proof, inspect receipts, and unlock payment only after proof.

### MCP server

```bash
cd backend
npm run mcp
```

The stdio MCP server exposes these tools:

| Tool | Purpose |
|---|---|
| `sealrail_status` | Read backend, Casper, verifier, CSPR.cloud, and trust-boundary status |
| `sealrail_agent_manifest` | Read the machine-readable integration manifest |
| `sealrail_list_proofs` | List proof bundles and payment states |
| `sealrail_get_proof` | Fetch a specific proof bundle by proof id |
| `sealrail_create_payment_task` | Create a payment-backed task using a caller-supplied Sealrail API key |

### CSPR.cloud endpoints

| Endpoint | Purpose |
|---|---|
| `GET /api/integrations/cspr-cloud/status` | CSPR.cloud API reachability, x402 facilitator, CSPR rate, node health |
| `GET /api/integrations/cspr-cloud/deploys/:deployHash` | Confirm deploy status on Casper testnet |
| `GET /api/integrations/cspr-cloud/rates/cspr/latest` | Current CSPR/USD rate |

## Deployment

Sealrail backend is deployed on **Railway** with automatic deploys from the `master` branch on GitHub. The deployment includes:

- **Persistent volume** at `/data` for SQLite database storage
- **Automatic health checks** against `/api/health`
- **Environment-configured** via Railway's dashboard (Casper mode, LLM provider, CSPR.cloud token, Blocky AS config)

Local development and VPS deployment runbooks remain at [backend/DEPLOYMENT.md](backend/DEPLOYMENT.md).

Startup validates configuration and reports readiness at `GET /api/status` — misconfigured testnet/mainnet deployments refuse to pretend they're anchoring.

## Roadmap

| Next | State today |
|---|---|
| Wallet-bound agent earnings and reputation | Casper Wallet sign-in is live; next step is deeper earnings/reputation history per wallet |
| Hosted TEE attestation via Blocky AS | Adapter is built and config-gated; hosted access is not yet provisioned |
| Seeded workflow templates for multi-step split payments | Workflow engine and endpoints are live; no template is seeded yet |
| Mainnet anchoring | `CASPER_MODE=mainnet` path exists and fails closed if misconfigured |

## Verification status

Claims below are current at the linked commit and enforced in CI.

| Surface | Status |
|---|---|
| Backend suite | 766 tests across 17 files, passing with no external services |
| Contract suite | 23/23 (`cargo odra test`) |
| Contract deployment | Live on Casper testnet — [deploy transaction](https://testnet.cspr.live/transaction/b2c6a9326545a137c3d7772385e9fe8003129e29f29336d451785e6a7f3a6196), package `hash-02f9771e9cd4d91c40705563074bc323d45a341a11987464367ac909cc845846` |
| TypeScript | Strict mode, `tsc --noEmit` clean on both packages |
| Trust boundary | Production API is configured for Casper testnet anchoring with live deploy hashes. TEE attestation uses the Blocky adapter; hosted enclave access is configuration-gated and never silently simulated. |

## Tech stack

| Layer | Choice |
|---|---|
| Frontend | Next.js 16 (App Router), React 19, Tailwind 4, CSS Modules |
| Backend | Node 20+, TypeScript 5 (strict), Fastify 5, better-sqlite3 |
| Contract | Rust, Odra 2.8, Casper testnet |
| Verification | Blocky AS adapter (TEE attestation path), schema + WASM hash binding |
| Deployment | Railway (backend), Vercel (frontend) |
| Integrations | CSPR.cloud API, MCP (`@modelcontextprotocol/sdk`), x402-compatible receipts |
| Tests | Vitest (backend), cargo-odra (contract) |

## Quick start

Requires Node 20+. On Windows, run the backend under WSL (better-sqlite3 needs a prebuilt binary or a C toolchain).

```bash
# 1. Backend
cd backend
npm install
cp .env.example .env      # defaults work locally
npm run seed              # registers the first-party verifier, agent, and listing
npm run dev               # http://localhost:3001

# 2. Frontend (repo root, separate terminal)
npm install
echo NEXT_PUBLIC_API_URL=http://localhost:3001 > .env.local
npm run dev               # http://localhost:3000
```

Then open http://localhost:3000/run. Task creation, verification, anchoring, and payment unlock all run against the local API. Agent execution calls a real LLM: set `LLM_API_BASE_URL`, `LLM_API_KEY`, and `LLM_MODEL` in `backend/.env` (any OpenAI-compatible endpoint works). Without a provider configured, runs fail honestly with a 503 rather than fabricating output.

For the hosted review path, start with:

| Page | Purpose |
|---|---|
| [`/review`](https://sealrail.xyz/review) | Reviewer quickstart, live links, product fit, and operational caveats |
| [`/run`](https://sealrail.xyz/run) | One-click proof-gated payment flow |
| [`/marketplace`](https://sealrail.xyz/marketplace) | Seeded Invoice Risk and RWA Compliance agents |
| [`/status`](https://sealrail.xyz/status) | Backend, LLM, verifier, Casper, CSPR.cloud, and trust-boundary status |
| [`/proofs`](https://sealrail.xyz/proofs) | Proof trail and proof detail links |

## Environment variables

Frontend (`.env.local`):

| Var | Purpose |
|---|---|
| `NEXT_PUBLIC_API_URL` | Backend base URL (`http://localhost:3001` locally) |

Backend (`backend/.env`, see [backend/.env.example](backend/.env.example) for the full annotated list):

| Var | Purpose |
|---|---|
| `LLM_API_BASE_URL`, `LLM_API_KEY`, `LLM_MODEL` | OpenAI-compatible provider for agent execution |
| `CASPER_MODE` | `dry_run` (default), `testnet`, or `mainnet` — testnet/mainnet fail closed if misconfigured |
| `CASPER_CONTRACT_HASH` | Deployed ProofRegistry contract hash |
| `BLOCKY_MODE`, `BLOCKY_AS_API_KEY`, `BLOCKY_AS_HOST` | TEE attestation adapter configuration |
| `CSPR_CLOUD_TOKEN` | CSPR.cloud API token for Casper data, rates, and node status |
| `ALLOW_BOOTSTRAP_KEYS` | `true` (default) permits self-serve API key creation; `false` requires an authenticated key |
| `FRONTEND_ORIGIN` | CORS allowlist for the web app |

## Scripts

| Where | Command | What |
|---|---|---|
| root | `npm run dev` / `build` / `lint` | Next.js dev server, production build, ESLint |
| backend | `npm run dev` / `test` / `build` | API server, 766-test suite, typecheck |
| backend | `npm run seed` | Idempotent first-party verifier + agent + listing setup |
| backend | `npm run mcp` | MCP stdio server (5 tools for AI-agent integration) |
| contracts | `cargo odra test` | Contract test suite |

## Repository layout

```
app/                          19 Next.js routes (run, proofs, marketplace, agents, owner, workflows, ...)
components/                   Screen components + shared primitives
lib/                          Typed API client, API types, session bootstrap
backend/src/routes/           Fastify route modules (tasks, payments, proofs, agents, integrations, ...)
backend/src/services/         Domain services (state machines, verification, reputation, keys)
backend/tests/                17 suites, 766 tests
backend/scripts/seed.ts       First-party record setup
contracts/verified-agent-payments/   Odra contract + tests + livenet CLI
docs/                         Architecture, design, API docs, audit reports
```

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). The one hard rule: nothing may fake verification. Placeholder proofs never advance state, and the tests that enforce that are not negotiable.

## Security

See [SECURITY.md](SECURITY.md) for reporting. API key secrets are scrypt-hashed with per-key salts, shown once, and never persisted in plain text.

## License

[MIT](LICENSE)
