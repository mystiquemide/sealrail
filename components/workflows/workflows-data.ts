import type { WorkflowTemplate } from "@/lib/api-types";

export type WorkflowListItem = {
  id: string;
  name: string;
  steps: string;
  split: string;
  state: string;
  stateColor: string;
  href: string;
};

const STATE_COLOR: Record<WorkflowTemplate["status"], string> = {
  active: "#64D96B",
  draft: "#6E6E6C",
};

export function toWorkflowListItem(w: WorkflowTemplate): WorkflowListItem {
  const split =
    w.payment_split_default.length > 0
      ? w.payment_split_default.map((r) => `${Math.round(r.share_bps / 100)}%`).join(" / ")
      : "-";
  return {
    id: w.id,
    name: w.name,
    steps: String(w.steps.length),
    split,
    state: w.status.charAt(0).toUpperCase() + w.status.slice(1),
    stateColor: STATE_COLOR[w.status],
    href: `/workflows/${w.id}`,
  };
}
