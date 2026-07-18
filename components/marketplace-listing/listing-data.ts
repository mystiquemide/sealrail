import type { MarketplaceListing, VerifierTemplate } from "@/lib/api-types";
import { formatMode } from "@/components/agents/agents-data";
import { listingHasLiveRuntime } from "@/components/marketplace/marketplace-data";

export type ListingDetail = {
  id: string;
  agent: string;
  tagline: string;
  price: string;
  proofRequirement: string;
  agentOwner: string;
  verifier: string;
  mode: string;
  category: string;
  isRunnable: boolean;
  runtimeLabel: string;
  reputation: string;
  verifiedRuns: number;
  failedProofs: number;
};

export function toListingDetail(listing: MarketplaceListing, verifier: VerifierTemplate | undefined): ListingDetail {
  const isRunnable = listingHasLiveRuntime(listing.category);
  return {
    id: listing.id,
    agent: listing.title,
    tagline: listing.summary || `Payment-backed ${listing.category} verification.`,
    price: `${listing.price_amount} ${listing.currency}`,
    proofRequirement: listing.proof_requirement || verifier?.name || "-",
    agentOwner: listing.owner_address,
    verifier: verifier?.name ?? listing.verifier_id,
    mode: verifier?.mode_support?.[0] ? formatMode(verifier.mode_support[0]) : "Schema + hash verification",
    category: listing.category,
    isRunnable,
    runtimeLabel: isRunnable ? "Live invoice-risk runtime" : "Preview - no dedicated runtime yet",
    reputation: `${listing.reputation_score} / 100`,
    verifiedRuns: listing.total_verified_runs,
    failedProofs: 0,
  };
}
