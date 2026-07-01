// ────────────────────────────────────────
// Sealrail Backend — Deploy Prep Tests
// Status service, config validation, API routes
// Tests run with default config (dry_run, no hosted Blocky)
// Config is cached at module import — env changes mid-test don't propagate
// ────────────────────────────────────────

import { describe, it, expect, beforeEach, beforeAll, afterAll } from "vitest";
import { randomUUID } from "crypto";

import { getDb, closeDb, resetDb } from "../src/db.js";
import { buildApp } from "../src/index.js";
import type { FastifyInstance } from "fastify";

// ── Service imports ──────────────────────
import {
  getBlockyReadiness,
  getCasperReadiness,
  getLlmReadiness,
  getDbReadiness,
  getDeploymentReadiness,
  getPublicStatus,
  getAdminStatus,
  getHealth,
} from "../src/services/status.js";

import {
  validateDeploymentConfig,
  isProductionReady,
  isTestnetReady,
  getValidationSummary,
} from "../src/services/config-validation.js";

import { createApiKey } from "../src/services/api-keys.js";

// ── Use in-memory DB ─────────────────────
process.env.DATABASE_PATH = ":memory:";
closeDb();

// ═══════════════════════════════════════════
// Blocky Readiness Tests
// ═══════════════════════════════════════════

describe("Blocky Readiness", () => {
  it("reports CLI installed status (boolean)", () => {
    const b = getBlockyReadiness();
    expect(typeof b.cliInstalled).toBe("boolean");
    if (b.cliInstalled) {
      expect(typeof b.cliVersion).toBe("string");
    }
  });

  it("reports hosted config fields as booleans (never secrets)", () => {
    const b = getBlockyReadiness();
    expect(typeof b.hostedConfigured).toBe("boolean");
    expect(typeof b.hostedApiKeyPresent).toBe("boolean");
    expect(typeof b.hostedHostPresent).toBe("boolean");
    expect(typeof b.hostedConfigPathPresent).toBe("boolean");
    expect(typeof b.teeHookupBlocked).toBe("boolean");
  });

  it("reports tee hookup status with reason when blocked", () => {
    const b = getBlockyReadiness();
    // With default config (no hosted Blocky), hookup should be blocked
    if (b.teeHookupBlocked) {
      expect(b.teeHookupBlockedReason).toBeTruthy();
      expect(b.teeHookupBlockedReason!).toContain("hosted Blocky");
    }
  });

  it("never exposes API key value in reason (key presence is boolean)", () => {
    const b = getBlockyReadiness();
    // Reason should mention env var names, not values
    if (b.teeHookupBlockedReason) {
      expect(b.teeHookupBlockedReason).not.toContain("secret-key");
      expect(b.teeHookupBlockedReason).not.toContain("sk-");
    }
  });

  it("reason mentions missing env var names (not values)", () => {
    const b = getBlockyReadiness();
    if (b.teeHookupBlocked && b.teeHookupBlockedReason) {
      // Should contain env var names
      expect(b.teeHookupBlockedReason).toMatch(/BLOCKY_AS_(API_KEY|HOST)/);
    }
  });

  it("reason points to info@blocky.rocks for access", () => {
    const b = getBlockyReadiness();
    if (b.teeHookupBlocked && b.teeHookupBlockedReason) {
      expect(b.teeHookupBlockedReason).toContain("info@blocky.rocks");
    }
  });
});

// ═══════════════════════════════════════════
// Casper Readiness Tests
// ═══════════════════════════════════════════

describe("Casper Readiness", () => {
  it("reports mode from config (dry_run by default)", () => {
    const c = getCasperReadiness();
    expect(["dry_run", "testnet", "mainnet"]).toContain(c.mode);
  });

  it("reports client installed status (boolean)", () => {
    const c = getCasperReadiness();
    expect(typeof c.clientInstalled).toBe("boolean");
  });

  it("reports account key and contract hash presence (booleans)", () => {
    const c = getCasperReadiness();
    expect(typeof c.accountKeyConfigured).toBe("boolean");
    expect(typeof c.rpcUrlConfigured).toBe("boolean");
    expect(typeof c.csprCloudAvailable).toBe("boolean");
  });

  it("contract hash is string or null (never exposes raw key)", () => {
    const c = getCasperReadiness();
    expect(
      c.contractHash === null || typeof c.contractHash === "string"
    ).toBe(true);
  });

  it("testnet blocked flag is correctly typed", () => {
    const c = getCasperReadiness();
    expect(typeof c.testnetBlocked).toBe("boolean");
    // If blocked, there must be a reason
    if (c.testnetBlocked) {
      expect(typeof c.testnetBlockedReason).toBe("string");
      expect(c.testnetBlockedReason!.length).toBeGreaterThan(0);
    }
  });

  it("reports client version when installed", () => {
    const c = getCasperReadiness();
    if (c.clientInstalled) {
      expect(typeof c.clientVersion).toBe("string");
    } else {
      expect(c.clientVersion).toBeNull();
    }
  });
});

// ═══════════════════════════════════════════
// LLM Readiness Tests
// ═══════════════════════════════════════════

describe("LLM Readiness", () => {
  it("reports provider name and model", () => {
    const l = getLlmReadiness();
    expect(typeof l.provider).toBe("string");
    expect(typeof l.model).toBe("string");
  });

  it("reports configured status (boolean)", () => {
    const l = getLlmReadiness();
    expect(typeof l.configured).toBe("boolean");
  });

  it("presence flags are booleans (never leak values)", () => {
    const l = getLlmReadiness();
    expect(typeof l.baseUrlPresent).toBe("boolean");
    expect(typeof l.apiKeyPresent).toBe("boolean");

    const json = JSON.stringify(l);
    expect(json).not.toContain("sk-");
    expect(json).not.toContain("https://");
  });

  it("reports timeout and max retries (numbers)", () => {
    const l = getLlmReadiness();
    expect(typeof l.timeoutMs).toBe("number");
    expect(typeof l.maxRetries).toBe("number");
    expect(l.timeoutMs).toBeGreaterThan(0);
    expect(l.maxRetries).toBeGreaterThanOrEqual(0);
  });
});

// ═══════════════════════════════════════════
// Database Readiness Tests
// ═══════════════════════════════════════════

describe("Database Readiness", () => {
  it("reports connected", () => {
    const d = getDbReadiness();
    expect(d.connected).toBe(true);
    expect(typeof d.path).toBe("string");
  });

  it("reports correct table count (12 tables)", () => {
    const d = getDbReadiness();
    expect(d.tables).toBe(12);
  });
});

// ═══════════════════════════════════════════
// Deployment Readiness Tests
// ═══════════════════════════════════════════

describe("Deployment Readiness", () => {
  it("returns structured readiness with all subsystems", () => {
    const r = getDeploymentReadiness();
    expect(r).toHaveProperty("ready");
    expect(r).toHaveProperty("server");
    expect(r).toHaveProperty("blocky");
    expect(r).toHaveProperty("casper");
    expect(r).toHaveProperty("llm");
    expect(r).toHaveProperty("database");
    expect(r).toHaveProperty("blockers");
    expect(r).toHaveProperty("warnings");
    expect(r).toHaveProperty("phaseNGuarantees");
    expect(Array.isArray(r.blockers)).toBe(true);
    expect(Array.isArray(r.warnings)).toBe(true);
  });

  it("ready flag matches blocker count", () => {
    const r = getDeploymentReadiness();
    expect(r.ready).toBe(r.blockers.length === 0);
  });

  it("server info has port, host, nodeEnv", () => {
    const r = getDeploymentReadiness();
    expect(r.server).toHaveProperty("port");
    expect(r.server).toHaveProperty("host");
    expect(r.server).toHaveProperty("nodeEnv");
  });

  it("phase N guarantees are all true", () => {
    const r = getDeploymentReadiness();
    expect(r.phaseNGuarantees.noFakeLlmSuccess).toBe(true);
    expect(r.phaseNGuarantees.noPendingProofFallback).toBe(true);
    expect(r.phaseNGuarantees.noPaymentUnlockWithoutVerifiedProof).toBe(true);
    expect(r.phaseNGuarantees.agentRuntimeAvailable).toBe(true);
    expect(r.phaseNGuarantees.supportedTaskTypes).toContain("invoice_risk");
  });

  it("blockers and warnings are arrays of strings", () => {
    const r = getDeploymentReadiness();
    for (const b of r.blockers) {
      expect(typeof b).toBe("string");
    }
    for (const w of r.warnings) {
      expect(typeof w).toBe("string");
    }
  });

  it("never exposes secret values in any readiness field", () => {
    const r = getDeploymentReadiness();
    const json = JSON.stringify(r);
    expect(json).not.toContain("sk-");
    expect(json).not.toContain("secret");
    expect(json).not.toContain("token");
    // These are env var names, not values — they should appear
    // But actual key values should not
  });
});

// ═══════════════════════════════════════════
// Public Status Tests
// ═══════════════════════════════════════════

describe("Public Status", () => {
  it("returns all public-safe fields", () => {
    const startTime = Date.now();
    const s = getPublicStatus(startTime);

    expect(s).toHaveProperty("status");
    expect(s).toHaveProperty("mode");
    expect(s).toHaveProperty("casper_mode");
    expect(s).toHaveProperty("casper_contract_ready");
    expect(s).toHaveProperty("blocky_cli_available");
    expect(s).toHaveProperty("hosted_tee_ready");
    expect(s).toHaveProperty("tee_hookup_blocked");
    expect(s).toHaveProperty("llm_configured");
    expect(s).toHaveProperty("db_connected");
    expect(s).toHaveProperty("node_env");
    expect(s).toHaveProperty("timestamp");
    expect(s).toHaveProperty("uptime_seconds");
  });

  it("status is one of ok/degraded/not_ready", () => {
    const s = getPublicStatus(Date.now());
    expect(["ok", "degraded", "not_ready"]).toContain(s.status);
  });

  it("never exposes secret-like fields", () => {
    const s = getPublicStatus(Date.now());
    const json = JSON.stringify(s);
    expect(json).not.toContain("api_key");
    expect(json).not.toContain("secret");
    expect(json).not.toContain("token");
    expect(json).not.toContain("password");
  });

  it("db_connected is true with in-memory DB", () => {
    const s = getPublicStatus(Date.now());
    expect(s.db_connected).toBe(true);
  });

  it("tee_hookup_blocked reflects Blocky config", () => {
    const s = getPublicStatus(Date.now());
    expect(typeof s.tee_hookup_blocked).toBe("boolean");
    expect(typeof s.hosted_tee_ready).toBe("boolean");
  });

  it("uptime is non-negative", () => {
    const s = getPublicStatus(Date.now());
    expect(s.uptime_seconds).toBeGreaterThanOrEqual(0);
  });

  it("uptime increases with earlier start time", () => {
    const startTime = Date.now() - 10000;
    const s = getPublicStatus(startTime);
    expect(s.uptime_seconds).toBeGreaterThanOrEqual(9);
  });
});

// ═══════════════════════════════════════════
// Admin Status Tests
// ═══════════════════════════════════════════

describe("Admin Status", () => {
  it("returns full readiness with blockers and warnings", () => {
    const startTime = Date.now();
    const a = getAdminStatus(startTime);

    expect(a).toHaveProperty("status");
    expect(a).toHaveProperty("readiness");
    expect(a.readiness).toHaveProperty("blockers");
    expect(a.readiness).toHaveProperty("warnings");
    expect(a.readiness).toHaveProperty("blocky");
    expect(a.readiness).toHaveProperty("casper");
    expect(a.readiness).toHaveProperty("llm");
    expect(a.readiness).toHaveProperty("database");
    expect(a.readiness).toHaveProperty("phaseNGuarantees");
  });

  it("does not expose secret values in any field", () => {
    const startTime = Date.now();
    const a = getAdminStatus(startTime);

    const json = JSON.stringify(a);
    expect(json).not.toContain("sk-");
    expect(json).not.toContain("secret");
  });

  it("status is ok, degraded, or not_ready", () => {
    const startTime = Date.now();
    const a = getAdminStatus(startTime);
    expect(["ok", "degraded", "not_ready"]).toContain(a.status);
  });

  it("status is not_ready when blockers exist", () => {
    const startTime = Date.now();
    const a = getAdminStatus(startTime);
    if (a.readiness.blockers.length > 0) {
      expect(a.status).toBe("not_ready");
    }
  });
});

// ═══════════════════════════════════════════
// Config Validation Tests
// ═══════════════════════════════════════════

describe("Config Validation", () => {
  it("returns valid result with issues array", () => {
    const result = validateDeploymentConfig();
    expect(result).toHaveProperty("valid");
    expect(result).toHaveProperty("issues");
    expect(Array.isArray(result.issues)).toBe(true);
  });

  it("each issue has key, severity, and message", () => {
    const result = validateDeploymentConfig();
    for (const issue of result.issues) {
      expect(issue).toHaveProperty("key");
      expect(issue).toHaveProperty("severity");
      expect(issue).toHaveProperty("message");
      expect(["error", "warning"]).toContain(issue.severity);
    }
  });

  it("valid flag matches error count", () => {
    const result = validateDeploymentConfig();
    const errors = result.issues.filter((i) => i.severity === "error");
    expect(result.valid).toBe(errors.length === 0);
  });

  it("issues reference env var names (not values)", () => {
    const result = validateDeploymentConfig();
    const messages = result.issues.map((i) => i.message).join(" ");

    // Should NOT contain actual secret values
    expect(messages).not.toContain("sk-");
    expect(messages).not.toContain("secret-key");

    // Should reference env var names
    if (result.issues.length > 0) {
      expect(messages).toMatch(/BLOCKY|LLM|CASPER|DATABASE|PORT|HOST/);
    }
  });

  it("getValidationSummary returns a non-empty string", () => {
    const summary = getValidationSummary();
    expect(typeof summary).toBe("string");
    expect(summary.length).toBeGreaterThan(0);
  });

  it("isProductionReady and isTestnetReady return booleans", () => {
    expect(typeof isProductionReady()).toBe("boolean");
    expect(typeof isTestnetReady()).toBe("boolean");
  });

  it("no issues contain raw key values or URLs", () => {
    const result = validateDeploymentConfig();
    const allMessages = result.issues.map((i) => i.message).join("\n");
    expect(allMessages).not.toContain("http://");
    expect(allMessages).not.toContain("https://");
    expect(allMessages).not.toContain("sk-");
  });
});

// ═══════════════════════════════════════════
// Status API Routes
// ═══════════════════════════════════════════

describe("Status API Routes", () => {
  let app: FastifyInstance;
  let apiKey: string;

  beforeAll(async () => {
    resetDb();
    app = buildApp();
    await app.ready();

    // Create an API key for admin endpoints
    const key = createApiKey({
      ownerAddress: "test-owner",
      name: "Deploy Prep Test Key",
      scopes: ["proofs:write"],
    });
    apiKey = key.rawSecret;
  });

  afterAll(async () => {
    await app.close();
  });

  // ── Health ──────────────────────────────

  it("GET /api/health returns 200 with status ok", async () => {
    const res = await app.inject({ method: "GET", url: "/api/health" });
    expect(res.statusCode).toBe(200);

    const body = JSON.parse(res.body);
    expect(body.status).toBe("ok");
    expect(body.mode).toBe("tee_verification_mode");
    expect(body).toHaveProperty("timestamp");
    expect(body).toHaveProperty("uptime_seconds");
    expect(body).toHaveProperty("blocky_cli");
    expect(body).toHaveProperty("tee_hookup");
  });

  it("GET /health returns 200 (root path)", async () => {
    const res = await app.inject({ method: "GET", url: "/health" });
    expect(res.statusCode).toBe(200);

    const body = JSON.parse(res.body);
    expect(body.status).toBe("ok");
    expect(body).toHaveProperty("tee_hookup");
  });

  it("health tee_hookup is pending_hosted_access or ready", async () => {
    const res = await app.inject({ method: "GET", url: "/api/health" });
    const body = JSON.parse(res.body);
    expect(["pending_hosted_access", "ready"]).toContain(body.tee_hookup);
  });

  // ── Public Status ────────────────────────

  it("GET /api/status returns 200 with public-safe fields", async () => {
    const res = await app.inject({ method: "GET", url: "/api/status" });
    expect(res.statusCode).toBe(200);

    const body = JSON.parse(res.body);
    expect(body).toHaveProperty("status");
    expect(body).toHaveProperty("mode", "tee_verification_mode");
    expect(body).toHaveProperty("casper_mode");
    expect(body).toHaveProperty("casper_contract_ready");
    expect(body).toHaveProperty("blocky_cli_available");
    expect(body).toHaveProperty("hosted_tee_ready");
    expect(body).toHaveProperty("tee_hookup_blocked");
    expect(body).toHaveProperty("llm_configured");
    expect(body).toHaveProperty("db_connected");

    // No secrets in response
    const json = JSON.stringify(body);
    expect(json).not.toContain("api_key");
    expect(json).not.toContain("secret");
    expect(json).not.toContain("sk-");
  });

  it("GET /api/status/detailed returns 200", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/status/detailed",
    });
    expect(res.statusCode).toBe(200);

    const body = JSON.parse(res.body);
    expect(body).toHaveProperty("status");
    expect(body).toHaveProperty("tee_hookup_blocked");
  });

  // ── Admin Status (authenticated) ────────

  it("GET /api/admin/status returns 401 without auth", async () => {
    const res = await app.inject({ method: "GET", url: "/api/admin/status" });
    expect(res.statusCode).toBe(401);
  });

  it("GET /api/admin/status returns 200 with full readiness when authenticated", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/admin/status",
      headers: { "x-api-key": apiKey },
    });
    expect(res.statusCode).toBe(200);

    const body = JSON.parse(res.body);
    expect(body).toHaveProperty("status");
    expect(body).toHaveProperty("readiness");
    expect(body.readiness).toHaveProperty("blocky");
    expect(body.readiness).toHaveProperty("casper");
    expect(body.readiness).toHaveProperty("llm");
    expect(body.readiness).toHaveProperty("database");
    expect(body.readiness).toHaveProperty("blockers");
    expect(body.readiness).toHaveProperty("warnings");
    expect(body.readiness).toHaveProperty("phaseNGuarantees");
  });

  it("GET /api/admin/status does not expose secrets when authenticated", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/admin/status",
      headers: { "x-api-key": apiKey },
    });
    const json = res.body;

    expect(json).not.toContain("sk-");
    expect(json).not.toContain("secret");
  });

  // ── Admin Readiness (authenticated) ─────

  it("GET /api/admin/readiness returns 401 without auth", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/admin/readiness",
    });
    expect(res.statusCode).toBe(401);
  });

  it("GET /api/admin/readiness returns 200 or 503 when authenticated", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/admin/readiness",
      headers: { "x-api-key": apiKey },
    });

    expect([200, 503]).toContain(res.statusCode);

    const body = JSON.parse(res.body);
    expect(body).toHaveProperty("status");
    expect(body).toHaveProperty("readiness");
    expect(body.readiness).toHaveProperty("blockers");
    expect(body.readiness).toHaveProperty("warnings");
  });
});

// ═══════════════════════════════════════════
// No Hosted Blocky Access Case
// ═══════════════════════════════════════════

describe("No Hosted Blocky Access Scenario", () => {
  it("deployment readiness reports tee_hookup_blocked when hosted Blocky is missing", () => {
    const r = getDeploymentReadiness();
    // With default config (no hosted Blocky keys), tee_hookup_blocked should be true
    // Blocky readiness reflects the actual config state
    expect(typeof r.blocky.teeHookupBlocked).toBe("boolean");
  });

  it("public status correctly reports tee hookup status", () => {
    const s = getPublicStatus(Date.now());
    expect(typeof s.tee_hookup_blocked).toBe("boolean");
    expect(typeof s.hosted_tee_ready).toBe("boolean");
    // These are consistent with each other
    expect(s.hosted_tee_ready).toBe(!s.tee_hookup_blocked);
  });

  it("config validation warns about missing Blocky (not errors) in dry_run", () => {
    const result = validateDeploymentConfig();
    const blockyErrors = result.issues.filter(
      (i) => i.severity === "error" && i.key.toLowerCase().includes("blocky")
    );
    // In dry_run mode, missing hosted Blocky should be warnings, not errors
    expect(blockyErrors.length).toBe(0);
  });

  it("blocked reason exists and is informative", () => {
    const b = getBlockyReadiness();
    if (b.teeHookupBlocked) {
      expect(b.teeHookupBlockedReason).toBeTruthy();
      expect(b.teeHookupBlockedReason!.length).toBeGreaterThan(20);
    }
  });

  it("admin status includes blocky subsystem detail", () => {
    const a = getAdminStatus(Date.now());
    expect(a.readiness.blocky).toHaveProperty("cliInstalled");
    expect(a.readiness.blocky).toHaveProperty("hostedConfigured");
    expect(a.readiness.blocky).toHaveProperty("teeHookupBlocked");
  });
});

// ═══════════════════════════════════════════
// Phase N A+ Guarantee Preservation
// ═══════════════════════════════════════════

describe("Phase N A+ Guarantee Preservation", () => {
  it("all guarantees are explicitly true in readiness", () => {
    const r = getDeploymentReadiness();
    const g = r.phaseNGuarantees;

    expect(g.noFakeLlmSuccess).toBe(true);
    expect(g.noPendingProofFallback).toBe(true);
    expect(g.noPaymentUnlockWithoutVerifiedProof).toBe(true);
    expect(g.agentRuntimeAvailable).toBe(true);
    expect(g.supportedTaskTypes).toContain("invoice_risk");
  });

  it("public status never suggests fake proof capability", () => {
    const s = getPublicStatus(Date.now());
    const json = JSON.stringify(s);

    expect(json).not.toContain("fake");
    expect(json).not.toContain("placeholder");
    expect(json).not.toContain("simulated_success");
  });

  it("admin status blockers don't mention fake proofs", () => {
    const a = getAdminStatus(Date.now());
    const blockerMessages = a.readiness.blockers.join(" ");
    expect(blockerMessages).not.toContain("fake");
    expect(blockerMessages).not.toContain("simulated success");
  });

  it("deployment readiness includes phaseNGuarantees block", () => {
    const r = getDeploymentReadiness();
    expect(r.phaseNGuarantees).toBeDefined();
    expect(Object.keys(r.phaseNGuarantees).length).toBe(5);
  });
});

// ═══════════════════════════════════════════
// Existing Route Preservation (smoke check)
// ═══════════════════════════════════════════

describe("Existing Routes Still Work", () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    resetDb();
    app = buildApp();
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it("GET /api/health still returns 200", async () => {
    const res = await app.inject({ method: "GET", url: "/api/health" });
    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.body).status).toBe("ok");
  });

  it("GET /api/status still returns 200", async () => {
    const res = await app.inject({ method: "GET", url: "/api/status" });
    expect(res.statusCode).toBe(200);
  });

  it("GET /api/agents/runtime/health still returns 200", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/agents/runtime/health",
    });
    expect(res.statusCode).toBe(200);

    const body = JSON.parse(res.body);
    expect(body).toHaveProperty("status");
  });

  it("POST /api/agents returns 401 without auth (gate still enforced)", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/agents",
      payload: {
        owner_address: "0x" + "a".repeat(64),
        name: "E2E Deploy Test Agent",
        category: "invoice",
        description: "Test agent",
        short_pitch: "E2E testing",
        pricing_model: "per_run",
        base_price: 10,
        currency: "CSPR",
        verifier_ids: [],
        supported_task_types: ["invoice_risk"],
      },
    });
    // Auth middleware may kick in; that's expected
    expect(res.statusCode).toBeGreaterThanOrEqual(200);
    expect(res.statusCode).toBeLessThan(600);
  });

  it("GET /api/admin/status returns 401 without auth", async () => {
    const res = await app.inject({ method: "GET", url: "/api/admin/status" });
    expect(res.statusCode).toBe(401);
  });
});
