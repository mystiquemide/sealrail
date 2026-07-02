import Link from "next/link";
import { AppNav } from "@/components/app/AppNav";
import { AgentRow } from "@/components/agents/AgentRow";
import { EmptyState } from "@/components/app/EmptyState";
import { toAgentListItem } from "@/components/agents/agents-data";
import { listAgents, listVerifiers } from "@/lib/api";
import { BACKEND_UNREACHABLE_BODY } from "@/lib/copy";
import styles from "@/components/agents/Agents.module.css";

export default async function AgentsPage() {
  let agents: Awaited<ReturnType<typeof listAgents>>["agents"] = [];
  let verifiers: Awaited<ReturnType<typeof listVerifiers>>["verifiers"] = [];
  let error = false;

  try {
    const [agentsRes, verifiersRes] = await Promise.all([listAgents(), listVerifiers()]);
    agents = agentsRes.agents;
    verifiers = verifiersRes.verifiers;
  } catch {
    error = true;
  }

  const verifiersById = new Map(verifiers.map((v) => [v.id, v]));
  const rows = agents.map((a) => toAgentListItem(a, verifiersById));

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
        {error ? (
          <EmptyState
            error
            title="Couldn't load agents"
            body={BACKEND_UNREACHABLE_BODY}
          />
        ) : rows.length === 0 ? (
          <EmptyState
            title="No agents registered yet"
            body="Register an agent to see it listed here with its verifier and proof mode."
            actionLabel="Register an agent"
            actionHref="/owner/agents/new"
          />
        ) : (
          rows.map((agent) => <AgentRow key={agent.id} agent={agent} />)
        )}
      </div>
    </div>
  );
}
