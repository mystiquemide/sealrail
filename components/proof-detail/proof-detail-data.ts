import type { Proof, TaskDetail } from "@/lib/api-types";

const GREEN = "#64D96B";
const RED = "#F45B45";
const AMBER = "#F2B84B";
const GRAY = "#6E6E6C";
const NEU = "#C9C9C7";

export type ProofDetailRecord = {
  amount: string;
  payState: string;
  payColor: string;
  result: string;
  decision: string;
  timestamp: string;
  agentId: string;
  verifierId: string;
  wasmHash: string;
  wasmColor: string;
  attHash: string;
  attColor: string;
  verifyResult: string;
  verifyColor: string;
  proofKey: string;
  anchorStatus: string;
  anchorColor: string;
  explorerLink: string;
  statusSentence: string;
};

function latestProof(proofs: Proof[]): Proof | undefined {
  return proofs[proofs.length - 1];
}

export function buildProofDetailRecord(detail: TaskDetail): ProofDetailRecord {
  const { task, payment } = detail;
  const proof = latestProof(detail.proofs);
  const result = (task.input?.result ?? task.input?.output ?? task.input) as Record<string, unknown> | undefined;

  const payState = payment
    ? payment.status === "paid"
      ? "Paid"
      : payment.status === "unlockable"
        ? "Payable"
        : "Blocked"
    : "No payment";
  const payColor = payState === "Paid" || payState === "Payable" ? GREEN : payState === "Blocked" ? RED : GRAY;

  const verified = proof?.status === "verified" || proof?.status === "anchored";
  const failed = proof?.status === "failed";

  return {
    amount: payment ? `${payment.total_amount} ${payment.currency}` : "-",
    payState,
    payColor,
    result: verified ? "Verified" : (result?.decision as string) ?? (task.status === "failed" ? "Failed" : "Pending"),
    decision: (result?.reasoning as string) ?? (verified ? "Proof passed verification and payment may unlock." : "No decision recorded yet."),
    timestamp: task.updated_at,
    agentId: task.agent_id,
    verifierId: proof?.verifier_id ?? "-",
    wasmHash: proof?.wasm_hash ?? "pending",
    wasmColor: proof ? NEU : GRAY,
    attHash: proof?.attestation_hash ?? "pending",
    attColor: proof ? NEU : GRAY,
    verifyResult: verified ? "success: true" : failed ? "success: false" : "pending",
    verifyColor: verified ? GREEN : failed ? RED : AMBER,
    proofKey: proof?.casper_anchor_hash ?? "pending",
    anchorStatus: proof?.casper_anchor_hash ? "Anchored" : task.status === "failed" ? "None" : "Pending",
    anchorColor: proof?.casper_anchor_hash ? GREEN : task.status === "failed" ? RED : AMBER,
    explorerLink: proof?.casper_anchor_hash?.startsWith("dry-run-")
      ? "dry-run anchor - switch CASPER_MODE=testnet for explorer link"
      : proof?.casper_anchor_hash
        ? `https://testnet.cspr.live/deploy/${proof.casper_anchor_hash}`
        : "not available",
    statusSentence:
      task.status === "paid" || task.status === "payable"
        ? "Proof verified. Payment unlocked."
        : task.status === "failed" || task.status === "blocked"
          ? "Proof failed or blocked. Payment blocked."
          : "Proof pending. Payment blocked until verified.",
  };
}

export function buildProofBundle(taskTitle: string, detail: TaskDetail, r: ProofDetailRecord) {
  return {
    task: taskTitle,
    task_id: detail.task.id,
    mode: "schema_hash_verification",
    verifier: r.verifierId,
    result: r.result,
    decision: r.decision,
    wasm_hash: r.wasmHash,
    attestation_hash: r.attHash,
    casper_anchor: r.proofKey,
    payment_state: r.payState,
    x402_receipt: {
      protocol: "x402-compatible",
      network: r.proofKey.startsWith("dry-run-") ? "casper-dry-run" : "casper-testnet",
      status_code: 402,
      payment_required: true,
      proof_required: true,
      unlock_condition: "verified_proof_anchor",
      payment_state: r.payState.toLowerCase(),
    },
  };
}
