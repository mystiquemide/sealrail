// ────────────────────────────────────────
// Sealrail — HTTP Auth Integration Tests (H3)
// Audit fix: Prove that API key auth protects all mutation routes
// Covers: 401 (missing key), 403 (wrong scope), and schema validation
// ────────────────────────────────────────

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { randomUUID } from "crypto";

import { buildApp } from "../src/index.js";
import { closeDb } from "../src/db.js";
import { createApiKey } from "../src/services/api-keys.js";
import type { FastifyInstance } from "fastify";

// Use in-memory database for tests
process.env.DATABASE_PATH = ":memory:";
process.env.SEALRAIL_SKIP_LISTEN = "1";
closeDb();

let app: FastifyInstance;
let adminKey: string;
let agentWriteKey: string;
let marketplaceWriteKey: string;
let tasksWriteKey: string;
let paymentsWriteKey: string;
let adminOwnerAddress: string;

beforeAll(async () => {
  // Build app first — the DB is initialized during onReady hook
  app = buildApp();
  await app.ready();

  // Now create API keys using the same DB as the app
  adminOwnerAddress = "owner-" + randomUUID().slice(0, 8);

  const admin = createApiKey({
    ownerAddress: adminOwnerAddress,
    name: "Admin Key",
    scopes: ["api_keys:admin", "agents:write", "marketplace:write", "tasks:write", "payments:write", "verifiers:write", "workflows:write"],
  });
  adminKey = admin.rawSecret;

  agentWriteKey = createApiKey({
    ownerAddress: adminOwnerAddress,
    name: "Agent Write Key",
    scopes: ["agents:write"],
  }).rawSecret;

  marketplaceWriteKey = createApiKey({
    ownerAddress: adminOwnerAddress,
    name: "Marketplace Key",
    scopes: ["marketplace:write"],
  }).rawSecret;

  tasksWriteKey = createApiKey({
    ownerAddress: adminOwnerAddress,
    name: "Tasks Key",
    scopes: ["tasks:write"],
  }).rawSecret;

  paymentsWriteKey = createApiKey({
    ownerAddress: adminOwnerAddress,
    name: "Payments Key",
    scopes: ["payments:write"],
  }).rawSecret;
});

afterAll(async () => {
  await app.close();
  closeDb();
});

// ── Helper ───────────────────────────────

function authHeader(key: string) {
  return { authorization: `Bearer ${key}` };
}

// ══════════════════════════════════════════
// Public endpoints (no auth required)
// ══════════════════════════════════════════

describe("HTTP Auth: Public Endpoints", () => {
  it("GET /api/health returns 200 without auth", async () => {
    const res = await app.inject({ method: "GET", url: "/api/health" });
    expect(res.statusCode).toBe(200);
    expect(res.json().status).toBe("ok");
  });

  it("GET /api/status returns 200 without auth (sanitized, H5)", async () => {
    const res = await app.inject({ method: "GET", url: "/api/status" });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    // H5: public status should NOT expose node_env or casper_mode
    expect(body).not.toHaveProperty("node_env");
    expect(body).not.toHaveProperty("casper_mode");
    expect(body).toHaveProperty("status", "ok");
  });

  it("GET /api/agents returns 200 without auth", async () => {
    const res = await app.inject({ method: "GET", url: "/api/agents" });
    expect(res.statusCode).toBe(200);
  });

  it("GET /api/marketplace returns 200 without auth", async () => {
    const res = await app.inject({ method: "GET", url: "/api/marketplace" });
    expect(res.statusCode).toBe(200);
  });

  it("POST /api/api-keys creates key (bootstrap, no auth required)", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/api-keys",
      payload: { name: "Bootstrap Key" },
    });
    expect(res.statusCode).toBe(201);
    expect(res.json().secret).toBeDefined();
  });
});

// ══════════════════════════════════════════
// Auth enforcement: 401 on missing key
// ══════════════════════════════════════════

describe("HTTP Auth: Missing API Key (401)", () => {
  it("POST /api/agents returns 401 without API key", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/agents",
      payload: { name: "Test Agent", category: "invoice" },
    });
    expect(res.statusCode).toBe(401);
  });

  it("PATCH /api/agents/:id returns 401 without API key", async () => {
    const res = await app.inject({
      method: "PATCH",
      url: "/api/agents/fake-id",
      payload: { name: "Updated" },
    });
    expect(res.statusCode).toBe(401);
  });

  it("POST /api/marketplace/listings returns 401 without API key", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/marketplace/listings",
      payload: { agent_id: "a", title: "Test", category: "test", price_amount: 100, currency: "USD", verifier_id: "v" },
    });
    expect(res.statusCode).toBe(401);
  });

  it("POST /api/tasks returns 401 without API key", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/tasks",
      payload: { agent_id: "a", buyer_address: "b", total_amount: 100, currency: "USD" },
    });
    expect(res.statusCode).toBe(401);
  });

  it("POST /api/payments/intents returns 401 without API key", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/payments/intents",
      payload: { buyer_address: "b", total_amount: 100, currency: "USD" },
    });
    expect(res.statusCode).toBe(401);
  });

  it("POST /api/verifiers returns 401 without API key", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/verifiers",
      payload: { name: "Test", task_type: "test", wasm_hash: "hash123" },
    });
    expect(res.statusCode).toBe(401);
  });

  it("POST /api/workflows returns 401 without API key", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/workflows",
      payload: { name: "Test", steps: [{ id: "s1", order: 1, name: "Step 1", agent_id: "a", verifier_id: "v" }] },
    });
    expect(res.statusCode).toBe(401);
  });

  it("POST /api/proofs/verify returns 401 without API key", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/proofs/verify",
      payload: { task_id: "t1", invoice_id: "i1", vendor: "v", buyer: "b", amount_usd: 100, currency: "USD", due_days: 30, line_items: [], ai_suggested_risk: 0 },
    });
    expect(res.statusCode).toBe(401);
  });

  it("DELETE /api/api-keys/:id returns 401 without API key", async () => {
    const res = await app.inject({
      method: "DELETE",
      url: "/api/api-keys/fake-id",
      payload: {},
    });
    expect(res.statusCode).toBe(401);
  });
});

// ══════════════════════════════════════════
// Scope enforcement: 403 on wrong scope
// ══════════════════════════════════════════

describe("HTTP Auth: Wrong Scope (403)", () => {
  it("POST /api/agents with marketplace-only key returns 403", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/agents",
      headers: authHeader(marketplaceWriteKey),
      payload: { name: "Test Agent", category: "invoice" },
    });
    expect(res.statusCode).toBe(403);
  });

  it("POST /api/marketplace/listings with agents-only key returns 403", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/marketplace/listings",
      headers: authHeader(agentWriteKey),
      payload: { agent_id: "a", title: "Test", category: "test", price_amount: 100, currency: "USD", verifier_id: "v" },
    });
    expect(res.statusCode).toBe(403);
  });

  it("POST /api/tasks with payments-only key returns 403", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/tasks",
      headers: authHeader(paymentsWriteKey),
      payload: { agent_id: "a", buyer_address: "b", total_amount: 100, currency: "USD" },
    });
    expect(res.statusCode).toBe(403);
  });
});

// ══════════════════════════════════════════
// Valid auth: 201/200 with correct scope
// ══════════════════════════════════════════

describe("HTTP Auth: Valid Auth (200/201)", () => {
  it("POST /api/agents with admin key succeeds and uses authenticated owner", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/agents",
      headers: authHeader(adminKey),
      payload: { name: "Test Agent", category: "invoice" },
    });
    expect(res.statusCode).toBe(201);
    expect(res.json().agent).toBeDefined();
    expect(res.json().agent.owner_address).toBe(adminOwnerAddress);
  });

  it("POST /api/agents with agents-write key succeeds", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/agents",
      headers: authHeader(agentWriteKey),
      payload: { name: "Agent 2", category: "defi" },
    });
    expect(res.statusCode).toBe(201);
  });

  it("POST /api/tasks with tasks-write key succeeds", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/tasks",
      headers: authHeader(tasksWriteKey),
      payload: { agent_id: "agent-1", buyer_address: "buyer-1", total_amount: 100, currency: "USD" },
    });
    expect(res.statusCode).toBe(201);
  });

  it("GET /api/api-keys with admin key succeeds", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/api-keys",
      headers: authHeader(adminKey),
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().keys).toBeDefined();
  });
});

// ══════════════════════════════════════════
// Admin status (auth-required, H5)
// ══════════════════════════════════════════

describe("HTTP Auth: Admin Status (H5)", () => {
  it("GET /api/admin/status returns 401 without auth", async () => {
    const res = await app.inject({ method: "GET", url: "/api/admin/status" });
    expect(res.statusCode).toBe(401);
  });

  it("GET /api/admin/status with valid API key returns detailed status", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/admin/status",
      headers: authHeader(adminKey),
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    // Admin status includes detailed info (H5: moved from public status)
    expect(body).toHaveProperty("mode");
    expect(body).toHaveProperty("node_env");
    expect(body).toHaveProperty("casper_mode");
  });
});

// ══════════════════════════════════════════
// Schema validation (route boundary coverage)
// ══════════════════════════════════════════

describe("HTTP Auth: Schema Validation", () => {
  it("POST /api/agents with missing required field returns 400", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/agents",
      headers: authHeader(adminKey),
      payload: { name: "Incomplete" }, // missing category
    });
    expect(res.statusCode).toBe(400);
  });

  it("POST /api/tasks with invalid currency returns 400", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/tasks",
      headers: authHeader(tasksWriteKey),
      payload: { agent_id: "a", buyer_address: "b", total_amount: 100, currency: "INVALID" },
    });
    expect(res.statusCode).toBe(400);
  });

  it("PATCH /api/tasks/:id/status with invalid status returns 400", async () => {
    const res = await app.inject({
      method: "PATCH",
      url: "/api/tasks/fake-id/status",
      headers: authHeader(tasksWriteKey),
      payload: { status: "INVALID_STATUS" },
    });
    expect(res.statusCode).toBe(400);
  });
});

// ══════════════════════════════════════════
// Blocker 3: Payment Claim Ownership Tests
// ══════════════════════════════════════════

describe("HTTP Auth: Payment Claim Ownership (Blocker 3)", () => {
  let otherOwnerKey: string;
  let otherOwnerAddress: string;

  beforeAll(async () => {
    // Create an API key with a different owner address
    otherOwnerAddress = "owner-other-" + randomUUID().slice(0, 8);
    otherOwnerKey = createApiKey({
      ownerAddress: otherOwnerAddress,
      name: "Other Owner Key",
      scopes: ["payments:write"],
    }).rawSecret;
  });

  it("POST /api/payments/:id/claim rejects when API key owner does not match recipient address", async () => {
    // First, create a payment with splits as admin (whose owner is adminOwnerAddress)
    const intentRes = await app.inject({
      method: "POST",
      url: "/api/payments/intents",
      headers: authHeader(adminKey),
      payload: { buyer_address: "buyer-claim-test", total_amount: 1000, currency: "USD" },
    });
    expect(intentRes.statusCode).toBe(201);
    const paymentId = intentRes.json().payment_id;

    // Add splits with a recipient whose address matches adminOwnerAddress
    const splitsRes = await app.inject({
      method: "POST",
      url: `/api/payments/${paymentId}/splits`,
      headers: authHeader(adminKey),
      payload: {
        recipients: [
          { address: adminOwnerAddress, share_bps: 10000, role: "primary_agent", proof_required: false },
        ],
      },
    });
    expect(splitsRes.statusCode).toBe(200);

    // Get the payment to find the recipient ID
    const paymentRes = await app.inject({
      method: "GET",
      url: `/api/payments/${paymentId}`,
    });
    expect(paymentRes.statusCode).toBe(200);
    const recipientId = paymentRes.json().payment.recipients[0].id;

    // Unlock the payment first
    await app.inject({
      method: "POST",
      url: `/api/payments/${paymentId}/unlock`,
      headers: authHeader(adminKey),
    });

    // Try to claim with a key whose owner DOES NOT match the recipient address
    const claimRes = await app.inject({
      method: "POST",
      url: `/api/payments/${paymentId}/claim`,
      headers: authHeader(otherOwnerKey),
      payload: { recipient_id: recipientId, address: adminOwnerAddress },
    });

    // Blocker 3: Should reject because otherOwnerAddress !== adminOwnerAddress (recipient address)
    expect(claimRes.statusCode).toBe(403);
    expect(claimRes.json().error).toBe("OWNER_MISMATCH");
  });

  it("POST /api/payments/:id/claim allows claim when API key owner matches recipient address", async () => {
    // Create a payment where the recipient address matches the API key owner
    const intentRes = await app.inject({
      method: "POST",
      url: "/api/payments/intents",
      headers: authHeader(otherOwnerKey),
      payload: { buyer_address: "buyer-claim-ok", total_amount: 500, currency: "USD" },
    });
    expect(intentRes.statusCode).toBe(201);
    const paymentId = intentRes.json().payment_id;

    // Add splits with recipient address matching otherOwnerKey's owner
    const splitsRes = await app.inject({
      method: "POST",
      url: `/api/payments/${paymentId}/splits`,
      headers: authHeader(otherOwnerKey),
      payload: {
        recipients: [
          { address: otherOwnerAddress, share_bps: 10000, role: "primary_agent", proof_required: false },
        ],
      },
    });
    expect(splitsRes.statusCode).toBe(200);

    // Get the payment to find the recipient ID
    const paymentRes = await app.inject({
      method: "GET",
      url: `/api/payments/${paymentId}`,
    });
    expect(paymentRes.statusCode).toBe(200);
    const recipientId = paymentRes.json().payment.recipients[0].id;

    // Unlock first
    await app.inject({
      method: "POST",
      url: `/api/payments/${paymentId}/unlock`,
      headers: authHeader(otherOwnerKey),
    });

    // Claim with the correct key (owner matches recipient)
    const claimRes = await app.inject({
      method: "POST",
      url: `/api/payments/${paymentId}/claim`,
      headers: authHeader(otherOwnerKey),
      payload: { recipient_id: recipientId, address: otherOwnerAddress },
    });

    // Should succeed because otherOwnerKey.owner_address === recipient.address
    expect(claimRes.statusCode).toBe(200);
    expect(claimRes.json().recipient_id).toBe(recipientId);
  });

  it("POST /api/payments/:id/claim with correct address string but wrong key owner returns 403", async () => {
    // Create payment under admin
    const intentRes = await app.inject({
      method: "POST",
      url: "/api/payments/intents",
      headers: authHeader(adminKey),
      payload: { buyer_address: "buyer-wrong-owner", total_amount: 100, currency: "USD" },
    });
    expect(intentRes.statusCode).toBe(201);
    const paymentId = intentRes.json().payment_id;

    // Add splits with admin's address
    const splitsRes = await app.inject({
      method: "POST",
      url: `/api/payments/${paymentId}/splits`,
      headers: authHeader(adminKey),
      payload: {
        recipients: [
          { address: adminOwnerAddress, share_bps: 10000, role: "primary_agent", proof_required: false },
        ],
      },
    });
    expect(splitsRes.statusCode).toBe(200);

    const paymentRes = await app.inject({
      method: "GET",
      url: `/api/payments/${paymentId}`,
    });
    const recipientId = paymentRes.json().payment.recipients[0].id;

    // Unlock
    await app.inject({
      method: "POST",
      url: `/api/payments/${paymentId}/unlock`,
      headers: authHeader(adminKey),
    });

    // Try to claim with other key — correct address string, wrong owner
    const claimRes = await app.inject({
      method: "POST",
      url: `/api/payments/${paymentId}/claim`,
      headers: authHeader(otherOwnerKey),
      payload: { recipient_id: recipientId, address: adminOwnerAddress },
    });

    // Blocker 3: Address string match is not enough — owner must match
    expect(claimRes.statusCode).toBe(403);
    expect(claimRes.json().error).toBe("OWNER_MISMATCH");
  });
});
