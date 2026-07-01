import styles from "./Run.module.css";

type VerifiedOutputPanelProps = {
  outVisible: boolean;
  badge: string;
  color: string;
  riskScore: string;
  decision: string;
  reason: string;
  flags: string[];
  noFlags: boolean;
  flagsEmptyText: string;
};

export function VerifiedOutputPanel({
  outVisible,
  badge,
  color,
  riskScore,
  decision,
  reason,
  flags,
  noFlags,
  flagsEmptyText,
}: VerifiedOutputPanelProps) {
  return (
    <div className={styles.panel} style={{ opacity: outVisible ? 1 : 0.4, transition: "opacity .4s" }}>
      <div className={styles.outputHeader}>
        <div className={styles.panelLabel}>Verified output</div>
        <span className={styles.outputBadge} style={{ color }}>
          <span className={styles.outputBadgeDot} style={{ background: color }} />
          {badge}
        </span>
      </div>
      <div className={styles.outputRows}>
        <div className={styles.outputRow}>
          <span className={styles.outputRowLabel}>Risk score</span>
          <span className={styles.outputRowValue}>{riskScore}</span>
        </div>
        <div className={styles.outputRow}>
          <span className={styles.outputRowLabel}>Decision</span>
          <span className={styles.outputRowValue}>{decision}</span>
        </div>
        <div className={styles.outputReason}>
          <span className={styles.outputRowLabel}>Reason</span>
          <p className={styles.outputReasonBody}>{reason}</p>
        </div>
        <div className={styles.outputFlags}>
          <span className={styles.outputRowLabel}>Flags</span>
          <div className={styles.flagsRow}>
            {flags.map((f) => (
              <span key={f} className={styles.flagChip}>
                {f}
              </span>
            ))}
            {noFlags ? <span className={styles.flagsEmpty}>{flagsEmptyText}</span> : null}
          </div>
        </div>
      </div>
    </div>
  );
}
