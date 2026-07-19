import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

const SITE_DESCRIPTION =
  "Sealrail is a Casper-native proof and payment rail for AI-agent work. Payment unlocks only after a verifiable Blocky-compatible proof is anchored on Casper.";

const PUBLIC_SITE_URL = "https://www.sealrail.xyz";
const LOCAL_SITE_URL = "http://localhost:3000";

function getMetadataBase() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();

  if (!siteUrl) return new URL(process.env.NODE_ENV === "production" ? PUBLIC_SITE_URL : LOCAL_SITE_URL);

  try {
    const parsedUrl = new URL(siteUrl);
    if (process.env.NODE_ENV === "production" && parsedUrl.hostname.endsWith(".vercel.app")) {
      return new URL(PUBLIC_SITE_URL);
    }
    return parsedUrl;
  } catch {
    return new URL(process.env.NODE_ENV === "production" ? PUBLIC_SITE_URL : LOCAL_SITE_URL);
  }
}

export const metadata: Metadata = {
  metadataBase: getMetadataBase(),
  title: "Sealrail | No Proof without a Payment.",
  description: SITE_DESCRIPTION,
  openGraph: {
    title: "Sealrail | No Proof without a Payment.",
    description: SITE_DESCRIPTION,
    siteName: "Sealrail",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Sealrail | No Proof without a Payment.",
    description: SITE_DESCRIPTION,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <a href="#main" className="skip-link">
          Skip to content
        </a>
        {children}
      </body>
    </html>
  );
}
