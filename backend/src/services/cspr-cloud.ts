import { config } from "../config.js";

export interface CsprCloudHealth {
  configured: boolean;
  apiReachable: boolean;
  x402FacilitatorReachable: boolean;
  casperNodeReachable: boolean;
  latestCsprUsdRate: number | null;
  latestCsprUsdRateTimestamp: string | null;
  x402SupportedNetworks: string[];
  errors: string[];
}

export interface CsprCloudDeployConfirmation {
  configured: boolean;
  deployHash: string;
  found: boolean;
  status: string | null;
  blockHash: string | null;
  blockHeight: number | null;
  timestamp: string | null;
  callerPublicKey: string | null;
  contractPackageHash: string | null;
  raw: unknown | null;
  error: string | null;
}

function accessToken(): string {
  return config.csprCloudToken || config.csprCloudApiKey;
}

export function isCsprCloudConfigured(): boolean {
  return accessToken() !== "";
}

function headers(): Record<string, string> {
  return {
    accept: "application/json",
    authorization: accessToken(),
  };
}

async function fetchJson(url: string): Promise<{ ok: boolean; status: number; body: unknown }> {
  const res = await fetch(url, { headers: headers() });
  const text = await res.text();
  let body: unknown = text;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    // Keep non-JSON response bodies readable for diagnostics.
  }
  return { ok: res.ok, status: res.status, body };
}

function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

function dataObject(body: unknown): Record<string, unknown> | null {
  if (!body || typeof body !== "object") return null;
  const maybe = body as Record<string, unknown>;
  if (maybe.data && typeof maybe.data === "object") return maybe.data as Record<string, unknown>;
  return maybe;
}

export async function getLatestCsprUsdRate(): Promise<{ amount: number | null; created: string | null }> {
  if (!isCsprCloudConfigured()) return { amount: null, created: null };
  const { ok, body, status } = await fetchJson(`${config.csprCloudApiUrl}/rates/1/latest`);
  if (!ok) throw new Error(`CSPR.cloud rate lookup failed with HTTP ${status}`);
  const data = dataObject(body);
  return {
    amount: typeof data?.amount === "number" ? data.amount : null,
    created: typeof data?.created === "string" ? data.created : null,
  };
}

export async function getCsprCloudHealth(): Promise<CsprCloudHealth> {
  const configured = isCsprCloudConfigured();
  const health: CsprCloudHealth = {
    configured,
    apiReachable: false,
    x402FacilitatorReachable: false,
    casperNodeReachable: false,
    latestCsprUsdRate: null,
    latestCsprUsdRateTimestamp: null,
    x402SupportedNetworks: [],
    errors: [],
  };

  if (!configured) {
    health.errors.push("CSPR_CLOUD_TOKEN or CSPR_CLOUD_API_KEY is not configured");
    return health;
  }

  try {
    const rate = await getLatestCsprUsdRate();
    health.apiReachable = rate.amount !== null;
    health.latestCsprUsdRate = rate.amount;
    health.latestCsprUsdRateTimestamp = rate.created;
  } catch (err) {
    health.errors.push(errorMessage(err));
  }

  try {
    const { ok, body, status } = await fetchJson(`${config.csprCloudX402FacilitatorUrl}/supported`);
    health.x402FacilitatorReachable = ok;
    if (!ok) {
      health.errors.push(`CSPR.cloud x402 facilitator failed with HTTP ${status}`);
    } else if (body && typeof body === "object") {
      const kinds = (body as { kinds?: unknown }).kinds;
      if (Array.isArray(kinds)) {
        health.x402SupportedNetworks = kinds
          .map((kind) => (kind && typeof kind === "object" ? (kind as { network?: unknown }).network : null))
          .filter((network): network is string => typeof network === "string");
      }
    }
  } catch (err) {
    health.errors.push(errorMessage(err));
  }

  try {
    const { ok, status } = await fetchJson(`${config.csprCloudNodeUrl}/status`);
    health.casperNodeReachable = ok;
    if (!ok) health.errors.push(`CSPR.cloud Casper node failed with HTTP ${status}`);
  } catch (err) {
    health.errors.push(errorMessage(err));
  }

  return health;
}

export async function getDeployConfirmation(deployHash: string): Promise<CsprCloudDeployConfirmation> {
  if (!isCsprCloudConfigured()) {
    return {
      configured: false,
      deployHash,
      found: false,
      status: null,
      blockHash: null,
      blockHeight: null,
      timestamp: null,
      callerPublicKey: null,
      contractPackageHash: null,
      raw: null,
      error: "CSPR_CLOUD_TOKEN or CSPR_CLOUD_API_KEY is not configured",
    };
  }

  try {
    const { ok, body, status } = await fetchJson(`${config.csprCloudApiUrl}/deploys/${deployHash}`);
    if (!ok) {
      return {
        configured: true,
        deployHash,
        found: false,
        status: null,
        blockHash: null,
        blockHeight: null,
        timestamp: null,
        callerPublicKey: null,
        contractPackageHash: null,
        raw: body,
        error: `CSPR.cloud deploy lookup failed with HTTP ${status}`,
      };
    }

    const data = dataObject(body);
    return {
      configured: true,
      deployHash,
      found: true,
      status: typeof data?.status === "string" ? data.status : null,
      blockHash: typeof data?.block_hash === "string" ? data.block_hash : null,
      blockHeight: typeof data?.block_height === "number" ? data.block_height : null,
      timestamp: typeof data?.timestamp === "string" ? data.timestamp : null,
      callerPublicKey: typeof data?.caller_public_key === "string" ? data.caller_public_key : null,
      contractPackageHash: typeof data?.contract_package_hash === "string" ? data.contract_package_hash : null,
      raw: data,
      error: null,
    };
  } catch (err) {
    return {
      configured: true,
      deployHash,
      found: false,
      status: null,
      blockHash: null,
      blockHeight: null,
      timestamp: null,
      callerPublicKey: null,
      contractPackageHash: null,
      raw: null,
      error: errorMessage(err),
    };
  }
}
