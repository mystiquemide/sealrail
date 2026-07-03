import Link from "next/link";
import { SealrailMark } from "@/components/brand/SealrailMark";
import { MobileNav } from "@/components/nav/MobileNav";
import styles from "./AppNav.module.css";

export type AppNavLink = { label: string; href: string };

export type AppNavCta = { label: string; href: string; variant?: "primary" | "ghost" };

type AppNavProps = {
  active?: string;
  links?: AppNavLink[];
  cta?: AppNavCta | null;
  maxWidth?: number;
};

const DEFAULT_LINKS: AppNavLink[] = [
  { label: "Proofs", href: "/proofs" },
  { label: "Agents", href: "/agents" },
  { label: "API keys", href: "/api-keys" },
  { label: "Docs", href: "/docs" },
];

const DEFAULT_CTA: AppNavCta = { label: "View proofs", href: "/proofs", variant: "ghost" };

export function AppNav({ active, links = DEFAULT_LINKS, cta = DEFAULT_CTA, maxWidth = 1240 }: AppNavProps) {
  return (
    <header className={styles.header}>
      <div className={styles.inner} style={{ maxWidth }}>
        <Link href="/" className={styles.brand}>
          <SealrailMark strokeColor="#F6F5F3" />
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
            <Link href={cta.href} className={cta.variant === "primary" ? styles.ctaPrimary : styles.cta}>
              {cta.label}
            </Link>
          ) : null}
        </nav>
        <MobileNav items={cta ? [...links, cta] : links} theme="dark" />
      </div>
    </header>
  );
}
