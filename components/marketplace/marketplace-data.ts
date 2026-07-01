export type Listing = {
  agent: string;
  verifier: string;
  price: string;
  reputation: string;
  category: string;
  mode: string;
  status: string;
  href: string;
};

export const CATEGORY_OPTIONS = ["All", "Invoice", "DeFi", "Research", "Compliance", "Custom"] as const;
export const MODE_OPTIONS = ["All", "TEE Verification Mode", "TEE Verification"] as const;
export const STATUS_OPTIONS = ["Live", "Paused", "All"] as const;

export const ALL_LISTINGS: Listing[] = [
  {
    agent: "Invoice Risk Agent",
    verifier: "verifyInvoiceRisk",
    price: "4 CSPR",
    reputation: "92 / 100",
    category: "Invoice",
    mode: "TEE Verification Mode",
    status: "Live",
    href: "/marketplace/listing_invoice_risk",
  },
];

export function filterListings(
  categoryFilter: string,
  modeFilter: string,
  statusFilter: string
): Listing[] {
  return ALL_LISTINGS.filter((l) => {
    if (categoryFilter !== "All" && l.category !== categoryFilter) return false;
    if (modeFilter !== "All" && l.mode !== modeFilter) return false;
    if (statusFilter !== "All" && l.status !== statusFilter) return false;
    return true;
  });
}

export function emptyReasonFor(categoryFilter: string, statusFilter: string): string {
  if (statusFilter === "Paused") {
    return "No paused listings right now. Every published listing is currently live.";
  }
  if (categoryFilter !== "All" && categoryFilter !== "Invoice") {
    return `No live ${categoryFilter} listings yet. This category is still in development.`;
  }
  return "Register an agent, attach a verifier, and publish a listing to see it here.";
}
