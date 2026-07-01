// ────────────────────────────────────────
// Sealrail Reputation Scoring Engine
// Phase J1: Score calculator from real proof/payment/task data
// Phase J2: On-event recalculation hooks
//
// Formula per plan §10.1:
//   score = 50
//     + min(25, verified_runs * 2)
//     + min(15, paid_tasks * 2)
//     - min(25, failed_runs * 5)
//     - min(15, blocked_tasks * 3)
//   Clamp final score to [0, 100].
// ────────────────────────────────────────

import { getDb } from "../db.js";
import { getAgent } from "./agents.js";
import type {
  AgentReputation,
} from "../types.js";

// ── Row types for DB queries ──────────────

interface AgentReputationRow {
  agent_id: string;
  score: number;
  verified_runs: number;
  failed_runs: number;
  paid_tasks: number;
  blocked_tasks: number;
  total_earned: number;
  average_verification_time_ms: number;
  last_proof_at: string | null;
  updated_at: string;
}

// ── Core scoring ──────────────────────────

/**
 * Compute the reputation score from raw counts using the plan §10.1 formula.
 * Pure function — deterministic, no side effects.
 */
export function computeScore(params: {
  verifiedRuns: number;
  paidTasks: number;
  failedRuns: number;
  blockedTasks: number;
}): number {
  const bonus = Math.min(25, params.verifiedRuns * 2) + Math.min(15, params.paidTasks * 2);
  const penalty = Math.min(25, params.failedRuns * 5) + Math.min(15, params.blockedTasks * 3);
  const score = 50 + bonus - penalty;
  return Math.max(0, Math.min(100, score));
}

// ── Data gathering from real records ──────

/**
 * Gather all reputation inputs from real database records for an agent.
 * No constants, no stubs — every value comes from the database.
 */
export function gatherReputationInputs(agentId: string): {
  verifiedRuns: number;
  failedRuns: number;
  paidTasks: number;
  blockedTasks: number;
  totalEarned: number;
  lastProofAt: string | null;
} {
  const db = getDb();

  // Count verified runs (verified + anchored proofs)
  const verifiedRuns = (
    db.prepare(
      "SELECT COUNT(*) as cnt FROM proofs WHERE agent_id = ? AND status IN ('verified', 'anchored')"
    ).get(agentId) as { cnt: number }
  ).cnt;

  // Count failed runs
  const failedRuns = (
    db.prepare(
      "SELECT COUNT(*) as cnt FROM proofs WHERE agent_id = ? AND status = 'failed'"
    ).get(agentId) as { cnt: number }
  ).cnt;

  // Count paid tasks
  const paidTasks = (
    db.prepare(
      "SELECT COUNT(*) as cnt FROM tasks WHERE agent_id = ? AND status = 'paid'"
    ).get(agentId) as { cnt: number }
  ).cnt;

  // Count blocked tasks
  const blockedTasks = (
    db.prepare(
      "SELECT COUNT(*) as cnt FROM tasks WHERE agent_id = ? AND status = 'blocked'"
    ).get(agentId) as { cnt: number }
  ).cnt;

  // Total earned from paid payments linked to this agent's tasks
  const totalEarned = (
    db.prepare(
      `SELECT COALESCE(SUM(p.total_amount), 0) as total
       FROM payments p
       JOIN tasks t ON p.task_id = t.id
       WHERE t.agent_id = ? AND p.status = 'paid'`
    ).get(agentId) as { total: number }
  ).total;

  // Last proof timestamp
  const lastProof = db.prepare(
    "SELECT created_at FROM proofs WHERE agent_id = ? AND status IN ('verified', 'anchored') ORDER BY created_at DESC LIMIT 1"
  ).get(agentId) as { created_at: string } | undefined;

  return {
    verifiedRuns,
    failedRuns,
    paidTasks,
    blockedTasks,
    totalEarned,
    lastProofAt: lastProof?.created_at ?? null,
  };
}

// ── Full computation + upsert ─────────────

/**
 * Compute reputation for an agent from real data, upsert the result,
 * and return the complete AgentReputation object.
 *
 * Throws if the agent does not exist.
 */
export function computeReputation(agentId: string): AgentReputation {
  const db = getDb();
  const now = new Date().toISOString();

  // Ensure agent exists
  const agent = getAgent(agentId);
  if (!agent) {
    throw new Error("AGENT_NOT_FOUND");
  }

  // Gather real inputs
  const inputs = gatherReputationInputs(agentId);

  // Compute score
  const score = computeScore({
    verifiedRuns: inputs.verifiedRuns,
    paidTasks: inputs.paidTasks,
    failedRuns: inputs.failedRuns,
    blockedTasks: inputs.blockedTasks,
  });

  // Upsert the reputation row
  db.prepare(`
    INSERT INTO agent_reputation (agent_id, score, verified_runs, failed_runs, paid_tasks,
      blocked_tasks, total_earned, average_verification_time_ms, last_proof_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?, ?)
    ON CONFLICT(agent_id) DO UPDATE SET
      score = excluded.score,
      verified_runs = excluded.verified_runs,
      failed_runs = excluded.failed_runs,
      paid_tasks = excluded.paid_tasks,
      blocked_tasks = excluded.blocked_tasks,
      total_earned = excluded.total_earned,
      average_verification_time_ms = excluded.average_verification_time_ms,
      last_proof_at = excluded.last_proof_at,
      updated_at = excluded.updated_at
  `).run(
    agentId,
    score,
    inputs.verifiedRuns,
    inputs.failedRuns,
    inputs.paidTasks,
    inputs.blockedTasks,
    inputs.totalEarned,
    inputs.lastProofAt,
    now
  );

  // Read back the upserted row
  const row = db.prepare(
    "SELECT * FROM agent_reputation WHERE agent_id = ?"
  ).get(agentId) as AgentReputationRow | undefined;

  if (!row) {
    // Fallback defaults (should not happen after upsert)
    return {
      agent_id: agentId,
      score: 50,
      verified_runs: 0,
      failed_runs: 0,
      paid_tasks: 0,
      blocked_tasks: 0,
      total_earned: 0,
      average_verification_time_ms: 0,
      last_proof_at: null,
      updated_at: now,
    };
  }

  return {
    agent_id: row.agent_id,
    score: row.score,
    verified_runs: row.verified_runs,
    failed_runs: row.failed_runs,
    paid_tasks: row.paid_tasks,
    blocked_tasks: row.blocked_tasks,
    total_earned: row.total_earned,
    average_verification_time_ms: row.average_verification_time_ms,
    last_proof_at: row.last_proof_at,
    updated_at: row.updated_at,
  };
}

// ── Recalculation trigger ─────────────────

/**
 * On-event recalculation trigger (plan §10.3).
 * Called whenever a proof transitions to verified/failed or a task
 * transitions to paid/blocked.
 *
 * Returns the freshly computed reputation.
 */
export function recalculateReputation(agentId: string): AgentReputation {
  return computeReputation(agentId);
}

// ── Read-only query ───────────────────────

/**
 * Get the reputation for an agent, always computed from live database records.
 * This ensures reputation always reflects the current state of proofs, tasks,
 * and payments — never stale cached values.
 *
 * If the agent has no reputation row yet, one is computed and stored.
 * Returns stored defaults (score=50) for agents with no activity.
 */
export function getReputation(agentId: string): AgentReputation {
  // Always compute from live data to avoid stale reads
  return computeReputation(agentId);
}

// ── Batch recalculation ───────────────────

/**
 * Recalculate reputation for all agents in the system.
 * Useful for periodic recalculation or admin operations.
 *
 * Returns a map of agent_id → reputation.
 */
export function recalculateAllReputations(): Map<string, AgentReputation> {
  const db = getDb();
  const agents = db.prepare("SELECT id FROM agents").all() as { id: string }[];
  const results = new Map<string, AgentReputation>();

  for (const { id } of agents) {
    try {
      results.set(id, computeReputation(id));
    } catch {
      // Skip agents that fail computation (shouldn't happen)
    }
  }

  return results;
}

// ── Health ────────────────────────────────

export interface ReputationServiceHealth {
  healthy: boolean;
  reputationCount: number;
}

export function getReputationServiceHealth(): ReputationServiceHealth {
  const db = getDb();
  const reputationCount = (
    db.prepare("SELECT COUNT(*) as cnt FROM agent_reputation").get() as { cnt: number }
  ).cnt;

  return {
    healthy: true,
    reputationCount,
  };
}
