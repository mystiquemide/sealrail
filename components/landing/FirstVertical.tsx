import styles from "./Landing.module.css";

const vertical = [
  { n: "01", label: "Invoice submitted" },
  { n: "02", label: "Agent risk score" },
  { n: "03", label: "Blocky-compatible check" },
  { n: "04", label: "Casper anchor" },
  { n: "05", label: "Payment unlocked" },
];

export function FirstVertical() {
  return (
    <section id="vertical" className={styles.sectionPaperTop}>
      <div className={styles.container}>
        <div className={styles.verticalWrap}>
          <div className={styles.verticalCol}>
            <div className={styles.eyebrow}>First production vertical</div>
            <h2 className={styles.verticalTitle}>RWA invoice verification is the first proof rail.</h2>
            <p className={styles.verticalBody}>
              The invoice agent can produce an answer, but the payment stays blocked until the verifier
              accepts the output.
            </p>
            <div className={styles.verticalList}>
              {vertical.map((v) => (
                <div key={v.n} className={styles.verticalItem}>
                  <span className={styles.verticalItemNum}>{v.n}</span>
                  <span className={styles.verticalItemLabel}>{v.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
