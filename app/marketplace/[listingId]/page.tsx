import Link from "next/link";
import { AppNav } from "@/components/app/AppNav";
import { getListingDetail } from "@/components/marketplace-listing/listing-data";
import styles from "@/components/marketplace-listing/ListingDetail.module.css";

type ListingPageProps = {
  params: Promise<{ listingId: string }>;
};

export default async function MarketplaceListingPage({ params }: ListingPageProps) {
  const { listingId } = await params;
  const listing = getListingDetail(listingId);

  return (
    <div className={styles.page}>
      <AppNav
        maxWidth={1080}
        links={[
          { label: "Marketplace", href: "/marketplace" },
          { label: "Proofs", href: "/proofs" },
        ]}
        cta={{ label: "Start run", href: "/run", variant: "primary" }}
      />

      <div className={styles.wrap}>
        <Link href="/marketplace" className={styles.backLink}>
          <span className={styles.backArrow}>{"<-"}</span>
          Back to marketplace
        </Link>

        {!listing ? (
          <div style={{ marginTop: 40 }}>
            <div className={styles.title}>Listing not found</div>
            <p className={styles.subtitle}>
              This listing does not exist or has not been published yet.{" "}
              <Link href="/marketplace" className={styles.backLink} style={{ display: "inline" }}>
                Back to marketplace
              </Link>
            </p>
          </div>
        ) : (
          <>
            <div className={styles.headerRow}>
              <div className={styles.headerCopy}>
                <h1 className={styles.title}>{listing.agent}</h1>
                <p className={styles.subtitle}>{listing.tagline}</p>
                <div className={styles.statRow}>
                  <div>
                    <div className={styles.statLabel}>Price</div>
                    <div className={styles.statValue}>{listing.price}</div>
                  </div>
                  <div>
                    <div className={styles.statLabel}>Proof requirement</div>
                    <div className={styles.statValueMono}>{listing.proofRequirement}</div>
                  </div>
                </div>
              </div>
              <div className={styles.headerActions}>
                <Link href="/run" className={styles.btnPrimary}>
                  Start paid task
                </Link>
                <span
                  title="Coming soon. Public agent profiles are not live in this build."
                  className={styles.disabledAction}
                >
                  View agent profile
                </span>
              </div>
            </div>

            <div className={styles.panelsWrap}>
              <div className={styles.panel}>
                <div className={styles.panelLabel}>Task input</div>
                <div className={styles.formFields}>
                  <div>
                    <label className={styles.formLabel}>Invoice ID</label>
                    <input value={listing.taskDefaults.invoiceId} readOnly className={styles.formInputMono} />
                  </div>
                  <div>
                    <label className={styles.formLabel}>Amount</label>
                    <input value={listing.taskDefaults.amount} readOnly className={styles.formInput} />
                  </div>
                  <div>
                    <label className={styles.formLabel}>Vendor</label>
                    <input value={listing.taskDefaults.vendor} readOnly className={styles.formInput} />
                  </div>
                  <div>
                    <label className={styles.formLabel}>Buyer</label>
                    <input value={listing.taskDefaults.buyer} readOnly className={styles.formInput} />
                  </div>
                  <div>
                    <label className={styles.formLabel}>Due date</label>
                    <input value={listing.taskDefaults.dueDate} readOnly className={styles.formInputMono} />
                  </div>
                </div>
                <Link href="/run" className={styles.createTaskButton}>
                  Create paid task
                </Link>
              </div>

              <div className={styles.panel}>
                <div className={styles.panelLabel}>Agent and verifier</div>
                <div className={styles.infoRows}>
                  <div className={styles.infoRow}>
                    <span className={styles.infoRowLabel}>Agent owner</span>
                    <span className={styles.infoRowValue}>{listing.agentOwner}</span>
                  </div>
                  <div className={styles.infoRow}>
                    <span className={styles.infoRowLabel}>Verifier</span>
                    <span className={styles.infoRowValue}>{listing.verifier}</span>
                  </div>
                  <div className={styles.infoRow}>
                    <span className={styles.infoRowLabel}>Mode</span>
                    <span className={styles.modeBadge}>
                      <span className={styles.modeBadgeDot} />
                      {listing.mode}
                    </span>
                  </div>
                  <div className={styles.infoRow}>
                    <span className={styles.infoRowLabel}>Reputation</span>
                    <span className={styles.infoRowValuePlain}>{listing.reputation}</span>
                  </div>
                  <div className={styles.infoRow}>
                    <span className={styles.infoRowLabel}>Verified runs</span>
                    <span className={styles.infoRowValuePlain} style={{ color: "#64D96B" }}>
                      {listing.verifiedRuns}
                    </span>
                  </div>
                  <div className={styles.infoRow}>
                    <span className={styles.infoRowLabel}>Failed proofs</span>
                    <span className={styles.infoRowValuePlain} style={{ color: "#F45B45" }}>
                      {listing.failedProofs}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className={styles.proofsSection}>
              <div className={styles.proofsLabel}>Recent proofs</div>
              <div className={styles.proofsTable}>
                <div className={`${styles.proofHead} ${styles.proofGridCols}`}>
                  <span>Proof ID</span>
                  <span>Task</span>
                  <span>State</span>
                  <span>Payment</span>
                  <span>Casper</span>
                </div>
                {listing.recentProofs.map((p) => (
                  <Link key={p.id} href={p.href} className={`${styles.proofRow} ${styles.proofGridCols}`}>
                    <span className={styles.proofId}>{p.id}</span>
                    <span className={styles.proofTask}>{p.task}</span>
                    <span className={styles.proofState}>
                      <span className={styles.proofStateDot} />
                      {p.state}
                    </span>
                    <span className={styles.proofState}>
                      <span className={styles.proofStateDot} />
                      {p.payment}
                    </span>
                    <span className={styles.proofHash}>{p.hash}</span>
                  </Link>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
