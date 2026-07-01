export type AgentListItem = {
  name: string;
  status: "Active" | "Planned";
  statusColor: string;
  isActive: boolean;
  task: string;
  hasVerifier: boolean;
  verifier?: string;
  mode?: string;
  profileHref?: string;
};

export const AGENTS: AgentListItem[] = [
  {
    name: "Invoice Risk Agent",
    status: "Active",
    statusColor: "#64D96B",
    isActive: true,
    task: "RWA invoice verification",
    hasVerifier: true,
    verifier: "verifyInvoiceRisk",
    mode: "TEE Verification Mode",
    profileHref: "/agents/agent_invoice_risk",
  },
  {
    name: "DeFi Risk Agent",
    status: "Planned",
    statusColor: "#6E6E6C",
    isActive: false,
    task: "Future extension",
    hasVerifier: false,
  },
  {
    name: "Research Agent",
    status: "Planned",
    statusColor: "#6E6E6C",
    isActive: false,
    task: "Future extension",
    hasVerifier: false,
  },
];
