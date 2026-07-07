// ────────────────────────────────────────
// Sealrail Casper Wallet Authentication
// Sign-in-with-Casper: the wallet signs a real (never-broadcast) native
// transfer transaction carrying a server-issued nonce. Verification uses
// casper-js-sdk's own PublicKey.verifySignature against the transaction's
// protocol-level hash, so there is no reliance on any undocumented wallet
// message-signing convention.
// ────────────────────────────────────────

import { randomBytes } from "crypto";
import pkg from "casper-js-sdk";
import { config } from "../config.js";

const { PublicKey, makeCsprTransferTransaction, isValidPublicKey } = pkg as unknown as {
  PublicKey: {
    fromHex(hex: string): { verifySignature(message: Uint8Array, sig: Uint8Array): boolean };
  };
  makeCsprTransferTransaction: (params: {
    senderPublicKeyHex: string;
    recipientPublicKeyHex: string;
    transferAmount: string;
    paymentAmount: string;
    chainName: string;
    memo: string;
    casperNetworkApiVersion: string;
  }) => { hash: { toHex(): string }; toJSON(): unknown };
  isValidPublicKey: (key: string) => boolean;
};

const CHALLENGE_TTL_MS = 5 * 60 * 1000;
// Placeholder transfer amount. This transaction is never broadcast to the
// network - it exists only as a signed authentication artifact - so the
// amount has no financial meaning.
const PLACEHOLDER_TRANSFER_AMOUNT = "2500000000";
const PLACEHOLDER_PAYMENT_AMOUNT = "100000000";

interface Challenge {
  nonce: string;
  transactionHashHex: string;
  expiresAt: number;
  used: boolean;
}

const challenges = new Map<string, Challenge>();

function pruneExpired(): void {
  const now = Date.now();
  for (const [key, challenge] of challenges) {
    if (now >= challenge.expiresAt) challenges.delete(key);
  }
}

export class WalletAuthError extends Error {
  code: string;
  constructor(code: string, message: string) {
    super(message);
    this.code = code;
  }
}

export interface WalletChallenge {
  nonce: string;
  transaction: unknown;
  expiresInSeconds: number;
}

/**
 * Build a real (never-broadcast) native-transfer transaction carrying a
 * fresh nonce as its memo, and store the transaction's hash so it can be
 * checked against the signature returned by the wallet.
 */
export function createWalletChallenge(publicKeyHex: string): WalletChallenge {
  if (!publicKeyHex || !isValidPublicKey(publicKeyHex)) {
    throw new WalletAuthError("INVALID_PUBLIC_KEY", "Provide a valid Casper public key hex string.");
  }

  pruneExpired();

  const nonce = randomBytes(16).toString("hex");
  const transaction = makeCsprTransferTransaction({
    senderPublicKeyHex: publicKeyHex,
    recipientPublicKeyHex: publicKeyHex,
    transferAmount: PLACEHOLDER_TRANSFER_AMOUNT,
    paymentAmount: PLACEHOLDER_PAYMENT_AMOUNT,
    chainName: config.casperChainName,
    memo: nonce,
    casperNetworkApiVersion: "2.0.0",
  });

  const expiresAt = Date.now() + CHALLENGE_TTL_MS;
  challenges.set(publicKeyHex, {
    nonce,
    transactionHashHex: transaction.hash.toHex(),
    expiresAt,
    used: false,
  });

  return {
    nonce,
    transaction: transaction.toJSON(),
    expiresInSeconds: CHALLENGE_TTL_MS / 1000,
  };
}

/**
 * Verify that the wallet holding `publicKeyHex` actually signed the
 * challenge transaction for `nonce`. Throws WalletAuthError on any failure;
 * returns silently on success and marks the challenge as used (single use).
 */
export function verifyWalletChallenge(publicKeyHex: string, nonce: string, signatureHex: string): void {
  const challenge = challenges.get(publicKeyHex);

  if (!challenge) {
    throw new WalletAuthError("CHALLENGE_NOT_FOUND", "No pending challenge for this public key. Request a new one.");
  }
  if (challenge.used) {
    throw new WalletAuthError("CHALLENGE_USED", "This challenge has already been used. Request a new one.");
  }
  if (Date.now() >= challenge.expiresAt) {
    challenges.delete(publicKeyHex);
    throw new WalletAuthError("CHALLENGE_EXPIRED", "This challenge has expired. Request a new one.");
  }
  if (challenge.nonce !== nonce) {
    throw new WalletAuthError("NONCE_MISMATCH", "Nonce does not match the pending challenge.");
  }

  let publicKey;
  try {
    publicKey = PublicKey.fromHex(publicKeyHex);
  } catch {
    throw new WalletAuthError("INVALID_PUBLIC_KEY", "Provide a valid Casper public key hex string.");
  }

  const cleanSignatureHex = signatureHex.trim().replace(/^0x/i, "");
  let signatureBytes: Buffer;
  try {
    signatureBytes = Buffer.from(cleanSignatureHex, "hex");
    if (signatureBytes.length === 0) throw new Error("empty");
  } catch {
    throw new WalletAuthError("INVALID_SIGNATURE", "Signature is not valid hex.");
  }

  const hashBytes = Buffer.from(challenge.transactionHashHex, "hex");

  let valid = false;
  try {
    valid = publicKey.verifySignature(hashBytes, signatureBytes);
  } catch {
    valid = false;
  }

  if (!valid) {
    throw new WalletAuthError("INVALID_SIGNATURE", "Signature does not match the challenge transaction.");
  }

  challenge.used = true;
}
