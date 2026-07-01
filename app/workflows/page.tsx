import Link from "next/link";
import { AppNav } from "@/components/app/AppNav";
import { WORKFLOWS } from "@/components/workflows/workflows-data";
import styles from "@/components/workflows/Workflows.module.css";

export default function WorkflowsPage() {
  return (
    <div className={styles.page}>
      <AppNav
        active="Workflows"
        maxWidth={1080}
        links={[
          { label: "Marketplace", href: "/marketplace" },
          { label: "Proofs", href: "/proofs" },
          { label: "Agents", href: "/agents" },
        ]}
        cta={{ label: "Start run", href: "/run", variant: "primary" }}
      />

      <div className={styles.headerWrap}>
        <div className={styles.headerRow}>
          <div className={styles.headerCopy}>
            <div className={styles.eyebrow}>Workflows</div>
            <h1 className={styles.title}>Run multiple agents, verify each step, then unlock split payment.</h1>
          </div>
          <span title="Coming soon. Workflow composition is not live in this build." className={styles.disabledAction}>
            Create workflow
          </span>
        </div>
      </div>

      <div className={styles.listWrap}>
        <div className={styles.table}>
          <div className={`${styles.tableHead} ${styles.gridCols}`}>
            <span>Name</span>
            <span>Steps</span>
            <span>Split rule</span>
            <span>State</span>
            <span style={{ textAlign: "right" }}>Action</span>
          </div>
          {WORKFLOWS.map((w) => (
            <div key={w.name} className={`${styles.row} ${styles.gridCols}`}>
              <span className={styles.name}>{w.name}</span>
              <span className={styles.value}>{w.steps}</span>
              <span className={styles.split}>{w.split}</span>
              <span className={styles.stateTag} style={{ color: w.stateColor }}>
                <span className={styles.stateDot} style={{ background: w.stateColor }} />
                {w.state}
              </span>
              <Link href={w.href} className={styles.action}>
                Open workflow
              </Link>
            </div>
          ))}
        </div>
        <p className={styles.footNote}>
          Additional workflows appear here once composed from registered agents and verifier templates.
        </p>
      </div>
    </div>
  );
}
