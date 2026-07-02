import Link from "next/link";
import { SealrailMark } from "@/components/brand/SealrailMark";
import styles from "./Landing.module.css";

const footerCols = [
  { head: "Product", links: ["How it works", "Run", "Proof explorer", "Agents"] },
  { head: "Developers", links: ["Architecture", "API", "API keys", "Casper contract", "Blocky adapter"] },
  { head: "Project", links: ["GitHub", "Casper Network", "TEE verification note"] },
  { head: "Legal", links: ["Privacy", "Terms"] },
];

const FOOTER_LINK_HREFS: Record<string, string> = {
  "How it works": "#how",
  Run: "/run",
  "Proof explorer": "/proofs",
  Agents: "/agents",
  Architecture: "/docs#product-flow",
  API: "/docs#api-reference",
  "API keys": "/api-keys",
  "Casper contract":
    "https://testnet.cspr.live/transaction/b2c6a9326545a137c3d7772385e9fe8003129e29f29336d451785e6a7f3a6196",
  "Blocky adapter": "/docs#safety",
  GitHub: "https://github.com/mystiquemide/sealrail",
  "Casper Network": "https://casper.network",
  "TEE verification note": "#tee",
  Privacy: "/privacy",
  Terms: "/terms",
};

function footerHref(label: string): string {
  return FOOTER_LINK_HREFS[label] ?? "#top";
}

export function Footer() {
  return (
    <footer className={styles.sectionPaper}>
      <div className={styles.footerInner}>
        <div className={styles.footerTop}>
          <div className={styles.footerBrandCol}>
            <div className={styles.footerBrandRow}>
              <SealrailMark width={30} height={22} />
              <span className={styles.footerBrandText}>Sealrail</span>
            </div>
            <p className={styles.footerTagline}>No Proof without a Payment.</p>
            <p className={styles.footerSub}>A Casper-native proof and payment rail for AI-agent work.</p>
          </div>
          <div className={styles.footerCols}>
            {footerCols.map((col) => (
              <div key={col.head}>
                <div className={styles.footerColHead}>{col.head}</div>
                <div className={styles.footerColLinks}>
                  {col.links.map((link) => {
                    const href = footerHref(link);
                    if (href.startsWith("http")) {
                      return (
                        <a key={link} href={href} className={styles.footerLink} target="_blank" rel="noopener noreferrer">
                          {link}
                        </a>
                      );
                    }
                    if (href.startsWith("/")) {
                      return (
                        <Link key={link} href={href} className={styles.footerLink}>
                          {link}
                        </Link>
                      );
                    }
                    return (
                      <a key={link} href={href} className={styles.footerLink}>
                        {link}
                      </a>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className={styles.footerBottom}>
          <span>&copy; 2026 Sealrail. Released under the MIT License.</span>
          <span>Sealrail on Casper</span>
        </div>
      </div>
    </footer>
  );
}
