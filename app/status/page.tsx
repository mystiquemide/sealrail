import { AppNav } from "@/components/app/AppNav";
import styles from "@/components/status/Status.module.css";

const STATUSES = [
  { name: "Backend API", state: "Online", color: "#64D96B" },
  { name: "LLM provider configured", state: "Yes", color: "#64D96B" },
  { name: "LLM provider health", state: "OK", color: "#64D96B" },
  { name: "TEE verifier", state: "Ready", color: "#64D96B" },
  { name: "Casper RPC", state: "Connected", color: "#64D96B" },
  { name: "ProofRegistry contract", state: "Deployed", color: "#64D96B" },
  { name: "CSPR.cloud", state: "Connected", color: "#64D96B" },
];

export default function StatusPage() {
  return (
    <div className={styles.page}>
      <AppNav active="Status" maxWidth={860} links={[{ label: "Docs", href: "/docs" }]} cta={null} />

      <div className={styles.wrap}>
        <div className={styles.eyebrow}>System status</div>
        <h1 className={styles.title}>Health checks for the proof and payment rail.</h1>

        <div className={styles.rows}>
          {STATUSES.map((s) => (
            <div key={s.name} className={styles.row}>
              <span className={styles.rowName}>{s.name}</span>
              <span className={styles.rowState} style={{ color: s.color }}>
                <span className={styles.rowStateDot} style={{ background: s.color }} />
                {s.state}
              </span>
            </div>
          ))}
        </div>

        <p className={styles.footNote}>
          Status reflects the components required for a task to move from funded to proof-verified to paid.
        </p>
      </div>
    </div>
  );
}
