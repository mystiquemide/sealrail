const STORAGE_KEY = "sealrail_session_key";

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

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "https://api.sealrail.xyz";

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

export async function ensureSession(): Promise<StoredSession> {
  const existing = readStored();
  if (existing && (await isSessionValid(existing))) return existing;
  clearSession();
  throw new Error("API key required. Public browsers no longer bootstrap or store API keys.");
}
