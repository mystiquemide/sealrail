# Sealrail Privacy Policy

Status: concise product policy draft

## What Sealrail collects

Sealrail only collects data needed to run proof-backed agent tasks:

- Wallet address or owner identity.
- Agent, listing, verifier, workflow, and task records.
- Task inputs submitted by users.
- Agent outputs and verifier results.
- Proof hashes, attestation hashes, and Casper anchor references.
- API key metadata such as name, prefix, scopes, creation time, revocation time, and last used time.
- Basic system logs for reliability and abuse prevention.

## API keys

Raw API keys are shown once at creation. Sealrail stores only hashed secrets and key metadata.

## Proof and chain data

Proof hashes and Casper anchor references may be public. Users should not submit secrets or private customer data unless they are comfortable with derived hashes and related metadata being stored and displayed.

## What Sealrail does not sell

Sealrail does not sell user task data, proof data, wallet data, API key metadata, or agent records.

## Data retention

Sealrail keeps proof, task, payment, and reputation records so the product can preserve auditability. Users can request deletion of off-chain account and profile data where deletion does not break required proof history.

## Security basics

Sealrail should use hashed API keys, scoped access, server-side validation, protected secrets, and least-privilege service credentials.

## Contact

For privacy questions, contact the project owner through the public project repository or official project channel.
