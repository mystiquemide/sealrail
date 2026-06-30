# Aira Website Forensic Teardown

Source: https://www.aira.app/?ref=land-book.com
Date: 2026-06-30
Purpose: Reference analysis before rebranding Verified Agent Payments on Casper

## 1. First impression and strategic positioning

Aira presents itself like a premium financial intelligence platform, not a generic SaaS app. The site uses editorial restraint, cinematic photography, large serif typography, and sparse product UI details to create authority.

The immediate message is:

```text
We know the market before everyone else does.
```

This matters for our rebrand because our product also needs to feel like a trust and intelligence layer, not a hackathon dashboard.

## 2. Core design thesis

Aira wins visually by combining:

1. A cinematic human hero image.
2. Large editorial serif headlines.
3. Quiet monochrome surfaces.
4. Small proof/data annotations.
5. Alternating light editorial sections and black proof sections.
6. Minimal button design.
7. Product screenshots embedded as proof, not decoration.

## 3. Color system

Observed from live styles and browser inspection.

| Token | Value | Usage |
|---|---|---|
| Black | `#080808` | Hero, dark proof sections, footer contrast sections |
| Near white | `#FEFEFE` | Body background and button text surfaces |
| Warm paper | `#F9F8F6` | Product sections and footer |
| Warm gray | `#F0EFED` | News and product section background |
| Charcoal text | `#2C2C2B` | Main text on light surfaces |
| White | `#FFFFFF` | Text on dark sections and pill buttons |
| Muted gray | `#888888` | Secondary metadata and small labels |
| Soft line | `rgba(0,0,0,0.05)` | Dividers and low contrast structure |
| Green accent | approximate `#5CD85C` | Opportunity status, CRM node accents |
| Red accent | approximate `#F45B45` | Risk status, tiny alert dots |
| Blue accent | approximate `#3C8DFF` | API product dot |

### Palette behavior

Aira uses almost no loud brand color. Accent colors appear only as tiny semantic signals. This makes the few green, red, and blue markers feel meaningful.

## 4. Typography system

Observed heading font:

```text
Gestura Headline, Georgia, serif
```

Observed body font:

```text
Inter, system sans
```

| Role | Font | Size | Weight | Notes |
|---|---|---:|---:|---|
| Hero H1 | Gestura Headline | 64px | 400 | Large, editorial, tight letter spacing |
| Product H2 | Gestura Headline | 54px | 400 | Serif authority on light surface |
| Dark CTA H2 | Gestura Headline | 47px | 400 | Centered, muted white |
| Feature H3 | Gestura Headline | 35px | 400 | Dark section story blocks |
| Product card H3 | Gestura Headline | 27px | 400 | Light section cards |
| News H3 | Gestura Headline | 20px | 400 | Editorial article titles |
| Body | Inter | 15px | 400 | Quiet and compact |
| Labels | Inter or mono style | 10 to 12px | 400 | Uppercase, tracked, muted |

### Typography behavior

The serif does the trust work. The sans does the utility work. The site avoids heavy bold styling. Authority comes from scale and whitespace, not weight.

## 5. Layout and spacing system

| Pattern | Description |
|---|---|
| Full bleed hero | Dark photographic background, image fills frame, content sits on top |
| Editorial light blocks | Warm off-white sections with generous top and side padding |
| Section contrast bands | Light product areas followed by black proof/feature areas |
| Large vertical rhythm | Sections breathe with 80px to 112px padding |
| Thin dividers | Horizontal lines split categories without heavy cards |
| Grid cards | Used sparingly for product modules and news |
| Left aligned story blocks | Dark feature blocks use left aligned text, lots of empty right space |
| Stat row | Huge numbers, small captions, separated by thin horizontal rule |

## 6. Component library

### Navigation

- Transparent overlay on hero.
- White logo and white nav on dark photo.
- Small nav links.
- Two pill actions: muted sign in and white book call.
- Layout is compact and right aligned.

### Buttons

| Button | Style |
|---|---|
| Primary on dark | White pill, black text, compact padding |
| Secondary on dark | Transparent or dark pill, white text, thin border |
| Primary on light | Black pill, white text |

Buttons are small and calm. No huge SaaS CTA blocks.

### Product panels

Aira uses product panels, but they are not flashy SaaS cards. They look like quiet financial screens:

- Dark panels with low contrast borders.
- Tiny uppercase metadata.
- Monospace or pseudo-code lines.
- Soft rounded corners only inside product fabricatedups.
- Product copy integrated with data proof.

### Proof badges

Tiny labels like:

```text
OPPORTUNITY
RISK
POWERED BY
GET
200 OK
```

These create credibility without over-explaining.

### News cards

Classic editorial layout:

- Image top.
- Serif title.
- Short body copy.
- Small read more link.
- Lots of whitespace.

## 7. Visual hierarchy and user flow

Aira does not push the user through a loud funnel. It creates calm conviction.

Flow:

1. Big emotional claim in hero.
2. Product taxonomy: Aira, Aira Connect, Aira API.
3. Scale proof: 65M companies, 14 markets, 24/7 monitoring, 3M articles.
4. Use cases in dark narrative blocks.
5. News as authority proof.
6. More product capability blocks.
7. Events and relationship layer.
8. Footer with serious company/legal presence.

## 8. Conversion psychology

| Mechanism | How Aira uses it |
|---|---|
| Authority | Editorial typography, financial language, Nasdaq/news references |
| Scale | 65M companies, 14 markets, 3M articles |
| Specificity | European B2B, financials, ownership, registry filings |
| Trust | Muted palette, legal footer, verified language |
| Calm premium | Small CTAs and restrained motion |
| Risk/opportunity framing | Every feature maps to upside or downside detection |

## 9. Section by section breakdown

| Section | Role | Design pattern | Stealable idea |
|---|---|---|---|
| Hero | Establish authority and mood | Cinematic full bleed image plus editorial headline | Use human or product proof imagery, not generic gradients |
| Products intro | Explain product family | Warm paper surface, large serif H2 | Use a light editorial explainer before dark proof sections |
| Investor product panel | Deep intelligence proof | Dark panel with opportunity/risk mini cards | Show proof states as data objects |
| B2B sales panels | Product modules | Two-column light product modules | Split product modes clearly |
| Database stats | Scale proof | Black band, centered CTA, large metrics | Use proof numbers as conversion bridge |
| Feature stories | Use cases | Black rows with tiny numbers and left aligned copy | Use numbered narrative blocks instead of feature cards |
| News | Authority | Editorial three-column news grid | Show ecosystem proof, updates, credibility |
| Events | Relationship layer | Dark canvas with sparse floating labels | Optional, not needed for us yet |
| Footer | Company trust | Warm paper footer, serif links | Use footer as credibility layer |

## 10. What to steal for our rebrand

### Pattern 1: Editorial serif authority

Use a premium serif for headlines and a clean sans for everything else.

Suggested:

```text
Headlines: Canela, Reckless Neue, Editorial New, or Georgia fallback
Body: Inter
Mono: JetBrains Mono
```

### Pattern 2: Alternating proof surfaces

Use:

```text
Light editorial sections for explanation
Black proof sections for verification and payments
```

### Pattern 3: Tiny semantic proof accents

Use red, green, amber, and blue only as small proof/payment signals.

Do not flood the page with gradients.

### Pattern 4: Large stat row

For us:

```text
1 payment intent
1 verified proof
1 Casper anchor
0 payment without proof
```

### Pattern 5: Proof objects as UI

Instead of generic cards, show real-looking proof objects:

```text
PaymentIntent
BlockyClaim
CasperAnchor
AgentOutput
```

### Pattern 6: Honest mode badge

Aira uses verified language carefully. We should use:

```text
Local Blocky Dev Mode
Hosted TEE Ready
Casper Anchored
Payment Unlockable
```

### Pattern 7: Quiet CTA discipline

Use small pill CTAs.

Primary:

```text
Start verification run →
```

Secondary:

```text
View proof trail →
```

## 11. Critical review

### Strengths

1. Feels expensive and trustworthy.
2. Avoids generic AI SaaS visuals.
3. Uses data proof as design material.
4. Strong section pacing.
5. Good contrast between light editorial and black proof areas.
6. CTAs are calm and premium.

### Weaknesses

1. Some sections are visually sparse to the point of feeling unfinished.
2. Product interaction is not always clear from screenshots alone.
3. The event section is atmospheric but less conversion-focused.
4. Mobile hierarchy may depend heavily on image handling.
5. Some low contrast body text could be hard to read.

## 12. Rebrand implications for our product

Our current name, Verified Agent Payments on Casper, is descriptive but not brandable enough.

Aira suggests we should move toward:

1. A shorter name.
2. Editorial authority.
3. Proof and payment objects as the visual language.
4. Fewer generic SaaS cards.
5. More premium black and warm paper surfaces.

Recommended design direction:

```text
A premium proof and payment terminal for AI-agent work.
```

Candidate rebrand directions:

| Direction | Name ideas | Notes |
|---|---|---|
| Payment first | ProofPay, Casper ProofPay, PayProof | Clear and direct |
| Trust layer | Proofrail, Attesta, Veriflow | More infra feel |
| Agent work | WorkProof, AgentProof, ProofOps | Strongly tied to agent outputs |
| Casper native | CSPR ProofPay, Casper Proofrail | Sponsor aligned |

Best current recommendation:

```text
ProofPay Agents
```

Sponsor-aligned version:

```text
Casper ProofPay
```

## 13. Extracted design constraints for SR-71

Use these constraints when prompting the coding agent:

```text
- Premium editorial trust product
- Black base sections: #080808
- Warm paper sections: #F9F8F6 or #F0EFED
- Charcoal text: #2C2C2B
- White text: #FFFFFF
- Muted text: #888888
- Tiny semantic accents only
- Serif headlines, sans body, mono hashes
- Large whitespace
- Thin dividers
- Small pill CTAs
- Proof objects over generic cards
- No loud gradients
- No glassmorphism
- No heavy shadows
- No fake TEE claims
```
