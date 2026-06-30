// ────────────────────────────────────────
// Sealrail Agent Routes
// Phase F2: Agent API endpoints
// GET /api/agents, GET /api/agents/:agentId, POST /api/agents,
// PATCH /api/agents/:agentId, GET /api/agents/:agentId/reputation,
// GET /api/agents/:agentId/proofs
// Phase F3: POST /api/agents/:agentId/sync — Casper registration sync
// ────────────────────────────────────────

import type { FastifyInstance } from "fastify";

import {
  createAgent,
  getAgent,
  listAgents,
  updateAgent,
  getAgentReputation,
  getAgentProofs,
  syncAgentToCasper,
  getAgentServiceHealth,
} from "../services/agents.js";
import type { AgentCategory, AgentStatus, AgentPricingModel, Currency } from "../types.js";

// ── Request schemas ──────────────────────

const createAgentSchema = {
  type: "object",
  required: ["owner_address", "name", "category"],
  properties: {
    owner_address: { type: "string", minLength: 1 },
    name: { type: "string", minLength: 1 },
    category: {
      type: "string",
      enum: ["invoice", "defi", "research", "compliance", "custom"],
    },
    description: { type: "string" },
    short_pitch: { type: "string" },
    pricing_model: {
      type: "string",
      enum: ["fixed", "per_run", "workflow_split"],
    },
    base_price: { type: "number", minimum: 0 },
    currency: { type: "string", enum: ["CSPR", "USD"] },
    verifier_ids: { type: "array", items: { type: "string" } },
    supported_task_types: { type: "array", items: { type: "string" } },
  },
};

const updateAgentSchema = {
  type: "object",
  required: ["owner_address"],
  properties: {
    owner_address: { type: "string", minLength: 1 },
    name: { type: "string", minLength: 1 },
    slug: { type: "string" },
    category: {
      type: "string",
      enum: ["invoice", "defi", "research", "compliance", "custom"],
    },
    description: { type: "string" },
    short_pitch: { type: "string" },
    pricing_model: {
      type: "string",
      enum: ["fixed", "per_run", "workflow_split"],
    },
    base_price: { type: "number", minimum: 0 },
    currency: { type: "string", enum: ["CSPR", "USD"] },
    verifier_ids: { type: "array", items: { type: "string" } },
    supported_task_types: { type: "array", items: { type: "string" } },
    status: { type: "string", enum: ["active", "paused", "draft"] },
  },
};

/**
 * Register agent-related routes on the Fastify instance.
 */
export function registerAgentRoutes(app: FastifyInstance): void {
  // ── GET /api/agents ─────────────────────
  // List all agents with optional filters.
  app.get<{
    Querystring: {
      category?: string;
      status?: string;
      owner_address?: string;
    };
  }>(
    "/api/agents",
    async (request, reply) => {
      const { category, status, owner_address } = request.query;

      try {
        const agents = listAgents({
          category: category as AgentCategory | undefined,
          status: status as AgentStatus | undefined,
          ownerAddress: owner_address,
        });

        return reply.status(200).send({
          agents,
          count: agents.length,
        });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        request.log.error({ err: msg }, "Failed to list agents");
        return reply.status(500).send({ error: "LIST_FAILED", message: msg });
      }
    }
  );

  // ── GET /api/agents/:agentId ────────────
  // Get a single agent profile.
  app.get<{ Params: { agentId: string } }>(
    "/api/agents/:agentId",
    async (request, reply) => {
      const { agentId } = request.params;

      const agent = getAgent(agentId);
      if (!agent) {
        return reply.status(404).send({
          error: "AGENT_NOT_FOUND",
          message: `No agent found with id '${agentId}'`,
        });
      }

      return reply.status(200).send({ agent });
    }
  );

  // ── POST /api/agents ────────────────────
  // Register a new agent.
  app.post<{
    Body: {
      owner_address: string;
      name: string;
      category: AgentCategory;
      description?: string;
      short_pitch?: string;
      pricing_model?: AgentPricingModel;
      base_price?: number;
      currency?: Currency;
      verifier_ids?: string[];
      supported_task_types?: string[];
    };
  }>(
    "/api/agents",
    { schema: { body: createAgentSchema } },
    async (request, reply) => {
      const body = request.body;

      try {
        const agent = createAgent({
          ownerAddress: body.owner_address,
          name: body.name,
          category: body.category,
          description: body.description,
          shortPitch: body.short_pitch,
          pricingModel: body.pricing_model,
          basePrice: body.base_price,
          currency: body.currency,
          verifierIds: body.verifier_ids,
          supportedTaskTypes: body.supported_task_types,
        });

        return reply.status(201).send({
          agent,
          message: "Agent registered successfully.",
        });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        request.log.error({ err: msg }, "Failed to create agent");

        if (msg.startsWith("INVALID")) {
          return reply.status(400).send({ error: "INVALID_REQUEST", message: msg });
        }
        return reply.status(500).send({ error: "CREATE_FAILED", message: msg });
      }
    }
  );

  // ── PATCH /api/agents/:agentId ──────────
  // Update an agent's mutable fields. Owner auth required.
  app.patch<{
    Params: { agentId: string };
    Body: {
      owner_address: string;
      name?: string;
      slug?: string;
      category?: AgentCategory;
      description?: string;
      short_pitch?: string;
      pricing_model?: AgentPricingModel;
      base_price?: number;
      currency?: Currency;
      verifier_ids?: string[];
      supported_task_types?: string[];
      status?: AgentStatus;
    };
  }>(
    "/api/agents/:agentId",
    { schema: { body: updateAgentSchema } },
    async (request, reply) => {
      const { agentId } = request.params;
      const body = request.body;

      try {
        const agent = updateAgent(agentId, body.owner_address, {
          name: body.name,
          slug: body.slug,
          category: body.category,
          description: body.description,
          shortPitch: body.short_pitch,
          pricingModel: body.pricing_model,
          basePrice: body.base_price,
          currency: body.currency,
          verifierIds: body.verifier_ids,
          supportedTaskTypes: body.supported_task_types,
          status: body.status,
        });

        return reply.status(200).send({
          agent,
          message: "Agent updated successfully.",
        });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        request.log.error({ err: msg, agentId }, "Failed to update agent");

        if (msg === "AGENT_NOT_FOUND") {
          return reply.status(404).send({ error: "NOT_FOUND", message: msg });
        }
        if (msg.startsWith("NOT_OWNER")) {
          return reply.status(403).send({ error: "FORBIDDEN", message: msg });
        }
        if (msg.startsWith("INVALID") || msg.startsWith("SLUG_TAKEN")) {
          return reply.status(400).send({ error: "INVALID_REQUEST", message: msg });
        }
        return reply.status(500).send({ error: "UPDATE_FAILED", message: msg });
      }
    }
  );

  // ── GET /api/agents/:agentId/reputation ──
  // Get agent reputation foundation data (computed from real records).
  app.get<{ Params: { agentId: string } }>(
    "/api/agents/:agentId/reputation",
    async (request, reply) => {
      const { agentId } = request.params;

      try {
        const reputation = getAgentReputation(agentId);

        return reply.status(200).send({
          agent_id: agentId,
          reputation,
        });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);

        if (msg === "AGENT_NOT_FOUND") {
          return reply.status(404).send({ error: "NOT_FOUND", message: msg });
        }
        return reply.status(500).send({ error: "REPUTATION_FAILED", message: msg });
      }
    }
  );

  // ── GET /api/agents/:agentId/proofs ─────
  // Get proof history for a given agent.
  app.get<{ Params: { agentId: string } }>(
    "/api/agents/:agentId/proofs",
    async (request, reply) => {
      const { agentId } = request.params;

      try {
        const proofs = getAgentProofs(agentId);

        return reply.status(200).send({
          agent_id: agentId,
          proofs,
          count: proofs.length,
        });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);

        if (msg === "AGENT_NOT_FOUND") {
          return reply.status(404).send({ error: "NOT_FOUND", message: msg });
        }
        return reply.status(500).send({ error: "PROOFS_FAILED", message: msg });
      }
    }
  );

  // ── POST /api/agents/:agentId/sync ──────
  // Phase F3: Sync agent registration to Casper Network.
  app.post<{ Params: { agentId: string } }>(
    "/api/agents/:agentId/sync",
    async (request, reply) => {
      const { agentId } = request.params;

      try {
        const result = await syncAgentToCasper(agentId);

        return reply.status(200).send({
          agent_id: result.agentId,
          registration_hash: result.registrationHash,
          deploy_hash: result.deployHash,
          mode: result.mode,
          message: `Agent synced to Casper in ${result.mode} mode.`,
        });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        request.log.error({ err: msg, agentId }, "Failed to sync agent to Casper");

        if (msg === "AGENT_NOT_FOUND") {
          return reply.status(404).send({ error: "NOT_FOUND", message: msg });
        }
        return reply.status(500).send({ error: "SYNC_FAILED", message: msg });
      }
    }
  );

  // ── GET /api/agents/health ──────────────
  // Agent service health check.
  app.get("/api/agents/health", async (_request, reply) => {
    const health = getAgentServiceHealth();
    return reply.status(200).send(health);
  });
}
