// ────────────────────────────────────────
// Sealrail Workflow Routes
// Phase H4: Workflow API endpoints
// Audit fix C1+H2: API key auth on mutation routes, owner from authenticated principal
// ────────────────────────────────────────

import type { FastifyInstance } from "fastify";

import {
  createWorkflow,
  getWorkflow,
  getWorkflowRun,
  getWorkflowRunDetail,
  listWorkflows,
  createWorkflowRun,
  executeWorkflowStep,
  finalizeWorkflowRun,
  transitionWorkflowRun,
  getWorkflowServiceHealth,
} from "../services/workflows.js";
import { requireApiKeyWithScope } from "../middleware/auth.js";
import { API_SCOPES } from "../types.js";
import type { WorkflowStatus, WorkflowStepTemplate } from "../types.js";

// ── Request schemas ──────────────────────

const createWorkflowSchema = {
  type: "object",
  required: ["name", "steps"],
  properties: {
    name: { type: "string", minLength: 1 },
    description: { type: "string" },
    category: { type: "string" },
    steps: {
      type: "array",
      minItems: 1,
      items: {
        type: "object",
        required: ["id", "order", "name", "agent_id", "verifier_id"],
        properties: {
          id: { type: "string", minLength: 1 },
          order: { type: "integer", minimum: 0 },
          name: { type: "string", minLength: 1 },
          agent_id: { type: "string", minLength: 1 },
          verifier_id: { type: "string", minLength: 1 },
          required: { type: "boolean" },
          payment_share_bps: { type: "integer", minimum: 0, maximum: 10000 },
        },
      },
    },
    payment_split_default: { type: "array" },
    status: { type: "string", enum: ["active", "draft"] },
  },
};

const createWorkflowRunSchema = {
  type: "object",
  required: ["buyer_address"],
  properties: {
    buyer_address: { type: "string", minLength: 1 },
  },
};

const executeStepSchema = {
  type: "object",
  required: ["agent_id"],
  properties: {
    agent_id: { type: "string", minLength: 1 },
  },
};

/**
 * Register workflow-related routes on the Fastify instance.
 */
export function registerWorkflowRoutes(app: FastifyInstance): void {
  // ── GET /api/workflows ──────────────────
  app.get<{
    Querystring: {
      category?: string;
      status?: string;
      owner_address?: string;
      limit?: string;
    };
  }>(
    "/api/workflows",
    async (request, reply) => {
      const { category, status, owner_address, limit } = request.query;

      try {
        const workflows = listWorkflows({
          category,
          status: status as WorkflowStatus | "all" | undefined,
          ownerAddress: owner_address,
          limit: limit ? parseInt(limit, 10) : undefined,
        });

        return reply.status(200).send({
          workflows,
          count: workflows.length,
        });
      } catch (err: unknown) {
        request.log.error({ err }, "Failed to list workflows");
        return reply.status(500).send({ error: "LIST_FAILED", message: "Internal server error" });
      }
    }
  );

  // ── POST /api/workflows ─────────────────
  // Create a workflow template. Requires workflows:write scope. Owner from auth key.
  app.post<{
    Body: {
      name: string;
      description?: string;
      category?: string;
      steps: WorkflowStepTemplate[];
      payment_split_default?: Array<Record<string, unknown>>;
      status?: WorkflowStatus;
    };
  }>(
    "/api/workflows",
    {
      schema: { body: createWorkflowSchema },
      preHandler: [requireApiKeyWithScope([API_SCOPES.WORKFLOWS_WRITE])],
    },
    async (request, reply) => {
      const body = request.body;
      const ownerAddress = request.apiKey!.owner_address;

      try {
        const workflow = createWorkflow({
          ownerAddress,
          name: body.name,
          description: body.description,
          category: body.category,
          steps: body.steps,
          paymentSplitDefault: body.payment_split_default as Array<{
            agent_id?: string | null;
            verifier_id?: string | null;
            address: string;
            share_bps: number;
            role: string;
            proof_required?: boolean;
          }> | undefined,
          status: body.status,
        });

        return reply.status(201).send({
          workflow,
          message: "Workflow template created successfully.",
        });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        request.log.error({ err: msg }, "Failed to create workflow");

        if (msg.startsWith("AGENT_NOT_FOUND")) {
          return reply.status(404).send({ error: "NOT_FOUND", message: msg });
        }
        if (msg.startsWith("INVALID")) {
          return reply.status(400).send({ error: "INVALID_REQUEST", message: msg });
        }
        return reply.status(500).send({ error: "CREATE_FAILED", message: "Internal server error" });
      }
    }
  );

  // ── GET /api/workflows/:workflowId ───────
  app.get<{ Params: { workflowId: string } }>(
    "/api/workflows/:workflowId",
    async (request, reply) => {
      const { workflowId } = request.params;

      try {
        const workflow = getWorkflow(workflowId);

        if (!workflow) {
          return reply.status(404).send({
            error: "WORKFLOW_NOT_FOUND",
            message: `No workflow found with id '${workflowId}'`,
          });
        }

        return reply.status(200).send({ workflow });
      } catch (err: unknown) {
        request.log.error({ err, workflowId }, "Failed to get workflow");
        return reply.status(500).send({ error: "GET_FAILED", message: "Internal server error" });
      }
    }
  );

  // ── POST /api/workflows/:workflowId/run ──
  app.post<{
    Params: { workflowId: string };
    Body: {
      buyer_address: string;
    };
  }>(
    "/api/workflows/:workflowId/run",
    {
      schema: { body: createWorkflowRunSchema },
      preHandler: [requireApiKeyWithScope([API_SCOPES.WORKFLOWS_WRITE])],
    },
    async (request, reply) => {
      const { workflowId } = request.params;
      const body = request.body;

      try {
        const run = createWorkflowRun(workflowId, body.buyer_address);

        return reply.status(201).send({
          run,
          message: "Workflow run created.",
        });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        request.log.error({ err: msg, workflowId }, "Failed to create workflow run");

        if (msg === "WORKFLOW_NOT_FOUND") {
          return reply.status(404).send({ error: "NOT_FOUND", message: msg });
        }
        if (msg.startsWith("WORKFLOW_NOT_ACTIVE")) {
          return reply.status(400).send({ error: "INVALID_REQUEST", message: msg });
        }
        return reply.status(500).send({ error: "RUN_CREATE_FAILED", message: "Internal server error" });
      }
    }
  );

  // ── GET /api/workflow-runs/:runId ────────
  app.get<{ Params: { runId: string } }>(
    "/api/workflow-runs/:runId",
    async (request, reply) => {
      const { runId } = request.params;

      try {
        const detail = getWorkflowRunDetail(runId);

        if (!detail.run) {
          return reply.status(404).send({
            error: "RUN_NOT_FOUND",
            message: `No workflow run found with id '${runId}'`,
          });
        }

        return reply.status(200).send(detail);
      } catch (err: unknown) {
        request.log.error({ err, runId }, "Failed to get workflow run");
        return reply.status(500).send({ error: "GET_FAILED", message: "Internal server error" });
      }
    }
  );

  // ── POST /api/workflow-runs/:runId/steps/:stepId/run ──
  app.post<{
    Params: { runId: string; stepId: string };
    Body: {
      agent_id: string;
    };
  }>(
    "/api/workflow-runs/:runId/steps/:stepId/run",
    {
      schema: { body: executeStepSchema },
      preHandler: [requireApiKeyWithScope([API_SCOPES.WORKFLOWS_WRITE])],
    },
    async (request, reply) => {
      const { runId, stepId } = request.params;
      const body = request.body;

      try {
        const result = executeWorkflowStep(runId, stepId, body.agent_id);

        return reply.status(200).send({
          run: result.run,
          step_run: result.stepRun,
          proof: result.proof,
          message: `Step '${stepId}' executed successfully.`,
        });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        request.log.error(
          { err: msg, runId, stepId },
          "Failed to execute workflow step"
        );

        if (msg === "WORKFLOW_RUN_NOT_FOUND") {
          return reply.status(404).send({ error: "NOT_FOUND", message: msg });
        }
        if (msg.startsWith("STEP_NOT_FOUND")) {
          return reply.status(404).send({ error: "NOT_FOUND", message: msg });
        }
        if (msg.startsWith("STEP_ALREADY_EXECUTED")) {
          return reply.status(400).send({ error: "INVALID_REQUEST", message: msg });
        }
        if (msg.startsWith("STEP_ORDER_VIOLATION")) {
          return reply.status(400).send({ error: "ORDER_VIOLATION", message: msg });
        }
        if (msg.startsWith("AGENT_MISMATCH")) {
          return reply.status(403).send({ error: "FORBIDDEN", message: msg });
        }
        if (msg.startsWith("INVALID_RUN_STATE")) {
          return reply.status(400).send({ error: "INVALID_STATE", message: msg });
        }
        return reply.status(500).send({ error: "STEP_FAILED", message: "Internal server error" });
      }
    }
  );

  // ── POST /api/workflow-runs/:runId/finalize ──
  app.post<{ Params: { runId: string } }>(
    "/api/workflow-runs/:runId/finalize",
    {
      preHandler: [requireApiKeyWithScope([API_SCOPES.WORKFLOWS_WRITE])],
    },
    async (request, reply) => {
      const { runId } = request.params;

      try {
        const result = finalizeWorkflowRun(runId);

        return reply.status(200).send({
          run: result.run,
          final_proof: result.finalProof,
          step_proofs: result.stepProofs,
          step_count: result.stepProofs.length,
          message: "Workflow run finalized. All step proofs bundled.",
        });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        request.log.error(
          { err: msg, runId },
          "Failed to finalize workflow run"
        );

        if (msg === "WORKFLOW_RUN_NOT_FOUND") {
          return reply.status(404).send({ error: "NOT_FOUND", message: msg });
        }
        if (msg.startsWith("INVALID_RUN_STATE")) {
          return reply.status(400).send({ error: "INVALID_STATE", message: msg });
        }
        if (msg.startsWith("STEPS_NOT_VERIFIED")) {
          return reply.status(400).send({ error: "NOT_VERIFIED", message: msg });
        }
        if (msg.startsWith("NO_STEP_PROOFS")) {
          return reply.status(400).send({ error: "NO_PROOFS", message: msg });
        }
        return reply.status(500).send({ error: "FINALIZE_FAILED", message: "Internal server error" });
      }
    }
  );

  // ── GET /api/workflows/health ───────────
  // Sanitized public health check (H5).
  app.get("/api/workflows/health", async (_request, reply) => {
    return reply.status(200).send({ healthy: true });
  });
}
