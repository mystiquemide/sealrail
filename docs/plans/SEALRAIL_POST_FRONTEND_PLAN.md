# Sealrail Post-Frontend Integration & Submission Plan

> After frontend UI (Phase N) is complete. Deadline: 2026-07-07 23:59 UTC.

## Phase overview

| Phase | What | Est. |
|---|---|---|
| O | Frontend-backend wiring | connect UI to real API |
| P | Casper testnet deploy | Odra contract → testnet |
| Q | Real TEE hookup | Blocky AS integration |
| R | Deployment | Vercel + VPS/Railway |
| S | Demo video | record full flow |
| T | README + submission | polish and submit |

---

## Phase O: Frontend-backend wiring

Replace typed fixtures with live API calls.

### Steps

| Step | Deliverable | Notes |
|---|---|---|
| O1 | Axios/fetch client with base URL config | `frontend/src/lib/api.ts`, read `NEXT_PUBLIC_API_URL` |
| O2 | Auth header injection (x-api-key from localStorage/session) | wire to API key management page |
| O3 | Wire landing page `/run` form → POST /api/tasks | create task from UI |
| O4 | Wire marketplace → GET /api/marketplace, POST /api/marketplace/:id/tasks | browse + create |
| O5 | Wire agent registry → GET /api/agents, agent detail | list + profile |
| O6 | Wire owner dashboard → GET /api/agents?owner=X, task/payment lists | dashboard data |
| O7 | Wire workflows → POST /api/workflow-templates, /api/workflow-runs | create + run |
| O8 | Wire payment splits → POST /api/payments/intents | split UI → API |
| O9 | Wire verifier templates → POST /api/verifiers/upload | upload form |
| O10 | Wire API key management → CRUD /api/api-keys | generate, list, revoke |
| O11 | Wire proof explorer → GET /api/proofs, /api/tasks/:id | proof + task detail |
| O12 | Wire status page → GET /api/status, /api/admin/status | health display |
| O13 | CORS config on backend | allow frontend origin |
| O14 | Error handling + loading states across all wired pages | UX polish |
| O15 | QA: full click-through of every wired flow | acceptance gate |

### Gate

- Every page fetches real data from local backend
- No fixture imports remain
- `npm run build` passes (frontend + backend)
- 631 backend tests still pass

---

## Phase P: Casper testnet deploy

Deploy the Odra contract to Casper testnet and switch backend from dry-run.

### Prerequisites

- Casper testnet faucet (CSPR tokens)
- `casper-client` installed and configured
- `cargo-odra` build verified (Phase B)

### Steps

| Step | Deliverable | Notes |
|---|---|---|
| P1 | Request testnet CSPR from faucet | https://testnet.cspr.live/tools/faucet |
| P2 | Build contract: `cd contract && cargo odra build` | produces `.wasm` |
| P3 | Deploy to testnet: `casper-client put-deploy --session-path ...` | get deploy hash |
| P4 | Verify deploy: `casper-client get-deploy` | confirm success |
| P5 | Update contract hash in backend `.env` | `CASPER_CONTRACT_HASH` |
| P6 | Switch backend to `CASPER_MODE=testnet` | update `.env` |
| P7 | Run backend tests against testnet | phase-d.test.ts with real client |
| P8 | Manual test: create task → anchor → verify anchor hash on explorer | testnet.cspr.live |
| P9 | Update memory.md with testnet deploy hash + contract address | docs |

### Gate

- Contract deployed and verified on testnet explorer
- Backend anchors real deploys (no dry-run fallback)
- Tests pass with `CASPER_MODE=testnet`

---

## Phase Q: Real TEE hookup

Connect Blocky AS for real attestation instead of simulated proofs.

### Prerequisites

- Blocky AS API access (email sent to info@blocky.rocks on Jun 30)
- API credentials in `.env`

### Steps

| Step | Deliverable | Notes |
|---|---|---|
| Q1 | Configure `BLOCKY_API_KEY` and `BLOCKY_API_URL` in backend `.env` | from Blocky response |
| Q2 | Test Blocky connectivity: health check endpoint | `backend/src/services/blocky.ts` |
| Q3 | Replace placeholder proof generation with real Blocky attestation call | `backend/src/services/tasks.ts` |
| Q4 | Verify attestation report structure matches Blocky AS response | parse report fields |
| Q5 | Update verifyTaskProof to validate real attestation data | signature, measurements, PCRs |
| Q6 | Run backend tests with `BLOCKY_MODE=real` (if Blocky access granted) | phase-c, phase-e tests |
| Q7 | Fallback: if Blocky access not available by deadline, configure hosted TEE alternative | document fallback |
| Q8 | Update memory.md with TEE status | real or fallback plan |

### Gate

- Real attestation reports flowing through system
- Placeholder detection still rejects synthetic inputs
- All tests pass in real mode

---

## Phase R: Deployment

Ship frontend and backend to public URLs.

### Steps

| Step | Deliverable | Notes |
|---|---|---|
| R1 | Deploy frontend to Vercel | connect GitHub repo, set `NEXT_PUBLIC_API_URL` |
| R2 | Deploy backend to VPS (`:8000`) or Railway | systemd or Railway service |
| R3 | Set up nginx reverse proxy with SSL (if VPS) | certbot + Let's Encrypt |
| R4 | Configure CORS for production origin | backend `.env` |
| R5 | Health check: `GET /api/status` from deployed URL | verify publicly accessible |
| R6 | Smoke test: full flow from deployed frontend → deployed backend | create task, view proof |
| R7 | Update memory.md with deploy URLs | docs |

### Gate

- Frontend live at public URL
- Backend live and responding
- Full flow works end-to-end from deployed URLs

---

## Phase S: Demo video

Record a walkthrough for the hackathon submission.

### Steps

| Step | Deliverable | Notes |
|---|---|---|
| S1 | Script: write 2-3 minute demo script | intro → workflow → result |
| S2 | Record: full flow on deployed app | screen capture |
| S3 | Show: create task with verifier, TEE proof, Casper anchor, payment split, claim | key feature path |
| S4 | Voiceover or captions | optional |
| S5 | Upload to YouTube (unlisted) | embed in submission |

### Gate

- Video covers the full value prop
- Deployed app is visible (no localhost)
- Under 3 minutes

---

## Phase T: README + submission

Polish the repo and submit.

### Steps

| Step | Deliverable | Notes |
|---|---|---|
| T1 | Write README.md: what Sealrail does, tech stack, architecture, setup | concise, screenshot |
| T2 | Add demo video link to README | YouTube embed |
| T3 | Add deploy links to README | Vercel + backend URL |
| T4 | Verify all docs: PRD, DESIGN, ARCHITECTURE, PRIVACY, TERMS are in repo | clean |
| T5 | Verify no secrets, no `.env`, no API keys in repo | `git ls-files` + `.gitignore` check |
| T6 | Submit on DoraHacks: fill form, paste README, add video link | Casper Agentic Buildathon |
| T7 | Update memory.md: submission complete | final update |
| T8 | Kanban: mark all phases done | board cleanup |

### Gate

- README is submission-ready
- No secrets exposed
- DoraHacks submission confirmed

---

## Dependency order

```
O (wiring) → R (deploy) → S (demo video) → T (submission)
P (Casper testnet) → parallel with O/R
Q (TEE hookup) → parallel with O/R (gated by Blocky response)
```

---

## Gates summary

| Phase | Gate |
|---|---|
| O | All pages wired, no fixtures, build passes |
| P | Contract on testnet explorer, real deploy hashes |
| Q | Real attestation flowing (or documented fallback) |
| R | Deployed frontend + backend publicly accessible |
| S | Demo video uploaded |
| T | DoraHacks submission confirmed |
