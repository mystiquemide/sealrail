# SR-71 Design System Handoff

Reference site: https://www.aira.app/?ref=land-book.com
Project: Casper proof and payment product
Date: 2026-06-30
Core positioning: No Proof without a Payment.

## 1. SR-71 interpretation

We will use Aira as the live reference site for visual discipline.

The goal is not to copy Aira. The goal is to extract its premium editorial trust language and adapt it to a Casper-native proof/payment product.

## 2. Reference design language

Aira design language:

```text
Premium editorial intelligence platform
Cinematic hero
Warm paper editorial sections
Black proof sections
Serif authority headlines
Small pill CTAs
Tiny semantic proof labels
Sparse data objects
```

Our adapted design language:

```text
Premium proof and payment terminal for AI-agent work
Cinematic proof hero
Warm paper explainer sections
Black verification/payment sections
Serif trust headlines
Small pill CTAs
Tiny semantic proof and payment labels
Real proof objects instead of generic SaaS cards
```

## 3. Canonical palette

Use exact values in all coding prompts.

| Token | Hex | Use |
|---|---|---|
| Black base | `#080808` | Hero, proof sections, footer contrast areas |
| Warm paper | `#F9F8F6` | Editorial explainer sections |
| Warm gray | `#F0EFED` | Alternate light sections |
| Charcoal | `#2C2C2B` | Main text on light surfaces |
| White | `#FFFFFF` | Text and pill buttons on dark surfaces |
| Muted gray | `#888888` | Metadata, labels, captions |
| Line soft | `rgba(0,0,0,0.08)` | Light section dividers |
| Dark line | `rgba(255,255,255,0.12)` | Dark section dividers |
| Proof green | `#64D96B` | Verified proof, payable, success dots |
| Risk red | `#F45B45` | Failed proof, risk, blocked payment |
| Amber | `#F2B84B` | Local Blocky dev mode warning |
| Casper red | `#FF2D2D` | Sponsor accent, use sparingly |
| API blue | `#3C8DFF` | Developer/API mode dot |

## 4. Typography rules

```text
Headlines: premium serif, 400 only
Body: Inter, 400 only
Labels: Inter uppercase, tracked
Hashes: JetBrains Mono
```

Fallback stack:

```css
--font-serif: "Georgia", "Times New Roman", serif;
--font-sans: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
--font-mono: "JetBrains Mono", "SFMono-Regular", monospace;
```

Type scale:

| Role | Desktop | Mobile | Line height | Weight |
|---|---:|---:|---:|---:|
| Hero H1 | 64px | 42px | 0.98 | 400 |
| Section H2 | 54px | 34px | 0.98 | 400 |
| Feature H3 | 35px | 28px | 1.0 | 400 |
| Module H3 | 27px | 23px | 1.08 | 400 |
| Body | 15px | 15px | 1.55 | 400 |
| Label | 10px | 10px | 1.2 | 400 |
| Hash | 12px | 11px | 1.4 | 400 |

## 5. Global build rules

These rules must travel with every coding prompt.

```text
- Do not build more than the requested section.
- No em dashes anywhere in visible copy, comments, JSX, or markdown.
- No glassmorphism.
- No heavy shadows.
- No loud gradients.
- No generic SaaS cards.
- No fake TEE claims.
- No bold typography unless explicitly requested.
- Use serif headlines with weight 400.
- Use tiny semantic accents only.
- Use proof objects and thin dividers instead of feature cards.
- Preserve every approved section above the current section.
```

## 6. Landing page section wireframe

This is the proposed SR-71 build sequence after rebrand approval.

```text
[01 NAV]
Logo: ProofPay Agents or chosen new name
Links: How it works, Proofs, Agents, Docs
CTA 1: View proof trail →
CTA 2: Start run →

[02 HERO]
Label: CASPER PROOF AND PAYMENT LAYER
Headline: No Proof without a Payment.
Body: AI-agent work becomes payable only after Blocky-compatible verification and Casper anchoring.
Primary CTA: Start verification run →
Secondary CTA: View proof trail →
Right visual: payment intent, Blocky claim, Casper anchor stacked as proof objects

[03 PRODUCT FAMILY]
Label: PRODUCTS
Headline: The payment layer for verifiable AI-agent work.
Body: Create payment-backed tasks, verify agent outputs, and anchor proof hashes on Casper.
Modules:
- ProofPay Tasks: create payment-backed agent work
- Blocky Verifier: verify deterministic WASM output
- Casper Registry: anchor proof and payment state

[04 PROOF PANEL]
Label: VERIFICATION
Headline: Every agent output carries a proof trail.
Left copy: The verifier checks the task input, agent output, code hash, and payment state before a task becomes payable.
Right proof objects:
- PaymentIntent: requested
- BlockyClaim: verified
- CasperAnchor: pending or anchored
- PaymentState: payable

[05 STATS BAND]
Headline: Built for trust before scale.
Stats:
- 1 payment intent per task
- 1 verifier function
- 1 proof hash anchored
- 0 payments without proof

[06 USE CASE ROWS]
01 RWA invoice verification
02 DeFi risk checks
03 Agent marketplace settlement

[07 PROOF EXPLORER PREVIEW]
Headline: Inspect every proof before payment.
Visual: table or terminal style proof explorer
Rows: task ID, agent, blocky mode, Casper hash, payment state

[08 HONEST MODE SECTION]
Headline: Local now. Hosted TEE ready.
Body: The run uses Blocky local development mode until hosted Blocky AS access arrives. The same adapter switches to hosted TEE config once issued.
Badges:
- Local Blocky Dev Mode
- Hosted TEE Ready
- Casper Anchored

[09 FINAL CTA]
Headline: Pay agents only after proof.
CTA: Start verification run →
Secondary: Read architecture →

[10 FOOTER]
Product links, docs, GitHub, Casper Buildathon note
```

## 7. Section prompt template for our coding agent

Use this exact format later, one section at a time.

```text
Build the [SectionName] section. Do not build anything else.

STRUCTURE:
- [Exact layout rules]
- [Exact background color]
- [Exact padding]
- [Exact max width]

ELEMENT BLOCKS:
- [Element name]
  - Copy: [exact copy]
  - Font: [exact font]
  - Size: [exact size]
  - Weight: 400
  - Color: [exact hex]
  - Spacing: [exact spacing]

GLOBAL RULES:
- No em dashes anywhere.
- No glassmorphism.
- No heavy shadows.
- No loud gradients.
- No generic SaaS cards.
- No fake TEE claims.
- Use serif headlines, sans body, mono hashes.
- Use exact hex values from this prompt.
- Do not modify approved sections above.

DO NOT TOUCH:
- Everything above this section.
- Everything below this section.

FINAL CHECK:
- Section renders at desktop and mobile widths.
- No em dashes.
- No forbidden classes or visual drift.
- Approved sections remain unchanged.

Update MEMORY.md:
- Record any durable design rule introduced by this section.
```

## 8. Rebrand naming criteria

A good name should satisfy:

1. Payment and proof relationship is obvious.
2. Works without always saying Casper.
3. Can expand beyond invoice verification.
4. Sounds premium, not meme-like.
5. Fits the headline No Proof without a Payment.

## 9. Shortlist to discuss

| Name | Strength | Concern |
|---|---|---|
| ProofPay Agents | Very clear | Slightly generic |
| Casper ProofPay | Sponsor aligned | Less expandable |
| Proofrail | Infrastructure feel | Payment less obvious |
| PayProof | Short and direct | Could sound like a receipt app |
| AgentProof | Agent-native | Payment weaker |
| AttestaPay | Branded | Slightly constructed |
| ProofOps | Strong operator feel | Payment weaker |
| Veriflow Pay | Smooth | Less distinctive |

Current top two:

```text
ProofPay Agents
Casper ProofPay
```

## 10. Recommended rebrand direction

Use a brand that says payment first, proof second.

Best direction:

```text
ProofPay Agents
```

Hero:

```text
No Proof without a Payment.
```

Subhero:

```text
A Casper-native payment layer where AI-agent work becomes payable only after Blocky-compatible verification and on-chain anchoring.
```

## 11. What not to copy from Aira

Do not copy:

1. Their company intelligence copy.
2. Their exact photographic assets.
3. Their product names.
4. Their event section unless we later need community proof.
5. Their European database framing.

Only borrow:

1. Editorial trust language.
2. Alternating light and black sections.
3. Large serif hierarchy.
4. Tiny semantic proof accents.
5. Quiet premium CTAs.
6. Sparse proof objects.

## 12. Next SR-71 action after rebrand

After the product name is chosen, generate the first coding prompt only:

```text
Section 01: Navigation and global shell
```

Do not generate all section prompts at once.
