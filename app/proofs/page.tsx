"use client";

import { useState } from "react";
import Link from "next/link";
import { AppNav } from "@/components/app/AppNav";
import { ProofsFilterBar } from "@/components/proofs/ProofsFilterBar";
import { ProofsTable } from "@/components/proofs/ProofsTable";
import { computeProofsView, filterProofRows } from "@/components/proofs/proofs-data";
import styles from "@/components/proofs/Proofs.module.css";

export default function ProofsPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [modeFilter, setModeFilter] = useState("All");

  const rows = filterProofRows(search, statusFilter, modeFilter);
  const view = computeProofsView(rows);

  function clearFilters() {
    setSearch("");
    setStatusFilter("All");
    setModeFilter("All");
  }

  function retryLoad() {
    // No-op until Phase O wires a real fetch to retry.
  }

  return (
    <div className={styles.page}>
      <AppNav
        active="Proofs"
        links={[
          { label: "Agents", href: "/#vertical" },
          { label: "Docs", href: "/#tee" },
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
        <ProofsTable view={view} rows={rows} onClearFilters={clearFilters} onRetry={retryLoad} />
      </div>
    </div>
  );
}
