// ────────────────────────────────────────
// Sealrail Backend — Fastify Server Entry
// Phase A: Foundation with health check
// Audit fix: C1+H2 — extracted buildApp() factory for testing + auth wiring
// ────────────────────────────────────────

import Fastify from "fastify";
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
import { requireApiKey } from "./middleware/auth.js";

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

  // Track lifecycle state
  let dbInitialized = false;
  const startTime = Date.now();

  app.addHook("onReady", async () => {
    try {
      getDb();
      dbInitialized = true;
      app.log.info("Database initialized — all 12 tables migrated");
    } catch (err) {
      app.log.error({ err }, "Database initialization failed");
    }
  });

  // ── Health endpoint (public) ──
  app.get("/api/health", async (_request, reply) => {
    return reply.send({
      status: "ok",
      mode: config.teeVerificationMode,
      timestamp: new Date().toISOString(),
      uptime_seconds: Math.floor((Date.now() - startTime) / 1000),
    });
  });

  app.get("/health", async (_request, reply) => {
    return reply.send({
      status: "ok",
      mode: config.teeVerificationMode,
      timestamp: new Date().toISOString(),
      uptime_seconds: Math.floor((Date.now() - startTime) / 1000),
    });
  });

  // ── Status endpoint (public, sanitized per H5) ──
  app.get("/api/status", async (_request, reply) => {
    return reply.send({
      status: "ok",
      db_connected: dbInitialized,
      timestamp: new Date().toISOString(),
    });
  });

  // ── Admin status (authenticated, detailed per H5) ──
  app.get("/api/admin/status", {
    preHandler: [requireApiKey],
  } as never, async (_request, reply) => {
    return reply.send({
      status: "ok",
      db_connected: dbInitialized,
      mode: config.teeVerificationMode,
      node_env: config.nodeEnv,
      casper_mode: config.casperMode,
      timestamp: new Date().toISOString(),
    });
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
