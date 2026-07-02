# Sealrail Backend Plan - Concise Approval Version

Project: Sealrail on Casper
Positioning: No Proof without a Payment.
Phase: Backend only
Status: Ready for approval before build

## 1. What we are building now

We are building the backend foundation that makes the approved UI real later. This phase does not build frontend screens and does not deploy.

Backend scope:

- Fastify TypeScript API
- SQLite persistence
- Casper/Odra proof registry contract
- TEE verification adapter
- Casper anchoring adapter
- Task and payment state machine
- Marketplace backend records
- Agent registry
- Multi-agent workflow engine
- Payment split engine
- Reputation scoring
- API key management
- Verifier template upload backend
- Test and verification gates

## 2. Non-negotiables

- No frontend implementation in this phase.
- No deployment without approval.
- No secrets in code, docs, logs, or chat.
- Public responses use TEE verification wording.
- Payment unlock only happens after proof verification and Casper anchoring.
- No fake records presented as live product data.
- Every phase must pass tests before the next phase starts.

## 3. Backend stack

| Layer | Choice |
|---|---|
| Runtime | Node.js 20+ |
| Language | TypeScript |
| API framework | Fastify |
| Database | SQLite with better-sqlite3 |
| Contract | Rust with Odra |
| Chain | Casper Testnet path |
| Verification | TEE verification adapter using Blocky tooling |
| Hashing | SHA-256 and SHA3-512 |
| API key hashing | scrypt or argon2 |

## 4. Build order

| Phase | Deliverable | Stop condition |
|---|---|---|
| A | Backend foundation | `/api/health` works |
| B | Odra proof registry | Contract tests pass |
| C | TEE verification adapter | Verification test endpoint returns valid claims |
| D | Casper anchoring adapter | Task can store anchor hash |
| E | Task and payment state machine | Invalid transitions reject with 400 |
| F | Agent registry | Agents can be created, updated, queried |
| G | Marketplace backend | Listings connect to agents and verifiers |
| H | Multi-agent workflow engine | Ordered workflow run creates proof bundle |
| I | Payment split engine | Split shares sum to 10000 basis points |
| J | Reputation engine | Scores recalculate from proof/payment events |
| K | API key manager | Keys are hashed, scoped, shown once |
| L | Verifier template backend | Templates validate schema and code hash |
| M | Integration tests | Full proof to payment loop passes |

## 5. Core API groups

| Group | Main routes |
|---|---|
| Health | `GET /api/health`, `GET /api/status` |
| Tasks | `POST /api/tasks`, `GET /api/tasks/:id`, `POST /api/tasks/:id/run-proof`, `POST /api/tasks/:id/anchor`, `POST /api/tasks/:id/unlock-payment` |
| Payments | `GET /api/payments/:id`, `POST /api/payments/:id/splits`, `POST /api/payments/:id/claim` |
| Proofs | `GET /api/proofs`, `GET /api/proofs/:id`, `GET /api/proofs/:id/verify` |
| Agents | `POST /api/agents`, `GET /api/agents`, `GET /api/agents/:id`, `PATCH /api/agents/:id` |
| Marketplace | `POST /api/marketplace/listings`, `GET /api/marketplace/listings`, `POST /api/marketplace/listings/:id/tasks` |
| Workflows | `POST /api/workflows`, `POST /api/workflows/:id/runs`, `GET /api/workflow-runs/:id` |
| Verifiers | `POST /api/verifiers`, `POST /api/verifiers/:id/test`, `PATCH /api/verifiers/:id/status` |
| API keys | `POST /api/api-keys`, `GET /api/api-keys`, `POST /api/api-keys/:id/revoke` |
| Owner | `GET /api/owner/dashboard`, `GET /api/owner/agents`, `GET /api/owner/earnings` |

## 6. Data models

Main tables:

- `agents`
- `marketplace_listings`
- `tasks`
- `payments`
- `payment_splits`
- `proofs`
- `casper_anchors`
- `workflow_templates`
- `workflow_runs`
- `verifier_templates`
- `api_keys`

## 7. Payment state machine

Valid flow:

```text
created -> funded -> proof_verified -> anchored -> payable -> paid
```

Rules:

- `created` means task exists but payment is not funded.
- `funded` means payment intent exists and amount is locked for backend logic.
- `proof_verified` requires a valid TEE verification result.
- `anchored` requires a Casper anchor hash.
- `payable` means payment can be released.
- `paid` is final.

Invalid transitions return HTTP 400.

## 8. Odra contract scope

Contract name:

```text
VerifiedAgentPayments
```

Core storage:

- registered agents
- proof records
- payment records
- anchor hashes
- owner address

Core entry points:

- `init`
- `register_agent`
- `create_payment`
- `anchor_proof`
- `mark_payable`
- `mark_paid`
- `get_agent`
- `get_payment`

Odra pitfall handled:

- Use explicit registered sentinel mappings for `Address` lookups.

## 9. Marketplace backend rules

- Listings require an active agent.
- Listings require at least one verifier template.
- Creating a task from a listing copies the listing terms into the task record.
- Listings can be paused, active, or archived.
- Empty marketplaces return truthful empty arrays, not invented records.

## 10. Multi-agent workflow rules

- A workflow is an ordered template of steps.
- Each step points to an agent and verifier requirement.
- Each step creates a task and proof record.
- Final workflow result aggregates all step proof hashes.
- Failed step stops the run unless retry policy allows retry.

## 11. Payment split rules

- `share_bps` values must sum to `10000`.
- Each recipient has its own claim state.
- Split unlock depends on parent payment reaching `payable`.
- `split_hash` is deterministic from payment ID, recipient, share, and wallet.

## 12. Reputation scoring

Formula:

```text
score = 50
+ min(25, verified_count * 2)
+ min(15, paid_count * 2)
- min(25, failed_count * 5)
- min(15, dispute_count * 3)
```

Clamp to `0..100`.

Recalculate when:

- proof verified
- payment paid
- proof failed
- dispute recorded

## 13. API key security

- Generate keys server-side.
- Show raw key once.
- Store only hash and prefix.
- Use scopes for route access.
- Support soft revocation.
- Log key prefix only, never raw key.

## 14. Verifier template rules

- Template uploads include name, schema, runtime, code hash, and owner.
- WASM/code hash is required before activation.
- Test action must run through the verification adapter.
- Active templates can be used by marketplace listings and workflows.

## 15. First Kanban build task after approval

Create Phase A only:

```text
backend/package.json
backend/tsconfig.json
backend/src/config.ts
backend/src/db.ts
backend/src/schema.ts
backend/src/types.ts
backend/src/index.ts
backend/.env.example
```

Acceptance:

```bash
cd backend
npm install
npm run dev
curl http://localhost:3001/api/health
npm test
```

## 16. Approval decision

If you approve this backend plan, next Kanban task should be:

```text
Senku: Sealrail backend Phase A foundation
```

If you want changes, adjust this plan before build starts.
