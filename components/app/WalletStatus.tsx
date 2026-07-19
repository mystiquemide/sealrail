"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ensureSession, getSession, disconnectWallet } from "@/lib/session";

function truncate(hex: string): string {
  if (hex.length <= 14) return hex;
  return `${hex.slice(0, 8)}…${hex.slice(-4)}`;
}

export function WalletStatus() {
  const [ownerAddress, setOwnerAddress] = useState<string | null>(() => getSession()?.ownerAddress ?? null);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const wrapRef = useRef<HTMLSpanElement | null>(null);

  useEffect(() => {
    if (!menuOpen) return;
    function onDocClick(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setMenuOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [menuOpen]);

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

  async function handleDisconnect() {
    setMenuOpen(false);
    await disconnectWallet();
    setOwnerAddress(null);
    setError(null);
  }

  if (ownerAddress) {
    return (
      <span ref={wrapRef} style={{ position: "relative", display: "inline-flex" }}>
        <button
          type="button"
          onClick={() => setMenuOpen((v) => !v)}
          title={ownerAddress}
          aria-haspopup="menu"
          aria-expanded={menuOpen}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            fontSize: 12,
            fontFamily: "monospace",
            color: "#64D96B",
            background: "transparent",
            border: "1px solid rgba(100,217,107,0.35)",
            borderRadius: 999,
            padding: "5px 10px",
            cursor: "pointer",
          }}
        >
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#64D96B" }} />
          {truncate(ownerAddress)}
          <span style={{ opacity: 0.6, fontSize: 10 }}>▾</span>
        </button>
        {menuOpen ? (
          <span
            role="menu"
            style={{
              position: "absolute",
              top: "calc(100% + 6px)",
              right: 0,
              minWidth: 200,
              display: "flex",
              flexDirection: "column",
              gap: 8,
              padding: 10,
              background: "#0B0B0B",
              border: "1px solid rgba(255,255,255,0.14)",
              borderRadius: 10,
              boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
              zIndex: 50,
            }}
          >
            <span style={{ fontSize: 10, letterSpacing: "0.04em", textTransform: "uppercase", color: "#8A8A8A" }}>
              Holder identity
            </span>
            <span style={{ fontSize: 11, fontFamily: "monospace", color: "#CFCFCF", wordBreak: "break-all", lineHeight: 1.4 }}>
              {ownerAddress}
            </span>
            <button
              type="button"
              role="menuitem"
              onClick={() => void handleDisconnect()}
              style={{
                marginTop: 2,
                background: "transparent",
                border: "1px solid rgba(244,91,69,0.4)",
                color: "#F45B45",
                borderRadius: 8,
                padding: "6px 10px",
                fontSize: 12,
                cursor: "pointer",
              }}
            >
              Disconnect wallet
            </button>
          </span>
        ) : null}
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
        <span style={{ fontSize: 11, color: "#F45B45", maxWidth: 260, textAlign: "right", lineHeight: 1.35 }}>
          {error}{" "}
          <a href="https://www.casperwallet.io/" target="_blank" rel="noreferrer" style={{ color: "#F6F5F3", textDecoration: "underline", textUnderlineOffset: 2 }}>
            Install wallet
          </a>{" "}
          or <Link href="/proofs" style={{ color: "#F6F5F3", textDecoration: "underline", textUnderlineOffset: 2 }}>view proofs</Link>.
        </span>
      ) : null}
    </span>
  );
}
