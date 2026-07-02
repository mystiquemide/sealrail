// ────────────────────────────────────────
// Sealrail Backend - Phase G Tests
// Marketplace backend: listing CRUD, listing-to-task creation, filters
// Covers G1-G3: services, routes, owner enforcement
// ────────────────────────────────────────

import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { randomUUID } from "crypto";

import { getDb, closeDb, resetDb } from "../src/db.js";

// ── Phase F: agent service needed to set up test data ──
import { createAgent } from "../src/services/agents.js";

// ── Phase G: marketplace service ─────────
import {
  createListing,
  getListing,
  getListingDetail,
  listListings,
  updateListing,
  createTaskFromListing,
  getMarketplaceServiceHealth,
} from "../src/services/marketplace.js";

// ── Phase E: task/payment (used by createTaskFromListing) ──
import { getTask, getPaymentById } from "../src/services/tasks.js";

import type {
  MarketplaceListing,
  ListingStatus,
  Agent,
  AgentCategory,
} from "../src/types.js";

// Use a test-specific in-memory database
process.env.DATABASE_PATH = ":memory:";
closeDb();

// ── Test helpers ─────────────────────────

function createTestAgent(owner = "0xAlice", overrides: Partial<{
  category: AgentCategory;
  name: string;
  basePrice: number;
  currency: "CSPR" | "USD";
}> = {}): Agent {
  return createAgent({
    ownerAddress: owner,
    name: overrides.name ?? "Test Agent",
    category: overrides.category ?? "invoice",
    basePrice: overrides.basePrice ?? 100,
    currency: overrides.currency ?? "USD",
  });
}

// ── Test Suite ───────────────────────────

describe("Phase G: Marketplace Backend", () => {

  beforeEach(() => {
    resetDb();
  });

  afterAll(() => {
    closeDb();
  });

  // ═══════════════════════════════════════
  // G1: Listing Service - CRUD
  // ═══════════════════════════════════════

  describe("G1: Listing Service - CRUD", () => {

    describe("createListing", () => {
      it("creates a listing for an existing agent when owner matches", () => {
        const agent = createTestAgent("0xAlice");

        const listing = createListing({
          agentId: agent.id,
          ownerAddress: "0xAlice",
          title: "Invoice Risk Assessment",
          category: "invoice",
          priceAmount: 50,
          currency: "USD",
          verifierId: "vfr-invoice-v1",
        });

        expect(listing.id).toBeDefined();
        expect(listing.agent_id).toBe(agent.id);
        expect(listing.owner_address).toBe("0xAlice");
        expect(listing.title).toBe("Invoice Risk Assessment");
        expect(listing.category).toBe("invoice");
        expect(listing.price_amount).toBe(50);
        expect(listing.currency).toBe("USD");
        expect(listing.verifier_id).toBe("vfr-invoice-v1");
        expect(listing.status).toBe("live");
        expect(listing.proof_requirement).toBe("proof_verified");
        expect(listing.reputation_score).toBeGreaterThanOrEqual(0);
      });

      it("rejects listing creation when agent does not exist", () => {
        expect(() =>
          createListing({
            agentId: "nonexistent-agent-id",
            ownerAddress: "0xAlice",
            title: "Ghost Agent Listing",
            category: "invoice",
            priceAmount: 50,
            currency: "USD",
            verifierId: "vfr-v1",
          })
        ).toThrow("AGENT_NOT_FOUND");
      });

      it("rejects listing creation when owner does not match agent owner", () => {
        const agent = createTestAgent("0xAlice");

        expect(() =>
          createListing({
            agentId: agent.id,
            ownerAddress: "0xEve",
            title: "Eve's Attempt",
            category: "invoice",
            priceAmount: 50,
            currency: "USD",
            verifierId: "vfr-v1",
          })
        ).toThrow("NOT_OWNER");
      });

      it("rejects listing with invalid currency", () => {
        const agent = createTestAgent("0xAlice");

        expect(() =>
          createListing({
            agentId: agent.id,
            ownerAddress: "0xAlice",
            title: "Bad Currency Listing",
            category: "invoice",
            priceAmount: 50,
            currency: "EUR" as any,
            verifierId: "vfr-v1",
          })
        ).toThrow("INVALID_CURRENCY");
      });

      it("rejects listing with negative price", () => {
        const agent = createTestAgent("0xAlice");

        expect(() =>
          createListing({
            agentId: agent.id,
            ownerAddress: "0xAlice",
            title: "Negative Price",
            category: "invoice",
            priceAmount: -10,
            currency: "USD",
            verifierId: "vfr-v1",
          })
        ).toThrow("INVALID_PRICE");
      });

      it("creates listing with optional summary and custom proof_requirement", () => {
        const agent = createTestAgent("0xAlice");

        const listing = createListing({
          agentId: agent.id,
          ownerAddress: "0xAlice",
          title: "Premium DeFi Analyzer",
          category: "defi",
          summary: "High-end DeFi protocol risk analysis",
          priceAmount: 200,
          currency: "CSPR",
          proofRequirement: "workflow_verified",
          verifierId: "vfr-defi-v2",
        });

        expect(listing.summary).toBe("High-end DeFi protocol risk analysis");
        expect(listing.proof_requirement).toBe("workflow_verified");
        expect(listing.currency).toBe("CSPR");
      });

      it("pulls reputation fields from the agent", () => {
        const agent = createTestAgent("0xAlice");

        const listing = createListing({
          agentId: agent.id,
          ownerAddress: "0xAlice",
          title: "Rep Test",
          category: "invoice",
          priceAmount: 10,
          currency: "USD",
          verifierId: "vfr-v1",
        });

        // Default reputation for a brand-new agent: score 50, 0 runs, 0 paid
        expect(listing.reputation_score).toBe(50);
        expect(listing.total_verified_runs).toBe(0);
        expect(listing.total_paid_tasks).toBe(0);
        expect(listing.failure_rate).toBe(0);
      });
    });

    describe("getListing", () => {
      it("returns a listing by ID", () => {
        const agent = createTestAgent("0xAlice");
        const created = createListing({
          agentId: agent.id,
          ownerAddress: "0xAlice",
          title: "Get Me",
          category: "invoice",
          priceAmount: 30,
          currency: "USD",
          verifierId: "vfr-v1",
        });

        const found = getListing(created.id);
        expect(found).not.toBeNull();
        expect(found!.id).toBe(created.id);
        expect(found!.title).toBe("Get Me");
      });

      it("returns null for nonexistent listing", () => {
        const found = getListing("nonexistent-listing");
        expect(found).toBeNull();
      });
    });

    describe("getListingDetail", () => {
      it("returns listing with agent summary and reputation", () => {
        const agent = createTestAgent("0xAlice", { name: "Full Stack Risk Agent" });
        const listing = createListing({
          agentId: agent.id,
          ownerAddress: "0xAlice",
          title: "Detailed Listing",
          category: "research",
          priceAmount: 75,
          currency: "USD",
          verifierId: "vfr-research-v1",
        });

        const detail = getListingDetail(listing.id);

        expect(detail.listing).not.toBeNull();
        expect(detail.listing!.id).toBe(listing.id);
        expect(detail.agent).not.toBeNull();
        expect(detail.agent!.name).toBe("Full Stack Risk Agent");
        expect(detail.agent!.slug).toBe(agent.slug);
        expect(detail.agentReputation).not.toBeNull();
        expect(detail.agentReputation!.score).toBeGreaterThanOrEqual(0);
      });

      it("returns null listing when listing does not exist", () => {
        const detail = getListingDetail("nonexistent-listing");
        expect(detail.listing).toBeNull();
        expect(detail.agent).toBeNull();
      });
    });

    describe("listListings", () => {
      it("returns all listings when no filters provided", () => {
        const agent = createTestAgent("0xAlice");
        createListing({
          agentId: agent.id, ownerAddress: "0xAlice",
          title: "L1", category: "invoice", priceAmount: 10, currency: "USD", verifierId: "v1",
        });
        createListing({
          agentId: agent.id, ownerAddress: "0xAlice",
          title: "L2", category: "defi", priceAmount: 20, currency: "CSPR", verifierId: "v2",
        });

        const all = listListings();
        expect(all.length).toBe(2);
      });

      it("filters by category", () => {
        const agent = createTestAgent("0xAlice");
        createListing({ agentId: agent.id, ownerAddress: "0xAlice", title: "A", category: "invoice", priceAmount: 10, currency: "USD", verifierId: "v1" });
        createListing({ agentId: agent.id, ownerAddress: "0xAlice", title: "B", category: "defi", priceAmount: 20, currency: "CSPR", verifierId: "v2" });

        const filtered = listListings({ category: "defi" });
        expect(filtered.length).toBe(1);
        expect(filtered[0].category).toBe("defi");
      });

      it("filters by status", () => {
        const agent = createTestAgent("0xAlice");
        const l1 = createListing({ agentId: agent.id, ownerAddress: "0xAlice", title: "Live", category: "invoice", priceAmount: 10, currency: "USD", verifierId: "v1" });
        const l2 = createListing({ agentId: agent.id, ownerAddress: "0xAlice", title: "Draft", category: "invoice", priceAmount: 10, currency: "USD", verifierId: "v2" });
        updateListing(l2.id, "0xAlice", { status: "draft" });

        const live = listListings({ status: "live" });
        expect(live.length).toBe(1);
        expect(live[0].id).toBe(l1.id);

        const draft = listListings({ status: "draft" });
        expect(draft.length).toBe(1);
        expect(draft[0].id).toBe(l2.id);
      });

      it("filters by owner_address", () => {
        const agentA = createTestAgent("0xAlice");
        const agentB = createTestAgent("0xBob");
        createListing({ agentId: agentA.id, ownerAddress: "0xAlice", title: "Alice L", category: "invoice", priceAmount: 10, currency: "USD", verifierId: "v1" });
        createListing({ agentId: agentB.id, ownerAddress: "0xBob", title: "Bob L", category: "invoice", priceAmount: 10, currency: "USD", verifierId: "v2" });

        const aliceOnly = listListings({ ownerAddress: "0xAlice" });
        expect(aliceOnly.length).toBe(1);
        expect(aliceOnly[0].owner_address).toBe("0xAlice");
      });

      it("filters by agent_id", () => {
        const agent = createTestAgent("0xAlice");
        createListing({ agentId: agent.id, ownerAddress: "0xAlice", title: "Match", category: "invoice", priceAmount: 10, currency: "USD", verifierId: "v1" });

        const match = listListings({ agentId: agent.id });
        expect(match.length).toBe(1);
        expect(match[0].agent_id).toBe(agent.id);

        const noMatch = listListings({ agentId: "different-agent" });
        expect(noMatch.length).toBe(0);
      });

      it("respects limit parameter", () => {
        const agent = createTestAgent("0xAlice");
        for (let i = 0; i < 5; i++) {
          createListing({ agentId: agent.id, ownerAddress: "0xAlice", title: `L${i}`, category: "invoice", priceAmount: 10, currency: "USD", verifierId: "v1" });
        }

        const limited = listListings({ limit: 3 });
        expect(limited.length).toBe(3);
      });
    });

    describe("updateListing", () => {
      it("updates mutable fields on an owned listing", () => {
        const agent = createTestAgent("0xAlice");
        const created = createListing({
          agentId: agent.id,
          ownerAddress: "0xAlice",
          title: "Original Title",
          category: "invoice",
          priceAmount: 50,
          currency: "USD",
          verifierId: "vfr-v1",
        });

        const updated = updateListing(created.id, "0xAlice", {
          title: "Updated Title",
          priceAmount: 75,
          summary: "Now with summary",
        });

        expect(updated.title).toBe("Updated Title");
        expect(updated.price_amount).toBe(75);
        expect(updated.summary).toBe("Now with summary");
      });

      it("updates status to paused", () => {
        const agent = createTestAgent("0xAlice");
        const listing = createListing({
          agentId: agent.id,
          ownerAddress: "0xAlice",
          title: "Pausable",
          category: "invoice",
          priceAmount: 10,
          currency: "USD",
          verifierId: "v1",
        });

        const paused = updateListing(listing.id, "0xAlice", { status: "paused" });
        expect(paused.status).toBe("paused");
      });

      it("rejects update from non-owner", () => {
        const agent = createTestAgent("0xAlice");
        const listing = createListing({
          agentId: agent.id,
          ownerAddress: "0xAlice",
          title: "Owned by Alice",
          category: "invoice",
          priceAmount: 10,
          currency: "USD",
          verifierId: "v1",
        });

        expect(() =>
          updateListing(listing.id, "0xEve", { title: "Hijacked" })
        ).toThrow("NOT_OWNER");
      });

      it("rejects update on nonexistent listing", () => {
        expect(() =>
          updateListing("nonexistent", "0xAlice", { title: "Nope" })
        ).toThrow("LISTING_NOT_FOUND");
      });

      it("rejects update with invalid status", () => {
        const agent = createTestAgent("0xAlice");
        const listing = createListing({
          agentId: agent.id,
          ownerAddress: "0xAlice",
          title: "Status Test",
          category: "invoice",
          priceAmount: 10,
          currency: "USD",
          verifierId: "v1",
        });

        expect(() =>
          updateListing(listing.id, "0xAlice", { status: "deleted" as any })
        ).toThrow("INVALID_STATUS");
      });

      it("returns unchanged listing when no fields provided", () => {
        const agent = createTestAgent("0xAlice");
        const listing = createListing({
          agentId: agent.id,
          ownerAddress: "0xAlice",
          title: "Untouched",
          category: "invoice",
          priceAmount: 10,
          currency: "USD",
          verifierId: "v1",
        });

        const result = updateListing(listing.id, "0xAlice", {});
        expect(result.id).toBe(listing.id);
        expect(result.title).toBe("Untouched");
      });
    });
  });

  // ═══════════════════════════════════════
  // G2: Listing-to-Task Creation Link
  // ═══════════════════════════════════════

  describe("G2: Listing-to-Task Creation Link", () => {

    describe("createTaskFromListing", () => {
      it("creates a payment-backed task from a live listing", () => {
        const agent = createTestAgent("0xAlice", { basePrice: 100, currency: "USD" });
        const listing = createListing({
          agentId: agent.id,
          ownerAddress: "0xAlice",
          title: "Invoice Risk Assessor",
          category: "invoice",
          summary: "Quick verification",
          priceAmount: 100,
          currency: "USD",
          verifierId: "vfr-v1",
        });

        const result = createTaskFromListing(listing.id, {
          buyerAddress: "0xBob",
          input: { invoice_id: "INV-001", amount: 5000 },
        });

        expect(result.task).toBeDefined();
        expect(result.payment).toBeDefined();
        expect(result.listing.id).toBe(listing.id);

        // Task should be linked to the listing
        expect(result.task.listing_id).toBe(listing.id);

        // Task inherits listing properties
        expect(result.task.agent_id).toBe(agent.id);
        expect(result.task.title).toBe("Invoice Risk Assessor");
        expect(result.task.task_type).toBe("invoice");

        // Payment should match listing price
        expect(result.payment.total_amount).toBe(100);
        expect(result.payment.currency).toBe("USD");
        expect(result.payment.buyer_address).toBe("0xBob");
        expect(result.payment.status).toBe("intent_created");

        // Task status should be "funded" (payment-backed)
        expect(result.task.status).toBe("funded");
      });

      it("links task back to listing in DB", () => {
        const agent = createTestAgent("0xAlice");
        const listing = createListing({
          agentId: agent.id,
          ownerAddress: "0xAlice",
          title: "Linked Task",
          category: "compliance",
          priceAmount: 50,
          currency: "CSPR",
          verifierId: "vfr-comp-v1",
        });

        const result = createTaskFromListing(listing.id, {
          buyerAddress: "0xBob",
        });

        // Verify the task in DB has listing_id set
        const taskFromDb = getTask(result.task.id);
        expect(taskFromDb).not.toBeNull();
        expect(taskFromDb!.listing_id).toBe(listing.id);
      });

      it("rejects task creation for non-live listing", () => {
        const agent = createTestAgent("0xAlice");
        const listing = createListing({
          agentId: agent.id,
          ownerAddress: "0xAlice",
          title: "Paused One",
          category: "invoice",
          priceAmount: 50,
          currency: "USD",
          verifierId: "v1",
        });

        // Pause the listing
        updateListing(listing.id, "0xAlice", { status: "paused" });

        expect(() =>
          createTaskFromListing(listing.id, {
            buyerAddress: "0xBob",
          })
        ).toThrow("LISTING_NOT_LIVE");
      });

      it("rejects task creation for nonexistent listing", () => {
        expect(() =>
          createTaskFromListing("nonexistent-listing", {
            buyerAddress: "0xBob",
          })
        ).toThrow("LISTING_NOT_FOUND");
      });

      it("creates task with custom input", () => {
        const agent = createTestAgent("0xAlice");
        const listing = createListing({
          agentId: agent.id,
          ownerAddress: "0xAlice",
          title: "Custom Input",
          category: "research",
          priceAmount: 30,
          currency: "USD",
          verifierId: "vfr-research-v1",
        });

        const result = createTaskFromListing(listing.id, {
          buyerAddress: "0xCharlie",
          input: { topic: "Oracles", depth: "full", tags: ["defi", "price_feed"] },
        });

        expect(result.task.input).toEqual({
          topic: "Oracles",
          depth: "full",
          tags: ["defi", "price_feed"],
        });
      });

      it("stores the payment with correct unlock_rule from listing", () => {
        const agent = createTestAgent("0xAlice");
        const listing = createListing({
          agentId: agent.id,
          ownerAddress: "0xAlice",
          title: "Workflow Listing",
          category: "invoice",
          priceAmount: 200,
          currency: "USD",
          proofRequirement: "workflow_verified",
          verifierId: "vfr-wf-v1",
        });

        const result = createTaskFromListing(listing.id, {
          buyerAddress: "0xBob",
        });

        expect(result.payment.unlock_rule).toBe("workflow_verified");
      });
    });
  });

  // ═══════════════════════════════════════
  // G3: Service Health
  // ═══════════════════════════════════════

  describe("G3: Service Health", () => {
    it("reports marketplace service health", () => {
      const health = getMarketplaceServiceHealth();
      expect(health.healthy).toBe(true);
      expect(health.listingCount).toBe(0);

      const agent = createTestAgent("0xAlice");
      createListing({ agentId: agent.id, ownerAddress: "0xAlice", title: "H1", category: "invoice", priceAmount: 10, currency: "USD", verifierId: "v1" });

      const after = getMarketplaceServiceHealth();
      expect(after.listingCount).toBe(1);
    });
  });
});
