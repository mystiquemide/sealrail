# SealRail Animated Demo Video — Claude Design Prompt

## What to build

A single, self-contained HTML artifact that plays as a 3-minute animated product demo/ad for SealRail. It is a motion piece — not a clickable prototype. It plays automatically from start to finish with AI voiceover audio cues, synchronized **on-screen captions/subtitles**, kinetic typography, screen zooms, and timed scene transitions.

**Captions are mandatory.** Every voiceover line must appear as readable on-screen text at the bottom of the canvas. Judges may watch on mute. Captions must be large enough to read (28–32px, Inter 600), white (#F6F5F3) on a semi-transparent dark bar (#080808 at 85%), synced to the voiceover word by word or phrase by phrase (karaoke-style). Captions appear 0.2s before the voice speaks each line and disappear 0.3s after.

## Judge Requirements (CRITICAL)

This product MUST prove to judges that:

1. **It really works** — real Casper testnet deploys, real on-chain proof anchors, real verifier output
2. **It uses Casper** — Casper explorer links, Casper testnet mode, ProofRegistry contract, anchor_proof actions
3. **It has real agents** — multiple agent types, marketplace listings, LLM-powered runtimes
4. **It supports multiple LLMs** — the docs show provider configuration, the app can plug any LLM
5. **It has TEE support** — TEE Verification Mode, WASM hashes, attestation hashes
6. **It has APIs** — full REST API with scoped API keys, quickstart, code examples
7. **It has x402 protocol support** — 402-style receipts, payment-required semantics
8. **It looks professional** — dark SaaS aesthetic, premium fintech feel, not generic

## Reference Screenshots (ALL must be studied before building)

These are actual live screenshots of the working SealRail product. Every visual element in the animation must be faithful to the real UI shown here:

### 00 — Landing Page Hero
![Landing page hero: The Sealkeeper illustration, "The rail between agent work and agent payment" headline, three-step flow (Fund, Check, Record), Nav with Proofs/Agents/API/Docs links, CTA buttons](screenshots/00_landing_hero.png)

### 00b — Landing Page Sections
![Scrolled landing page: RWA invoice verification, proof explorer link, verification before settlement, pay agents only after proof, architecture link, full footer with GitHub/Casper/TEE links](screenshots/00b_landing_sections.png)

### 01 — System Status
![Status page showing Casper testnet mode, ProofRegistry contract deployed, LLM configured, Database connected, Backend API, Hosted TEE](screenshots/01_status_casper_testnet.png)

### 02 — Proof Explorer
![Proofs page with payment-backed tasks, proof states, Verified/Pending/Blocked/Paid status filters, TEE Verification Mode filter](screenshots/02_proofs_explorer.png)

### 03 — Agent Marketplace
![Agent listings with task types, verifier functions, proof modes, start run buttons, view proofs links](screenshots/03_agents_marketplace.png)

### 04 — Verifier Registry
![Verifier templates defining how agent outputs are checked, register verifier button](screenshots/04_verifiers.png)

### 05 — Live Run Flow (Completed)
![Full proof rail completed: Payment task created, Agent output ready, Proof verified, Payment unlocked. Casper deploy hash visible. TEE Verification Mode badge](screenshots/05_run_flow_completed.png)

### 06 — Proof Detail with TEE and Casper
![Proof bundle JSON: TEE mode, WASM hash, attestation hash, Casper anchor, x402 receipt, payment state Payable, decision text, verifier identity](screenshots/06_proof_detail_tee_casper.png)

### 07 — Casper Blockchain Explorer
![Real on-chain transaction on testnet.cspr.live: anchor_proof action, timestamp, caller address, CSPR gas paid, block hash, transaction hash](screenshots/07_casper_explorer_onchain_proof.png)

### 08 — API Documentation
![Full docs page: Quickstart, core concepts, product flow, LLM agent runtime, API reference with code examples (cURL/JSON), API key creation, task creation, agent output, status endpoint](screenshots/08_docs_api_reference.png)

### 09 — API Key Management
![API keys page with scoped keys for task, proof, agent, and workflow APIs, create key and revoke buttons](screenshots/09_api_keys_management.png)

### 10 — Reviewer Quickstart
![Review page: Evaluate Sealrail in 60 seconds, fast path, ecosystem fit, proof-gated AI and RWA payment infrastructure overview](screenshots/10_review_quickstart.png)

### 11 — Run Flow with Verified Output
![Scrolled run page showing verified agent output: risk score, decision, reasoning, flags, recommended action, output hash, full proof bundle below](screenshots/11_run_verified_output.png)

---

## Output format

- One file: `SealRail Demo Video.html`
- Self-contained CSS in `<style>`, JS in `<script>`
- Audio: Web Audio API or `<audio>` elements with AI voiceover files (use placeholder audio URLs and document where to inject real TTS tracks)
- **Captions: on-screen subtitle bar at bottom of canvas (see Caption System below)**
- 1920×1080 canvas, 16:9, scales to fit viewport
- Keyboard: SPACE to play/pause, LEFT/RIGHT to seek ±5s, R to restart
- Progress bar at bottom
- Includes `prefers-reduced-motion` fallback (snap to keyframes without tweening)

### Caption System (REQUIRED)

A permanent caption bar at the bottom of the 1920×1080 canvas:

```
┌─────────────────────────────────────────────────────────┐
│                   (video content)                        │
│                                                         │
│                                                         │
├─────────────────────────────────────────────────────────┤
│  ██████████████████████████████████████████████████████  │  ← dark bar, #080808 85% opacity
│  No proof, no payment. SealRail is a proof-gated pay... │  ← Inter 600, 30px, #F6F5F3
└─────────────────────────────────────────────────────────┘
```

Specs:
- Bar: full-width, 80px tall, #080808 at 85% opacity, sits at bottom of canvas
- Text: Inter 600, 30px, #F6F5F3, vertically centered in bar, horizontally centered
- Max 2 lines. If a line is too long, break at a natural pause point
- Words appear with a subtle fade-in (50ms per word, karaoke-style) — currently spoken word is brighter (#FFFFFF), upcoming words are dimmer (#A8A8A6)
- Captions appear 0.2s before voiceover begins each phrase
- Captions disappear 0.3s after voiceover finishes each phrase
- Between phrases: bar stays visible but empty (no jarring show/hide)
- Implementation: use the `voiceoverMarkers` array below — each marker's `text` field IS the caption text. Sync caption display to `time` field.

The caption bar must NEVER overlap critical visual content. When a scene has important content at the bottom (e.g., the proof rail cards), temporarily raise the caption bar by 20px with a smooth transition, or make the caption background fully opaque #080808.

---

## Brand System

### Colors

```
--sr-black:       #080808   (canvas background)
--sr-ink:         #111111   (cards, panels)
--sr-soft-white:  #F6F5F3   (primary text, rails, linework)
--sr-muted:       #888888   (secondary text)
--sr-casper-red:  #FF2D2D   (accent, CTAs, proof core, signal)
--sr-proof-green: #64D96B   (success states, verified badges)
--sr-risk-red:    #F45B45   (warning/risk states)
--sr-warm-gray:   #F0EFED   (rare, light surfaces)
--sr-api-blue:    #3C8DFF   (sparingly, API/docs references)
```

### Typography

```
Headlines:  Inter, 400–600 weight, tight letter-spacing (-0.015em)
Body:       Inter, 400 weight
Mono:       JetBrains Mono, 400–500 (for hashes, states, technical labels)
Serif:      Georgia (for pull quotes or editorial moments — very sparing)
```

### Logo (SealrailMark)

An SVG icon: horizontal rails left and right, center circle with red (#FF2D2D) dot, vertical stem above. Viewbox 30×22. Always paired with the wordmark "Sealrail" in Inter 600.

Render this inline in every scene that needs it. Do NOT use an external image.

### Design posture

- Dark canvas, red accent, cream-white type
- Glassmorphism cards: dark semi-transparent backgrounds with soft white borders, 24–34px border-radius
- No gradients. Glow comes from box-shadows and lighting in the composition, not CSS gradients.
- Massive negative space. Sections breathe.
- No emojis. No stock illustrations. No fake metrics.
- Clean, precise, fintech-meets-Web3 aesthetic.

---

## Animation Principles (global)

- **Easing**: Prefer `cubic-bezier(0.22, 0.61, 0.36, 1)` for entries, `cubic-bezier(0.55, 0, 1, 0.45)` for exits.
- **Speed**: Fast UI reveals (200–400ms), medium product zooms (600–1000ms), slow atmospheric pans (1500–2500ms).
- **Zoom effects**: Product screens zoom in with ken burns effect (scale 0.85→1.05→1.0 over 2s on enter), then subtle drift (translate ±8px over 6s) to feel alive.
- **Layering**: Foreground text/CTAs always animate last in a scene. Background atmosphere starts first.
- **Red pulse**: The Casper red (#FF2D2D) should pulse subtly (opacity 1 → 0.7 → 1 over 3s) on key moments: proof anchor, payment unlock, logo reveals.
- **Rail lines**: Thin (1–2px) cream-white horizontal or vertical lines act as visual rails connecting elements. They draw in with a left-to-right or bottom-to-top stroke animation.
- **Judge wow moments**: Every 20-30 seconds, hit them with a kinetic text reveal, a dramatic screen zoom, or a synchronized glow pulse that punctuates the narrative.

---

## Scene Breakdown (3 minutes total)

Each scene lists:
- Duration
- Visual composition
- Animation details (zoom, speed, direction, stagger)
- Voiceover line
- Logo presence
- Reference screenshot to match

### SCENE 0 — Cold open (0:00–0:08)

**Duration**: 8 seconds

**Visual**:
- Pure #080808 black canvas.
- Center: SealRailMark (SVG logo, large, ~200px equivalent) fades in over 1.5s from opacity 0.
- Below it: "Sealrail" wordmark fades in 0.4s after the mark, Inter 600, 64px, #F6F5F3.
- Subtle red glow behind the mark, breathing slowly.

**Animation**:
- Background: nothing. Pure black.
- Mark: `opacity 0 → 1`, duration 1.5s, ease-out.
- Wordmark: `opacity 0 → 1`, duration 0.6s, starts at 0.8s.
- Red glow: `box-shadow` pulse, 0 0 60px rgba(255,45,45,0.3) → 0 0 100px rgba(255,45,45,0.5) → back, 3s loop.

**Voiceover**: (silent for first 2s, then) "This is Sealrail."

**Logo**: Full mark + wordmark, center stage.

---

### SCENE 1 — The problem (0:08–0:32)

**Duration**: 24 seconds

**Visual**:
- Logo shrinks and moves to top-left corner (becomes nav-style: 28px mark + "Sealrail" at 28px).
- Canvas stays #080808.
- Center: large headline fades in, one line at a time, with kinetic stagger:

  Line 1: "AI agents are starting" (Inter 600, 72px, #F6F5F3)
  Line 2: "to do paid work." (Inter 600, 72px, #F6F5F3)
  Line 3: "But 'the agent replied'" (Inter 600, 72px, #F6F5F3)
  Line 4: "is not proof." (Inter 600, 72px, #FF2D2D — RED)

- Below the headline: four bullet cards slide up with stagger (each 0.2s apart, slide from +80px below to final position):

  Card 1: "Invoice review"
  Card 2: "Vendor risk checks"
  Card 3: "Compliance workflows"
  Card 4: "Agent marketplaces"

  Each card: #111111 background, 1px #F6F5F3 at 15% border, 24px radius, 320×72px. Text inside: Inter 400, 28px, #F6F5F3.

**Animation**:
- Logo: `transform scale(0.35)` + `translate(-860px, -480px)`, duration 0.8s, starts immediately.
- Line 1: `opacity 0→1` + `translateY(30px→0)`, starts 0.5s, duration 0.5s.
- Line 2: same, starts 1.0s.
- Line 3: same, starts 1.6s.
- Line 4: same but RED with scale pop (1.05→1), starts 2.2s, duration 0.6s.
- Bullet cards: slide up with stagger, start at 3.5s.

**Voiceover**: "AI agents are starting to do paid work. They review invoices. They check vendors. They handle compliance. They serve marketplaces. But when an agent says the work is done — is that enough? 'The agent replied' is not proof."

**Logo**: Top-left, small.

---

### SCENE 2 — Product answer (0:32–0:52)

**Duration**: 20 seconds

**Visual**:
- Headline and bullets fade out over 0.5s.
- Large centered text appears with dramatic zoom:

  "No proof," (Inter 600, 130px, #F6F5F3)
  "no payment." (Inter 600, 130px, #FF2D2D — RED, slightly below)

- Below it, subtitle fades in:

  "SealRail is a proof-gated payment rail for AI agents."
  Inter 400, 36px, #888888.

- Three badges appear in a row below:

  [CASPER TESTNET] [TEE VERIFICATION] [X402-COMPATIBLE]
  Small glass pills, #FF2D2D text, #111111 bg.

- A thin horizontal rail line draws from center outward (left and right simultaneously), cream-white, 1px, 700px wide.

**Animation**:
- Old content: fade out 0.4s.
- "No proof,": `opacity 0→1` + `scale(1.15→1)`, duration 0.8s, cubic-bezier(0.34, 1.56, 0.64, 1).
- "no payment." (red): same, starts 0.25s after first line, with red glow pulse on land.
- Subtitle: `opacity 0→1`, duration 0.6s, starts 0.8s after "no payment."
- Badges: fade in + scale(0.9→1), stagger 0.15s.
- Rail line: stroke-dashoffset draw from center, duration 1.5s, cream-white.

**Voiceover**: "No proof, no payment. SealRail is a proof-gated payment rail for AI agents. Built on Casper. TEE-verified. X402-compatible. Here's how it works."

**Logo**: Top-left, persistent.

---

### SCENE 3 — The proof rail (0:52–1:32)

**Duration**: 40 seconds — THE KEY JUDGE SCENE

**Visual**:
- Canvas clears to #080808.
- Five connected cards appear left to right, representing the proof rail:

```
[01 PAYMENT INTENT] → [02 AGENT OUTPUT] → [03 VERIFIER CHECK] → [04 CASPER ANCHOR] → [05 PAYMENT UNLOCK]
```

- Cards: #111111 background, #F6F5F3 at 10% border, 30px radius, 300×180px.
- Card number (01–05): JetBrains Mono, 24px, #FF2D2D, top-left inside card.
- Card title: Inter 600, 28px, #F6F5F3.
- Card state label: JetBrains Mono, 18px, #888888 initially.
- Arrows between cards: red (#FF2D2D) chevrons, 2px, animated.

**Animation — builds step by step with visual drama**:

1. **Card 01** (0:52–0:57): Slides in from left with scale pop (0.85→1.05→1.0), opacity 0→1. State label flips from "WAITING" to "CREATED" in #64D96B with typewriter effect over 0.4s. A green checkmark ✓ draws in next to the state.

2. **Arrow 1→2** (0:57–0:59): Draws in from left to right, red line with animated dash.

3. **Card 02** (1:00–1:05): Same entrance animation. State: "READY". An AI agent silhouette icon pulses inside the card.

4. **Arrow 2→3** (1:05–1:07): Draws in.

5. **Card 03** (1:08–1:13): Same entrance. State: "PASSED". A TEE shield icon appears with green glow. Show: "TEE Verification Mode" badge.

6. **Arrow 3→4** (1:13–1:15): Draws in.

7. **Card 04** (1:16–1:23): Same entrance but THIS card gets special treatment — red glow pulse on entry, "CASPER ANCHOR" label in #FF2D2D, state: "RECORDED" in green. The Casper logo/Casper-style hexagon appears. A deploy hash appears below in mono: `3d6388c7...1d4db6` with typewriter effect. This card zooms slightly (1.0→1.03) and holds — drawing attention.

8. **Arrow 4→5** (1:23–1:25): Draws in with red pulse.

9. **Card 05** (1:26–1:32): State label animates from "LOCKED" (#F45B45) → "UNLOCKED" (#64D96B) with a dramatic color wipe transition over 0.6s. A green (#64D96B) glow ring EXPANDS outward from the card (0→80px) and fades, done twice for emphasis. The word "PAID" appears large over the card in green, then fades to the normal state label.

**Animation details**:
- Card entrance: `opacity 0→1`, `transform translateX(-50px) → 0`, `scale(0.88→1.03→1.0)`, duration 0.6s each.
- Arrow draw: stroke-dashoffset animation, duration 0.4s.
- Card 04 zoom emphasis: subtle scale 1.0→1.03, holds 2s, returns to 1.0.
- Card 05 unlock glow: `box-shadow` expanding ring, done twice, 1.0s apart.

**Voiceover**: "Here's the full proof rail. Watch this. A payment-backed task is created. The AI agent does the work — powered by a configurable LLM runtime. A verifier checks that output independently using TEE-compatible verification. Then — and this is what matters for Casper — the proof gets anchored on-chain. You can verify it right now on the Casper testnet explorer. Only after the anchor is confirmed does payment unlock. Five steps. Agent work to verifiable payment on Casper."

**Logo**: Top-left, persistent.

**Reference**: Match screenshots 05 and 11 for the run flow look, and 07 for the Casper explorer.

---

### SCENE 4 — Product screens montage (1:32–2:14)

**Duration**: 42 seconds

**Visual style**: This section mimics real product screens at high fidelity, with dramatic zoom and pan effects. Each screen is a faithful HTML/CSS recreation matching the reference screenshots.

#### Screen 4a — Docs / API Reference (1:32–1:44)

**Visual**:
- Recreate the docs page (match screenshot 08): Quickstart section, API code examples with cURL/JSON, LLM agent runtime section, product flow steps.
- Show the API code block: `POST /api/tasks/{taskId}/run` with the JSON body.

**Animation**:
- Screen zooms in: scale 0.75→1.0 over 1.2s (ken burns).
- A cursor moves over the API code, highlighting lines.
- A red underline draws beneath "LLM agent runtime".
- A badge pulses: "MULTIPLE LLM SUPPORT".

**Voiceover**: "SealRail has a full REST API. Scoped API keys. Agents can use any LLM provider — the runtime is configurable. Tasks, proofs, payments — all accessible through clean endpoints."

**Reference**: Screenshot 08.

#### Screen 4b — Agent Marketplace (1:44–1:54)

**Visual**:
- Recreate the agents page (match screenshot 03): agent cards in a grid, each with agent name, description, proof requirement, price.
- Show multiple agent types.

**Animation**:
- Crossfade from docs.
- Cards appear with stagger (left to right, 0.1s apart).
- One card lifts and scales up (1.0→1.08) with red border glow.
- Label appears: "MULTIPLE AGENT TYPES — LLM-POWERED".

**Voiceover**: "Multiple agent types are listed on the marketplace. Each one maps to a task type, a verifier function, and a proof mode. Buyers know exactly what they're paying for."

**Reference**: Screenshot 03.

#### Screen 4c — Live Run Flow (1:54–2:04)

**Visual**:
- Recreate the run page (match screenshots 05 and 11): task input on the left, proof rail status on the right.
- Show the completed state with all 4 steps done.
- Casper deploy hash visible: "Mode: testnet · deploy: 3d6388c7..."

**Animation**:
- Crossfade from marketplace.
- The proof rail steps light up one by one rapidly (0.25s each).
- Green checkmarks appear with pop animation.
- The Casper anchor hash glows red briefly.
- A dramatic zoom into the proof rail area: scale 1.0→1.3 over 1s, focusing on "CASPER ANCHOR" and the deploy hash.
- Zoom back out to full view.

**Voiceover**: "Here's a live run. Invoice task created, agent output ready, proof verified, and — look — the Casper deploy hash. This is real. This is on-chain. Payment unlocked."

**Reference**: Screenshots 05 and 11.

#### Screen 4d — Proof Detail + Casper Explorer (2:04–2:14)

**Visual**:
- Split screen: left side is the proof detail page (match screenshot 06), right side is the Casper explorer (match screenshot 07).
- Left: proof bundle JSON with TEE mode, WASM hash, attestation hash, Casper anchor, x402 receipt.
- Right: testnet.cspr.live showing the `anchor_proof` transaction with timestamp, caller, gas.

**Animation**:
- Crossfade from run flow.
- Left side: proof bundle JSON types in with typewriter effect, mono font, character by character, focusing on key fields.
- Right side: Casper explorer zooms in on the transaction hash, action "anchor_proof", and timestamp.
- A red connecting line draws between the Casper anchor on the left and the explorer transaction on the right — visually proving they're linked.
- Both sides pulse together in red sync.

**Voiceover**: "This is the proof bundle. TEE verification mode. WASM code hash. Attestation hash. Casper anchor. And here — this exact transaction on the Casper testnet explorer. anchor_proof. Real gas paid. Real on-chain. Real timestamp. The product works."

**Reference**: Screenshots 06 and 07.

---

### SCENE 5 — Why Casper (2:14–2:38)

**Duration**: 24 seconds

**Visual**:
- Screens fade out.
- Dark canvas. Center: a split composition.

  Left side (55% width):
  - A stylized node network representing Casper blockchain.
  - Red proof hash core glowing at the center.
  - Thin white lines (rails) connecting to it.
  - Labels sliding in with red dashes:

    "Private data stays in the app layer"
    "Proof hashes anchor on Casper"
    "Payment state responds to proof validity"
    "External reference point for audit"
    "Multiple LLM providers supported"

  Right side (45% width):
  - Large Casper-style hexagon icon, cream-white outline, red center dot.
  - Below it: "Built on Casper" in Inter 600, 44px.
  - Below that: "Testnet verified" in Inter 400, 24px, #64D96B.
  - Below that: tiny deploy hash in mono.

**Animation**:
- Node network draws in: nodes appear with stagger (0.15s each), lines draw between them.
- Red core at center pulses: `box-shadow` 0 0 40px → 0 0 100px → back, 2s loop.
- Labels slide in from left, one by one (0.4s stagger), each with a small red dash before the text.
- Right side hexagon: fades in, then slowly rotates 12° over 10s (subtle, premium).
- Green "Testnet verified" badge pulses.

**Voiceover**: "Why Casper? SealRail needs an external proof anchor for paid agent work. Private task data stays in the app layer. But proof hashes, verifier identity, and payment state get anchored on Casper. That gives buyers an auditable reference point that the app alone cannot provide. And because the agent runtime is LLM-agnostic, you can plug in any provider. Casper makes the proof trail stronger. Multiple LLMs make the agent smarter."

**Logo**: Top-left.

---

### SCENE 6 — Full ecosystem (2:38–2:52)

**Duration**: 14 seconds

**Visual**:
- Dark canvas.
- Eight use case cards appear in a 2×4 grid, fading in with stagger.

  Layout: #111111 cards, 1px #F6F5F3 at 12% border, 20px radius, 240×100px.

  | Invoice review | Vendor risk |
  | Compliance workflows | RWA verification |
  | Paid API agents | Agent marketplaces |
  | Document verification | Procurement |

- Each card: title in Inter 600, 22px, #F6F5F3.
- A thin red circuit/rail pattern flows between all cards, connecting them.
- Grid appears row by row with dramatic zoom: each row starts at scale 0.8 and pops to 1.0.

**Animation**:
- Cards: `opacity 0→1` + `translateY(30px→0)` + `scale(0.85→1.0)`, duration 0.4s each, stagger 0.12s.
- Rail line between cards: draws in (stroke-dashoffset) after cards appear, duration 0.6s.
- Final pulse: all cards briefly glow red together, then settle.

**Voiceover**: "Where does SealRail fit? Invoice review. Vendor risk checks. Compliance workflows. RWA verification. Paid API agents. Agent marketplaces. Document verification. Procurement. Any workflow where an AI agent does paid work and the buyer needs proof before payment moves. Built on Casper. Powered by configurable LLMs."

**Logo**: Top-left.

---

### SCENE 7 — Closing with proof (2:52–3:05)

**Duration**: 13 seconds

**Visual**:
- All cards fade out.
- Center stage: SealRailMark (large, ~180px) with red glow.
- Below it, stacked with dramatic spacing:

  "No proof, no payment."
  Inter 600, 90px, #F6F5F3. "no payment." in red (#FF2D2D).

- Below that, three proof badges in a row:

  [✓ Casper Testnet Verified] [✓ TEE Verification] [✓ X402 Compatible]

- Below that:

  "sealrail.vercel.app"
  JetBrains Mono, 28px, #888888.

- A thin horizontal rail line draws beneath the URL.

- Small text at very bottom:

  "Built for the Casper Agentic Buildathon 2026"
  Inter 400, 18px, #888888, 40% opacity.

- Right before fade-out: a Casper explorer URL appears briefly with the real deploy hash, then fades:

  "Verify on-chain: testnet.cspr.live/deploy/3d6388c7..."
  JetBrains Mono, 14px, #888888, 60% opacity.

**Animation**:
- Mark: fade in + scale 1.12→1, duration 0.8s, cubic-bezier(0.34, 1.56, 0.64, 1).
- Tagline: fade in + translateY(16px→0), staggered.
- Badges: fade in with stagger 0.2s, each with a subtle scale pop.
- URL: fade in, duration 0.6s.
- Rail line: draw from center outward, duration 0.8s.
- Red glow on mark: pulse twice gently over the 13s.
- Explorer URL: fade in at 2.5s before end, hold 2s, fade out.
- Final 1s: everything fades to black except the red dot in the logo, which holds for 0.5s then fades.

**Voiceover**: "SealRail. No proof, no payment. Real product. Real Casper. Real on-chain proof. Built for the Casper Agentic Buildathon."

**Logo**: Full mark + wordmark, center, large.

**End state**: Hold on black for 1s after voiceover ends.

---

## Voiceover Guide

- **Voice**: AI-generated, neutral American or British English, clear and calm. No dramatic movie-trailer voice. Sound like a product narrator explaining something genuinely impressive.
- **Pacing**: Steady, ~150 words per minute. Pause 0.5s between scenes. Let key lines breathe — "No proof, no payment." should have 1s pause after.
- **Tone**: Confident, clear, not rushed. The product speaks for itself. When mentioning Casper or on-chain proof, slight emphasis for judge impact.
- **Implementation**: Use Web Audio API with pre-generated TTS audio files. Placeholder: use silent audio buffers of correct duration. Document where to inject real TTS tracks (ElevenLabs or OpenAI TTS).

### Audio sync markers

```js
const voiceoverMarkers = [
  { time: 2.0,   text: "This is Sealrail." },
  { time: 8.0,   text: "AI agents are starting to do paid work..." },
  { time: 32.0,  text: "No proof, no payment..." },
  { time: 52.0,  text: "Here's the full proof rail. Watch this..." },
  { time: 92.0,  text: "SealRail has a full REST API..." },
  { time: 104.0, text: "Multiple agent types are listed..." },
  { time: 114.0, text: "Here's a live run..." },
  { time: 124.0, text: "This is the proof bundle..." },
  { time: 134.0, text: "Why Casper?..." },
  { time: 158.0, text: "Where does SealRail fit?..." },
  { time: 172.0, text: "SealRail. No proof, no payment..." },
];
```

---

## Technical Requirements

### HTML structure

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>SealRail — No Proof without a Payment</title>
  <meta name="author" content="@MystiqueMide">
  <style>/* all styles */</style>
</head>
<body>
  <div id="canvas">
    <!-- all scenes as absolutely positioned layers -->
  </div>
  <div id="progress-bar"><div id="progress-fill"></div></div>
  <div id="controls">SPACE play/pause · ← → seek · R restart</div>
  <script>/* all animation + timeline */</script>
</body>
</html>
```

### Timeline engine

Use `requestAnimationFrame` with a master timeline clock. Each scene is a function that takes `(elapsed, sceneStartTime, canvasEl)` and manipulates DOM elements directly. Use a scene manager.

### Animation utilities

Provide helpers:
```js
function tween(obj, prop, from, to, duration, easing, startTime, currentTime)
function stagger(elements, animation, staggerDelay)
function drawLine(el, duration) // SVG stroke-dashoffset
function typewriter(el, text, duration)
function pulse(el, intensity, duration) // box-shadow glow
function kenBurns(el, fromScale, toScale, duration) // screen zoom
function colorWipe(el, fromColor, toColor, duration) // for LOCKED→UNLOCKED
```

### SVG logo

```js
function createLogo({ x, y, scale = 1, accent = '#FF2D2D', stroke = '#F6F5F3' }) {
  // return SVG element (30×22 viewbox scaled)
}
```

### Responsive fallback

- 1920×1080 canvas scales to fit viewport using CSS `transform: scale()`.
- On `prefers-reduced-motion`, snap all elements to final positions instantly.
- On viewports narrower than 1024px, show "Best viewed on desktop" and still render at reduced scale.

### Performance

- No more than 35 animated elements on screen at once.
- Use `will-change: transform, opacity` on moving elements.
- Use `contain: layout style paint` on scene containers.
- Cap at 60fps.

---

## What NOT to do

- Do NOT use gradients as a substitute for composition.
- Do NOT add fake testimonials, fake users, or fake metrics.
- Do NOT use emojis anywhere.
- Do NOT make the video require user clicks to advance (it autoplays).
- Do NOT use external CDN dependencies for core rendering.
- Do NOT add scenes beyond the 7 specified above.
- Do NOT use generic SaaS clipart or stock illustration style.
- Do NOT make the AI voiceover sound like a movie trailer voice.
- Do NOT skip the Casper explorer evidence — judges need to see the on-chain proof.
- Do NOT hide the deploy hashes — show them.
- Do NOT skip captions — judges may watch on mute. Every voiceover line must have on-screen text.

---

## Verification checklist

Before delivering:
- [ ] File opens in browser with no console errors
- [ ] SPACE toggles play/pause
- [ ] LEFT/RIGHT seek works
- [ ] R restarts from beginning
- [ ] All 7 scenes render with correct timing
- [ ] Logo is visible in every scene
- [ ] Red (#FF2D2D) accent is used consistently
- [ ] Casper explorer URL/deploy hash is shown in Scene 4d and Scene 7
- [ ] No text overflows or is clipped at 1920×1080
- [ ] `prefers-reduced-motion` is respected
- [ ] Total runtime is 185s ±5s
- [ ] Zoom effects are visible on product screens
- [ ] Green glow pulse on payment unlock
- [ ] Red glow pulse on Casper anchor
- [ ] **Captions are visible and synced to voiceover — karaoke-style word highlighting works**
- [ ] **Caption bar does not overlap critical content in any scene**
- [ ] **All 11 voiceover markers have corresponding caption text**

---

## File to produce

`/root/sealrail/audit-deliverables/SealRail Demo Video.html`

Self-contained. Ready to open in a browser. Judges should be wowed.
