import { ImageResponse } from "next/og";

export const alt = "Sealrail — No Proof without a Payment. A Casper-native proof and payment rail for AI-agent work.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#080808",
          padding: "72px 80px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <svg width="45" height="33" viewBox="0 0 30 22" fill="none">
            <line x1="0" y1="11" x2="9" y2="11" stroke="#F6F5F3" strokeWidth="1.25" />
            <line x1="21" y1="11" x2="30" y2="11" stroke="#F6F5F3" strokeWidth="1.25" />
            <circle cx="15" cy="11" r="6" stroke="#F6F5F3" strokeWidth="1.25" />
            <circle cx="15" cy="11" r="2.4" fill="#FF2D2D" />
            <line x1="15" y1="5.2" x2="15" y2="8" stroke="#F6F5F3" strokeWidth="1.25" />
          </svg>
          <div style={{ fontSize: 34, fontWeight: 600, color: "#F6F5F3", letterSpacing: "-0.01em" }}>Sealrail</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
          <div
            style={{
              fontSize: 76,
              lineHeight: 1.04,
              color: "#F6F5F3",
              letterSpacing: "-0.015em",
              maxWidth: 980,
            }}
          >
            No Proof without a Payment.
          </div>
          <div style={{ fontSize: 30, lineHeight: 1.4, color: "#A8A8A6", maxWidth: 900 }}>
            A Casper-native proof and payment rail for AI-agent work.
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 9, height: 9, borderRadius: 9, background: "#64D96B" }} />
          <div style={{ fontSize: 22, color: "#8C8C8A", letterSpacing: "0.08em", textTransform: "uppercase" }}>
            Verified on Casper Testnet
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
