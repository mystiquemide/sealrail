import type { MarketplaceListing } from "@/lib/api-types";
import { formatMode } from "@/components/agents/agents-data";

export type Listing = {
  id: string;
  agent: string;
  verifier: string;
  price: string;
  reputation: string;
  category: string;
  mode: string;
  status: string;
  isRunnable: boolean;
  runtimeLabel: string;
  href: string;
};

export const CATEGORY_OPTIONS = ["All", "Invoice", "DeFi", "Research", "Compliance", "Custom"] as const;
export const MODE_OPTIONS = ["All", "Schema + hash verification", "Hosted TEE (pending)"] as const;
export const STATUS_OPTIONS = ["Live", "Paused", "All"] as const;

function categoryLabel(category: string): string {
  if (!category) return "Custom";
  return category.charAt(0).toUpperCase() + category.slice(1);
}

function statusLabel(status: string): string {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

export function listingHasLiveRuntime(category: string): boolean {
  return category === "invoice";
}

function runtimeLabelFor(category: string): string {
  return listingHasLiveRuntime(category) ? "Live runtime" : "Preview listing";
}

export function toListing(listing: MarketplaceListing, verifierMode?: string): Listing {
  const isRunnable = listingHasLiveRuntime(listing.category);
  return {
    id: listing.id,
    agent: listing.title,
    verifier: listing.proof_requirement || "-",
    price: `${listing.price_amount} ${listing.currency}`,
    reputation: `${listing.reputation_score} / 100`,
    category: categoryLabel(listing.category),
    mode: verifierMode ? formatMode(verifierMode) : "Schema + hash verification",
    status: isRunnable ? statusLabel(listing.status) : "Preview",
    isRunnable,
    runtimeLabel: runtimeLabelFor(listing.category),
    href: `/marketplace/${listing.id}`,
  };
}

export function filterListings(listings: Listing[], categoryFilter: string, modeFilter: string, statusFilter: string): Listing[] {
  return listings.filter((l) => {
    if (categoryFilter !== "All" && l.category !== categoryFilter) return false;
    if (modeFilter !== "All" && l.mode !== modeFilter) return false;
    if (statusFilter !== "All" && l.status !== statusFilter) return false;
    return true;
  });
}

export function emptyReasonFor(categoryFilter: string, statusFilter: string): string {
  if (statusFilter === "Paused") {
    return "No paused listings right now.";
  }
  if (categoryFilter !== "All") {
    return `No live ${categoryFilter} listings yet.`;
  }
  return "Register an agent, attach a verifier, and publish a listing to see it here.";
}
