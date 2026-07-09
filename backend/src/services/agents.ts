// ────────────────────────────────────────
// Sealrail Agent Registry Service
// Phase F1: Agent CRUD + Phase F3: Casper registration sync hook
// Routes: Phase F2 (backend/src/routes/agents.ts)
// ────────────────────────────────────────

import { randomUUID, createHash } from "crypto";
import { getDb } from "../db.js";
import { anchorProof, getCasperHealth } from "./casper.js";
import type { AnchorProofInput } from "./casper.js";
import type {
  Agent,
  AgentCategory,
  AgentPricingModel,
  AgentStatus,
  Currency,
  AgentReputation,
  Proof,
} from "../types.js";
import { config } from "../config.js";
import { getReputation } from "./reputation.js";
export { recalculateReputation } from "./reputation.js";

// ── Row types for DB queries ──────────────

interface AgentRow {
  id: string;
  owner_address: string;
  name: string;
  slug: string;
  category: string;
  description: string;
  short_pitch: string;
  pricing_model: string;
  base_price: number;
  currency: string;
  verifier_ids: string;
  supported_task_types: string;
  status: string;
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

// ── Helpers ──────────────────────────────

function rowToAgent(row: AgentRow): Agent {
  return {
    id: row.id,
    owner_address: row.owner_address,
    name: row.name,
    slug: row.slug,
    category: row.category as AgentCategory,
    description: row.description,
    short_pitch: row.short_pitch,
    pricing_model: row.pricing_model as AgentPricingModel,
    base_price: row.base_price,
    currency: row.currency as Currency,
    verifier_ids: JSON.parse(row.verifier_ids) as string[],
    supported_task_types: JSON.parse(row.supported_task_types) as string[],
    status: row.status as AgentStatus,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

/**
 * Generate a URL-safe slug from an agent name.
 */
function baseSlug(name: string): string {
  const chars: string[] = [];
  let lastWasDash = true;
  for (const ch of name.toLowerCase()) {
    const isAlnum = (ch >= "a" && ch <= "z") || (ch >= "0" && ch <= "9");
    if (isAlnum) {
      chars.push(ch);
      lastWasDash = false;
    } else if (!lastWasDash) {
      chars.push("-");
      lastWasDash = true;
    }
  }
  while (chars.length > 0 && chars[chars.length - 1] === "-") chars.pop();
  return chars.join("").slice(0, 64) || "agent";
}

function generateSlug(name: string): string {
  return `${baseSlug(name)}-${randomUUID().slice(0, 8)}`;
}

// ── Agent CRUD ────────────────────────────

/**
 * Create a new agent.
 * Returns the created agent or throws on validation/slug errors.
 */
export function createAgent(params: {
  ownerAddress: string;
  name: string;
  category: AgentCategory;
  description?: string;
  shortPitch?: string;
  pricingModel?: AgentPricingModel;
  basePrice?: number;
  currency?: Currency;
  verifierIds?: string[];
  supportedTaskTypes?: string[];
}): Agent {
  const db = getDb();
  const id = randomUUID();
  const now = new Date().toISOString();
  const slug = generateSlug(params.name);

  // Validate category
  const validCategories: AgentCategory[] = ["invoice", "defi", "research", "compliance", "custom"];
  if (!validCategories.includes(params.category)) {
    throw new Error(`INVALID_CATEGORY: '${params.category}' is not a valid agent category`);
  }

  const pricingModel = params.pricingModel ?? "fixed";
  const validPricing: AgentPricingModel[] = ["fixed", "per_run", "workflow_split"];
  if (!validPricing.includes(pricingModel)) {
    throw new Error(`INVALID_PRICING_MODEL: '${pricingModel}' is not a valid pricing model`);
  }

  const currency = params.currency ?? "USD";
  const validCurrencies: Currency[] = ["CSPR", "USD"];
  if (!validCurrencies.includes(currency)) {
    throw new Error(`INVALID_CURRENCY: '${currency}' is not a valid currency`);
  }

  db.prepare(`
    INSERT INTO agents (id, owner_address, name, slug, category, description, short_pitch,
      pricing_model, base_price, currency, verifier_ids, supported_task_types, status,
      created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', ?, ?)
  `).run(
    id,
    params.ownerAddress,
    params.name,
    slug,
    params.category,
    params.description ?? "",
    params.shortPitch ?? "",
    pricingModel,
    params.basePrice ?? 0,
    currency,
    JSON.stringify(params.verifierIds ?? []),
    JSON.stringify(params.supportedTaskTypes ?? [params.category]),
    now,
    now,
  );

  // Initialize reputation row
  db.prepare(`
    INSERT OR IGNORE INTO agent_reputation (agent_id, score, updated_at)
    VALUES (?, 50, ?)
  `).run(id, now);

  return getAgent(id)!;
}

/**
 * Get an agent by ID.
 * Returns null if not found.
 */
export function getAgent(id: string): Agent | null {
  const db = getDb();
  const row = db.prepare("SELECT * FROM agents WHERE id = ?").get(id) as AgentRow | undefined;
  if (!row) return null;
  return rowToAgent(row);
}

/**
 * Get an agent by slug.
 * Returns null if not found.
 */
export function getAgentBySlug(slug: string): Agent | null {
  const db = getDb();
  const row = db.prepare("SELECT * FROM agents WHERE slug = ?").get(slug) as AgentRow | undefined;
  if (!row) return null;
  return rowToAgent(row);
}

/**
 * List all agents, optionally filtered by category and/or status.
 */
export function listAgents(filters?: {
  category?: AgentCategory;
  status?: AgentStatus;
  ownerAddress?: string;
}): Agent[] {
  const db = getDb();
  const conditions: string[] = [];
  const params: unknown[] = [];

  if (filters?.category) {
    conditions.push("category = ?");
    params.push(filters.category);
  }
  if (filters?.status) {
    conditions.push("status = ?");
    params.push(filters.status);
  }
  if (filters?.ownerAddress) {
    conditions.push("owner_address = ?");
    params.push(filters.ownerAddress);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
  const rows = db.prepare(
    `SELECT * FROM agents ${where} ORDER BY created_at DESC`
  ).all(...params) as AgentRow[];

  return rows.map(rowToAgent);
}

/**
 * Update an agent's mutable fields.
 * Only the owner can update. Validates all inputs.
 * Returns the updated agent or throws on validation/access errors.
 */
export function updateAgent(
  id: string,
  ownerAddress: string,
  params: {
    name?: string;
    slug?: string;
    category?: AgentCategory;
    description?: string;
    shortPitch?: string;
    pricingModel?: AgentPricingModel;
    basePrice?: number;
    currency?: Currency;
    verifierIds?: string[];
    supportedTaskTypes?: string[];
    status?: AgentStatus;
  }
): Agent {
  const db = getDb();
  const now = new Date().toISOString();

  const existing = getAgent(id);
  if (!existing) {
    throw new Error("AGENT_NOT_FOUND");
  }

  // Owner check
  if (existing.owner_address !== ownerAddress) {
    throw new Error("NOT_OWNER: Only the agent owner can update this agent");
  }

  // Validate category if provided
  if (params.category) {
    const validCategories: AgentCategory[] = ["invoice", "defi", "research", "compliance", "custom"];
    if (!validCategories.includes(params.category)) {
      throw new Error(`INVALID_CATEGORY: '${params.category}' is not a valid agent category`);
    }
  }

  // Validate pricing model if provided
  if (params.pricingModel) {
    const validPricing: AgentPricingModel[] = ["fixed", "per_run", "workflow_split"];
    if (!validPricing.includes(params.pricingModel)) {
      throw new Error(`INVALID_PRICING_MODEL: '${params.pricingModel}' is not a valid pricing model`);
    }
  }

  // Validate currency if provided
  if (params.currency) {
    const validCurrencies: Currency[] = ["CSPR", "USD"];
    if (!validCurrencies.includes(params.currency)) {
      throw new Error(`INVALID_CURRENCY: '${params.currency}' is not a valid currency`);
    }
  }

  // Validate status if provided
  if (params.status) {
    const validStatuses: AgentStatus[] = ["active", "paused", "draft"];
    if (!validStatuses.includes(params.status)) {
      throw new Error(`INVALID_STATUS: '${params.status}' is not a valid agent status`);
    }
  }

  // Validate slug uniqueness if changing
  if (params.slug && params.slug !== existing.slug) {
    const conflict = getAgentBySlug(params.slug);
    if (conflict && conflict.id !== id) {
      throw new Error(`SLUG_TAKEN: Slug '${params.slug}' is already in use`);
    }
  }

  // Build dynamic SET clause
  const updates: string[] = [];
  const values: unknown[] = [];

  if (params.name !== undefined) {
    updates.push("name = ?");
    values.push(params.name);
  }
  if (params.slug !== undefined) {
    updates.push("slug = ?");
    values.push(params.slug);
  }
  if (params.category !== undefined) {
    updates.push("category = ?");
    values.push(params.category);
  }
  if (params.description !== undefined) {
    updates.push("description = ?");
    values.push(params.description);
  }
  if (params.shortPitch !== undefined) {
    updates.push("short_pitch = ?");
    values.push(params.shortPitch);
  }
  if (params.pricingModel !== undefined) {
    updates.push("pricing_model = ?");
    values.push(params.pricingModel);
  }
  if (params.basePrice !== undefined) {
    updates.push("base_price = ?");
    values.push(params.basePrice);
  }
  if (params.currency !== undefined) {
    updates.push("currency = ?");
    values.push(params.currency);
  }
  if (params.verifierIds !== undefined) {
    updates.push("verifier_ids = ?");
    values.push(JSON.stringify(params.verifierIds));
  }
  if (params.supportedTaskTypes !== undefined) {
    updates.push("supported_task_types = ?");
    values.push(JSON.stringify(params.supportedTaskTypes));
  }
  if (params.status !== undefined) {
    updates.push("status = ?");
    values.push(params.status);
  }

  if (updates.length === 0) {
    return existing; // No changes requested
  }

  updates.push("updated_at = ?");
  values.push(now);
  values.push(id);

  db.prepare(`UPDATE agents SET ${updates.join(", ")} WHERE id = ?`).run(...values);

  return getAgent(id)!;
}

// ── Reputation ────────────────────────────

/**
 * Get agent reputation data.
 * Delegates to the reputation service for computation from real records.
 * Returns computed reputation from real proof/task/payment records.
 */
export function getAgentReputation(agentId: string): AgentReputation {
  return getReputation(agentId);
}

// ── Proof history ─────────────────────────

/**
 * Get all proofs for a given agent.
 * Returns proof records from the proofs table filtered by agent_id.
 */
export function getAgentProofs(agentId: string): Proof[] {
  const db = getDb();

  // Ensure agent exists
  const agent = getAgent(agentId);
  if (!agent) {
    throw new Error("AGENT_NOT_FOUND");
  }

  const rows = db.prepare(
    "SELECT * FROM proofs WHERE agent_id = ? ORDER BY created_at DESC"
  ).all(agentId) as ProofRow[];

  return rows.map((row) => ({
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
    mode: row.mode as "tee_verification_mode" | "hosted_tee",
    status: row.status as "pending" | "verified" | "failed" | "anchored",
    created_at: row.created_at,
  }));
}

// ── Casper registration sync (F3) ─────────

/**
 * Sync an agent's registration to Casper Network.
 *
 * In dry-run mode, produces a deterministic registration hash.
 * In testnet mode, attempts a casper-client deploy (falls back to simulated
 * hash if no credentials are configured).
 *
 * @param agentId - The agent to register on Casper
 * @returns The registration sync result with hash and mode
 */
export async function syncAgentToCasper(agentId: string): Promise<{
  agentId: string;
  registrationHash: string;
  deployHash?: string;
  mode: string;
}> {
  const db = getDb();
  const agent = getAgent(agentId);

  if (!agent) {
    throw new Error("AGENT_NOT_FOUND");
  }

  // Build a canonical registration payload
  const registrationCanonical = [
    "sealrail-agent-registration-v1",
    agent.id,
    agent.name,
    agent.slug,
    agent.category,
    agent.owner_address,
    JSON.stringify(agent.verifier_ids),
    JSON.stringify(agent.supported_task_types),
    agent.created_at,
  ].join("|");

  const registrationHash = createHash("sha256")
    .update(registrationCanonical)
    .digest("hex");

  // Build anchor-style input for Casper
  const anchorInput: AnchorProofInput = {
    taskId: `agent-reg-${agent.id}`,
    proofId: `agent-reg-proof-${agent.id}`,
    agentId: agent.id,
    verifierId: "agent-registry-v1",
    hashOfCode: "agent-registry-hash",
    hashOfInput: registrationHash,
    hashOfOutput: registrationHash,
    wasmHash: "agent-registry-wasm-hash",
    teeMode: config.teeVerificationMode,
  };

  try {
    const anchorResult = await anchorProof(anchorInput);

    return {
      agentId: agent.id,
      registrationHash,
      deployHash: anchorResult.deployHash,
      mode: anchorResult.mode,
    };
  } catch {
    // Fallback: return the deterministic registration hash
    return {
      agentId: agent.id,
      registrationHash,
      mode: config.casperMode,
    };
  }
}

// ── Health ────────────────────────────────

export interface AgentServiceHealth {
  healthy: boolean;
  agentCount: number;
  activeCount: number;
  casperHealth: ReturnType<typeof getCasperHealth>;
}

export function getAgentServiceHealth(): AgentServiceHealth {
  const db = getDb();
  const agentCount = (
    db.prepare("SELECT COUNT(*) as cnt FROM agents").get() as { cnt: number }
  ).cnt;
  const activeCount = (
    db.prepare("SELECT COUNT(*) as cnt FROM agents WHERE status = 'active'").get() as { cnt: number }
  ).cnt;

  return {
    healthy: true,
    agentCount,
    activeCount,
    casperHealth: getCasperHealth(),
  };
}
