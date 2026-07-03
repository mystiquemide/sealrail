---
name: animated-product-demo
description: Write Claude Design prompt files for animated product demo videos (hackathons, buildathons, pitches). Covers scene breakdown, brand extraction, voiceover sync, judge-wowing proof points, and screenshot gathering.
version: 1.0.0
author: Hermes Agent
license: MIT
metadata:
  hermes:
    tags: [creative, video, demo, hackathon, animation, claude-design, prompt-engineering]
    related_skills: [claude-design, hackathon-demo-video]
---

# Animated Product Demo Prompts

Write a markdown prompt file for Claude Design to produce a self-contained HTML artifact that plays as a timed, auto-advancing animated product demo with AI voiceover. The prompt file becomes the single source of truth handed to Claude Design.

Load `claude-design` alongside this skill — it provides the design process, taste rules, and artifact standards. This skill adds the animated-video-specific structure.

## When To Use

- Hackathon/buildathon demo videos
- Product walkthrough animations
- Animated pitch decks
- Any 2-4 minute motion piece where the product must sell itself

## Prompt File Structure

A well-structured Claude Design animated video prompt has these sections, in order:

### 1. What to build (one paragraph)

State the output: a single self-contained HTML file, auto-playing, timed, with keyboard controls (SPACE, arrows, R). Specify canvas size (1920×1080, 16:9) and scaling behavior.

### 2. Judge requirements (for hackathons — CRITICAL)

List what the video must PROVE to judges. Not "look nice" — "prove the product works." Examples:

```
1. It really works — real deploys, real on-chain proof anchors, real verifier output
2. It uses the target chain — explorer links, deployed contracts, gas paid
3. It has real agents — multiple agent types, marketplace listings, LLM-powered runtimes
4. It supports multiple LLMs — configurable provider, not hard-coded to one
5. It has TEE/safety support — verification mode, hashes, attestations
6. It has APIs — full REST API with scoped keys, code examples
7. It looks professional — premium aesthetic, not generic
```

### 3. Reference screenshots (ALL listed with descriptions)

Before writing the prompt, capture live product screenshots. List each one inline with a one-line description of what it proves. Number them (01, 02, etc.) for easy scene referencing. Example:

```
### 01 — System Status
![Status page](screenshots/01_status.png)
Shows: Casper testnet mode, ProofRegistry deployed, LLM configured, DB connected.
```

### 4. Brand system (extracted from product, not invented)

Read `globals.css`, `layout.tsx`, and component files from the product repo. Extract exact hex colors, font families, logo SVG, and design posture. Do not invent a palette.

### 5. Animation principles (global rules)

Specify easing curves, speed ranges, zoom behaviors, and pulse patterns:

```
- Easing: cubic-bezier(0.22, 0.61, 0.36, 1) for entries
- Speed tiers: fast reveals 200-400ms, medium zooms 600-1000ms, slow pans 1500-2500ms
- Zoom effects: ken burns (0.85→1.05→1.0 over 2s), subtle drift afterward
- Accent pulse: on key moments (proof anchor, payment unlock), 3s loop
- Rail lines: thin 1-2px lines connecting elements, stroke-dashoffset draw-in
```

### 6. Scene breakdown (the core — 7-8 scenes for ~3 minutes)

Each scene specifies:
- **Duration**: exact seconds
- **Visual composition**: what elements, where, colors, sizes
- **Animation details**: every entrance, exit, zoom, stagger, with timing
- **Voiceover line**: exact script, synced
- **Reference screenshot**: which numbered screenshot to match
- **Logo presence**: where the logo lives

Number scenes 0 through N. Pattern:

- Scene 0: Cold open (logo reveal, 8s)
- Scene 1: Problem (headlines + use-case cards, 24s)
- Scene 2: Product answer (tagline + badges, 20s)
- Scene 3: Core proof flow (THE key scene — animated rail with emphasis pauses, 40s)
- Scene 4: Product screens montage (3-4 screens with zooms, 42s)
- Scene 5: Why the chain matters (explainer + evidence, 24s)
- Scene 6: Full ecosystem (use-case grid, 14s)
- Scene 7: Closing with proof (tagline + URL + on-chain evidence, 13s)

### 7. Voiceover guide

Specify voice style, pacing (~150 wpm), tone. Provide audio sync markers as a JS array:

```js
const voiceoverMarkers = [
  { time: 2.0,  text: "This is SealRail." },
  { time: 8.0,  text: "AI agents are starting..." },
  // ...
];
```

### 8. Technical requirements

HTML structure template, timeline engine (requestAnimationFrame + scene manager), animation utility functions (tween, stagger, typewriter, pulse, kenBurns, colorWipe), SVG logo component, keyboard controls, progress bar, responsive fallback, performance caps.

### 9. What NOT to do

Explicit negative constraints: no gradients, no emojis, no fake metrics, no stock illustrations, no external CDN deps, no extra scenes, no movie-trailer voice.

### 10. Verification checklist

Checkable items with `- [ ]` format: file opens, keyboard works, scenes render, logo visible, accent used, total runtime within range, reduced-motion respected.

## Judge-Wowing Techniques

For hackathon/buildathon submissions, embed these proof points:

1. **On-chain evidence**: Show the actual blockchain explorer with a real deploy hash. Mention the explorer URL in the prompt.
2. **Product screens, not mockups**: Reference real screenshots. Claude Design should recreate them faithfully.
3. **Technical badges**: "TEE Verification Mode", "X402 Compatible", "Casper Testnet Verified" as visible pills.
4. **Real hashes**: Include actual deploy/WASM/attestation hashes from a live run. Typewriter-effect them so they're readable.
5. **Multiple capabilities**: Show agents, APIs, verifiers, LLM support, AND the chain — not just one feature.
6. **Dramatic zooms on proof**: Zoom into the anchor card or deploy hash. Pause. Make judges notice.
7. **Split-screen proof**: Side-by-side — product showing "Casper anchor: 0dc77..." and explorer showing the same transaction.

## Screenshot Gathering

Capture live product screenshots via browser tools before writing the prompt:

1. Navigate to each product page
2. Use `browser_vision` to capture (screenshots save to disk even if vision analysis fails)
3. Copy from `/root/.hermes/cache/screenshots/` to a deliverables folder
4. Rename with numbered prefixes: `01_status.png`, `02_proofs.png`, etc.

Organize screenshots covering: status page, proof explorer, agent marketplace, verifier registry, run flow (completed), proof detail, blockchain explorer, API docs, API keys, review/quickstart.

## Edge Cases

- If the product doesn't have a live deploy, use a local screenshot of the running dev server and note it
- If the chain explorer blocks bot access (CORS, JS required), use `browser_navigate` + `browser_vision` instead of `web_extract`
- If `browser_vision` reports "No LLM provider configured for task=vision", ignore the error — the screenshot file is already saved to disk

## Pitfalls

- Do not write the prompt without first capturing real product screenshots. Screenshots ground the prompt in reality.
- Do not skip the "judge proof points" section for hackathons. A pretty video without working-product evidence loses to an ugly one with proof.
- Do not write voiceover scripts that sound like movie trailers. Product narration, flat and confident.
- Do not be vague about animations. Specify exact easing curves, durations, stagger delays, and zoom scales.
- Do not reference screenshots without numbering them. Scene descriptions should say "Match screenshot 05" not "like the run page".
- Do not invent brand colors. Read the actual CSS file from the product repo.
