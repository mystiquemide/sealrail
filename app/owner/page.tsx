import Link from "next/link";
import { AppNav } from "@/components/app/AppNav";
import { EARNINGS, INCOMING_TASKS, OWNED_AGENTS } from "@/components/owner/owner-data";
import styles from "@/components/owner/OwnerDashboard.module.css";

export default function OwnerPage() {
  return (
    <div className={styles.page}>
      <AppNav
        active="Owner"
        maxWidth={1080}
        links={[
          { label: "Agents", href: "/agents" },
          { label: "Marketplace", href: "/marketplace" },
        ]}
        cta={{ label: "Start run", href: "/run", variant: "primary" }}
      />

      <div className={styles.wrap}>
        <div className={styles.headerRow}>
          <div className={styles.headerCopy}>
            <div className={styles.eyebrow}>Owner dashboard</div>
            <h1 className={styles.title}>Manage proof-backed agents and payments.</h1>
          </div>
          <div className={styles.headerActions}>
            <Link href="/owner/agents/new" className={styles.btnPrimary}>
              Register agent
            </Link>
            <span
              title="Coming soon. Create a listing from an existing agent once you have more than one."
              className={styles.disabledAction}
            >
              Create listing
            </span>
            <span title="Coming soon. Verifier registration is not live in this build." className={styles.disabledAction}>
              Register verifier
            </span>
          </div>
        </div>

        <div className={styles.panelsWrap}>
          <div className={styles.panel}>
            <div className={styles.panelLabel}>Owned agents</div>
            <div className={styles.agentList}>
              {OWNED_AGENTS.map((a) => (
                <Link key={a.name} href={a.href} className={styles.agentRow}>
                  <span className={styles.agentRowName}>{a.name}</span>
                  <span className={styles.statusTag} style={{ color: a.statusColor }}>
                    <span className={styles.statusDot} style={{ background: a.statusColor }} />
                    {a.status}
                  </span>
                </Link>
              ))}
            </div>
          </div>

          <div className={styles.panel}>
            <div className={styles.panelLabel}>Earnings</div>
            <div className={styles.infoRows}>
              <div className={styles.infoRow}>
                <span className={styles.infoRowLabel}>Total earned</span>
                <span className={styles.infoRowValue}>{EARNINGS.totalEarned}</span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.infoRowLabel}>Unlockable</span>
                <span className={`${styles.infoRowValue} ${styles.infoRowValueSmall}`} style={{ color: "#F2B84B" }}>
                  {EARNINGS.unlockable}
                </span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.infoRowLabel}>Blocked</span>
                <span className={`${styles.infoRowValue} ${styles.infoRowValueSmall}`} style={{ color: "#F45B45" }}>
                  {EARNINGS.blocked}
                </span>
              </div>
            </div>
            <p className={styles.earningsNote}>Derived from payment recipient records tied to your agents.</p>
          </div>
        </div>

        <div className={styles.tasksSection}>
          <div className={styles.tasksLabel}>Incoming tasks</div>
          <div className={styles.tasksTable}>
            <div className={`${styles.tasksHead} ${styles.taskGridCols}`}>
              <span>Task ID</span>
              <span>Agent</span>
              <span>State</span>
              <span>Payment</span>
            </div>
            {INCOMING_TASKS.map((t) => (
              <Link key={t.task} href={t.href} className={`${styles.taskRow} ${styles.taskGridCols}`}>
                <span className={styles.taskId}>{t.task}</span>
                <span className={styles.taskAgent}>{t.agent}</span>
                <span className={styles.statusTag} style={{ color: t.stateColor }}>
                  <span className={styles.statusDot} style={{ background: t.stateColor }} />
                  {t.state}
                </span>
                <span className={styles.statusTag} style={{ color: t.payColor }}>
                  <span className={styles.statusDot} style={{ background: t.payColor }} />
                  {t.payment}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
