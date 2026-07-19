"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { AppNav } from "@/components/app/AppNav";
import { Skeleton } from "@/components/app/Skeleton";
import { toListingDetail, type ListingDetail } from "@/components/marketplace-listing/listing-data";
import { ApiClientError, createTaskFromListing, getMarketplaceListing, getVerifier } from "@/lib/api";
import { DEMO_BUYER_ADDRESS } from "@/lib/session";
import { BACKEND_UNREACHABLE_BODY } from "@/lib/copy";
import styles from "@/components/marketplace-listing/ListingDetail.module.css";

type ListingPageProps = {
  params: Promise<{ listingId: string }>;
};

export default function MarketplaceListingPage({ params }: ListingPageProps) {
  const { listingId } = use(params);

  const [listing, setListing] = useState<ListingDetail | null | undefined>(undefined);
  const [error, setError] = useState(false);

  const [invoiceId, setInvoiceId] = useState("");
  const [amount, setAmount] = useState("");
  const [vendor, setVendor] = useState("");
  const [buyer, setBuyer] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [created, setCreated] = useState<{ taskId: string; title: string } | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const { listing: raw } = await getMarketplaceListing(listingId);
        const verifier = await getVerifier(raw.verifier_id).then((r) => r.verifier).catch(() => undefined);
        if (!cancelled) setListing(toListingDetail(raw, verifier));
      } catch (err) {
        if (cancelled) return;
        if (err instanceof ApiClientError && err.status === 404) {
          setListing(null);
        } else {
          setError(true);
        }
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [listingId]);

  async function handleCreateTask() {
    if (!listing?.isRunnable) {
      setSubmitError("This RWA listing is preview-only. Use the live Invoice Risk flow on /run for a runnable proof-gated payment demo.");
      return;
    }
    if (!invoiceId.trim() || !amount.trim()) {
      setSubmitError("Invoice ID and amount are required.");
      return;
    }
    setSubmitting(true);
    setSubmitError(null);
    try {
      const { task } = await createTaskFromListing(listingId, {
        buyer_address: DEMO_BUYER_ADDRESS,
        input: { invoice_id: invoiceId, amount, vendor, buyer, due_date: dueDate },
      });
      setCreated({ taskId: task.id, title: task.title || invoiceId });
    } catch (err) {
      setSubmitError(err instanceof ApiClientError ? err.message : "Failed to create task.");
    } finally {
      setSubmitting(false);
    }
  }

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

      <main id="main" tabIndex={-1} className={styles.wrap}>
        <Link href="/marketplace" className={styles.backLink}>
          <span className={styles.backArrow}>{"<-"}</span>
          Back to marketplace
        </Link>

        {error ? (
          <div style={{ marginTop: 40 }}>
            <div className={styles.title}>Couldn&apos;t load this listing</div>
            <p className={styles.subtitle}>{BACKEND_UNREACHABLE_BODY}</p>
          </div>
        ) : listing === undefined ? (
          <div style={{ marginTop: 40, display: "flex", flexDirection: "column", gap: 16 }} role="status" aria-label="Loading listing">
            <Skeleton width={100} height={11} />
            <Skeleton width="60%" height={30} />
            <Skeleton width="40%" height={14} />
            <div style={{ height: 220, marginTop: 12 }}>
              <Skeleton block />
            </div>
          </div>
        ) : !listing ? (
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
                <div className={listing.isRunnable ? styles.runtimeLiveBadge : styles.runtimePreviewBadge}>
                  {listing.runtimeLabel}
                </div>
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
            </div>

            <div className={styles.panelsWrap}>
              <div className={styles.panel}>
                <div className={styles.panelLabel}>Task input</div>
                {!listing.isRunnable ? (
                  <div className={styles.previewNotice}>
                    <strong>Preview listing.</strong> This RWA compliance agent shows how the same rail can support
                    RWA review, but its dedicated runtime is not connected yet. For the review-ready live path,
                    run the invoice-risk flow.
                    <Link href="/run" className={styles.previewLink}>
                      Open live invoice-risk demo
                    </Link>
                  </div>
                ) : null}
                {created ? (
                  <div style={{ marginTop: 16 }}>
                    <p className={styles.formLabel} style={{ color: "#64D96B" }}>
                      Task created - {created.title}
                    </p>
                    <div className={styles.formFields} style={{ marginTop: 12 }}>
                      <Link href={`/proofs/${created.taskId}`} className={styles.createTaskButton}>
                        View proof status
                      </Link>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className={styles.formFields}>
                      <div>
                        <label htmlFor="invoice-id" className={styles.formLabel}>Invoice ID</label>
                        <input
                          id="invoice-id"
                          value={invoiceId}
                          onChange={(e) => setInvoiceId(e.target.value)}
                          placeholder="INV-1030"
                          className={styles.formInputMono}
                        />
                      </div>
                      <div>
                        <label htmlFor="invoice-amount" className={styles.formLabel}>Amount</label>
                        <input
                          id="invoice-amount"
                          value={amount}
                          onChange={(e) => setAmount(e.target.value)}
                          placeholder="12400"
                          className={styles.formInput}
                        />
                      </div>
                      <div>
                        <label htmlFor="invoice-vendor" className={styles.formLabel}>Vendor</label>
                        <input id="invoice-vendor" value={vendor} onChange={(e) => setVendor(e.target.value)} className={styles.formInput} />
                      </div>
                      <div>
                        <label htmlFor="invoice-buyer" className={styles.formLabel}>Buyer</label>
                        <input id="invoice-buyer" value={buyer} onChange={(e) => setBuyer(e.target.value)} className={styles.formInput} />
                      </div>
                      <div>
                        <label htmlFor="invoice-due-date" className={styles.formLabel}>Due date</label>
                        <input
                          id="invoice-due-date"
                          value={dueDate}
                          onChange={(e) => setDueDate(e.target.value)}
                          placeholder="2026-07-30"
                          className={styles.formInputMono}
                        />
                      </div>
                    </div>
                    {submitError ? (
                      <p className={styles.formLabel} style={{ color: "#F45B45", marginTop: 10 }}>
                        {submitError}
                      </p>
                    ) : null}
                    <button
                      onClick={handleCreateTask}
                      disabled={submitting || !listing.isRunnable}
                      className={listing.isRunnable ? styles.createTaskButton : styles.createTaskButtonDisabled}
                    >
                      {listing.isRunnable ? (submitting ? "Creating..." : "Create paid task") : "Preview only - use /run"}
                    </button>
                  </>
                )}
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
                    <span className={styles.infoRowLabel}>Runtime status</span>
                    <span className={listing.isRunnable ? styles.infoRowValuePlain : styles.previewStatusValue}>
                      {listing.runtimeLabel}
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
                </div>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
