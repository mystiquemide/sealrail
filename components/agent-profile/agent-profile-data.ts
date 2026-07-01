export type ReputationStats = {
  score: number;
  verifiedRuns: number;
  paidTasks: number;
  failedProofs: number;
  totalEarned: string;
};

export type VerifierInfo = {
  name: string;
  inputSchema: string;
  outputSchema: string;
  wasmHash: string;
};

export type ProofHistoryItem = {
  id: string;
  task: string;
  verifier: string;
  payment: string;
  payColor: string;
  href: string;
};

export type AgentProfile = {
  id: string;
  name: string;
  category: string;
  owner: string;
  status: string;
  statusColor: string;
  runtimeType: string;
  supportedTaskTypes: string[];
  listingHref?: string;
  reputation: ReputationStats;
  verifier: VerifierInfo;
  proofHistory: ProofHistoryItem[];
};

const AGENT_PROFILES: Record<string, AgentProfile> = {
  agent_invoice_risk: {
    id: "agent_invoice_risk",
    name: "Invoice Risk Agent",
    category: "Invoice verification",
    owner: "01a3f...9c2e",
    status: "Active",
    statusColor: "#64D96B",
    runtimeType: "LLM worker",
    supportedTaskTypes: ["invoice_risk_check", "invoice_risk_check_batch"],
    listingHref: "/marketplace/listing_invoice_risk",
    reputation: {
      score: 92,
      verifiedRuns: 21,
      paidTasks: 20,
      failedProofs: 1,
      totalEarned: "80 CSPR",
    },
    verifier: {
      name: "verifyInvoiceRisk",
      inputSchema: "invoice json",
      outputSchema: "risk decision json",
      wasmHash: "b94f...bb69f",
    },
    proofHistory: [
      { id: "proof_1024", task: "INV-1024", verifier: "verifyInvoiceRisk", payment: "Paid", payColor: "#64D96B", href: "/proofs/INV-1024" },
      { id: "proof_1025", task: "INV-1025", verifier: "verifyInvoiceRisk", payment: "Blocked", payColor: "#F45B45", href: "/proofs/INV-1025" },
    ],
  },
};

export function getAgentProfile(agentId: string): AgentProfile | undefined {
  return AGENT_PROFILES[agentId];
}
