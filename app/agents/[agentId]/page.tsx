import Link from "next/link";
import { AppNav } from "@/components/app/AppNav";
import { EmptyState } from "@/components/app/EmptyState";
import {
  buildAgentProfile,
  buildProofHistoryItem,
  type ProofHistoryItem,
} from "@/components/agent-profile/agent-profile-data";
import { ApiClientError } from "@/lib/api";
import { getAgent, getAgentProofs, getAgentReputation, getTaskDetail, getVerifier } from "@/lib/api";
import { BACKEND_UNREACHABLE_BODY } from "@/lib/copy";
import styles from "@/components/agent-profile/AgentProfile.module.css";

type AgentProfilePageProps = {
  params: Promise<{ agentId: string }>;
};

export default async function AgentProfilePage({ params }: AgentProfilePageProps) {
  const { agentId } = await params;

  let notFound = false;
  let error = false;
  let profile = null;

  try {
    const [{ agent }, { reputation }, { proofs }] = await Promise.all([
      getAgent(agentId),
      getAgentReputation(agentId),
      getAgentProofs(agentId),
    ]);

    const verifier = agent.verifier_ids[0] ? (await getVerifier(agent.verifier_ids[0]).catch(() => null))?.verifier : undefined;

    const proofHistory: ProofHistoryItem[] = await Promise.all(
      proofs
        .filter((p) => p.task_id)
        .slice(0, 10)
        .map(async (p) => {
          const detail = await getTaskDetail(p.task_id as string).catch(() => null);
          return buildProofHistoryItem(p, detail, verifier?.name ?? "—");
        })
    );

    profile = buildAgentProfile(agent, reputation, verifier, proofHistory);
  } catch (err) {
    if (err instanceof ApiClientError && err.status === 404) {
      notFound = true;
    } else {
      error = true;
    }
  }

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

      <main id="main" tabIndex={-1} className={styles.wrap}>
        <Link href="/agents" className={styles.backLink}>
          <span className={styles.backArrow}>{"<-"}</span>
          Back to agents
        </Link>

        {error ? (
          <EmptyState
            error
            title="Couldn't load this agent"
            body={BACKEND_UNREACHABLE_BODY}
          />
        ) : notFound || !profile ? (
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
                <h1 className={styles.title}>{profile.name}</h1>
                <div className={styles.statRow}>
                  <div>
                    <div className={styles.statLabel}>Category</div>
                    <div className={styles.statValue}>{profile.category}</div>
                  </div>
                  <div>
                    <div className={styles.statLabel}>Owner</div>
                    <div className={styles.statValueMono}>{profile.owner}</div>
                  </div>
                  <div>
                    <div className={styles.statLabel}>Status</div>
                    <div className={styles.statusTag} style={{ color: profile.statusColor }}>
                      <span className={styles.statusDot} style={{ background: profile.statusColor }} />
                      {profile.status}
                    </div>
                  </div>
                  <div>
                    <div className={styles.statLabel}>Runtime</div>
                    <div className={styles.statusTag} style={{ color: "#3C8DFF" }}>
                      <span className={styles.statusDot} style={{ background: "#3C8DFF" }} />
                      {profile.runtimeType}
                    </div>
                  </div>
                </div>
                <div className={styles.taskTypeTags}>
                  {profile.supportedTaskTypes.length === 0 ? (
                    <span className={styles.taskTypeTag}>No task types configured</span>
                  ) : (
                    profile.supportedTaskTypes.map((t) => (
                      <span key={t} className={styles.taskTypeTag}>
                        {t}
                      </span>
                    ))
                  )}
                </div>
              </div>
              <div className={styles.headerActions}>
                <Link href="/run" className={styles.btnPrimary}>
                  Start task
                </Link>
                {profile.listingHref ? (
                  <Link href={profile.listingHref} className={styles.btnGhost}>
                    Open listing
                  </Link>
                ) : null}
              </div>
            </div>

            <div className={styles.panelsWrap}>
              <div className={styles.panel}>
                <div className={styles.panelLabel}>Reputation</div>
                <div className={styles.reputationScore}>
                  {profile.reputation.score} <span className={styles.reputationScoreOf}>/ 100</span>
                </div>
                <p className={styles.reputationNote}>Calculated from proof and payment records.</p>
                <div className={styles.infoRows}>
                  <div className={styles.infoRow}>
                    <span className={styles.infoRowLabel}>Verified runs</span>
                    <span className={styles.infoRowValue} style={{ color: "#64D96B" }}>
                      {profile.reputation.verifiedRuns}
                    </span>
                  </div>
                  <div className={styles.infoRow}>
                    <span className={styles.infoRowLabel}>Paid tasks</span>
                    <span className={styles.infoRowValue}>{profile.reputation.paidTasks}</span>
                  </div>
                  <div className={styles.infoRow}>
                    <span className={styles.infoRowLabel}>Failed proofs</span>
                    <span className={styles.infoRowValue} style={{ color: "#F45B45" }}>
                      {profile.reputation.failedProofs}
                    </span>
                  </div>
                  <div className={styles.infoRow}>
                    <span className={styles.infoRowLabel}>Total earned</span>
                    <span className={styles.infoRowValue}>{profile.reputation.totalEarned}</span>
                  </div>
                </div>
              </div>

              <div className={styles.panel}>
                <div className={styles.panelLabel}>Verifiers</div>
                <div className={styles.verifierName}>{profile.verifier.name}</div>
                <div className={styles.infoRows}>
                  <div className={styles.infoRow}>
                    <span className={styles.infoRowLabel}>Input schema</span>
                    <span className={styles.infoRowValue}>{profile.verifier.inputSchema}</span>
                  </div>
                  <div className={styles.infoRow}>
                    <span className={styles.infoRowLabel}>Output schema</span>
                    <span className={styles.infoRowValue}>{profile.verifier.outputSchema}</span>
                  </div>
                  <div className={styles.infoRow}>
                    <span className={styles.infoRowLabel}>WASM hash</span>
                    <span className={styles.infoRowValueMono}>{profile.verifier.wasmHash}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className={styles.historySection}>
              <div className={styles.historyLabel}>Proof history</div>
              {profile.proofHistory.length === 0 ? (
                <EmptyState title="No proofs yet" body="This agent hasn't produced a verified proof yet." />
              ) : (
                <div className={styles.historyTable}>
                  <div className={`${styles.historyHead} ${styles.historyGridCols}`}>
                    <span>Proof ID</span>
                    <span>Task</span>
                    <span>Verifier</span>
                    <span>Payment</span>
                  </div>
                  {profile.proofHistory.map((p) => (
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
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
