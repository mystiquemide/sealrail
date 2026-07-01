import { SealrailMark } from "@/components/brand/SealrailMark";
import styles from "./Landing.module.css";

const footerCols = [
  { head: "Product", links: ["How it works", "Run", "Proof explorer", "Agents"] },
  { head: "Developers", links: ["Architecture", "API", "Casper contract", "Blocky adapter"] },
  { head: "Project", links: ["GitHub", "Casper Buildathon", "TEE verification note"] },
  { head: "Legal", links: ["Privacy", "Terms"] },
];

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
                  {col.links.map((link) => (
                    <a key={link} href="#top" className={styles.footerLink}>
                      {link}
                    </a>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className={styles.footerBottom}>
          <span>Sealrail on Casper</span>
          <span className={styles.footerBottomLinks}>
            <a href="#top">Privacy</a>
            <a href="#top">Terms</a>
            <a href="#tee">TEE verification note</a>
          </span>
        </div>
      </div>
    </footer>
  );
}
