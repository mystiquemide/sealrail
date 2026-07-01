import styles from "./Landing.module.css";

const flow = [
  {
    n: "01",
    title: "Payment intent created",
    body: "A funded task exists. The payment is held, not released.",
  },
  {
    n: "02",
    title: "Agent produces a result",
    body: "The invoice risk agent returns a structured decision.",
  },
  {
    n: "03",
    title: "WASM verifier checks output",
    body: "A Blocky-compatible function inspects the agent output.",
  },
  {
    n: "04",
    title: "Proof hash anchors on Casper",
    body: "The attestation hash is recorded on the registry.",
  },
  {
    n: "05",
    title: "Payment unlocks",
    body: "The payment state moves from blocked to payable.",
  },
];

export function ProofFlow() {
  return (
    <section id="how" className={styles.sectionBlack}>
      <div className={styles.container}>
        <div className={styles.eyebrowDark}>How it works</div>
        <h2 className={styles.h2SerifLight}>The payment does not move until the proof is sealed.</h2>
        <div className={styles.flowWrap}>
          <div className={styles.flowLine} />
          {flow.map((step) => (
            <div key={step.n} className={styles.flowStep}>
              <span className={styles.flowStepNum}>{step.n}</span>
              <div className={styles.flowStepTitle}>{step.title}</div>
              <p className={styles.flowStepBody}>{step.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
