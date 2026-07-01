export type OwnedAgent = {
  name: string;
  status: string;
  statusColor: string;
  href: string;
};

export type IncomingTask = {
  task: string;
  agent: string;
  state: string;
  stateColor: string;
  payment: string;
  payColor: string;
  href: string;
};

export const OWNED_AGENTS: OwnedAgent[] = [
  { name: "Invoice Risk Agent", status: "Active", statusColor: "#64D96B", href: "/agents/agent_invoice_risk" },
];

export const EARNINGS = {
  totalEarned: "80 CSPR",
  unlockable: "12 CSPR",
  blocked: "4 CSPR",
};

export const INCOMING_TASKS: IncomingTask[] = [
  {
    task: "INV-1025",
    agent: "Invoice Risk Agent",
    state: "Pending",
    stateColor: "#F2B84B",
    payment: "Blocked",
    payColor: "#F45B45",
    href: "/proofs/INV-1025",
  },
];
