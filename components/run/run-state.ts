export type Stage = 0 | 1 | 2 | 3 | 4 | 5 | 6;
export type BusyStep = 1 | 2 | 3 | 4 | null;
export type FailedStep = 2 | 3 | null;

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

export function computeSteps(stage: Stage, busyStep: BusyStep, failedStep: FailedStep, anchorHash?: string): RailStep[] {
  const step1: RailStep =
    stage >= 1
      ? { n: "01", label: "Payment intent", statusText: "Created", color: AMBER, sub: "status: created", dotColor: AMBER, pulse: false }
      : { n: "01", label: "Payment intent", statusText: "Waiting", color: GRAY, sub: "status: waiting", dotColor: DOT_OFF, pulse: false };

  const step2: RailStep =
    busyStep === 2
      ? { n: "02", label: "Agent output", statusText: "Running", color: BLUE, sub: "agent executing", dotColor: BLUE, pulse: true }
      : failedStep === 2
        ? { n: "02", label: "Agent output", statusText: "Failed", color: RED, sub: "execution failed", dotColor: RED, pulse: false }
        : stage >= 3
          ? { n: "02", label: "Agent output", statusText: "Ready", color: NEU, sub: "output received", dotColor: NEU, pulse: false }
          : { n: "02", label: "Agent output", statusText: "Waiting", color: GRAY, sub: "status: waiting", dotColor: DOT_OFF, pulse: false };

  const step3: RailStep =
    busyStep === 3
      ? { n: "03", label: "Blocky-compatible check", statusText: "Verifying", color: BLUE, sub: "verifier running", dotColor: BLUE, pulse: true }
      : failedStep === 3
        ? { n: "03", label: "Blocky-compatible check", statusText: "Failed", color: RED, sub: "success: false", dotColor: RED, pulse: false }
        : stage >= 5
          ? { n: "03", label: "Blocky-compatible check", statusText: "Verified", color: GREEN, sub: "success: true", dotColor: GREEN, pulse: false }
          : { n: "03", label: "Blocky-compatible check", statusText: "Waiting", color: GRAY, sub: "status: waiting", dotColor: DOT_OFF, pulse: false };

  const step4: RailStep =
    stage >= 5
      ? { n: "04", label: "Casper anchor", statusText: "Anchored", color: GREEN, sub: anchorHash ?? "anchored", dotColor: GREEN, pulse: false }
      : failedStep
        ? { n: "04", label: "Casper anchor", statusText: "None", color: RED, sub: "no proof to anchor", dotColor: RED, pulse: false }
        : { n: "04", label: "Casper anchor", statusText: "Waiting", color: GRAY, sub: "status: waiting", dotColor: DOT_OFF, pulse: false };

  const step5: RailStep =
    stage >= 6
      ? { n: "05", label: "Payment unlock", statusText: "Unlocked", color: GREEN, sub: "agent payable", dotColor: GREEN, pulse: false }
      : failedStep
        ? { n: "05", label: "Payment unlock", statusText: "Blocked", color: RED, sub: "payment blocked", dotColor: RED, pulse: false }
        : stage >= 1
          ? { n: "05", label: "Payment unlock", statusText: "Locked", color: AMBER, sub: "held until proof", dotColor: AMBER, pulse: false }
          : { n: "05", label: "Payment unlock", statusText: "Waiting", color: GRAY, sub: "status: waiting", dotColor: DOT_OFF, pulse: false };

  return [step1, step2, step3, step4, step5];
}

export function computeButtonVariants(
  stage: Stage,
  busyStep: BusyStep,
  failedStep: FailedStep
): { b1: ButtonVariant; b2: ButtonVariant; b3: ButtonVariant; b4: ButtonVariant } {
  const b1: ButtonVariant = stage === 0 ? (busyStep === 1 ? "busy" : "primary") : "done";

  const b2: ButtonVariant =
    stage < 1 ? "off" : failedStep === 2 ? "failed" : busyStep === 2 ? "busy" : stage >= 3 ? "done" : "primary";

  const b3: ButtonVariant =
    stage < 3 ? "off" : failedStep === 3 ? "failed" : busyStep === 3 ? "busy" : stage >= 5 ? "done" : "primary";

  const b4: ButtonVariant = failedStep
    ? "off"
    : stage < 5
      ? "off"
      : stage >= 6
        ? "done"
        : busyStep === 4
          ? "busy"
          : "primary";

  return { b1, b2, b3, b4 };
}

export function computeButtonLabels(
  stage: Stage,
  busyStep: BusyStep,
  failedStep: FailedStep
): { b1: string; b2: string; b3: string; b4: string } {
  return {
    b1: stage === 0 ? "Create payment task" : "Payment task created",
    b2:
      busyStep === 2
        ? "Running agent..."
        : failedStep === 2
          ? "Agent execution failed"
          : stage >= 3
            ? "Agent output ready"
            : "Run agent check",
    b3:
      busyStep === 3
        ? "Verifying proof..."
        : failedStep === 3
          ? "Proof failed"
          : stage >= 5
            ? "Proof verified"
            : "Verify + anchor proof",
    b4: stage >= 6 ? "Payment unlocked" : "Unlock payment",
  };
}
