import { AppNav } from "@/components/app/AppNav";
import styles from "@/components/status/Status.module.css";

const STATUSES = [
  { name: "Backend API", state: "Endpoint expected at /api/status (Phase O wiring pending)", color: "#F2B84B" },
  { name: "LLM provider configured", state: "Provider config pending — no runtime active", color: "#F2B84B" },
  { name: "LLM provider health", state: "No runtime active until Phase O", color: "#6E6E6C" },
  { name: "Hosted TEE (Blocky AS)", state: "Pending — hosted access not configured", color: "#F2B84B" },
  { name: "Casper RPC", state: "Testnet node available, Phases O/S wire contract status", color: "#64D96B" },
  { name: "ProofRegistry contract", state: "Deployed (hash-02f9...) — Phase O wires live state", color: "#64D96B" },
  { name: "CSPR.cloud", state: "Optional data layer, not required for core product", color: "#6E6E6C" },
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
