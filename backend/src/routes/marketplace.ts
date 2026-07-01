// ────────────────────────────────────────
// Sealrail Marketplace Routes
// Phase G3: Marketplace API endpoints
// Audit fix C1+H2: API key auth required on mutations, owner from authenticated principal
// ────────────────────────────────────────

import type { FastifyInstance } from "fastify";

import {
  createListing,
  getListing,
  getListingDetail,
  listListings,
  updateListing,
  createTaskFromListing,
  getMarketplaceServiceHealth,
} from "../services/marketplace.js";
import { requireApiKeyWithScope } from "../middleware/auth.js";
import { API_SCOPES } from "../types.js";
import type { ListingStatus, Currency } from "../types.js";

// ── Request schemas ──────────────────────

const createListingSchema = {
  type: "object",
  required: ["agent_id", "title", "category", "price_amount", "currency", "verifier_id"],
  properties: {
    agent_id: { type: "string", minLength: 1 },
    title: { type: "string", minLength: 1 },
    category: { type: "string", minLength: 1 },
    summary: { type: "string" },
    price_amount: { type: "number", minimum: 0 },
    currency: { type: "string", enum: ["CSPR", "USD"] },
    proof_requirement: { type: "string" },
    verifier_id: { type: "string", minLength: 1 },
  },
};

const updateListingSchema = {
  type: "object",
  properties: {
    title: { type: "string", minLength: 1 },
    category: { type: "string" },
    summary: { type: "string" },
    price_amount: { type: "number", minimum: 0 },
    currency: { type: "string", enum: ["CSPR", "USD"] },
    status: { type: "string", enum: ["live", "paused", "draft"] },
  },
};

const createTaskFromListingSchema = {
  type: "object",
  required: ["buyer_address"],
  properties: {
    buyer_address: { type: "string", minLength: 1 },
    input: { type: "object" },
  },
};

/**
 * Register marketplace-related routes on the Fastify instance.
 */
export function registerMarketplaceRoutes(app: FastifyInstance): void {
  // ── GET /api/marketplace ─────────────────
  app.get<{
    Querystring: {
      category?: string;
      status?: string;
      owner_address?: string;
      agent_id?: string;
      limit?: string;
    };
  }>(
    "/api/marketplace",
    async (request, reply) => {
      const { category, status, owner_address, agent_id, limit } = request.query;

      try {
        const listings = listListings({
          category,
          status: status as ListingStatus | "all" | undefined,
          ownerAddress: owner_address,
          agentId: agent_id,
          limit: limit ? parseInt(limit, 10) : undefined,
        });

        return reply.status(200).send({
          listings,
          count: listings.length,
        });
      } catch (err: unknown) {
        request.log.error({ err }, "Failed to list marketplace listings");
        return reply.status(500).send({ error: "LIST_FAILED", message: "Internal server error" });
      }
    }
  );

  // ── GET /api/marketplace/:listingId ──────
  app.get<{ Params: { listingId: string } }>(
    "/api/marketplace/:listingId",
    async (request, reply) => {
      const { listingId } = request.params;

      try {
        const detail = getListingDetail(listingId);

        if (!detail.listing) {
          return reply.status(404).send({
            error: "LISTING_NOT_FOUND",
            message: `No listing found with id '${listingId}'`,
          });
        }

        return reply.status(200).send(detail);
      } catch (err: unknown) {
        request.log.error({ err, listingId }, "Failed to get listing detail");
        return reply.status(500).send({ error: "GET_FAILED", message: "Internal server error" });
      }
    }
  );

  // ── POST /api/marketplace/listings ───────
  // Requires API key with marketplace:write scope. Owner from authenticated key.
  app.post<{
    Body: {
      agent_id: string;
      title: string;
      category: string;
      summary?: string;
      price_amount: number;
      currency: Currency;
      proof_requirement?: string;
      verifier_id: string;
    };
  }>(
    "/api/marketplace/listings",
    {
      schema: { body: createListingSchema },
      preHandler: [requireApiKeyWithScope([API_SCOPES.MARKETPLACE_WRITE])],
    },
    async (request, reply) => {
      const body = request.body;
      const ownerAddress = request.apiKey!.owner_address;

      try {
        const listing = createListing({
          agentId: body.agent_id,
          ownerAddress,
          title: body.title,
          category: body.category,
          summary: body.summary,
          priceAmount: body.price_amount,
          currency: body.currency,
          proofRequirement: body.proof_requirement,
          verifierId: body.verifier_id,
        });

        return reply.status(201).send({
          listing,
          message: "Listing created successfully.",
        });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        request.log.error({ err: msg }, "Failed to create listing");

        if (msg.startsWith("AGENT_NOT_FOUND")) {
          return reply.status(404).send({ error: "NOT_FOUND", message: msg });
        }
        if (msg.startsWith("NOT_OWNER")) {
          return reply.status(403).send({ error: "FORBIDDEN", message: msg });
        }
        if (msg.startsWith("INVALID")) {
          return reply.status(400).send({ error: "INVALID_REQUEST", message: msg });
        }
        return reply.status(500).send({ error: "CREATE_FAILED", message: "Internal server error" });
      }
    }
  );

  // ── PATCH /api/marketplace/listings/:listingId ──
  // Requires API key with marketplace:write scope. Owner from authenticated key.
  app.patch<{
    Params: { listingId: string };
    Body: {
      title?: string;
      category?: string;
      summary?: string;
      price_amount?: number;
      currency?: Currency;
      status?: ListingStatus;
    };
  }>(
    "/api/marketplace/listings/:listingId",
    {
      schema: { body: updateListingSchema },
      preHandler: [requireApiKeyWithScope([API_SCOPES.MARKETPLACE_WRITE])],
    },
    async (request, reply) => {
      const { listingId } = request.params;
      const body = request.body;
      const ownerAddress = request.apiKey!.owner_address;

      try {
        const listing = updateListing(listingId, ownerAddress, {
          title: body.title,
          category: body.category,
          summary: body.summary,
          priceAmount: body.price_amount,
          currency: body.currency,
          status: body.status,
        });

        return reply.status(200).send({
          listing,
          message: "Listing updated successfully.",
        });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        request.log.error({ err: msg, listingId }, "Failed to update listing");

        if (msg === "LISTING_NOT_FOUND") {
          return reply.status(404).send({ error: "NOT_FOUND", message: msg });
        }
        if (msg.startsWith("NOT_OWNER")) {
          return reply.status(403).send({ error: "FORBIDDEN", message: msg });
        }
        if (msg.startsWith("INVALID")) {
          return reply.status(400).send({ error: "INVALID_REQUEST", message: msg });
        }
        return reply.status(500).send({ error: "UPDATE_FAILED", message: "Internal server error" });
      }
    }
  );

  // ── POST /api/marketplace/:listingId/tasks ──
  // Requires API key with tasks:write scope.
  app.post<{
    Params: { listingId: string };
    Body: {
      buyer_address: string;
      input?: Record<string, unknown>;
    };
  }>(
    "/api/marketplace/:listingId/tasks",
    {
      schema: { body: createTaskFromListingSchema },
      preHandler: [requireApiKeyWithScope([API_SCOPES.TASKS_WRITE])],
    },
    async (request, reply) => {
      const { listingId } = request.params;
      const body = request.body;

      try {
        const result = createTaskFromListing(listingId, {
          buyerAddress: body.buyer_address,
          input: body.input,
        });

        return reply.status(201).send({
          task: result.task,
          payment: result.payment,
          listing: {
            id: result.listing.id,
            title: result.listing.title,
            price_amount: result.listing.price_amount,
            currency: result.listing.currency,
          },
          message: "Task created from marketplace listing.",
        });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        request.log.error({ err: msg, listingId }, "Failed to create task from listing");

        if (msg === "LISTING_NOT_FOUND") {
          return reply.status(404).send({ error: "NOT_FOUND", message: msg });
        }
        if (msg.startsWith("LISTING_NOT_LIVE")) {
          return reply.status(400).send({ error: "INVALID_REQUEST", message: msg });
        }
        return reply.status(500).send({ error: "TASK_CREATE_FAILED", message: "Internal server error" });
      }
    }
  );

  // ── GET /api/marketplace/health ──────────
  // Sanitized public health check (H5).
  app.get("/api/marketplace/health", async (_request, reply) => {
    const health = getMarketplaceServiceHealth();
    return reply.status(200).send({
      healthy: true,
    });
  });
}
