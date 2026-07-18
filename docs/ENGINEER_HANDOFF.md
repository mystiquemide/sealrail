# Sealrail Frontend UI Design Handoff

Use this document to hand the current Sealrail design phase to another designer, frontend engineer, or AI design agent.

## Current phase

This handoff is for frontend UI design only.

Do not start backend, contracts, database, API, orchestration, payment logic, or production integration work from this handoff.

After `docs/DESIGN.md` is approved, the next phase can turn the approved design into a build plan.

## One-line brief

Design the Sealrail frontend UI for a Casper-native proof and payment rail for AI-agent work where payment unlocks only after schema + hash verification and Casper proof anchoring.

## Product truth for design

- Product name: Sealrail
- Core positioning: No Proof without a Payment.
- Product category: Proof and payment rail for AI agents
- Primary product loop: task funded -> agent runs -> proof verified -> Casper anchor recorded -> payment unlocks
- Design must make the product feel ecosystem-ready, not like a small one-screen concept.
- Judge-facing language can say TEE, TEE verification, or Schema + hash verification.
- Do not expose implementation-mode language in public UI.

## What the design handoff must cover

The approved design should cover the full frontend ecosystem surface:

1. Landing page
2. Task run page
3. Full marketplace UI
4. Marketplace listing detail
5. Agent registry
6. Agent profile
7. Agent owner dashboard
8. Create agent screen
9. Multi-agent workflow library
10. Workflow detail and run screen
11. Payment split UI
12. Agent reputation UI
13. API key management UI
14. Verifier template library
15. Verifier template upload or registration UI
16. Proof explorer
17. Proof detail page
18. Concise docs page
19. Privacy page
20. Terms page
21. Status page

This does not mean backend work starts now. It means the UI design must account for all these screens so the product looks complete and ecosystem-ready.

## What to share

Share these files with the designer, frontend engineer, or AI design agent:

```text
docs/ENGINEER_HANDOFF.md
docs/DESIGN.md
docs/PRD.md
docs/FULL_ECOSYSTEM_BUILD_SCOPE.md
docs/FULL_ECOSYSTEM_TASKS.md
docs/PRIVACY.md
docs/TERMS.md
memory.md
```

Optional background files:

```text
docs/AIRA_FORENSIC_TEARDOWN.md
docs/SR71_AIRA_REFERENCE_HANDOFF.md
```

The optional files are background only. Do not copy internal method names into the product or handoff.

## What not to share

Never share:

```text
/root/.env
real API keys
wallet private keys
seed phrases
server passwords
Blocky credentials
CSPR.cloud key
Telegram or GitHub tokens
```

For UI design, no secret should be needed.

## Source of truth order for this phase

If files conflict, follow this order:

1. `docs/DESIGN.md` for brand, UI, copy, route map, screens, legal page requirements, and visual rules.
2. `docs/FULL_ECOSYSTEM_BUILD_SCOPE.md` for the product surface area the UI must prepare for.
3. `docs/PRD.md` for product goals.
4. `docs/PRIVACY.md` and `docs/TERMS.md` for legal page copy direction.
5. `memory.md` for decisions and constraints.

Do not treat this handoff as permission to implement backend systems.

## UI route map to design

Design these routes and states:

```text
/
/run
/marketplace
/marketplace/[listingId]
/agents
/agents/[agentId]
/owner
/owner/agents/new
/owner/agents/[agentId]
/workflows
/workflows/new
/workflows/[workflowId]
/verifiers
/verifiers/new
/proofs
/proofs/[proofId]
/api-keys
/docs
/privacy
/terms
/status
```

## Design non-negotiables

- No user-facing page says demo.
- No user-facing page says local.
- Judge-facing UI can say TEE, TEE verification, or Schema + hash verification.
- Do not claim hosted TEE execution unless the hosted TEE service is fully connected.
- No green dots, online dots, or status dots on landing.
- No SR-71 wording in product or handoff.
- No internal skill references in user-facing docs.
- No em dashes.
- No generic SaaS dashboard look.
- No crypto casino visual language.
- No unsupported fake proof claims.

## Real-product design rule

Even though this is only frontend UI design, the UI must look like it is designed for real records and real state transitions.

If a page has no data, design a truthful empty state with a create action.

Example:

```text
No live listings yet. Register an agent, attach a verifier, and publish the listing.
```

Do not design fake marketplace rows as if they are live production data. Use clearly labelled sample content only inside wireframes if needed, and make the final UI ready for real records.

## Screen states to include

Design states for:

```text
empty
loading
record exists
form validation error
verification pending
verification passed
verification failed
Casper anchor pending
Casper anchor recorded
payment locked
payment unlocked
payment paid
API key created and shown once
API key revoked
workflow step waiting
workflow step verified
payment split locked
payment split unlocked
```

## Documentation design requirements

The UI must include concise documentation pages:

```text
/docs
/privacy
/terms
```

Rules:

- Keep docs scannable in under two minutes.
- Put the core loop first.
- Use short tables and short code blocks.
- Avoid long legal walls.
- Privacy and Terms must be plain English.

## Current approval flow

1. Patch and refine `docs/DESIGN.md`.
2. User reviews and approves `docs/DESIGN.md`.
3. After approval, create the implementation plan.
4. Then build frontend UI section by section.
5. Backend, contracts, and real integrations come after the design approval and planning step.

## Copy-paste prompt for another AI design agent

```text
You are helping with Sealrail frontend UI design only.

Read these files first:
- docs/DESIGN.md
- docs/PRD.md
- docs/FULL_ECOSYSTEM_BUILD_SCOPE.md
- docs/PRIVACY.md
- docs/TERMS.md
- memory.md

Do not start backend, contracts, database, API, orchestration, payment logic, or production integration work.

Your task is to refine and prepare the frontend UI design so docs/DESIGN.md can be approved before implementation starts.

Core positioning: No Proof without a Payment.

The UI design must cover the full ecosystem:
1. Landing page
2. Task run page
3. Full marketplace UI
4. Marketplace listing detail
5. Agent registry and profile
6. Agent owner dashboard
7. Multi-agent workflows
8. Payment splits UI
9. Reputation UI
10. API key management UI
11. Verifier template UI
12. Proof explorer and proof detail
13. Concise docs, Privacy, Terms, and status

Rules:
- No user-facing demo language.
- No user-facing local language.
- Judge-facing UI can say TEE, TEE verification, or Schema + hash verification.
- Do not claim hosted TEE execution unless the hosted TEE service is fully connected.
- No green dots, online dots, or status dots on landing.
- No SR-71 wording or internal skill references.
- No em dashes.
- Do not design fake data as real production data.
- If a page has no records, design a truthful empty state with a create action.
- Keep documentation concise.
- Include Privacy and Terms.

Use docs/DESIGN.md as the source of truth. Your output should be design refinement only. After the user approves DESIGN.md, implementation planning begins.
```
