// ────────────────────────────────────────
// Sealrail Marketplace Service
// Phase G1: Listing CRUD
// Phase G2: Listing-to-task creation link using Phase E task/payment services
// ────────────────────────────────────────

import { randomUUID } from "crypto";
import { getDb } from "../db.js";
import { getAgent, getAgentReputation } from "./agents.js";
import { createTaskWithPayment } from "./tasks.js";
import type {
  MarketplaceListing,
  ListingStatus,
  Currency,
  Task,
  Payment,
} from "../types.js";

// ── Row types for DB queries ──────────────

interface ListingRow {
  id: string;
  agent_id: string;
  owner_address: string;
  title: string;
  category: string;
  summary: string;
  price_amount: number;
  currency: string;
  proof_requirement: string;
  verifier_id: string;
  reputation_score: number;
  total_verified_runs: number;
  total_paid_tasks: number;
  failure_rate: number;
  status: string;
  created_at: string;
  updated_at: string;
}

// ── Helpers ──────────────────────────────

function rowToListing(row: ListingRow): MarketplaceListing {
  return {
    id: row.id,
    agent_id: row.agent_id,
    owner_address: row.owner_address,
    title: row.title,
    category: row.category,
    summary: row.summary,
    price_amount: row.price_amount,
    currency: row.currency as Currency,
    proof_requirement: row.proof_requirement,
    verifier_id: row.verifier_id,
    reputation_score: row.reputation_score,
    total_verified_runs: row.total_verified_runs,
    total_paid_tasks: row.total_paid_tasks,
    failure_rate: row.failure_rate,
    status: row.status as ListingStatus,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

function fetchAgentReputationFields(agentId: string): {
  reputationScore: number;
  totalVerifiedRuns: number;
  totalPaidTasks: number;
  failureRate: number;
} {
  try {
    const rep = getAgentReputation(agentId);
    const totalRuns = rep.verified_runs + rep.failed_runs;
    const failureRate = totalRuns > 0
      ? Math.round((rep.failed_runs / totalRuns) * 100)
      : 0;
    return {
      reputationScore: rep.score,
      totalVerifiedRuns: rep.verified_runs,
      totalPaidTasks: rep.paid_tasks,
      failureRate,
    };
  } catch {
    return {
      reputationScore: 50,
      totalVerifiedRuns: 0,
      totalPaidTasks: 0,
      failureRate: 0,
    };
  }
}

// ── Listing CRUD ──────────────────────────

/**
 * Create a marketplace listing for an existing agent.
 * Only the agent's owner can create a listing for it.
 * Populates reputation fields from the agent's live reputation data.
 * Phase G1: POST /api/marketplace/listings
 */
export function createListing(params: {
  agentId: string;
  ownerAddress: string;
  title: string;
  category: string;
  summary?: string;
  priceAmount: number;
  currency: Currency;
  proofRequirement?: string;
  verifierId: string;
}): MarketplaceListing {
  const db = getDb();

  // 1. Ensure the agent exists
  const agent = getAgent(params.agentId);
  if (!agent) {
    throw new Error("AGENT_NOT_FOUND: The referenced agent does not exist");
  }

  // 2. Owner check: only the agent's owner can create a listing
  if (agent.owner_address !== params.ownerAddress) {
    throw new Error(
      "NOT_OWNER: Only the agent owner can create a listing for this agent"
    );
  }

  // 3. Validate currency
  const validCurrencies: Currency[] = ["CSPR", "USD"];
  if (!validCurrencies.includes(params.currency)) {
    throw new Error(
      `INVALID_CURRENCY: '${params.currency}' is not a valid currency`
    );
  }

  // 3b. Validate proof requirement — it becomes the payment unlock_rule for
  // every task created from this listing, so reject bad values here (400)
  // instead of failing with a CHECK-constraint 500 at task-creation time.
  const validProofRequirements = ["proof_verified", "workflow_verified"];
  if (params.proofRequirement !== undefined && !validProofRequirements.includes(params.proofRequirement)) {
    throw new Error(
      `INVALID_PROOF_REQUIREMENT: '${params.proofRequirement}' must be one of: ${validProofRequirements.join(", ")}`
    );
  }

  // 4. Validate price
  if (params.priceAmount < 0) {
    throw new Error("INVALID_PRICE: price_amount must be non-negative");
  }

  const id = randomUUID();
  const now = new Date().toISOString();

  // 5. Fetch live reputation data for the agent
  const rep = fetchAgentReputationFields(params.agentId);

  db.prepare(`
    INSERT INTO marketplace_listings (id, agent_id, owner_address, title, category,
      summary, price_amount, currency, proof_requirement, verifier_id,
      reputation_score, total_verified_runs, total_paid_tasks, failure_rate,
      status, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'live', ?, ?)
  `).run(
    id,
    params.agentId,
    params.ownerAddress,
    params.title,
    params.category,
    params.summary ?? "",
    params.priceAmount,
    params.currency,
    params.proofRequirement ?? "proof_verified",
    params.verifierId,
    rep.reputationScore,
    rep.totalVerifiedRuns,
    rep.totalPaidTasks,
    rep.failureRate,
    now,
    now,
  );

  return getListing(id)!;
}

/**
 * Get a listing by ID.
 * Returns null if not found.
 * Phase G1: GET /api/marketplace/:listingId
 */
export function getListing(id: string): MarketplaceListing | null {
  const db = getDb();
  const row = db
    .prepare("SELECT * FROM marketplace_listings WHERE id = ?")
    .get(id) as ListingRow | undefined;
  if (!row) return null;
  return rowToListing(row);
}

/**
 * Get a listing with full agent summary and reputation fields.
 * Returns null if the listing is not found.
 * Phase G1: GET /api/marketplace/:listingId enriched response
 */
export function getListingDetail(id: string): {
  listing: MarketplaceListing | null;
  agent: { id: string; name: string; slug: string; category: string; status: string } | null;
  agentReputation: { score: number; verified_runs: number; paid_tasks: number } | null;
} {
  const listing = getListing(id);
  if (!listing) {
    return { listing: null, agent: null, agentReputation: null };
  }

  const agent = getAgent(listing.agent_id);
  const agentSummary = agent
    ? {
        id: agent.id,
        name: agent.name,
        slug: agent.slug,
        category: agent.category,
        status: agent.status,
      }
    : null;

  let agentReputation: { score: number; verified_runs: number; paid_tasks: number } | null = null;
  try {
    const rep = getAgentReputation(listing.agent_id);
    agentReputation = {
      score: rep.score,
      verified_runs: rep.verified_runs,
      paid_tasks: rep.paid_tasks,
    };
  } catch {
    agentReputation = null;
  }

  return { listing, agent: agentSummary, agentReputation };
}

/**
 * List marketplace listings with optional filters.
 * Phase G1: GET /api/marketplace
 */
export function listListings(filters?: {
  category?: string;
  status?: ListingStatus | "all";
  ownerAddress?: string;
  agentId?: string;
  limit?: number;
}): MarketplaceListing[] {
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
  if (filters?.agentId) {
    conditions.push("agent_id = ?");
    params.push(filters.agentId);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
  const limit = filters?.limit ?? 100;

  const rows = db
    .prepare(
      `SELECT * FROM marketplace_listings ${where} ORDER BY created_at DESC LIMIT ?`
    )
    .all(...params, limit) as ListingRow[];

  return rows.map(rowToListing);
}

/**
 * Update a marketplace listing's mutable fields.
 * Only the listing owner can update. Validates all inputs.
 * Phase G1: PATCH /api/marketplace/listings/:listingId
 */
export function updateListing(
  id: string,
  ownerAddress: string,
  params: {
    title?: string;
    category?: string;
    summary?: string;
    priceAmount?: number;
    currency?: Currency;
    status?: ListingStatus;
  }
): MarketplaceListing {
  const db = getDb();
  const now = new Date().toISOString();

  const existing = getListing(id);
  if (!existing) {
    throw new Error("LISTING_NOT_FOUND");
  }

  // Owner check
  if (existing.owner_address !== ownerAddress) {
    throw new Error(
      "NOT_OWNER: Only the listing owner can update this listing"
    );
  }

  // Validate currency if provided
  if (params.currency) {
    const validCurrencies: Currency[] = ["CSPR", "USD"];
    if (!validCurrencies.includes(params.currency)) {
      throw new Error(
        `INVALID_CURRENCY: '${params.currency}' is not a valid currency`
      );
    }
  }

  // Validate price if provided
  if (params.priceAmount !== undefined && params.priceAmount < 0) {
    throw new Error("INVALID_PRICE: price_amount must be non-negative");
  }

  // Validate status if provided
  if (params.status) {
    const validStatuses: ListingStatus[] = ["live", "paused", "draft"];
    if (!validStatuses.includes(params.status)) {
      throw new Error(
        `INVALID_STATUS: '${params.status}' is not a valid listing status`
      );
    }
  }

  // Build dynamic SET clause
  const updates: string[] = [];
  const values: unknown[] = [];

  if (params.title !== undefined) {
    updates.push("title = ?");
    values.push(params.title);
  }
  if (params.category !== undefined) {
    updates.push("category = ?");
    values.push(params.category);
  }
  if (params.summary !== undefined) {
    updates.push("summary = ?");
    values.push(params.summary);
  }
  if (params.priceAmount !== undefined) {
    updates.push("price_amount = ?");
    values.push(params.priceAmount);
  }
  if (params.currency !== undefined) {
    updates.push("currency = ?");
    values.push(params.currency);
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

  db.prepare(`UPDATE marketplace_listings SET ${updates.join(", ")} WHERE id = ?`).run(
    ...values
  );

  return getListing(id)!;
}

// ── Listing-to-Task Creation Link ─────────

/**
 * Create a payment-backed task from a marketplace listing.
 * Uses the existing Phase E task/payment services.
 *
 * The listing must be 'live'. The task inherits:
 *  - agent_id from the listing
 *  - title from the listing title
 *  - payment amount from the listing price_amount
 *  - listing_id linkage for traceability
 *
 * Phase G2: POST /api/marketplace/:listingId/tasks
 */
export function createTaskFromListing(
  listingId: string,
  params: {
    buyerAddress: string;
    input?: Record<string, unknown>;
  }
): { task: Task; payment: Payment; listing: MarketplaceListing } {
  const listing = getListing(listingId);
  if (!listing) {
    throw new Error("LISTING_NOT_FOUND");
  }

  if (listing.status !== "live") {
    throw new Error(
      `LISTING_NOT_LIVE: Cannot create a task from a '${listing.status}' listing. Only 'live' listings are purchasable.`
    );
  }

  // The agent runtime dispatches on the task_type the agent declares (e.g.
  // "invoice_risk"), not on the listing's marketplace category ("invoice").
  // Prefer the agent's first supported task type so listing-created tasks are
  // executable; fall back to the category for agents that declare none.
  const listingAgent = getAgent(listing.agent_id);
  const taskType = listingAgent?.supported_task_types?.[0] ?? listing.category;

  // Use the canonical Phase E entry point: createTaskWithPayment
  const result = createTaskWithPayment({
    buyerAddress: params.buyerAddress,
    agentId: listing.agent_id,
    title: listing.title,
    taskType,
    input: params.input ?? {},
    totalAmount: listing.price_amount,
    currency: listing.currency,
    unlockRule: listing.proof_requirement as "proof_verified" | "workflow_verified",
  });

  // Link the task back to the listing
  const db = getDb();
  const now = new Date().toISOString();
  db.prepare("UPDATE tasks SET listing_id = ?, updated_at = ? WHERE id = ?").run(
    listingId,
    now,
    result.task.id,
  );

  // Refresh the task with the listing_id set
  const task: Task = {
    ...result.task,
    listing_id: listingId,
  };

  return { task, payment: result.payment, listing };
}

// ── Health ────────────────────────────────

export function getMarketplaceServiceHealth() {
  const db = getDb();
  const listingCount = (
    db.prepare("SELECT COUNT(*) as cnt FROM marketplace_listings").get() as { cnt: number }
  ).cnt;

  return {
    healthy: true,
    listingCount,
  };
}
