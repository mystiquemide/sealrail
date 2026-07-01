import Image from "next/image";
import { SealrailMark } from "@/components/brand/SealrailMark";
import styles from "./Landing.module.css";

export function Hero() {
  return (
    <section id="top" className={styles.heroSection}>
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
          <a href="#tee" className={styles.navLink}>
            Docs
          </a>
          <a href="#run" className={styles.navCta}>
            Start run
          </a>
        </nav>
      </header>

      <div className={styles.heroCtaWrap}>
        <a href="#run" className={styles.heroCtaPrimary}>
          Start verification run
        </a>
        <a href="#proofs" className={styles.heroCtaSecondary}>
          View proof trail
        </a>
      </div>
    </section>
  );
}
