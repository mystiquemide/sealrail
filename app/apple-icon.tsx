import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#080808",
        }}
      >
        <svg width="120" height="88" viewBox="0 0 30 22" fill="none">
          <line x1="0" y1="11" x2="9" y2="11" stroke="#F6F5F3" strokeWidth="1.25" />
          <line x1="21" y1="11" x2="30" y2="11" stroke="#F6F5F3" strokeWidth="1.25" />
          <circle cx="15" cy="11" r="6" stroke="#F6F5F3" strokeWidth="1.25" />
          <circle cx="15" cy="11" r="2.4" fill="#FF2D2D" />
          <line x1="15" y1="5.2" x2="15" y2="8" stroke="#F6F5F3" strokeWidth="1.25" />
        </svg>
      </div>
    ),
    { ...size }
  );
}
