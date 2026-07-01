// ────────────────────────────────────────
// Sealrail Backend — Status Routes
// Public + admin status endpoints with
// comprehensive subsystem readiness
// ────────────────────────────────────────

import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { requireApiKey } from "../middleware/auth.js";
import {
  getPublicStatus,
  getAdminStatus,
  getHealth,
} from "../services/status.js";

/** Track server start time for uptime */
let _startTime: number;

export function setStatusStartTime(ms: number): void {
  _startTime = ms;
}

export function registerStatusRoutes(app: FastifyInstance): void {
  // ── Public health (no auth) ──
  app.get("/api/health", async (_request: FastifyRequest, reply: FastifyReply) => {
    return reply.send(getHealth(_startTime));
  });

  app.get("/health", async (_request: FastifyRequest, reply: FastifyReply) => {
    return reply.send(getHealth(_startTime));
  });

  // ── Public status (sanitized for external consumers) ──
  app.get("/api/status", async (_request: FastifyRequest, reply: FastifyReply) => {
    return reply.send(getPublicStatus(_startTime));
  });

  // ── Detailed status (public — shows read-only readiness without secrets) ──
  app.get("/api/status/detailed", async (_request: FastifyRequest, reply: FastifyReply) => {
    return reply.send(getPublicStatus(_startTime));
  });

  // ── Admin status (authenticated, full detail) ──
  app.get("/api/admin/status", {
    preHandler: [requireApiKey],
  } as never, async (_request: FastifyRequest, reply: FastifyReply) => {
    return reply.send(getAdminStatus(_startTime));
  });

  // ── Admin readiness endpoint (deployment readiness check) ──
  app.get("/api/admin/readiness", {
    preHandler: [requireApiKey],
  } as never, async (_request: FastifyRequest, reply: FastifyReply) => {
    const adminStatus = getAdminStatus(_startTime);

    // Return an appropriate HTTP status based on readiness
    const httpStatus = adminStatus.status === "ok" ? 200
      : adminStatus.status === "degraded" ? 200
      : 503;

    return reply.status(httpStatus).send(adminStatus);
  });
}
