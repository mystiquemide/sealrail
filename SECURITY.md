# Security Policy

## Reporting a vulnerability

If you find a security issue in Sealrail, email **splashmediahub@gmail.com** with a description, reproduction steps, and impact assessment. Please don't open a public issue for security reports.

You'll get an acknowledgment within 72 hours. Once the issue is confirmed and fixed, we'll credit you in the changelog unless you prefer otherwise.

## Scope

- Backend API (`backend/`): auth bypass, payment-unlock bypass, proof forgery, secret exposure
- Casper contract (`contracts/verified-agent-payments/`): state-machine violations, unauthorized entry-point access
- Frontend (`app/`, `components/`, `lib/`): credential leakage, XSS

## What we consider critical

Anything that lets a payment unlock without a verified proof, lets placeholder or forged proofs advance task state, or lets one owner act as another. The test suite enforces these invariants (`backend/tests/`), and reports that break them get priority.

## Key handling

API key secrets are scrypt-hashed with per-key salts and never stored or logged in plain text. Only the key prefix is retained. If you find any path where a raw secret is persisted or echoed, report it.
