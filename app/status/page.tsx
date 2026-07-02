import { AppNav } from "@/components/app/AppNav";
import { getPublicStatus } from "@/lib/api";
import type { PublicStatus } from "@/lib/api-types";
import styles from "@/components/status/Status.module.css";

const GREEN = "#64D96B";
const AMBER = "#F2B84B";
const RED = "#F45B45";
const GRAY = "#6E6E6C";

function buildRows(s: PublicStatus) {
  return [
    {
      name: "Backend API",
      state: s.status === "ok" ? "Online" : s.status === "degraded" ? "Degraded" : "Not ready",
      color: s.status === "ok" ? GREEN : s.status === "degraded" ? AMBER : RED,
    },
    {
      name: "LLM provider configured",
      state: s.llm_configured ? "Yes" : "Provider config pending - no runtime active",
      color: s.llm_configured ? GREEN : AMBER,
    },
    {
      name: "LLM provider health",
      state: s.llm_configured ? "Configured - health checked per run" : "No runtime active until configured",
      color: s.llm_configured ? GREEN : GRAY,
    },
    {
      name: "Hosted TEE (Blocky AS)",
      state: s.hosted_tee_ready
        ? "Ready"
        : s.tee_hookup_blocked
          ? "Pending - hosted access not configured"
          : s.blocky_cli_available
            ? "CLI available (dry-run mode)"
            : "Unavailable",
      color: s.hosted_tee_ready ? GREEN : AMBER,
    },
    {
      name: "Casper RPC",
      state: `${s.casper_mode} mode`,
      color: s.casper_mode === "testnet" || s.casper_mode === "mainnet" ? GREEN : AMBER,
    },
    {
      name: "ProofRegistry contract",
      state: s.casper_contract_ready ? "Deployed" : "Not configured",
      color: s.casper_contract_ready ? GREEN : AMBER,
    },
    {
      name: "Database",
      state: s.db_connected ? "Connected" : "Disconnected",
      color: s.db_connected ? GREEN : RED,
    },
    {
      name: "CSPR.cloud / Explorer visibility",
      state: "Proof receipts expose deploy/anchor fields; live finality check is the next production add-on",
      color: GRAY,
    },
  ];
}

export default async function StatusPage() {
  let status: PublicStatus | null = null;
  let error = false;

  try {
    status = await getPublicStatus();
  } catch {
    error = true;
  }

  const rows = error
    ? [{ name: "Backend API", state: "Unreachable - check NEXT_PUBLIC_API_URL and that the backend is running", color: RED }]
    : status
      ? buildRows(status)
      : [];

  return (
    <div className={styles.page}>
      <AppNav active="Status" maxWidth={860} links={[{ label: "Docs", href: "/docs" }, { label: "Review", href: "/review" }]} cta={null} />

      <main id="main" tabIndex={-1} className={styles.wrap}>
        <div className={styles.eyebrow}>System status</div>
        <h1 className={styles.title}>Health checks for the proof and payment rail.</h1>

        <div className={styles.rows}>
          {rows.map((s) => (
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
          {status ? ` Uptime: ${Math.floor(status.uptime_seconds)}s.` : ""}
        </p>
      </main>
    </div>
  );
}
