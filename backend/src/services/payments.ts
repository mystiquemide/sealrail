// ────────────────────────────────────────
// Sealrail Payment Service
// Payment intent, split, unlock, claim + state machine
// Phase E2/E3
// ────────────────────────────────────────

import { randomUUID, createHash } from "crypto";
import { getDb } from "../db.js";
import type {
  Payment,
  PaymentRecipient,
  PaymentStatus,
  RecipientStatus,
} from "../types.js";

// ── Row types ────────────────────────────

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

// ── State machine: valid payment transitions ─

const PAYMENT_TRANSITIONS: Record<string, string[]> = {
  intent_created: ["locked", "blocked"],
  locked: ["unlockable", "blocked"],
  unlockable: ["paid", "blocked"],
  paid: ["blocked"],
  blocked: ["intent_created"],
};

const RECIPIENT_TRANSITIONS: Record<string, string[]> = {
  locked: ["unlockable", "blocked"],
  unlockable: ["paid", "blocked"],
  paid: ["blocked"],
  blocked: ["locked"],
};

/**
 * Check if a payment status transition is valid.
 */
export function isValidPaymentTransition(from: string, to: string): boolean {
  const allowed = PAYMENT_TRANSITIONS[from];
  if (!allowed) return false;
  return allowed.includes(to);
}

/**
 * Check if a recipient status transition is valid.
 */
export function isValidRecipientTransition(from: string, to: string): boolean {
  const allowed = RECIPIENT_TRANSITIONS[from];
  if (!allowed) return false;
  return allowed.includes(to);
}

// ── Helpers ──────────────────────────────

function rowToPayment(row: PaymentRow): Payment {
  return {
    id: row.id,
    task_id: row.task_id,
    workflow_run_id: row.workflow_run_id,
    buyer_address: row.buyer_address,
    total_amount: row.total_amount,
    currency: row.currency as "CSPR" | "USD",
    status: row.status as PaymentStatus,
    recipients: JSON.parse(row.recipients) as PaymentRecipient[],
    split_hash: row.split_hash,
    unlock_rule: row.unlock_rule as "proof_verified" | "workflow_verified",
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

function rowToRecipient(row: RecipientRow): PaymentRecipient {
  return {
    id: row.id,
    payment_id: row.payment_id,
    agent_id: row.agent_id,
    verifier_id: row.verifier_id,
    address: row.address,
    share_bps: row.share_bps,
    role: row.role as PaymentRecipient["role"],
    proof_required: row.proof_required === 1,
    proof_id: row.proof_id,
    status: row.status as RecipientStatus,
    created_at: row.created_at,
  };
}

// ── Payment CRUD ─────────────────────────

/**
 * Get a payment by ID.
 */
export function getPayment(id: string): Payment | null {
  const db = getDb();
  const row = db.prepare("SELECT * FROM payments WHERE id = ?").get(id) as PaymentRow | undefined;
  if (!row) return null;
  return rowToPayment(row);
}

/**
 * Get a payment with all its recipients resolved from the recipients table.
 */
export function getPaymentWithRecipients(id: string): Payment | null {
  const db = getDb();
  const row = db.prepare("SELECT * FROM payments WHERE id = ?").get(id) as PaymentRow | undefined;
  if (!row) return null;

  const payment = rowToPayment(row);

  // Fetch recipients from payment_recipients table
  const recipientRows = db
    .prepare("SELECT * FROM payment_recipients WHERE payment_id = ?")
    .all(id) as RecipientRow[];

  payment.recipients = recipientRows.map(rowToRecipient);

  return payment;
}

/**
 * List all payments, optionally filtered by status.
 */
export function listPayments(status?: PaymentStatus): Payment[] {
  const db = getDb();
  let rows: PaymentRow[];

  if (status) {
    rows = db
      .prepare("SELECT * FROM payments WHERE status = ? ORDER BY created_at DESC")
      .all(status) as PaymentRow[];
  } else {
    rows = db.prepare("SELECT * FROM payments ORDER BY created_at DESC").all() as PaymentRow[];
  }

  return rows.map(rowToPayment);
}

/**
 * Update a payment's status with state machine enforcement.
 */
export function updatePaymentStatus(id: string, status: PaymentStatus): Payment | null {
  const db = getDb();
  const now = new Date().toISOString();

  const current = getPayment(id);
  if (!current) return null;

  if (!isValidPaymentTransition(current.status, status)) {
    throw new Error(
      `INVALID_TRANSITION: Cannot transition payment from '${current.status}' to '${status}'`
    );
  }

  db.prepare("UPDATE payments SET status = ?, updated_at = ? WHERE id = ?").run(status, now, id);

  return getPayment(id);
}

// ── Payment Intent (E2) ──────────────────

/**
 * Create a payment intent.
 * Phase E: POST /api/payments/intents
 */
export function createPaymentIntent(params: {
  buyerAddress: string;
  totalAmount: number;
  currency: string;
  unlockRule?: string;
  taskId?: string;
}): Payment {
  const db = getDb();
  const id = randomUUID();
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO payments (id, task_id, buyer_address, total_amount, currency, status, recipients, unlock_rule, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, 'intent_created', '[]', ?, ?, ?)
  `).run(
    id,
    params.taskId ?? null,
    params.buyerAddress,
    params.totalAmount,
    params.currency,
    params.unlockRule ?? "proof_verified",
    now,
    now,
  );

  return getPayment(id)!;
}

// ── Payment Splits (E2) ──────────────────

/**
 * Calculate and store payment splits for a payment.
 * Distributes the total amount among recipients based on share_bps.
 * Phase E: POST /api/payments/:paymentId/splits
 */
export function calculatePaymentSplits(
  paymentId: string,
  recipients: {
    address: string;
    share_bps: number;
    role: string;
    agent_id?: string;
    verifier_id?: string;
    proof_required?: boolean;
  }[]
): { payment: Payment; splitHash: string } {
  const db = getDb();
  const now = new Date().toISOString();

  const payment = getPayment(paymentId);
  if (!payment) {
    throw new Error("PAYMENT_NOT_FOUND");
  }

  // Validate payment state — allow recalculation on locked payments too
  if (payment.status !== "intent_created" && payment.status !== "locked") {
    throw new Error(
      `INVALID_STATE: Splits can only be calculated for payments in 'intent_created' state. Current: '${payment.status}'`
    );
  }

  // Validate share_bps sum (total should be 10000 basis points = 100%)
  const totalBps = recipients.reduce((sum, r) => sum + r.share_bps, 0);
  if (totalBps !== 10000) {
    throw new Error(
      `INVALID_SPLITS: Total share_bps must equal 10000 (100%). Got: ${totalBps}`
    );
  }

  // Delete existing recipients for this payment (recalculate)
  db.prepare("DELETE FROM payment_recipients WHERE payment_id = ?").run(paymentId);

  // Insert recipients
  const createdRecipients: PaymentRecipient[] = [];
  for (const r of recipients) {
    const recipientId = randomUUID();
    db.prepare(`
      INSERT INTO payment_recipients (id, payment_id, agent_id, verifier_id, address, share_bps, role, proof_required, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'locked', ?)
    `).run(
      recipientId,
      paymentId,
      r.agent_id ?? null,
      r.verifier_id ?? null,
      r.address,
      r.share_bps,
      r.role,
      r.proof_required !== false ? 1 : 0,
      now,
    );

    createdRecipients.push({
      id: recipientId,
      payment_id: paymentId,
      agent_id: r.agent_id ?? null,
      verifier_id: r.verifier_id ?? null,
      address: r.address,
      share_bps: r.share_bps,
      role: r.role as PaymentRecipient["role"],
      proof_required: r.proof_required !== false,
      proof_id: null,
      status: "locked",
      created_at: now,
    });
  }

  // Compute a deterministic split hash
  const splitData = JSON.stringify(createdRecipients.map((r) => ({
    address: r.address,
    share_bps: r.share_bps,
    role: r.role,
  })));
  const splitHash = createHash("sha256").update(splitData).digest("hex");

  // Store split hash and transition to locked
  db.prepare("UPDATE payments SET recipients = ?, split_hash = ?, status = 'locked', updated_at = ? WHERE id = ?").run(
    JSON.stringify(createdRecipients),
    splitHash,
    now,
    paymentId,
  );

  const updated = getPayment(paymentId)!;
  return { payment: updated, splitHash };
}

// ── Payment Unlock (E2) ──────────────────

/**
 * Unlock a payment after proof verification.
 * Transitions payment from locked → unlockable.
 * Phase E: POST /api/payments/:paymentId/unlock
 */
export function unlockPayment(paymentId: string): {
  payment: Payment;
  message: string;
} {
  const payment = getPayment(paymentId);
  if (!payment) {
    throw new Error("PAYMENT_NOT_FOUND");
  }

  // Verify recipients exist FIRST (better error message than state check)
  const recipientRow = getDb()
    .prepare("SELECT recipients FROM payments WHERE id = ?")
    .get(paymentId) as { recipients: string } | undefined;
  const recipients = recipientRow?.recipients ?? "[]";
  const recipientList = JSON.parse(recipients) as PaymentRecipient[];

  if (recipientList.length === 0) {
    throw new Error("NO_RECIPIENTS: Payment has no recipients. Calculate splits first.");
  }

  // Payment must be in 'locked' state to unlock
  if (payment.status !== "locked") {
    throw new Error(
      `INVALID_STATE: Payment must be 'locked' to unlock. Current: '${payment.status}'`
    );
  }

  // Transition payment to unlockable
  const db = getDb();
  const now = new Date().toISOString();
  db.prepare("UPDATE payments SET status = 'unlockable', updated_at = ? WHERE id = ?").run(now, paymentId);

  // Transition all locked recipients to unlockable
  db.prepare(`
    UPDATE payment_recipients SET status = 'unlockable' WHERE payment_id = ? AND status = 'locked'
  `).run(paymentId);

  // Also update the JSON recipients field in payments table
  const updatedRecipientRows = db
    .prepare("SELECT * FROM payment_recipients WHERE payment_id = ?")
    .all(paymentId) as RecipientRow[];
  const updatedRecipients = updatedRecipientRows.map(rowToRecipient);
  db.prepare("UPDATE payments SET recipients = ? WHERE id = ?").run(
    JSON.stringify(updatedRecipients),
    paymentId,
  );

  const updated = getPayment(paymentId)!;
  return {
    payment: updated,
    message: "Payment unlocked. Recipients can now claim their shares.",
  };
}

// ── Recipient Claim (E2) ─────────────────

/**
 * Claim a recipient's share.
 * Only allowed when the payment is unlockable and the recipient is unlockable.
 * Phase E: POST /api/payments/:paymentId/claim
 */
export function claimRecipientShare(
  paymentId: string,
  recipientId: string
): { recipient: PaymentRecipient; message: string } {
  const db = getDb();
  const now = new Date().toISOString();

  // Get payment
  const payment = getPayment(paymentId);
  if (!payment) {
    throw new Error("PAYMENT_NOT_FOUND");
  }

  // Payment must be unlockable
  if (payment.status !== "unlockable") {
    throw new Error(
      `INVALID_STATE: Payment must be 'unlockable' to claim. Current: '${payment.status}'`
    );
  }

  // Get recipient
  const recipientRow = db
    .prepare("SELECT * FROM payment_recipients WHERE id = ? AND payment_id = ?")
    .get(recipientId, paymentId) as RecipientRow | undefined;

  if (!recipientRow) {
    throw new Error("RECIPIENT_NOT_FOUND");
  }

  // Recipient must be unlockable
  if (recipientRow.status !== "unlockable") {
    throw new Error(
      `INVALID_STATE: Recipient must be 'unlockable' to claim. Current: '${recipientRow.status}'`
    );
  }

  // Mark recipient as paid
  db.prepare("UPDATE payment_recipients SET status = 'paid' WHERE id = ?").run(recipientId);

  // Check if all recipients are paid
  const allRecipients = db
    .prepare("SELECT * FROM payment_recipients WHERE payment_id = ?")
    .all(paymentId) as RecipientRow[];

  const allPaid = allRecipients.every((r) => r.status === "paid" || r.id === recipientId);
  // Actually check after update
  const updatedRecipients = db
    .prepare("SELECT * FROM payment_recipients WHERE payment_id = ?")
    .all(paymentId) as RecipientRow[];

  if (updatedRecipients.every((r) => r.status === "paid")) {
    db.prepare("UPDATE payments SET status = 'paid', updated_at = ? WHERE id = ?").run(now, paymentId);
  }

  const updatedRecipient = rowToRecipient(
    db.prepare("SELECT * FROM payment_recipients WHERE id = ?").get(recipientId) as RecipientRow
  );

  return {
    recipient: updatedRecipient,
    message: `Recipient share claimed: ${updatedRecipient.share_bps / 100}% of payment ${paymentId}`,
  };
}

// ── Health ───────────────────────────────

export function getPaymentServiceHealth() {
  const db = getDb();
  const paymentCount = (db.prepare("SELECT COUNT(*) as cnt FROM payments").get() as { cnt: number }).cnt;
  const recipientCount = (db.prepare("SELECT COUNT(*) as cnt FROM payment_recipients").get() as { cnt: number }).cnt;

  return {
    healthy: true,
    paymentCount,
    recipientCount,
  };
}
