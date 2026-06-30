// ────────────────────────────────────────
// Sealrail Backend — Fastify Server Entry
// Phase A: Foundation with health check
// ────────────────────────────────────────

import Fastify from "fastify";
import { config } from "./config.js";
import { getDb, closeDb } from "./db.js";
import { registerProofRoutes } from "./routes/proof.js";
import { registerTaskRoutes } from "./routes/tasks.js";

// Load dotenv before anything reads config
try {
  const dotenv = await import("dotenv");
  dotenv.default.config();
} catch {
  // dotenv not available — use process.env directly
}

const app = Fastify({
  logger: {
    level: config.nodeEnv === "production" ? "warn" : "info",
  },
});

// Initialize database on startup
const startTime = Date.now();
let dbInitialized = false;

app.addHook("onReady", async () => {
  try {
    getDb();
    dbInitialized = true;
    app.log.info("Database initialized — all 12 tables migrated");
  } catch (err) {
    app.log.error({ err }, "Database initialization failed");
  }
});

// ── Health endpoint (plan §2 verification gate) ──
app.get("/api/health", async (_request, reply) => {
  return reply.send({
    status: "ok",
    mode: config.teeVerificationMode,
    timestamp: new Date().toISOString(),
    uptime_seconds: Math.floor((Date.now() - startTime) / 1000),
  });
});

// Also register bare /health for plan verification gate compatibility
app.get("/health", async (_request, reply) => {
  return reply.send({
    status: "ok",
    mode: config.teeVerificationMode,
    timestamp: new Date().toISOString(),
    uptime_seconds: Math.floor((Date.now() - startTime) / 1000),
  });
});

// ── Status endpoint ──
app.get("/api/status", async (_request, reply) => {
  return reply.send({
    status: "ok",
    db_connected: dbInitialized,
    mode: config.teeVerificationMode,
    node_env: config.nodeEnv,
    casper_mode: config.casperMode,
    timestamp: new Date().toISOString(),
  });
});

// ── Proof routes (Phase C: TEE verification) ──
registerProofRoutes(app);

// ── Task routes (Phase D: Casper anchoring) ──
registerTaskRoutes(app);

// ── Graceful shutdown ──
const signals: NodeJS.Signals[] = ["SIGINT", "SIGTERM"];
for (const signal of signals) {
  process.on(signal, async () => {
    app.log.info(`Received ${signal} — shutting down`);
    closeDb();
    await app.close();
    process.exit(0);
  });
}

// ── Start server ──
try {
  await app.listen({ port: config.port, host: config.host });
  app.log.info(
    `Sealrail backend running at http://${config.host}:${config.port} — mode: ${config.teeVerificationMode}`
  );
} catch (err) {
  app.log.fatal({ err }, "Failed to start server");
  closeDb();
  process.exit(1);
}

export default app;
