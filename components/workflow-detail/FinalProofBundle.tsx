import styles from "./WorkflowDetail.module.css";

type FinalProofBundleProps = {
  bundleText: string;
  ready: boolean;
  copyLabel: string;
  onCopy: () => void;
};

export function FinalProofBundle({ bundleText, ready, copyLabel, onCopy }: FinalProofBundleProps) {
  return (
    <div className={styles.bundleCard} style={{ opacity: ready ? 1 : 0.45 }}>
      <div className={styles.bundleHeader}>
        <div className={styles.sectionLabel} style={{ marginBottom: 0 }}>
          Final proof bundle
        </div>
        <button onClick={onCopy} disabled={!ready} className={styles.copyButton} style={{ cursor: ready ? "pointer" : "not-allowed" }}>
          {copyLabel}
        </button>
      </div>
      <pre className={styles.bundlePre}>{bundleText}</pre>
    </div>
  );
}
