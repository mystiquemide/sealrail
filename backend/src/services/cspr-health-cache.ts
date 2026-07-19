// ────────────────────────────────────────
// Sealrail Backend - CSPR.cloud health cache
// Polls CSPR.cloud health periodically and caches results.
// Used by /api/status without blocking on external calls.
// ────────────────────────────────────────

import { getCsprCloudHealth, isCsprCloudConfigured } from "./cspr-cloud.js";

interface CachedHealth {
  apiReachable: boolean;
  x402Ready: boolean;
  latestRate: number | null;
  lastProbeTime: number;
}

let _cached: CachedHealth = {
  apiReachable: false,
  x402Ready: false,
  latestRate: null,
  lastProbeTime: 0,
};

export function getCachedCsprCloudHealth(): CachedHealth {
  return _cached;
}

export function setCachedCsprCloudHealthForTest(next: CachedHealth): void {
  if (process.env.NODE_ENV === "production") return;
  _cached = next;
}

export function startCsprCloudHealthProbe(intervalMs = 30000): void {
  if (!isCsprCloudConfigured()) return;

  const probe = async () => {
    try {
      const health = await getCsprCloudHealth();
      _cached = {
        apiReachable: health.apiReachable,
        x402Ready: health.x402FacilitatorReachable,
        latestRate: health.latestCsprUsdRate,
        lastProbeTime: Date.now(),
      };
    } catch {
      // Leave previous cached values on failure
    }
  };

  // Probe immediately, then on interval
  probe();
  setInterval(probe, intervalMs);
}
