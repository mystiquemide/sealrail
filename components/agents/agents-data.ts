import type { Agent, VerifierTemplate } from "@/lib/api-types";

export type AgentListItem = {
  id: string;
  name: string;
  status: string;
  statusColor: string;
  isActive: boolean;
  task: string;
  hasVerifier: boolean;
  verifier?: string;
  mode?: string;
  profileHref: string;
  hasDemoRuntime: boolean;
};

// The public one-click demo (/run) only has an executable agent runtime for
// invoice-risk tasks. Other categories (e.g. RWA compliance) are listed in
// the marketplace but have no working run path yet, so their CTA must not
// pretend otherwise.
export function hasDemoRuntime(category: string): boolean {
  return category === "invoice";
}

const STATUS_COLOR: Record<Agent["status"], string> = {
  active: "#64D96B",
  paused: "#F2B84B",
  draft: "#6E6E6C",
};

export function formatMode(mode: string): string {
  if (mode === "tee_verification_mode") return "Schema + hash verification";
  if (mode === "hosted_tee") return "Hosted TEE (pending)";
  return mode;
}

export function toAgentListItem(agent: Agent, verifiersById: Map<string, VerifierTemplate>): AgentListItem {
  const verifier = agent.verifier_ids.length > 0 ? verifiersById.get(agent.verifier_ids[0]) : undefined;
  return {
    id: agent.id,
    name: agent.name,
    status: agent.status.charAt(0).toUpperCase() + agent.status.slice(1),
    statusColor: STATUS_COLOR[agent.status],
    isActive: agent.status === "active",
    task: agent.short_pitch || agent.description || agent.category,
    hasVerifier: Boolean(verifier),
    verifier: verifier?.name,
    mode: verifier?.mode_support?.[0] ? formatMode(verifier.mode_support[0]) : undefined,
    profileHref: `/agents/${agent.id}`,
    hasDemoRuntime: hasDemoRuntime(agent.category),
  };
}
