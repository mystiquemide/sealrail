# Sealrail Demo Video Script

Target length: 2:40 to 3:00

Style: screen recording, founder voiceover, light captions, clean cuts

Tone: confident, direct, product-first

Recording path: start on the live site, then move through `/review`, `/run`, `/marketplace`, `/proofs`, `/status`, and end on the API manifest + GitHub.

## One-line pitch

Sealrail is the payment rail for AI-agent work: agents only get paid after their output is independently verified and anchored as proof.

## Scene-by-scene script

| Time | Visual | Voiceover | Caption |
|---|---|---|---|
| 0:00 to 0:12 | Open `https://sealrail.xyz`. Hold on the hero, then slowly move cursor over the main CTA. | "This is Sealrail. It solves a simple problem: AI agents can produce work, but buyers still need proof before money moves." | No proof, no payment. |
| 0:12 to 0:28 | Click into `/review`. Show the Reviewer quickstart page and the fast path checklist. | "So Sealrail locks payment until the agent output passes verification. This page is the fastest way to evaluate the whole flow." | Review the full flow in 60 seconds. |
| 0:28 to 0:48 | Click `Run flow`. Show the `/run` page. Pause on the task details and the Run full flow button. | "Here, the buyer starts a task. The agent is not trusted just because it returns text. Its output has to match the verifier schema and produce a proof trail." | Agent output must be verified. |
| 0:48 to 1:15 | Click Run full flow. Let the states advance. Pause on risk score, decision, hashes, verification, Casper anchor, payment state. | "The invoice agent checks the job, returns structured output, and Sealrail binds that output to hashes. Then the verifier checks it, the Casper anchor is recorded, and only then does payment become unlockable." | Output, proof, anchor, payment. |
| 1:15 to 1:35 | Open the proof detail link from the run result, or go to `/proofs` and open a proof. Show proof ID, task context, hashes, status, receipt panel. | "Every run has a proof page. This is what makes the payment auditable: the proof ID, input hash, output hash, verifier result, Casper state, and payment receipt are all visible." | Proof detail, not just a success message. |
| 1:35 to 1:55 | Scroll to the x402-compatible receipt area. Hold on `402`, unlock condition, network, payment state if visible. | "The receipt is shaped for x402-style payment flows. It tells the client what proof is required, what unlock condition must be met, and what payment state the task is in." | x402-compatible proof receipt. |
| 1:55 to 2:15 | Open `/marketplace`. Show both the Invoice Risk Agent and RWA Compliance Agent. Click one listing briefly. | "Sealrail is not just one agent. The marketplace can host different services, like invoice risk checks and RWA compliance review, all using the same proof-gated payment rail." | One rail, many agents. |
| 2:15 to 2:35 | Open `/status`. Show backend, LLM, verifier, Casper, CSPR.cloud, and trust-boundary status. Pause on CSPR.cloud rate and Casper testnet wording. | "The status page is intentionally honest. CSPR.cloud is live with real-time CSPR/USD rates. Casper testnet anchoring is configured. Every trust boundary is visible — no hand-waving." | Honest trust boundaries. |
| 2:35 to 2:55 | Open `https://api.sealrail.xyz/api/integrations/agent-manifest` in a new tab. Scroll through capabilities, MCP tools, CSPR.cloud endpoints. | "The manifest exposes everything Sealrail can do: CSPR.cloud integration, MCP server tools, Casper contract metadata. Any MCP-compatible AI agent can discover and call this rail." | MCP server, CSPR.cloud, Casper — live. |
| 2:55 to 3:00 | Return to GitHub README. Show badges, screenshots, 754 tests, live links. | "754 backend tests, 23 contract tests, CI, CodeQL, deployed on Railway. Agents get paid for proven output. That is Sealrail." | sealrail.xyz · github.com/mystiquemide/sealrail |

## Voiceover-only script

This is Sealrail. It solves a simple problem: AI agents can produce work, but buyers still need proof before money moves.

So Sealrail locks payment until the agent output passes verification. This page is the fastest way to evaluate the whole flow.

Here, the buyer starts a task. The agent is not trusted just because it returns text. Its output has to match the verifier schema and produce a proof trail.

The invoice agent checks the job, returns structured output, and Sealrail binds that output to hashes. Then the verifier checks it, the Casper anchor is recorded, and only then does payment become unlockable.

Every run has a proof page. This is what makes the payment auditable: the proof ID, input hash, output hash, verifier result, Casper state, and payment receipt are all visible.

The receipt is shaped for x402-style payment flows. It tells the client what proof is required, what unlock condition must be met, and what payment state the task is in.

Sealrail is not just one agent. The marketplace can host different services, like invoice risk checks and RWA compliance review, all using the same proof-gated payment rail.

The status page is intentionally honest. CSPR.cloud is live with real-time CSPR/USD rates. Casper testnet anchoring is configured. Every trust boundary is visible — no hand-waving.

The manifest exposes everything Sealrail can do: CSPR.cloud integration, MCP server tools, Casper contract metadata. Any MCP-compatible AI agent can discover and call this rail.

754 backend tests, 23 contract tests, CI, CodeQL, deployed on Railway. Agents get paid for proven output. That is Sealrail.

## Recording checklist

### Before recording

- Use Chrome or Arc in a clean browser profile.
- Set zoom to 100 percent.
- Record at 1920x1080 if possible.
- Open these tabs before starting:
  - `https://sealrail.xyz`
  - `https://sealrail.xyz/review`
  - `https://sealrail.xyz/run`
  - `https://sealrail.xyz/marketplace`
  - `https://sealrail.xyz/status`
  - `https://api.sealrail.xyz/api/integrations/agent-manifest`
  - `https://github.com/mystiquemide/sealrail`
- Do one full dry run before recording.
- Keep mouse movement slow and deliberate.
- Turn off notifications.

### During recording

- Start on the homepage, not a slide.
- Pause 2 seconds after every page load.
- Do not rush the proof detail screen.
- Hold on the receipt panel long enough for viewers to read it.
- If the run flow takes time, cut dead air later instead of clicking around.

### After recording

- Trim page-load dead air.

## Quick recording path (for judges who click through)

If judges want to verify specific surfaces themselves rather than watching the full video, direct them here:

1. **Run flow**: https://sealrail.xyz/run — the full proof-gated payment loop
2. **Proof detail**: https://sealrail.xyz/proofs — pick any proof, inspect receipt
3. **Status**: https://sealrail.xyz/status — CSPR.cloud rate, Casper testnet, trust boundaries
4. **Manifest**: https://api.sealrail.xyz/api/integrations/agent-manifest — MCP tools, CSPR.cloud endpoints
5. **API health**: https://api.sealrail.xyz/api/status — server uptime, contract readiness, LLM status
