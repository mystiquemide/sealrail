const STORAGE_KEY = "sealrail_session_key";

export const DEMO_OWNER_ADDRESS = "01a3f0000000000000000000000000000000000000000000000000009c2e";
export const DEMO_BUYER_ADDRESS = "0221bf0000000000000000000000000000000000000000000000000004d17";

const ALL_SCOPES = [
  "agents:write",
  "marketplace:write",
  "tasks:write",
  "payments:write",
  "verifiers:write",
  "workflows:write",
  "api_keys:admin",
  "proofs:write",
];

export type StoredSession = {
  secret: string;
  keyId: string;
  ownerAddress: string;
  prefix: string;
};

function readStored(): StoredSession | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as StoredSession;
  } catch {
    return null;
  }
}

function writeStored(session: StoredSession) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}

export function clearSession() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEY);
}

export function getSession(): StoredSession | null {
  return readStored();
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

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
 * Bootstraps a full-scope API key on first use (POST /api/api-keys accepts
 * no auth for the very first key). Real multi-user auth is out of scope for this
 * release — every browser session acts as the same default owner identity.
 *
 * Validates the cached secret against the backend before trusting it — if the
 * backend's database was reset (e.g. a fresh local dev DB), a stale cached
 * secret would otherwise silently fail auth and fall back to an anonymous
 * "bootstrap" owner server-side instead of erroring.
 */
export async function ensureSession(): Promise<StoredSession> {
  const existing = readStored();
  if (existing && (await isSessionValid(existing))) return existing;
  if (existing) clearSession();

  const res = await fetch(`${API_BASE}/api/api-keys`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "Sealrail frontend session",
      owner_address: DEMO_OWNER_ADDRESS,
      scopes: ALL_SCOPES,
    }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message ?? "Failed to bootstrap a session API key.");
  }

  const body = await res.json();
  const session: StoredSession = {
    secret: body.secret,
    keyId: body.key.id,
    ownerAddress: body.key.owner_address,
    prefix: body.key.prefix,
  };
  writeStored(session);
  return session;
}
