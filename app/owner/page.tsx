"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AppNav } from "@/components/app/AppNav";
import { EmptyState } from "@/components/app/EmptyState";
import {
  computeEarnings,
  toIncomingTask,
  toOwnedAgent,
  type IncomingTask,
  type OwnedAgent,
} from "@/components/owner/owner-data";
import { getAgentReputation, listAgents, listPayments, listTasks } from "@/lib/api";
import { ensureSession } from "@/lib/session";
import styles from "@/components/owner/OwnerDashboard.module.css";

export default function OwnerPage() {
  const [ownedAgents, setOwnedAgents] = useState<OwnedAgent[] | null>(null);
  const [earnings, setEarnings] = useState<{ totalEarned: string; unlockable: string; blocked: string } | null>(null);
  const [incomingTasks, setIncomingTasks] = useState<IncomingTask[]>([]);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const session = await ensureSession();
        const { agents } = await listAgents({ owner_address: session.ownerAddress });
        if (cancelled) return;
        setOwnedAgents(agents.map(toOwnedAgent));

        const ownedIds = new Set(agents.map((a) => a.id));
        const [reputations, { payments }, { tasks }] = await Promise.all([
          Promise.all(agents.map((a) => getAgentReputation(a.id).then((r) => r.reputation))),
          listPayments(),
          listTasks(),
        ]);
        if (cancelled) return;

        setEarnings(computeEarnings(reputations, payments, ownedIds));

        const agentNames = new Map(agents.map((a) => [a.id, a.name]));
        const relevant = tasks
          .filter((t) => ownedIds.has(t.agent_id) && t.status !== "paid")
          .map((t) => toIncomingTask(t, agentNames.get(t.agent_id) ?? "Unknown agent"));
        setIncomingTasks(relevant);
      } catch {
        if (!cancelled) setError(true);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

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
            <Link href="/verifiers/new" className={styles.disabledAction} style={{ opacity: 1, cursor: "pointer" }}>
              Register verifier
            </Link>
          </div>
        </div>

        {error ? (
          <EmptyState
            error
            title="Couldn't load your dashboard"
            body="The backend at NEXT_PUBLIC_API_URL could not be reached."
          />
        ) : (
          <>
            <div className={styles.panelsWrap}>
              <div className={styles.panel}>
                <div className={styles.panelLabel}>Owned agents</div>
                {ownedAgents === null ? (
                  <p className={styles.earningsNote}>Loading...</p>
                ) : ownedAgents.length === 0 ? (
                  <EmptyState
                    title="No agents yet"
                    body="Register an agent to see it here."
                    actionLabel="Register an agent"
                    actionHref="/owner/agents/new"
                  />
                ) : (
                  <div className={styles.agentList}>
                    {ownedAgents.map((a) => (
                      <Link key={a.name} href={a.href} className={styles.agentRow}>
                        <span className={styles.agentRowName}>{a.name}</span>
                        <span className={styles.statusTag} style={{ color: a.statusColor }}>
                          <span className={styles.statusDot} style={{ background: a.statusColor }} />
                          {a.status}
                        </span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              <div className={styles.panel}>
                <div className={styles.panelLabel}>Earnings</div>
                {earnings === null ? (
                  <p className={styles.earningsNote}>Loading...</p>
                ) : (
                  <>
                    <div className={styles.infoRows}>
                      <div className={styles.infoRow}>
                        <span className={styles.infoRowLabel}>Total earned</span>
                        <span className={styles.infoRowValue}>{earnings.totalEarned}</span>
                      </div>
                      <div className={styles.infoRow}>
                        <span className={styles.infoRowLabel}>Unlockable</span>
                        <span className={`${styles.infoRowValue} ${styles.infoRowValueSmall}`} style={{ color: "#F2B84B" }}>
                          {earnings.unlockable}
                        </span>
                      </div>
                      <div className={styles.infoRow}>
                        <span className={styles.infoRowLabel}>Blocked</span>
                        <span className={`${styles.infoRowValue} ${styles.infoRowValueSmall}`} style={{ color: "#F45B45" }}>
                          {earnings.blocked}
                        </span>
                      </div>
                    </div>
                    <p className={styles.earningsNote}>Derived from payment recipient records tied to your agents.</p>
                  </>
                )}
              </div>
            </div>

            <div className={styles.tasksSection}>
              <div className={styles.tasksLabel}>Incoming tasks</div>
              {incomingTasks.length === 0 ? (
                <EmptyState title="No incoming tasks" body="Tasks assigned to your agents will appear here." />
              ) : (
                <div className={styles.tasksTable}>
                  <div className={`${styles.tasksHead} ${styles.taskGridCols}`}>
                    <span>Task ID</span>
                    <span>Agent</span>
                    <span>State</span>
                    <span>Payment</span>
                  </div>
                  {incomingTasks.map((t) => (
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
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
