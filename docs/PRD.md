# PRD: Verified Agent Payments on Casper

Date: 2026-06-30
Phase: Master Forge Phase 1
Owner: MystiqueMide
Hackathon: Casper Agentic Buildathon
Deadline: 2026-07-07 23:59 UTC

## 1. Summary

Verified Agent Payments on Casper is a Casper-native proof and payment layer for AI-agent work. It lets a user request work from an AI agent, verify the output through a Blocky-compatible attestation flow, anchor the proof hash on Casper, and release or approve payment only when the proof is valid.

The first product vertical is invoice-risk verification. A user submits invoice data, the AI agent produces a risk result, a deterministic verifier function checks the result through schema + hash verification, and Casper stores the proof trail. Hosted TEE execution remains a pending upgrade until hosted access is configured.

## 2. Problem

AI-agent buyers cannot safely pay autonomous agents for high-stakes work without knowing whether the claimed output was actually produced by the expected code, using the expected input, under a verifiable execution path.

This matters for:

| User | Pain |
|---|---|
| DeFi protocols | Need trustworthy off-chain risk, oracle, and compliance checks |
| RWA platforms | Need verifiable document and invoice processing |
| Agent marketplaces | Need a trust layer before machine-to-machine commerce works |
| AI API buyers | Do not want to pay for unverifiable or tampered outputs |
| Casper ecosystem | Needs real agentic apps that produce testnet transactions |

## 3. Product thesis

A Casper/x402-style payment layer becomes much more valuable when agent work is paired with proof.

Core positioning:

```text
No Proof without a Payment.
```

Meaning: every verifiable agent proof should be tied to a payment intent, so the product is not just an attestation registry. It is a payment-backed proof layer for AI-agent work.

## 4. Target users

Primary hackathon user:

```text
A reviewer or developer evaluating whether an AI agent output can be trusted and paid for.
```

Real market users:

1. RWA invoice financing platforms
2. DeFi protocol operators
3. AI-agent marketplaces
4. Web3 automation teams
5. Data oracle builders

## 5. MVP user journey

1. User opens dashboard.
2. User selects the invoice verification agent.
3. User submits invoice data.
4. Backend creates a task ID.
5. AI or deterministic agent runner returns a proposed risk score.
6. Blocky adapter sends the input and proposed score to the WASM verifier.
7. Blocky returns attestation claims.
8. Backend verifies the attestation.
9. Backend anchors the attestation hash and output hash on Casper.
10. Dashboard shows:
    - task ID
    - agent ID
    - verified output
    - Blocky mode
    - code hash
    - input hash
    - attestation hash
    - Casper proof transaction
    - payment status

## 6. Scope

### Must have

| Feature | Acceptance criteria |
|---|---|
| Blocky adapter | Can run local-server mode and parse verified claims |
| Custom WASM verifier | Compiles reproducibly and outputs invoice risk result |
| Casper proof registry | Stores task ID, agent ID, output hash, attestation hash, status |
| Backend API | Creates task, verifies attestation, anchors proof, returns status |
| Dashboard | Shows a full reviewer-friendly proof trail |
| Honest mode labels | Clearly distinguishes schema + hash verification from pending hosted TEE execution |
| README and product run script | Explains setup, proof flow, and upgrade path |

### Should have

| Feature | Acceptance criteria |
|---|---|
| Agent registry | Register at least one agent with name, policy, and code hash |
| Proof explorer | Search by task ID and view proof details |
| x402-style payment state | Shows pending, verified, payable, paid states |

### Could have if time remains

| Feature | Acceptance criteria |
|---|---|
| Reputation score | verified runs and failed runs update trust score |
| Second agent template | Runnstrates reuse beyond invoice verification |
| Real hosted Blocky AS | Switch config from local-server to hosted TEE endpoint |
| Live Casper testnet deploy | Contract deployed and transaction linked in dashboard |

### Out of scope for qualification

1. Full agent marketplace
2. Governance
3. Multi-chain support
4. Complex tokenomics
5. Production slashing
6. Full SDK
7. Many agent categories

## 7. Technical approach

### Blocky path

The product uses a provider interface:

```text
BlockyProvider
  - local-server provider
  - hosted-tee provider
```

Local provider is already verified through Blocky CLI.

Hosted provider is pending Blocky API key and server configuration.

### Casper path

Use Odra to build a proof registry contract.

Registry stores:

```text
agent_id
agent_owner
task_id
wasm_code_hash
input_hash
output_hash
attestation_hash
blocky_mode
verified
created_at
```

### Payment path

For qualification, use a payment-state model compatible with x402 flow:

```text
requested -> proof_pending -> proof_verified -> payable -> paid
```

If time permits, integrate a stronger x402 Casper flow.

## 8. Success metrics

| Metric | Target |
|---|---|
| Full product loop works locally | Yes |
| Casper proof registry test passes | Yes |
| At least one real Casper transaction | Strongly preferred |
| Blocky local attestation verified | Yes |
| Hosted Blocky AS supported behind config | Yes |
| Dashboard explains proof clearly | Yes |
| README has no fake claims | Yes |

## 9. RICE backlog

| Item | Reach | Impact | Confidence | Effort | Score |
|---|---:|---:|---:|---:|---:|
| Blocky adapter plus local verifier | 5 | 5 | 5 | 2 | 62.5 |
| Casper proof registry | 5 | 5 | 4 | 3 | 33.3 |
| Backend task API | 5 | 4 | 5 | 2 | 50.0 |
| Reviewer dashboard | 5 | 5 | 4 | 3 | 33.3 |
| x402-style payment state | 4 | 4 | 3 | 2 | 24.0 |
| Agent registry | 3 | 4 | 4 | 2 | 24.0 |
| Proof explorer | 4 | 3 | 4 | 2 | 24.0 |
| Reputation score | 3 | 3 | 3 | 2 | 13.5 |
| Hosted Blocky AS switch | 5 | 5 | 2 | 2 | 25.0 |

## 10. Risks and mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Blocky key delayed | High | Use local-server mode honestly and keep hosted adapter ready |
| Odra deploy friction | High | Build and test contract locally first, use CSPR.cloud and casper-client next |
| x402 integration unclear | Medium | Ship payment-state flow first, then add real x402 if time permits |
| Run too abstract | High | Use RWA invoice verification as concrete vertical |
| Time pressure | High | Build backend and proof loop before UI polish |

## 11. Reviewer story

One-line pitch:

```text
A Casper payment and proof layer where AI agents only get paid when their output includes a verifiable Blocky-compatible attestation and on-chain proof.
```

Run story:

```text
An invoice-risk verifier agent checks invoice risk. The agent output is verified by a deterministic WASM function through schema + hash verification. Casper stores the proof hash. The dashboard shows that payment becomes available only after proof verification; RWA compliance remains a preview marketplace vertical until its dedicated runtime is connected.
```

## 12. Approval gate

Phase 1 is complete when this PRD is approved.

After approval, Master Forge moves to Phase 2:

1. Architecture
2. Data models
3. API contracts
4. Odra contract design
5. Frontend UX spec
6. Task breakdown
7. `.env.example`
