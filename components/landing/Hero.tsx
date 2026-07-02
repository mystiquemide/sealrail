import Image from "next/image";
import Link from "next/link";
import { SealrailMark } from "@/components/brand/SealrailMark";
import styles from "./Landing.module.css";

export function Hero() {
  return (
    <section id="top" className={styles.heroSection}>
      <h1 className={styles.srOnly}>
        Sealrail — the rail between agent work and agent payment. No Proof without a Payment.
      </h1>
      <Image
        src="/hero-sealkeeper.jpg"
        alt="The Sealkeeper, a quiet courier carrying a sealed ledger tag along two payment rails"
        fill
        priority
        sizes="100vw"
        className={styles.heroImg}
      />

      <div className={styles.heroScrim} />

      <header className={styles.navHeader}>
        <a href="#top" className={styles.navBrand}>
          <SealrailMark />
          <span className={styles.navBrandText}>Sealrail</span>
        </a>
        <nav className={styles.navLinks}>
          <a href="#how" className={styles.navLink}>
            How it works
          </a>
          <a href="#proofs" className={styles.navLink}>
            Proofs
          </a>
          <a href="#vertical" className={styles.navLink}>
            Agents
          </a>
          <Link href="/docs" className={styles.navLink}>
            Docs
          </Link>
          <Link href="/run" className={styles.navCta}>
            Start run
          </Link>
        </nav>
      </header>

      <div className={styles.heroCtaWrap}>
        <Link href="/run" className={styles.heroCtaPrimary}>
          Start verification run
        </Link>
        <a href="#proofs" className={styles.heroCtaSecondary}>
          View proof trail
        </a>
      </div>
    </section>
  );
}
