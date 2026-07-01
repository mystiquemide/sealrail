import Link from "next/link";
import styles from "./Run.module.css";

type ProofHashesPanelProps = {
  outVisible: boolean;
  outputHash: string;
  outputHashColor: string;
  wasmHash: string;
  wasmColor: string;
  attHash: string;
  attColor: string;
  anchHash: string;
  anchColor: string;
  paymentState: string;
  paymentStateColor: string;
  hasProof: boolean;
  copyLabel: string;
  onCopy: () => void;
};

export function ProofHashesPanel({
  outVisible,
  outputHash,
  outputHashColor,
  wasmHash,
  wasmColor,
  attHash,
  attColor,
  anchHash,
  anchColor,
  paymentState,
  paymentStateColor,
  hasProof,
  copyLabel,
  onCopy,
}: ProofHashesPanelProps) {
  return (
    <div className={styles.panel} style={{ opacity: outVisible ? 1 : 0.4, transition: "opacity .4s" }}>
      <div className={styles.panelLabel}>Proof hashes</div>
      <div className={styles.hashRows}>
        <div className={styles.hashRow}>
          <span className={styles.hashRowLabel}>Output hash</span>
          <span className={styles.hashRowValue} style={{ color: outputHashColor }}>
            {outputHash}
          </span>
        </div>
        <div className={styles.hashRow}>
          <span className={styles.hashRowLabel}>WASM code hash</span>
          <span className={styles.hashRowValue} style={{ color: wasmColor }}>
            {wasmHash}
          </span>
        </div>
        <div className={styles.hashRow}>
          <span className={styles.hashRowLabel}>Attestation hash</span>
          <span className={styles.hashRowValue} style={{ color: attColor }}>
            {attHash}
          </span>
        </div>
        <div className={styles.hashRow}>
          <span className={styles.hashRowLabel}>Casper anchor</span>
          <span className={styles.hashRowValue} style={{ color: anchColor }}>
            {anchHash}
          </span>
        </div>
        <div className={styles.hashRow}>
          <span className={styles.hashRowLabel}>Payment unlock state</span>
          <span className={styles.hashRowStateTag} style={{ color: paymentStateColor }}>
            <span className={styles.hashRowStateDot} style={{ background: paymentStateColor }} />
            {paymentState}
          </span>
        </div>
      </div>
      <div className={styles.hashActions}>
        <button
          onClick={onCopy}
          disabled={!hasProof}
          className={styles.copyButton}
          style={{
            background: hasProof ? "#FFFFFF" : "transparent",
            color: hasProof ? "#080808" : "#6E6E6C",
            borderColor: hasProof ? "#FFFFFF" : "rgba(255,255,255,0.12)",
            borderWidth: 1,
            borderStyle: "solid",
            opacity: hasProof ? 1 : 0.55,
            cursor: hasProof ? "pointer" : "not-allowed",
          }}
        >
          {copyLabel}
        </button>
        <Link
          href="/#proofs"
          className={styles.detailLink}
          style={{ opacity: hasProof ? 1 : 0.55, pointerEvents: hasProof ? "auto" : "none" }}
        >
          Open proof detail
        </Link>
      </div>
    </div>
  );
}
