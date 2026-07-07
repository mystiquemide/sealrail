import type { Agent, AgentReputation, Proof, TaskDetail, VerifierTemplate } from "@/lib/api-types";
import { formatMode, hasDemoRuntime } from "@/components/agents/agents-data";

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
  hasDemoRuntime: boolean;
  reputation: ReputationStats;
  verifier: VerifierInfo;
  proofHistory: ProofHistoryItem[];
};

const STATUS_COLOR: Record<Agent["status"], string> = {
  active: "#64D96B",
  paused: "#F2B84B",
  draft: "#6E6E6C",
};

const PAY_COLOR: Record<string, string> = {
  paid: "#64D96B",
  unlockable: "#F2B84B",
  locked: "#F2B84B",
  blocked: "#F45B45",
};

function paymentLabelFor(proof: Proof, taskDetail: TaskDetail | null): { label: string; color: string } {
  if (proof.status === "failed") return { label: "Blocked", color: "#F45B45" };
  const recipient = taskDetail?.payment?.recipients.find((r) => r.agent_id === proof.agent_id);
  if (!recipient) return { label: "Pending", color: "#F2B84B" };
  const label = recipient.status.charAt(0).toUpperCase() + recipient.status.slice(1);
  return { label, color: PAY_COLOR[recipient.status] ?? "#8C8C8A" };
}

export function buildAgentProfile(
  agent: Agent,
  reputation: AgentReputation,
  verifier: VerifierTemplate | undefined,
  proofHistory: ProofHistoryItem[]
): AgentProfile {
  return {
    id: agent.id,
    name: agent.name,
    category: agent.category,
    owner: agent.owner_address,
    status: agent.status.charAt(0).toUpperCase() + agent.status.slice(1),
    statusColor: STATUS_COLOR[agent.status],
    runtimeType: agent.pricing_model === "workflow_split" ? "Workflow step" : "LLM worker",
    supportedTaskTypes: agent.supported_task_types,
    hasDemoRuntime: hasDemoRuntime(agent.category),
    reputation: {
      score: reputation.score,
      verifiedRuns: reputation.verified_runs,
      paidTasks: reputation.paid_tasks,
      failedProofs: reputation.failed_runs,
      totalEarned: `${reputation.total_earned} ${agent.currency}`,
    },
    verifier: {
      name: verifier?.name ?? "No verifier attached",
      inputSchema: verifier ? JSON.stringify(verifier.input_schema) : "-",
      outputSchema: verifier ? JSON.stringify(verifier.output_schema) : "-",
      wasmHash: verifier?.wasm_hash ?? "-",
    },
    proofHistory,
  };
}

export function buildProofHistoryItem(proof: Proof, taskDetail: TaskDetail | null, verifierName: string): ProofHistoryItem {
  const pay = paymentLabelFor(proof, taskDetail);
  return {
    id: proof.id,
    task: taskDetail?.task.title || proof.task_id || "-",
    verifier: verifierName,
    payment: pay.label,
    payColor: pay.color,
    href: proof.task_id ? `/proofs/${taskDetail?.task.title || proof.task_id}` : "#",
  };
}

export { formatMode };
