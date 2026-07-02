import Image from "next/image";
import Link from "next/link";
import { SealrailMark } from "@/components/brand/SealrailMark";
import { MobileNav } from "@/components/nav/MobileNav";
import styles from "./Landing.module.css";

const NAV_ITEMS = [
  { label: "How it works", href: "#how" },
  { label: "Proofs", href: "#proofs" },
  { label: "Agents", href: "#vertical" },
  { label: "Docs", href: "/docs" },
  { label: "Start run", href: "/run" },
];

export function Hero() {
  return (
    <section id="top" className={styles.heroSection} aria-label="Sealrail — No Proof without a Payment">
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
        <MobileNav items={NAV_ITEMS} theme="light" />
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
