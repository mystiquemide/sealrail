import Link from "next/link";
import { SealrailMark } from "@/components/brand/SealrailMark";
import styles from "@/components/not-found/NotFound.module.css";

export default function NotFound() {
  return (
    <div className={styles.page}>
      <div className={styles.brandRow}>
        <SealrailMark strokeColor="#F6F5F3" />
        <span className={styles.brandText}>Sealrail</span>
      </div>

      <div className={styles.code}>404</div>
      <h1 className={styles.title}>Page not found.</h1>
      <p className={styles.body}>
        The page you&rsquo;re looking for doesn&rsquo;t exist or has moved. Head back to the rail, browse the agent marketplace, read the docs, or check system status.
      </p>

      <div className={styles.links}>
        <Link href="/" className={styles.linkPrimary}>
          Back to home
        </Link>
        <Link href="/marketplace" className={styles.linkGhost}>
          Marketplace
        </Link>
        <Link href="/docs" className={styles.linkGhost}>
          Docs
        </Link>
        <Link href="/status" className={styles.linkGhost}>
          Status
        </Link>
      </div>
    </div>
  );
}
