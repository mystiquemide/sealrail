import type { TaskDetail } from "@/lib/api-types";

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

const GREEN = "#64D96B";
const AMBER = "#F2B84B";
const RED = "#F45B45";
const GRAY = "#6E6E6C";

function proofStateFor(status: string): { label: string; color: string } {
  if (status === "proof_verified" || status === "anchored" || status === "payable" || status === "paid") {
    return { label: "Verified", color: GREEN };
  }
  if (status === "failed") return { label: "Failed", color: RED };
  if (status === "proof_pending" || status === "running") return { label: "Pending", color: AMBER };
  return { label: "Pending", color: GRAY };
}

function payStateFor(status: string): { label: string; color: string } {
  if (status === "paid") return { label: "Paid", color: GREEN };
  if (status === "payable") return { label: "Payable", color: GREEN };
  if (status === "blocked" || status === "failed") return { label: "Blocked", color: RED };
  return { label: "Blocked", color: AMBER };
}

export function toProofRow(detail: TaskDetail, agentName: string): ProofRow {
  const proof = detail.proofs[detail.proofs.length - 1];
  const proofState = proofStateFor(detail.task.status);
  const payState = payStateFor(detail.task.status);
  return {
    task: detail.task.title || detail.task.id,
    agent: agentName,
    proofState: proofState.label,
    proofColor: proofState.color,
    payState: payState.label,
    payColor: payState.color,
    hash: proof?.casper_anchor_hash ?? (proof ? "pending" : "none"),
    mode: "TEE Verification Mode",
    href: `/proofs/${encodeURIComponent(detail.task.title || detail.task.id)}`,
  };
}

export function filterProofRows(rows: ProofRow[], search: string, statusFilter: string, modeFilter: string): ProofRow[] {
  const q = search.trim().toLowerCase();
  return rows.filter((r) => {
    if (q && !r.task.toLowerCase().includes(q)) return false;
    if (statusFilter !== "All" && r.proofState !== statusFilter && r.payState !== statusFilter) return false;
    if (modeFilter !== "All" && r.mode !== modeFilter) return false;
    return true;
  });
}

export function computeProofsView(hasAnyRecords: boolean, filtered: ProofRow[]) {
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
