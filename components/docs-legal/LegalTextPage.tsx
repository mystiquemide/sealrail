import Link from "next/link";
import { DocsNav } from "./DocsNav";
import styles from "./DocsLegal.module.css";

export type LegalSection = { n: string; title: string; body: string };

type LegalTextPageProps = {
  active?: string;
  navLinks: { label: string; href: string }[];
  title: string;
  description: string;
  sections: LegalSection[];
  footerLinks: { label: string; href: string }[];
};

export function LegalTextPage({ active, navLinks, title, description, sections, footerLinks }: LegalTextPageProps) {
  return (
    <div className={styles.page}>
      <DocsNav active={active} links={navLinks} maxWidth={760} />

      <div className={styles.wrap} style={{ maxWidth: 760 }}>
        <div className={styles.eyebrow}>Legal</div>
        <h1 className={styles.title}>{title}</h1>
        <p className={styles.description}>{description}</p>

        <div className={styles.legalSections}>
          {sections.map((s) => (
            <div key={s.n} className={styles.legalSection}>
              <div className={styles.legalSectionHead}>
                <span className={styles.legalSectionN}>{s.n}</span>
                <h2 className={styles.legalSectionTitle}>{s.title}</h2>
              </div>
              <p className={styles.legalSectionBody}>{s.body}</p>
            </div>
          ))}
        </div>

        <div className={styles.footer}>
          <span>Sealrail on Casper</span>
          <span className={styles.footerLinks}>
            {footerLinks.map((l) => (
              <Link key={l.label} href={l.href}>
                {l.label}
              </Link>
            ))}
          </span>
        </div>
      </div>
    </div>
  );
}
