"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AppNav } from "@/components/app/AppNav";
import { ProofsFilterBar } from "@/components/proofs/ProofsFilterBar";
import { ProofsTable } from "@/components/proofs/ProofsTable";
import { computeProofsView, filterProofRows, toProofRow, type ProofRow } from "@/components/proofs/proofs-data";
import { listAgents, listTasks, getTaskDetail } from "@/lib/api";
import styles from "@/components/proofs/Proofs.module.css";

export default function ProofsPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [modeFilter, setModeFilter] = useState("All");

  const [allRows, setAllRows] = useState<ProofRow[] | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const [{ tasks }, { agents }] = await Promise.all([listTasks(), listAgents()]);
        const agentNames = new Map(agents.map((a) => [a.id, a.name]));
        const details = await Promise.all(tasks.map((t) => getTaskDetail(t.id).catch(() => null)));
        if (cancelled) return;
        const rows = details
          .filter((d): d is NonNullable<typeof d> => d !== null)
          .map((d) => toProofRow(d, agentNames.get(d.task.agent_id) ?? "Unknown agent"));
        setAllRows(rows);
      } catch {
        if (!cancelled) setError(true);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const rows = allRows ? filterProofRows(allRows, search, statusFilter, modeFilter) : [];
  const view = computeProofsView(Boolean(allRows && allRows.length > 0), rows);

  function clearFilters() {
    setSearch("");
    setStatusFilter("All");
    setModeFilter("All");
  }

  function retryLoad() {
    // No-op: errors here come from a genuinely unreachable backend, not a demo toggle.
  }

  return (
    <div className={styles.page}>
      <AppNav
        active="Proofs"
        links={[
          { label: "Agents", href: "/agents" },
          { label: "Docs", href: "/docs" },
        ]}
        cta={{ label: "Start run", href: "/run", variant: "primary" }}
      />

      <div className={styles.headerWrap}>
        <div className={styles.headerRow}>
          <div className={styles.headerCopy}>
            <div className={styles.eyebrow}>Proof explorer</div>
            <h1 className={styles.title}>Every row is a payment-backed task with a proof state.</h1>
          </div>
          <Link href="/run" className={styles.btnPrimary}>
            Start new run
          </Link>
        </div>
      </div>

      <ProofsFilterBar
        search={search}
        statusFilter={statusFilter}
        modeFilter={modeFilter}
        onSearchChange={setSearch}
        onStatusChange={setStatusFilter}
        onModeChange={setModeFilter}
      />

      <div className={styles.tableWrap}>
        {error ? (
          <div className={styles.stateBlock} style={{ borderTop: "1px solid rgba(255,255,255,0.14)" }}>
            <div className={styles.stateTitle}>Couldn&apos;t load proofs</div>
            <p className={styles.stateBody}>The backend at NEXT_PUBLIC_API_URL could not be reached.</p>
          </div>
        ) : allRows === null ? (
          <div className={styles.stateBlock} style={{ borderTop: "1px solid rgba(255,255,255,0.14)" }}>
            <div className={styles.stateTitle}>Loading proofs...</div>
          </div>
        ) : (
          <ProofsTable view={view} rows={rows} onClearFilters={clearFilters} onRetry={retryLoad} />
        )}
      </div>
    </div>
  );
}
