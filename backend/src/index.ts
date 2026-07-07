// ────────────────────────────────────────
// Sealrail Backend - Fastify Server Entry
// Phase A: Foundation with health check
// Audit fix: C1+H2 - extracted buildApp() factory for testing + auth wiring
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
import { registerIntegrationRoutes } from "./routes/integrations.js";
import { registerStatusRoutes, setStatusStartTime } from "./routes/status.js";
import { startCsprCloudHealthProbe } from "./services/cspr-health-cache.js";
import { requireApiKey } from "./middleware/auth.js";
import { validateDeploymentConfig, getValidationSummary } from "./services/config-validation.js";
import { getPublicStatus } from "./services/status.js";

// NOTE: `config` is frozen when config.js is first imported, which happens
// during the static imports above - before this line runs. Env loading for
// the server therefore happens in the npm scripts via --env-file-if-exists,
// which Node applies before any module executes. The dotenv call below runs
// too late to affect `config`; it remains only as a fallback for the few
// call-time process.env reads (SEALRAIL_SKIP_LISTEN, BKY_AS_AVAILABLE, tee
// child-process env) when the entry point is invoked directly without flags.
try {
  const dotenv = await import("dotenv");
  dotenv.default.config();
} catch {
  // dotenv not available - use process.env directly
}

/**
 * Build the Fastify app instance with all routes registered.
 * Does NOT call listen() - callers can use app.inject() for testing
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

  app.addHook("onRequest", async (_request, reply) => {
    reply.header("x-content-type-options", "nosniff");
    reply.header("x-frame-options", "DENY");
    reply.header("referrer-policy", "strict-origin-when-cross-origin");
    reply.header("permissions-policy", "camera=(), microphone=(), geolocation=(), payment=()");
    reply.header(
      "content-security-policy",
      "default-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'"
    );
  });

  // Fixed-window per-IP rate limiter as a plain onRequest hook. A hook (unlike
  // @fastify/rate-limit's onRoute mechanism) covers every route regardless of
  // plugin/route registration order in this synchronous factory.
  if (config.rateLimitMax > 0) {
    const WINDOW_MS = 60_000;
    const hits = new Map<string, { count: number; resetAt: number }>();
    app.addHook("onRequest", async (request, reply) => {
      const now = Date.now();
      if (hits.size > 5_000) {
        for (const [ip, entry] of hits) {
          if (now >= entry.resetAt) hits.delete(ip);
        }
      }
      const entry = hits.get(request.ip);
      if (!entry || now >= entry.resetAt) {
        hits.set(request.ip, { count: 1, resetAt: now + WINDOW_MS });
        return;
      }
      entry.count += 1;
      if (entry.count > config.rateLimitMax) {
        reply.header("retry-after", String(Math.ceil((entry.resetAt - now) / 1000)));
        return reply.code(429).send({
          error: "RATE_LIMITED",
          message: "Too many requests from this address. Try again in a moment.",
        });
      }
    });
  }

  // Track lifecycle state
  let dbInitialized = false;
  const startTime = Date.now();
  setStatusStartTime(startTime);

  app.addHook("onReady", async () => {
    try {
      getDb();
      dbInitialized = true;
      app.log.info("Database initialized - all 12 tables migrated");
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
  // Delegates to status service - no duplicate inline logic
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
  registerIntegrationRoutes(app);

  return app;
}

/**
 * Start the server on the configured port/host.
 */
/**
 * Bootstrap Casper key file from CASPER_SECRET_KEY env var (Railway secret).
 * Railway cannot persist files across deploys, so we store the key as a
 * secret variable and write it to disk on every cold start.
 */
async function bootstrapCasperKey(): Promise<void> {
  const secretKey = process.env.CASPER_SECRET_KEY;
  const keyPath = process.env.CASPER_ACCOUNT_KEY_PATH;
  if (!secretKey || !keyPath) return;

  try {
    const { writeFileSync, existsSync, mkdirSync, statSync } = await import("node:fs");
    const { dirname } = await import("node:path");

    // Only write if the file is missing or empty
    let needsWrite = true;
    try {
      needsWrite = !existsSync(keyPath) || statSync(keyPath).size === 0;
    } catch {
      needsWrite = true;
    }

    if (needsWrite) {
      mkdirSync(dirname(keyPath), { recursive: true });
      writeFileSync(keyPath, secretKey, { mode: 0o600 });
      console.log(`Casper key bootstrapped to ${keyPath} (${secretKey.length} bytes)`);
    }
  } catch (err) {
    console.error("Failed to bootstrap Casper key file:", err);
    throw err;
  }
}

export async function startServer() {
  await bootstrapCasperKey();

  const app = buildApp();

  const signals: NodeJS.Signals[] = ["SIGINT", "SIGTERM"];
  for (const signal of signals) {
    process.on(signal, async () => {
      app.log.info(`Received ${signal} - shutting down`);
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
    `Sealrail backend running at http://${config.host}:${config.port} - mode: ${config.teeVerificationMode}`
  );

  // Start CSPR.cloud health probe (background, non-blocking)
  startCsprCloudHealthProbe();

  // One-line config-state summary so a misconfigured start is impossible to miss
  const llmConfigured = Boolean(config.llmApiBaseUrl && config.llmApiKey);
  app.log.info(
    `Config state: llm_configured=${llmConfigured} llm_model=${config.llmModel} casper_mode=${config.casperMode} contract_hash_set=${Boolean(config.casperContractHash)}`
  );
  if (!llmConfigured) {
    try {
      const { readFileSync } = await import("node:fs");
      const envFile = readFileSync(new URL("../.env", import.meta.url), "utf8");
      if (/^LLM_API_KEY=.+/m.test(envFile)) {
        app.log.warn(
          "backend/.env defines LLM_API_KEY but it was NOT loaded - config froze before env vars were set. " +
            "Start the server via `npm run dev` or `npm start` (they pass --env-file-if-exists=.env), " +
            "or export the variables before launching."
        );
      }
    } catch {
      // no .env file - defaults are intentional
    }
  }

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
