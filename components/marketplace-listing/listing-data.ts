export type TaskDefaults = {
  invoiceId: string;
  amount: string;
  vendor: string;
  buyer: string;
  dueDate: string;
};

export type RecentProof = {
  id: string;
  task: string;
  state: string;
  payment: string;
  hash: string;
  href: string;
};

export type ListingDetail = {
  id: string;
  agent: string;
  tagline: string;
  price: string;
  proofRequirement: string;
  taskDefaults: TaskDefaults;
  agentOwner: string;
  verifier: string;
  mode: string;
  reputation: string;
  verifiedRuns: number;
  failedProofs: number;
  recentProofs: RecentProof[];
};

const LISTINGS: Record<string, ListingDetail> = {
  listing_invoice_risk: {
    id: "listing_invoice_risk",
    agent: "Invoice Risk Agent",
    tagline: "Payment-backed invoice risk verification.",
    price: "4 CSPR",
    proofRequirement: "verifyInvoiceRisk",
    taskDefaults: {
      invoiceId: "INV-1027",
      amount: "4 CSPR + task amount",
      vendor: "Northwind Supply",
      buyer: "Atlas Retail",
      dueDate: "2026-07-30",
    },
    agentOwner: "01a3f...9c2e",
    verifier: "verifyInvoiceRisk",
    mode: "TEE Verification Mode",
    reputation: "92 / 100",
    verifiedRuns: 21,
    failedProofs: 1,
    recentProofs: [
      { id: "proof_1024", task: "INV-1024", state: "Verified", payment: "Paid", hash: "0x80d0...cd44", href: "/proofs/INV-1024" },
    ],
  },
};

export function getListingDetail(listingId: string): ListingDetail | undefined {
  return LISTINGS[listingId];
}
