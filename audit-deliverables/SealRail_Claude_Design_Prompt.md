# SealRail Animated Demo Video — Claude Design Prompt

## What to build

A single, self-contained HTML artifact that plays as a 3-minute animated product demo/ad for SealRail. It is a motion piece — not a clickable prototype. It plays automatically from start to finish with AI voiceover audio cues, synchronized animations, and timed scene transitions.

## Output format

- One file: `SealRail Demo Video.html`
- Self-contained CSS in `<style>`, JS in `<script>`
- Audio: Web Audio API or `<audio>` elements with AI voiceover files (use placeholder audio URLs and document where to inject real TTS tracks)
- 1920×1080 canvas, 16:9, scales to fit viewport
- Keyboard: SPACE to play/pause, LEFT/RIGHT to seek ±5s, R to restart
- Progress bar at bottom
- Includes `prefers-reduced-motion` fallback (snap to keyframes without tweening)

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
- **Layering**: Foreground text/C TAs always animate last in a scene. Background atmosphere starts first.
- **Red pulse**: The Casper red (#FF2D2D) should pulse subtly (opacity 1 → 0.7 → 1 over 3s) on key moments: proof anchor, payment unlock, logo reveals.
- **Rail lines**: Thin (1–2px) cream-white horizontal or vertical lines act as visual rails connecting elements. They draw in with a left-to-right or bottom-to-top stroke animation.

---

## Scene Breakdown (3 minutes total)

Each scene lists:
- Duration
- Visual composition
- Animation details (zoom, speed, direction, stagger)
- Voiceover line
- Logo presence

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

### SCENE 1 — The problem (0:08–0:30)

**Duration**: 22 seconds

**Visual**:
- Logo shrinks and moves to top-left corner (becomes nav-style: 28px mark + "Sealrail" at 28px).
- Canvas stays #080808.
- Center: large headline fades in, one line at a time:

  Line 1: "AI agents are starting"
  Line 2: "to do paid work."
  Line 3: "But 'the agent replied'"
  Line 4: "is not proof."

- Line 4 appears in Casper red (#FF2D2D), the rest in #F6F5F3.
- Below the headline: three bullet cards slide up with stagger (each 0.2s apart, slide from +60px below to final position):

  Card 1: "Invoice review"
  Card 2: "Vendor risk checks"
  Card 3: "Compliance workflows"

  Each card: #111111 background, 1px #F6F5F3 at 15% border, 24px radius, 320×72px. Text inside: Inter 400, 28px, #F6F5F3.

**Animation**:
- Logo: `transform scale(0.35)` + `translate(-860px, -480px)`, duration 0.8s, starts immediately.
- Line 1: `opacity 0→1` + `translateY(20px→0)`, starts 0.5s, duration 0.5s.
- Line 2: same, starts 1.0s.
- Line 3: same, starts 1.5s.
- Line 4: same but RED, starts 2.0s.
- Bullet cards: slide up with stagger, start at 3.0s.

**Voiceover**: "AI agents are starting to do paid work. They review invoices. They check vendors. They handle compliance. But when an agent says the work is done — is that enough? 'The agent replied' is not proof."

**Logo**: Top-left, small.

---

### SCENE 2 — Product answer (0:30–0:50)

**Duration**: 20 seconds

**Visual**:
- Headline and bullets fade out.
- Large centered text appears:

  "No proof,"
  "no payment."

  Stacked, Inter 600, 120px, #F6F5F3. "no payment." in red (#FF2D2D).

- Below it, subtitle fades in:

  "SealRail is a proof-gated payment rail for AI agents."

  Inter 400, 36px, #888888.

- A thin horizontal rail line draws from center outward (left and right simultaneously), cream-white, 1px, 600px wide, centered below the subtitle.

**Animation**:
- Old content: fade out 0.4s.
- "No proof,": `opacity 0→1` + `scale(1.08→1)`, duration 0.7s, ease-out-back feel.
- "no payment." (red): same, starts 0.3s after first line.
- Subtitle: `opacity 0→1`, duration 0.6s, starts 0.7s after "no payment."
- Rail line: stroke-dashoffset draw from center, duration 1.2s.

**Voiceover**: "No proof, no payment. SealRail is a proof-gated payment rail for AI agents. Here's how it works."

**Logo**: Top-left, small, persistent.

---

### SCENE 3 — The proof rail (0:50–1:30)

**Duration**: 40 seconds

**Visual**:
- Canvas clears to #080808.
- Five connected cards appear left to right, representing the proof rail:

```
[01 PAYMENT INTENT] → [02 AGENT OUTPUT] → [03 VERIFIER CHECK] → [04 CASPER ANCHOR] → [05 PAYMENT UNLOCK]
```

- Cards: #111111 background, #F6F5F3 at 10% border, 30px radius, 340×200px.
- Card number (01–05): JetBrains Mono, 24px, #FF2D2D, top-left inside card.
- Card title: Inter 600, 32px, #F6F5F3.
- Card state label: JetBrains Mono, 20px, #888888 initially.
- Arrows between cards: red (#FF2D2D) chevrons or lines, 2px.

**Animation — builds step by step**:

1. Card 01 appears (0:50–0:54): slides in from left, scale 0.9→1, opacity 0→1. State label reads "CREATED" in #64D96B.
2. Card 02 appears (0:56–1:00): same animation. State: "READY".
3. Card 03 appears (1:02–1:06): same. State: "PASSED".
4. Card 04 appears (1:08–1:13): same, but with a subtle red glow pulse on the Casper anchor icon inside. State: "RECORDED".
5. Card 05 appears (1:15–1:22): same, but state label animates from "LOCKED" (#F45B45) → "UNLOCKED" (#64D96B) with a color transition. A green (#64D96B) glow ring expands outward from the card and fades.

**Animation details**:
- Card entrance: `opacity 0→1`, `transform translateX(-40px) → 0`, `scale(0.92→1)`, duration 0.5s each.
- Arrow between cards: draws in (stroke-dashoffset) after both cards are visible, duration 0.3s.
- Card 05 unlock glow: `box-shadow` ring 0→60px expanding, opacity 0.6→0, duration 1.2s.

**Voiceover**: "Here's the full proof rail. First, a payment-backed task is created. The AI agent does the work and produces output. A verifier checks that output independently. The proof gets anchored on Casper. Only then does payment unlock. Five steps. Agent work to verifiable payment."

**Logo**: Top-left, persistent.

---

### SCENE 4 — Product screens montage (1:30–2:10)

**Duration**: 40 seconds

**Visual style**: This section mimics real product screens. Each screen is a stylized recreation of the actual SealRail UI — not a screenshot, but a faithful HTML/CSS recreation at high fidelity. Screens animate with zoom, pan, and reveal effects.

#### Screen 4a — Marketplace (1:30–1:42)

**Visual**:
- Recreate the SealRail marketplace page: agent cards in a grid, each with agent name, description, proof requirement, price.
- Dark grid layout, glass cards, red accent on selected/hovered card.
- A cursor (custom CSS cursor or animated indicator) moves over the cards.

**Animation**:
- Screen zooms in from 70% scale to 100% over 1.5s (ken burns effect).
- Cursor moves across 2–3 cards, each one lifting slightly (translateY -4px, shadow increase) as the cursor passes.
- One card highlights fully with a red border glow.
- A label appears over the highlighted card: "AI agents as paid services" in #F6F5F3.

**Voiceover**: "Agents are listed on the marketplace. Buyers can see what each agent does, what proof is required, and what it costs."

#### Screen 4b — Run flow (1:42–1:54)

**Visual**:
- Recreate the `/run` page: task details on the left, proof rail status on the right, "Run full flow" button, step-by-step buttons.
- The proof rail status shows the 5-step pipeline.

**Animation**:
- Screen fades in (crossfade from marketplace).
- The "Run full flow" button pulses red (#FF2D2D, subtle pulse 0→1→0.7→1 opacity loop).
- A simulated click happens: button presses (scale 0.96), then the proof rail steps light up one by one rapidly (0.3s each).
- Green checkmarks appear on each step.
- Final step shows "PAYMENT UNLOCKED" in green.

**Voiceover**: "A buyer creates a payment-backed task and clicks run. The agent does the work. The verifier checks it. The proof is recorded. Payment unlocks."

#### Screen 4c — Proof detail (1:54–2:02)

**Visual**:
- Recreate the proof detail page: proof ID header, proof bundle data (output hash, WASM code hash, attestation hash), Casper anchor info, payment state badge.
- Data displayed in mono font on dark cards.

**Animation**:
- Screen fades in.
- The Casper anchor hash scrolls into view with a typewriter effect (characters appearing one by one, mono font, #F6F5F3).
- A red underline draws beneath the anchor hash.
- Payment state badge transitions from "LOCKED" to "UNLOCKED" with a green pulse.

**Voiceover**: "Every verified run produces a proof bundle. You can inspect the output hash, the verifier identity, and the Casper anchor. The payment state is visible and auditable."

#### Screen 4d — Status (2:02–2:10)

**Visual**:
- Recreate the `/status` page: status indicators for Casper testnet, database, LLM, backend.

**Animation**:
- Screen fades in.
- Status dots pulse green (#64D96B) one by one: Casper testnet → Database → LLM → Backend.
- Each dot pulses with a ring expansion.
- A red badge appears: "Casper Testnet — Verified."

**Voiceover**: "Everything runs on Casper testnet. The backend is live. The proof rail is working end to end."

**Logo**: Top-left, persistent through all screens.

---

### SCENE 5 — Why Casper (2:10–2:35)

**Duration**: 25 seconds

**Visual**:
- Screens fade out.
- Dark canvas. Center: a split composition.

  Left side (60% width):
  - A stylized node network representing Casper blockchain.
  - Red proof hash core glowing at the center.
  - Thin white lines (rails) connecting to it from the left side.
  - Labels sliding in:

    "Private data stays in the app layer"
    "Proof hashes anchor on Casper"
    "Payment state responds to proof validity"
    "External reference point for audit"

  Right side (40% width):
  - A large Casper-style hexagon or node icon, cream-white outline, red center dot.
  - Below it: "Built on Casper" in Inter 600, 40px.

**Animation**:
- Node network draws in: nodes appear with stagger (0.15s each), lines draw between them.
- Red core at center pulses: `box-shadow` 0 0 40px → 0 0 80px → back, 2s loop.
- Labels slide in from left, one by one (0.4s stagger), each with a small red dash before the text.
- Right side hexagon: fades in, then slowly rotates 15° over 8s (subtle).

**Voiceover**: "Why Casper? SealRail needs an external proof anchor for paid agent work. Private task data stays in the app layer. But proof hashes, verifier identity, and payment state get anchored on Casper. That gives buyers an auditable reference point that the app alone cannot provide. Casper makes the proof trail stronger."

**Logo**: Top-left.

---

### SCENE 6 — Use cases (2:35–2:50)

**Duration**: 15 seconds

**Visual**:
- Dark canvas.
- Six use case cards appear in a 2×3 grid, fading in with stagger.

  Card layout: #111111, 1px #F6F5F3 at 12% border, 20px radius, 280×140px.

  | Invoice review | Vendor risk |
  | Compliance | RWA verification |
  | Paid API agents | Agent marketplaces |

- Each card: title in Inter 600 26px #F6F5F3, no description.
- A thin red line connects all cards — a circuit/rail pattern flowing between them.
- Grid appears row by row: top row at 0s, bottom row at 0.4s.

**Animation**:
- Cards: `opacity 0→1` + `translateY(24px→0)`, duration 0.5s each, stagger 0.15s.
- Rail line between cards: draws in (stroke-dashoffset) after cards appear, duration 0.8s.
- Final pulse: the rail line glows red briefly, then settles to cream-white.

**Voiceover**: "Where does SealRail fit? Invoice review. Vendor risk checks. Compliance workflows. RWA verification. Paid API agents. Agent marketplaces. Any workflow where an AI agent does paid work and the buyer needs proof before payment moves."

**Logo**: Top-left.

---

### SCENE 7 — Closing (2:50–3:00)

**Duration**: 10 seconds

**Visual**:
- All cards fade out.
- Center stage: SealRailMark (large, ~160px) with red glow.
- Below it, stacked:

  "No proof, no payment."
  Inter 600, 80px, #F6F5F3, "no payment." in red.

- Below that:

  "sealrail.vercel.app"
  JetBrains Mono, 28px, #888888.

- A thin horizontal rail line draws beneath the URL.

- Small text at very bottom:

  "Built for the Casper Agentic Buildathon 2026"
  Inter 400, 18px, #888888, 40% opacity.

**Animation**:
- Mark: fade in + scale 1.1→1, duration 0.8s.
- Tagline: fade in + translateY(12px→0), staggered.
- URL: fade in, duration 0.6s.
- Rail line: draw from center outward, duration 0.8s.
- Red glow on mark: pulse twice gently over the 10s.

**Voiceover**: "SealRail. No proof, no payment. Built on Casper."

**Logo**: Full mark + wordmark, center, large.

**End state**: Hold on the closing frame for 3s after voiceover ends, then fade to black over 1s.

---

## Voiceover Guide

- **Voice**: AI-generated, neutral American or British English, clear and calm. No dramatic movie-trailer voice. Sound like a product narrator, not a salesperson.
- **Pacing**: Steady, ~150 words per minute. Pause 0.5s between scenes. Let key lines breathe ("No proof, no payment." should have 1s pause after).
- **Tone**: Confident, clear, not rushed. The product speaks for itself.
- **Implementation**: Use Web Audio API with pre-generated TTS audio files. Placeholder: use silent audio buffers of correct duration. Document where to inject real TTS tracks (e.g., ElevenLabs or OpenAI TTS).

### Audio sync markers

Embed these markers in the JS timeline so the voiceover stays locked to visuals:

```js
const voiceoverMarkers = [
  { time: 2.0,  text: "This is Sealrail." },
  { time: 8.0,  text: "AI agents are starting to do paid work..." },
  { time: 30.0, text: "No proof, no payment..." },
  { time: 50.0, text: "Here's the full proof rail..." },
  { time: 90.0, text: "Agents are listed on the marketplace..." },
  { time: 102.0,text: "A buyer creates a payment-backed task..." },
  { time: 114.0,text: "Every verified run produces a proof bundle..." },
  { time: 122.0,text: "Everything runs on Casper testnet..." },
  { time: 130.0,text: "Why Casper?..." },
  { time: 155.0,text: "Where does SealRail fit?..." },
  { time: 170.0,text: "SealRail. No proof, no payment. Built on Casper." },
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

Use `requestAnimationFrame` with a master timeline clock. Each scene is a function that takes `(elapsed, sceneStartTime, canvasEl)` and manipulates DOM elements directly. Use a scene manager that:
- Tracks current scene index
- Calls `enter()` when scene starts (create/reveal elements)
- Calls `update(elapsed)` every frame (handle animations)
- Calls `exit()` when scene ends (hide/remove elements)

### Animation utilities

Provide helpers for:
```js
function tween(obj, prop, from, to, duration, easing, startTime, currentTime)
function stagger(elements, animation, staggerDelay)
function drawLine(el, duration) // SVG stroke-dashoffset
function typewriter(el, text, duration)
function pulse(el, intensity, duration) // box-shadow glow
```

### SVG logo

Embed the SealRailMark as an inline SVG component function:

```js
function createLogo({ x, y, scale = 1, accent = '#FF2D2D', stroke = '#F6F5F3' }) {
  // return SVG element (30×22 viewbox scaled)
  // horizontal rails at y=11, circle at (15,11), red dot, vertical stem
}
```

### Responsive fallback

- The 1920×1080 canvas scales to fit the viewport using CSS `transform: scale()` centered.
- On `prefers-reduced-motion`, snap all elements to their final positions instantly (no tweens).
- On viewports narrower than 1024px, show a message: "Best viewed on desktop" and still render at reduced scale.

### Performance

- No more than 30 animated elements on screen at once.
- Use `will-change: transform, opacity` on moving elements.
- Use `contain: layout style paint` on scene containers.
- Cap at 60fps; if frame budget is tight, drop to 30fps for non-critical tweens.

---

## What NOT to do

- Do NOT use gradients as a substitute for composition.
- Do NOT add fake testimonials, fake users, or fake metrics.
- Do NOT use emojis anywhere.
- Do NOT make the video require user clicks to advance (it autoplays).
- Do NOT use external CDN dependencies for core rendering (CSS/JS must be self-contained).
- Do NOT add scenes beyond the 7 specified above.
- Do NOT use generic SaaS clipart or stock illustration style.
- Do NOT make the AI voiceover sound like a movie trailer voice.

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
- [ ] No text overflows or is clipped at 1920×1080
- [ ] `prefers-reduced-motion` is respected
- [ ] Total runtime is 180s ±5s

---

## File to produce

`/root/sealrail/audit-deliverables/SealRail Demo Video.html`

Self-contained. Ready to open in a browser.
