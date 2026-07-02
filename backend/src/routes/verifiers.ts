// ────────────────────────────────────────
// Sealrail Verifier Template Routes
// Phase L4: REST API for verifier templates
// Audit fix C1+H2: API key auth required on mutations, owner from authenticated principal
// ────────────────────────────────────────

import type { FastifyInstance } from "fastify";
import {
  createVerifier,
  getVerifier,
  listVerifiers,
  updateVerifier,
  uploadVerifier,
  testVerifier,
  getVerifierServiceHealth,
} from "../services/verifiers.js";
import { requireApiKeyWithScope } from "../middleware/auth.js";
import { API_SCOPES } from "../types.js";

// ── Request schemas ──────────────────────

const createVerifierSchema = {
  type: "object",
  required: ["name", "task_type", "wasm_hash"],
  properties: {
    name: { type: "string", minLength: 1 },
    description: { type: "string" },
    task_type: { type: "string", minLength: 1 },
    input_schema: { type: "object" },
    output_schema: { type: "object" },
    wasm_hash: { type: "string", minLength: 1 },
    wasm_file_url: { type: "string" },
    mode_support: {
      type: "array",
      items: { type: "string", enum: ["tee_verification_mode", "hosted_tee"] },
    },
    status: { type: "string", enum: ["draft", "active"] },
  },
};

const uploadVerifierSchema = {
  type: "object",
  required: ["name", "task_type"],
  properties: {
    name: { type: "string", minLength: 1 },
    description: { type: "string" },
    task_type: { type: "string", minLength: 1 },
    input_schema: { type: "object" },
    output_schema: { type: "object" },
    wasm_content: { type: "string" },
    wasm_hash: { type: "string" },
    wasm_file_url: { type: "string" },
    mode_support: {
      type: "array",
      items: { type: "string", enum: ["tee_verification_mode", "hosted_tee"] },
    },
    status: { type: "string", enum: ["draft", "active"] },
  },
};

const updateVerifierSchema = {
  type: "object",
  properties: {
    name: { type: "string", minLength: 1 },
    description: { type: "string" },
    task_type: { type: "string", minLength: 1 },
    input_schema: { type: "object" },
    output_schema: { type: "object" },
    wasm_hash: { type: "string" },
    wasm_file_url: { type: "string" },
    mode_support: {
      type: "array",
      items: { type: "string", enum: ["tee_verification_mode", "hosted_tee"] },
    },
    status: { type: "string", enum: ["draft", "active", "deprecated"] },
  },
};

const testVerifierSchema = {
  type: "object",
  required: ["input"],
  properties: {
    input: { type: "object" },
  },
};

/**
 * Register verifier template routes on the Fastify instance.
 */
export function registerVerifierRoutes(app: FastifyInstance): void {
  // ── GET /api/verifiers ──────────────────
  app.get<{
    Querystring: {
      status?: string;
      task_type?: string;
      owner_address?: string;
    };
  }>(
    "/api/verifiers",
    async (request, reply) => {
      try {
        const { status, task_type, owner_address } = request.query;
        const verifiers = listVerifiers({
          status,
          taskType: task_type,
          ownerAddress: owner_address,
        });

        return reply.status(200).send({
          verifiers,
          count: verifiers.length,
        });
      } catch (err: unknown) {
        request.log.error({ err }, "Failed to list verifiers");
        return reply.status(500).send({ error: "LIST_FAILED", message: "Internal server error" });
      }
    },
  );

  // ── GET /api/verifiers/:verifierId ───────
  app.get<{
    Params: { verifierId: string };
  }>(
    "/api/verifiers/:verifierId",
    async (request, reply) => {
      const { verifierId } = request.params;

      try {
        const verifier = getVerifier(verifierId);

        if (!verifier) {
          return reply.status(404).send({
            error: "NOT_FOUND",
            message: `Verifier '${verifierId}' not found`,
          });
        }

        return reply.status(200).send({ verifier });
      } catch (err: unknown) {
        request.log.error({ err, verifierId }, "Failed to get verifier");
        return reply.status(500).send({ error: "GET_FAILED", message: "Internal server error" });
      }
    },
  );

  // ── POST /api/verifiers ─────────────────
  // Requires API key with verifiers:write scope. Owner from authenticated key.
  app.post<{
    Body: {
      name: string;
      description?: string;
      task_type: string;
      input_schema?: Record<string, unknown>;
      output_schema?: Record<string, unknown>;
      wasm_hash: string;
      wasm_file_url?: string;
      mode_support?: string[];
      status?: string;
    };
  }>(
    "/api/verifiers",
    {
      schema: { body: createVerifierSchema },
      preHandler: [requireApiKeyWithScope([API_SCOPES.VERIFIERS_WRITE])],
    },
    async (request, reply) => {
      const body = request.body;
      const ownerAddress = request.apiKey!.owner_address;

      try {
        const verifier = createVerifier({
          ownerAddress,
          name: body.name,
          description: body.description,
          taskType: body.task_type,
          inputSchema: body.input_schema,
          outputSchema: body.output_schema,
          wasmHash: body.wasm_hash,
          wasmFileUrl: body.wasm_file_url,
          modeSupport: body.mode_support as
            | ("tee_verification_mode" | "hosted_tee")[]
            | undefined,
          status: body.status as "draft" | "active" | undefined,
        });

        return reply.status(201).send({
          verifier,
          message: "Verifier template registered successfully.",
        });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        request.log.error({ err: msg }, "Failed to create verifier");

        if (
          msg.startsWith("INVALID_") ||
          msg.startsWith("DUPLICATE_")
        ) {
          return reply.status(400).send({ error: "INVALID_REQUEST", message: msg });
        }
        return reply.status(500).send({ error: "CREATE_FAILED", message: "Internal server error" });
      }
    },
  );

  // ── POST /api/verifiers/upload ───────────
  // Requires API key with verifiers:write scope. Owner from authenticated key.
  app.post<{
    Body: {
      name: string;
      description?: string;
      task_type: string;
      input_schema?: Record<string, unknown>;
      output_schema?: Record<string, unknown>;
      wasm_content?: string;
      wasm_hash?: string;
      wasm_file_url?: string;
      mode_support?: string[];
      status?: string;
    };
  }>(
    "/api/verifiers/upload",
    {
      schema: { body: uploadVerifierSchema },
      preHandler: [requireApiKeyWithScope([API_SCOPES.VERIFIERS_WRITE])],
    },
    async (request, reply) => {
      const body = request.body;
      const ownerAddress = request.apiKey!.owner_address;

      try {
        const verifier = uploadVerifier({
          ownerAddress,
          name: body.name,
          description: body.description,
          taskType: body.task_type,
          inputSchema: body.input_schema,
          outputSchema: body.output_schema,
          wasmContent: body.wasm_content,
          wasmHash: body.wasm_hash,
          wasmFileUrl: body.wasm_file_url,
          modeSupport: body.mode_support as
            | ("tee_verification_mode" | "hosted_tee")[]
            | undefined,
          status: body.status as "draft" | "active" | undefined,
        });

        return reply.status(201).send({
          verifier,
          message: "Verifier template registered with WASM upload.",
        });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        request.log.error({ err: msg }, "Failed to upload verifier");

        if (
          msg.startsWith("INVALID_") ||
          msg.startsWith("DUPLICATE_") ||
          msg.startsWith("WASM_HASH_MISMATCH") ||
          msg.startsWith("MISSING_WASM")
        ) {
          return reply.status(400).send({
            error: "INVALID_REQUEST",
            message: msg,
          });
        }
        return reply.status(500).send({ error: "UPLOAD_FAILED", message: "Internal server error" });
      }
    },
  );

  // ── PATCH /api/verifiers/:verifierId ─────
  // Requires API key with verifiers:write scope. Owner from authenticated key.
  app.patch<{
    Params: { verifierId: string };
    Body: {
      name?: string;
      description?: string;
      task_type?: string;
      input_schema?: Record<string, unknown>;
      output_schema?: Record<string, unknown>;
      wasm_hash?: string;
      wasm_file_url?: string;
      mode_support?: string[];
      status?: string;
    };
  }>(
    "/api/verifiers/:verifierId",
    {
      schema: { body: updateVerifierSchema },
      preHandler: [requireApiKeyWithScope([API_SCOPES.VERIFIERS_WRITE])],
    },
    async (request, reply) => {
      const { verifierId } = request.params;
      const body = request.body;
      const ownerAddress = request.apiKey!.owner_address;

      try {
        const verifier = updateVerifier(verifierId, ownerAddress, {
          name: body.name,
          description: body.description,
          taskType: body.task_type,
          inputSchema: body.input_schema,
          outputSchema: body.output_schema,
          wasmHash: body.wasm_hash,
          wasmFileUrl: body.wasm_file_url,
          modeSupport: body.mode_support as
            | ("tee_verification_mode" | "hosted_tee")[]
            | undefined,
          status: body.status as
            | "draft"
            | "active"
            | "deprecated"
            | undefined,
        });

        return reply.status(200).send({
          verifier,
          message: "Verifier template updated successfully.",
        });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        request.log.error(
          { err: msg, verifierId },
          "Failed to update verifier",
        );

        if (msg === "VERIFIER_NOT_FOUND") {
          return reply.status(404).send({ error: "NOT_FOUND", message: msg });
        }
        if (msg.startsWith("NOT_OWNER")) {
          return reply.status(403).send({ error: "FORBIDDEN", message: msg });
        }
        if (
          msg.startsWith("INVALID_") ||
          msg.startsWith("DUPLICATE_")
        ) {
          return reply.status(400).send({
            error: "INVALID_REQUEST",
            message: msg,
          });
        }
        return reply.status(500).send({ error: "UPDATE_FAILED", message: "Internal server error" });
      }
    },
  );

  // ── POST /api/verifiers/:verifierId/test ──
  app.post<{
    Params: { verifierId: string };
    Body: {
      input: Record<string, unknown>;
    };
  }>(
    "/api/verifiers/:verifierId/test",
    { schema: { body: testVerifierSchema } },
    async (request, reply) => {
      const { verifierId } = request.params;
      const body = request.body;

      try {
        const result = testVerifier(verifierId, { input: body.input });

        return reply.status(200).send({
          result,
          message: result.valid
            ? "Test passed - input validated against verifier schema."
            : "Test failed - input does not match verifier schema.",
        });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        request.log.error(
          { err: msg, verifierId },
          "Failed to test verifier",
        );

        if (msg === "VERIFIER_NOT_FOUND") {
          return reply.status(404).send({ error: "NOT_FOUND", message: msg });
        }
        if (msg === "VERIFIER_DEPRECATED") {
          return reply.status(400).send({
            error: "VERIFIER_DEPRECATED",
            message: msg,
          });
        }
        if (msg.startsWith("INVALID_TEST_INPUT")) {
          return reply.status(400).send({
            error: "INVALID_REQUEST",
            message: msg,
          });
        }
        return reply.status(500).send({ error: "TEST_FAILED", message: "Internal server error" });
      }
    },
  );

  // ── GET /api/verifiers/health ────────────
  // Sanitized public health check (H5).
  app.get("/api/verifiers/health", async (_request, reply) => {
    return reply.status(200).send({ healthy: true });
  });
}
