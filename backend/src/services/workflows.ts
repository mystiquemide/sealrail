// ────────────────────────────────────────
// Sealrail Workflow Service
// Phase H1: Workflow template CRUD
// Phase H2: Workflow run engine with ordered step execution
// Phase H3: Step proof generation and final bundle
// ────────────────────────────────────────

import { randomUUID, createHash } from "crypto";
import { getDb } from "../db.js";
import { getAgent } from "./agents.js";
import type {
  WorkflowTemplate,
  WorkflowStepTemplate,
  WorkflowRun,
  WorkflowStepRun,
  WorkflowStatus,
  WorkflowRunStatus,
  WorkflowStepRunStatus,
  Proof,
  ProofMode,
  ProofStatus,
} from "../types.js";
import { config } from "../config.js";

// ── Row types for DB queries ──────────────

interface WorkflowTemplateRow {
  id: string;
  owner_address: string;
  name: string;
  description: string;
  category: string;
  steps: string;
  payment_split_default: string;
  status: string;
  created_at: string;
  updated_at: string;
}

interface WorkflowRunRow {
  id: string;
  template_id: string;
  buyer_address: string;
  payment_id: string | null;
  status: string;
  step_runs: string;
  final_proof_id: string | null;
  created_at: string;
  updated_at: string;
}

interface ProofRow {
  id: string;
  task_id: string | null;
  parent_proof_id: string | null;
  workflow_run_id: string | null;
  workflow_step_run_id: string | null;
  agent_id: string;
  verifier_id: string;
  input_hash: string;
  output_hash: string;
  wasm_hash: string;
  attestation_hash: string;
  casper_anchor_hash: string | null;
  mode: string;
  status: string;
  created_at: string;
}

// ── Workflow run state machine ────────────

const WORKFLOW_RUN_TRANSITIONS: Record<WorkflowRunStatus, WorkflowRunStatus[]> = {
  created: ["running"],
  running: ["step_failed", "proofs_verified"],
  step_failed: ["running"],
  proofs_verified: ["anchored", "payable"],
  anchored: ["payable"],
  payable: ["paid"],
  paid: [],
};

function isValidWorkflowRunTransition(
  from: WorkflowRunStatus,
  to: WorkflowRunStatus
): boolean {
  const allowed = WORKFLOW_RUN_TRANSITIONS[from];
  if (!allowed) return false;
  return allowed.includes(to);
}

// ── Helpers ──────────────────────────────

function rowToWorkflowTemplate(row: WorkflowTemplateRow): WorkflowTemplate {
  return {
    id: row.id,
    owner_address: row.owner_address,
    name: row.name,
    description: row.description,
    category: row.category,
    steps: JSON.parse(row.steps) as WorkflowStepTemplate[],
    payment_split_default: JSON.parse(row.payment_split_default),
    status: row.status as WorkflowStatus,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

function rowToWorkflowRun(row: WorkflowRunRow): WorkflowRun {
  return {
    id: row.id,
    template_id: row.template_id,
    buyer_address: row.buyer_address,
    payment_id: row.payment_id,
    status: row.status as WorkflowRunStatus,
    step_runs: JSON.parse(row.step_runs) as WorkflowStepRun[],
    final_proof_id: row.final_proof_id,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

function rowToProof(row: ProofRow): Proof {
  return {
    id: row.id,
    task_id: row.task_id,
    parent_proof_id: row.parent_proof_id,
    workflow_run_id: row.workflow_run_id,
    workflow_step_run_id: row.workflow_step_run_id,
    agent_id: row.agent_id,
    verifier_id: row.verifier_id,
    input_hash: row.input_hash,
    output_hash: row.output_hash,
    wasm_hash: row.wasm_hash,
    attestation_hash: row.attestation_hash,
    casper_anchor_hash: row.casper_anchor_hash,
    mode: row.mode as ProofMode,
    status: row.status as ProofStatus,
    created_at: row.created_at,
  };
}

/**
 * Compute a deterministic hash from data (SHA-256).
 */
function computeHash(...parts: string[]): string {
  return createHash("sha256").update(parts.join(":")).digest("hex");
}

// ── H1: Workflow template CRUD ────────────

/**
 * Create a workflow template.
 * Validates that all referenced agents exist.
 *
 * Phase H1: POST /api/workflows
 */
export function createWorkflow(params: {
  ownerAddress: string;
  name: string;
  description?: string;
  category?: string;
  steps: WorkflowStepTemplate[];
  paymentSplitDefault?: Array<{
    agent_id?: string | null;
    verifier_id?: string | null;
    address: string;
    share_bps: number;
    role: string;
    proof_required?: boolean;
  }>;
  status?: WorkflowStatus;
}): WorkflowTemplate {
  const db = getDb();

  // Validate: at least one step
  if (!params.steps || params.steps.length === 0) {
    throw new Error("INVALID_STEPS: A workflow template must have at least one step");
  }

  // Validate: each step has a referenced agent that exists
  for (const step of params.steps) {
    const agent = getAgent(step.agent_id);
    if (!agent) {
      throw new Error(
        `AGENT_NOT_FOUND: Agent '${step.agent_id}' referenced in step '${step.name}' does not exist`
      );
    }
  }

  // Validate: step orders are unique and sequential
  const orders = params.steps.map((s) => s.order);
  const uniqueOrders = new Set(orders);
  if (uniqueOrders.size !== orders.length) {
    throw new Error("INVALID_STEPS: Step orders must be unique");
  }

  // Validate status
  if (params.status && !["active", "draft"].includes(params.status)) {
    throw new Error(`INVALID_STATUS: '${params.status}' is not a valid workflow status`);
  }

  const id = randomUUID();
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO workflow_templates (id, owner_address, name, description, category,
      steps, payment_split_default, status, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    params.ownerAddress,
    params.name,
    params.description ?? "",
    params.category ?? "invoice",
    JSON.stringify(params.steps),
    JSON.stringify(params.paymentSplitDefault ?? []),
    params.status ?? "active",
    now,
    now,
  );

  return getWorkflow(id)!;
}

/**
 * Get a workflow template by ID.
 * Returns null if not found.
 *
 * Phase H1: GET /api/workflows/:workflowId
 */
export function getWorkflow(id: string): WorkflowTemplate | null {
  const db = getDb();
  const row = db
    .prepare("SELECT * FROM workflow_templates WHERE id = ?")
    .get(id) as WorkflowTemplateRow | undefined;
  if (!row) return null;
  return rowToWorkflowTemplate(row);
}

/**
 * List workflow templates with optional filters.
 *
 * Phase H1: GET /api/workflows
 */
export function listWorkflows(filters?: {
  category?: string;
  status?: WorkflowStatus | "all";
  ownerAddress?: string;
  limit?: number;
}): WorkflowTemplate[] {
  const db = getDb();
  const conditions: string[] = [];
  const params: unknown[] = [];

  if (filters?.category) {
    conditions.push("category = ?");
    params.push(filters.category);
  }
  if (filters?.status && filters.status !== "all") {
    conditions.push("status = ?");
    params.push(filters.status);
  }
  if (filters?.ownerAddress) {
    conditions.push("owner_address = ?");
    params.push(filters.ownerAddress);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
  const limit = filters?.limit ?? 100;

  const rows = db
    .prepare(
      `SELECT * FROM workflow_templates ${where} ORDER BY created_at DESC LIMIT ?`
    )
    .all(...params, limit) as WorkflowTemplateRow[];

  return rows.map(rowToWorkflowTemplate);
}

// ── H2: Workflow run engine ───────────────

/**
 * Create a workflow run from a template.
 * Copies all step templates into run step_runs.
 * All steps start in "waiting" status.
 * The run itself starts in "created" status.
 *
 * Phase H2: POST /api/workflows/:workflowId/run
 */
export function createWorkflowRun(
  workflowId: string,
  buyerAddress: string
): WorkflowRun {
  const db = getDb();

  const template = getWorkflow(workflowId);
  if (!template) {
    throw new Error("WORKFLOW_NOT_FOUND");
  }

  if (template.status !== "active") {
    throw new Error(
      `WORKFLOW_NOT_ACTIVE: Cannot create a run from a '${template.status}' workflow template`
    );
  }

  const id = randomUUID();
  const now = new Date().toISOString();

  // Convert template steps to step runs (all start as "waiting")
  const stepRuns: WorkflowStepRun[] = template.steps.map((step) => ({
    id: randomUUID(),
    workflow_run_id: id,
    step_template_id: step.id,
    agent_id: step.agent_id,
    verifier_id: step.verifier_id,
    proof_id: null,
    status: "waiting" as WorkflowStepRunStatus,
    output: null,
  }));

  db.prepare(`
    INSERT INTO workflow_runs (id, template_id, buyer_address, status,
      step_runs, created_at, updated_at)
    VALUES (?, ?, ?, 'created', ?, ?, ?)
  `).run(id, workflowId, buyerAddress, JSON.stringify(stepRuns), now, now);

  return getWorkflowRun(id)!;
}

/**
 * Get a workflow run by ID with its step runs resolved.
 * Returns null if not found.
 *
 * Phase H2: GET /api/workflow-runs/:runId
 */
export function getWorkflowRun(id: string): WorkflowRun | null {
  const db = getDb();
  const row = db
    .prepare("SELECT * FROM workflow_runs WHERE id = ?")
    .get(id) as WorkflowRunRow | undefined;
  if (!row) return null;
  return rowToWorkflowRun(row);
}

/**
 * Get a full workflow run with template details, step run details,
 * and all proof records linked to this run.
 */
export function getWorkflowRunDetail(id: string): {
  run: WorkflowRun | null;
  template: WorkflowTemplate | null;
  proofs: Proof[];
} {
  const run = getWorkflowRun(id);
  if (!run) {
    return { run: null, template: null, proofs: [] };
  }

  const template = getWorkflow(run.template_id);

  // Fetch all proofs linked to this workflow run or its step runs
  const db = getDb();
  const stepRunIds = run.step_runs.map((sr) => sr.id);

  const proofRows: ProofRow[] = [];

  // Proofs directly on the workflow run
  const runProofs = db
    .prepare("SELECT * FROM proofs WHERE workflow_run_id = ?")
    .all(id) as ProofRow[];
  proofRows.push(...runProofs);

  // Proofs on step runs
  for (const stepRunId of stepRunIds) {
    const stepProofs = db
      .prepare("SELECT * FROM proofs WHERE workflow_step_run_id = ?")
      .all(stepRunId) as ProofRow[];
    proofRows.push(...stepProofs);
  }

  return {
    run,
    template,
    proofs: proofRows.map(rowToProof),
  };
}

// ── Step execution with order enforcement ─

/**
 * Execute one ordered workflow step.
 *
 * Order enforcement:
 * 1. The step must exist in the run's step_runs.
 * 2. All previous steps must be "verified" before this one can run.
 * 3. All previous REQUIRED steps must be "verified".
 * 4. The step itself must be in "waiting" state to execute.
 *
 * On execution:
 * - Creates a proof record for the step
 * - Updates the step run status to "verified"
 * - Transitions the run to "running" if it was "created"
 *
 * Phase H2: POST /api/workflow-runs/:runId/steps/:stepId/run
 */
export function executeWorkflowStep(
  runId: string,
  stepRunId: string,
  agentId: string
): {
  run: WorkflowRun;
  stepRun: WorkflowStepRun;
  proof: Proof;
} {
  const db = getDb();
  const now = new Date().toISOString();

  const run = getWorkflowRun(runId);
  if (!run) {
    throw new Error("WORKFLOW_RUN_NOT_FOUND");
  }

  // Validate run status: must be "created" or "running"
  if (run.status !== "created" && run.status !== "running") {
    throw new Error(
      `INVALID_RUN_STATE: Cannot execute steps on a run with status '${run.status}'. Run must be 'created' or 'running'.`
    );
  }

  // Find the step run
  const stepRunIndex = run.step_runs.findIndex((sr) => sr.id === stepRunId);
  if (stepRunIndex === -1) {
    throw new Error(
      `STEP_NOT_FOUND: Step run '${stepRunId}' not found in workflow run '${runId}'`
    );
  }

  const stepRun = run.step_runs[stepRunIndex];

  // Validate step status: must be "waiting"
  if (stepRun.status !== "waiting") {
    throw new Error(
      `STEP_ALREADY_EXECUTED: Step run '${stepRunId}' has status '${stepRun.status}'. Only 'waiting' steps can be executed.`
    );
  }

  // Validate agent ownership: the agent executing must match the step's agent
  if (stepRun.agent_id !== agentId) {
    throw new Error(
      `AGENT_MISMATCH: Step expects agent '${stepRun.agent_id}' but executing agent is '${agentId}'`
    );
  }

  // Order enforcement: check that all previous required steps are verified
  const previousStepRuns = run.step_runs.slice(0, stepRunIndex);
  for (const prevSr of previousStepRuns) {
    if (prevSr.status !== "verified") {
      throw new Error(
        `STEP_ORDER_VIOLATION: Previous step '${prevSr.id}' is not verified (status: '${prevSr.status}'). Steps must execute in order.`
      );
    }
  }

  // Create a proof for this step execution
  const proofId = randomUUID();
  const inputHash = computeHash(
    runId,
    stepRunId,
    stepRun.agent_id,
    stepRun.verifier_id,
    now
  );
  const outputHash = computeHash("output", proofId, stepRun.agent_id, now);
  const attestationHash = computeHash("attest", proofId, stepRun.verifier_id, now);
  const wasmHash = computeHash("wasm", stepRun.verifier_id);

  db.prepare(`
    INSERT INTO proofs (id, workflow_run_id, workflow_step_run_id,
      agent_id, verifier_id, input_hash, output_hash, wasm_hash,
      attestation_hash, mode, status, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'verified', ?)
  `).run(
    proofId,
    runId,
    stepRunId,
    stepRun.agent_id,
    stepRun.verifier_id,
    inputHash,
    outputHash,
    wasmHash,
    attestationHash,
    config.teeVerificationMode,
    now,
  );

  // Update step run in-memory and persist
  const updatedStepRun: WorkflowStepRun = {
    ...stepRun,
    proof_id: proofId,
    status: "verified",
    output: {
      input_hash: inputHash,
      output_hash: outputHash,
      attestation_hash: attestationHash,
      wasm_hash: wasmHash,
      verified_at: now,
    },
  };

  run.step_runs[stepRunIndex] = updatedStepRun;

  // Transition run to "running" if currently "created"
  let newRunStatus: WorkflowRunStatus = run.status;
  if (run.status === "created") {
    newRunStatus = "running";
  }

  // Check if all steps are verified - if so, auto-transition
  const allStepsVerified = run.step_runs.every(
    (sr) => sr.status === "verified"
  );
  const allRequiredStepsVerified = run.step_runs.every((sr) => {
    // All step runs in our implementation are treated as required for simplicity
    // In a full implementation we'd check the template's step.required flag
    return sr.status === "verified";
  });

  if (allStepsVerified && allRequiredStepsVerified) {
    newRunStatus = "proofs_verified";
  }

  // Persist updates
  db.prepare(
    `UPDATE workflow_runs SET step_runs = ?, status = ?, updated_at = ? WHERE id = ?`
  ).run(JSON.stringify(run.step_runs), newRunStatus, now, runId);

  // Refresh the run
  const updatedRun = getWorkflowRun(runId)!;

  // Read the proof
  const proofRow = db
    .prepare("SELECT * FROM proofs WHERE id = ?")
    .get(proofId) as ProofRow;

  return {
    run: updatedRun,
    stepRun: updatedRun.step_runs[stepRunIndex],
    proof: rowToProof(proofRow),
  };
}

// ── H3: Finalize and bundle proofs ────────

/**
 * Finalize a workflow run: bundle all step proofs into a final proof.
 *
 * Requirements:
 * 1. All steps must be verified.
 * 2. A final bundled proof is created with the step proof IDs.
 * 3. The run status is updated to "proofs_verified".
 *
 * Phase H3: POST /api/workflow-runs/:runId/finalize
 */
export function finalizeWorkflowRun(runId: string): {
  run: WorkflowRun;
  finalProof: Proof;
  stepProofs: Proof[];
} {
  const db = getDb();
  const now = new Date().toISOString();

  const run = getWorkflowRun(runId);
  if (!run) {
    throw new Error("WORKFLOW_RUN_NOT_FOUND");
  }

  // Must be in "running" or "proofs_verified" state
  if (run.status !== "running" && run.status !== "proofs_verified") {
    throw new Error(
      `INVALID_RUN_STATE: Cannot finalize a run with status '${run.status}'. Run must be 'running' or 'proofs_verified'.`
    );
  }

  // All steps must be verified
  const notVerified = run.step_runs.filter((sr) => sr.status !== "verified");
  if (notVerified.length > 0) {
    throw new Error(
      `STEPS_NOT_VERIFIED: ${notVerified.length} step(s) are not yet verified. All steps must be 'verified' before finalizing.`
    );
  }

  // Collect all step proof IDs from the DB
  const stepProofs: ProofRow[] = [];
  for (const sr of run.step_runs) {
    if (sr.proof_id) {
      const proofRow = db
        .prepare("SELECT * FROM proofs WHERE id = ?")
        .get(sr.proof_id) as ProofRow | undefined;
      if (proofRow) {
        stepProofs.push(proofRow);
      }
    }
  }

  if (stepProofs.length === 0) {
    throw new Error(
      "NO_STEP_PROOFS: No proof records found for the workflow steps. Execute at least one step before finalizing."
    );
  }

  // Create final bundle proof
  const finalProofId = randomUUID();

  // Build the bundle: hash of all step proof IDs + their attestation hashes
  const bundlePayload = stepProofs
    .map((p) => `${p.id}:${p.attestation_hash}:${p.output_hash}`)
    .join("|");

  const inputHash = computeHash("bundle-input", runId, bundlePayload);
  const outputHash = computeHash("bundle-output", runId, bundlePayload, now);
  const wasmHash = computeHash("wasm-bundle", "workflow-finalize");
  const attestationHash = computeHash(
    "attest-bundle",
    finalProofId,
    bundlePayload,
    now
  );

  db.prepare(`
    INSERT INTO proofs (id, parent_proof_id, workflow_run_id,
      agent_id, verifier_id, input_hash, output_hash, wasm_hash,
      attestation_hash, mode, status, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'verified', ?)
  `).run(
    finalProofId,
    null, // parent_proof_id: this is the root bundle
    runId,
    "workflow-finalizer", // agent_id for the final bundle
    "verifier-bundle-default",
    inputHash,
    outputHash,
    wasmHash,
    attestationHash,
    config.teeVerificationMode,
    now,
  );

  // Update run: set final_proof_id and status
  db.prepare(
    `UPDATE workflow_runs SET final_proof_id = ?, status = 'proofs_verified', updated_at = ? WHERE id = ?`
  ).run(finalProofId, now, runId);

  // Refresh
  const updatedRun = getWorkflowRun(runId)!;
  const finalProofRow = db
    .prepare("SELECT * FROM proofs WHERE id = ?")
    .get(finalProofId) as ProofRow;

  return {
    run: updatedRun,
    finalProof: rowToProof(finalProofRow),
    stepProofs: stepProofs.map(rowToProof),
  };
}

// ── Workflow run state transitions ────────

/**
 * Transition a workflow run to a new status with state machine enforcement.
 */
export function transitionWorkflowRun(
  runId: string,
  to: WorkflowRunStatus
): WorkflowRun {
  const db = getDb();
  const now = new Date().toISOString();

  const run = getWorkflowRun(runId);
  if (!run) {
    throw new Error("WORKFLOW_RUN_NOT_FOUND");
  }

  if (!isValidWorkflowRunTransition(run.status, to)) {
    throw new Error(
      `INVALID_TRANSITION: Cannot transition workflow run from '${run.status}' to '${to}'`
    );
  }

  db.prepare(
    `UPDATE workflow_runs SET status = ?, updated_at = ? WHERE id = ?`
  ).run(to, now, runId);

  return getWorkflowRun(runId)!;
}

// ── Health ────────────────────────────────

export function getWorkflowServiceHealth() {
  const db = getDb();
  const templateCount = (
    db
      .prepare("SELECT COUNT(*) as cnt FROM workflow_templates")
      .get() as { cnt: number }
  ).cnt;
  const runCount = (
    db.prepare("SELECT COUNT(*) as cnt FROM workflow_runs").get() as {
      cnt: number;
    }
  ).cnt;

  return {
    healthy: true,
    templateCount,
    runCount,
  };
}
