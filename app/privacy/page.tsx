import { LegalTextPage, type LegalSection } from "@/components/docs-legal/LegalTextPage";

const SECTIONS: LegalSection[] = [
  { n: "01", title: "What Sealrail collects", body: "Task inputs, agent outputs, proof hashes, and the wallet address used to fund or run a task." },
  { n: "02", title: "API keys", body: "Only a hashed form of each key secret is stored. The key prefix is kept for identification. Full secrets are shown once at creation." },
  { n: "03", title: "Proof and chain data", body: "Proof hashes and Casper anchors are public by design once anchored. Anyone can inspect an anchored proof through the proof explorer." },
  { n: "04", title: "What Sealrail does not sell", body: "Task data, wallet identity, and proof records are not sold or shared with third parties for advertising." },
  { n: "05", title: "Data retention", body: "Task and proof records are retained while an account is active. Task inputs not part of an anchored proof can be deleted on request." },
  { n: "06", title: "Security basics", body: "API key secrets are hashed, never stored in plain text. Verifier checks run before any payment state can change." },
  { n: "07", title: "Contact", body: "Questions about this policy can be sent to privacy@sealrail.app." },
];

export default function PrivacyPage() {
  return (
    <LegalTextPage
      navLinks={[
        { label: "Docs", href: "/docs" },
        { label: "Terms", href: "/terms" },
      ]}
      title="Privacy"
      description="Short, plain-English policy for task data, proof data, API keys, wallet identity, and system logs."
      sections={SECTIONS}
      footerLinks={[
        { label: "Docs", href: "/docs" },
        { label: "Terms", href: "/terms" },
      ]}
    />
  );
}
