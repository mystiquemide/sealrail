import type { RailStep } from "./run-state";
import styles from "./Run.module.css";

// Matches the GREEN completed-state color in run-state.ts
const COMPLETE_GREEN = "#64D96B";

function dotAnimation(step: RailStep): string {
  if (step.pulse) return "srPulse 1.1s ease-in-out infinite";
  if (step.dotColor === COMPLETE_GREEN) return "srCompleteGlow 0.9s ease-out";
  return "none";
}

export function LiveProofRail({ steps, taskTitle }: { steps: RailStep[]; taskTitle: string }) {
  return (
    <div className={styles.railRight}>
      <div className={styles.railPanel}>
        <div className={styles.railLineOuter} />
        <div className={styles.railLineInner} />
        <div className={styles.railHeader}>
          <span className={styles.panelLabel}>Live proof rail</span>
          <span className={styles.railHeaderTask}>{taskTitle}</span>
        </div>

        <div className={styles.railSteps}>
          {steps.map((s) => (
            <div key={s.n} className={styles.railStep}>
              <span
                className={`${styles.railStepDot} ${s.pulse ? styles.dotPulse : ""}`}
                style={{
                  borderColor: s.dotColor,
                  background: s.dotColor,
                  animation: dotAnimation(s),
                }}
              />
              <div className={styles.railStepRow}>
                <span className={styles.railStepLabel}>
                  {s.n} {s.label}
                </span>
                <span className={styles.railStepStatus} style={{ color: s.color }}>
                  <span
                    className={`${styles.railStepStatusDot} ${s.pulse ? styles.dotPulse : ""}`}
                    style={{ background: s.color, animation: s.pulse ? "srPulse 1.1s ease-in-out infinite" : "none" }}
                  />
                  {s.statusText}
                </span>
              </div>
              <div className={styles.railStepSub}>{s.sub}</div>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.teeNote}>
        <div className={styles.teeNoteHeader}>
          <span className={styles.teeNoteDot} />
          TEE verification mode
        </div>
        <p className={styles.teeNoteBody}>
          This run uses TEE-compatible attestation. Hosted Blocky AS can replace this adapter when access is live.
        </p>
      </div>
    </div>
  );
}
