// Rate limiting — RATE_LIMIT_MAX must cap per-IP requests with 429s.
// Env is set before the app module loads because config freezes at import time.
import { afterAll, describe, expect, it } from "vitest";

process.env.RATE_LIMIT_MAX = "3";
process.env.DATABASE_PATH = ":memory:";

const { buildApp } = await import("../src/index.js");
const app = buildApp();
await app.ready();

afterAll(async () => {
  await app.close();
});

describe("rate limiting", () => {
  it("returns 429 with retry-after once the per-minute limit is exceeded", async () => {
    const codes: number[] = [];
    let lastLimited: Awaited<ReturnType<typeof app.inject>> | null = null;

    for (let i = 0; i < 5; i++) {
      const res = await app.inject({ method: "GET", url: "/api/health" });
      codes.push(res.statusCode);
      if (res.statusCode === 429) lastLimited = res;
    }

    expect(codes.slice(0, 3)).toEqual([200, 200, 200]);
    expect(codes.slice(3)).toEqual([429, 429]);
    expect(lastLimited).not.toBeNull();
    expect(Number(lastLimited!.headers["retry-after"])).toBeGreaterThan(0);
    expect(lastLimited!.json()).toMatchObject({ error: "RATE_LIMITED" });
  });

  it("does not leak the limit across distinct client addresses", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/health",
      remoteAddress: "203.0.113.9",
    });
    expect(res.statusCode).toBe(200);
  });
});
