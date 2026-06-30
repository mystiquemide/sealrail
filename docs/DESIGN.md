# DESIGN.md

Project: Casper agent proof and payment product
Brand direction: Sealrail
Core positioning: No Proof without a Payment.
Version: 2.0
Status: Approved frontend UI design system

## 0. What changed in this rewrite

The former design direction has been stripped out and replaced.

Removed:

- Generic dark SaaS dashboard direction
- Generic proof/payment logo ideas
- Generic card-heavy UI language
- Referenced internal notes instead of written rules
- Shallow page list without section-by-section screens
- Name directions like ProofPay Agents as the recommended brand

Replaced with:

- A full standalone design system
- A distinct brand direction
- Aira-inspired premium editorial structure
- Plain section-by-section landing page plan
- Page-planning style screen wireframes
- Main app screens
- Product states
- Component system
- Logo system
- Mascot system
- Pitch deck direction
- Image generation prompts
- Engineering handoff rules

This file must be enough for an engineer or designer to understand and approve the frontend UI direction for the landing page, app screens, product run flow, and product visuals without needing any other brand document.

## 0.1 Current phase boundary

This document is currently for frontend UI design approval. It defines the full product surface so the UI feels ecosystem-ready, but it is not an instruction to start backend, contract, API, orchestration, payment, or production integration work yet.

This design document is approved. The current next step is the frontend UI implementation plan, then section-by-section frontend build after user confirmation.

---

# 1. Brand core

## 1.1 Recommended brand name

```text
Sealrail
```

## 1.2 Full product descriptor

```text
Sealrail is a Casper-native proof and payment rail for AI-agent work.
```

## 1.3 Core positioning

```text
No Proof without a Payment.
```

## 1.4 One-line pitch

```text
Sealrail lets users create payment-backed AI-agent tasks where payment only becomes available after a verifiable Blocky-compatible proof is anchored on Casper.
```

## 1.5 Why this name

Sealrail is stronger than ProofPay, PayProof, and Casper ProofPay because it feels less generic and less like an existing fintech button.

Meaning:

- Seal means verified, closed, proven, and tamper-resistant.
- Rail means payment movement, infrastructure, and repeatable flow.
- Together it means a rail where agent work is sealed before payment moves.

The name is short, brandable, and still tied to the product logic.

## 1.6 Brand personality

```text
quiet
precise
premium
skeptical
proof-first
payment-aware
infrastructure-grade
```

Sealrail should feel like a financial intelligence terminal, not a cartoon AI app and not a crypto casino.

## 1.7 Emotional hook

```text
AI agents should not get paid for work nobody can verify.
```

## 1.8 Target users

Primary:

- Hackathon judges evaluating Casper utility
- Developers building paid AI agents
- Web3 teams experimenting with agent marketplaces
- Operators who need verifiable agent output

Secondary:

- RWA teams
- Invoice financing products
- DAO operations teams
- Agent infrastructure teams

## 1.9 What must be memorable

The memorable loop is:

```text
Task funded
Agent runs
Proof sealed
Casper anchors
Payment unlocks
```

Every visual and screen should reinforce this loop.

---

# 2. Naming system

## 2.1 Primary name

```text
Sealrail
```

## 2.2 Sponsor-aligned usage

```text
Sealrail on Casper
```

## 2.3 Product category

```text
Proof and payment rail for AI agents
```

## 2.4 Short tagline options

Use one of these depending on context.

| Use case | Tagline |
|---|---|
| Main site | No Proof without a Payment. |
| Task run page | Payment unlocks only after proof. |
| Pitch deck | A proof rail for paid agent work. |
| Dev docs | Verify outputs before settlement. |
| Social post | Agents get paid when work is proven. |

## 2.5 Names not to use as final brand

| Name | Why it is weaker |
|---|---|
| ProofPay Agents | Too obvious and too generic |
| Casper ProofPay | Sponsor-aligned but sounds like a utility label |
| PayProof | Short, but sounds like a receipt app |
| Proofrail | Good infra feel, but payment is weaker |
| AgentProof | Too broad and not payment-specific |
| AttestaPay | Feels constructed and less natural |

---

# 3. Brand story

## 3.1 Problem framing

AI agents can produce reports, scores, research, checks, and decisions. But when money is attached to the work, the buyer needs more than a nice answer.

They need to know:

1. What task was requested?
2. What output did the agent produce?
3. What verifier checked it?
4. What proof was generated?
5. Where is that proof anchored?
6. Why did payment unlock?

Sealrail turns that sequence into a product.

## 3.2 Product thesis

```text
Paid agent work needs a proof rail, not just a chat box.
```

## 3.3 First production vertical

```text
RWA invoice verification agent
```

The run uses invoice risk analysis because it is easy for judges to understand:

- User submits invoice details.
- Agent proposes a risk result.
- Verifier checks the result.
- Proof hash is anchored on Casper.
- Payment state changes from blocked to unlocked.

## 3.4 Honest proof language

Allowed wording:

```text
TEE-compatible attestation
Verified through the attestation verifier
Built for TEE verification
Proof hash anchored on Casper
Payment unlocked after proof
TEE verification mode
```

Forbidden wording until the real TEE service is fully connected:

```text
Ran inside a real TEE
Production TEE verified
Hosted Blocky TEE proof completed
Confidential compute proof
Real enclave execution
```

---

# 4. Visual identity

## 4.1 Visual direction

Sealrail should feel like:

```text
premium financial intelligence
agent settlement infrastructure
editorial trust product
proof terminal
payment rail
```

It should not feel like:

```text
generic AI startup
gradient-heavy Web3 product
cartoon robot dashboard
cyberpunk wallet app
random blockchain explorer
```

## 4.2 Visual motifs

Use these motifs repeatedly:

| Motif | Meaning | Usage |
|---|---|---|
| Sealed node | Verified proof | Logo, success state, proof detail |
| Twin rails | Payment path | Background lines, diagrams, nav mark |
| Stamped hash | Anchored proof | Proof explorer, details page |
| Locked payment cell | Payment blocked | Run before verification |
| Open payment cell | Payment unlocked | Run success state |
| Thin ledger lines | Financial trust | Tables, timelines, dividers |
| Small status labels | Proof states | All app screens |

## 4.3 Aesthetic rules

```text
Serif headlines
Small uppercase labels
Warm paper explainer sections
Black verification sections
Thin dividers
Sparse proof objects
Minimal semantic accents
No generic feature cards
No glassmorphism
No neon gradients
No heavy shadows
```

---

# 5. Logo system

## 5.1 Logo concept

```text
A sealed proof node locked between two payment rails.
```

This is not a shield, not a cube, not a checkmark, and not a robot.

## 5.2 Logo anatomy

The mark has three parts:

1. Two horizontal rails.
2. A small circular seal interrupting the rails.
3. A notch or offset cut inside the seal that hints at a locked payment state.

ASCII concept:

```text
rail       seal       rail
───────╮   ◌   ╭───────
       ╰───●───╯
```

Alternative monoline concept:

```text
S shaped rail path wrapping one proof seal

╭────●
│
●────╯
```

## 5.3 Wordmark

Wordmark:

```text
Sealrail
```

Rules:

- Lowercase or title case is allowed.
- Prefer title case in headings and nav.
- Use a calm sans wordmark, not a heavy tech font.
- Do not use a generic shield icon.
- Do not use a cube icon.
- Do not use a chain-link icon.
- Do not use a robot head.
- Do not use a common payment card icon.

## 5.4 Logo color variants

| Variant | Background | Mark | Wordmark |
|---|---|---|---|
| Primary dark | `#080808` | `#F9F8F6` with `#FF2D2D` seal mark | `#FFFFFF` |
| Light | `#F9F8F6` | `#2C2C2B` with `#FF2D2D` seal mark | `#2C2C2B` |
| Mono | Any | Single color | Single color |
| App icon | `#080808` | Seal rail only | No wordmark |

## 5.5 Logo generation prompt

```text
Create a minimal premium logo mark and wordmark for a product named Sealrail. The mark is a sealed proof node locked between two horizontal payment rails. It must not look like a shield, cube, robot, checkmark, chain link, or credit card. Use a calm financial infrastructure style, monoline geometry, black background, warm paper mark, one small Casper red seal mark. Wordmark: Sealrail. Premium editorial fintech feel, not crypto casino, not generic AI SaaS.
```

---

# 6. Color system

## 6.1 Core palette

| Token | Hex | Usage |
|---|---|---|
| Black base | `#080808` | Hero, verification sections, app shell |
| Ink black | `#111111` | App panels and proof tables |
| Warm paper | `#F9F8F6` | Editorial landing sections |
| Warm gray | `#F0EFED` | Alternating light sections |
| Charcoal | `#2C2C2B` | Text on light surfaces |
| Soft white | `#F6F5F3` | Text on dark surfaces |
| White | `#FFFFFF` | Primary CTA on dark surfaces |
| Muted gray | `#888888` | Metadata, labels, secondary text |
| Soft line light | `rgba(0,0,0,0.08)` | Light section dividers |
| Soft line dark | `rgba(255,255,255,0.12)` | Dark section dividers |
| Proof green | `#64D96B` | Verified, payable, success |
| Risk red | `#F45B45` | Failed proof, blocked payment |
| Warning amber | `#F2B84B` | TEE verification mode |
| Casper red | `#FF2D2D` | Sparse sponsor accent |
| API blue | `#3C8DFF` | Developer/API signals |

## 6.2 Color behavior

Rules:

- Use black and warm paper as the dominant palette.
- Use Casper red sparingly, never as a full-page wash.
- Use success color only when something is verified or payable.
- Use amber only for pending verification or attention states.
- Use red only for failed proof or blocked payment.
- Do not use purple, cyan, or rainbow gradients.
- Do not introduce random SaaS blue outside API contexts.

## 6.3 Background rhythm

Landing page should alternate:

```text
Black hero
Warm paper product explanation
Black proof flow
Warm gray use cases
Black proof explorer
Warm paper honest mode
Black final CTA
Warm paper footer
```

App screens should use:

```text
Black base
Ink panels
Warm paper detail sheets where needed
Text labels for state
```

---

# 7. Typography system

## 7.1 Type philosophy

Use serif type for authority and calm. Use sans type for utility. Use mono type only for machine-readable proof.

## 7.2 Font stacks

```css
--font-serif: "Georgia", "Times New Roman", serif;
--font-sans: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
--font-mono: "JetBrains Mono", "SFMono-Regular", "Roboto Mono", monospace;
```

## 7.3 Type scale

| Role | Desktop | Mobile | Line height | Weight | Color |
|---|---:|---:|---:|---:|---|
| Hero H1 | 72px | 42px | 0.96 | 400 | `#F6F5F3` |
| Section H2 | 56px | 34px | 1.0 | 400 | context-based |
| Page H1 | 48px | 34px | 1.0 | 400 | context-based |
| Feature H3 | 34px | 26px | 1.08 | 400 | context-based |
| Module title | 22px | 20px | 1.15 | 400 | context-based |
| Body | 16px | 15px | 1.55 | 400 | context-based |
| Small body | 14px | 14px | 1.5 | 400 | muted |
| Label | 11px | 10px | 1.2 | 400 | uppercase tracked |
| Hash | 12px | 11px | 1.45 | 400 | mono |

## 7.4 Typography rules

- Use weight 400 by default.
- Avoid bold and extra-bold.
- Labels are uppercase with letter spacing.
- Hashes must use mono.
- Do not center long paragraphs.
- Do not use more than two font families plus mono.
- Avoid oversized body text in app panels.

---

# 8. Icon and illustration system

## 8.1 Icon style

Use thin-line icons with financial terminal precision.

Icon rules:

- 1.25px to 1.5px stroke.
- Rounded joins are acceptable but not bubbly.
- No filled cartoon icons.
- No emoji icons in production UI.
- No generic AI sparkle icons.
- All icons must map to product nouns.

## 8.2 Required icons

| Icon | Meaning |
|---|---|
| Sealed node | Proof verified |
| Twin rail | Payment rail |
| Lock cell | Payment blocked |
| Open cell | Payment unlocked |
| Anchor pin | Casper anchor |
| WASM chip | Verifier function |
| Ledger line | Proof history |
| Warning label | TEE verification mode |
| API bracket | Developer output |

## 8.3 Illustration style

Illustrations should look like product diagrams, not marketing cartoons.

Use:

- Rail diagrams.
- Proof object stacks.
- Terminal screenshots.
- Ledger rows.
- Payment state machines.

Avoid:

- Robot mascots in hero.
- 3D floating coins.
- Blockchain cubes.
- Magic AI glow.
- Generic neural network blobs.

---

# 9. Mascot system

## 9.1 Mascot decision

Sealrail can have a small mascot, but it must not dominate the brand.

Mascot name:

```text
The Sealkeeper
```

## 9.2 Mascot concept

```text
A quiet proof courier that carries sealed payment intents along the rail.
```

The Sealkeeper is not a robot assistant. It is a small inspector-courier character used for empty states, onboarding, and social visuals.

## 9.3 Personality

```text
skeptical
calm
precise
fast
trust-first
slightly dry
```

## 9.4 Silhouette

- Small cloaked courier or inspector form.
- Minimal face or visor.
- Carries a sealed ledger tag.
- One small Casper-red status light.
- Thin rail line trailing behind.
- No oversized head.
- No childish mascot proportions.

## 9.5 Mascot usage rules

| Context | Usage |
|---|---|
| Empty state | Sealkeeper waits beside an unopened payment cell |
| Proof pending | Sealkeeper inspects a sealed node |
| Success state | Sealkeeper stamps the proof rail |
| Error state | Sealkeeper blocks a red payment gate |
| Pitch deck | Use as a small visual guide through the flow |
| Social graphics | Use for memorability |

Do not place the mascot in the main hero unless it is subtle and secondary to the proof/payment visual.

## 9.6 Mascot generation prompt

```text
Create a premium minimal character mascot named The Sealkeeper for Sealrail, a proof and payment rail for AI-agent work. The character is a quiet inspector courier carrying a sealed ledger tag along two thin payment rails. Small silhouette, calm expression, minimal visor, one small Casper red seal mark, warm paper and black palette, editorial fintech style, not cute, not childish, not a robot, no crypto coins, no neon background.
```

---

# 10. Product UX principles

## 10.0 Real product rule

Sealrail must behave like a real product. Do not present fake agents, fake listings, fake workflows, fake reputation, fake API keys, fake payments, or fake proof records as real. If no record exists yet, show a truthful empty state with a create action.

The product UI must use concrete product language: task, run, proof run, workflow run, marketplace task, or invoice verification run.

## 10.1 Primary UX rule

The payment state and proof state must always be visually separate.

Never make users guess whether something is:

- Funded
- Running
- Verified
- Anchored
- Payable
- Paid
- Failed

## 10.2 Judge run rule

A judge must understand the run in 10 seconds and complete the loop in 90 seconds.

The run must show:

```text
Payment intent created
Agent output generated
Blocky-compatible verification passed
Casper anchor created
Payment unlocked
```

## 10.3 TEE verification language rule

Public-facing UI should say:

```text
TEE Verification Mode
TEE-backed verification path
Attestation verifier passed
Payment unlocked after proof
```

Do not expose implementation-mode wording on judge-facing screens.

## 10.4 Product state model

| State | Meaning | Color | UI copy |
|---|---|---|---|
| Draft | Task not funded | Muted gray | Draft task |
| Funded | Payment intent exists | Amber | Payment intent created |
| Running | Agent processing | API blue | Agent running |
| Proof pending | Output waiting for verification | Amber | Waiting for proof |
| Proof verified | Verifier passed | Proof green | Proof verified |
| Anchored | Hash anchored on Casper | Proof green | Casper anchor recorded |
| Payable | Payment can be claimed | Proof green | Payment unlocked |
| Paid | Payment completed | Proof green | Agent paid |
| Blocked | Verification failed | Risk red | Payment blocked |
| TEE verification | Proof verification path | Warning amber | TEE Verification Mode |

---

# 11. Information architecture

## 11.1 Required routes

| Route | Page name | Purpose |
|---|---|---|
| `/` | Landing page | Explain Sealrail and drive users into a real task run |
| `/run` | Task runner | Create and execute an invoice verification run |
| `/marketplace` | Marketplace | Browse live proof-backed agents from real records |
| `/marketplace/[listingId]` | Listing detail | View one listing and start a paid task |
| `/agents` | Agent registry | Browse registered agents |
| `/agents/[agentId]` | Agent profile | Show agent details, reputation, verifiers, and proofs |
| `/owner` | Agent owner dashboard | Manage owned agents, listings, tasks, and earnings |
| `/owner/agents/new` | Register agent | Create a working agent profile |
| `/owner/agents/[agentId]` | Manage agent | Manage one owned agent |
| `/workflows` | Workflow library | Browse multi-agent workflows |
| `/workflows/new` | Create workflow | Compose a multi-agent workflow |
| `/workflows/[workflowId]` | Workflow detail | Run and inspect a workflow |
| `/verifiers` | Verifier library | Browse registered verifier templates |
| `/verifiers/new` | Register verifier | Upload or register a verifier template |
| `/proofs` | Proof explorer | Browse payment-backed proof records |
| `/proofs/[proofId]` | Proof detail | Inspect one proof and payment trail |
| `/api-keys` | API key management | Create, scope, copy once, and revoke API keys |
| `/docs` | Developer docs | Explain architecture, API, TEE verification mode |
| `/status` | System status | Show Casper, Blocky adapter, and backend health |
| `/privacy` | Privacy policy | Concise privacy policy for users and judges |
| `/terms` | Terms of use | Concise terms for users and judges |

## 11.2 Navigation

Desktop nav:

```text
Sealrail
Marketplace
Workflows
Proofs
Agents
Docs
[Start task]
```

Mobile nav:

```text
Sealrail
Menu
- Marketplace
- Workflows
- Proofs
- Agents
- Docs
- Start task
```

## 11.3 Footer

Footer columns:

```text
Product
- How it works
- Run
- Proof explorer
- Agents

Developers
- Architecture
- API
- Casper contract
- Blocky adapter

Project
- GitHub
- Casper Buildathon
- TEE verification note

Legal
- Privacy
- Terms

Legal style note
- Keep legal copy concise
- Use plain English
- Avoid scary boilerplate
- Do not hide important proof, API key, or payment rules
```

---

# 12. Landing page wireframe

The landing page must be built section by section. Do not build all sections in one prompt. Each section must be reviewed before the next section begins.

## 12.1 Landing page screen map

```text
/

┌────────────────────────────────────────────────────────────────────┐
│ 01 NAV                                                             │
│ Sealrail        How it works  Proofs  Agents  Docs   [Start run]   │
└────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────┐
│ 02 HERO                                                            │
│ CASPER PROOF AND PAYMENT RAIL                                      │
│                                                                    │
│ No Proof without a Payment.                                        │
│                                                                    │
│ Sealrail makes AI-agent work payable only after a verifiable        │
│ Blocky-compatible proof is anchored on Casper.                     │
│                                                                    │
│ [Start verification run] [View proof trail]                             │
│                                                                    │
│ Right visual:                                                       │
│ ┌──────────────────────────────┐                                   │
│ │ PaymentIntent                │                                   │
│ │ status: funded               │                                   │
│ ├──────────────────────────────┤                                   │
│ │ AgentOutput                  │                                   │
│ │ invoice_risk: medium         │                                   │
│ ├──────────────────────────────┤                                   │
│ │ BlockyClaim                  │                                   │
│ │ status: verified             │                                   │
│ ├──────────────────────────────┤                                   │
│ │ CasperAnchor                 │                                   │
│ │ hash: 0x80d0...cd44          │                                   │
│ └──────────────────────────────┘                                   │
└────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────┐
│ 03 PRODUCT FAMILY                                                  │
│ PRODUCTS                                                           │
│ The rail between agent work and agent payment.                     │
│                                                                    │
│ Proof Tasks        Verifier Rail        Casper Anchor              │
│ Fund the task      Check the output     Record the proof           │
└────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────┐
│ 04 PROOF FLOW                                                      │
│ HOW IT WORKS                                                       │
│ The payment does not move until the proof is sealed.               │
│                                                                    │
│ 01 Payment intent created                                          │
│ 02 Agent produces invoice risk result                              │
│ 03 WASM verifier checks the output                                 │
│ 04 Proof hash anchors on Casper                                    │
│ 05 Payment unlocks                                                 │
└────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────┐
│ 05 SCALE STRIP                                                     │
│ Built for trust before scale.                                      │
│                                                                    │
│ 1 payment intent   1 verifier function   1 Casper anchor   0 paid │
│ per task           per task              per proof          w/o    │
│                                                            proof   │
└────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────┐
│ 06 FIRST PRODUCT VERTICAL                                                   │
│ RWA invoice verification is the first proof rail.                  │
│                                                                    │
│ Invoice submitted                                                  │
│ Agent risk score                                                   │
│ Blocky-compatible check                                            │
│ Casper anchor                                                      │
│ Payment unlocked                                                   │
└────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────┐
│ 07 PROOF EXPLORER PREVIEW                                          │
│ Inspect every proof before payment.                                │
│                                                                    │
│ Task ID       Agent        Mode        Casper hash       Payment   │
│ INV-1024      Invoice AI   TEE mode    0x80d0...cd44    Payable   │
│ INV-1025      Invoice AI   TEE mode    Pending          Blocked   │
└────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────┐
│ 08 TEE VERIFICATION                                                │
│ Verification before settlement.                                    │
│                                                                    │
│ The run uses a TEE verification layer to check agent output before │
│ payment can unlock.                                                │
│                                                                    │
│ [TEE Verification Mode] [TEE Verification] [Casper Anchored]       │
└────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────┐
│ 09 FINAL CTA                                                       │
│ Pay agents only after proof.                                       │
│ [Start verification run] [Read architecture]                            │
└────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────┐
│ 10 FOOTER                                                          │
│ Product | Developers | Project | TEE verification note             │
└────────────────────────────────────────────────────────────────────┘
```

## 12.2 Landing page section build order

| Order | Section | Build notes |
|---:|---|---|
| 1 | Nav and global shell | Establish logo, palette, typography, layout width |
| 2 | Hero | Build only hero and proof stack visual |
| 3 | Product family | Warm paper explainer section |
| 4 | Proof flow | Black section with numbered rail flow |
| 5 | Scale strip | Large metrics with thin dividers |
| 6 | First production vertical | RWA invoice story, no generic cards |
| 7 | Proof explorer preview | Table-style proof browser preview |
| 8 | Honest mode | TEE verification note and hosted path |
| 9 | Final CTA | Simple black CTA section |
| 10 | Footer | Warm paper footer with project trust info |

---

# 13. App screen wireframes

## 13.1 `/run` screen

Purpose: Run the main product proof/payment flow.

```text
/run

┌────────────────────────────────────────────────────────────────────┐
│ NAV                                                                │
│ Sealrail      Proofs  Agents  Docs                  [View proofs]  │
└────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────┐
│ PAGE HEADER                                                        │
│ Run a payment-backed invoice proof.                                │
│ Create a funded task, verify the agent output, anchor the proof,   │
│ and unlock payment.                                                │
│ Mode badge: TEE Verification Mode                                  │
└────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────┬─────────────────────────────────────┐
│ LEFT: TASK FORM              │ RIGHT: LIVE PROOF RAIL              │
│                              │                                     │
│ Invoice ID                   │ 01 Payment intent                   │
│ Amount                       │    status: created                  │
│ Vendor                       │                                     │
│ Buyer                        │ 02 Agent output                     │
│ Due date                     │    status: waiting                  │
│ Notes                        │                                     │
│                              │ 03 Blocky-compatible check          │
│ [Create payment task]        │    status: waiting                  │
│ [Run agent check]            │                                     │
│ [Verify proof]               │ 04 Casper anchor                    │
│ [Unlock payment]             │    status: waiting                  │
│                              │                                     │
│                              │ 05 Payment unlock                   │
│                              │    status: blocked                  │
└──────────────────────────────┴─────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────┐
│ VERIFIED OUTPUT                                                    │
│ Risk score: Medium                                                 │
│ Decision: Approve with review                                      │
│ Reason: Payment history and due-date variance require review.      │
└────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────┐
│ PROOF HASHES                                                       │
│ WASM code hash: b94f...bb69f                                       │
│ Attestation hash: 80d0...cd44                                      │
│ Casper anchor: pending or live hash                                │
│ [Copy proof bundle] [Open proof detail]                            │
└────────────────────────────────────────────────────────────────────┘
```

Required run states:

- Empty form
- Payment task created
- Agent running
- Proof pending
- Proof verified
- Casper anchor pending
- Casper anchor complete
- Payment unlocked
- Verification failed

## 13.2 `/proofs` screen

Purpose: Browse proof records.

```text
/proofs

┌────────────────────────────────────────────────────────────────────┐
│ PAGE HEADER                                                        │
│ Proof explorer                                                     │
│ Every row is a payment-backed agent task with a proof state.       │
│ [Start new run]                                                     │
└────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────┐
│ FILTER BAR                                                         │
│ Search task ID                                                     │
│ Status: All | Verified | Pending | Blocked | Paid                  │
│ Mode: All | TEE Verification Mode | TEE Verification               │
└────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────┐
│ PROOF TABLE                                                        │
│ Task ID     Agent       Proof state    Payment state   Casper      │
│ INV-1024    Invoice AI  Verified       Payable         Anchored    │
│ INV-1025    Invoice AI  Pending        Blocked         Pending     │
│ INV-1026    Invoice AI  Failed         Blocked         None        │
│                                                                    │
│ Row action: Open proof                                             │
└────────────────────────────────────────────────────────────────────┘
```

Required states:

- Empty explorer
- Loading proofs
- Proof rows loaded
- Filter with no results
- Error loading proofs

## 13.3 `/proofs/[taskId]` screen

Purpose: Inspect one full proof and payment trail.

```text
/proofs/INV-1024

┌────────────────────────────────────────────────────────────────────┐
│ STATUS HEADER                                                      │
│ INV-1024                                                           │
│ Proof verified. Payment unlocked.                                  │
│ [Copy proof bundle] [Back to proofs]                               │
└────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────┬─────────────────────────────────────┐
│ PAYMENT STATE                │ AGENT OUTPUT                        │
│ Payment intent: created      │ Agent: Invoice Risk Agent           │
│ Amount: task amount          │ Result: Medium risk                 │
│ Status: Payable              │ Decision: Approve with review       │
│ Unlock rule: proof required  │ Timestamp: run timestamp     │
└──────────────────────────────┴─────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────┐
│ BLOCKY-COMPATIBLE VERIFICATION                                     │
│ Mode: TEE Verification Mode                                        │
│ Verifier: verifyInvoiceRisk                                        │
│ WASM hash: b94f...bb69f                                            │
│ Attestation hash: 80d0...cd44                                      │
│ Result: success true                                               │
└────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────┐
│ CASPER ANCHOR                                                      │
│ Chain: Casper testnet                                              │
│ Contract: ProofRegistry                                            │
│ Proof key: task hash                                               │
│ Anchor status: anchored or pending                                 │
│ Explorer link: available after live anchor                         │
└────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────┐
│ RAW PROOF BUNDLE                                                   │
│ JSON viewer with copy button                                       │
└────────────────────────────────────────────────────────────────────┘
```

## 13.4 `/agents` screen

Purpose: Show verifier agents and what each can prove.

```text
/agents

┌────────────────────────────────────────────────────────────────────┐
│ PAGE HEADER                                                        │
│ Verifier agents                                                    │
│ Each agent maps to a task type, verifier function, and proof mode. │
│ [Start invoice run]                                                 │
└────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────┐
│ AGENT LIST                                                         │
│                                                                    │
│ Invoice Risk Agent                                                 │
│ Task: RWA invoice verification                                     │
│ Verifier: verifyInvoiceRisk                                        │
│ Mode: TEE Verification Mode                                        │
│ Status: Active                                                     │
│ [Start run] [View proofs]                                           │
│                                                                    │
│ DeFi Risk Agent                                                    │
│ Task: Future extension                                             │
│ Status: Planned                                                    │
│                                                                    │
│ Research Agent                                                     │
│ Task: Future extension                                             │
│ Status: Planned                                                    │
└────────────────────────────────────────────────────────────────────┘
```


## 13.5 `/marketplace` screen

Purpose: Browse live proof-backed agents. Listings must come from real MarketplaceListing records linked to Agent and VerifierTemplate records.

```text
/marketplace

┌────────────────────────────────────────────────────────────────────┐
│ PAGE HEADER                                                        │
│ Agent marketplace                                                  │
│ Hire agents that only become payable after proof.                  │
│ [Register agent] [Create verifier]                                 │
└────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────┐
│ FILTERS                                                            │
│ Category: All | Invoice | DeFi | Research | Compliance | Custom    │
│ Proof mode: TEE Verification Mode | TEE Verification               │
│ Status: Live | Paused                                              │
└────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────┐
│ LISTINGS                                                           │
│ Agent               Proof requirement      Price      Reputation   │
│ Invoice Risk Agent  verifyInvoiceRisk      4 CSPR     92 / 100     │
│ Research Checker    citation verifier      7 CSPR     84 / 100     │
│ DeFi Risk Agent     threshold verifier     10 CSPR    88 / 100     │
│                                                                    │
│ Row action: Open listing                                           │
└────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────┐
│ EMPTY STATE                                                        │
│ No live listings yet. Register an agent, attach a verifier, and    │
│ publish the listing.                                               │
│ [Register agent]                                                   │
└────────────────────────────────────────────────────────────────────┘
```

Required behavior:

- Load listings from real records.
- Never show fake listings as real.
- Show a truthful empty state if no listings exist.
- Starting a task from a listing must create a real Task and Payment record.

## 13.6 `/marketplace/[listingId]` screen

Purpose: Inspect one agent listing and start a paid task.

```text
/marketplace/listing_invoice_risk

┌────────────────────────────────────────────────────────────────────┐
│ LISTING HEADER                                                     │
│ Invoice Risk Agent                                                 │
│ Payment-backed invoice risk verification.                         │
│ Price: 4 CSPR                                                      │
│ Proof requirement: verifyInvoiceRisk                               │
│ [Start paid task] [View agent profile]                             │
└────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────┬─────────────────────────────────────┐
│ TASK INPUT                   │ AGENT AND VERIFIER                  │
│ Invoice ID                   │ Agent owner: wallet address         │
│ Amount                       │ Verifier: verifyInvoiceRisk         │
│ Vendor                       │ Mode: TEE Verification Mode         │
│ Buyer                        │ Reputation: 92 / 100                │
│ Due date                     │ Verified runs: 21                   │
│ [Create paid task]           │ Failed proofs: 1                    │
└──────────────────────────────┴─────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────┐
│ RECENT PROOFS                                                      │
│ Proof ID       Task        State        Payment       Casper        │
│ proof_1024     INV-1024    Verified     Paid          Anchored      │
└────────────────────────────────────────────────────────────────────┘
```

Required behavior:

- Listing must exist as a MarketplaceListing record.
- Agent must exist as an Agent record.
- Verifier must exist as a VerifierTemplate record.
- Start paid task must create Task, Payment, and PaymentRecipient records.

## 13.7 `/agents/[agentId]` screen

Purpose: Show a real agent profile and proof-derived reputation.

```text
/agents/agent_invoice_risk

┌────────────────────────────────────────────────────────────────────┐
│ AGENT HEADER                                                       │
│ Invoice Risk Agent                                                 │
│ Category: Invoice verification                                     │
│ Owner: wallet address                                              │
│ Status: Active                                                     │
│ [Start task] [Open listing]                                        │
└────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────┬─────────────────────────────────────┐
│ REPUTATION                   │ VERIFIERS                           │
│ Score: 92 / 100              │ verifyInvoiceRisk                   │
│ Verified runs: 21            │ input schema: invoice json          │
│ Paid tasks: 20               │ output schema: risk decision json   │
│ Failed proofs: 1             │ WASM hash: b94f...bb69f             │
│ Total earned: 80 CSPR        │                                     │
└──────────────────────────────┴─────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────┐
│ PROOF HISTORY                                                      │
│ Proof ID       Task        Verifier            Payment             │
│ proof_1024     INV-1024    verifyInvoiceRisk   Paid                │
└────────────────────────────────────────────────────────────────────┘
```

Required behavior:

- Reputation is calculated from proof and payment records.
- No star ratings unless they are derived from real proof history.

## 13.8 `/owner` screen

Purpose: Let an agent owner manage agents, listings, tasks, verifiers, and earnings.

```text
/owner

┌────────────────────────────────────────────────────────────────────┐
│ OWNER DASHBOARD                                                    │
│ Manage proof-backed agents and payments.                          │
│ [Register agent] [Create listing] [Register verifier]              │
└────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────┬─────────────────────────────────────┐
│ OWNED AGENTS                 │ EARNINGS                            │
│ Invoice Risk Agent           │ Total earned: 80 CSPR               │
│ Payment Approval Agent       │ Unlockable: 12 CSPR                 │
│                              │ Blocked: 4 CSPR                    │
└──────────────────────────────┴─────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────┐
│ INCOMING TASKS                                                     │
│ Task ID       Agent               State        Payment             │
│ INV-2041      Invoice Risk Agent  Running      Locked              │
└────────────────────────────────────────────────────────────────────┘
```

Required behavior:

- Load owned agents by owner identity.
- Earnings come from real PaymentRecipient records.
- Incoming tasks come from real Task records.

## 13.9 `/owner/agents/new` screen

Purpose: Create a real agent record and optionally publish a marketplace listing.

```text
/owner/agents/new

┌────────────────────────────────────────────────────────────────────┐
│ REGISTER AGENT                                                     │
│ Create an agent that can receive payment-backed tasks.             │
└────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────┬─────────────────────────────────────┐
│ AGENT DETAILS                │ VERIFIER AND PAYMENT                │
│ Agent name                   │ Verifier template                   │
│ Category                     │ Task type                           │
│ Description                  │ Price amount                        │
│ Supported task types         │ Currency                            │
│ Owner wallet                 │ Recipient address                   │
│                              │ Publish listing: yes or no          │
│ [Create agent]               │                                     │
└──────────────────────────────┴─────────────────────────────────────┘
```

Required behavior:

- Creates Agent record.
- If publish listing is selected, creates MarketplaceListing record.
- Validates that selected verifier exists.

## 13.10 `/workflows` screen

Purpose: Browse and create real multi-agent workflows.

```text
/workflows

┌────────────────────────────────────────────────────────────────────┐
│ WORKFLOWS                                                          │
│ Run multiple agents, verify each step, then unlock split payment.  │
│ [Create workflow]                                                  │
└────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────┐
│ WORKFLOW LIST                                                      │
│ Name                    Steps     Split rule       State           │
│ Invoice Settlement      3         60 / 30 / 10     Active          │
│                                                                    │
│ Row action: Open workflow                                          │
└────────────────────────────────────────────────────────────────────┘
```

## 13.11 `/workflows/[workflowId]` screen

Purpose: Run a multi-agent workflow and inspect step proofs.

```text
/workflows/invoice_settlement

┌────────────────────────────────────────────────────────────────────┐
│ WORKFLOW HEADER                                                    │
│ Invoice Settlement Workflow                                        │
│ Steps: Invoice Risk Agent, Payment Approval Agent, Settlement      │
│ [Run workflow]                                                     │
└────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────┐
│ STEP RUNS                                                          │
│ 01 Invoice Risk Agent       verifier: verifyInvoiceRisk    Waiting │
│ 02 Payment Approval Agent   verifier: approvalVerifier     Waiting │
│ 03 Settlement Verifier      verifier: finalProofVerifier   Waiting │
└────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────┐
│ PAYMENT SPLIT                                                      │
│ Recipient                 Role             Share      State        │
│ Invoice Risk Agent        primary_agent    60%        Locked       │
│ Payment Approval Agent    workflow_step    30%        Locked       │
│ Platform/verifier fee     verifier         10%        Locked       │
└────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────┐
│ FINAL PROOF BUNDLE                                                 │
│ Step proof hash 01                                                 │
│ Step proof hash 02                                                 │
│ Step proof hash 03                                                 │
│ Split bundle hash                                                  │
│ Casper anchor                                                      │
└────────────────────────────────────────────────────────────────────┘
```

Required behavior:

- Creates WorkflowRun record.
- Creates WorkflowStepRun records.
- Creates one proof per step.
- Creates final proof bundle.
- Unlocks PaymentRecipient records based on proof dependencies.

## 13.12 `/verifiers` and `/verifiers/new` screens

Purpose: Manage real verifier templates.

```text
/verifiers

┌────────────────────────────────────────────────────────────────────┐
│ VERIFIER LIBRARY                                                   │
│ Templates that define how agent outputs are checked.               │
│ [Register verifier]                                                │
└────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────┐
│ TEMPLATE LIST                                                      │
│ Name                    Task type      WASM hash        State      │
│ verifyInvoiceRisk       invoice        b94f...bb69f     Active     │
└────────────────────────────────────────────────────────────────────┘
```

```text
/verifiers/new

┌────────────────────────────────────────────────────────────────────┐
│ REGISTER VERIFIER                                                  │
│ Store verifier schema and WASM hash metadata.                      │
└────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────┬─────────────────────────────────────┐
│ VERIFIER DETAILS             │ SCHEMA AND ARTIFACT                 │
│ Name                         │ Input schema                        │
│ Task type                    │ Output schema                       │
│ Description                  │ WASM hash                           │
│ Owner wallet                 │ Mode support                        │
│ [Test verifier]              │ [Publish template]                  │
└──────────────────────────────┴─────────────────────────────────────┘
```

Required behavior:

- Creates VerifierTemplate records.
- Tests the verifier against valid input where possible.
- Does not show verifier templates that are not backed by records.

## 13.13 `/api-keys` screen

Purpose: Manage real developer API keys.

```text
/api-keys

┌────────────────────────────────────────────────────────────────────┐
│ API KEYS                                                           │
│ Create scoped keys for task, proof, agent, and workflow APIs.      │
│ [Create key]                                                       │
└────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────┐
│ KEYS TABLE                                                         │
│ Name             Prefix      Scopes                  Last used     │
│ Backend runner   sr_live...  tasks:write proofs:read Today         │
│                                                                    │
│ Row action: Revoke                                                 │
└────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────┐
│ CREATE KEY MODAL                                                   │
│ Name                                                               │
│ Scopes                                                             │
│ Create key                                                         │
│ Secret shown once after creation                                   │
└────────────────────────────────────────────────────────────────────┘
```

Required behavior:

- Generate real secret.
- Show secret once.
- Store only hashed secret.
- Support scopes and revoke state.

## 13.14 `/docs` screen

Purpose: Concise developer and judge explanation. The documentation page must be short enough to scan in under two minutes.

```text
/docs

┌────────────────────────────────────────────────────────────────────┐
│ PAGE HEADER                                                        │
│ How Sealrail works                                                 │
│ The proof and payment rail in plain English.                       │
│ [Start task] [View proofs]                                         │
└────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────┐
│ SECTION: Core loop                                                 │
│ 1. Create payment intent                                           │
│ 2. Run agent                                                       │
│ 3. Verify output                                                   │
│ 4. Anchor proof                                                    │
│ 5. Unlock payment                                                  │
└────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────┐
│ SECTION: Architecture                                              │
│ Frontend -> API -> Agent -> Verifier -> Casper -> Payment state    │
└────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────┐
│ SECTION: API quickstart                                            │
│ POST /api/tasks                                                    │
│ POST /api/tasks/:id/run                                            │
│ POST /api/tasks/:id/verify                                         │
│ POST /api/proofs/:id/anchor                                        │
└────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────┐
│ SECTION: TEE verification path                                     │
│ Sealrail uses a TEE verification layer to check agent output       │
│ before payment can unlock.                                         │
└────────────────────────────────────────────────────────────────────┘
```

Documentation rules:

- Keep every docs section under 120 words.
- Prefer tables, numbered steps, and short code blocks.
- Do not bury the core loop under long explanations.
- Include one API quickstart only.
- Link to Privacy and Terms in the footer.
- Do not include walls of legal text on the docs page.

## 13.15 `/privacy` screen

Purpose: Concise privacy policy.

```text
/privacy

┌────────────────────────────────────────────────────────────────────┐
│ Privacy                                                            │
│ Short, plain-English policy for task data, proof data, API keys,   │
│ wallet identity, and system logs.                                  │
└────────────────────────────────────────────────────────────────────┘

Sections:
1. What Sealrail collects
2. API keys
3. Proof and chain data
4. What Sealrail does not sell
5. Data retention
6. Security basics
7. Contact
```

## 13.16 `/terms` screen

Purpose: Concise terms of use.

```text
/terms

┌────────────────────────────────────────────────────────────────────┐
│ Terms of Use                                                       │
│ Plain rules for users, agent owners, verifier use, proofs,         │
│ payments, availability, and liability.                             │
└────────────────────────────────────────────────────────────────────┘

Sections:
1. Product purpose
2. User responsibilities
3. Agent owner responsibilities
4. Proofs and payments
5. No unsupported claims
6. Availability
7. Limitation of liability
8. Contact
```

## 13.17 `/status` screen

Purpose: Show system readiness.

```text
/status

┌────────────────────────────────────────────────────────────────────┐
│ PAGE HEADER                                                        │
│ System status                                                      │
│ Health checks for the proof and payment rail.                      │
└────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────┐
│ STATUS ROWS                                                        │
│ Backend API             Online or Offline                          │
│ TEE verifier            Ready or Missing                           │
│ Casper RPC              Connected or Failed                        │
│ ProofRegistry contract  Deployed or Pending                        │
│ CSPR.cloud              Connected or Missing                       │
└────────────────────────────────────────────────────────────────────┘
```

---

# 14. Component system

## 14.1 Component inventory

| Component | Purpose | Used on |
|---|---|---|
| `SealrailLogo` | Brand mark and wordmark | All pages |
| `StatusLabel` | Semantic state indicator | All app screens |
| `ModeBadge` | TEE proof mode | Landing, run, docs |
| `PaymentStateCell` | Payment state display | Run, proofs, detail |
| `ProofStateCell` | Proof state display | Run, proofs, detail |
| `ProofRailTimeline` | Step-by-step proof flow | Landing, run, detail |
| `ProofObject` | Shows one structured proof item | Hero, detail |
| `HashLine` | Hash display with copy action | Run, detail |
| `ProofTable` | Browse proof rows | Proof explorer |
| `AgentRow` | Agent registry row | Agents page |
| `MarketplaceListingRow` | Agent listing row backed by real record | Marketplace |
| `ReputationPanel` | Proof-derived agent score | Marketplace, agent profile, owner dashboard |
| `PaymentSplitTable` | Split recipients and proof dependencies | Workflows, payment detail |
| `WorkflowStepRail` | Multi-agent step execution | Workflows |
| `VerifierTemplateRow` | Verifier template record | Verifiers |
| `ApiKeyRow` | Scoped key metadata without secret exposure | API keys |
| `TeeVerificationNotice` | TEE verification explanation | Run, docs, detail |
| `FinalCTA` | Closing conversion block | Landing |
| `ConciseDocsSection` | Short docs section block | Docs |
| `LegalTextPage` | Plain privacy and terms page shell | Privacy, terms |

## 14.2 StatusLabel

Visual:

```text
compact text badge
label always visible
never rely on color alone
```

Colors:

| State | State color |
|---|---|
| verified | `#64D96B` |
| payable | `#64D96B` |
| paid | `#64D96B` |
| pending | `#F2B84B` |
| running | `#3C8DFF` |
| failed | `#F45B45` |
| TEE verification | `#F2B84B` |
| blocked | `#F45B45` |

## 14.3 ProofObject

ProofObject is not a generic card. It is a structured proof sheet.

Content:

```text
Label
Primary value
State
Metadata lines
Optional hash
```

Example:

```text
BlockyClaim
status: verified
function: verifyInvoiceRisk
hash: 80d0...cd44
```

Style:

- Thin border.
- No heavy shadow.
- No glass blur.
- Square or tiny radius only.
- Mono for hash values.
- Uppercase label.

## 14.4 TeeVerificationNotice

Must appear anywhere TEE could be assumed.

Copy:

```text
TEE Verification Mode
This run uses TEE-compatible attestation. Hosted Blocky AS can replace this adapter when access is live.
```

---

# 15. Product copy system

## 15.1 Voice

Sealrail speaks like a serious infrastructure product.

Use:

```text
clear
short
specific
skeptical
proof-based
```

Avoid:

```text
revolutionary
magical
AI-powered everything
trustless miracle
seamless future of work
next-generation platform
```

## 15.2 Approved copy blocks

Hero headline:

```text
No Proof without a Payment.
```

Hero body:

```text
Sealrail makes AI-agent work payable only after a verifiable Blocky-compatible proof is anchored on Casper.
```

Product explanation:

```text
Create payment-backed tasks, verify agent outputs, and record proof hashes on Casper before payment unlocks.
```

Run explanation:

```text
The invoice agent can produce an answer, but the payment stays blocked until the verifier accepts the output.
```

TEE verification explanation:

```text
This run uses TEE Verification Mode. Hosted Blocky AS can replace the adapter when access is live.
```

Final CTA:

```text
Pay agents only after proof.
```

## 15.3 Forbidden copy

Do not use:

```text
production TEE proof, unless the hosted service is live
real enclave verified, unless the hosted service is live
fully trustless
revolutionary AI settlement
magical autonomous payments
```

## 15.4 Punctuation rule

No em dashes anywhere in UI copy, comments, prompts, markdown, JSX, or docs.

---

# 16. Landing page art direction

## 16.1 Hero visual

Hero should show the proof/payment loop as a premium product object.

Do not use:

- Floating robot.
- Abstract gradient blob.
- Crypto coin pile.
- Generic dashboard screenshot with fake charts.

Use:

- A dark proof terminal.
- Stacked proof objects.
- Two thin rails connecting objects.
- One red seal mark.
- Small verified text label.
- Warm paper label chips.

## 16.2 Section rhythm

Each section should have one job.

| Section | Job |
|---|---|
| Nav | Establish premium brand and routes |
| Hero | Explain the promise in 10 seconds |
| Product family | Explain what Sealrail is |
| Proof flow | Show the actual loop |
| Scale strip | Make the proof/payment rule memorable |
| First production vertical | Ground product in invoice verification |
| Proof explorer | Show inspectability |
| Honest mode | Preserve trust with TEE verification clarity |
| Final CTA | Drive task creation |
| Footer | Add credibility and links |

## 16.3 Motion rules

Use minimal motion:

- One-time reveal on section entry.
- Status labels can pulse softly while pending.
- Proof rail can animate from funded to verified to anchored.
- No parallax-heavy effects.
- No scroll-jacking.
- No particle fields.
- Respect reduced motion.

---

# 17. Main app art direction

## 17.1 App shell

The app shell is black, quiet, and data-first.

Layout:

```text
Top nav
Page header
Primary workspace
Secondary proof details
Footer status strip
```

## 17.2 App surfaces

Use:

- Ink panels: `#111111`
- Thin dark lines: `rgba(255,255,255,0.12)`
- Warm paper detail sheets only for copied proof bundles or docs
- Mono hash rows
- Small semantic text labels

Avoid:

- Dashboard cards with drop shadows
- Bright gradients
- Neon sidebar
- Over-rounded SaaS panels
- Fake analytics charts

## 17.3 Table style

Tables should look like ledger rows.

Rules:

- Thin top and bottom borders.
- No boxed table card if possible.
- Small uppercase column labels.
- Mono for IDs and hashes.
- Status cells include a text label and optional icon, never a status mark.
- Row hover can use `rgba(255,255,255,0.04)`.

---

# 18. Engineering handoff rules

## 18.1 Build sequence

Build in this order:

1. Global design tokens.
2. Typography and base layout.
3. Logo mark and nav.
4. Landing page section 01 only.
5. Review.
6. Continue landing page section by section.
7. Run screen.
8. Marketplace list and listing detail.
9. Agent registry and agent profile.
10. Owner dashboard and agent creation.
11. Workflow library and workflow detail.
12. Verifier library and verifier creation.
13. API key management.
14. Proof explorer and proof detail page.
15. Docs page.
16. Status page.
17. Responsive pass.
18. Accessibility pass.
19. Motion pass.
20. Final route audit.

## 18.2 Section prompt rule

Every section must be built alone.

Every section prompt must include:

```text
Build this section only.
Do not build anything else.
Preserve all approved sections above.
No em dashes.
Use exact colors from DESIGN.md.
Use serif headlines, sans body, mono hashes.
No generic SaaS cards.
No glassmorphism.
No heavy shadows.
No unsupported TEE claims.
```

## 18.3 Review gates

After every section, verify:

- Correct copy.
- Correct section order.
- Correct palette.
- No em dashes.
- No forbidden claims.
- Prior sections unchanged.
- Mobile does not overflow.
- Status labels do not rely only on color.

---

# 19. Responsive rules

## 19.1 Mobile priorities

Mobile should show:

1. Brand.
2. Core positioning.
3. Start run CTA.
4. Proof/payment visual simplified.
5. Honest TEE mode badge.

## 19.2 Breakpoints

| Breakpoint | Rule |
|---|---|
| 1280px and up | Full editorial layout |
| 1024px | Reduce hero visual width |
| 768px | Stack app columns |
| 480px | Single-column, hide secondary nav links |
| 375px | Preserve CTA tap targets and readable labels |

## 19.3 Mobile typography

- Hero H1 minimum 40px.
- Body text minimum 15px.
- Labels minimum 10px.
- Hashes can wrap, never overflow horizontally.
- Tables become stacked rows.

---

# 20. Accessibility rules

Required:

- Text contrast must pass WCAG AA.
- Status labels must include text, not color only.
- Buttons require visible focus states.
- Copy buttons need accessible labels.
- Form fields need labels.
- Error states must explain next action.
- Reduced motion support required.
- Tables need readable mobile layout.

Focus color:

```text
#F2B84B
```

---

# 21. Pitch deck visual direction

The pitch deck should look like a premium proof report.

## 21.1 Slide list

| Slide | Title | Visual |
|---:|---|---|
| 1 | No Proof without a Payment. | Black slide, Sealrail mark, one proof rail |
| 2 | The problem | Agent answer beside blocked payment |
| 3 | The insight | Paid agent work needs proof before settlement |
| 4 | The solution | Task funded to proof sealed to Casper anchored |
| 5 | Live run | Three screenshots: run, proof detail, explorer |
| 6 | Architecture | Clean rail diagram with backend, Blocky adapter, Casper registry |
| 7 | Why Casper | Casper as proof anchor and registry layer |
| 8 | Honest TEE path | TEE Verification Mode now, TEE verification service ready |
| 9 | Expansion | Invoice checks, DeFi risk, agent marketplaces |
| 10 | Final wow | Payment unlocks only after proof |

## 21.2 Deck style

- Black and warm paper backgrounds.
- Huge serif headlines.
- Thin rail diagrams.
- Minimal bullets.
- Real proof hashes in mono.
- No stock AI imagery.
- No random 3D crypto art.

---

# 22. Image generation prompts

## 22.1 Logo exploration prompt

```text
Minimal premium logo for Sealrail, a proof and payment rail for AI-agent work. Create a sealed proof node interrupted by two thin payment rails. Monoline geometry, black background, warm paper mark, one small Casper red seal mark. No shield, no cube, no robot, no checkmark, no chain link, no credit card. Editorial fintech infrastructure style. Include clean wordmark Sealrail.
```

## 22.2 Hero visual prompt

```text
Premium landing page hero visual for Sealrail. Dark financial proof terminal showing stacked proof objects connected by two thin payment rails. Objects: PaymentIntent, AgentOutput, BlockyClaim, CasperAnchor, PaymentState. Warm paper text chips, small verified labels, one Casper red seal point. Editorial fintech style, sparse, high contrast, no neon, no generic AI robot, no crypto coins, no glassmorphism.
```

## 22.3 Mascot prompt

```text
Premium minimal mascot for Sealrail named The Sealkeeper. A quiet proof courier carrying a sealed ledger tag along two thin payment rails. Small inspector silhouette, minimal visor, one small Casper red seal mark, warm paper and black palette. Serious fintech character, not cute, not childish, not a robot, no crypto coins, no neon.
```

## 22.4 Dashboard interface render prompt

```text
Sealrail app dashboard interface render. Black proof terminal interface with ledger rows, proof timeline, payment state cells, mono hashes, warm paper detail sheet. Show invoice verification run, Blocky-compatible TEE mode badge, Casper anchor hash, payment unlocked state. Premium editorial fintech UI, no gradients, no glassmorphism, no heavy shadows.
```

## 22.5 Pitch deck cover prompt

```text
Pitch deck cover for Sealrail. Black background, huge serif headline No Proof without a Payment, minimal sealed rail logo, one proof object and one payment state connected by a thin rail. Premium financial intelligence report style, warm paper text, tiny Casper red accent, no crypto clutter, no AI robot.
```

---

# 23. Acceptance checklist

The design is ready only when:

- [ ] The product is called Sealrail across the UI.
- [ ] The core positioning is No Proof without a Payment.
- [ ] The logo is a sealed rail concept, not a generic shield or cube.
- [ ] Landing page has all 10 planned sections.
- [ ] App screens exist for run, marketplace, listing detail, agents, agent profile, owner dashboard, workflows, verifiers, API keys, proofs, proof detail, docs, privacy, terms, and status.
- [ ] TEE Verification Mode is honestly labelled.
- [ ] Payment state and proof state are visually separate.
- [ ] Casper anchor is visible as a concrete proof object.
- [ ] A judge can complete the main invoice verification run in under 90 seconds.
- [ ] No fake, fabricated, or temporary product surfaces remain. Marketplace listings, workflows, reputation, API keys, verifiers, agents, payments, and proofs must be backed by real records.
- [ ] No em dashes exist anywhere.
- [ ] Mobile layouts do not overflow.
- [ ] All status colors have text labels.
- [ ] Documentation is concise, scannable, and under two minutes to read.
- [ ] Privacy and Terms pages exist and use plain English.

---

# 24. Final creative recommendation

Build the product around one unforgettable loop:

```text
Fund the task.
Seal the proof.
Anchor on Casper.
Unlock the payment.
```

The strongest design direction is not another AI dashboard. It is a premium proof and payment terminal.

Design first as one complete frontend product surface:

```text
Landing page sections 01 to 04
Task runner UI
Marketplace and listing detail UI
Agent registry and agent profile UI
Owner dashboard UI
Workflow run page UI
Verifier library UI
API key management UI
Proof detail page UI
Proof explorer UI
```

Do not build:

```text
Unsupported TEE claims
Fabricated listings shown as real
Fabricated reputation
Fabricated API keys
Large analytics dashboard unrelated to proof/payment records
```

The judge wow moment:

```text
The payment starts blocked, the proof verifies, the Casper anchor appears, and the payment changes to unlocked.
```


---

# 25. Concise documentation and legal pages

## 25.1 Documentation style

Documentation must be short, useful, and scannable.

Rules:

- One idea per section.
- Every docs section under 120 words.
- Prefer bullets, tables, and short examples.
- Put the core loop first.
- Put API quickstart before architecture details.
- Link to Privacy and Terms from docs and footer.
- Avoid legal walls, academic explanations, and long blockchain theory.

## 25.2 Required legal pages

Build these routes:

```text
/privacy
/terms
```

Privacy must cover:

```text
wallet identity
task input data
agent output data
proof hashes
Casper anchor references
API key metadata
system logs
data retention
security basics
```

Terms must cover:

```text
product purpose
user responsibilities
agent owner responsibilities
proof and payment rules
no unsupported claims
availability
limitation of liability
contact
```

## 25.3 Legal writing style

Legal copy should be plain English and concise. It should protect the project without making the product feel hostile or unfinished.
