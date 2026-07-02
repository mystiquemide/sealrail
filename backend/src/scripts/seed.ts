// ────────────────────────────────────────
// Sealrail seed script
// Registers the first-party Invoice Risk verifier, agent, and marketplace
// listing through the real service layer, so a fresh install starts with a
// working run path instead of empty screens.
//
// Honesty rules (same as the product):
// - Every record created here is a real record with real hashes.
// - No proofs, payments, or task history are fabricated. Proof records only
//   ever come from real runs (POST /api/tasks/:id/run with an LLM configured).
//
// Idempotent: re-running detects existing records by slug and skips them.
//
// Usage: npm run seed   (from backend/)
// ────────────────────────────────────────

import { createHash } from "crypto";
import { getDb } from "../db.js";
import { createVerifier } from "../services/verifiers.js";
import { createAgent } from "../services/agents.js";
import { createListing } from "../services/marketplace.js";

// A fixed, clearly-labeled operator identity for first-party seeded records.
const SEED_OWNER = "01seedf1r5tparty0perator" + createHash("sha256").update("sealrail-first-party").digest("hex").slice(0, 40);

const VERIFIER_NAME = "verifyInvoiceRisk";
const AGENT_NAME = "Invoice Risk Agent";
const LISTING_TITLE = "Invoice risk verification";

const INPUT_SCHEMA = {
  invoice_id: "string",
  vendor: "string",
  buyer: "string",
  amount_usd: "number",
  currency: "string",
  due_days: "number",
  line_items: "string[]",
};

const OUTPUT_SCHEMA = {
  risk_score: "number",
  decision: "string",
  reasoning: "string",
  flags: "string[]",
};

function slugOf(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function main(): void {
  const db = getDb();

  // Real SHA-256 of the verifier's canonical schema descriptor. This is the
  // hash the record is bound to; it is not a placeholder marker and it is
  // reproducible from the descriptor below.
  const wasmHash = createHash("sha256")
    .update(
      JSON.stringify({
        name: VERIFIER_NAME,
        task_type: "invoice_risk",
        input_schema: INPUT_SCHEMA,
        output_schema: OUTPUT_SCHEMA,
      }),
    )
    .digest("hex");

  // ── Verifier ───────────────────────────
  let verifierId: string;
  const existingVerifier = db
    .prepare("SELECT id FROM verifier_templates WHERE slug = ?")
    .get(slugOf(VERIFIER_NAME)) as { id: string } | undefined;

  if (existingVerifier) {
    verifierId = existingVerifier.id;
    console.log(`verifier: exists (${verifierId}), skipping`);
  } else {
    const verifier = createVerifier({
      ownerAddress: SEED_OWNER,
      name: VERIFIER_NAME,
      description:
        "Checks structured invoice-risk output against the registered schema. The WASM hash binds this template to its canonical schema descriptor.",
      taskType: "invoice_risk",
      inputSchema: INPUT_SCHEMA,
      outputSchema: OUTPUT_SCHEMA,
      wasmHash,
      modeSupport: ["tee_verification_mode"],
      status: "active",
    });
    verifierId = verifier.id;
    console.log(`verifier: created ${verifierId}`);
  }

  // ── Agent ──────────────────────────────
  let agentId: string;
  // Agent slugs carry a random suffix, so match by name + seed owner instead.
  const existingAgent = db
    .prepare("SELECT id FROM agents WHERE name = ? AND owner_address = ?")
    .get(AGENT_NAME, SEED_OWNER) as { id: string } | undefined;

  if (existingAgent) {
    agentId = existingAgent.id;
    console.log(`agent: exists (${agentId}), skipping`);
  } else {
    const agent = createAgent({
      ownerAddress: SEED_OWNER,
      name: AGENT_NAME,
      category: "invoice",
      description:
        "First-party LLM worker that scores invoice risk (0-100), returns an approve/review/reject decision with reasoning and flags, and produces hash-bound output for verification.",
      shortPitch: "Scores invoice risk with verifiable, schema-bound output.",
      pricingModel: "per_run",
      basePrice: 4,
      currency: "CSPR",
      verifierIds: [verifierId],
      supportedTaskTypes: ["invoice_risk"],
    });
    agentId = agent.id;
    console.log(`agent: created ${agentId}`);
  }

  // ── Marketplace listing ────────────────
  const existingListing = db
    .prepare("SELECT id FROM marketplace_listings WHERE agent_id = ?")
    .get(agentId) as { id: string } | undefined;

  if (existingListing) {
    console.log(`listing: exists (${existingListing.id}), skipping`);
  } else {
    const listing = createListing({
      agentId,
      ownerAddress: SEED_OWNER,
      title: LISTING_TITLE,
      category: "invoice",
      summary:
        "Submit an invoice and receive a verified risk assessment. Payment unlocks only after the proof verifies.",
      priceAmount: 4,
      currency: "CSPR",
      proofRequirement: "proof_verified",
      verifierId,
    });
    console.log(`listing: created ${listing.id}`);
  }

  console.log("\nSeed complete. Proof and payment records are never seeded —");
  console.log("run a task (POST /api/tasks/:id/run) with an LLM configured to produce real ones.");
  console.log("Quickest way with the server running: python3 scripts/e2e-check.py");
  console.log("(runs one invoice through fund -> execute -> verify -> anchor -> unlock, populating /proofs)");
}

main();
