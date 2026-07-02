import Link from "next/link";
import type { ProofRow } from "./proofs-data";
import { BACKEND_UNREACHABLE_BODY } from "@/lib/copy";
import styles from "./Proofs.module.css";

type ProofsTableProps = {
  view: {
    showTable: boolean;
    showLoading: boolean;
    showEmpty: boolean;
    showNoResults: boolean;
    showError: boolean;
  };
  rows: ProofRow[];
  onClearFilters: () => void;
  onRetry: () => void;
};

const HEAD_COLUMNS = ["Task ID", "Agent", "Proof state", "Payment state", "Casper"];

function TableHead() {
  return (
    <div className={`${styles.tableHead} ${styles.gridCols}`}>
      {HEAD_COLUMNS.map((c) => (
        <span key={c}>{c}</span>
      ))}
      <span style={{ textAlign: "right" }}>Action</span>
    </div>
  );
}

export function ProofsTable({ view, rows, onClearFilters, onRetry }: ProofsTableProps) {
  if (view.showLoading) {
    return (
      <div className={styles.table}>
        <TableHead />
        {[1, 2, 3].map((i) => (
          <div key={i} className={`${styles.skeletonRow} ${styles.gridCols}`}>
            <span className={styles.skeletonBar} style={{ width: "70%" }} />
            <span className={styles.skeletonBar} style={{ width: "80%" }} />
            <span className={styles.skeletonBar} style={{ width: "55%" }} />
            <span className={styles.skeletonBar} style={{ width: "55%" }} />
            <span className={styles.skeletonBar} style={{ width: "70%" }} />
            <span />
          </div>
        ))}
        <div className={styles.loadingCaption}>Loading proofs...</div>
      </div>
    );
  }

  if (view.showEmpty) {
    return (
      <div className={styles.stateBlock}>
        <div className={styles.stateTitle}>No proof records yet</div>
        <p className={styles.stateBody}>Once a task is funded and run, its proof and payment state will appear here.</p>
        <Link href="/run" className={styles.stateButtonPrimary}>
          Start a run
        </Link>
      </div>
    );
  }

  if (view.showNoResults) {
    return (
      <div className={styles.stateBlock}>
        <div className={styles.stateTitle}>No proofs match this filter</div>
        <p className={styles.stateBodyWide} style={{ textAlign: "center" }}>
          Try a different task ID, status, or mode.
        </p>
        <button onClick={onClearFilters} className={styles.stateButtonGhost}>
          Clear filters
        </button>
      </div>
    );
  }

  if (view.showError) {
    return (
      <div className={styles.stateBlock}>
        <div className={styles.errorTag}>
          <span className={styles.errorDot} />
          Error loading proofs
        </div>
        <p className={styles.stateBody}>{BACKEND_UNREACHABLE_BODY}</p>
        <button onClick={onRetry} className={styles.stateButtonPrimary}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className={styles.table}>
      <TableHead />
      {rows.map((r) => (
        <div key={r.task} className={`${styles.row} ${styles.gridCols}`}>
          <span className={styles.taskId}>{r.task}</span>
          <span className={styles.agent}>{r.agent}</span>
          <span className={styles.stateTag} style={{ color: r.proofColor }}>
            <span className={styles.stateDot} style={{ background: r.proofColor }} />
            {r.proofState}
          </span>
          <span className={styles.stateTag} style={{ color: r.payColor }}>
            <span className={styles.stateDot} style={{ background: r.payColor }} />
            {r.payState}
          </span>
          <span className={styles.hash}>{r.hash}</span>
          <Link href={r.href} className={styles.action}>
            Open proof
          </Link>
        </div>
      ))}
    </div>
  );
}
