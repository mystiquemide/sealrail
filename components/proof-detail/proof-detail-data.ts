export type ProofDetailRecord = {
  amount: string;
  payState: string;
  payColor: string;
  result: string;
  decision: string;
  timestamp: string;
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

const PROOF_RECORDS: Record<string, ProofDetailRecord> = {
  "INV-1024": {
    amount: "12,400 USD",
    payState: "Payable",
    payColor: "#64D96B",
    result: "Medium risk",
    decision: "Approve with review",
    timestamp: "2026-06-30 14:02 UTC",
    wasmHash: "b94f...bb69f",
    wasmColor: "#C9C9C7",
    attHash: "80d0...cd44",
    attColor: "#C9C9C7",
    verifyResult: "success: true",
    verifyColor: "#64D96B",
    proofKey: "0x80d0...cd44",
    anchorStatus: "Anchored",
    anchorColor: "#64D96B",
    explorerLink: "available after live anchor",
    statusSentence: "Proof verified. Payment unlocked.",
  },
  "INV-1025": {
    amount: "8,150 USD",
    payState: "Blocked",
    payColor: "#F45B45",
    result: "Pending",
    decision: "Awaiting verification",
    timestamp: "2026-06-30 15:41 UTC",
    wasmHash: "b94f...bb69f",
    wasmColor: "#C9C9C7",
    attHash: "pending",
    attColor: "#6E6E6C",
    verifyResult: "pending",
    verifyColor: "#F2B84B",
    proofKey: "pending",
    anchorStatus: "Pending",
    anchorColor: "#F2B84B",
    explorerLink: "available after live anchor",
    statusSentence: "Proof pending. Payment blocked until verified.",
  },
  "INV-1026": {
    amount: "5,980 USD",
    payState: "Blocked",
    payColor: "#F45B45",
    result: "High risk",
    decision: "Reject",
    timestamp: "2026-06-30 09:17 UTC",
    wasmHash: "b94f...bb69f",
    wasmColor: "#C9C9C7",
    attHash: "none",
    attColor: "#6E6E6C",
    verifyResult: "success: false",
    verifyColor: "#F45B45",
    proofKey: "none",
    anchorStatus: "None",
    anchorColor: "#F45B45",
    explorerLink: "not available",
    statusSentence: "Proof failed. Payment blocked.",
  },
};

export function getProofDetail(taskId: string): ProofDetailRecord | undefined {
  return PROOF_RECORDS[taskId];
}

export function buildProofBundle(taskId: string, r: ProofDetailRecord) {
  return {
    task: taskId,
    mode: "TEE Verification Mode",
    verifier: "verifyInvoiceRisk",
    result: r.result,
    decision: r.decision,
    wasm_hash: r.wasmHash,
    attestation_hash: r.attHash,
    casper_anchor: r.proofKey,
    payment_state: r.payState,
  };
}
