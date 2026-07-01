export type ProofRow = {
  task: string;
  agent: string;
  proofState: string;
  proofColor: string;
  payState: string;
  payColor: string;
  hash: string;
  mode: string;
  href: string;
};

export const STATUS_OPTIONS = ["All", "Verified", "Pending", "Blocked", "Paid"] as const;
export const MODE_OPTIONS = ["All", "TEE Verification Mode", "TEE Verification"] as const;

export const ALL_PROOF_ROWS: ProofRow[] = [
  {
    task: "INV-1024",
    agent: "Invoice AI",
    proofState: "Verified",
    proofColor: "#64D96B",
    payState: "Payable",
    payColor: "#64D96B",
    hash: "0x80d0...cd44",
    mode: "TEE Verification Mode",
    href: "/proofs/INV-1024",
  },
  {
    task: "INV-1025",
    agent: "Invoice AI",
    proofState: "Pending",
    proofColor: "#F2B84B",
    payState: "Blocked",
    payColor: "#F45B45",
    hash: "pending",
    mode: "TEE Verification Mode",
    href: "/proofs/INV-1025",
  },
  {
    task: "INV-1026",
    agent: "Invoice AI",
    proofState: "Failed",
    proofColor: "#F45B45",
    payState: "Blocked",
    payColor: "#F45B45",
    hash: "none",
    mode: "TEE Verification Mode",
    href: "/proofs/INV-1026",
  },
];

export function filterProofRows(search: string, statusFilter: string, modeFilter: string): ProofRow[] {
  const q = search.trim().toLowerCase();
  return ALL_PROOF_ROWS.filter((r) => {
    if (q && !r.task.toLowerCase().includes(q)) return false;
    if (statusFilter !== "All" && r.proofState !== statusFilter && r.payState !== statusFilter) return false;
    if (modeFilter !== "All" && r.mode !== modeFilter) return false;
    return true;
  });
}

export function computeProofsView(filtered: ProofRow[]) {
  const hasAnyRecords = ALL_PROOF_ROWS.length > 0;
  const isEmpty = !hasAnyRecords;
  const isNoResults = hasAnyRecords && filtered.length === 0;

  return {
    showTable: hasAnyRecords && filtered.length > 0,
    showLoading: false,
    showEmpty: isEmpty,
    showNoResults: isNoResults,
    showError: false,
  };
}
