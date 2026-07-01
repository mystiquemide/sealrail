export type WorkflowStage = 0 | 1 | 2 | 3 | 4 | 5;

const GREEN = "#64D96B";
const AMBER = "#F2B84B";
const BLUE = "#3C8DFF";
const GRAY = "#6E6E6C";
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

const STEP_DEFS = [
  { n: "01", name: "Invoice Risk Agent", verifier: "verifyInvoiceRisk" },
  { n: "02", name: "Payment Approval Agent", verifier: "approvalVerifier" },
  { n: "03", name: "Settlement Verifier", verifier: "finalProofVerifier" },
];

export function computeSteps(stage: WorkflowStage): StepRun[] {
  return STEP_DEFS.map((d, i) => {
    const idx = i + 1;
    let status: string;
    let color: string;
    if (stage > idx) {
      status = "Verified";
      color = GREEN;
    } else if (stage === idx) {
      status = "Running";
      color = BLUE;
    } else {
      status = "Waiting";
      color = GRAY;
    }
    const dotBg = stage === idx ? color : stage > idx ? color : DOT_OFF;
    return { ...d, status, color, dotBg, dotBorder: color, pulse: stage === idx };
  });
}

export type SplitRow = {
  recipient: string;
  role: string;
  share: string;
  state: string;
  color: string;
};

const SPLIT_DEFS = [
  { recipient: "Invoice Risk Agent", role: "primary_agent", share: "60%", unlockAt: 2 },
  { recipient: "Payment Approval Agent", role: "workflow_step", share: "30%", unlockAt: 3 },
  { recipient: "Platform / verifier fee", role: "verifier", share: "10%", unlockAt: 4 },
];

export function computeSplits(stage: WorkflowStage): SplitRow[] {
  return SPLIT_DEFS.map((d) => ({
    recipient: d.recipient,
    role: d.role,
    share: d.share,
    state: stage >= d.unlockAt ? "Unlocked" : "Locked",
    color: stage >= d.unlockAt ? GREEN : AMBER,
  }));
}

export function computeBundleText(stage: WorkflowStage): string {
  if (stage < 5) return "Run the workflow to generate the final proof bundle.";
  return [
    "step_proof_hash_01: 0x80d0...cd44",
    "step_proof_hash_02: 0x4e91...02aa",
    "step_proof_hash_03: 0x1c7b...ff31",
    "split_bundle_hash: 0x9d3e...11bc",
    "casper_anchor: 0x9d3e...11bc (anchored)",
  ].join("\n");
}

export function computeRunButton(stage: WorkflowStage) {
  const label = stage === 0 ? "Run workflow" : stage >= 5 ? "Workflow complete" : "Running workflow...";
  const background = stage === 0 ? "#FFFFFF" : stage >= 5 ? "transparent" : "rgba(60,141,255,0.14)";
  const color = stage === 0 ? "#080808" : stage >= 5 ? "#64D96B" : "#9DC4FF";
  const borderColor = stage === 0 ? "#FFFFFF" : stage >= 5 ? "rgba(100,217,107,0.4)" : "rgba(60,141,255,0.45)";
  const cursor = stage === 0 ? "pointer" : "default";
  return { label, background, color, borderColor, cursor };
}

export const WORKFLOW_BUNDLE = {
  workflow: "invoice_settlement",
  steps: [
    { agent: "Invoice Risk Agent", verifier: "verifyInvoiceRisk", proof_hash: "0x80d0...cd44" },
    { agent: "Payment Approval Agent", verifier: "approvalVerifier", proof_hash: "0x4e91...02aa" },
    { agent: "Settlement Verifier", verifier: "finalProofVerifier", proof_hash: "0x1c7b...ff31" },
  ],
  split_bundle_hash: "0x9d3e...11bc",
  casper_anchor: "0x9d3e...11bc",
};
