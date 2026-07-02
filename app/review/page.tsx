import Link from "next/link";
import { AppNav } from "@/components/app/AppNav";
import styles from "@/components/docs-legal/DocsLegal.module.css";

const checks = [
  "Open /run and click Run full flow",
  "Watch the AI invoice/RWA agent produce a structured decision",
  "Verify output hashes, WASM hash, attestation hash, and Casper anchor",
  "Copy the x402-compatible proof/payment receipt",
  "Open the canonical proof detail page",
  "Confirm payment unlocks only after verified proof",
];

export default function ReviewPage() {
  return (
    <div className={styles.page}>
      <AppNav
        active="Review"
        maxWidth={980}
        links={[
          { label: "Docs", href: "/docs" },
          { label: "Status", href: "/status" },
        ]}
        cta={{ label: "Run flow", href: "/run", variant: "primary" }}
      />
      <main id="main" tabIndex={-1} className={styles.wrap} style={{ maxWidth: 980 }}>
        <div className={styles.eyebrow}>Reviewer quickstart</div>
        <h1 className={styles.title}>Evaluate Sealrail in 60 seconds.</h1>
        <p className={styles.lead}>
          Sealrail is proof-gated AI and RWA payment infrastructure: agents do work, verifiers prove it,
          Casper anchors it, and payment unlocks only after proof.
        </p>

        <section className={styles.section}>
          <h2>Fast path</h2>
          <ol>
            {checks.map((check) => (
              <li key={check}>{check}</li>
            ))}
          </ol>
          <p>
            <Link href="/run">Start the live run</Link> | <Link href="/status">Check system status</Link> |{" "}
            <Link href="/docs">Read technical docs</Link>
          </p>
        </section>

        <section className={styles.section}>
          <h2>Ecosystem fit</h2>
          <ul>
            <li>
              <strong>Casper:</strong> proof hashes are anchored through the ProofRegistry path.
            </li>
            <li>
              <strong>x402:</strong> proof bundles include an x402-compatible payment receipt and unlock condition.
            </li>
            <li>
              <strong>RWA:</strong> the primary flow scores invoice risk before payment release.
            </li>
            <li>
              <strong>Agentic AI:</strong> an LLM agent produces structured output, but cannot unlock payment by itself.
            </li>
            <li>
              <strong>Odra/TEE-ready:</strong> verifier records bind WASM/schema hashes and future hosted TEE claims.
            </li>
          </ul>
        </section>
      </main>
    </div>
  );
}
