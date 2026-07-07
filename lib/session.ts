const STORAGE_KEY = "sealrail_session_key";
const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "https://api.sealrail.xyz";

type WalletSignatureResponse =
  | { cancelled: true }
  | { cancelled: false; signatureHex: string; signature: Uint8Array };

interface CasperWalletProviderInstance {
  requestConnection(): Promise<boolean>;
  isConnected(): Promise<boolean>;
  getActivePublicKey(): Promise<string>;
  sign(transactionJson: string, signingPublicKeyHex: string): Promise<WalletSignatureResponse>;
}

declare global {
  interface Window {
    CasperWalletProvider?: (options?: { timeout?: number }) => CasperWalletProviderInstance;
  }
}

export const DEMO_OWNER_ADDRESS = "01a3f0000000000000000000000000000000000000000000000000009c2e";
export const DEMO_BUYER_ADDRESS = "0221bf0000000000000000000000000000000000000000000000000004d17";

export type StoredSession = {
  secret: string;
  keyId: string;
  ownerAddress: string;
  prefix: string;
};

function readStored(): StoredSession | null {
  if (typeof window === "undefined") return null;
  const raw = window.sessionStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as StoredSession;
  } catch {
    return null;
  }
}

export function clearSession() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEY);
  window.sessionStorage.removeItem(STORAGE_KEY);
}

export function getSession(): StoredSession | null {
  return readStored();
}

async function isSessionValid(session: StoredSession): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/api/api-keys`, {
      headers: { Authorization: `Bearer ${session.secret}` },
    });
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * Sign-in-with-Casper: connect the wallet, have it sign a real (never
 * broadcast) transaction carrying a server-issued nonce, and verify that
 * signature to mint a wallet-scoped API key. See backend/src/services/wallet-auth.ts
 * for why a real transaction is used instead of the wallet's plain message-signing
 * API (which has no publicly documented byte-level convention to verify against).
 */
async function connectWalletAndSign(): Promise<StoredSession> {
  if (typeof window === "undefined") {
    throw new Error("Wallet connection is only available in the browser.");
  }
  if (!window.CasperWalletProvider) {
    throw new Error("Casper Wallet extension not found. Install it from casperwallet.io, then refresh this page.");
  }

  const provider = window.CasperWalletProvider();
  const connected = await provider.requestConnection();
  if (!connected) {
    throw new Error("Casper Wallet connection was not approved.");
  }

  const publicKey = await provider.getActivePublicKey();

  const challengeRes = await fetch(`${API_BASE}/api/auth/wallet/challenge`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ public_key: publicKey }),
  });
  if (!challengeRes.ok) {
    throw new Error("Could not start wallet sign-in. Try again in a moment.");
  }
  const challenge = (await challengeRes.json()) as { nonce: string; transaction: unknown };

  const signResult = await provider.sign(JSON.stringify(challenge.transaction), publicKey);
  if (signResult.cancelled) {
    throw new Error("Signature request was cancelled in the wallet.");
  }

  const verifyRes = await fetch(`${API_BASE}/api/auth/wallet/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ public_key: publicKey, nonce: challenge.nonce, signature: signResult.signatureHex }),
  });
  if (!verifyRes.ok) {
    const body = await verifyRes.json().catch(() => ({ message: undefined }));
    throw new Error(body.message || "Wallet verification failed.");
  }
  const verified = (await verifyRes.json()) as {
    secret: string;
    key_id: string;
    owner_address: string;
    prefix: string;
  };

  const session: StoredSession = {
    secret: verified.secret,
    keyId: verified.key_id,
    ownerAddress: verified.owner_address,
    prefix: verified.prefix,
  };

  window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  return session;
}

/**
 * Returns a valid session, connecting and verifying the Casper Wallet if
 * none is stored or the stored one is no longer valid. Every write action
 * in the app routes through this - there is no path to a payment-backed
 * action without a wallet-verified session.
 */
export async function ensureSession(): Promise<StoredSession> {
  const existing = readStored();
  if (existing && (await isSessionValid(existing))) return existing;
  clearSession();
  return connectWalletAndSign();
}
