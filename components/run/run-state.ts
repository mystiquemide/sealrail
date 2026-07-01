export type Stage = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 99;

export type ButtonVariant = "primary" | "busy" | "done" | "failed" | "off";

export const BUTTON_VARIANT_STYLE: Record<
  ButtonVariant,
  { background: string; color: string; borderColor: string; opacity: number; cursor: string }
> = {
  primary: { background: "#FFFFFF", color: "#080808", borderColor: "#FFFFFF", opacity: 1, cursor: "pointer" },
  busy: {
    background: "rgba(60,141,255,0.14)",
    color: "#9DC4FF",
    borderColor: "rgba(60,141,255,0.45)",
    opacity: 1,
    cursor: "progress",
  },
  done: {
    background: "transparent",
    color: "#64D96B",
    borderColor: "rgba(100,217,107,0.4)",
    opacity: 1,
    cursor: "default",
  },
  failed: {
    background: "transparent",
    color: "#F45B45",
    borderColor: "rgba(244,91,69,0.45)",
    opacity: 1,
    cursor: "default",
  },
  off: {
    background: "transparent",
    color: "#6E6E6C",
    borderColor: "rgba(255,255,255,0.12)",
    opacity: 0.55,
    cursor: "not-allowed",
  },
};

const GREEN = "#64D96B";
const AMBER = "#F2B84B";
const BLUE = "#3C8DFF";
const RED = "#F45B45";
const GRAY = "#6E6E6C";
const NEU = "#C9C9C7";
const DOT_OFF = "#2A2A2A";

export type RailStep = {
  n: string;
  label: string;
  statusText: string;
  color: string;
  sub: string;
  dotColor: string;
  pulse: boolean;
};

export function isFailedStage(stage: Stage): boolean {
  return stage === 99;
}

export function computeSteps(stage: Stage): RailStep[] {
  const failed = isFailedStage(stage);

  const step1: RailStep =
    stage >= 1
      ? { n: "01", label: "Payment intent", statusText: "Created", color: AMBER, sub: "status: created", dotColor: AMBER, pulse: false }
      : { n: "01", label: "Payment intent", statusText: "Waiting", color: GRAY, sub: "status: waiting", dotColor: DOT_OFF, pulse: false };

  const step2: RailStep =
    stage === 2
      ? { n: "02", label: "Agent output", statusText: "Running", color: BLUE, sub: "invoice risk agent running", dotColor: BLUE, pulse: true }
      : stage >= 3
        ? { n: "02", label: "Agent output", statusText: "Ready", color: NEU, sub: "invoice_risk: medium", dotColor: NEU, pulse: false }
        : { n: "02", label: "Agent output", statusText: "Waiting", color: GRAY, sub: "status: waiting", dotColor: DOT_OFF, pulse: false };

  const step3: RailStep =
    stage === 4
      ? { n: "03", label: "Blocky-compatible check", statusText: "Verifying", color: BLUE, sub: "verifyInvoiceRisk running", dotColor: BLUE, pulse: true }
      : stage >= 5
        ? { n: "03", label: "Blocky-compatible check", statusText: "Verified", color: GREEN, sub: "success: true", dotColor: GREEN, pulse: false }
        : failed
          ? { n: "03", label: "Blocky-compatible check", statusText: "Failed", color: RED, sub: "success: false", dotColor: RED, pulse: false }
          : { n: "03", label: "Blocky-compatible check", statusText: "Waiting", color: GRAY, sub: "status: waiting", dotColor: DOT_OFF, pulse: false };

  const step4: RailStep =
    stage >= 5
      ? { n: "04", label: "Casper anchor", statusText: "Anchored", color: GREEN, sub: "0x80d0...cd44", dotColor: GREEN, pulse: false }
      : failed
        ? { n: "04", label: "Casper anchor", statusText: "None", color: RED, sub: "no proof to anchor", dotColor: RED, pulse: false }
        : { n: "04", label: "Casper anchor", statusText: "Waiting", color: GRAY, sub: "status: waiting", dotColor: DOT_OFF, pulse: false };

  const step5: RailStep =
    stage >= 6
      ? { n: "05", label: "Payment unlock", statusText: "Unlocked", color: GREEN, sub: "agent payable", dotColor: GREEN, pulse: false }
      : failed
        ? { n: "05", label: "Payment unlock", statusText: "Blocked", color: RED, sub: "payment blocked", dotColor: RED, pulse: false }
        : stage >= 1
          ? { n: "05", label: "Payment unlock", statusText: "Locked", color: AMBER, sub: "held until proof", dotColor: AMBER, pulse: false }
          : { n: "05", label: "Payment unlock", statusText: "Waiting", color: GRAY, sub: "status: waiting", dotColor: DOT_OFF, pulse: false };

  return [step1, step2, step3, step4, step5];
}

export function computeButtonVariants(stage: Stage): {
  b1: ButtonVariant;
  b2: ButtonVariant;
  b3: ButtonVariant;
  b4: ButtonVariant;
} {
  const failed = isFailedStage(stage);
  const b1: ButtonVariant = stage === 0 ? "primary" : "done";
  const b2: ButtonVariant = stage < 1 ? "off" : stage === 1 ? "primary" : stage === 2 ? "busy" : "done";
  const b3: ButtonVariant = stage < 3 ? "off" : stage === 3 ? "primary" : stage === 4 ? "busy" : failed ? "failed" : "done";
  const b4: ButtonVariant = failed ? "off" : stage < 5 ? "off" : stage === 5 ? "primary" : "done";
  return { b1, b2, b3, b4 };
}

export function computeButtonLabels(stage: Stage): { b1: string; b2: string; b3: string; b4: string } {
  const failed = isFailedStage(stage);
  return {
    b1: stage === 0 ? "Create payment task" : "Payment task created",
    b2: stage === 2 ? "Running agent check..." : stage >= 3 ? "Agent output ready" : "Run agent check",
    b3: stage === 4 ? "Verifying proof..." : stage >= 5 ? "Proof verified" : failed ? "Proof failed" : "Verify proof",
    b4: stage >= 6 ? "Payment unlocked" : "Unlock payment",
  };
}

export function computeOutput(stage: Stage) {
  const failed = isFailedStage(stage);
  const outVisible = stage >= 3;
  const hasProof = stage >= 5;
  return {
    outVisible,
    hasProof,
    badge: failed ? "Proof failed" : hasProof ? "Proof verified" : outVisible ? "Unverified" : "No output",
    color: failed ? RED : hasProof ? GREEN : AMBER,
    riskScore: outVisible ? "Medium" : "—",
    decision: outVisible ? "Approve with review" : "—",
    reason: outVisible
      ? "Payment history and due-date variance require review before settlement."
      : "Run the agent to produce a decision.",
    flags: outVisible ? ["due_date_variance", "recurring_vendor_review"] : [],
    noFlags: !outVisible,
    flagsEmptyText: "Run the agent to surface flags.",
  };
}

export function computeHashes(stage: Stage) {
  const failed = isFailedStage(stage);
  const hasProof = stage >= 5;
  const outVisible = stage >= 3;
  return {
    outputHash: outVisible ? "4c1a...e07b" : "pending",
    outputHashColor: outVisible ? NEU : GRAY,
    wasmHash: stage >= 4 ? "b94f...bb69f" : "pending",
    wasmColor: stage >= 4 ? NEU : GRAY,
    attHash: hasProof ? "80d0...cd44" : "pending",
    attColor: hasProof ? NEU : GRAY,
    anchHash: hasProof ? "0x80d0...cd44" : failed ? "none" : "pending",
    anchColor: hasProof ? GREEN : failed ? RED : GRAY,
    paymentState: stage >= 6 ? "Unlocked" : failed ? "Blocked" : stage >= 1 ? "Locked" : "Not started",
    paymentStateColor: stage >= 6 ? GREEN : failed ? RED : stage >= 1 ? AMBER : GRAY,
    hasProof,
  };
}

export const PROOF_BUNDLE = {
  task: "INV-1024",
  mode: "TEE Verification Mode",
  verifier: "verifyInvoiceRisk",
  result: "Medium risk",
  decision: "Approve with review",
  flags: ["due_date_variance", "recurring_vendor_review"],
  output_hash: "4c1a...e07b",
  wasm_hash: "b94f...bb69f",
  attestation_hash: "80d0...cd44",
  casper_anchor: "0x80d0...cd44",
  payment_state: "unlocked",
};
