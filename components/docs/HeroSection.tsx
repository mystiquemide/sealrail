import styles from "@/components/docs-legal/DocsLegal.module.css";
import { BulletList } from "./BulletList";
import { CodeBlock } from "./CodeBlock";
import { HERO_FLOW_TEXT, WHO_QUESTIONS } from "./docs-content";

export function HeroSection() {
  return (
    <div id="overview">
      <div className={styles.eyebrow}>Documentation</div>
      <h1 className={styles.title} style={{ maxWidth: 680 }}>
        Build proof-backed agent payment flows with Sealrail.
      </h1>
      <p className={styles.bodyText}>
        Sealrail connects agent work, verification, Casper anchoring, and payment unlocks into one reliable product flow.
        Sealrail is the rail between agent work and agent payment. Buyers fund tasks, agents produce work, Sealrail verifies
        the output, Casper anchors the proof, and payment unlocks only after verified proof.
      </p>

      <div className={styles.heroBadge}>
        <span className={styles.heroBadgeDot} />
        <span className={styles.heroBadgeText}>No Proof without a Payment.</span>
      </div>

      <div className={styles.headerActions}>
        <a href="#quickstart" className={styles.btnPrimary}>
          Start with the quickstart
        </a>
        <a href="#concepts" className={styles.btnGhost}>
          Explore core concepts
        </a>
        <a href="#api-reference" className={styles.btnGhost}>
          View API reference
        </a>
        <a href="#deployment" className={styles.btnGhost}>
          Check deployment readiness
        </a>
      </div>

      <CodeBlock label="" text={HERO_FLOW_TEXT} />

      <div style={{ marginTop: 28 }}>
        <p className={styles.bodyText} style={{ margin: 0 }}>
          Sealrail is built for teams that need proof-backed payment rails for autonomous agents, AI workers, API agents,
          verification networks, and agent marketplaces. Use Sealrail when you need to answer:
        </p>
        <BulletList items={WHO_QUESTIONS} dotColor="var(--accent, #B4341F)" />
      </div>
    </div>
  );
}
