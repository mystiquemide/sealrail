# Full Ecosystem Tasks

Project: Sealrail
Purpose: Real working marketplace and ecosystem build checklist

## Product rule

No fabricated surfaces. No fake listings presented as real. No non-working flows. Use product language such as task, run, proof run, workflow run, or invoice verification run. Every page must either connect to real records or show a truthful empty state with a real create action.

## Task group 1: Foundation

- [ ] Create project app shell
- [ ] Add Sealrail design tokens
- [ ] Add shared layout and nav
- [ ] Add route structure for all ecosystem pages
- [ ] Add database schema or durable persistence layer
- [ ] Add wallet identity or owner identity model
- [ ] Add backend service folders
- [ ] Add API route skeletons with real handlers
- [ ] Add real empty states for no records yet

## Task group 2: Real core proof/payment run

- [ ] Create task model
- [ ] Create payment intent model
- [ ] Connect invoice risk agent run
- [ ] Connect Blocky local verifier output
- [ ] Store proof record
- [ ] Add Casper anchor adapter
- [ ] Add payment unlock logic
- [ ] Add proof detail page
- [ ] Add proof explorer page

## Task group 3: Full marketplace UI

- [ ] Build `/marketplace`
- [ ] Load marketplace listings from real records
- [ ] Add category filters
- [ ] Add listing rows
- [ ] Add reputation preview from real reputation records
- [ ] Add price and proof requirement labels
- [ ] Build `/marketplace/[listingId]`
- [ ] Add start task from listing
- [ ] Link listing to real task creation
- [ ] Show truthful empty state when no listings exist

## Task group 4: Agent registry and profiles

- [ ] Build `/agents`
- [ ] Load agents from real Agent records
- [ ] Build `/agents/[agentId]`
- [ ] Show verifier mapping
- [ ] Show proof history
- [ ] Show supported task types
- [ ] Show reputation stats from real proof/payment data
- [ ] Show task history

## Task group 5: Agent owner dashboard

- [ ] Build `/owner`
- [ ] Load owned agents by owner identity
- [ ] Show active listings from real records
- [ ] Show incoming tasks from real task records
- [ ] Show total earned from real payments
- [ ] Show proof success rate from real proofs
- [ ] Build `/owner/agents/new`
- [ ] Build `/owner/agents/[agentId]`
- [ ] Add create agent flow that writes Agent records
- [ ] Add manage listing flow that writes MarketplaceListing records

## Task group 6: Multi-agent orchestration engine

- [ ] Create workflow template model
- [ ] Create workflow run model
- [ ] Create workflow step run model
- [ ] Build `/workflows`
- [ ] Build `/workflows/new`
- [ ] Build `/workflows/[workflowId]`
- [ ] Add create workflow flow
- [ ] Add run workflow action
- [ ] Add ordered step execution
- [ ] Add step proof generation flow
- [ ] Add final proof bundle
- [ ] Add workflow proof detail

## Task group 7: Payment splits

- [ ] Add payment recipient model
- [ ] Add split calculation service
- [ ] Add split preview UI
- [ ] Add split hash generation
- [ ] Add split proof dependency labels
- [ ] Add split unlock state
- [ ] Add recipient payment status
- [ ] Anchor split bundle hash with final proof when possible

## Task group 8: Reputation scoring

- [ ] Add reputation calculator
- [ ] Track verified runs
- [ ] Track failed proofs
- [ ] Track paid tasks
- [ ] Track blocked tasks
- [ ] Track total earned
- [ ] Track average verification time
- [ ] Show reputation on marketplace
- [ ] Show reputation on agent profile
- [ ] Show reputation on owner dashboard

## Task group 9: API key management

- [ ] Build `/api-keys`
- [ ] Add create key flow
- [ ] Generate key secret
- [ ] Store hashed secret only
- [ ] Show key secret once
- [ ] Add scopes
- [ ] Add revoke action
- [ ] Add last used timestamp tracking through middleware

## Task group 10: Verifier template upload system

- [ ] Build `/verifiers`
- [ ] Load verifier templates from real records
- [ ] Build `/verifiers/new`
- [ ] Add verifier metadata form
- [ ] Add input schema field
- [ ] Add output schema field
- [ ] Add WASM hash field
- [ ] Add mode support selector
- [ ] Add test verifier action
- [ ] Add publish template action
- [ ] Store VerifierTemplate records

## Task group 11: Developer docs and status

- [ ] Build `/docs`
- [ ] Add API route examples
- [ ] Add local mode explanation
- [ ] Add hosted Blocky AS path without claiming it is live
- [ ] Add Casper ProofRegistry explanation
- [ ] Build `/status`
- [ ] Show backend status
- [ ] Show Blocky local verifier status
- [ ] Show Casper RPC status
- [ ] Show CSPR.cloud status

## Task group 12: Product polish

- [ ] Add empty states
- [ ] Add loading states
- [ ] Add error states
- [ ] Add mobile responsive layouts
- [ ] Add accessibility labels
- [ ] Add no-em-dash scan
- [ ] Add route audit
- [ ] Add product run screenshots

## Non-negotiable truth rules

- [ ] Invoice Risk Agent must run real local verifier path
- [ ] Marketplace listings must come from real records
- [ ] Agent profiles must come from real records
- [ ] Workflow runs must create real workflow run and step run records
- [ ] Payment splits must be calculated and stored
- [ ] Reputation must be derived from real proof/payment history
- [ ] API keys must be hashed and revocable
- [ ] Proof hashes must be real from local Blocky-compatible output
- [ ] Casper anchor must be real if available, otherwise clearly pending
- [ ] Hosted TEE must not be claimed until real Blocky AS access is live
- [ ] Product UI must use real product language
