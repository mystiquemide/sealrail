import type { WorkflowRun, WorkflowStepRun, WorkflowStepTemplate } from "@/lib/api-types";

const GREEN = "#64D96B";
const AMBER = "#F2B84B";
const BLUE = "#3C8DFF";
const GRAY = "#6E6E6C";
const RED = "#F45B45";
const DOT_OFF = "#0E0E0E";

export type StepRun = {
  n: string;
  name: string;
  verifier: string;
  status: string;
  color: string;
  dotBg: string;
  dotBorder: string;
  pulse: boolean;
};

const STATUS_LABEL: Record<WorkflowStepRun["status"], string> = {
  waiting: "Waiting",
  running: "Running",
  verified: "Verified",
  failed: "Failed",
};

const STATUS_COLOR: Record<WorkflowStepRun["status"], string> = {
  waiting: GRAY,
  running: BLUE,
  verified: GREEN,
  failed: RED,
};

export function computeSteps(
  stepRuns: WorkflowStepRun[],
  templateSteps: WorkflowStepTemplate[],
  agentNames: Map<string, string>,
  verifierNames: Map<string, string>,
  busyStepId: string | null
): StepRun[] {
  const byTemplateId = new Map(templateSteps.map((t) => [t.id, t]));
  return stepRuns
    .slice()
    .sort((a, b) => {
      const orderA = byTemplateId.get(a.step_template_id)?.order ?? 0;
      const orderB = byTemplateId.get(b.step_template_id)?.order ?? 0;
      return orderA - orderB;
    })
    .map((sr, i) => {
      const template = byTemplateId.get(sr.step_template_id);
      const status = busyStepId === sr.id ? "running" : sr.status;
      const color = STATUS_COLOR[status];
      return {
        n: String(i + 1).padStart(2, "0"),
        name: template ? (agentNames.get(template.agent_id) ?? template.name) : "Step",
        verifier: template ? (verifierNames.get(template.verifier_id) ?? template.verifier_id) : "—",
        status: STATUS_LABEL[status],
        color,
        dotBg: status === "waiting" ? DOT_OFF : color,
        dotBorder: color,
        pulse: status === "running",
      };
    });
}

export type SplitRow = {
  recipient: string;
  role: string;
  share: string;
  state: string;
  color: string;
};

export function computeSplits(
  splitDefault: Array<{ address: string; role: string; share_bps: number; agent_id?: string | null }>,
  runStatus: WorkflowRun["status"],
  agentNames: Map<string, string>
): SplitRow[] {
  const unlocked = runStatus === "anchored" || runStatus === "payable" || runStatus === "paid";
  return splitDefault.map((d) => ({
    recipient: (d.agent_id && agentNames.get(d.agent_id)) || d.address,
    role: d.role,
    share: `${Math.round(d.share_bps / 100)}%`,
    state: runStatus === "paid" ? "Paid" : unlocked ? "Unlocked" : "Locked",
    color: runStatus === "paid" || unlocked ? GREEN : AMBER,
  }));
}

export function computeBundleText(run: WorkflowRun | null, stepProofHashes: string[]): string {
  if (!run || run.status !== "paid" && run.status !== "payable" && run.status !== "anchored") {
    return "Run and finalize the workflow to generate the final proof bundle.";
  }
  const lines = stepProofHashes.map((h, i) => `step_proof_hash_${String(i + 1).padStart(2, "0")}: ${h}`);
  lines.push(`final_proof_id: ${run.final_proof_id ?? "pending"}`);
  return lines.join("\n");
}

export function computeRunButtonLabel(run: WorkflowRun | null, busy: boolean): string {
  if (!run) return busy ? "Starting run..." : "Run workflow";
  if (run.status === "paid" || run.status === "payable" || run.status === "anchored") return "Workflow complete";
  if (run.status === "step_failed") return "Workflow failed";
  return busy ? "Running..." : "Continue workflow";
}
