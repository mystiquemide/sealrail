import type { Agent, AgentReputation, Payment, Task } from "@/lib/api-types";

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

const STATUS_COLOR: Record<Agent["status"], string> = {
  active: "#64D96B",
  paused: "#F2B84B",
  draft: "#6E6E6C",
};

export function toOwnedAgent(agent: Agent): OwnedAgent {
  return {
    name: agent.name,
    status: agent.status.charAt(0).toUpperCase() + agent.status.slice(1),
    statusColor: STATUS_COLOR[agent.status],
    href: `/agents/${agent.id}`,
  };
}

export function computeEarnings(reputations: AgentReputation[], payments: Payment[], ownedAgentIds: Set<string>) {
  const totalEarned = reputations.reduce((sum, r) => sum + r.total_earned, 0);

  let unlockable = 0;
  let blocked = 0;
  for (const payment of payments) {
    for (const recipient of payment.recipients) {
      if (!recipient.agent_id || !ownedAgentIds.has(recipient.agent_id)) continue;
      if (recipient.status === "unlockable") unlockable += (payment.total_amount * recipient.share_bps) / 10000;
      if (recipient.status === "locked" || recipient.status === "blocked") {
        blocked += (payment.total_amount * recipient.share_bps) / 10000;
      }
    }
  }

  const currency = payments[0]?.currency ?? "CSPR";
  return {
    totalEarned: `${totalEarned} ${currency}`,
    unlockable: `${unlockable} ${currency}`,
    blocked: `${blocked} ${currency}`,
  };
}

const STATE_LABEL: Record<Task["status"], string> = {
  draft: "Draft",
  funded: "Funded",
  running: "Running",
  proof_pending: "Pending",
  proof_verified: "Verified",
  anchored: "Anchored",
  payable: "Payable",
  paid: "Paid",
  blocked: "Blocked",
  failed: "Failed",
};

const STATE_COLOR: Record<Task["status"], string> = {
  draft: "#6E6E6C",
  funded: "#F2B84B",
  running: "#3C8DFF",
  proof_pending: "#F2B84B",
  proof_verified: "#64D96B",
  anchored: "#64D96B",
  payable: "#64D96B",
  paid: "#64D96B",
  blocked: "#F45B45",
  failed: "#F45B45",
};

export function toIncomingTask(task: Task, agentName: string): IncomingTask {
  const payable = task.status === "payable" || task.status === "paid";
  return {
    task: task.title || task.id,
    agent: agentName,
    state: STATE_LABEL[task.status],
    stateColor: STATE_COLOR[task.status],
    payment: payable ? (task.status === "paid" ? "Paid" : "Payable") : "Blocked",
    payColor: payable ? "#64D96B" : "#F45B45",
    href: `/proofs/${encodeURIComponent(task.title || task.id)}`,
  };
}
