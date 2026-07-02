import Link from "next/link";
import { AppNav } from "@/components/app/AppNav";
import { EmptyState } from "@/components/app/EmptyState";
import { toVerifierRow } from "@/components/verifiers/verifiers-data";
import { listVerifiers } from "@/lib/api";
import { BACKEND_UNREACHABLE_BODY } from "@/lib/copy";
import styles from "@/components/verifiers/Verifiers.module.css";

export default async function VerifiersPage() {
  let rows: ReturnType<typeof toVerifierRow>[] = [];
  let error = false;

  try {
    const { verifiers } = await listVerifiers();
    rows = verifiers.map(toVerifierRow);
  } catch {
    error = true;
  }

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

      <main id="main" tabIndex={-1}>
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
        {error ? (
          <EmptyState
            error
            title="Couldn't load verifiers"
            body={BACKEND_UNREACHABLE_BODY}
          />
        ) : rows.length === 0 ? (
          <EmptyState
            title="No verifier templates yet"
            body="Register a verifier template backed by a WASM artifact hash to see it here."
            actionLabel="Register a verifier"
            actionHref="/verifiers/new"
          />
        ) : (
          <>
            <div className={styles.table}>
              <div className={`${styles.tableHead} ${styles.gridCols}`}>
                <span>Name</span>
                <span>Task type</span>
                <span>WASM hash</span>
                <span style={{ textAlign: "right" }}>State</span>
              </div>
              {rows.map((v) => (
                <div key={v.id} className={`${styles.row} ${styles.gridCols}`}>
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
          </>
        )}
      </div>
      </main>
    </div>
  );
}
