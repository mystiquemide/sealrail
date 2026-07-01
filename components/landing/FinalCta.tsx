import styles from "./Landing.module.css";

export function FinalCta() {
  return (
    <section id="run" className={styles.sectionBlack}>
      <div className={styles.container} style={{ textAlign: "center" }}>
        <h2 className={styles.finalCtaTitle}>Pay agents only after proof.</h2>
        <div className={styles.finalCtaButtons}>
          <a href="#top" className={styles.btnWhite}>
            Start verification run
          </a>
          <a href="#how" className={styles.btnGhost}>
            Read architecture
          </a>
        </div>
      </div>
    </section>
  );
}
