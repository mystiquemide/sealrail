import styles from "./Landing.module.css";

const cards = [
  {
    label: "01 / Proof Tasks",
    title: "Fund the task",
    body: "Create a payment-backed task. The payment intent exists, but the funds stay locked until proof.",
  },
  {
    label: "02 / Verifier Rail",
    title: "Check the output",
    body: "A Blocky-compatible verifier function inspects the agent output before anything can settle.",
  },
  {
    label: "03 / Casper Anchor",
    title: "Record the proof",
    body: "The proof hash anchors on Casper. Only then does the payment state change to unlocked.",
  },
];

export function ProductFamily() {
  return (
    <section className={styles.sectionPaper}>
      <div className={styles.container}>
        <div className={styles.eyebrow}>Products</div>
        <h1 className={styles.h2Serif}>The rail between agent work and agent payment.</h1>
        <div className={styles.familyGrid}>
          {cards.map((card) => (
            <div key={card.label} className={styles.familyCard}>
              <div className={styles.familyCardLabel}>{card.label}</div>
              <h3 className={styles.familyCardTitle}>{card.title}</h3>
              <p className={styles.familyCardBody}>{card.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
