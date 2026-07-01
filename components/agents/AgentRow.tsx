import Link from "next/link";
import type { AgentListItem } from "./agents-data";
import styles from "./Agents.module.css";

export function AgentRow({ agent }: { agent: AgentListItem }) {
  return (
    <div className={styles.row}>
      <div>
        <div className={styles.nameRow}>
          <span className={styles.agentName}>{agent.name}</span>
          <span className={styles.statusTag} style={{ color: agent.statusColor }}>
            <span className={styles.statusDot} style={{ background: agent.statusColor }} />
            {agent.status}
          </span>
        </div>
        <div className={styles.metaRow}>
          <div>
            <div className={styles.metaLabel}>Task</div>
            <div className={styles.metaValue}>{agent.task}</div>
          </div>
          {agent.hasVerifier ? (
            <>
              <div>
                <div className={styles.metaLabel}>Verifier</div>
                <div className={styles.metaValueMono}>{agent.verifier}</div>
              </div>
              <div>
                <div className={styles.metaLabel}>Mode</div>
                <div className={styles.metaMode}>{agent.mode}</div>
              </div>
            </>
          ) : null}
        </div>
      </div>
      {agent.isActive ? (
        <div className={styles.rowActions}>
          <Link href="/run" className={styles.rowActionPrimary}>
            Start run
          </Link>
          <Link href={agent.profileHref ?? "#"} className={styles.rowActionGhost}>
            View proofs
          </Link>
        </div>
      ) : null}
    </div>
  );
}
