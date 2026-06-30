# Sealrail Frontend UI Implementation Plan

> **For Hermes:** Use subagent-driven-development or Kimchi/Senku execution to implement this plan task-by-task after user approval.

**Goal:** Build the approved Sealrail frontend UI as a product-ready, ecosystem-ready interface without starting backend, contracts, database, or real integration work yet.

**Architecture:** Create a frontend-only app with route-level pages, shared design tokens, reusable UI components, and frontend typed fixture adapters that clearly model future real records without pretending they are live production data. Each screen should be built section by section and verified against `docs/DESIGN.md` before moving on.

**Tech Stack:** Recommended default: Next.js App Router, TypeScript, Tailwind CSS, shadcn-style component primitives only where they do not create generic SaaS visuals. If the existing repo uses another frontend stack, adapt the file paths but preserve the sequence and acceptance criteria.

---

## Phase boundary

This plan is for frontend UI only.

Do not build:

- Backend APIs
- Database migrations
- Casper contracts
- Payment execution
- Real TEE integration
- Real API key authentication
- Production orchestration engine

Build UI surfaces that are ready for those systems later.

---

## Approved source files

Read these before implementation:

```text
docs/DESIGN.md
docs/ENGINEER_HANDOFF.md
docs/PRD.md
docs/FULL_ECOSYSTEM_BUILD_SCOPE.md
docs/PRIVACY.md
docs/TERMS.md
memory.md
```

---

## Non-negotiable UI rules

- No user-facing sample-app language.
- No user-facing implementation-mode language.
- Judge-facing UI can say TEE, TEE verification, or TEE Verification Mode.
- No claim of real enclave execution unless real hosted TEE is connected later.
- No green dots, online dots, or status dots on landing.
- No SR-71 wording.
- No internal skill references.
- No em dashes.
- No fake marketplace rows presented as real live data.
- Empty states must be truthful and action-oriented.
- Documentation must be concise.
- Privacy and Terms must exist.

---

## Recommended route map

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

---

## Task 1: Create frontend app foundation

**Objective:** Create the frontend project skeleton and confirm it runs in preview.

**Files:**

- Create or modify: `package.json`
- Create: `app/layout.tsx`
- Create: `app/page.tsx`
- Create: `app/globals.css`
- Create: `tailwind.config.ts`
- Create: `tsconfig.json`

**Steps:**

1. Initialize Next.js with TypeScript and Tailwind.
2. Add base `app/layout.tsx` using Sealrail metadata.
3. Add a temporary `app/page.tsx` with only the approved brand name and CTA.
4. Run the frontend dev server command used by the chosen stack.
5. Open the preview page and verify it renders.
6. Run `npm run lint` if available.

**Acceptance:**

- App runs.
- No generic starter branding remains.
- No forbidden product wording appears.

---

## Task 2: Add design tokens and base styles

**Objective:** Encode the approved Sealrail visual system.

**Files:**

- Modify: `app/globals.css`
- Modify: `tailwind.config.ts`
- Create: `lib/design-tokens.ts`

**Steps:**

1. Add color tokens from `docs/DESIGN.md`.
2. Add typography tokens: serif headlines, sans body, mono hashes.
3. Add base body background, text color, line color, and focus states.
4. Add utility classes for section shells and ledger rows.
5. Verify mobile and desktop defaults.

**Acceptance:**

- Black and warm paper palette works.
- Serif/sans/mono rhythm is visible.
- No random gradient or generic dashboard style.

---

## Task 3: Build shared layout components

**Objective:** Create reusable shell components used across all pages.

**Files:**

- Create: `components/layout/SiteShell.tsx`
- Create: `components/layout/SiteNav.tsx`
- Create: `components/layout/SiteFooter.tsx`
- Create: `components/brand/SealrailLogo.tsx`
- Create: `components/ui/Button.tsx`
- Create: `components/ui/SectionLabel.tsx`

**Steps:**

1. Build logo using the sealed rail concept.
2. Build nav with Marketplace, Workflows, Proofs, Agents, Docs, Start task.
3. Build footer with Product, Developers, Project, Legal.
4. Add Privacy and Terms links.
5. Verify nav on mobile.

**Acceptance:**

- Logo is not shield, cube, checkmark, robot, chain link, or card icon.
- Footer includes Privacy and Terms.
- Mobile nav is usable.

---

## Task 4: Build proof and payment UI primitives

**Objective:** Create reusable product-specific UI components.

**Files:**

- Create: `components/product/StatusLabel.tsx`
- Create: `components/product/ModeBadge.tsx`
- Create: `components/product/PaymentStateCell.tsx`
- Create: `components/product/ProofStateCell.tsx`
- Create: `components/product/ProofObject.tsx`
- Create: `components/product/HashLine.tsx`
- Create: `components/product/ProofRailTimeline.tsx`

**Steps:**

1. Build text-based status labels.
2. Do not use status dots.
3. Build proof object sheets with mono hash rows.
4. Build payment and proof state cells separately.
5. Add accessible labels and focus states.

**Acceptance:**

- Status never relies on color alone.
- No dot UI appears.
- Components match the premium proof terminal direction.

---

## Task 5: Add frontend-only typed product models

**Objective:** Model future real records without starting backend work.

**Files:**

- Create: `lib/types.ts`
- Create: `lib/sample-records.ts`
- Create: `lib/empty-states.ts`

**Steps:**

1. Define types for Agent, MarketplaceListing, Task, Payment, Proof, VerifierTemplate, Workflow, WorkflowStep, PaymentRecipient, ApiKeyMetadata.
2. Add clearly labelled sample records for visual development only.
3. Add empty-state copy for each major route.
4. Ensure UI copy never says the sample records are live production data.

**Acceptance:**

- Types match the future real records from the docs.
- Sample records are internal frontend fixtures only.
- Empty states exist.

---

## Task 6: Build landing page section 01 and 02

**Objective:** Build nav and hero only.

**Files:**

- Modify: `app/page.tsx`
- Create: `components/landing/HeroSection.tsx`
- Create: `components/landing/HeroProofStack.tsx`

**Steps:**

1. Build nav through SiteShell.
2. Build hero with headline: `No Proof without a Payment.`
3. Add proof stack visual: PaymentIntent, AgentOutput, BlockyClaim, CasperAnchor.
4. Add CTAs: Start verification run, View proof trail.
5. Verify no landing dots.

**Acceptance:**

- Hero communicates product in 10 seconds.
- No status dots.
- No forbidden words.

---

## Task 7: Build remaining landing sections

**Objective:** Complete the full landing page one section at a time.

**Files:**

- Create: `components/landing/ProductFamilySection.tsx`
- Create: `components/landing/ProofFlowSection.tsx`
- Create: `components/landing/ScaleStripSection.tsx`
- Create: `components/landing/FirstVerticalSection.tsx`
- Create: `components/landing/ProofExplorerPreview.tsx`
- Create: `components/landing/TeeVerificationSection.tsx`
- Create: `components/landing/FinalCtaSection.tsx`
- Modify: `app/page.tsx`

**Steps:**

1. Build Product Family.
2. Review.
3. Build Proof Flow.
4. Review.
5. Continue section by section until footer.
6. Verify responsive layout.

**Acceptance:**

- All 10 landing sections exist.
- Section rhythm matches DESIGN.md.
- Page feels premium and ecosystem-ready.

---

## Task 8: Build `/run` task runner UI

**Objective:** Build frontend UI for the core proof/payment loop.

**Files:**

- Create: `app/run/page.tsx`
- Create: `components/run/TaskForm.tsx`
- Create: `components/run/LiveProofRail.tsx`
- Create: `components/run/VerifiedOutputPanel.tsx`
- Create: `components/run/ProofHashesPanel.tsx`

**Steps:**

1. Build task form.
2. Build live proof rail.
3. Build output panel.
4. Build proof hash panel.
5. Add frontend-only state transitions for visual review.

**Acceptance:**

- Payment state and proof state are separate.
- TEE Verification Mode is visible.
- UI reads as real product flow, not a presentation mock.

---

## Task 9: Build proof explorer and proof detail UI

**Objective:** Build proof browsing and proof inspection screens.

**Files:**

- Create: `app/proofs/page.tsx`
- Create: `app/proofs/[proofId]/page.tsx`
- Create: `components/proofs/ProofTable.tsx`
- Create: `components/proofs/ProofDetailHeader.tsx`
- Create: `components/proofs/RawProofBundle.tsx`

**Steps:**

1. Build proof table.
2. Build filter bar.
3. Build empty state.
4. Build proof detail sections.
5. Add copy proof bundle button UI.

**Acceptance:**

- Hashes use mono.
- Empty state is truthful.
- Proof detail shows payment, agent output, TEE verification, Casper anchor, and raw bundle.

---

## Task 10: Build marketplace UI

**Objective:** Build marketplace list and listing detail UI.

**Files:**

- Create: `app/marketplace/page.tsx`
- Create: `app/marketplace/[listingId]/page.tsx`
- Create: `components/marketplace/MarketplaceFilters.tsx`
- Create: `components/marketplace/MarketplaceListingTable.tsx`
- Create: `components/marketplace/ListingDetail.tsx`

**Steps:**

1. Build page header.
2. Build filters.
3. Build listing table from typed records.
4. Build truthful empty state.
5. Build listing detail with task input, agent, verifier, reputation, and recent proofs.

**Acceptance:**

- Marketplace looks full-product ready.
- No fake records are presented as live production data.
- Listing detail has a clear start paid task action.

---

## Task 11: Build agent registry and owner UI

**Objective:** Build agent browsing and owner management screens.

**Files:**

- Create: `app/agents/page.tsx`
- Create: `app/agents/[agentId]/page.tsx`
- Create: `app/owner/page.tsx`
- Create: `app/owner/agents/new/page.tsx`
- Create: `app/owner/agents/[agentId]/page.tsx`
- Create: `components/agents/AgentTable.tsx`
- Create: `components/agents/AgentProfile.tsx`
- Create: `components/owner/OwnerDashboard.tsx`
- Create: `components/owner/AgentForm.tsx`

**Steps:**

1. Build agent registry.
2. Build agent profile with proof-derived reputation panel.
3. Build owner dashboard.
4. Build create agent form UI.
5. Build manage agent page.

**Acceptance:**

- Reputation is displayed as proof-derived.
- Owner dashboard feels like a real agent control center.
- Forms are accessible and clear.

---

## Task 12: Build workflow and payment split UI

**Objective:** Build multi-agent workflow surfaces.

**Files:**

- Create: `app/workflows/page.tsx`
- Create: `app/workflows/new/page.tsx`
- Create: `app/workflows/[workflowId]/page.tsx`
- Create: `components/workflows/WorkflowTable.tsx`
- Create: `components/workflows/WorkflowBuilder.tsx`
- Create: `components/workflows/WorkflowStepRail.tsx`
- Create: `components/workflows/PaymentSplitTable.tsx`

**Steps:**

1. Build workflow list.
2. Build create workflow UI.
3. Build workflow detail.
4. Build step rail.
5. Build payment split table.

**Acceptance:**

- Multiple agents are clear.
- Payment split dependencies are clear.
- Final proof bundle area exists.

---

## Task 13: Build verifier template UI

**Objective:** Build verifier library and registration screens.

**Files:**

- Create: `app/verifiers/page.tsx`
- Create: `app/verifiers/new/page.tsx`
- Create: `components/verifiers/VerifierTable.tsx`
- Create: `components/verifiers/VerifierForm.tsx`

**Steps:**

1. Build verifier library.
2. Build register verifier form.
3. Include input schema, output schema, WASM hash, mode support, owner wallet.
4. Add test verifier and publish template UI buttons.

**Acceptance:**

- UI makes verifier templates feel like product infrastructure.
- No server action is implied as complete.

---

## Task 14: Build API key management UI

**Objective:** Build scoped API key management screen.

**Files:**

- Create: `app/api-keys/page.tsx`
- Create: `components/api-keys/ApiKeyTable.tsx`
- Create: `components/api-keys/CreateApiKeyModal.tsx`

**Steps:**

1. Build API key table with prefix, scopes, last used, state.
2. Build create key modal.
3. Build one-time secret reveal UI.
4. Build revoke action UI.

**Acceptance:**

- Secret shown once pattern is visible.
- UI never shows real secrets.
- Scopes are easy to understand.

---

## Task 15: Build concise docs, privacy, terms, and status pages

**Objective:** Build trust and documentation surfaces.

**Files:**

- Create: `app/docs/page.tsx`
- Create: `app/privacy/page.tsx`
- Create: `app/terms/page.tsx`
- Create: `app/status/page.tsx`
- Create: `components/docs/DocsSection.tsx`
- Create: `components/legal/LegalTextPage.tsx`
- Create: `components/status/StatusRows.tsx`

**Steps:**

1. Build docs with core loop first.
2. Build API quickstart section.
3. Build concise Privacy page from `docs/PRIVACY.md`.
4. Build concise Terms page from `docs/TERMS.md`.
5. Build status page with text states, not dots.

**Acceptance:**

- Docs can be scanned in under two minutes.
- Privacy and Terms are plain English.
- Status uses text labels, not status dots.

---

## Task 16: Responsive, accessibility, and copy QA

**Objective:** Verify the whole frontend UI is ready for review.

**Files:**

- Modify as needed across `app/` and `components/`

**Steps:**

1. Run lint.
2. Run typecheck.
3. Check pages at 375px, 768px, 1024px, and desktop.
4. Search for forbidden words.
5. Check for em dashes.
6. Check that all routes render.
7. Check focus states.
8. Check that tables become readable on mobile.

**Commands:**

```bash
npm run lint
npm run typecheck
npm run build
grep -R "SR-71\|sr71" app components lib || true
python - <<'PY'
from pathlib import Path
for p in list(Path('app').rglob('*')) + list(Path('components').rglob('*')) + list(Path('lib').rglob('*')):
    if p.is_file() and p.suffix in {'.ts','.tsx','.css','.md'}:
        text=p.read_text(errors='ignore')
        if '-' in text:
            print('em dash', p)
PY
```

**Acceptance:**

- Lint passes.
- Typecheck passes.
- Build passes.
- No forbidden product wording.
- No em dashes.
- All planned routes render.

---

## Task 17: User review package

**Objective:** Prepare screenshots and a short review checklist for approval.

**Files:**

- Create: `docs/frontend-ui-review.md`

**Steps:**

1. Capture or list every route.
2. Add a checklist for landing, run, marketplace, agents, workflows, verifiers, API keys, proofs, docs, privacy, terms, and status.
3. Note any frontend-only limitations clearly.
4. Ask user to approve or request changes.

**Acceptance:**

- User can review quickly on mobile.
- Review package makes gaps obvious.

---

## Execution note

Because this is Mide's project, implementation should be delegated to the chosen frontend builder agent after this plan is approved. Do not start coding until the user confirms the implementation approach.
