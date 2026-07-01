import type { StepRun } from "./workflow-detail-state";
import styles from "./WorkflowDetail.module.css";

export function StepRuns({ steps }: { steps: StepRun[] }) {
  return (
    <div className={styles.section}>
      <div className={styles.sectionLabel}>Step runs</div>
      <div className={styles.stepsCard}>
        {steps.map((s) => (
          <div key={s.n} className={styles.stepRow}>
            <div className={styles.stepLeft}>
              <span
                className={`${styles.stepDot} ${s.pulse ? styles.dotPulse : ""}`}
                style={{
                  borderColor: s.dotBorder,
                  background: s.dotBg,
                  animation: s.pulse ? "srPulse 1.1s ease-in-out infinite" : "none",
                }}
              />
              <div>
                <div className={styles.stepName}>
                  {s.n} {s.name}
                </div>
                <div className={styles.stepVerifier}>verifier: {s.verifier}</div>
              </div>
            </div>
            <span className={styles.stepStatus} style={{ color: s.color }}>
              <span className={styles.stepStatusDot} style={{ background: s.color }} />
              {s.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
