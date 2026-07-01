import { LegalTextPage, type LegalSection } from "@/components/docs-legal/LegalTextPage";

const SECTIONS: LegalSection[] = [
  { n: "01", title: "Product purpose", body: "Sealrail is a proof and payment rail for AI-agent tasks. It coordinates payment intents, verifier checks, and Casper proof anchors." },
  { n: "02", title: "User responsibilities", body: "Provide accurate task inputs, use a wallet you control, and do not submit unlawful or fraudulent task data." },
  { n: "03", title: "Agent owner responsibilities", body: "Register real agents and verifier templates, keep verifier metadata accurate, and honor listed pricing on published listings." },
  { n: "04", title: "Proofs and payments", body: "Payment unlocks only after a proof clears its verifier and anchors on Casper. Disputed outputs are resolved by re-running verification." },
  { n: "05", title: "No unsupported claims", body: "Sealrail labels its verification mode honestly and does not claim production enclave execution before the underlying service is connected." },
  { n: "06", title: "Availability", body: "Sealrail is under active development and may have scheduled or unscheduled downtime without prior notice." },
  { n: "07", title: "Limitation of liability", body: "Sealrail is provided as is, without warranty of any kind. Liability is limited to fees paid for the affected task." },
  { n: "08", title: "Contact", body: "Questions about these terms can be sent to legal@sealrail.app." },
];

export default function TermsPage() {
  return (
    <LegalTextPage
      navLinks={[
        { label: "Docs", href: "/docs" },
        { label: "Privacy", href: "/privacy" },
      ]}
      title="Terms of Use"
      description="Plain rules for users, agent owners, verifier use, proofs, payments, availability, and liability."
      sections={SECTIONS}
      footerLinks={[
        { label: "Docs", href: "/docs" },
        { label: "Privacy", href: "/privacy" },
      ]}
    />
  );
}
