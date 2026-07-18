import { describe, expect, it } from "vitest";
import type { Proof, Task, TaskDetail } from "@/lib/api-types";
import { computeProofsView, filterProofRows, toProofRow, type ProofRow } from "./proofs-data";

function makeDetail(overrides: { status: Task["status"]; title?: string; proof?: Partial<Proof> | null }): TaskDetail {
  const task = {
    id: "task-1",
    title: overrides.title ?? "INV-1030",
    agent_id: "agent-1",
    status: overrides.status,
  } as Task;
  const proofs =
    overrides.proof === null
      ? []
      : [{ casper_anchor_hash: null, ...overrides.proof } as Proof];
  return { task, payment: null, proofs };
}

function makeRow(overrides: Partial<ProofRow>): ProofRow {
  return {
    task: "INV-1030",
    agent: "Invoice Risk Agent",
    proofState: "Verified",
    proofColor: "",
    payState: "Payable",
    payColor: "",
    hash: "anchor-1",
    mode: "Schema + hash verification",
    href: "/proofs/INV-1030",
    ...overrides,
  };
}

describe("toProofRow", () => {
  it("maps a verified task with an anchored proof", () => {
    const row = toProofRow(makeDetail({ status: "proof_verified", proof: { casper_anchor_hash: "anchor-xyz" } }), "Invoice Risk Agent");
    expect(row.proofState).toBe("Verified");
    expect(row.hash).toBe("anchor-xyz");
    expect(row.agent).toBe("Invoice Risk Agent");
  });

  it("shows pending hash for a proof that is not anchored yet", () => {
    const row = toProofRow(makeDetail({ status: "proof_verified" }), "A");
    expect(row.hash).toBe("pending");
  });

  it("shows none when the task has no proof records", () => {
    const row = toProofRow(makeDetail({ status: "running", proof: null }), "A");
    expect(row.hash).toBe("none");
    expect(row.proofState).toBe("Pending");
  });

  it("marks paid tasks as paid and failed tasks as blocked", () => {
    expect(toProofRow(makeDetail({ status: "paid" }), "A").payState).toBe("Paid");
    expect(toProofRow(makeDetail({ status: "failed" }), "A").payState).toBe("Blocked");
    expect(toProofRow(makeDetail({ status: "failed" }), "A").proofState).toBe("Failed");
  });

  it("links to the canonical proof id when a proof record exists", () => {
    const row = toProofRow(makeDetail({ status: "paid", proof: { id: "proof 20/42" } }), "A");
    expect(row.href).toBe("/proofs/proof%2020%2F42");
  });

  it("falls back to the task id when no proof record exists", () => {
    const row = toProofRow(makeDetail({ status: "running", proof: null }), "A");
    expect(row.href).toBe("/proofs/task-1");
  });
});

describe("filterProofRows", () => {
  const rows = [
    makeRow({ task: "INV-1030", proofState: "Verified", payState: "Payable" }),
    makeRow({ task: "INV-2042", proofState: "Pending", payState: "Blocked" }),
  ];

  it("matches the search case-insensitively against the task title", () => {
    expect(filterProofRows(rows, "inv-10", "All", "All")).toHaveLength(1);
    expect(filterProofRows(rows, "nope", "All", "All")).toHaveLength(0);
  });

  it("matches the status filter against either the proof or the payment state", () => {
    expect(filterProofRows(rows, "", "Verified", "All")).toHaveLength(1);
    expect(filterProofRows(rows, "", "Blocked", "All")).toHaveLength(1);
    expect(filterProofRows(rows, "", "Paid", "All")).toHaveLength(0);
  });

  it("filters by verification mode", () => {
    expect(filterProofRows(rows, "", "All", "Schema + hash verification")).toHaveLength(2);
    expect(filterProofRows(rows, "", "All", "Hosted TEE (pending)")).toHaveLength(0);
  });
});

describe("computeProofsView", () => {
  it("shows only the loading state while loading", () => {
    expect(computeProofsView("loading", false, [])).toEqual({
      showTable: false,
      showLoading: true,
      showEmpty: false,
      showNoResults: false,
      showError: false,
    });
  });

  it("shows only the error state on failure", () => {
    expect(computeProofsView("error", false, []).showError).toBe(true);
    expect(computeProofsView("error", false, []).showTable).toBe(false);
  });

  it("distinguishes an empty system from filters that match nothing", () => {
    expect(computeProofsView("loaded", false, []).showEmpty).toBe(true);
    expect(computeProofsView("loaded", true, []).showNoResults).toBe(true);
    expect(computeProofsView("loaded", true, [makeRow({})]).showTable).toBe(true);
  });
});
