import { describe, expect, it } from "vitest";
import type { WorkflowRun, WorkflowStepRun, WorkflowStepTemplate } from "@/lib/api-types";
import { computeBundleText, computeRunButtonLabel, computeSplits, computeSteps } from "./workflow-detail-state";

function makeTemplateStep(overrides: Partial<WorkflowStepTemplate>): WorkflowStepTemplate {
  return {
    id: "tpl-1",
    order: 1,
    name: "Step",
    agent_id: "agent-1",
    verifier_id: "verifier-1",
    required: true,
    payment_share_bps: 10000,
    ...overrides,
  };
}

function makeStepRun(overrides: Partial<WorkflowStepRun>): WorkflowStepRun {
  return {
    id: "run-1",
    workflow_run_id: "wf-run-1",
    step_template_id: "tpl-1",
    agent_id: "agent-1",
    verifier_id: "verifier-1",
    proof_id: null,
    status: "waiting",
    output: null,
    ...overrides,
  };
}

function makeRun(status: WorkflowRun["status"], finalProofId: string | null = null): WorkflowRun {
  return {
    id: "wf-run-1",
    template_id: "tpl",
    buyer_address: "01buyer",
    payment_id: null,
    status,
    step_runs: [],
    final_proof_id: finalProofId,
    created_at: "",
    updated_at: "",
  };
}

describe("computeSteps", () => {
  const templates = [
    makeTemplateStep({ id: "tpl-1", order: 2, name: "Second", agent_id: "agent-b", verifier_id: "ver-b" }),
    makeTemplateStep({ id: "tpl-2", order: 1, name: "First", agent_id: "agent-a", verifier_id: "ver-a" }),
  ];
  const agentNames = new Map([["agent-a", "Agent A"], ["agent-b", "Agent B"]]);
  const verifierNames = new Map([["ver-a", "Verifier A"], ["ver-b", "Verifier B"]]);

  it("orders steps by template order regardless of input order", () => {
    const steps = computeSteps(
      [makeStepRun({ id: "r1", step_template_id: "tpl-1" }), makeStepRun({ id: "r2", step_template_id: "tpl-2" })],
      templates,
      agentNames,
      verifierNames,
      null
    );
    expect(steps.map((s) => s.name)).toEqual(["Agent A", "Agent B"]);
    expect(steps.map((s) => s.n)).toEqual(["01", "02"]);
    expect(steps[0].verifier).toBe("Verifier A");
  });

  it("overrides the busy step to running with a pulse", () => {
    const steps = computeSteps(
      [makeStepRun({ id: "r1", step_template_id: "tpl-2", status: "waiting" })],
      templates,
      agentNames,
      verifierNames,
      "r1"
    );
    expect(steps[0].status).toBe("Running");
    expect(steps[0].pulse).toBe(true);
  });

  it("labels verified and failed steps", () => {
    const steps = computeSteps(
      [
        makeStepRun({ id: "r1", step_template_id: "tpl-2", status: "verified" }),
        makeStepRun({ id: "r2", step_template_id: "tpl-1", status: "failed" }),
      ],
      templates,
      agentNames,
      verifierNames,
      null
    );
    expect(steps[0].status).toBe("Verified");
    expect(steps[1].status).toBe("Failed");
  });
});

describe("computeSplits", () => {
  const split = [
    { address: "01aaa", role: "workflow_step", share_bps: 7000, agent_id: "agent-a" },
    { address: "01bbb", role: "workflow_step", share_bps: 3000 },
  ];
  const agentNames = new Map([["agent-a", "Agent A"]]);

  it("keeps splits locked until the run anchors", () => {
    const rows = computeSplits(split, "running", agentNames);
    expect(rows.every((r) => r.state === "Locked")).toBe(true);
  });

  it("unlocks splits once anchored and marks them paid when paid", () => {
    expect(computeSplits(split, "anchored", agentNames)[0].state).toBe("Unlocked");
    expect(computeSplits(split, "paid", agentNames)[0].state).toBe("Paid");
  });

  it("renders percentage shares and prefers agent names over addresses", () => {
    const rows = computeSplits(split, "created", agentNames);
    expect(rows[0].share).toBe("70%");
    expect(rows[0].recipient).toBe("Agent A");
    expect(rows[1].recipient).toBe("01bbb");
  });
});

describe("computeBundleText", () => {
  it("explains that the bundle appears only after the run finalizes", () => {
    expect(computeBundleText(null, [])).toContain("Run and finalize the workflow");
    expect(computeBundleText(makeRun("running"), ["h1"])).toContain("Run and finalize the workflow");
  });

  it("lists step proof hashes and the final proof id when finished", () => {
    const text = computeBundleText(makeRun("paid", "proof-final"), ["hash-a", "hash-b"]);
    expect(text).toContain("step_proof_hash_01: hash-a");
    expect(text).toContain("step_proof_hash_02: hash-b");
    expect(text).toContain("final_proof_id: proof-final");
  });
});

describe("computeRunButtonLabel", () => {
  it("covers the run lifecycle", () => {
    expect(computeRunButtonLabel(null, false)).toBe("Run workflow");
    expect(computeRunButtonLabel(null, true)).toBe("Starting run...");
    expect(computeRunButtonLabel(makeRun("running"), true)).toBe("Running...");
    expect(computeRunButtonLabel(makeRun("running"), false)).toBe("Continue workflow");
    expect(computeRunButtonLabel(makeRun("paid"), false)).toBe("Workflow complete");
    expect(computeRunButtonLabel(makeRun("step_failed"), false)).toBe("Workflow failed");
  });
});
