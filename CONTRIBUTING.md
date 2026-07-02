# Contributing to Sealrail

Thanks for taking the time to contribute. Whether it's a bug report, a docs fix, or a new feature, it's welcome here.

## Getting set up

You need Node 20+ and npm. The backend uses better-sqlite3, which ships prebuilt binaries for Linux and macOS. On Windows, run the backend under WSL.

```bash
# Frontend (repo root)
npm install
npm run dev          # http://localhost:3000

# Backend (separate terminal)
cd backend
npm install
cp .env.example .env # defaults work for local development
npm run seed         # registers the first-party verifier, agent, and listing
npm run dev          # http://localhost:3001
```

Point the frontend at the backend with `NEXT_PUBLIC_API_URL=http://localhost:3001` in `.env.local`.

## Before you open a PR

- Run `npm run lint` and `npm run build` at the root.
- Run `npm test` in `backend/` (752 tests, no external services needed).
- If you touched the contract, run `cargo odra test` in `contracts/verified-agent-payments/`.

## Conventions

- Branch names: `fix/short-description` or `feat/short-description`.
- Keep PRs focused on one change. Small PRs get reviewed faster.
- Write commit messages like you'd explain the change to a colleague.
- One hard rule from the codebase: nothing may fake verification. Placeholder proofs can never advance a task or unlock a payment, and tests enforce this. Changes that weaken that invariant won't be merged.

## First contribution?

Look for issues labeled `good first issue`, or improve the docs - unclear docs are always a real bug.

This project follows the [Contributor Covenant](https://www.contributor-covenant.org/version/2/1/code_of_conduct/). Be kind.
