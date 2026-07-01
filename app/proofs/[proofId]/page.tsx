"use client";

import { use, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AppNav } from "@/components/app/AppNav";
import { buildProofBundle, getProofDetail } from "@/components/proof-detail/proof-detail-data";
import styles from "@/components/proof-detail/ProofDetail.module.css";

type ProofDetailPageProps = {
  params: Promise<{ proofId: string }>;
};

export default function ProofDetailPage({ params }: ProofDetailPageProps) {
  const { proofId } = use(params);
  const record = getProofDetail(proofId);

  const [copied, setCopied] = useState(false);
  const copyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (copyTimer.current) clearTimeout(copyTimer.current);
    },
    []
  );

  function copyBundle() {
    if (!record) return;
    const bundle = buildProofBundle(proofId, record);
    try {
      navigator.clipboard.writeText(JSON.stringify(bundle, null, 2));
    } catch {
      // clipboard unavailable, ignore
    }
    setCopied(true);
    if (copyTimer.current) clearTimeout(copyTimer.current);
    copyTimer.current = setTimeout(() => setCopied(false), 1800);
  }

  const copyLabel = copied ? "Copied" : "Copy proof bundle";

  return (
    <div className={styles.page}>
      <AppNav
        maxWidth={1080}
        links={[
          { label: "Proofs", href: "/proofs" },
          { label: "Agents", href: "/#vertical" },
        ]}
        cta={{ label: "Start run", href: "/run", variant: "primary" }}
      />

      <div className={styles.wrap}>
        {!record ? (
          <>
            <Link href="/proofs" className={styles.backLink}>
              <span className={styles.backArrow}>{"<-"}</span>
              Back to proofs
            </Link>
            <div style={{ marginTop: 40 }}>
              <div className={styles.title}>Proof not found</div>
              <p className={styles.statusSentence}>This task does not have a proof record yet.</p>
            </div>
          </>
        ) : (
          <>
            <div className={styles.statusHeaderRow}>
              <div>
                <Link href="/proofs" className={styles.backLink}>
                  <span className={styles.backArrow}>{"<-"}</span>
                  Back to proofs
                </Link>
                <div className={styles.taskLabel}>TASK</div>
                <h1 className={styles.title}>{proofId}</h1>
                <p className={styles.statusSentence}>{record.statusSentence}</p>
              </div>
              <div className={styles.headerActions}>
                <button onClick={copyBundle} className={styles.copyButton}>
                  {copyLabel}
                </button>
                <Link href="/proofs" className={styles.btnGhost}>
                  Back to proofs
                </Link>
              </div>
            </div>

            <div className={styles.panelsWrap}>
              <div className={styles.panel}>
                <div className={styles.panelLabel}>Payment state</div>
                <div className={styles.infoRows}>
                  <div className={styles.infoRow}>
                    <span className={styles.infoRowLabel}>Payment intent</span>
                    <span className={styles.infoRowValueMono}>created</span>
                  </div>
                  <div className={styles.infoRow}>
                    <span className={styles.infoRowLabel}>Amount</span>
                    <span className={styles.infoRowValue}>{record.amount}</span>
                  </div>
                  <div className={styles.infoRow}>
                    <span className={styles.infoRowLabel}>Status</span>
                    <span className={styles.stateTag} style={{ color: record.payColor }}>
                      <span className={styles.stateDot} style={{ background: record.payColor }} />
                      {record.payState}
                    </span>
                  </div>
                  <div className={styles.infoRow}>
                    <span className={styles.infoRowLabel}>Unlock rule</span>
                    <span className={styles.infoRowValue}>proof required</span>
                  </div>
                </div>
              </div>

              <div className={styles.panel}>
                <div className={styles.panelLabel}>Agent output</div>
                <div className={styles.infoRows}>
                  <div className={styles.infoRow}>
                    <span className={styles.infoRowLabel}>Agent</span>
                    <span className={styles.infoRowValue}>Invoice Risk Agent</span>
                  </div>
                  <div className={styles.infoRow}>
                    <span className={styles.infoRowLabel}>Result</span>
                    <span className={styles.infoRowValue}>{record.result}</span>
                  </div>
                  <div className={styles.infoRow}>
                    <span className={styles.infoRowLabel}>Decision</span>
                    <span className={styles.infoRowValue}>{record.decision}</span>
                  </div>
                  <div className={styles.infoRow}>
                    <span className={styles.infoRowLabel}>Timestamp</span>
                    <span className={styles.infoRowValueMonoSmall}>{record.timestamp}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className={styles.cardBlock}>
              <div className={styles.cardHeaderRow}>
                <div className={styles.panelLabel}>Blocky-compatible verification</div>
                <span className={styles.modeBadge}>
                  <span className={styles.modeBadgeDot} />
                  TEE Verification Mode
                </span>
              </div>
              <div className={styles.infoRows}>
                <div className={styles.infoRow}>
                  <span className={styles.infoRowLabel}>Verifier</span>
                  <span className={styles.infoRowValueMono}>verifyInvoiceRisk</span>
                </div>
                <div className={styles.infoRow}>
                  <span className={styles.infoRowLabel}>WASM hash</span>
                  <span className={styles.infoRowValueMono} style={{ color: record.wasmColor }}>
                    {record.wasmHash}
                  </span>
                </div>
                <div className={styles.infoRow}>
                  <span className={styles.infoRowLabel}>Attestation hash</span>
                  <span className={styles.infoRowValueMono} style={{ color: record.attColor }}>
                    {record.attHash}
                  </span>
                </div>
                <div className={styles.infoRow}>
                  <span className={styles.infoRowLabel}>Result</span>
                  <span className={styles.stateTag} style={{ color: record.verifyColor }}>
                    <span className={styles.stateDot} style={{ background: record.verifyColor }} />
                    {record.verifyResult}
                  </span>
                </div>
              </div>
            </div>

            <div className={styles.cardBlock}>
              <div className={styles.panelLabel}>Casper anchor</div>
              <div className={styles.infoRows}>
                <div className={styles.infoRow}>
                  <span className={styles.infoRowLabel}>Chain</span>
                  <span className={styles.infoRowValue}>Casper testnet</span>
                </div>
                <div className={styles.infoRow}>
                  <span className={styles.infoRowLabel}>Contract</span>
                  <span className={styles.infoRowValueMono}>ProofRegistry</span>
                </div>
                <div className={styles.infoRow}>
                  <span className={styles.infoRowLabel}>Proof key</span>
                  <span className={styles.infoRowValueMonoSmall}>{record.proofKey}</span>
                </div>
                <div className={styles.infoRow}>
                  <span className={styles.infoRowLabel}>Anchor status</span>
                  <span className={styles.stateTag} style={{ color: record.anchorColor }}>
                    <span className={styles.stateDot} style={{ background: record.anchorColor }} />
                    {record.anchorStatus}
                  </span>
                </div>
                <div className={styles.infoRow}>
                  <span className={styles.infoRowLabel}>Explorer link</span>
                  <span className={styles.infoRowValueMuted}>{record.explorerLink}</span>
                </div>
              </div>
            </div>

            <div className={styles.cardBlock} style={{ background: "#0C0C0C" }}>
              <div className={styles.cardHeaderRow}>
                <div className={styles.panelLabel}>Raw proof bundle</div>
                <button onClick={copyBundle} className={styles.smallCopyButton}>
                  {copyLabel}
                </button>
              </div>
              <pre className={styles.bundlePre}>{JSON.stringify(buildProofBundle(proofId, record), null, 2)}</pre>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
