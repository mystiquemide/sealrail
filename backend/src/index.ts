// ────────────────────────────────────────
// Sealrail Backend — Fastify Server Entry
// Phase A: Foundation with health check
// Audit fix: C1+H2 — extracted buildApp() factory for testing + auth wiring
// Deploy prep: Status routes with comprehensive subsystem readiness
// ────────────────────────────────────────

import Fastify from "fastify";
import cors from "@fastify/cors";
import { config } from "./config.js";
import { getDb, closeDb } from "./db.js";
import { registerProofRoutes } from "./routes/proof.js";
import { registerTaskRoutes } from "./routes/tasks.js";
import { registerPaymentRoutes } from "./routes/payments.js";
import { registerAgentRoutes } from "./routes/agents.js";
import { registerMarketplaceRoutes } from "./routes/marketplace.js";
import { registerWorkflowRoutes } from "./routes/workflows.js";
import { registerApiKeyRoutes } from "./routes/api-keys.js";
import { registerVerifierRoutes } from "./routes/verifiers.js";
import { registerAgentRuntimeRoutes } from "./routes/agent-runtime.js";
import { registerStatusRoutes, setStatusStartTime } from "./routes/status.js";
import { requireApiKey } from "./middleware/auth.js";
import { validateDeploymentConfig, getValidationSummary } from "./services/config-validation.js";
import { getPublicStatus } from "./services/status.js";

// Load dotenv before anything reads config
try {
  const dotenv = await import("dotenv");
  dotenv.default.config();
} catch {
  // dotenv not available — use process.env directly
}

/**
 * Build the Fastify app instance with all routes registered.
 * Does NOT call listen() — callers can use app.inject() for testing
 * or start the server with startServer().
 */
export function buildApp() {
  const app = Fastify({
    logger: {
      level: config.nodeEnv === "production" ? "warn" : "info",
    },
  });

  app.register(cors, {
    origin: config.frontendOrigin.split(",").map((o) => o.trim()),
    methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "x-api-key"],
  });

  // Track lifecycle state
  let dbInitialized = false;
  const startTime = Date.now();
  setStatusStartTime(startTime);

  app.addHook("onReady", async () => {
    try {
      getDb();
      dbInitialized = true;
      app.log.info("Database initialized — all 12 tables migrated");
    } catch (err) {
      app.log.error({ err }, "Database initialization failed");
    }

    // Run deployment config validation on startup
    const validationSummary = getValidationSummary();
    if (validationSummary.includes("error")) {
      app.log.warn(validationSummary);
    } else {
      app.log.info(validationSummary);
    }
  });

  // ── Health endpoint (public) ──
  // Delegates to status service — no duplicate inline logic
  app.get("/api/health", async (_request, reply) => {
    const { getHealth } = await import("./services/status.js");
    return reply.send(getHealth(startTime));
  });

  app.get("/health", async (_request, reply) => {
    const { getHealth } = await import("./services/status.js");
    return reply.send(getHealth(startTime));
  });

  // ── Status endpoints (sanitized, no secrets) ──
  app.get("/api/status", async (_request, reply) => {
    return reply.send(getPublicStatus(startTime));
  });

  // ── Detailed status (public) ──
  app.get("/api/status/detailed", async (_request, reply) => {
    return reply.send(getPublicStatus(startTime));
  });

  // ── Admin status (authenticated, full detail) ──
  app.get("/api/admin/status", {
    preHandler: [requireApiKey],
  } as never, async (_request, reply) => {
    const { getAdminStatus } = await import("./services/status.js");
    return reply.send(getAdminStatus(startTime));
  });

  // ── Admin deployment readiness (authenticated) ──
  app.get("/api/admin/readiness", {
    preHandler: [requireApiKey],
  } as never, async (_request, reply) => {
    const { getAdminStatus } = await import("./services/status.js");
    const adminStatus = getAdminStatus(startTime);

    const httpStatus = adminStatus.status === "ok" ? 200
      : adminStatus.status === "degraded" ? 200
      : 503;

    return reply.status(httpStatus).send(adminStatus);
  });

  // ── Route registration ──
  registerProofRoutes(app);
  registerTaskRoutes(app);
  registerPaymentRoutes(app);
  registerAgentRoutes(app);
  registerMarketplaceRoutes(app);
  registerWorkflowRoutes(app);
  registerApiKeyRoutes(app);
  registerVerifierRoutes(app);
  registerAgentRuntimeRoutes(app);

  return app;
}

/**
 * Start the server on the configured port/host.
 */
export async function startServer() {
  const app = buildApp();

  const signals: NodeJS.Signals[] = ["SIGINT", "SIGTERM"];
  for (const signal of signals) {
    process.on(signal, async () => {
      app.log.info(`Received ${signal} — shutting down`);
      closeDb();
      await app.close();
      process.exit(0);
    });
  }

  // Log deployment readiness at startup
  const validationSummary = getValidationSummary();
  app.log.info(`Config validation:\n${validationSummary}`);

  await app.listen({ port: config.port, host: config.host });
  app.log.info(
    `Sealrail backend running at http://${config.host}:${config.port} — mode: ${config.teeVerificationMode}`
  );

  return app;
}

// Auto-start when run directly (not imported for testing)
const isMainModule = process.argv[1]?.endsWith("index.ts") || process.argv[1]?.endsWith("index.js");
if (isMainModule && process.env.SEALRAIL_SKIP_LISTEN !== "1") {
  try {
    await startServer();
  } catch (err) {
    console.error("Failed to start server:", err);
    closeDb();
    process.exit(1);
  }
}
