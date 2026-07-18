import Link from "next/link";
import type { Listing } from "./marketplace-data";
import { Skeleton } from "@/components/app/Skeleton";
import styles from "./Marketplace.module.css";

type MarketplaceListingTableProps = {
  listings: Listing[];
  emptyReason: string;
  onClearFilters: () => void;
  showLoading?: boolean;
};

export function MarketplaceListingTable({ listings, emptyReason, onClearFilters, showLoading = false }: MarketplaceListingTableProps) {
  if (showLoading) {
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
          {[0, 1].map((i) => (
            <div key={i} className={`${styles.listingRow} ${styles.listingGridCols}`}>
              <div>
                <Skeleton width="60%" height={14} />
                <Skeleton width={90} height={10} style={{ marginTop: 8 }} />
              </div>
              <Skeleton width="70%" />
              <Skeleton width="45%" />
              <Skeleton width="40%" />
              <Skeleton width={70} style={{ justifySelf: "end" }} />
            </div>
          ))}
        </div>
      </div>
    );
  }

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
                {l.runtimeLabel}
              </div>
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
