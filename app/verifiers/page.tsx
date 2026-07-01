import Link from "next/link";
import { AppNav } from "@/components/app/AppNav";
import { VERIFIER_TEMPLATES } from "@/components/verifiers/verifiers-data";
import styles from "@/components/verifiers/Verifiers.module.css";

export default function VerifiersPage() {
  return (
    <div className={styles.page}>
      <AppNav
        active="Verifiers"
        maxWidth={1080}
        links={[
          { label: "Workflows", href: "/workflows" },
          { label: "Agents", href: "/agents" },
          { label: "Proofs", href: "/proofs" },
        ]}
        cta={{ label: "Start run", href: "/run", variant: "primary" }}
      />

      <div className={styles.headerWrap}>
        <div className={styles.headerRow}>
          <div className={styles.headerCopy}>
            <div className={styles.eyebrow}>Verifier library</div>
            <h1 className={styles.title}>Templates that define how agent outputs are checked.</h1>
          </div>
          <Link href="/verifiers/new" className={styles.btnPrimary}>
            Register verifier
          </Link>
        </div>
      </div>

      <div className={styles.listWrap}>
        <div className={styles.table}>
          <div className={`${styles.tableHead} ${styles.gridCols}`}>
            <span>Name</span>
            <span>Task type</span>
            <span>WASM hash</span>
            <span style={{ textAlign: "right" }}>State</span>
          </div>
          {VERIFIER_TEMPLATES.map((v) => (
            <div key={v.name} className={`${styles.row} ${styles.gridCols}`}>
              <span className={styles.name}>{v.name}</span>
              <span className={styles.taskType}>{v.taskType}</span>
              <span className={styles.wasmHash}>{v.wasmHash}</span>
              <span className={styles.stateTag}>
                <span className={styles.stateDot} />
                {v.state}
              </span>
            </div>
          ))}
        </div>
        <p className={styles.footNote}>
          Verifier templates only appear here once registered and backed by a WASM artifact hash. No unverified
          templates are listed.
        </p>
      </div>
    </div>
  );
}
