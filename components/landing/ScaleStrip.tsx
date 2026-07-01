import styles from "./Landing.module.css";

const metrics = [
  { value: "1", label: "payment intent per task" },
  { value: "1", label: "verifier function per task" },
  { value: "1", label: "Casper anchor per proof" },
  { value: "0", label: "paid without proof" },
];

export function ScaleStrip() {
  return (
    <section className={styles.sectionGray}>
      <div className={styles.container}>
        <p className={styles.scaleLead}>Built for trust before scale.</p>
        <div className={styles.metricsGrid}>
          {metrics.map((m) => (
            <div key={m.label} className={styles.metricCard}>
              <div className={styles.metricValue}>{m.value}</div>
              <div className={styles.metricLabel}>{m.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
