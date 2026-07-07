// ────────────────────────────────────────
// Sealrail - Casper Wallet Auth Tests
// Exercises the real HTTP routes end-to-end with a real generated Casper
// keypair (both Ed25519 and Secp256k1) signing the actual challenge
// transaction via casper-js-sdk, the same library the wallet extension
// relies on - this proves the sign -> hash -> verify contract holds, not
// just that this module agrees with itself.
// ────────────────────────────────────────

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import pkg from "casper-js-sdk";
import { buildApp } from "../src/index.js";
import { closeDb } from "../src/db.js";
import type { FastifyInstance } from "fastify";

const { PrivateKey, KeyAlgorithm } = pkg as unknown as {
  PrivateKey: {
    generate(algorithm: number): {
      publicKey: { toHex(): string };
      signAndAddAlgorithmBytes(msg: Uint8Array): Uint8Array;
    };
  };
  KeyAlgorithm: { ED25519: number; SECP256K1: number };
};

process.env.DATABASE_PATH = ":memory:";
process.env.SEALRAIL_SKIP_LISTEN = "1";
closeDb();

let app: FastifyInstance;

beforeAll(async () => {
  app = buildApp();
  await app.ready();
});

afterAll(async () => {
  await app.close();
});

function hexToBytes(hex: string): Uint8Array {
  return Uint8Array.from(Buffer.from(hex, "hex"));
}

async function fullLogin(algorithm: number) {
  const key = PrivateKey.generate(algorithm);
  const publicKeyHex = key.publicKey.toHex();

  const challengeRes = await app.inject({
    method: "POST",
    url: "/api/auth/wallet/challenge",
    payload: { public_key: publicKeyHex },
  });
  expect(challengeRes.statusCode).toBe(200);
  const challenge = challengeRes.json() as { nonce: string; transaction: { hash: string } };

  // The wallet signs the transaction's hash, exactly as TransactionV1.sign() does.
  const hashBytes = hexToBytes(challenge.transaction.hash);
  const signature = key.signAndAddAlgorithmBytes(hashBytes);
  const signatureHex = Buffer.from(signature).toString("hex");

  const verifyRes = await app.inject({
    method: "POST",
    url: "/api/auth/wallet/verify",
    payload: { public_key: publicKeyHex, nonce: challenge.nonce, signature: signatureHex },
  });

  return { publicKeyHex, challenge, signatureHex, verifyRes };
}

describe("Casper wallet auth", () => {
  it("verifies a real Ed25519 wallet signature and mints a working API key", async () => {
    const { publicKeyHex, verifyRes } = await fullLogin(KeyAlgorithm.ED25519);

    expect(verifyRes.statusCode).toBe(200);
    const body = verifyRes.json() as { secret: string; owner_address: string };
    expect(body.owner_address).toBe(publicKeyHex);
    expect(typeof body.secret).toBe("string");
    expect(body.secret.length).toBeGreaterThan(10);

    // The minted key should actually authenticate against a protected route.
    const listRes = await app.inject({
      method: "GET",
      url: "/api/api-keys",
      headers: { authorization: `Bearer ${body.secret}` },
    });
    expect(listRes.statusCode).toBe(200);
    expect(listRes.json().owner_address).toBe(publicKeyHex);
  });

  it("verifies a real Secp256k1 wallet signature", async () => {
    const { verifyRes } = await fullLogin(KeyAlgorithm.SECP256K1);
    expect(verifyRes.statusCode).toBe(200);
  });

  it("rejects a signature from the wrong keypair", async () => {
    const key = PrivateKey.generate(KeyAlgorithm.ED25519);
    const impostor = PrivateKey.generate(KeyAlgorithm.ED25519);
    const publicKeyHex = key.publicKey.toHex();

    const challengeRes = await app.inject({
      method: "POST",
      url: "/api/auth/wallet/challenge",
      payload: { public_key: publicKeyHex },
    });
    const challenge = challengeRes.json() as { nonce: string; transaction: { hash: string } };
    const hashBytes = hexToBytes(challenge.transaction.hash);
    const wrongSignature = impostor.signAndAddAlgorithmBytes(hashBytes);

    const verifyRes = await app.inject({
      method: "POST",
      url: "/api/auth/wallet/verify",
      payload: {
        public_key: publicKeyHex,
        nonce: challenge.nonce,
        signature: Buffer.from(wrongSignature).toString("hex"),
      },
    });

    expect(verifyRes.statusCode).toBe(400);
    expect(verifyRes.json().error).toBe("INVALID_SIGNATURE");
  });

  it("rejects reuse of an already-consumed challenge (replay protection)", async () => {
    const { publicKeyHex, challenge, signatureHex } = await fullLogin(KeyAlgorithm.ED25519);

    const replayRes = await app.inject({
      method: "POST",
      url: "/api/auth/wallet/verify",
      payload: { public_key: publicKeyHex, nonce: challenge.nonce, signature: signatureHex },
    });

    expect(replayRes.statusCode).toBe(401);
    expect(replayRes.json().error).toBe("CHALLENGE_USED");
  });

  it("rejects a nonce that doesn't match the pending challenge", async () => {
    const key = PrivateKey.generate(KeyAlgorithm.ED25519);
    const publicKeyHex = key.publicKey.toHex();

    const challengeRes = await app.inject({
      method: "POST",
      url: "/api/auth/wallet/challenge",
      payload: { public_key: publicKeyHex },
    });
    const challenge = challengeRes.json() as { nonce: string; transaction: { hash: string } };
    const hashBytes = hexToBytes(challenge.transaction.hash);
    const signature = key.signAndAddAlgorithmBytes(hashBytes);

    const verifyRes = await app.inject({
      method: "POST",
      url: "/api/auth/wallet/verify",
      payload: {
        public_key: publicKeyHex,
        nonce: "0".repeat(32),
        signature: Buffer.from(signature).toString("hex"),
      },
    });

    expect(verifyRes.statusCode).toBe(400);
    expect(verifyRes.json().error).toBe("NONCE_MISMATCH");
  });

  it("rejects verification with no prior challenge", async () => {
    const key = PrivateKey.generate(KeyAlgorithm.ED25519);
    const publicKeyHex = key.publicKey.toHex();

    const verifyRes = await app.inject({
      method: "POST",
      url: "/api/auth/wallet/verify",
      payload: { public_key: publicKeyHex, nonce: "a".repeat(32), signature: "00".repeat(65) },
    });

    expect(verifyRes.statusCode).toBe(401);
    expect(verifyRes.json().error).toBe("CHALLENGE_NOT_FOUND");
  });

  it("rejects a malformed public key on challenge", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/auth/wallet/challenge",
      payload: { public_key: "not-a-real-key" },
    });
    expect(res.statusCode).toBe(400);
    expect(res.json().error).toBe("INVALID_PUBLIC_KEY");
  });
});

describe("wallet auth gates the public demo endpoint", () => {
  it("rejects an unauthenticated demo run", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/demo/invoice-proof",
      payload: { agent_id: "nonexistent-agent-id", buyer_address: "demo-buyer", total_amount: 100, currency: "USD" },
    });
    expect(res.statusCode).toBe(401);
  });

  it("accepts a wallet-verified key past the auth gate (downstream failure is a separate concern)", async () => {
    const { verifyRes } = await fullLogin(KeyAlgorithm.ED25519);
    const secret = (verifyRes.json() as { secret: string }).secret;

    const res = await app.inject({
      method: "POST",
      url: "/api/demo/invoice-proof",
      headers: { authorization: `Bearer ${secret}` },
      payload: { agent_id: "nonexistent-agent-id", buyer_address: "demo-buyer", total_amount: 100, currency: "USD" },
    });

    // Not gated by auth - a nonexistent agent id fails downstream (404), a
    // distinct failure mode from "you never proved wallet ownership" (401).
    expect(res.statusCode).not.toBe(401);
  });
});
