import Link from "next/link";
import { AppNav } from "@/components/app/AppNav";
import { ecosystemIntegrations } from "@/lib/ecosystem";
import styles from "@/components/docs-legal/DocsLegal.module.css";

const latestProof = {
  id: "0b9bad2e-3fe8-4ab5-80fb-4fa12de95f77",
  invoiceId: "INV-1030",
  anchor: "9a708f9e84c6d8f2d93d196823312a7f6ce8f903b93c344115f7e8c9c72edd6d",
  outputHash: "23beb4bd659d9c9d16d49e7ad6ef4bc31bb7f8d7334aceeb991b4eafc76a718f",
  createdAt: "2026-07-18 12:57 UTC",
};

const judgePath = [
  "Open /run and click Run full flow to create a funded invoice-risk task. Running a fresh flow needs the Casper Wallet extension; no wallet? Skip to step 05 and verify any existing proof on-chain instead.",
  "Watch the AI invoice-risk agent produce structured output that cannot unlock payment by itself.",
  "Verify the schema/hash proof, Casper testnet anchor, and payment unlock state.",
  "Click Run failing proof to see bad output halt the rail with payment blocked and no anchor.",
  "Open /proofs or the proof detail link below to inspect the persisted proof bundle, then open its Casper deploy on cspr.live.",
  "Open /status to confirm what is live and what is still pending.",
];

const trustBoundaries = [
  {
    component: "Casper ProofRegistry",
    state: "Live on testnet",
    proof: "Proof hashes are anchored through the Casper testnet ProofRegistry path before payment unlock.",
  },
  {
    component: "AI invoice-risk agent",
    state: "Live",
    proof: "The agent returns structured invoice-risk output, but output alone cannot move payment state.",
  },
  {
    component: "RWA compliance listing",
    state: "Preview",
    proof: "The marketplace labels RWA compliance as the next vertical until its dedicated runtime is connected; judges should score the live invoice-risk path.",
  },
  {
    component: "Verifier + hashes",
    state: "Live",
    proof: "Input, output, verifier/WASM, and attestation hashes are bound into the proof trail.",
  },
  {
    component: "Failing-proof path",
    state: "Live",
    proof: "A rejected proof keeps payment blocked and creates no Casper anchor.",
  },
  {
    component: "x402-compatible receipt",
    state: "Live format",
    proof: "Proof bundles include payment-required receipt metadata and unlock conditions.",
  },
  {
    component: "Hosted TEE / Blocky AS",
    state: "Pending hosted access",
    proof: "No hosted TEE success is claimed until Blocky credentials and access are configured.",
  },
  {
    component: "CSPR settlement",
    state: "Roadmap",
    proof: "Current build proves the payment state machine plus Casper proof anchoring; wallet-bound settlement is next.",
  },
];

const criteriaMap = [
  ["Working prototype", "Live /run flow, proof details, proof explorer, and production status page."],
  ["Casper smart contract", "Successful testnet anchor_proof deploys with visible hashes and gas."],
  ["AI / agentic systems", "LLM invoice-risk agent returns structured output that is independently verified."],
  ["RWA / DeFi fit", "Invoice risk is live; RWA compliance is clearly labelled as the next marketplace vertical on the same payment rail."],
  ["Trust and safety", "Fail-closed state machine plus an honest status page for pending TEE/settlement pieces."],
];

export default function ReviewPage() {
  const shortAnchor = `${latestProof.anchor.slice(0, 10)}…${latestProof.anchor.slice(-8)}`;
  const shortOutput = `${latestProof.outputHash.slice(0, 10)}…${latestProof.outputHash.slice(-8)}`;

  return (
    <div className={styles.page}>
      <AppNav
        active="Review"
        maxWidth={1040}
        links={[
          { label: "Run", href: "/run" },
          { label: "Proofs", href: "/proofs" },
          { label: "Status", href: "/status" },
          { label: "Docs", href: "/docs" },
        ]}
        cta={{ label: "Run demo", href: "/run", variant: "primary" }}
      />
      <main id="main" tabIndex={-1} className={styles.wrap} style={{ maxWidth: 1040 }}>
        <div className={styles.eyebrow}>Casper Agentic Buildathon · reviewer path</div>
        <h1 className={styles.title}>SealRail is a proof-gated payment rail for invoice and RWA agents.</h1>
        <p className={styles.lead}>
          An AI agent can produce work, but payment only becomes unlockable after the verifier proves the output and
          Casper anchors the proof. The live demo shows both sides of the invariant: verified proof unlocks payment;
          failed proof keeps payment blocked.
        </p>
        <div className={styles.headerActions}>
          <Link href="/run" className={styles.btnPrimary}>Run full flow</Link>
          <Link href="/run" className={styles.btnGhost}>Run failing proof</Link>
          <Link href={`/proofs/${latestProof.id}`} className={styles.btnGhost}>Open latest proof</Link>
          <Link href="/status" className={styles.btnGhost}>System status</Link>
        </div>

        <section className={styles.docSection}>
          <div className={styles.sectionLabel}>Judge path</div>
          <h2 className={styles.sectionHeading}>Score the core loop in under two minutes.</h2>
          <div className={styles.coreLoopList}>
            {judgePath.map((step, index) => (
              <div className={styles.coreLoopRow} key={step}>
                <span className={styles.coreLoopN}>{String(index + 1).padStart(2, "0")}</span>
                <span className={styles.coreLoopLabel}>{step}</span>
              </div>
            ))}
          </div>
        </section>

        <section className={styles.docSection}>
          <div className={styles.sectionLabel}>Live proof to inspect</div>
          <h2 className={styles.sectionHeading}>A recent production run anchored on Casper testnet.</h2>
          <div className={styles.architectureBox}>
            <div className={styles.kvRows} style={{ marginTop: 0 }}>
              <div className={styles.kvRow}>
                <span className={styles.kvKey}>Proof ID</span>
                <Link className={styles.kvValue} href={`/proofs/${latestProof.id}`}>{latestProof.id}</Link>
              </div>
              <div className={styles.kvRow}>
                <span className={styles.kvKey}>Invoice</span>
                <span className={styles.kvValue}>{latestProof.invoiceId}</span>
              </div>
              <div className={styles.kvRow}>
                <span className={styles.kvKey}>Output hash</span>
                <span className={styles.kvValue}>{shortOutput}</span>
              </div>
              <div className={styles.kvRow}>
                <span className={styles.kvKey}>Casper anchor</span>
                <a className={styles.kvValue} href={`https://testnet.cspr.live/deploy/${latestProof.anchor}`}>{shortAnchor}</a>
              </div>
              <div className={styles.kvRow}>
                <span className={styles.kvKey}>Payment state</span>
                <span className={styles.kvValue}>unlockable after verified proof</span>
              </div>
              <div className={styles.kvRow}>
                <span className={styles.kvKey}>Generated</span>
                <span className={styles.kvValue}>{latestProof.createdAt}</span>
              </div>
            </div>
          </div>
          <p className={styles.bodyText}>
            The proof explorer also lists recent proof rows, so reviewers can verify that generated proofs persist beyond a
            one-off scripted page.
          </p>
        </section>

        <section className={styles.docSection}>
          <div className={styles.sectionLabel}>Trust boundaries</div>
          <h2 className={styles.sectionHeading}>What is live, what is pending, and what the demo proves.</h2>
          <div className={styles.twoColGrid}>
            {trustBoundaries.map((item) => (
              <div className={styles.twoColCard} key={item.component}>
                <div className={styles.subLabel}>{item.state}</div>
                <h3 className={styles.subheadingLarge}>{item.component}</h3>
                <p className={styles.bodyText}>{item.proof}</p>
              </div>
            ))}
          </div>
        </section>

        <section className={styles.docSection}>
          <div className={styles.sectionLabel}>Criteria map</div>
          <h2 className={styles.sectionHeading}>How SealRail maps to the final-round rubric.</h2>
          <div className={styles.kvRows}>
            {criteriaMap.map(([criterion, proof]) => (
              <div className={styles.kvRow} key={criterion}>
                <span className={styles.kvKey}>{criterion}</span>
                <span className={styles.kvValue}>{proof}</span>
              </div>
            ))}
          </div>
        </section>

        <section className={styles.docSection}>
          <div className={styles.sectionLabel}>Ecosystem integrations</div>
          <h2 className={styles.sectionHeading}>Built as an integration surface for Casper agents.</h2>
          <p className={styles.bodyText}>
            SealRail exposes an MCP stdio server, public agent integration manifest, live Casper anchoring, Odra contract
            metadata, and x402-compatible proof/payment receipt fields. External agents can inspect status, proof bundles,
            and payment-backed task APIs with caller-provided credentials.
          </p>
          <div className={styles.architectureBox}>
            <div className={styles.sectionLabel}>Live now</div>
            <ul>
              {ecosystemIntegrations.live.map((item) => (
                <li key={item.title}>
                  <strong>{item.title}:</strong> {item.description}
                </li>
              ))}
            </ul>
          </div>
          <div className={styles.infoBox}>
            <div className={styles.infoBoxLabel}>Manifest endpoint</div>
            <p className={styles.bodyText}>
              <code>Backend {ecosystemIntegrations.agentManifestPath}</code> publishes capabilities, endpoints, Casper contract
              metadata, x402 receipt support, and current trust boundaries without exposing secrets.
            </p>
          </div>
          <div className={styles.architectureBox}>
            <div className={styles.sectionLabel}>Next integrations</div>
            <ul>
              {ecosystemIntegrations.roadmap.map((item) => (
                <li key={item.title}>
                  <strong>{item.title}:</strong> {item.description}
                </li>
              ))}
            </ul>
          </div>
        </section>
      </main>
    </div>
  );
}
