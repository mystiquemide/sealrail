import type { SplitRow } from "./workflow-detail-state";
import styles from "./WorkflowDetail.module.css";

export function PaymentSplitTable({ splits }: { splits: SplitRow[] }) {
  return (
    <div className={styles.section}>
      <div className={styles.sectionLabel}>Payment split</div>
      <div className={styles.splitTable}>
        <div className={`${styles.splitHead} ${styles.splitGridCols}`}>
          <span>Recipient</span>
          <span>Role</span>
          <span>Share</span>
          <span style={{ textAlign: "right" }}>State</span>
        </div>
        {splits.map((p) => (
          <div key={p.recipient} className={`${styles.splitRow} ${styles.splitGridCols}`}>
            <span className={styles.splitRecipient}>{p.recipient}</span>
            <span className={styles.splitRole}>{p.role}</span>
            <span className={styles.splitShare}>{p.share}</span>
            <span className={styles.splitState} style={{ color: p.color }}>
              <span className={styles.splitStateDot} style={{ background: p.color }} />
              {p.state}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
