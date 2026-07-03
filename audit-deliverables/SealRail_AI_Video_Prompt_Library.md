# SealRail — AI Video Production Brief

*Built with the AI Video Prompt Library. Ready to copy into Veo, Runway, Pika, Kling, Higgsfield, Luma, or any AI video tool.*

---

## 1. Overview

This document is a production-ready video brief for **SealRail** — a proof-gated payment rail for AI agents, built on Casper. It contains every scene, camera direction, animation spec, voiceover line, and visual reference needed to produce a 2-3 minute premium product demo video using AI video generation tools.

**How to use**: Copy the Scene Structure section into your AI video tool's prompt field. Replace `[INSERT]` placeholders with generated shots. Use the Reference Screenshots section as visual grounding for every shot.

---

## 2. Product Information

| Field | Value |
|---|---|
| **Product name** | SealRail |
| **Tagline** | No proof, no payment |
| **One-liner** | Proof-gated payment rail for AI agents. Agent work gets verified, anchored on Casper, then paid. |
| **Website** | sealrail.vercel.app |
| **Product category** | Web3 / AI Infrastructure / Payments |
| **Target audience** | AI agent developers, Web3 builders, hackathon judges, payment infrastructure teams |
| **Key selling points** | Proof-gated escrow for AI agents · Casper on-chain anchor · TEE-compatible verification · X402 protocol · Multiple LLM support · Full REST API with scoped keys · Real on-chain deploy hashes · Live testnet deployment |

### Brand System

```
Colors:
  Background:   #080808 (canvas black)
  Cards:        #111111 (ink)
  Primary text: #F6F5F3 (soft white)
  Muted text:   #888888
  Accent red:   #FF2D2D (Casper red — CTAs, proof core, signals)
  Success:      #64D96B (proof green — verified, unlocked, paid)
  Risk:         #F45B45 (warning red — locked, blocked)
  API blue:     #3C8DFF (sparingly, docs/code references)

Typography:
  Headlines: Inter 400–600 weight, tight letter-spacing (-0.015em)
  Body:      Inter 400
  Mono:      JetBrains Mono 400–500 (hashes, states, technical labels)
  Serif:     Georgia (pull quotes only — very sparing)

Logo:
  SVG: Horizontal rails left and right, center circle with red (#FF2D2D) dot,
       vertical stem above. Viewbox 30×22. Always paired with "Sealrail"
       wordmark in Inter 600.

Design posture:
  Dark canvas · Red accent · Cream-white type · Glassmorphism cards
  No gradients · No emojis · No stock illustrations · No fake metrics
  Clean, precise, fintech-meets-Web3 aesthetic
  Massive negative space — sections breathe
```

---

## 3. Video Goal

**Primary goal**: Hackathon qualification/product demo — prove to Casper Agentic Buildathon judges that SealRail is a real, working, on-chain product.

**Secondary goals**: Landing page hero video, investor presentation excerpt, social media launch trailer.

The video must prove:
1. The product **really works** — real deploys, real on-chain proof anchors, real verifier output
2. It **uses Casper** — explorer links, deployed contracts, gas paid
3. It has **real AI agents** — multiple agent types, marketplace listings, LLM-powered runtimes
4. It **supports multiple LLMs** — configurable provider, not hard-coded to one
5. It has **TEE support** — verification mode, WASM hashes, attestation hashes
6. It has **full REST APIs** — scoped keys, code examples
7. It looks **professional** — premium dark-SaaS aesthetic, not generic

---

## 4. Video Style

**Primary style**: **Premium Dark SaaS × Web3 Fintech**

```
Cinematic, dark, precise, confident. Black canvas (#080808) with cream-white
typography and red (#FF2D2D) accent signals. Glassmorphism cards with soft
white borders. Thin rail lines connecting elements. No gradients — glow comes
from box-shadows and red pulse lighting. Massive negative space. Sections
breathe. Fintech-meets-Web3 aesthetic. Think Stripe meets Linear, on-chain.

Mood: "This is real infrastructure. It works. Here's the proof."
```

**Prompt to paste into AI video tool:**
```
Style: Dark premium SaaS aesthetic. Black canvas (#080808). Cream-white
(#F6F5F3) typography with Inter font. Red (#FF2D2D) accent for CTAs,
proof signals, and key moments. Green (#64D96B) for success states.
Glassmorphism cards — dark semi-transparent backgrounds with soft white
borders, 24-34px border-radius. Thin 1-2px rail lines connecting elements.
No gradients. No emojis. No stock footage. Glow from box-shadows and
lighting, not CSS gradients. Massive negative space. Clean, precise,
fintech-meets-Web3. 1920x1080, 16:9, 60fps.
```

---

## 5. Camera Direction

```
Scene 0 (Logo):    Static center frame. Subtle dolly zoom in (1.0→1.03 over 3s).
Scene 1 (Problem): Static wide. Text reveals with kinetic push-ins per line.
Scene 2 (Tagline): Slow zoom into center text. Scale 1.0→1.08 over 6s.
                   Hold on "no payment." in red.
Scene 3 (Rail):    Smooth tracking shot left-to-right following the 5-card
                   proof rail. Macro close-up on Card 04 (Casper anchor).
                   Dolly zoom on anchor hash — scale 1.0→1.3, hold 2s.
Scene 4a (Docs):   Ken burns zoom on API code — scale 0.85→1.05 over 8s.
                   Subtle drift (±6px) to feel alive.
Scene 4b (Agents): Wide establishing shot of marketplace grid. Push into one
                   agent card — scale 1.0→1.15, center frame.
Scene 4c (Run):    Tracking shot following the rail steps lighting up.
                   Dramatic zoom into Casper anchor — scale 1.0→1.3, hold 1.5s.
Scene 4d (Split):  Split-screen. Left: proof detail. Right: Casper explorer.
                   Connecting line draws between them. Both sides pulse red.
Scene 5 (Why):     Wide shot of node network. Slow orbit around the red proof
                   core. Labels slide in from left.
Scene 6 (Grid):    Wide establishing shot. Each row zooms in (0.85→1.0).
                   Final red pulse on all cards.
Scene 7 (Close):   Slow zoom out from logo center. Mark fades, red dot holds
                   0.5s, then fades to black.
```

---

## 6. Product Animation

```
Cards:         Float up + scale pop (0.85→1.05→1.0). Stagger 0.15s between cards.
               Easing: cubic-bezier(0.34, 1.56, 0.64, 1). 600ms each.

Rail lines:    Thin 1-2px cream-white horizontal lines. Stroke-dashoffset draw
               from left to right. 400ms per arrow segment.

Text reveals:  Kinetic stagger — each line fades in + translates up 30px→0.
               Stagger 0.4s between lines. Key line in red gets scale pop (1.05→1).

Hashes:        JetBrains Mono typewriter effect — characters appear one by one.
               30ms per character. Green (#64D96B) or red (#FF2D2D) depending
               on context.

State flips:   Color wipe transition — e.g., "LOCKED" #F45B45 → "UNLOCKED" #64D96B.
               600ms. Left-to-right color sweep.

Glow pulses:   Box-shadow expanding ring. Red (#FF2D2D): 0→80px, opacity 0.6→0.
               Green (#64D96B): same, done twice for payment unlock. 3s loop
               on idle accent moments.

Checkmarks:    SVG path draw-in. Green (#64D96B). 300ms. Scale pop on completion.

Logo:          Fade in + scale 1.12→1.0. Easing: cubic-bezier(0.34, 1.56, 0.64, 1).
               800ms. Red glow behind mark breathes slowly (3s loop).
```

---

## 7. Screen Transitions

```
Scene → Scene:    Crossfade 0.5s with slight scale push (0.98→1.0).
                  Or: cards dissolve out, new scene fades in from black.

Dashboard flow:   Smooth scroll reveal — elements appear top-to-bottom
                  with 0.1s stagger. Cursor moves to highlight key UI.

Proof rail:       Cards enter left-to-right with connecting arrows drawing
                  between them. Each card lands, state flips, arrow draws,
                  next card starts.

Split-screen:     Left half fades in from left, right half from right.
                  Connecting line draws center → both sides. 800ms.

Grid reveal:      Rows appear with dramatic zoom — each row starts at
                  scale 0.8 and pops to 1.0 over 400ms. Stagger 0.15s
                  between rows. Red rail line connects all cards after.

Closing:          Everything dissolves to black except red logo dot.
                  Dot holds 0.5s, then fades. Pure black 1s.
```

---

## 8. Motion Timing

```
Total runtime:           ~2:45–3:00

Scene pacing:
  Scene 0 (Logo):        8s     — slow, atmospheric
  Scene 1 (Problem):     24s    — building, kinetic text
  Scene 2 (Tagline):     20s    — dramatic, slow zoom
  Scene 3 (Proof rail):  40s    — THE key scene, deliberate step-by-step
  Scene 4a (Docs):       12s    — medium pace, screen demo
  Scene 4b (Agents):     10s    — medium pace
  Scene 4c (Run flow):   10s    — faster, real-time feel
  Scene 4d (Proof+Chain):10s    — deliberate, proof emphasis
  Scene 5 (Why Casper):  24s    — explainer pace
  Scene 6 (Ecosystem):   14s    — energetic grid reveal
  Scene 7 (Close):       13s    — slow, confident, fade to black

Animation speed tiers:
  Fast reveals:     200–400ms (badges, checkmarks, state flips)
  Medium zooms:     600–1000ms (product screens, cards)
  Slow pans:        1500–2500ms (atmospheric, establishing)
  Text typewriter:  30ms per character (hashes, code)
  Glow pulses:      3s loop (accent moments)

Hero moments (extra 0.5–1s pause):
  - "No proof, no payment." — 1s hold after
  - Casper anchor card zoom — 2s hold on zoomed view
  - Payment unlock green glow — done twice
  - Explorer URL reveal — 2s hold before fade
```

---

## 9. Visual Effects

```
Lighting:
  - Low ambient light on canvas (#080808). Red accent light from logo
    and proof core. Soft white rim light on card edges.
  - Volumetric red glow behind logo mark — breathing pulse.

Reflections:
  - Subtle floor reflection on glassmorphism cards (30% opacity, flipped).
  - Screen gloss on product screens — diagonal light sweep every 4s.

Shadows:
  - Cards: drop shadow 0 20px 60px rgba(0,0,0,0.5).
  - Elevated elements (pop-ups, badges): 0 40px 80px rgba(0,0,0,0.6).

Glow effects:
  - Red glow: box-shadow 0 0 60px rgba(255,45,45,0.3) pulsing to 100px.
  - Green glow: box-shadow 0 0 80px rgba(100,217,107,0.4), expanding ring.
  - Text glow: subtle red text-shadow on "no payment." and "CASPER ANCHOR".

Depth of field:
  - Shallow DOF on close-up shots (Casper anchor card, proof hash).
  - Deep focus on wide shots (ecosystem grid, marketplace).

Motion blur:
  - Subtle directional blur on fast transitions (10px, 0° angle).
  - No blur on text — keep type crisp.

Particle systems:
  - Fine red particles floating around the Casper anchor card.
  - Green particles on payment unlock + success states.
  - Thin data lines (circuit traces) connecting ecosystem cards.

Color grading:
  - Dark, cool overall. Red (#FF2D2D) pushed +10% saturation.
  - Blacks crushed slightly for depth. Highlights clean white (#F6F5F3).
```

---

## 10. Typography

```
Animated titles:
  - Large headlines (72-130px): Inter 600, #F6F5F3. Kinetic stagger —
    each word enters 0.3s apart. Key words in red (#FF2D2D) get scale pop.
  - "No proof, no payment." — "no payment." in red, scale 130px, dramatic.

Lower thirds:
  - Bottom bar: 80px tall, #080808 85% opacity. Text: Inter 600, 30px,
    #F6F5F3, centered. Karaoke-style word highlighting — current word
    #FFFFFF, upcoming #A8A8A6. 50ms fade per word.

Callouts:
  - Small glass pills: #111111 background, 1px #F6F5F3 15% border, 20px radius.
    Text: Inter 600, 16px, #FF2D2D. Examples: [CASPER TESTNET], [TEE VERIFIED],
    [X402-COMPATIBLE].

Feature labels:
  - Mono labels on cards: JetBrains Mono, 18-24px, #888888.
    State transitions: WAITING→CREATED, LOCKED→UNLOCKED, READY→PASSED.

Statistic counters:
  - Not applicable — SealRail uses real deploy hashes, not fake metrics.

Captions:
  - REQUIRED. Permanent bottom bar. Inter 600, 28-32px. Max 2 lines.
    Sync: appear 0.2s before voice, disappear 0.3s after.
    Bar stays visible between phrases (empty, no jarring hide/show).

Text reveals:
  - Problem headlines: fade in + translateY(30px→0), stagger 0.4s/line.
  - Deploy hash: typewriter effect, JetBrains Mono, 18px, #888888.
  - "Verified on-chain" URL: typewriter, 14px mono, 60% opacity.
```

---

## 11. AI Voiceover

```
Voice personality:  Product narrator — calm, confident, clear. Not a movie
                    trailer voice. Not a corporate spokesperson. More like
                    a founder explaining their genuinely impressive product.

Tone:               Confident, measured, slightly understated. Let the product
                    speak for itself. Slight emphasis on "Casper" and
                    "on-chain proof" for judge impact.

Pace:               Steady, ~150 words per minute. Pause 0.5s between scenes.
                    Key lines get breathing room — "No proof, no payment."
                    should have 1s pause after.

Accent:             Neutral American English, or British English. Clear,
                    warm, authoritative without being salesy.

Energy level:       Medium — not hype, not monotone. The product is impressive;
                    the voice should sound impressed.

Emotional style:    Genuine confidence. "This works. Here's the proof."
                    No fake excitement. No urgency.

Pronunciation:      "SealRail" — one word, emphasis on "Seal" (SEEL-rayl).
                    "Casper" — KASS-per. "X402" — "ex-four-oh-two".

Pauses:             0.5s between scenes. 1s after key lines. 0.3s between
                    sentences within a scene.

CTA delivery:       Closing line — "Built for the Casper Agentic Buildathon" —
                    confident, final, no trailing upspeak.

Background music:   Subtle ambient electronic. Low, atmospheric drone with
                    occasional high-frequency accents. Reduces to 20% during
                    voiceover. Swells slightly on hero moments (card 04 zoom,
                    payment unlock). No beat drops. No distracting melodies.

Voice style prompt:
  "Neutral American male voice, warm and clear, ~150 wpm. Confident product
   narrator — not a movie trailer, not a corporate ad. Sounds like a founder
   explaining their working product. Slight emphasis on 'Casper' and
   'on-chain proof.' Natural pauses. No fake excitement."
```

### Voiceover Script

```
Scene 0 (2s):     "This is SealRail."

Scene 1 (8s):     "AI agents are starting to do paid work. They review
                   invoices. They check vendors. They handle compliance.
                   They serve marketplaces. But when an agent says the
                   work is done — is that enough? 'The agent replied'
                   is not proof."

Scene 2 (32s):    "No proof, no payment. SealRail is a proof-gated
                   payment rail for AI agents. Built on Casper.
                   TEE-verified. X402-compatible. Here's how it works."

Scene 3 (52s):    "Here's the full proof rail. Watch this. A payment-backed
                   task is created. The AI agent does the work — powered by
                   a configurable LLM runtime. A verifier checks that output
                   independently using TEE-compatible verification. Then —
                   and this is what matters for Casper — the proof gets
                   anchored on-chain. You can verify it right now on the
                   Casper testnet explorer. Only after the anchor is
                   confirmed does payment unlock. Five steps. Agent work
                   to verifiable payment on Casper."

Scene 4a (92s):   "SealRail has a full REST API. Scoped API keys. Agents
                   can use any LLM provider — the runtime is configurable.
                   Tasks, proofs, payments — all accessible through clean
                   endpoints."

Scene 4b (104s):  "Multiple agent types are listed on the marketplace. Each
                   one maps to a task type, a verifier function, and a proof
                   mode. Buyers know exactly what they're paying for."

Scene 4c (114s):  "Here's a live run. Invoice task created, agent output
                   ready, proof verified, and — look — the Casper deploy hash.
                   This is real. This is on-chain. Payment unlocked."

Scene 4d (124s):  "This is the proof bundle. TEE verification mode. WASM code
                   hash. Attestation hash. Casper anchor. And here — this
                   exact transaction on the Casper testnet explorer.
                   anchor_proof. Real gas paid. Real on-chain. Real timestamp.
                   The product works."

Scene 5 (134s):   "Why Casper? SealRail needs an external proof anchor for
                   paid agent work. Private task data stays in the app layer.
                   But proof hashes, verifier identity, and payment state get
                   anchored on Casper. That gives buyers an auditable reference
                   point that the app alone cannot provide. And because the
                   agent runtime is LLM-agnostic, you can plug in any provider.
                   Casper makes the proof trail stronger. Multiple LLMs make
                   the agent smarter."

Scene 6 (158s):   "Where does SealRail fit? Invoice review. Vendor risk checks.
                   Compliance workflows. RWA verification. Paid API agents.
                   Agent marketplaces. Document verification. Procurement.
                   Any workflow where an AI agent does paid work and the buyer
                   needs proof before payment moves."

Scene 7 (172s):   "SealRail. No proof, no payment. Real product. Real Casper.
                   Real on-chain proof. Built for the Casper Agentic Buildathon."
```

---

## 12. Sound Design

```
Background music:
  - Genre: Ambient electronic / minimal techno
  - Mood: Dark, precise, confident. Like premium SaaS UI sounds.
  - Volume: 20% during voiceover, 40% during silent moments
  - Swell points: Card 04 zoom (Casper anchor), payment unlock, logo reveal
  - No beat drops. No distracting melodies.
  - Reference: Linear's product videos, Stripe's launch sounds

UI sound effects (subtle, premium):
  - Card entrance: Soft whoosh (0.3s, low-passed)
  - Checkmark: Clean pop/click (0.15s, high-frequency)
  - Arrow draw: Subtle swipe (0.2s, mid-frequency)
  - State flip: Quick tick (0.1s, metallic)
  - Typewriter: Soft key click per character (muted, fast)
  - Red pulse: Deep sub-bass throb (0.5s, low frequency)
  - Green glow: Bright chime (0.3s, ascending)
  - Logo reveal: Deep resonance + high shimmer (1.0s combined)

Transitions:
  - Scene → Scene: Low-pass filter sweep (0.4s, descending then ascending)
  - Crossfade: Simple fade, no audio effect needed

Ambient:
  - Low room tone throughout — barely audible, adds depth
  - Subtle electrical hum on tech-heavy scenes (node network, proof rail)

Cinematic impacts:
  - "No proof, no payment." — deep impact + reverb tail (0.8s)
  - Casper anchor zoom — rising tension drone (2s, peaks at zoom)
  - Payment unlock — bright resolution chord (1s, green glow sync)

Success sounds:
  - Verified/PASSED: Single clean bell (0.2s, high clarity)
  - UNLOCKED: Ascending three-note chime (0.5s, major key)
  - End card: Final resonant note, fades over 2s
```

---

## 13. Scene Structure

### Opening Hook (Scene 0)
```
Purpose:     Brand imprint. Viewer knows what product they're watching.
Duration:    8 seconds
Key beat:    Logo fades in from black. Red glow breathes. "This is SealRail."
```

### Problem Introduction (Scene 1)
```
Purpose:     Make viewer feel the gap. AI agents do paid work but "the agent
             replied" isn't proof. Build tension.
Duration:    24 seconds
Key beat:    Four problem lines stagger in. Last line "is not proof." in red.
```

### Product Reveal (Scene 2)
```
Purpose:     Answer the problem. Tagline as dramatic statement.
Duration:    20 seconds
Key beat:    "No proof, no payment." — massive text, "no payment." in red.
             Rail line draws beneath. Badges appear.
```

### Core Proof Rail (Scene 3) — HERO SCENE
```
Purpose:     Show the full flow end-to-end. This is what judges watch.
Duration:    40 seconds
Key beat:    5 cards build left to right. Card 04 (Casper anchor) gets
             dramatic zoom + red glow + deploy hash reveal. Card 05
             (payment unlock) gets green glow ring, done twice.
```

### Feature Demonstrations (Scene 4)
```
Purpose:     Prove breadth — docs, agents, run flow, on-chain proof.
Duration:    42 seconds (4 sub-scenes)
Key beats:
  4a: API docs with code examples + cursor highlight
  4b: Agent marketplace grid, one card lifts
  4c: Live run flow, Casper deploy hash shown
  4d: Split-screen — proof bundle + Casper explorer, connecting line
```

### Why Casper (Scene 5)
```
Purpose:     Answer "why this chain?" Explicitly for judges.
Duration:    24 seconds
Key beat:    Node network with red proof core. Labels slide in.
             Casper hexagon on right. "Built on Casper. Testnet verified."
```

### Ecosystem (Scene 6)
```
Purpose:     Show breadth of use cases. The product isn't niche.
Duration:    14 seconds
Key beat:    8 use case cards in 2×4 grid. Row-by-row zoom reveal.
             Red rail line connects all. Final pulse.
```

### Call to Action (Scene 7)
```
Purpose:     Close with proof. Judge remembers the on-chain evidence.
Duration:    13 seconds
Key beat:    Logo center. Tagline. URL. "Built for the Casper Agentic
             Buildathon." Explorer URL with real deploy hash appears.
             Red dot holds, then fades to black.
```

---

## 14. Storyboarding

### Frame-by-Frame Shot List

```
┌──────────────────────────────────────────────────────────────────────────┐
│ SHOT  | TIME    | CAMERA          | VISUAL                    | AUDIO    │
├──────────────────────────────────────────────────────────────────────────┤
│ 0.1   | 0:00    │ Static center   │ Pure black canvas        │ Silence  │
│ 0.2   | 0:01    │ Dolly zoom in   │ Red glow begins behind   │ Deep hum │
│       |         │ 1.0→1.03        │ center. Mark forming.    │          │
│ 0.3   │ 0:03    │ Hold            │ SealRailMark + wordmark  │ Chime    │
│       |         │                 │ fully visible. Red pulse.│          │
│ 0.4   │ 0:05    │ Hold            │ "This is SealRail."      │ VO: line │
│       |         │                 │ caption appears.          │          │
│───────┼─────────┼─────────────────┼──────────────────────────┼──────────│
│ 1.1   │ 0:08    │ Push back       │ Logo shrinks to top-left │ Whoosh   │
│       |         │ to wide         │ corner. Canvas dark.     │          │
│ 1.2   │ 0:09    │ Static wide     │ Line 1: "AI agents are   │ VO: L1   │
│       |         │                 │ starting" — fade+slide up│          │
│ 1.3   │ 0:11    │ Static wide     │ Line 2: "to do paid work."│ VO: L2  │
│ 1.4   │ 0:13    │ Static wide     │ Line 3: "But 'the agent   │ VO: L3  │
│       |         │                 │ replied'"                 │          │
│ 1.5   │ 0:15    │ Push in on      │ Line 4: "is not proof."   │ Impact   │
│       |         │ red line        │ RED, scale pop 1.05→1.   │ VO: L4  │
│ 1.6   │ 0:17    │ Wide, hold      │ 4 bullet cards slide up   │ Swipes   │
│       |         │                 │ with stagger.              │ VO: cont │
│ 1.7   │ 0:24    │ Hold            │ Cards settle.              │ VO: end  │
│───────┼─────────┼─────────────────┼──────────────────────────┼──────────│
│ 2.1   │ 0:32    │ Crossfade       │ Old content fades out.    │ Sweep    │
│ 2.2   │ 0:34    │ Slow zoom in    │ "No proof," appears —      │ Impact   │
│       |         │ 1.0→1.08        │ massive, scale pop.       │ VO: L1   │
│ 2.3   │ 0:36    │ Hold on red     │ "no payment." in RED —     │ Sub bass │
│       |         │                 │ scale pop, glow pulse.    │ VO: L2   │
│ 2.4   │ 0:39    │ Pull back       │ Subtitle fades in.         │ VO: L3   │
│ 2.5   │ 0:43    │ Wide, hold      │ 3 badges appear.           │ Pops     │
│       |         │                 │ Rail line draws.           │ VO: L4   │
│───────┼─────────┼─────────────────┼──────────────────────────┼──────────│
│ 3.1   │ 0:52    │ Wide L→R track  │ Card 01 slides in.        │ Whoosh   │
│       |         │                 │ WAITING→CREATED, ✓.       │ VO: start│
│ 3.2   │ 0:57    │ Track R         │ Arrow 1→2 draws red.      │ Swipe    │
│ 3.3   │ 1:00    │ Track R         │ Card 02 slides in.        │ Whoosh   │
│       |         │                 │ State: READY. Agent icon. │ VO: cont │
│ 3.4   │ 1:05    │ Track R         │ Arrow 2→3 draws.          │ Swipe    │
│ 3.5   │ 1:08    │ Track R         │ Card 03 slides in.        │ Whoosh   │
│       |         │                 │ PASSED. TEE shield green. │ VO: cont │
│ 3.6   │ 1:13    │ Track R         │ Arrow 3→4 draws.          │ Swipe    │
│ 3.7   │ 1:16    │ ★ Dolly zoom    │ Card 04 SLIDES IN —        │ DRONE ↑  │
│       |         │ 1.0→1.3 HERO    │ RED GLOW, deploy hash     │ VO: emph │
│       |         │ Hold 2s         │ typewriter. CASPER ANCHOR.│          │
│ 3.8   │ 1:23    │ Pull back       │ Arrow 4→5 draws red pulse.│ Swipe    │
│ 3.9   │ 1:26    │ Track R, hold   │ Card 05: LOCKED→UNLOCKED   │ Chime ×2 │
│       |         │                 │ color wipe. GREEN GLOW    │ VO: end  │
│       |         │                 │ RING expands twice.        │          │
│───────┼─────────┼─────────────────┼──────────────────────────┼──────────│
│ 4a.1  │ 1:32    │ Ken burns in    │ Docs page. API code block.│ VO: start│
│       |         │ 0.85→1.05       │ Cursor highlights lines.  │ Clicks   │
│ 4a.2  │ 1:40    │ Drift ±6px      │ Red underline on "LLM     │ VO: cont │
│       |         │                 │ agent runtime." Badge.   │          │
│───────┼─────────┼─────────────────┼──────────────────────────┼──────────│
│ 4b.1  │ 1:44    │ Crossfade wide  │ Agent marketplace grid.   │ VO: start│
│       |         │                 │ Cards stagger in.         │ Swipes   │
│ 4b.2  │ 1:48    │ Push into one   │ One card lifts 1.0→1.08.  │ VO: cont │
│       |         │ card            │ Red border glow. Label.   │          │
│───────┼─────────┼─────────────────┼──────────────────────────┼──────────│
│ 4c.1  │ 1:54    │ Crossfade       │ Run page. Rail steps       │ VO: start│
│       |         │                 │ light up rapidly.         │ Pops     │
│ 4c.2  │ 1:58    │ Dramatic zoom   │ Zoom into CASPER ANCHOR    │ DRONE    │
│       |         │ 1.0→1.3         │ + deploy hash. Hold.      │ VO: emph │
│───────┼─────────┼─────────────────┼──────────────────────────┼──────────│
│ 4d.1  │ 2:04    │ Split-screen    │ Left: proof detail JSON.  │ VO: start│
│       |         │ L+R slide in    │ Right: Casper explorer.   │          │
│ 4d.2  │ 2:08    │ Hold split      │ Connecting red line draws.│ Line hum │
│       |         │                 │ Both sides pulse red sync.│ VO: emph │
│───────┼─────────┼─────────────────┼──────────────────────────┼──────────│
│ 5.1   │ 2:14    │ Fade from split │ Node network forms.       │ VO: start│
│       |         │                 │ Red proof core at center. │ Ambient  │
│ 5.2   │ 2:18    │ Slow orbit      │ Labels slide in left.     │ VO: cont │
│       |         │ around core     │ Casper hexagon on right.  │          │
│ 5.3   │ 2:30    │ Hold wide       │ "Built on Casper."        │ VO: end  │
│       |         │                 │ "Testnet verified" green. │ Chime    │
│───────┼─────────┼─────────────────┼──────────────────────────┼──────────│
│ 6.1   │ 2:38    │ Wide establish  │ 8 use case cards grid.    │ VO: start│
│       |         │                 │ Row 1 zooms in 0.85→1.0. │ Whoosh   │
│ 6.2   │ 2:44    │ Hold wide       │ Row 2 zooms in.           │ VO: cont │
│       |         │                 │ Red rail line connects.   │ Swipe    │
│ 6.3   │ 2:49    │ Hold, final     │ All cards pulse red sync. │ Sub bass │
│       |         │ pulse           │                           │ VO: end  │
│───────┼─────────┼─────────────────┼──────────────────────────┼──────────│
│ 7.1   │ 2:52    │ Static center   │ Logo mark fades in.       │ Deep hum │
│       |         │                 │ Red glow. Scale pop.      │          │
│ 7.2   │ 2:55    │ Hold center     │ "No proof, no payment."    │ VO: start│
│       |         │                 │ RED on "no payment."      │ Impact   │
│ 7.3   │ 2:58    │ Hold            │ 3 proof badges. URL.       │ VO: cont │
│       |         │                 │ Rail line draws.          │ Swipe    │
│ 7.4   │ 3:01    │ Hold            │ Explorer URL + hash fades │ VO: end  │
│       |         │                 │ in, holds 2s, fades.     │          │
│ 7.5   │ 3:03    │ Static          │ Everything → black except │ Silence  │
│       |         │                 │ red dot. Dot holds 0.5s. │          │
│ 7.6   │ 3:04    │ Fade to black   │ Pure black. Hold 1s.     │ Final    │
│       |         │                 │ END.                      │ note out │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## 15. Platform Variations

### YouTube
- **Aspect ratio**: 16:9 (1920×1080)
- **Duration**: Full 3:00 version
- **Captions**: Burned-in + YouTube CC file
- **Thumbnail**: SealRailMark on black, "No proof, no payment." in red, Casper hexagon
- **Description**: GitHub link, live URL, Casper explorer link, buildathon attribution

### X (Twitter)
- **Aspect ratio**: 16:9 or 1:1
- **Duration**: 60-second cutdown — Scenes 0, 2, 3 (condensed), 7
- **Captions**: Large, burned-in (mobile viewers)
- **First frame**: "No proof, no payment." on black — hook before scroll-away

### LinkedIn
- **Aspect ratio**: 16:9
- **Duration**: 90-second cutdown — Scenes 0, 1, 2, 3, 4d, 7
- **Tone**: Slightly more professional/enterprise
- **Captions**: Required (many watch on mute at work)

### Instagram / TikTok
- **Aspect ratio**: 9:16 (1080×1920 vertical cut)
- **Duration**: 30-45 seconds
- **Style**: Faster cuts, vertical composition, large text
- **First 3 seconds**: "No proof, no payment." + Casper anchor zoom (hook)

### Product Hunt
- **Aspect ratio**: 16:9
- **Duration**: 90 seconds
- **Style**: Product-focused — emphasize screenshots, API, agents
- **Captions**: Required
- **Include**: GitHub stars-style social proof (if applicable)

### Landing Page Hero
- **Aspect ratio**: 16:9, no controls visible
- **Duration**: 20-30 second seamless loop
- **Style**: Scenes 0→2→3 (condensed, no VO) → back to logo
- **Autoplay**: Muted, no captions needed

### Conference Display
- **Aspect ratio**: 16:9
- **Duration**: Full 3:00, looping
- **Style**: No captions needed (attendees can't read from distance)
- **Audio**: Background music only, no voiceover (played on loop at booth)

---

## 16. Quality Checklist

Before exporting the final video:

### Visual
- [ ] Smooth animations — no frame drops, no stuttering at 60fps
- [ ] Consistent branding — #FF2D2D red, #F6F5F3 white, #080808 black throughout
- [ ] Logo visible in every scene (except pure-black moments)
- [ ] Readable typography — all text passes 4.5:1 contrast ratio on its background
- [ ] No emojis, no stock illustrations, no gradients, no fake metrics
- [ ] Glassmorphism cards render correctly — semi-transparent, soft borders
- [ ] Red accent is used sparingly — only for CTAs, proof signals, key moments
- [ ] Green (#64D96B) only for success states
- [ ] Rail lines are visible and draw correctly (stroke-dashoffset)

### Proof Points (CRITICAL for judges)
- [ ] Casper deploy hash is visible in Scene 3 (Card 04)
- [ ] "anchor_proof" action shown on Casper explorer in Scene 4d
- [ ] Real deploy hash matches what's on testnet.cspr.live
- [ ] TEE Verification Mode badge appears
- [ ] Multiple agent types visible in marketplace (Scene 4b)
- [ ] API code examples shown in docs (Scene 4a)
- [ ] X402-compatible badge shown
- [ ] Multiple LLM support mentioned/visible

### Audio
- [ ] Voiceover is clear, properly leveled (-12dB to -6dB peak)
- [ ] Background music is subtle (20% during VO, 40% during silence)
- [ ] Sound effects are subtle — not distracting
- [ ] No audio clipping or distortion
- [ ] Silence at start (2s) and end (1s) — clean in/out
- [ ] Voiceover sync matches caption display (0.2s before, 0.3s after)

### Captions
- [ ] Caption bar is visible and readable
- [ ] All voiceover lines have corresponding captions
- [ ] Karaoke-style word highlighting works (current word brighter)
- [ ] Captions appear 0.2s before voice, disappear 0.3s after
- [ ] Bar does not overlap critical content in any scene
- [ ] Bar stays visible between phrases (no jarring hide/show)

### Timing
- [ ] Total runtime is 2:45–3:05 (±5s acceptable)
- [ ] Scene pacing feels right — not rushed, not dragging
- [ ] Hero moment (Scene 3, Card 04 zoom) gets proper 2s hold
- [ ] Payment unlock green glow happens twice (Scene 3, Card 05)
- [ ] Pauses after key lines feel natural

### Technical
- [ ] Export: 1920×1080, 16:9, 60fps, H.264 or ProRes
- [ ] No rendering artifacts, banding, or compression noise
- [ ] `prefers-reduced-motion` equivalent applied (if tool supports)
- [ ] File size reasonable for platform (<2GB for YouTube, <512MB for social)
- [ ] Audio: AAC 320kbps or PCM 48kHz

### Platform
- [ ] Platform-specific cutdowns exported (if needed)
- [ ] Thumbnail/first frame grabs reviewer attention in 1 second
- [ ] Description/alt text includes GitHub URL and live URL

---

## Reference Screenshots

*These are actual live screenshots of the working SealRail product. Use them as visual grounding for every shot — the generated video should faithfully reflect the real UI shown below.*

### 00 — Landing Page Hero
![Sealkeeper illustration, "The rail between agent work and agent payment" headline, three-step flow, CTAs](screenshots/00_landing_hero.png)

### 00b — Landing Page Sections
![RWA invoice verification, proof explorer link, architecture, full footer](screenshots/00b_landing_sections.png)

### 01 — System Status
![Casper testnet mode, ProofRegistry deployed, LLM configured, DB connected](screenshots/01_status_casper_testnet.png)

### 02 — Proof Explorer
![Payment-backed tasks, proof states, Verified/Pending/Blocked/Paid filters](screenshots/02_proofs_explorer.png)

### 03 — Agent Marketplace
![Agent listings with task types, verifier functions, proof modes](screenshots/03_agents_marketplace.png)

### 04 — Verifier Registry
![Verifier templates defining how agent outputs are checked](screenshots/04_verifiers.png)

### 05 — Live Run Flow (Completed)
![Full proof rail: Payment task created, Agent output, Proof verified, Payment unlocked. Casper deploy hash visible](screenshots/05_run_flow_completed.png)

### 06 — Proof Detail (TEE + Casper)
![Proof bundle JSON: TEE mode, WASM hash, attestation, Casper anchor, x402 receipt](screenshots/06_proof_detail_tee_casper.png)

### 07 — Casper Blockchain Explorer
![Real on-chain anchor_proof transaction on testnet.cspr.live](screenshots/07_casper_explorer_onchain_proof.png)

### 08 — API Documentation
![Quickstart, API reference, code examples (cURL/JSON), LLM runtime](screenshots/08_docs_api_reference.png)

### 09 — API Key Management
![Scoped keys for task, proof, agent, and workflow APIs](screenshots/09_api_keys_management.png)

### 10 — Reviewer Quickstart
![Evaluate SealRail in 60 seconds, proof-gated AI + RWA payment overview](screenshots/10_review_quickstart.png)

### 11 — Run Flow with Verified Output
![Verified agent output: risk score, decision, flags, recommended action, hashes](screenshots/11_run_verified_output.png)

---

## Production Notes

### Tool Chain Recommendation
```
1. Script:      This document → feed into AI video tool
2. Voiceover:   ElevenLabs or OpenAI TTS → export .wav
3. Music:       Suno AI or Epidemic Sound → ambient electronic track
4. Video:       Veo / Runway / Kling — generate scenes from shot list
5. Assembly:    DaVinci Resolve or CapCut — composite scenes + audio
6. Captions:    CapCut auto-captions with custom style
7. Export:      1920×1080, H.264, 60fps
```

### Shot Generation Strategy
```
- Scenes 0, 1, 2, 5, 6, 7: Text/composition shots — best with Kling or Runway
  using detailed style prompts + reference images
- Scene 3 (proof rail): Complex UI animation — consider Claude Design HTML
  artifact for this scene, then screen-record
- Scene 4 (product screens): Screen recording of the actual live product
  is preferred over AI generation for authenticity
```

### Alternative: Full Claude Design HTML
```
If the team has access to Claude Design, the entire video can be produced
as a single self-contained HTML artifact (no AI video tools needed):
  - Write a Claude Design prompt using all sections above
  - Claude Design produces 'SealRail Demo Video.html'
  - Open in browser, press SPACE to play
  - Record with OBS or Recordly for platform exports
```

---

*End of SealRail AI Video Production Brief. Copy any section into your AI video tool and generate.*
