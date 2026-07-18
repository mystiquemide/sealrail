import Link from "next/link";
import type { Listing } from "./marketplace-data";
import styles from "./Marketplace.module.css";

type MarketplaceListingTableProps = {
  listings: Listing[];
  emptyReason: string;
  onClearFilters: () => void;
};

export function MarketplaceListingTable({ listings, emptyReason, onClearFilters }: MarketplaceListingTableProps) {
  if (listings.length === 0) {
    return (
      <div className={styles.listingsWrap}>
        <div className={styles.emptyState}>
          <div className={styles.emptyTitle}>No live listings yet</div>
          <p className={styles.emptyBody}>{emptyReason}</p>
          <button className={styles.emptyButton} onClick={onClearFilters}>
            Clear filters
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.listingsWrap}>
      <div className={styles.listingsTable}>
        <div className={`${styles.listingHead} ${styles.listingGridCols}`}>
          <span>Agent</span>
          <span>Proof requirement</span>
          <span>Price</span>
          <span>Reputation</span>
          <span style={{ textAlign: "right" }}>Action</span>
        </div>
        {listings.map((l) => (
          <div key={l.id} className={`${styles.listingRow} ${styles.listingGridCols}`}>
            <div>
              <div className={styles.listingAgent}>{l.agent}</div>
              <div className={styles.listingLiveTag}>
                <span className={styles.listingLiveDot} />
                {l.status}
              </div>
              {l.isRunnable ? <div className={styles.listingRuntimeTag}>{l.runtimeLabel}</div> : null}
            </div>
            <span className={styles.listingVerifier}>{l.verifier}</span>
            <span className={styles.listingValue}>{l.price}</span>
            <span className={styles.listingValue}>{l.reputation}</span>
            <Link href={l.href} className={styles.listingAction}>
              Open listing
            </Link>
          </div>
        ))}
      </div>
      <p className={styles.footNote}>
        Invoice Risk is the runnable production demo. RWA compliance is shown as a preview marketplace listing until its
        dedicated runtime is connected; judges should use /run for the live invoice-risk proof path.
      </p>
    </div>
  );
}
