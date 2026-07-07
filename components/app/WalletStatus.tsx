"use client";

import { useState } from "react";
import { ensureSession, getSession } from "@/lib/session";

function truncate(hex: string): string {
  if (hex.length <= 14) return hex;
  return `${hex.slice(0, 8)}…${hex.slice(-4)}`;
}

export function WalletStatus() {
  const [ownerAddress, setOwnerAddress] = useState<string | null>(() => getSession()?.ownerAddress ?? null);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleConnect() {
    setConnecting(true);
    setError(null);
    try {
      const session = await ensureSession();
      setOwnerAddress(session.ownerAddress);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Wallet connection failed.");
    } finally {
      setConnecting(false);
    }
  }

  if (ownerAddress) {
    return (
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          fontSize: 12,
          fontFamily: "monospace",
          color: "#64D96B",
          border: "1px solid rgba(100,217,107,0.35)",
          borderRadius: 999,
          padding: "5px 10px",
        }}
        title={ownerAddress}
      >
        <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#64D96B" }} />
        {truncate(ownerAddress)}
      </span>
    );
  }

  return (
    <span style={{ display: "inline-flex", flexDirection: "column", alignItems: "flex-end", gap: 2 }}>
      <button
        type="button"
        onClick={() => void handleConnect()}
        disabled={connecting}
        style={{
          background: "transparent",
          border: "1px solid rgba(255,255,255,0.25)",
          color: "#F6F5F3",
          borderRadius: 999,
          padding: "6px 12px",
          fontSize: 13,
          cursor: connecting ? "not-allowed" : "pointer",
          opacity: connecting ? 0.6 : 1,
        }}
      >
        {connecting ? "Connecting…" : "Connect Casper Wallet"}
      </button>
      {error ? (
        <span style={{ fontSize: 11, color: "#F45B45", maxWidth: 220, textAlign: "right" }}>{error}</span>
      ) : null}
    </span>
  );
}
