"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AppNav } from "@/components/app/AppNav";
import { MarketplaceFilters } from "@/components/marketplace/MarketplaceFilters";
import { MarketplaceListingTable } from "@/components/marketplace/MarketplaceListingTable";
import { emptyReasonFor, filterListings, toListing, type Listing } from "@/components/marketplace/marketplace-data";
import { listMarketplace, listVerifiers } from "@/lib/api";
import { BACKEND_UNREACHABLE_BODY } from "@/lib/copy";
import styles from "@/components/marketplace/Marketplace.module.css";

export default function MarketplacePage() {
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [modeFilter, setModeFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");

  const [allListings, setAllListings] = useState<Listing[] | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const [{ listings }, { verifiers }] = await Promise.all([listMarketplace(), listVerifiers()]);
        if (cancelled) return;
        const verifiersById = new Map(verifiers.map((v) => [v.id, v]));
        setAllListings(listings.map((l) => toListing(l, verifiersById.get(l.verifier_id)?.mode_support?.[0])));
      } catch {
        if (!cancelled) setError(true);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const listings = allListings ? filterListings(allListings, categoryFilter, modeFilter, statusFilter) : [];
  const emptyReason = emptyReasonFor(categoryFilter, statusFilter);

  function clearFilters() {
    setCategoryFilter("All");
    setModeFilter("All");
    setStatusFilter("All");
  }

  return (
    <div className={styles.page}>
      <AppNav
        active="Marketplace"
        links={[
          { label: "Proofs", href: "/proofs" },
          { label: "Agents", href: "/agents" },
        ]}
        cta={{ label: "Start run", href: "/run", variant: "primary" }}
      />

      <main id="main" tabIndex={-1}>
      <div className={styles.headerWrap}>
        <div className={styles.headerRow}>
          <div className={styles.headerCopy}>
            <div className={styles.eyebrow}>Agent marketplace</div>
            <h1 className={styles.title}>Hire agents that only become payable after proof.</h1>
          </div>
          <div className={styles.headerActions}>
            <Link href="/owner/agents/new" className={styles.btnGhost}>
              Register agent
            </Link>
            <Link href="/verifiers/new" className={styles.btnGhost}>
              Create verifier
            </Link>
          </div>
        </div>
      </div>

      <MarketplaceFilters
        categoryFilter={categoryFilter}
        modeFilter={modeFilter}
        statusFilter={statusFilter}
        onCategoryChange={setCategoryFilter}
        onModeChange={setModeFilter}
        onStatusChange={setStatusFilter}
      />

      {error ? (
        <div className={styles.listingsWrap}>
          <div className={styles.emptyState}>
            <div className={styles.emptyTitle}>Couldn&apos;t load listings</div>
            <p className={styles.emptyBody}>{BACKEND_UNREACHABLE_BODY}</p>
          </div>
        </div>
      ) : allListings === null ? (
        <MarketplaceListingTable listings={[]} emptyReason={emptyReason} onClearFilters={clearFilters} showLoading />
      ) : (
        <MarketplaceListingTable listings={listings} emptyReason={emptyReason} onClearFilters={clearFilters} />
      )}
      </main>
    </div>
  );
}
