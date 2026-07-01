import Link from "next/link";
import { AppNav } from "@/components/app/AppNav";
import { getAgentProfile } from "@/components/agent-profile/agent-profile-data";
import styles from "@/components/agent-profile/AgentProfile.module.css";

type AgentProfilePageProps = {
  params: Promise<{ agentId: string }>;
};

export default async function AgentProfilePage({ params }: AgentProfilePageProps) {
  const { agentId } = await params;
  const agent = getAgentProfile(agentId);

  return (
    <div className={styles.page}>
      <AppNav
        maxWidth={1080}
        links={[
          { label: "Agents", href: "/agents" },
          { label: "Proofs", href: "/proofs" },
        ]}
        cta={{ label: "Start run", href: "/run", variant: "primary" }}
      />

      <div className={styles.wrap}>
        <Link href="/agents" className={styles.backLink}>
          <span className={styles.backArrow}>{"<-"}</span>
          Back to agents
        </Link>

        {!agent ? (
          <div style={{ marginTop: 40 }}>
            <div className={styles.title}>Agent not found</div>
            <p className={styles.reputationNote} style={{ marginTop: 12 }}>
              This agent does not exist or has not been registered yet.
            </p>
          </div>
        ) : (
          <>
            <div className={styles.headerRow}>
              <div>
                <h1 className={styles.title}>{agent.name}</h1>
                <div className={styles.statRow}>
                  <div>
                    <div className={styles.statLabel}>Category</div>
                    <div className={styles.statValue}>{agent.category}</div>
                  </div>
                  <div>
                    <div className={styles.statLabel}>Owner</div>
                    <div className={styles.statValueMono}>{agent.owner}</div>
                  </div>
                  <div>
                    <div className={styles.statLabel}>Status</div>
                    <div className={styles.statusTag} style={{ color: agent.statusColor }}>
                      <span className={styles.statusDot} style={{ background: agent.statusColor }} />
                      {agent.status}
                    </div>
                  </div>
                  <div>
                    <div className={styles.statLabel}>Runtime</div>
                    <div className={styles.statusTag} style={{ color: "#3C8DFF" }}>
                      <span className={styles.statusDot} style={{ background: "#3C8DFF" }} />
                      {agent.runtimeType}
                    </div>
                  </div>
                </div>
                <div className={styles.taskTypeTags}>
                  {agent.supportedTaskTypes.map((t) => (
                    <span key={t} className={styles.taskTypeTag}>
                      {t}
                    </span>
                  ))}
                </div>
              </div>
              <div className={styles.headerActions}>
                <Link href="/run" className={styles.btnPrimary}>
                  Start task
                </Link>
                {agent.listingHref ? (
                  <Link href={agent.listingHref} className={styles.btnGhost}>
                    Open listing
                  </Link>
                ) : null}
              </div>
            </div>

            <div className={styles.panelsWrap}>
              <div className={styles.panel}>
                <div className={styles.panelLabel}>Reputation</div>
                <div className={styles.reputationScore}>
                  {agent.reputation.score} <span className={styles.reputationScoreOf}>/ 100</span>
                </div>
                <p className={styles.reputationNote}>Calculated from proof and payment records.</p>
                <div className={styles.infoRows}>
                  <div className={styles.infoRow}>
                    <span className={styles.infoRowLabel}>Verified runs</span>
                    <span className={styles.infoRowValue} style={{ color: "#64D96B" }}>
                      {agent.reputation.verifiedRuns}
                    </span>
                  </div>
                  <div className={styles.infoRow}>
                    <span className={styles.infoRowLabel}>Paid tasks</span>
                    <span className={styles.infoRowValue}>{agent.reputation.paidTasks}</span>
                  </div>
                  <div className={styles.infoRow}>
                    <span className={styles.infoRowLabel}>Failed proofs</span>
                    <span className={styles.infoRowValue} style={{ color: "#F45B45" }}>
                      {agent.reputation.failedProofs}
                    </span>
                  </div>
                  <div className={styles.infoRow}>
                    <span className={styles.infoRowLabel}>Total earned</span>
                    <span className={styles.infoRowValue}>{agent.reputation.totalEarned}</span>
                  </div>
                </div>
              </div>

              <div className={styles.panel}>
                <div className={styles.panelLabel}>Verifiers</div>
                <div className={styles.verifierName}>{agent.verifier.name}</div>
                <div className={styles.infoRows}>
                  <div className={styles.infoRow}>
                    <span className={styles.infoRowLabel}>Input schema</span>
                    <span className={styles.infoRowValue}>{agent.verifier.inputSchema}</span>
                  </div>
                  <div className={styles.infoRow}>
                    <span className={styles.infoRowLabel}>Output schema</span>
                    <span className={styles.infoRowValue}>{agent.verifier.outputSchema}</span>
                  </div>
                  <div className={styles.infoRow}>
                    <span className={styles.infoRowLabel}>WASM hash</span>
                    <span className={styles.infoRowValueMono}>{agent.verifier.wasmHash}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className={styles.historySection}>
              <div className={styles.historyLabel}>Proof history</div>
              <div className={styles.historyTable}>
                <div className={`${styles.historyHead} ${styles.historyGridCols}`}>
                  <span>Proof ID</span>
                  <span>Task</span>
                  <span>Verifier</span>
                  <span>Payment</span>
                </div>
                {agent.proofHistory.map((p) => (
                  <Link key={p.id} href={p.href} className={`${styles.historyRow} ${styles.historyGridCols}`}>
                    <span className={styles.historyId}>{p.id}</span>
                    <span className={styles.historyTask}>{p.task}</span>
                    <span className={styles.historyVerifier}>{p.verifier}</span>
                    <span className={styles.historyPayment} style={{ color: p.payColor }}>
                      <span className={styles.historyPaymentDot} style={{ background: p.payColor }} />
                      {p.payment}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
