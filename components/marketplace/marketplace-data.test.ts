import { describe, expect, it } from "vitest";
import type { MarketplaceListing, VerifierTemplate } from "@/lib/api-types";
import { listingHasLiveRuntime, toListing } from "./marketplace-data";
import { toListingDetail } from "@/components/marketplace-listing/listing-data";

function makeListing(category: string): MarketplaceListing {
  return {
    id: `${category}-listing`,
    agent_id: `${category}-agent`,
    owner_address: "0202-owner",
    title: category === "invoice" ? "Invoice risk scanner" : "RWA compliance pre-check",
    category,
    summary: "Proof-gated listing",
    price_amount: 25,
    currency: "USD",
    proof_requirement: "schema-bound proof",
    verifier_id: `${category}-verifier`,
    reputation_score: 82,
    total_verified_runs: 7,
    total_paid_tasks: 5,
    failure_rate: 0,
    status: "live",
    created_at: "2026-07-18T00:00:00Z",
    updated_at: "2026-07-18T00:00:00Z",
  };
}

const verifier: VerifierTemplate = {
  id: "verifier-1",
  owner_address: "0202-owner",
  name: "Schema verifier",
  slug: "schema-verifier",
  description: "Verifies schema-bound output",
  task_type: "invoice_risk",
  input_schema: {},
  output_schema: {},
  wasm_hash: "wasm-hash",
  wasm_file_url: null,
  mode_support: ["tee_verification_mode"],
  status: "active",
  created_at: "2026-07-18T00:00:00Z",
  updated_at: "2026-07-18T00:00:00Z",
};

describe("marketplace runtime labeling", () => {
  it("marks invoice listings as runnable live runtime", () => {
    expect(listingHasLiveRuntime("invoice")).toBe(true);
    const row = toListing(makeListing("invoice"), verifier.mode_support[0]);
    const detail = toListingDetail(makeListing("invoice"), verifier);

    expect(row.status).toBe("Live");
    expect(row.isRunnable).toBe(true);
    expect(row.runtimeLabel).toBe("Live runtime");
    expect(detail.isRunnable).toBe(true);
    expect(detail.runtimeLabel).toBe("Live invoice-risk runtime");
  });

  it("labels RWA/compliance listings as preview instead of runnable", () => {
    expect(listingHasLiveRuntime("compliance")).toBe(false);
    const row = toListing(makeListing("compliance"), verifier.mode_support[0]);
    const detail = toListingDetail(makeListing("compliance"), verifier);

    expect(row.status).toBe("Preview");
    expect(row.isRunnable).toBe(false);
    expect(row.runtimeLabel).toBe("Preview listing");
    expect(detail.isRunnable).toBe(false);
    expect(detail.runtimeLabel).toBe("Preview - no dedicated runtime yet");
  });
});
