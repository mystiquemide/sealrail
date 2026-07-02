import { describe, expect, it } from "vitest";
import { computeButtonLabels, computeButtonVariants, computeSteps } from "./run-state";

describe("computeSteps", () => {
  it("shows every rail step as waiting before the task exists", () => {
    const steps = computeSteps(0, null, null);
    expect(steps).toHaveLength(5);
    for (const step of steps) {
      expect(step.statusText).toBe("Waiting");
      expect(step.pulse).toBe(false);
    }
  });

  it("marks the payment intent created and the unlock locked once the task is funded", () => {
    const steps = computeSteps(1, null, null);
    expect(steps[0].statusText).toBe("Created");
    expect(steps[4].statusText).toBe("Locked");
    expect(steps[4].sub).toBe("held until proof");
  });

  it("pulses the agent step while the agent is executing", () => {
    const steps = computeSteps(1, 2, null);
    expect(steps[1].statusText).toBe("Running");
    expect(steps[1].pulse).toBe(true);
  });

  it("blocks the anchor and unlock steps when the agent fails", () => {
    const steps = computeSteps(1, null, 2);
    expect(steps[1].statusText).toBe("Failed");
    expect(steps[3].statusText).toBe("None");
    expect(steps[4].statusText).toBe("Blocked");
  });

  it("surfaces the anchor hash once the proof is anchored", () => {
    const steps = computeSteps(5, null, null, "anchor-abc123");
    expect(steps[2].statusText).toBe("Verified");
    expect(steps[3].statusText).toBe("Anchored");
    expect(steps[3].sub).toBe("anchor-abc123");
  });

  it("shows payment unlocked at the final stage", () => {
    const steps = computeSteps(6, null, null, "anchor-abc123");
    expect(steps[4].statusText).toBe("Unlocked");
    expect(steps[4].sub).toBe("agent payable");
  });
});

describe("computeButtonVariants", () => {
  it("only enables the create button before the task exists", () => {
    expect(computeButtonVariants(0, null, null)).toEqual({ b1: "primary", b2: "off", b3: "off", b4: "off" });
  });

  it("marks the create button busy while creating", () => {
    expect(computeButtonVariants(0, 1, null).b1).toBe("busy");
  });

  it("advances the active button as stages complete", () => {
    expect(computeButtonVariants(1, null, null)).toEqual({ b1: "done", b2: "primary", b3: "off", b4: "off" });
    expect(computeButtonVariants(3, null, null)).toEqual({ b1: "done", b2: "done", b3: "primary", b4: "off" });
    expect(computeButtonVariants(5, null, null)).toEqual({ b1: "done", b2: "done", b3: "done", b4: "primary" });
    expect(computeButtonVariants(6, null, null)).toEqual({ b1: "done", b2: "done", b3: "done", b4: "done" });
  });

  it("keeps the unlock button off after any failure", () => {
    expect(computeButtonVariants(1, null, 2).b2).toBe("failed");
    expect(computeButtonVariants(1, null, 2).b4).toBe("off");
    expect(computeButtonVariants(3, null, 3).b3).toBe("failed");
    expect(computeButtonVariants(3, null, 3).b4).toBe("off");
  });
});

describe("computeButtonLabels", () => {
  it("labels each stage truthfully", () => {
    expect(computeButtonLabels(0, null, null).b1).toBe("Create payment task");
    expect(computeButtonLabels(1, null, null).b1).toBe("Payment task created");
    expect(computeButtonLabels(1, 2, null).b2).toBe("Running agent...");
    expect(computeButtonLabels(1, null, 2).b2).toBe("Agent execution failed");
    expect(computeButtonLabels(3, 3, null).b3).toBe("Verifying proof...");
    expect(computeButtonLabels(5, null, null).b3).toBe("Proof verified");
    expect(computeButtonLabels(5, null, null).b4).toBe("Unlock payment");
    expect(computeButtonLabels(6, null, null).b4).toBe("Payment unlocked");
  });
});
