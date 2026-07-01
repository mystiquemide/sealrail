import Link from "next/link";
import { SealrailMark } from "@/components/brand/SealrailMark";
import styles from "./DocsNav.module.css";

type DocsNavLink = { label: string; href: string };
type DocsNavCta = { label: string; href: string };

type DocsNavProps = {
  active?: string;
  links: DocsNavLink[];
  cta?: DocsNavCta | null;
  maxWidth?: number;
};

export function DocsNav({ active, links, cta, maxWidth = 860 }: DocsNavProps) {
  return (
    <header className={styles.header}>
      <div className={styles.inner} style={{ maxWidth }}>
        <Link href="/" className={styles.brand}>
          <SealrailMark strokeColor="#2C2C2B" />
          <span className={styles.brandText}>Sealrail</span>
        </Link>
        <nav className={styles.links}>
          {active ? <span className={styles.active}>{active}</span> : null}
          {links.map((link) => (
            <Link key={link.label} href={link.href} className={styles.link}>
              {link.label}
            </Link>
          ))}
          {cta ? (
            <Link href={cta.href} className={styles.cta}>
              {cta.label}
            </Link>
          ) : null}
        </nav>
      </div>
    </header>
  );
}
