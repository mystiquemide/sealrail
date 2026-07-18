import styles from "./Landing.module.css";

export function TeeVerification() {
  return (
    <section id="tee" className={styles.sectionPaper}>
      <div className={styles.container}>
        <div className={styles.verticalWrap} style={{ alignItems: "flex-start" }}>
          <div className={styles.verticalCol}>
            <div className={styles.eyebrow}>Honest mode</div>
            <h2 className={styles.verticalTitle}>Verification before settlement.</h2>
            <p className={styles.verticalBody}>
              The live run uses schema checks and hash binding to verify agent output before payment can unlock.
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", marginTop: "30px" }}>
              <span className={`${styles.teeBadge} ${styles.teeBadgeAmber}`}>
                <span className={styles.teeDot} style={{ background: "#F2B84B" }} />
                Schema + hash verification
              </span>
              <span className={`${styles.teeBadge} ${styles.teeBadgeNeutral}`}>Hosted TEE pending</span>
              <span className={`${styles.teeBadge} ${styles.teeBadgeGreen}`}>
                <span className={styles.teeDot} style={{ background: "#64D96B" }} />
                Casper Anchored
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
