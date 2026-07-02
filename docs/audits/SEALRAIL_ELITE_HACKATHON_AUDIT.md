# Sealrail — Elite Hackathon Audit

Date: 2026-07-02
Project: Sealrail (Verified Agent Payments on Casper)
Hackathon: Casper Agentic Buildathon (DoraHacks)
Deadline: 2026-07-07 23:59 UTC (5 days out at time of audit)
Repo: github.com/mystiquemide/sealrail (private, 42 commits at audit time)
Audited commit: b83bc12 (UX microcopy fix pass)

---

## Verdict up front

The product is genuinely strong: a real backend (739/751 tests verified live today), a real contract deployed on Casper testnet, and 19 wired frontend screens. But right now you'd score near zero with judges because none of the three things judges actually touch exist: no live demo, no demo video, no submission page. And the repo is private with a create-next-app boilerplate README, so even code review access fails. You built the hard 80% and are missing the visible 20% that decides hackathons. The next 5 days are entirely about Phases R, S, T.

---

## 1. Product & Feature Audit

What works, verified: full task lifecycle (create → run → verify+anchor → unlock payment), agent registry, marketplace with paid task creation, verifier templates with WASM hash binding, workflows with ordered step execution and payment splits, reputation, scoped API keys, honest status page. The "no proof, no payment" invariant is enforced server-side and A+ audited (placeholder proofs can never unlock payments, mainnet fails closed).

Gaps judges will notice:

- Agent execution requires an LLM provider configured. In the current dev environment it isn't, so the flagship `/run` flow ends in a 503. The UI renders that failure honestly, which is good engineering, but a judge clicking "Run agent check" and getting an error is a dead demo. Configure a real LLM key before recording anything.
- Casper anchoring runs in dry_run against a contract that is actually deployed on testnet. You have the contract live (`hash-02f9771e9cd4d91c40705563074bc323d45a341a11987464367ac909cc845846`, verifiable on testnet.cspr.live) but the demo doesn't exercise it. Wiring even one real testnet anchor into the demo is the difference between "simulated" and "on-chain" in judges' eyes, and this is a Casper hackathon.
- Real TEE attestation is blocked on Blocky's hosted key (no response from info@blocky.rocks). Not your fault, and the fail-closed handling is correct. Say so explicitly in the README/video rather than letting judges discover it.

## 2. Code & Architecture

Strong. Clean phase-gated backend (Fastify + SQLite + typed services), Odra contract with 23/23 tests, typed frontend API client, no fixture data left. Five prior audit passes drove it from B+ to A+. Two findings from this audit:

- Brittle test: `phase-deploy-prep.test.ts` "no issues contain raw key values or URLs" fails on any machine without the `bky-as` CLI, because the CLI-missing warning legitimately contains a GitHub install link and the test bans all `https://`. Fix by allowlisting known doc links or asserting on secret patterns only. Until then, "all gates green" is machine-dependent.
- The known 11 phase-c failures (bky-as CLI absence) mean a judge running `npm test` on a clean clone sees 12 red tests. Either mock/skip these when the CLI is absent, or document the expected count in the README.

## 3. UX & Design

Strong, and just got stronger: the microcopy fix pass (commit `b83bc12`) removed the env-var leak from 9 error states, fixed false "Copied" confirmations, killed the fake-disabled CTAs, wired the dead Retry button, and fixed the `&quot;` render bug. Remaining nits: 9 text-only "Loading..." states where only the proofs table has a proper skeleton, and no toast system (acceptable at this scale). All 19 screens were verified pixel-correct in-browser against the design source.

## 4. Performance & Reliability

`/proofs` fetches every task's detail in parallel (N+1); fine at demo scale, would degrade with hundreds of tasks. Frontend build is fast and static where possible. Backend is SQLite/WAL, appropriate for the scope. No concerns for a demo.

## 5. Security & Technical Debt

- Secret scan of tracked files: clean. `.env`/`.env.local` properly gitignored, keys never committed.
- Known backend bug: `POST /api/api-keys` has no auth preHandler, so key creation trusts body `owner_address`. The frontend works around it, but anyone can create keys attributed to any owner. Fine for a demo, flag it or fix it before claiming production readiness. (Decision made post-audit: keep frictionless bootstrap for the judge demo.)
- Session model is demo-identity bootstrap via localStorage, which is honest for a hackathon but should be named as such in docs.

## 6. Submission Page Audit

Doesn't exist. This is a hard zero until Phase T. DoraHacks pages need: one-line positioning ("No Proof without a Payment" is good), the testnet contract link as verifiable evidence, video embed, and team/tech stack.

## 7. Repository Audit

The weakest area relative to effort spent:

- README.md is untouched create-next-app boilerplate. This is the single highest-ROI fix available. A judge opening the repo learns nothing about Sealrail.
- Repo is private. Judges can't see it at all. Make it public before submission (secret scan is clean, so this is safe).
- No LICENSE file. Many hackathons require OSI licensing; add MIT.
- Internal artifacts are committed: `memory.md` (64KB of agent build memory), 13 `.docx` binaries, five internal audit reports, planning docs. The audit reports actually work in your favor (they show rigor), but `memory.md` and the `.docx` duplicates read as machine-generated clutter. (Decision made post-audit: pruning deferred until later.)
- `AGENTS.md`/`CLAUDE.md` tool-config files are fine to keep, they're increasingly normal.

## 8. Competitive Positioning

"Verified agent payments" hits the agentic buildathon thesis dead center, and you have the one thing most entrants won't: a deployed contract plus a fail-closed proof-before-payment state machine, not a wrapper UI. Your differentiator sentence for the video: agents don't get paid for output, they get paid for proven output, enforced by a TEE attestation path and anchored on Casper. Biggest competitive risk is other teams demoing flashier end-to-end flows on mainnet-adjacent infra while your TEE leg is simulated. Counter it with the honesty angle: your system refuses to fake verification, and you can show the code that refuses.

## 9. Rubric Scoring (1-10)

| Category | Score | Note |
|---|---|---|
| Innovation | 8 | Proof-gated payment rail for agents is a real idea, not a wrapper |
| Technical execution | 9 | 739 passing tests, deployed contract, A+ audited invariants |
| Casper integration | 6 | Contract deployed on testnet but demo runs dry_run; wire one real anchor to make this an 8-9 |
| Completeness | 7 | Product complete; agent execution unconfigured, TEE simulated |
| UX/Design | 8 | 19 verified screens, honest states, post-audit polish |
| Documentation | 3 | Boilerplate README, private repo, no LICENSE |
| Demo/Presentation | 1 | Nothing exists yet |
| Real-world viability | 7 | Clear RWA invoice vertical, needs the TEE leg to be real |

Weighted reality: today this submission loses to weaker projects with better packaging. With R/S/T done well it's a genuine contender.

## 10. Presentation Readiness

Not ready. Priority order for the 5 remaining days:

1. Deploy (frontend to Vercel, backend to Railway/Fly with WSL-free build, set an LLM key, set `CASPER_MODE` to exercise the real testnet contract for at least the anchor step).
2. Rewrite README (what it is, architecture diagram, contract hash + explorer link, test counts, honest TEE status, quickstart).
3. Make repo public, add LICENSE.
4. Record the 2-3 min video against the live deployment, showing one full run through payment unlock and the testnet explorer transaction.
5. DoraHacks submission page last, embedding everything above.

## 11. Reality Check

1. Would a judge get the point in 60 seconds? Not today, there's nothing to open. After README + video, yes, the positioning line is strong.
2. Does the core demo work end to end? Only with an LLM key configured, and payment "settlement" is state-machine level, not token transfer. Be precise about that in the video.
3. Is anything overstated? The frontend was audited for exactly this and is now honest. Keep the video to the same standard.
4. What breaks under a judge's hands? A clean clone shows 12 failing tests, and `/run` 503s without an LLM key. Both fixable or documentable.
5. Hardest question: if Blocky never responds, is "TEE-verified" defensible? Your fail-closed design and dry-run labeling make it defensible, but only if the README and video state it plainly instead of hoping nobody asks.

---

## Post-audit decisions (from Mide, 2026-07-02)

1. API key bootstrap: keep frictionless for the deployed judge demo.
2. LLM provider for deployment: undecided, blocks Phase R and the video.
3. Internal artifact pruning (memory.md, .docx files): deferred.
4. Testnet anchoring in demo: showcase anchor approach (one real anchor linked in the UI, not per-run).
