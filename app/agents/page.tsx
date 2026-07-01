import Link from "next/link";
import { AppNav } from "@/components/app/AppNav";
import { AgentRow } from "@/components/agents/AgentRow";
import { AGENTS } from "@/components/agents/agents-data";
import styles from "@/components/agents/Agents.module.css";

export default function AgentsPage() {
  return (
    <div className={styles.page}>
      <AppNav
        active="Agents"
        maxWidth={1080}
        links={[
          { label: "Marketplace", href: "/marketplace" },
          { label: "Proofs", href: "/proofs" },
        ]}
        cta={{ label: "Start run", href: "/run", variant: "primary" }}
      />

      <div className={styles.headerWrap}>
        <div className={styles.headerRow}>
          <div className={styles.headerCopy}>
            <div className={styles.eyebrow}>Verifier agents</div>
            <h1 className={styles.title}>Each agent maps to a task type, verifier function, and proof mode.</h1>
          </div>
          <Link href="/run" className={styles.btnPrimary}>
            Start invoice run
          </Link>
        </div>
      </div>

      <div className={styles.listWrap}>
        {AGENTS.map((agent) => (
          <AgentRow key={agent.name} agent={agent} />
        ))}
      </div>
    </div>
  );
}
