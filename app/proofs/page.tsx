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
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setError(false);
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
  }, [reloadToken]);

  const rows = allRows ? filterProofRows(allRows, search, statusFilter, modeFilter) : [];
  const status: "loading" | "error" | "loaded" = error ? "error" : allRows === null ? "loading" : "loaded";
  const view = computeProofsView(status, Boolean(allRows && allRows.length > 0), rows);

  function clearFilters() {
    setSearch("");
    setStatusFilter("All");
    setModeFilter("All");
  }

  function retryLoad() {
    setAllRows(null);
    setReloadToken((t) => t + 1);
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

      <main id="main" tabIndex={-1}>
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
        <ProofsTable view={view} rows={rows} onClearFilters={clearFilters} onRetry={retryLoad} />
      </div>
      </main>
    </div>
  );
}
