# SealRail Claude Design Brief — Madison-Style Reference, SealRail Brand

## Purpose

Create a single self-contained **Claude Design HTML motion artifact** for a SealRail animated product demo/explainer.

Use the supplied Madison explainer video references only for **structure, pacing, scene logic, product-demo rhythm, and UI motion patterns**.

Do **not** copy Madison's visual brand, color palette, product category, UI content, logo treatment, purple theme, or light small-business marketing style.

SealRail must keep its own brand:

- Dark premium fintech/Web3 interface
- Casper red accents
- Cream-white typography
- Proof/payment rail visual language
- Infrastructure-grade, skeptical, precise tone
- Real product screenshots and real proof/payment concepts

This should feel like **SealRail's own product demo**, but with the clean explanatory clarity of the Madison reference.

---

## Output Required From Claude Design

Build one file:

```text
SealRail_Madison_Reference_Demo.html
```

Requirements:

- 1920×1080 16:9 canvas
- Self-contained HTML, CSS, and JavaScript
- No external frameworks required unless using CDN is unavoidable
- Timeline-based animation that auto-plays from start to finish
- Keyboard controls:
  - Space: play/pause
  - Left/Right: seek ±5 seconds
  - R: restart
- Bottom progress bar
- Mandatory captions/subtitles
- Uses real SealRail screenshots as product-proof scenes
- Uses Madison reference only as a motion/storytelling guide
- Must be export-friendly via screen recording

---

## Core Product Message

```text
SealRail is the payment rail for AI-agent work.
Agents do not get paid for output. They get paid for proven output.
```

Short positioning:

```text
No Proof without a Payment.
```

One-line explanation:

```text
SealRail lets users create payment-backed AI-agent tasks where payment only becomes available after verifier-approved proof is anchored on Casper.
```

Memorable product loop:

```text
Task funded → Agent runs → Proof sealed → Casper anchors → Payment unlocks
```

---

## Non-Negotiable Brand Rules

Use SealRail's brand, not Madison's.

### Colors

```css
--sr-black:       #080808;
--sr-ink:         #111111;
--sr-panel:       rgba(17, 17, 17, 0.78);
--sr-soft-white:  #F6F5F3;
--sr-muted:       #888888;
--sr-line:        rgba(246, 245, 243, 0.18);
--sr-casper-red:  #FF2D2D;
--sr-proof-green: #64D96B;
--sr-risk-red:    #F45B45;
--sr-warm-gray:   #F0EFED;
--sr-api-blue:    #3C8DFF;
```

### Typography

```text
Headlines: Inter, 400–650, tight letter-spacing
Body: Inter, 400–500
Technical labels / hashes: JetBrains Mono
Optional editorial emphasis: Georgia, sparingly
```

### Visual Style

- Dark canvas
- Cream/white linework
- Casper red accent pulses
- Thin rail lines connecting states
- Glass-like black panels with subtle borders
- Minimal glow, not neon overload
- Massive negative space
- No purple theme
- No generic SaaS gradient background
- No emojis
- No stock illustrations
- No cartoon robot AI visuals
- No fake claims

### Honest Trust Language

Allowed:

```text
TEE-compatible attestation
TEE Verification Mode
Verified through the attestation verifier
Proof hash anchored on Casper
Payment unlocked after proof
Casper testnet anchoring
x402-compatible proof receipt
```

Do not say:

```text
Ran inside a real TEE
Production TEE verified
Hosted Blocky TEE proof completed
Real enclave execution
```

---

## Reference Inputs Included

Claude should study the following references in the attached folder.

### Madison Reference Extraction

Use these for pacing and scene structure only:

```text
references/madison_contact_sheet.jpg
references/madison_keyframes.jpg
```

What to learn from Madison:

1. Start with a scattered ecosystem/problem visual
2. Introduce a human/business pain
3. Reveal the product logo clearly
4. Show dashboard/product UI early
5. Walk through 4–5 concrete product actions
6. Use cursor choreography for important actions
7. Use modal overlays and zoom-ins for feature proof
8. End with reports/AI assistant-style proof and CTA
9. Keep each scene readable, not overloaded
10. Use product UI as evidence, not decoration

What not to copy from Madison:

- Purple brand
- White/light marketing UI style
- Local restaurant/business category
- Google/Instagram/Yelp platform motif
- Madison logo/wording
- Generic AI marketing assistant positioning

### SealRail Product Screenshots

Use these as the real source of truth for product scenes:

```text
references/sealrail/00_landing_hero.png
references/sealrail/00b_landing_sections.png
references/sealrail/01_status_casper_testnet.png
references/sealrail/02_proofs_explorer.png
references/sealrail/03_agents_marketplace.png
references/sealrail/04_verifiers.png
references/sealrail/05_run_flow_completed.png
references/sealrail/06_proof_detail_tee_casper.png
references/sealrail/07_casper_explorer_onchain_proof.png
references/sealrail/08_docs_api_reference.png
references/sealrail/09_api_keys_management.png
references/sealrail/10_review_quickstart.png
references/sealrail/11_run_verified_output.png
```

The live app is also relevant:

```text
https://sealrail.vercel.app
https://sealrail.vercel.app/review
https://sealrail.vercel.app/run
https://sealrail.vercel.app/marketplace
https://sealrail.vercel.app/proofs
https://sealrail.vercel.app/status
https://github.com/mystiquemide/sealrail
```

---

## Madison Reference Pattern Adapted To SealRail

The Madison video uses this pattern:

```text
Scattered platforms → Overwhelmed operator → Product reveal → Dashboard → Feature demo → Requests/social → Reports → AI/chat → CTA
```

SealRail should adapt it into:

```text
Unverified AI work → Buyer/payment risk → SealRail reveal → Proof rail dashboard → Run flow → Proof detail → Casper anchor → Marketplace/docs/API → CTA
```

The storytelling model is borrowed. The product substance and visual identity are SealRail's own.

---

## Target Video Length

Recommended duration:

```text
110–125 seconds
```

This matches the Madison reference length while keeping the demo tight enough for hackathon judges.

---

## Scene-by-Scene Claude Design Timeline

### Scene 1 — Opening Problem: Unverified Agent Work

**Time:** 0:00–0:10  
**Reference inspiration:** Madison starts with scattered marketing platforms.  
**SealRail adaptation:** show scattered AI work outputs and payment states.

Visual:

- Dark empty canvas
- Multiple floating cards drift in:
  - `AI invoice analysis`
  - `Risk score: 72`
  - `Output hash: pending`
  - `Payment: locked?`
  - `Verifier: missing`
  - `Buyer cannot audit this`
- Cards are disconnected at first, with broken thin rail lines.
- Use red micro-glows to mark uncertainty.

On-screen headline:

```text
AI agents can produce work.
But who proves it before money moves?
```

Voiceover/caption:

```text
AI agents can produce work, but buyers still need proof before payment moves.
```

Motion:

- Floating cards enter with slight stagger, 150ms apart
- Broken rail lines draw halfway, then stop
- Camera slowly pushes in from scale 0.96 to 1.02
- No frantic motion. Keep it premium and tense.

Purpose:

- Equivalent to Madison's scattered platform opening
- Immediately frames the problem as payment + proof risk

---

### Scene 2 — Human/Buyer Risk Moment

**Time:** 0:10–0:20  
**Reference inspiration:** Madison shows a business owner surrounded by marketing pain points.  
**SealRail adaptation:** show the buyer/operator surrounded by verification questions.

Visual:

- Center: abstract buyer/operator silhouette or simple terminal avatar, not cartoon
- Surrounding question chips:
  - `What task was requested?`
  - `What did the agent output?`
  - `Which verifier checked it?`
  - `Where is the proof anchored?`
  - `Why did payment unlock?`
- Background remains black with cream rail grid.

On-screen text:

```text
Paid agent work needs more than a nice answer.
```

Voiceover/caption:

```text
When money is attached to agent work, a nice answer is not enough.
```

Motion:

- Question chips orbit slightly, then align into a vertical proof checklist
- Checklist line draws top to bottom
- Red accent dot appears beside `payment unlock`

Purpose:

- Humanizes the risk without leaving SealRail's infrastructure aesthetic

---

### Scene 3 — SealRail Brand Reveal

**Time:** 0:20–0:28  
**Reference inspiration:** Madison logo reveal with simple brand lockup.  
**SealRail adaptation:** strong dark logo reveal using rail lines.

Visual:

- Broken lines from earlier snap into one continuous horizontal rail
- SealRail mark forms from line segments:
  - left rail
  - center seal circle
  - red Casper dot
  - right rail
- Wordmark appears: `SealRail`

Headline:

```text
No Proof without a Payment.
```

Voiceover/caption:

```text
SealRail is the payment rail for AI-agent work.
```

Motion:

- SVG stroke draw animation
- Red dot pulse once when the wordmark lands
- Subtle low-frequency camera push

Purpose:

- Clear product reveal, like Madison, but with SealRail's rail/seal identity

---

### Scene 4 — Product Overview / Dashboard Proof

**Time:** 0:28–0:40  
**Reference inspiration:** Madison reveals the dashboard early.  
**SealRail adaptation:** show actual landing/dashboard screenshot as product proof.

Primary reference:

```text
references/sealrail/00_landing_hero.png
```

Secondary reference:

```text
references/sealrail/00b_landing_sections.png
```

Visual:

- Large product screenshot floats on dark canvas
- Overlay callouts:
  - `Fund`
  - `Check`
  - `Record`
- Thin red rail line connects the three steps

Voiceover/caption:

```text
A buyer funds a task, an agent runs, and payment stays locked until proof is verified.
```

Motion:

- Screenshot scales from 0.88 to 1.0 with ease-out
- Callouts appear after screenshot settles
- Rail line draws left to right

Purpose:

- Establish real UI quickly, like Madison does with its dashboard

---

### Scene 5 — Reviewer Quickstart / Judge Fast Path

**Time:** 0:40–0:50  
**Reference inspiration:** Madison uses simple UI scenes to explain product value.  
**SealRail adaptation:** show the page judges can use to evaluate quickly.

Primary reference:

```text
references/sealrail/10_review_quickstart.png
```

On-screen label:

```text
Evaluate the full flow in 60 seconds.
```

Voiceover/caption:

```text
The review page gives judges a fast path through the live product, API, proof trail, and trust boundaries.
```

Motion:

- Screenshot slides up from bottom
- Three small labels fade in:
  - `Live app`
  - `Proof flow`
  - `Casper status`

Purpose:

- Make the demo judge-friendly

---

### Scene 6 — Run Flow: Task Funded → Agent Runs → Proof Verified

**Time:** 0:50–1:10  
**Reference inspiration:** Madison shows a clear workflow with cursor action.  
**SealRail adaptation:** show the core proof-gated run.

Primary reference:

```text
references/sealrail/05_run_flow_completed.png
references/sealrail/11_run_verified_output.png
```

Visual:

- Use the live run screenshot as the hero UI
- Add a large cursor that moves deliberately to the run/action area
- Show four stage cards as overlay:
  1. `Payment task created`
  2. `Agent output ready`
  3. `Proof verified`
  4. `Payment unlocked`

Voiceover/caption:

```text
The agent returns structured output, SealRail binds it to hashes, the verifier checks it, and only then does payment unlock.
```

Motion:

- Cursor click creates small red ring
- Stage cards light up one by one
- `Proof verified` uses green accent
- `Payment unlocked` uses Casper red pulse, not casino green

Purpose:

- This is the main product proof moment
- Equivalent to Madison's schedule/submit interaction

---

### Scene 7 — Proof Detail: Auditable Evidence

**Time:** 1:10–1:27  
**Reference inspiration:** Madison uses modal/detail screens to show feature depth.  
**SealRail adaptation:** show proof bundle details.

Primary reference:

```text
references/sealrail/06_proof_detail_tee_casper.png
```

Visual:

- Screenshot zooms into proof bundle area
- Highlight rows:
  - `proofId`
  - `inputHash`
  - `outputHash`
  - `verifier result`
  - `TEE Verification Mode`
  - `payment state: Payable`
  - `x402 receipt`

Voiceover/caption:

```text
Every run produces a proof page with the task context, hashes, verifier result, Casper state, and x402-compatible receipt.
```

Motion:

- Use a masked zoom into the proof object
- Hash rows get a mono-type shimmer / scanline highlight
- x402 receipt panel gets a red border pulse

Purpose:

- Make the proof tangible and auditable

---

### Scene 8 — Casper Anchor / On-Chain Proof

**Time:** 1:27–1:40  
**Reference inspiration:** Madison uses external/local search proof to show real-world visibility.  
**SealRail adaptation:** use Casper explorer as real external proof.

Primary reference:

```text
references/sealrail/07_casper_explorer_onchain_proof.png
```

Visual:

- Show Casper explorer screenshot
- Overlay label:

```text
Proof hash anchored on Casper testnet
```

- Highlight:
  - deploy hash
  - action: `anchor_proof`
  - timestamp
  - block / transaction hash

Voiceover/caption:

```text
SealRail records proof anchors on Casper, so the payment decision can be traced beyond the app screen.
```

Motion:

- Transition from proof detail to explorer using a rail-line wipe
- Deploy hash row highlights with red underline
- Small Casper red dot pulses at the anchor point

Purpose:

- Make Casper usage undeniable for hackathon judges

---

### Scene 9 — Marketplace / Multiple Agents

**Time:** 1:40–1:52  
**Reference inspiration:** Madison expands beyond one feature to show broader platform value.  
**SealRail adaptation:** show marketplace and multiple agent types.

Primary reference:

```text
references/sealrail/03_agents_marketplace.png
```

Visual:

- Show marketplace screenshot
- Overlay cards:
  - `Invoice Risk Agent`
  - `RWA Compliance Agent`
  - `Same proof-gated payment rail`

Voiceover/caption:

```text
SealRail is not one demo agent. The marketplace can host many paid agent services on the same proof-gated rail.
```

Motion:

- Listing cards slide in from left with 100ms stagger
- Rail line connects the listings back to a single `Proof Rail` node

Purpose:

- Shows ecosystem potential, not a one-off workflow

---

### Scene 10 — Verifiers, API, Keys, Docs

**Time:** 1:52–2:05  
**Reference inspiration:** Madison shows operational/reporting depth near the end.  
**SealRail adaptation:** show developer/infrastructure depth.

References:

```text
references/sealrail/04_verifiers.png
references/sealrail/08_docs_api_reference.png
references/sealrail/09_api_keys_management.png
```

Visual:

- Three-panel layout:
  - Verifier Registry
  - API Docs
  - API Keys
- Use zoomed crops rather than full unreadable screenshots

Voiceover/caption:

```text
Developers get verifier templates, scoped API keys, and REST endpoints for building proof-aware agent workflows.
```

Motion:

- Panels enter as a clean triptych
- Labels appear in JetBrains Mono
- Soft red line connects `Verifier` → `API` → `Task`

Purpose:

- Proves infrastructure and builder readiness

---

### Scene 11 — Status / Honest Trust Boundaries

**Time:** 2:05–2:15  
**Reference inspiration:** Madison ends with reports and confidence-building.  
**SealRail adaptation:** show status as trust-builder.

Primary reference:

```text
references/sealrail/01_status_casper_testnet.png
```

Visual:

- Show status page
- Highlight:
  - Backend API
  - LLM configured
  - Verifier
  - Casper testnet
  - Hosted TEE / TEE Verification Mode wording if visible

Voiceover/caption:

```text
The product is honest about what is live, what is testnet, and where the trust boundary sits.
```

Motion:

- Status rows reveal one by one
- Avoid green dot overuse; use text labels and thin red/cream rules

Purpose:

- Builds trust by avoiding overclaims

---

### Scene 12 — Final CTA / End Card

**Time:** 2:15–2:25  
**Reference inspiration:** Madison ends with simple URL CTA.  
**SealRail adaptation:** premium dark end card with live app and GitHub.

Visual:

- SealRail mark centered
- Rail line extends horizontally across the screen
- Text:

```text
SealRail
Proof-gated payment infrastructure for AI-agent work
```

CTA:

```text
Live: sealrail.vercel.app
GitHub: github.com/mystiquemide/sealrail
```

Voiceover/caption:

```text
That is SealRail: proof-gated payment infrastructure for AI-agent work.
```

Motion:

- Red center seal pulses once
- Wordmark fades in
- URLs appear last
- End on a clean still frame for 2 seconds

Purpose:

- Direct conversion path for judges and reviewers

---

## Caption System — Mandatory

Captions must be visible throughout the video. Judges may watch muted.

### Caption Bar Specs

```css
.caption-bar {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  min-height: 86px;
  background: rgba(8, 8, 8, 0.88);
  color: #F6F5F3;
  font-family: Inter, sans-serif;
  font-size: 30px;
  font-weight: 600;
  line-height: 1.25;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 0 120px;
  z-index: 1000;
}
```

Rules:

- Captions must never cover important proof/payment UI
- If needed, lift the screenshot 80–100px above the caption bar
- Max two lines
- Phrase-by-phrase or karaoke-style word reveal
- Caption text must match the voiceover exactly

---

## Voiceover / Caption Script

Use this exact script unless product facts need correction.

```text
AI agents can produce work, but buyers still need proof before payment moves.

When money is attached to agent work, a nice answer is not enough.

SealRail is the payment rail for AI-agent work.

A buyer funds a task, an agent runs, and payment stays locked until proof is verified.

The review page gives judges a fast path through the live product, API, proof trail, and trust boundaries.

The agent returns structured output, SealRail binds it to hashes, the verifier checks it, and only then does payment unlock.

Every run produces a proof page with the task context, hashes, verifier result, Casper state, and x402-compatible receipt.

SealRail records proof anchors on Casper, so the payment decision can be traced beyond the app screen.

SealRail is not one demo agent. The marketplace can host many paid agent services on the same proof-gated rail.

Developers get verifier templates, scoped API keys, and REST endpoints for building proof-aware agent workflows.

The product is honest about what is live, what is testnet, and where the trust boundary sits.

That is SealRail: proof-gated payment infrastructure for AI-agent work.
```

---

## Suggested `voiceoverMarkers` Array

Claude Design should implement a timeline like this:

```js
const voiceoverMarkers = [
  { time: 0, text: "AI agents can produce work, but buyers still need proof before payment moves." },
  { time: 10, text: "When money is attached to agent work, a nice answer is not enough." },
  { time: 20, text: "SealRail is the payment rail for AI-agent work." },
  { time: 28, text: "A buyer funds a task, an agent runs, and payment stays locked until proof is verified." },
  { time: 40, text: "The review page gives judges a fast path through the live product, API, proof trail, and trust boundaries." },
  { time: 50, text: "The agent returns structured output, SealRail binds it to hashes, the verifier checks it, and only then does payment unlock." },
  { time: 70, text: "Every run produces a proof page with the task context, hashes, verifier result, Casper state, and x402-compatible receipt." },
  { time: 87, text: "SealRail records proof anchors on Casper, so the payment decision can be traced beyond the app screen." },
  { time: 100, text: "SealRail is not one demo agent. The marketplace can host many paid agent services on the same proof-gated rail." },
  { time: 112, text: "Developers get verifier templates, scoped API keys, and REST endpoints for building proof-aware agent workflows." },
  { time: 125, text: "The product is honest about what is live, what is testnet, and where the trust boundary sits." },
  { time: 135, text: "That is SealRail: proof-gated payment infrastructure for AI-agent work." }
];
```

Adjust timestamps if the final animation is shorter or longer, but preserve the flow.

---

## Motion Design Rules Borrowed From Madison

Use these principles, not Madison's exact visuals.

### 1. Show Product Early

The product UI must appear by 30–40 seconds. Do not spend the whole intro on abstract motion.

### 2. Use UI As Evidence

Every feature claim should point to a real SealRail screenshot:

- Run flow for proof-gated payment
- Proof detail for hashes/receipt
- Casper explorer for on-chain anchor
- Marketplace for multiple agents
- Docs/API keys for developer readiness

### 3. Use Cursor Choreography Sparingly

Use one or two cursor actions only:

- Click `Run full flow`
- Open proof detail / highlight proof object

Cursor motion should be slow and deliberate. No frantic clicking.

### 4. Use Modal/Zoom Focus

For dense screenshots, use masked zooms and focus overlays:

- Proof hash rows
- x402 receipt panel
- Casper deploy hash
- payment state

### 5. Use Simple Scene Transitions

Preferred:

- Rail-line wipes
- Fade + scale
- Masked crop zoom
- Screenshot slide with easing

Avoid:

- Random 3D flips
- Purple blob transitions
- excessive particles
- casino-style Web3 effects

---

## Implementation Notes For Claude Design

### Screenshot Treatment

Use screenshots as real product evidence.

Recommended CSS:

```css
.product-shot {
  border-radius: 28px;
  border: 1px solid rgba(246,245,243,0.16);
  box-shadow:
    0 24px 80px rgba(0,0,0,0.52),
    0 0 0 1px rgba(255,45,45,0.08);
  overflow: hidden;
  background: #111;
}
```

For crop/zoom scenes:

```css
.shot-crop {
  transform-origin: center;
  animation: kenburns 8s cubic-bezier(0.22, 0.61, 0.36, 1) both;
}
```

### Rail Line System

Create reusable rail line elements:

```css
.rail-line {
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(246,245,243,.65), #FF2D2D, rgba(246,245,243,.65), transparent);
  transform-origin: left center;
}
```

If avoiding gradients strictly, use pseudo-elements with cream base line and red center dot.

### SealRail Mark

Create inline SVG. Do not use external logo unless available.

Concept:

- horizontal line left
- horizontal line right
- center seal circle
- red dot in center
- short vertical stem above center

### Accessibility

- Captions always visible
- High contrast text
- Reduce motion mode supported
- Text overlays readable at 1080p
- Do not place tiny proof hashes as the only readable evidence. Use zoom/highlight.

---

## Asset Checklist Needed Before Production

Already included in references:

- Madison reference contact sheet
- Madison larger keyframes
- SealRail landing screenshot
- SealRail run flow screenshots
- SealRail proof detail screenshot
- SealRail Casper explorer screenshot
- SealRail marketplace screenshot
- SealRail status screenshot
- SealRail docs/API screenshot
- SealRail API keys screenshot
- SealRail reviewer quickstart screenshot

Optional extras if available:

- Real SealRail logo SVG
- Original hero Sealkeeper image
- Latest screen recording of `/run`
- Voiceover WAV/MP3
- Casper testnet transaction URL
- GitHub repo URL

---

## Final Quality Bar

The output should feel like:

```text
A premium proof/payment infrastructure demo for hackathon judges, using the clarity of a SaaS explainer but the visual confidence of a dark fintech/Web3 product.
```

It should not feel like:

```text
A generic purple AI marketing SaaS clone.
```

Success criteria:

- Viewer understands the product in under 30 seconds
- Casper usage is visible and undeniable
- Proof-gated payment loop is visually memorable
- Captions make the video watchable muted
- Real SealRail screenshots anchor every major product claim
- Brand remains black/cream/red, precise, and infrastructure-grade

---

## Final Reminder To Claude Design

Use Madison as the **editorial skeleton**.

Use SealRail as the **brand, product, proof, and visual truth**.

Do not copy Madison. Translate the structure into SealRail's world.
