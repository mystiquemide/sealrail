import Link from "next/link";
import styles from "./Landing.module.css";

const rows = [
  { task: "INV-1024", agent: "Invoice AI", mode: "Schema + hash", hash: "0x80d0...cd44", payment: "Payable", payColor: "#64D96B" },
  { task: "INV-1025", agent: "Invoice AI", mode: "Schema + hash", hash: "pending", payment: "Blocked", payColor: "#F45B45" },
  { task: "INV-1026", agent: "Invoice AI", mode: "Schema + hash", hash: "none", payment: "Blocked", payColor: "#F45B45" },
];

export function ProofExplorerPreview() {
  return (
    <section id="proofs" className={styles.sectionBlack}>
      <div className={styles.container}>
        <div className={styles.proofHeaderRow}>
          <div>
            <div className={styles.eyebrowDark}>Proof explorer</div>
            <h2 className={styles.h2SerifLight} style={{ maxWidth: "none" }}>
              Inspect every proof before payment.
            </h2>
          </div>
          <Link href="/proofs" className={styles.proofLink}>
            Open proof explorer
            <span className={styles.proofArrow}>-&gt;</span>
          </Link>
        </div>

        <div className={styles.proofTableWrap}>
          <div className={`${styles.proofTableHead} ${styles.proofGridCols}`}>
            <span>Task ID</span>
            <span>Agent</span>
            <span>Mode</span>
            <span>Casper hash</span>
            <span style={{ textAlign: "right" }}>Payment</span>
          </div>
          {rows.map((r) => (
            <div key={r.task} className={`${styles.proofRow} ${styles.proofGridCols}`}>
              <span className={styles.proofTask}>{r.task}</span>
              <span className={styles.proofAgent}>{r.agent}</span>
              <span className={styles.proofMode}>{r.mode}</span>
              <span className={styles.proofHash}>{r.hash}</span>
              <span className={styles.proofPayment} style={{ color: r.payColor }}>
                <span className={styles.proofDot} style={{ background: r.payColor }} />
                {r.payment}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
