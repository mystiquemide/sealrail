# SealRail: Proof-Gated Payments for AI-Agent Work

## DoraHacks Casper Agentic Buildathon — Submission Pitch

---

## One-liner

**Agents don't get paid for output. They get paid for proven output.**

SealRail locks AI-agent payments until the output is independently verified, recorded, and anchored on Casper — making every payment auditable by default.

---

## The Problem

AI agents produce work nobody verifies, then get paid anyway. This breaks at scale:

- **DeFi protocols** need trustworthy off-chain risk checks before moving money
- **RWA platforms** need verifiable document processing with audit trails
- **Agent marketplaces** need machine-to-machine payment rails that don't trust the agent's word
- **AI API buyers** don't want to pay for hallucinated results

Without proof-gating, AI-agent payments are just API calls with extra marketing.

---

## The Solution: Proof → Anchor → Pay

```
Buyer funds task → LLM agent runs → Verifier checks output
→ Casper anchors proof hash → Payment unlocks (only if verified)
```

Every task has one unbreakable rule, enforced in the state machine and tested: **no payment unlocks without verified proof.** Placeholder proofs can never advance a task.

---

## What Judges Can Verify Right Now

### Live deployment (click these)

| Surface | URL |
|---|---|
| Homepage | https://sealrail.xyz |
| Run a task | https://sealrail.xyz/run |
| Marketplace | https://sealrail.xyz/marketplace |
| Proof explorer | https://sealrail.xyz/proofs |
| Status dashboard | https://sealrail.xyz/status |
| API health | https://api.sealrail.xyz/api/status |
| Agent manifest | https://api.sealrail.xyz/api/integrations/agent-manifest |

### Casper ecosystem depth

| Integration | What's live |
|---|---|
| **Casper testnet** | ProofRegistry deployed, Casper client 5.0.1, live anchoring |
| **CSPR.cloud** | Deploy confirmation, CSPR/USD rate ($0.002062 live), x402 facilitator, node health — 4 API endpoints |
| **Odra Framework** | Rust smart contract, 23 tests, deployed to testnet |
| **x402 Facilitator** | Payment-required receipt with 402 status, proof requirement, unlock condition |
| **MCP server** | Real `@modelcontextprotocol/sdk` server, 5 tools — any MCP agent can call SealRail |

### Engineering rigor

| Metric | Result |
|---|---|
| Backend tests | 754 passing, 16 files, no external dependencies |
| Contract tests | 23/23 (`cargo odra test`) |
| TypeScript | Strict mode, `tsc --noEmit` clean |
| CI/CD | GitHub Actions (CI + CodeQL), Railway auto-deploy from master |
| Frontend screens | 19 routes, honest empty/loading/error states |
| Deployment | Railway (backend) + Vercel (frontend), persistent volume, health checks |

---

## What Makes This Different

### 1. Honest trust boundaries

SealRail tells you what's real and what isn't. No hand-waving.

| Layer | Status |
|---|---|
| CSPR.cloud API | ✅ Live |
| Casper testnet anchoring | ✅ Live |
| MCP server | ✅ Live |
| LLM execution | ✅ Groq, hash-bound output |
| TEE attestation | ⚠️ Adapter built, hosted access pending |
| Mainnet | ❌ Path exists, fails closed |

### 2. Proof detail, not just a success message

Every task run produces a proof page with: proof ID, input hash, output hash, verifier result, Casper anchor state, payment state, and an x402-compatible receipt. Judges can inspect the full trail.

### 3. MCP as a first-class integration

Not a "we could add MCP" — it's built. `npm run mcp` starts a real `@modelcontextprotocol/sdk` server. Any MCP-compatible agent (Claude, Cursor, Copilot agents) can discover and call SealRail's proof-gated payment rail.

### 4. Two agents, one rail

The marketplace hosts both an Invoice Risk Agent and an RWA Compliance Agent — showing this isn't a one-trick pipeline. It's infrastructure.

---

## Comparison: What Else Exists?

| Approach | SealRail | Competitor A (agent APIs) | Competitor B (oracles) |
|---|---|---|---|
| Payment gated on proof | ✅ Yes | ❌ Pay per call | ❌ Pay per data point |
| Agent output verified | ✅ Schema + WASM hash | ❌ Trust agent output | N/A |
| Proof anchored on-chain | ✅ Casper testnet | ❌ No anchoring | ✅ Data on-chain |
| Agent-agnostic | ✅ MCP + manifest | ❌ Proprietary API | ❌ Data-specific |
| Honest about trust boundaries | ✅ Public status page | ❌ Marketing claims | ❌ Implied guarantees |

---

## Business Model

- **Per-task fees**: platform takes a percentage of each verified task payment
- **Verifier templates**: paid marketplace for trustable verification schemas
- **Hosted TEE attestation**: premium tier for production-grade verification
- **Enterprise agents**: white-label gateways for companies that want proof-gated payments without building it

---

## Roadmap After Buildathon

1. **Production payment settlement** — connect proof verification to real CSPR value movement
2. **Hosted TEE via Blocky AS** — adapter is built; enable hosted enclaves for verifier execution
3. **Casper Wallet identity** — connect a wallet, sign a nonce, bind agents and earnings to keys
4. **External agent adapters** — CrewAI, AutoGPT, LangChain agents call SealRail through MCP
5. **Mainnet anchoring** — path exists, ready when hosted TEE + settlement are production-grade

---

## Repo

**https://github.com/mystiquemide/sealrail**

```bash
git clone https://github.com/mystiquemide/sealrail.git
cd backend && npm install && npm run seed && npm run dev
```

MIT licensed. 754 tests. Clean build. Honest about what works.
