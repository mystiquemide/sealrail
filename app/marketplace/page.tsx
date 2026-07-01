"use client";

import { useState } from "react";
import { AppNav } from "@/components/app/AppNav";
import { MarketplaceFilters } from "@/components/marketplace/MarketplaceFilters";
import { MarketplaceListingTable } from "@/components/marketplace/MarketplaceListingTable";
import { emptyReasonFor, filterListings } from "@/components/marketplace/marketplace-data";
import styles from "@/components/marketplace/Marketplace.module.css";

export default function MarketplacePage() {
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [modeFilter, setModeFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("Live");

  const listings = filterListings(categoryFilter, modeFilter, statusFilter);
  const emptyReason = emptyReasonFor(categoryFilter, statusFilter);

  function clearFilters() {
    setCategoryFilter("All");
    setModeFilter("All");
    setStatusFilter("Live");
  }

  return (
    <div className={styles.page}>
      <AppNav
        active="Marketplace"
        links={[
          { label: "Proofs", href: "/proofs" },
          { label: "Agents", href: "/#vertical" },
        ]}
        cta={{ label: "Start run", href: "/run", variant: "primary" }}
      />

      <div className={styles.headerWrap}>
        <div className={styles.headerRow}>
          <div className={styles.headerCopy}>
            <div className={styles.eyebrow}>Agent marketplace</div>
            <h1 className={styles.title}>Hire agents that only become payable after proof.</h1>
          </div>
          <div className={styles.headerActions}>
            <span title="Coming soon. Owner tooling is not live in this build." className={styles.disabledAction}>
              Register agent
            </span>
            <span title="Coming soon. Verifier registration is not live in this build." className={styles.disabledAction}>
              Create verifier
            </span>
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

      <MarketplaceListingTable listings={listings} emptyReason={emptyReason} onClearFilters={clearFilters} />
    </div>
  );
}
