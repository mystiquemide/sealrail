# Sealrail Demo Video Script

Target length: 2:40 to 3:00

Style: screen recording, founder voiceover, light captions, clean cuts

Tone: confident, direct, product-first

Recording path: start on the live site, then move through `/review`, `/run`, `/marketplace`, `/proofs`, and `/status`.

## One-line pitch

Sealrail is the payment rail for AI-agent work: agents only get paid after their output is independently verified and anchored as proof.

## Scene-by-scene script

| Time | Visual | Voiceover | Caption |
|---|---|---|---|
| 0:00 to 0:12 | Open `https://sealrail.vercel.app`. Hold on the hero, then slowly move cursor over the main CTA. | "This is Sealrail. It solves a simple problem: AI agents can produce work, but buyers still need proof before money moves." | No proof, no payment. |
| 0:12 to 0:28 | Click into `/review`. Show the Reviewer quickstart page and the fast path checklist. | "So Sealrail locks payment until the agent output passes verification. This page is the fastest way to evaluate the whole flow." | Review the full flow in 60 seconds. |
| 0:28 to 0:48 | Click `Run flow`. Show the `/run` page. Pause on the task details and the Run full flow button. | "Here, the buyer starts a task. The agent is not trusted just because it returns text. Its output has to match the verifier schema and produce a proof trail." | Agent output must be verified. |
| 0:48 to 1:15 | Click Run full flow. Let the states advance. Pause on risk score, decision, hashes, verification, Casper anchor, payment state. | "The invoice agent checks the job, returns structured output, and Sealrail binds that output to hashes. Then the verifier checks it, the Casper anchor is recorded, and only then does payment become unlockable." | Output, proof, anchor, payment. |
| 1:15 to 1:35 | Open the proof detail link from the run result, or go to `/proofs` and open a proof. Show proof ID, task context, hashes, status, receipt panel. | "Every run has a proof page. This is what makes the payment auditable: the proof ID, input hash, output hash, verifier result, Casper state, and payment receipt are all visible." | Proof detail, not just a success message. |
| 1:35 to 1:55 | Scroll to the x402-compatible receipt area. Hold on `402`, unlock condition, network, payment state if visible. | "The receipt is shaped for x402-style payment flows. It tells the client what proof is required, what unlock condition must be met, and what payment state the task is in." | x402-compatible proof receipt. |
| 1:55 to 2:15 | Open `/marketplace`. Show both the Invoice Risk Agent and RWA Compliance Agent. Click one listing briefly. | "Sealrail is not just one agent. The marketplace can host different services, like invoice risk checks and RWA compliance review, all using the same proof-gated payment rail." | One rail, many agents. |
| 2:15 to 2:35 | Open `/status`. Show backend, LLM, verifier, Casper, and trust-boundary status. Pause on dry-run or testnet wording if present. | "The status page is intentionally honest. If a service is in dry-run mode, Sealrail says that. If testnet anchoring is configured, it shows that path clearly." | Honest trust boundaries. |
| 2:35 to 2:55 | Return to homepage or README/GitHub. Show badges, screenshots, tests, and live links. | "The repo includes the live app, screenshots, CI, CodeQL, backend tests, contract tests, and setup instructions. The core rule is simple: agents do not get paid for output. They get paid for proven output." | Agents get paid for proven output. |
| 2:55 to 3:00 | End card with live URL and GitHub URL. | "That is Sealrail: proof-gated payment infrastructure for AI-agent work." | sealrail.vercel.app · github.com/mystiquemide/sealrail |

## Voiceover-only script

This is Sealrail. It solves a simple problem: AI agents can produce work, but buyers still need proof before money moves.

So Sealrail locks payment until the agent output passes verification. This page is the fastest way to evaluate the whole flow.

Here, the buyer starts a task. The agent is not trusted just because it returns text. Its output has to match the verifier schema and produce a proof trail.

The invoice agent checks the job, returns structured output, and Sealrail binds that output to hashes. Then the verifier checks it, the Casper anchor is recorded, and only then does payment become unlockable.

Every run has a proof page. This is what makes the payment auditable: the proof ID, input hash, output hash, verifier result, Casper state, and payment receipt are all visible.

The receipt is shaped for x402-style payment flows. It tells the client what proof is required, what unlock condition must be met, and what payment state the task is in.

Sealrail is not just one agent. The marketplace can host different services, like invoice risk checks and RWA compliance review, all using the same proof-gated payment rail.

The status page is intentionally honest. If a service is in dry-run mode, Sealrail says that. If testnet anchoring is configured, it shows that path clearly.

The repo includes the live app, screenshots, CI, CodeQL, backend tests, contract tests, and setup instructions. The core rule is simple: agents do not get paid for output. They get paid for proven output.

That is Sealrail: proof-gated payment infrastructure for AI-agent work.

## Recording checklist

### Before recording

- Use Chrome or Arc in a clean browser profile.
- Set zoom to 100 percent.
- Record at 1920x1080 if possible.
- Open these tabs before starting:
  - `https://sealrail.vercel.app`
  - `https://sealrail.vercel.app/review`
  - `https://sealrail.vercel.app/run`
  - `https://sealrail.vercel.app/marketplace`
  - `https://sealrail.vercel.app/status`
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
- Add short captions from the table above.
- Keep transitions simple: direct cuts only.
- Normalize voiceover volume.
- Export as 1080p MP4.

## Suggested tools

- Screen recording: Recordly
- Editing and voiceover: CapCut Desktop
- Fallback recorder: OBS Studio

## End card

Sealrail

Proof-gated payment infrastructure for AI-agent work

Live: https://sealrail.vercel.app

GitHub: https://github.com/mystiquemide/sealrail
