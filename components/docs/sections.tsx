import styles from "@/components/docs-legal/DocsLegal.module.css";
import { CodeBlock } from "./CodeBlock";
import { BulletList } from "./BulletList";
import {
  API_EXAMPLES,
  BLOCKY_STATUS,
  CHANGELOG_ADDED,
  CHANGELOG_BLOCKERS,
  CHANGELOG_IMPROVED,
  CONCEPTS,
  DEPLOYMENT_CHECKS,
  ENDPOINT_GROUPS,
  ENV_VARS_TEXT,
  ERROR_TABLE,
  GLOSSARY_TERMS,
  INTEGRATION_MAP,
  LLMS_FULL_CONTENTS,
  LLMS_TXT,
  LLM_DOES,
  LLM_DOES_NOT,
  LLM_FAILURES,
  PRODUCT_FLOW_STEPS,
  QUICKSTART_BEFORE,
  QUICKSTART_STEPS,
  RUN_FLOW_TEXT,
  SAFETY_GUARANTEES,
  SECURITY_PRINCIPLES,
  STATE_MODEL,
  STATUS_CHECKS,
  STATUS_ENDPOINTS,
  STATUS_LABELS,
  UNSAFE_VALUES,
} from "./docs-content";

export function QuickstartSection() {
  return (
    <section id="quickstart" className={styles.docSectionSpaced}>
      <div className={styles.sectionLabel}>Quickstart</div>
      <h2 className={styles.sectionHeading}>Run your first proof-backed agent payment flow.</h2>
      <p className={styles.bodyText}>This guide walks through the standard Sealrail flow from agent registration to verified payment unlock.</p>

      <div className={styles.infoBox}>
        <div className={styles.infoBoxLabel}>Before you start, you need</div>
        <BulletList items={QUICKSTART_BEFORE} />
      </div>

      {QUICKSTART_STEPS.map((step) => (
        <div key={step.n} style={{ marginTop: 28 }}>
          <div className={styles.stepHeader}>
            <span className={styles.stepNum}>{step.n}</span>
            <span className={styles.subheading}>{step.title}</span>
          </div>
          <p className={styles.bodyText}>{step.desc}</p>
          {step.codes.map((code) => (
            <CodeBlock key={code.label} label={code.label} text={code.text} />
          ))}
        </div>
      ))}
    </section>
  );
}

export function ConceptsSection() {
  return (
    <section id="concepts" className={styles.docSectionSpaced}>
      <div className={styles.sectionLabel}>Core concepts</div>
      {CONCEPTS.map((c) => (
        <div key={c.title} style={{ marginTop: 22 }}>
          <div className={styles.subheading}>{c.title}</div>
          <p className={styles.bodyText} style={{ maxWidth: "none" }}>
            {c.body}
          </p>
          {c.extra.length > 0 ? <BulletList items={c.extra} /> : null}
        </div>
      ))}
    </section>
  );
}

export function ProductFlowSection() {
  return (
    <section id="product-flow" className={styles.docSectionSpaced}>
      <div className={styles.sectionLabel}>Product flow</div>
      <p className={styles.bodyText}>Sealrail turns agent work into verifiable payment events.</p>
      <CodeBlock text={PRODUCT_FLOW_STEPS.map((s) => `${s.n}. ${s.label}`).join("\n")} label="" />

      <div className={styles.subLabel}>State model</div>
      <div className={styles.kvRows}>
        {STATE_MODEL.map((row) => (
          <div key={row.state} className={styles.kvRow} style={{ gridTemplateColumns: "140px 1fr" }}>
            <span className={styles.kvKeyMono} style={{ color: "var(--accent, #B4341F)" }}>
              {row.state}
            </span>
            <span className={styles.kvValue}>{row.meaning}</span>
          </div>
        ))}
      </div>

      <div className={styles.infoBox}>
        <div className={styles.infoBoxLabel}>Safety rule</div>
        <p style={{ fontSize: 14, lineHeight: 1.6, color: "#2C2C2B", margin: "8px 0 0" }}>
          Sealrail fails closed. If agent execution fails, the task does not receive fake proof and payment does not unlock.
        </p>
      </div>
    </section>
  );
}

export function LlmRuntimeSection() {
  return (
    <section id="llm-runtime" className={styles.docSectionSpaced}>
      <div className={styles.sectionLabel}>LLM agent runtime</div>
      <p className={styles.bodyText} style={{ maxWidth: "none" }}>
        Sealrail supports an LLM-powered runtime for agents that need reasoning. The first runtime is the Invoice Risk Agent. It
        reviews invoice data and returns structured output that can be verified and tied to payment.
      </p>

      <div className={styles.twoColGrid}>
        <div className={styles.twoColCard}>
          <div className={styles.infoBoxLabel}>What the LLM does</div>
          <p style={{ fontSize: 13, color: "#5C5A55", margin: "8px 0 12px" }}>For invoice risk, the output includes:</p>
          <BulletList items={LLM_DOES} dotColor="#64D96B" />
        </div>
        <div className={styles.twoColCard}>
          <div className={styles.infoBoxLabel}>What the LLM does not do</div>
          <BulletList items={LLM_DOES_NOT} dotColor="#C0392B" />
          <p style={{ fontSize: 12.5, lineHeight: 1.6, color: "#8A8680", margin: "12px 0 0" }}>
            Sealrail still requires output hashing, proof verification, Casper anchoring, and payment state checks.
          </p>
        </div>
      </div>

      <div className={styles.subLabel}>Failure behavior</div>
      <div className={styles.kvRows}>
        {LLM_FAILURES.map((row) => (
          <div key={row.failure} className={styles.kvRow} style={{ gridTemplateColumns: "160px 1fr" }}>
            <span className={styles.kvKey}>{row.failure}</span>
            <span className={styles.kvValue}>{row.result}</span>
          </div>
        ))}
      </div>
      <p style={{ fontSize: 13.5, color: "#5C5A55", margin: "14px 0 0" }}>No fake proof is created. No payment unlock happens.</p>
    </section>
  );
}

export function ApiReferenceSection() {
  return (
    <section id="api-reference" className={styles.docSectionSpaced}>
      <div className={styles.sectionLabel}>API reference</div>
      <p className={styles.bodyText} style={{ maxWidth: "none" }}>
        Sealrail exposes APIs for agents, marketplace listings, tasks, proofs, payments, verifiers, API keys, runtime execution,
        and system readiness.
      </p>

      <div className={styles.subLabel}>Authentication</div>
      <p style={{ fontSize: 14, color: "#5C5A55", margin: "10px 0 0" }}>
        Most write operations require an API key. Never expose API keys in frontend client code. Use server-side calls or scoped
        keys where appropriate.
      </p>
      <CodeBlock label="" text="Authorization: Bearer YOUR_API_KEY" />

      <div className={styles.subLabel}>Endpoint groups</div>
      <div className={styles.kvRows}>
        {ENDPOINT_GROUPS.map((row) => (
          <div key={row.group} className={styles.kvRow} style={{ gridTemplateColumns: "150px 1fr" }}>
            <span className={styles.kvKey} style={{ fontWeight: 500 }}>
              {row.group}
            </span>
            <span className={styles.kvValue}>{row.purpose}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

export function ApiExamplesSection() {
  return (
    <section id="api-examples" className={styles.docSectionSpaced}>
      <div className={styles.sectionLabel}>Important API examples</div>
      {API_EXAMPLES.map((ex) => (
        <div key={ex.title} style={{ marginTop: 22 }}>
          <div className={styles.subheadingLarge}>{ex.title}</div>
          {ex.codes.map((code) => (
            <CodeBlock key={code.label} label={code.label} text={code.text} />
          ))}
        </div>
      ))}
    </section>
  );
}

export function FrontendIntegrationSection() {
  return (
    <section id="frontend-integration" className={styles.docSectionSpaced}>
      <div className={styles.sectionLabel}>Frontend integration guide</div>
      <p className={styles.bodyText}>Use this mapping to connect the frontend screens to real backend data.</p>
      <div className={styles.kvRows} style={{ marginTop: 14 }}>
        {INTEGRATION_MAP.map((row) => (
          <div key={row.screen} className={styles.kvRow} style={{ gridTemplateColumns: "200px 1fr" }}>
            <span className={styles.kvKeyMono} style={{ color: "var(--accent, #B4341F)" }}>
              {row.screen}
            </span>
            <span className={styles.kvValue} style={{ fontFamily: "var(--font-mono)", fontSize: 12 }}>
              {row.source}
            </span>
          </div>
        ))}
      </div>

      <div className={styles.subLabel}>/run screen behavior</div>
      <p style={{ fontSize: 14, color: "#5C5A55", margin: "10px 0 0" }}>The /run page should show real lifecycle state:</p>
      <CodeBlock label="" text={RUN_FLOW_TEXT} />
      <p style={{ fontSize: 14, color: "#5C5A55", margin: "14px 0 0" }}>If the runtime fails, show a clear error state. Do not show fake progress.</p>
      <div className={styles.infoBox}>
        <p className={styles.quoteItalic} style={{ margin: 0 }}>
          &quot;Agent runtime is not configured yet. No proof was created and payment remains locked.&quot;
        </p>
      </div>

      <div className={styles.subLabel}>/status screen behavior</div>
      <p style={{ fontSize: 14, color: "#5C5A55", margin: "10px 0 0" }}>Show readiness as separate checks:</p>
      <div className={styles.tagChips}>
        {STATUS_CHECKS.map((c) => (
          <span key={c} className={styles.tagChip}>
            {c}
          </span>
        ))}
      </div>
      <p style={{ fontSize: 14, color: "#5C5A55", margin: "14px 0 0" }}>Use clear labels:</p>
      <div className={styles.tagChips}>
        {STATUS_LABELS.map((l) => (
          <span key={l} className={styles.tagChipAccent}>
            {l}
          </span>
        ))}
      </div>
    </section>
  );
}

export function SafetySection() {
  return (
    <section id="safety" className={styles.docSectionSpaced}>
      <div className={styles.sectionLabel}>Proof and payment safety</div>
      <div className={styles.infoBox}>
        <p style={{ fontSize: 16, lineHeight: 1.5, color: "#2C2C2B", margin: 0, fontFamily: "var(--font-serif)" }}>
          Payment should not move without verified proof.
        </p>
      </div>

      <div className={styles.subLabel}>Safety guarantees</div>
      <BulletList items={SAFETY_GUARANTEES} dotColor="#64D96B" />

      <div className={styles.subLabel}>What counts as unsafe proof</div>
      <p style={{ fontSize: 14, color: "#5C5A55", margin: "10px 0 8px" }}>Unsafe proof includes placeholder or default values such as:</p>
      <div className={styles.tagChips} style={{ marginTop: 0 }}>
        {UNSAFE_VALUES.map((u) => (
          <span key={u} className={styles.tagChipMonoDanger}>
            {u}
          </span>
        ))}
      </div>
      <p style={{ fontSize: 13.5, color: "#5C5A55", margin: "14px 0 0" }}>These values must never make a task payable.</p>
    </section>
  );
}

export function ErrorsSection() {
  return (
    <section id="errors" className={styles.docSectionSpaced}>
      <div className={styles.sectionLabel}>Error handling</div>
      <p className={styles.bodyText}>Sealrail errors are designed to be actionable.</p>
      <div className={styles.kvRows}>
        {ERROR_TABLE.map((row) => (
          <div key={row.code} className={styles.kvRow} style={{ gridTemplateColumns: "190px 1fr 1fr", padding: "12px 0" }}>
            <span className={styles.kvKeyMono} style={{ color: "var(--accent, #B4341F)" }}>
              {row.code}
            </span>
            <span style={{ fontSize: 13, color: "#2C2C2B" }}>{row.meaning}</span>
            <span style={{ fontSize: 13, color: "#5C5A55" }}>{row.action}</span>
          </div>
        ))}
      </div>

      <div className={styles.subLabel}>Error display guidelines</div>
      <div className={styles.twoColGrid}>
        <div className={styles.twoColCard}>
          <div className={styles.infoBoxLabel} style={{ color: "#64D96B" }}>
            Good
          </div>
          <p className={styles.quoteItalic}>
            &quot;Agent runtime is missing provider configuration. No proof was created and payment remains locked.&quot;
          </p>
        </div>
        <div className={styles.twoColCard}>
          <div className={styles.infoBoxLabel} style={{ color: "#F45B45" }}>
            Bad
          </div>
          <p className={styles.quoteItalic}>&quot;Something went wrong.&quot;</p>
        </div>
      </div>
    </section>
  );
}

export function StatusReadinessSection() {
  return (
    <section id="status-readiness" className={styles.docSectionSpaced}>
      <div className={styles.sectionLabel}>Status and readiness</div>
      <p className={styles.bodyText} style={{ maxWidth: "none" }}>
        Sealrail exposes status endpoints so operators and users can understand what is ready, degraded, or blocked.
      </p>
      {STATUS_ENDPOINTS.map((se) => (
        <div key={se.title} style={{ marginTop: 22 }}>
          <div className={styles.subheadingLarge}>{se.title}</div>
          <p style={{ fontSize: 13.5, lineHeight: 1.6, color: "#5C5A55", margin: "8px 0 0" }}>{se.desc}</p>
          <CodeBlock label="" text={se.code} />
        </div>
      ))}
    </section>
  );
}

export function DeploymentSection() {
  return (
    <section id="deployment" className={styles.docSectionSpaced}>
      <div className={styles.sectionLabel}>Deployment guide</div>
      <p className={styles.bodyText}>Use this checklist to deploy Sealrail safely.</p>

      <div className={styles.subLabel}>Required environment variables</div>
      <CodeBlock label="" text={ENV_VARS_TEXT} />
      <p style={{ fontSize: 13, color: "#8A8680", margin: "10px 0 0" }}>Never commit real keys.</p>

      <div className={styles.subLabel}>Deployment checks before launch</div>
      <BulletList items={DEPLOYMENT_CHECKS} />

      <div className={styles.subLabel}>Blocky / hosted TEE status</div>
      <BulletList items={BLOCKY_STATUS} dotColor="#F2B84B" />
      <p className={styles.bodyText}>
        SealRail uses schema checks and hash binding to verify agent output before payment can unlock. Hosted Blocky AS remains
        a pending, configuration-gated upgrade. Public runs are labelled honestly and never claim hosted TEE execution
        before the service is connected.
      </p>
    </section>
  );
}

export function SecuritySection() {
  return (
    <section id="security" className={styles.docSectionSpaced}>
      <div className={styles.sectionLabel}>Security and trust</div>
      <p className={styles.bodyText}>Sealrail treats proof and payment safety as core product requirements.</p>

      <div className={styles.subLabel}>Key principles</div>
      <BulletList items={SECURITY_PRINCIPLES} />

      <div className={styles.subLabel}>Frontend handling</div>
      <p style={{ fontSize: 14, lineHeight: 1.6, color: "#5C5A55", margin: "10px 0 0" }}>
        Frontend should never store privileged keys in client-side code. Use server-side calls for protected operations, or only
        expose scoped keys with limited permissions.
      </p>
    </section>
  );
}

export function ChangelogSection() {
  return (
    <section id="changelog" className={styles.docSectionSpaced}>
      <div className={styles.sectionLabel}>Changelog</div>
      <div className={styles.subheading} style={{ marginTop: 12 }}>
        2026-07-01
      </div>

      <div className={styles.subLabel} style={{ color: "#64D96B" }}>
        Added
      </div>
      <BulletList items={CHANGELOG_ADDED} dotColor="#64D96B" />

      <div className={styles.subLabel} style={{ color: "#3C8DFF" }}>
        Improved
      </div>
      <BulletList items={CHANGELOG_IMPROVED} dotColor="#3C8DFF" />

      <div className={styles.subLabel} style={{ color: "#F2B84B" }}>
        Known blockers
      </div>
      <BulletList items={CHANGELOG_BLOCKERS} dotColor="#F2B84B" />
    </section>
  );
}

export function GlossarySection() {
  return (
    <section id="glossary" className={styles.docSectionSpaced}>
      <div className={styles.sectionLabel}>Glossary</div>
      <div className={styles.kvRows}>
        {GLOSSARY_TERMS.map((row) => (
          <div key={row.term} className={styles.kvRow} style={{ gridTemplateColumns: "160px 1fr", padding: "13px 0" }}>
            <span style={{ fontFamily: "var(--font-serif)", fontSize: 15, color: "#2C2C2B" }}>{row.term}</span>
            <span style={{ fontSize: 13.5, lineHeight: 1.55, color: "#5C5A55" }}>{row.def}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

export function AiDocsSection() {
  return (
    <section id="ai-docs" className={styles.docSectionSpaced}>
      <div className={styles.sectionLabel}>AI-readable docs</div>
      <p className={styles.bodyText} style={{ maxWidth: "none" }}>
        Sealrail publishes llms.txt and llms-full.txt so AI coding tools and assistant agents can understand Sealrail accurately.
      </p>

      <div className={styles.subLabel}>llms.txt</div>
      <CodeBlock label="" text={LLMS_TXT} />

      <div className={styles.subLabel}>llms-full.txt</div>
      <p style={{ fontSize: 13.5, color: "#5C5A55", margin: "10px 0 8px" }}>A longer version containing:</p>
      <BulletList items={LLMS_FULL_CONTENTS} />
    </section>
  );
}
