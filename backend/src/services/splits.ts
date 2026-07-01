// ────────────────────────────────────────
// Sealrail Split Service — Phase I
// I1: Split calculator (share basis points) with role/address validation
// I2: Split proof dependency resolution using proof/task/workflow state
// I3: Split unlock per-recipient state with partial-unlock support
// ────────────────────────────────────────

import { getDb } from "../db.js";
import type { PaymentRecipient, RecipientRole } from "../types.js";

// ── Valid roles (matching CHECK constraint in schema) ─

const VALID_ROLES: RecipientRole[] = [
  "primary_agent",
  "workflow_step",
  "verifier",
  "platform",
];

// ── Valid proof statuses that satisfy a dependency ─

const SATISFIED_PROOF_STATUSES = ["verified", "anchored"];

// ── Row types ────────────────────────────

interface RecipientRow {
  id: string;
  payment_id: string;
  agent_id: string | null;
  verifier_id: string | null;
  address: string;
  share_bps: number;
  role: string;
  proof_required: number;
  proof_id: string | null;
  status: string;
  created_at: string;
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

interface PaymentRow {
  id: string;
  task_id: string | null;
  workflow_run_id: string | null;
  buyer_address: string;
  total_amount: number;
  currency: string;
  status: string;
  recipients: string;
  split_hash: string | null;
  unlock_rule: string;
  created_at: string;
  updated_at: string;
}

// ──────────────────────────────────────────
// I1: Recipient Validation
// ──────────────────────────────────────────

export interface RecipientInput {
  address: string;
  share_bps: number;
  role: string;
  agent_id?: string;
  verifier_id?: string;
  proof_required?: boolean;
}

export interface ValidationError {
  index: number;
  field: string;
  message: string;
}

/**
 * Validate a list of recipient inputs.
 * Returns an array of validation errors (empty = all valid).
 */
export function validateRecipients(
  recipients: RecipientInput[]
): ValidationError[] {
  const errors: ValidationError[] = [];

  for (let i = 0; i < recipients.length; i++) {
    const r = recipients[i];

    // Address must be a non-empty string
    if (!r.address || typeof r.address !== "string" || r.address.trim().length === 0) {
      errors.push({
        index: i,
        field: "address",
        message: `Recipient[${i}]: address must be a non-empty string`,
      });
    }

    // Role must be one of the valid roles
    if (!VALID_ROLES.includes(r.role as RecipientRole)) {
      errors.push({
        index: i,
        field: "role",
        message: `Recipient[${i}]: role must be one of: ${VALID_ROLES.join(", ")}. Got: '${r.role}'`,
      });
    }

    // share_bps must be a positive integer
    if (!Number.isInteger(r.share_bps) || r.share_bps < 1 || r.share_bps > 10000) {
      errors.push({
        index: i,
        field: "share_bps",
        message: `Recipient[${i}]: share_bps must be an integer between 1 and 10000. Got: ${r.share_bps}`,
      });
    }
  }

  // Total share_bps must equal 10000
  if (errors.length === 0) {
    const totalBps = recipients.reduce((sum, r) => sum + r.share_bps, 0);
    if (totalBps !== 10000) {
      errors.push({
        index: -1,
        field: "total_bps",
        message: `Total share_bps must equal 10000 (100%). Got: ${totalBps}`,
      });
    }
  }

  return errors;
}

/**
 * Validate recipients and throw on first error.
 */
export function validateRecipientsOrThrow(recipients: RecipientInput[]): void {
  const errors = validateRecipients(recipients);
  if (errors.length > 0) {
    throw new Error(`INVALID_RECIPIENTS: ${errors[0].message}`);
  }
}

// ──────────────────────────────────────────
// I2: Proof Dependency Resolution
// ──────────────────────────────────────────

/**
 * Resolve whether a recipient's proof dependency is satisfied.
 *
 * A recipient requires proof if proof_required is true.
 * Dependency is satisfied when there exists a proof record in the proofs table that:
 *   - Has status "verified" or "anchored"
 *   - Matches the payment's task_id or workflow_run_id
 *   - Matches the recipient's agent_id or verifier_id (at least one)
 *
 * Returns a result object with satisfied flag and the matching proof IDs.
 */
export function resolveRecipientProofDependency(
  paymentId: string,
  recipientId: string
): { satisfied: boolean; proofIds: string[]; message: string } {
  const db = getDb();

  // Get the payment
  const paymentRow = db
    .prepare("SELECT * FROM payments WHERE id = ?")
    .get(paymentId) as PaymentRow | undefined;
  if (!paymentRow) {
    throw new Error("PAYMENT_NOT_FOUND");
  }

  // Get the recipient
  const recipientRow = db
    .prepare("SELECT * FROM payment_recipients WHERE id = ? AND payment_id = ?")
    .get(recipientId, paymentId) as RecipientRow | undefined;
  if (!recipientRow) {
    throw new Error("RECIPIENT_NOT_FOUND");
  }

  // If proof is not required, dependency is always satisfied
  if (recipientRow.proof_required === 0) {
    return {
      satisfied: true,
      proofIds: [],
      message: "No proof required for this recipient",
    };
  }

  // Build proof query conditions
  const conditions: string[] = [];
  const params: (string | null)[] = [];

  // Proof must be in verified or anchored status
  const statusPlaceholders = SATISFIED_PROOF_STATUSES.map(() => "?").join(", ");
  conditions.push(`status IN (${statusPlaceholders})`);
  params.push(...SATISFIED_PROOF_STATUSES);

  // Match by task_id or workflow_run_id
  const taskOrWorkflowConditions: string[] = [];
  if (paymentRow.task_id) {
    taskOrWorkflowConditions.push("task_id = ?");
    params.push(paymentRow.task_id);
  }
  if (paymentRow.workflow_run_id) {
    taskOrWorkflowConditions.push("workflow_run_id = ?");
    params.push(paymentRow.workflow_run_id);
  }
  if (taskOrWorkflowConditions.length > 0) {
    conditions.push(`(${taskOrWorkflowConditions.join(" OR ")})`);
  }

  // Match by agent_id or verifier_id of the recipient
  const recipientConditions: string[] = [];
  if (recipientRow.agent_id) {
    recipientConditions.push("agent_id = ?");
    params.push(recipientRow.agent_id);
  }
  if (recipientRow.verifier_id) {
    recipientConditions.push("verifier_id = ?");
    params.push(recipientRow.verifier_id);
  }
  if (recipientConditions.length > 0) {
    conditions.push(`(${recipientConditions.join(" OR ")})`);
  } else {
    // Recipient has neither agent_id nor verifier_id — can't match any proof
    return {
      satisfied: false,
      proofIds: [],
      message:
        "Recipient has no agent_id or verifier_id to match against proofs",
    };
  }

  const whereClause = conditions.join(" AND ");
  const query = `SELECT id FROM proofs WHERE ${whereClause}`;

  const matchingProofs = db.prepare(query).all(...params) as { id: string }[];
  const proofIds = matchingProofs.map((p) => p.id);

  if (proofIds.length === 0) {
    return {
      satisfied: false,
      proofIds: [],
      message: `No verified/anchored proofs found matching recipient's agent/verifier and payment's task/workflow`,
    };
  }

  return {
    satisfied: true,
    proofIds,
    message: `Proof dependency satisfied: ${proofIds.length} matching proof(s)`,
  };
}

/**
 * Resolve proof dependencies for ALL recipients of a payment.
 * Returns a map of recipient ID → dependency resolution result.
 */
export function resolveAllRecipientProofDependencies(
  paymentId: string
): Map<string, { satisfied: boolean; proofIds: string[]; message: string }> {
  const db = getDb();

  const paymentRow = db
    .prepare("SELECT * FROM payments WHERE id = ?")
    .get(paymentId) as PaymentRow | undefined;
  if (!paymentRow) {
    throw new Error("PAYMENT_NOT_FOUND");
  }

  const recipients = db
    .prepare("SELECT * FROM payment_recipients WHERE payment_id = ?")
    .all(paymentId) as RecipientRow[];

  const results = new Map<
    string,
    { satisfied: boolean; proofIds: string[]; message: string }
  >();

  for (const recipient of recipients) {
    try {
      const result = resolveRecipientProofDependency(paymentId, recipient.id);
      results.set(recipient.id, result);
    } catch {
      results.set(recipient.id, {
        satisfied: false,
        proofIds: [],
        message: "Error resolving dependency",
      });
    }
  }

  return results;
}

// ──────────────────────────────────────────
// I3: Per-Recipient Unlock State
// ──────────────────────────────────────────

/**
 * Unlock a single recipient IF its proof dependency is satisfied.
 * Only transitions from "locked" → "unlockable".
 *
 * Returns the unlock result with recipient status.
 */
export function unlockRecipientIfProofSatisfied(
  paymentId: string,
  recipientId: string
): {
  recipientId: string;
  unlocked: boolean;
  status: string;
  proofSatisfied: boolean;
  message: string;
} {
  const db = getDb();

  // Get the payment
  const paymentRow = db
    .prepare("SELECT * FROM payments WHERE id = ?")
    .get(paymentId) as PaymentRow | undefined;
  if (!paymentRow) {
    throw new Error("PAYMENT_NOT_FOUND");
  }

  // Get the recipient
  const recipientRow = db
    .prepare("SELECT * FROM payment_recipients WHERE id = ? AND payment_id = ?")
    .get(recipientId, paymentId) as RecipientRow | undefined;
  if (!recipientRow) {
    throw new Error("RECIPIENT_NOT_FOUND");
  }

  // Recipient must be in "locked" state to unlock
  if (recipientRow.status !== "locked") {
    return {
      recipientId,
      unlocked: false,
      status: recipientRow.status,
      proofSatisfied: false,
      message: `Recipient is not in 'locked' state (current: '${recipientRow.status}')`,
    };
  }

  // Resolve proof dependency
  const dependency = resolveRecipientProofDependency(paymentId, recipientId);

  if (!dependency.satisfied) {
    return {
      recipientId,
      unlocked: false,
      status: "locked",
      proofSatisfied: false,
      message: dependency.message,
    };
  }

  // Transition recipient to unlockable
  db.prepare("UPDATE payment_recipients SET status = 'unlockable' WHERE id = ?").run(
    recipientId
  );

  // Link the first matching proof to the recipient
  if (dependency.proofIds.length > 0) {
    db.prepare("UPDATE payment_recipients SET proof_id = ? WHERE id = ?").run(
      dependency.proofIds[0],
      recipientId
    );
  }

  return {
    recipientId,
    unlocked: true,
    status: "unlockable",
    proofSatisfied: true,
    message: "Recipient unlocked — proof dependency satisfied",
  };
}

/**
 * Unlock all recipients whose proof dependencies are satisfied.
 *
 * This is the core Phase I unlock logic: it checks each recipient's proof
 * dependency and only unlocks those whose proofs are verified/anchored.
 *
 * Partial unlock: if some recipients have satisfied proofs and others don't,
 * only the satisfied ones are unlocked. The payment remains in "locked" state
 * until all recipients are unlockable.
 *
 * Full unlock: if ALL recipients' proofs are satisfied, the payment is
 * transitioned to "unlockable".
 *
 * No unlock: if NO recipients' proofs are satisfied, throws an error.
 */
export function unlockAllSatisfiedRecipients(paymentId: string): {
  paymentId: string;
  paymentStatus: string;
  totalRecipients: number;
  unlockedCount: number;
  stillLockedCount: number;
  results: {
    recipientId: string;
    unlocked: boolean;
    proofSatisfied: boolean;
    message: string;
  }[];
  message: string;
} {
  const db = getDb();
  const now = new Date().toISOString();

  // Get the payment
  const paymentRow = db
    .prepare("SELECT * FROM payments WHERE id = ?")
    .get(paymentId) as PaymentRow | undefined;
  if (!paymentRow) {
    throw new Error("PAYMENT_NOT_FOUND");
  }

  // Payment must be in "locked" state (splits must have been calculated)
  if (paymentRow.status !== "locked") {
    throw new Error(
      `INVALID_STATE: Payment must be 'locked' to check proof dependencies for unlock. Current: '${paymentRow.status}'`
    );
  }

  // Get all recipients
  const recipients = db
    .prepare("SELECT * FROM payment_recipients WHERE payment_id = ?")
    .all(paymentId) as RecipientRow[];

  if (recipients.length === 0) {
    throw new Error("NO_RECIPIENTS: Payment has no recipients. Calculate splits first.");
  }

  // Per-recipient unlock attempts
  const results: {
    recipientId: string;
    unlocked: boolean;
    proofSatisfied: boolean;
    message: string;
  }[] = [];

  for (const recipient of recipients) {
    try {
      // Only attempt unlock for recipients in "locked" state
      if (recipient.status !== "locked") {
        results.push({
          recipientId: recipient.id,
          unlocked: false,
          proofSatisfied: false,
          message: `Already in '${recipient.status}' state — skipping`,
        });
        continue;
      }

      const result = unlockRecipientIfProofSatisfied(paymentId, recipient.id);
      results.push({
        recipientId: result.recipientId,
        unlocked: result.unlocked,
        proofSatisfied: result.proofSatisfied,
        message: result.message,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      results.push({
        recipientId: recipient.id,
        unlocked: false,
        proofSatisfied: false,
        message: `Error: ${msg}`,
      });
    }
  }

  const unlockedCount = results.filter((r) => r.unlocked).length;
  const stillLockedCount = results.filter((r) => !r.unlocked && r.proofSatisfied === false).length;

  // Check if all recipients are now unlockable
  const updatedRecipients = db
    .prepare("SELECT * FROM payment_recipients WHERE payment_id = ?")
    .all(paymentId) as RecipientRow[];
  const allUnlockable = updatedRecipients.every((r) => r.status === "unlockable");
  const noneUnlockable = updatedRecipients.every((r) => r.status !== "unlockable");

  if (allUnlockable) {
    // Full unlock: transition payment to unlockable
    db.prepare(
      "UPDATE payments SET status = 'unlockable', updated_at = ? WHERE id = ?"
    ).run(now, paymentId);

    // Also update the JSON recipients field in payments table
    db.prepare("UPDATE payments SET recipients = ? WHERE id = ?").run(
      JSON.stringify(updatedRecipients),
      paymentId
    );

    return {
      paymentId,
      paymentStatus: "unlockable",
      totalRecipients: recipients.length,
      unlockedCount,
      stillLockedCount: 0,
      results,
      message: `Full unlock: all ${recipients.length} recipient(s) unlocked. Payment is now claimable.`,
    };
  }

  if (noneUnlockable) {
    throw new Error(
      `NO_UNLOCKABLE_RECIPIENTS: No recipients have satisfied proof dependencies. Payment remains locked.`
    );
  }

  // Partial unlock: some recipients unlocked, payment stays locked
  // Update the JSON recipients field
  db.prepare("UPDATE payments SET recipients = ? WHERE id = ?").run(
    JSON.stringify(updatedRecipients),
    paymentId
  );

  return {
    paymentId,
    paymentStatus: "locked",
    totalRecipients: recipients.length,
    unlockedCount,
    stillLockedCount,
    results,
    message: `Partial unlock: ${unlockedCount}/${recipients.length} recipient(s) unlocked. ${stillLockedCount} still waiting for proof dependencies.`,
  };
}

/**
 * Get per-recipient proof dependency status for a payment.
 * Returns full detail about each recipient's proof dependency status.
 * Used by GET /api/payments/:paymentId to show split detail + recipient states.
 */
export function getRecipientProofStatuses(paymentId: string): {
  paymentId: string;
  paymentStatus: string;
  recipients: {
    id: string;
    address: string;
    share_bps: number;
    role: string;
    status: string;
    proof_required: boolean;
    proofSatisfied: boolean;
    proofIds: string[];
    agent_id: string | null;
    verifier_id: string | null;
    dependencyMessage: string;
  }[];
} {
  const db = getDb();

  const paymentRow = db
    .prepare("SELECT * FROM payments WHERE id = ?")
    .get(paymentId) as PaymentRow | undefined;
  if (!paymentRow) {
    throw new Error("PAYMENT_NOT_FOUND");
  }

  const recipients = db
    .prepare("SELECT * FROM payment_recipients WHERE payment_id = ?")
    .all(paymentId) as RecipientRow[];

  const recipientStatuses = recipients.map((r) => {
    let proofSatisfied = false;
    let proofIds: string[] = [];
    let dependencyMessage = "";

    try {
      const dep = resolveRecipientProofDependency(paymentId, r.id);
      proofSatisfied = dep.satisfied;
      proofIds = dep.proofIds;
      dependencyMessage = dep.message;
    } catch (err) {
      dependencyMessage =
        err instanceof Error ? err.message : "Error checking dependency";
    }

    return {
      id: r.id,
      address: r.address,
      share_bps: r.share_bps,
      role: r.role,
      status: r.status,
      proof_required: r.proof_required === 1,
      proofSatisfied,
      proofIds,
      agent_id: r.agent_id,
      verifier_id: r.verifier_id,
      dependencyMessage,
    };
  });

  return {
    paymentId,
    paymentStatus: paymentRow.status,
    recipients: recipientStatuses,
  };
}

// ── Health ───────────────────────────────

export function getSplitServiceHealth() {
  const db = getDb();
  const recipientCount = (
    db.prepare("SELECT COUNT(*) as cnt FROM payment_recipients").get() as {
      cnt: number;
    }
  ).cnt;
  const proofCount = (
    db.prepare("SELECT COUNT(*) as cnt FROM proofs").get() as { cnt: number }
  ).cnt;

  return {
    healthy: true,
    recipientCount,
    proofCount,
    validRoles: VALID_ROLES,
    satisfiedProofStatuses: SATISFIED_PROOF_STATUSES,
  };
}
