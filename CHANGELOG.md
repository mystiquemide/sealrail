# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2026-07-02

### Added

- Proof-gated payment rail: tasks fund a payment that unlocks only after a verified proof
- First-party Invoice Risk Agent runtime with hash-bound, schema-validated LLM output
- Verifier template registry with WASM hash binding
- Agent registry, marketplace listings, and paid task creation
- Multi-step workflows with ordered execution and payment splits
- Reputation scoring computed from real proof and payment history
- Scoped API keys (scrypt-hashed secrets, shown once, prefix-only storage)
- Casper contract (Odra) deployed to testnet: agent registry, proof anchoring, payment state
- 19-screen web app wired to the live API, with honest empty, loading, and error states
- Seed script (`npm run seed`) registering the first-party verifier, agent, and listing
- 752-test backend suite, portable across machines with no external services required
- CI (lint, typecheck, tests, build), CodeQL analysis, and Dependabot updates
- Deployment runbook, environment documentation, and status/readiness endpoints
