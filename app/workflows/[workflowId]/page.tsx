"use client";

import { use, useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AppNav } from "@/components/app/AppNav";
import { StepRuns } from "@/components/workflow-detail/StepRuns";
import { PaymentSplitTable } from "@/components/workflow-detail/PaymentSplitTable";
import { FinalProofBundle } from "@/components/workflow-detail/FinalProofBundle";
import {
  WORKFLOW_BUNDLE,
  computeBundleText,
  computeRunButton,
  computeSplits,
  computeSteps,
  type WorkflowStage,
} from "@/components/workflow-detail/workflow-detail-state";
import styles from "@/components/workflow-detail/WorkflowDetail.module.css";

const KNOWN_WORKFLOW_IDS = new Set(["invoice_settlement"]);

type WorkflowDetailPageProps = {
  params: Promise<{ workflowId: string }>;
};

export default function WorkflowDetailPage({ params }: WorkflowDetailPageProps) {
  const { workflowId } = use(params);
  const known = KNOWN_WORKFLOW_IDS.has(workflowId);

  const [stage, setStageState] = useState<WorkflowStage>(0);
  const [copied, setCopied] = useState(false);
  const stageRef = useRef<WorkflowStage>(0);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const setStage = useCallback((next: WorkflowStage) => {
    stageRef.current = next;
    setStageState(next);
  }, []);

  const schedule = useCallback((ms: number, fn: () => void) => {
    timers.current.push(setTimeout(fn, ms));
  }, []);

  useEffect(
    () => () => {
      timers.current.forEach(clearTimeout);
    },
    []
  );

  const runWorkflow = useCallback(() => {
    if (stageRef.current !== 0) return;
    setStage(1);
    schedule(1400, () => setStage(2));
    schedule(2800, () => setStage(3));
    schedule(4200, () => setStage(4));
    schedule(5000, () => setStage(5));
  }, [setStage, schedule]);

  const copyBundle = useCallback(() => {
    if (stageRef.current < 5) return;
    try {
      navigator.clipboard.writeText(JSON.stringify(WORKFLOW_BUNDLE, null, 2));
    } catch {
      // clipboard unavailable, ignore
    }
    setCopied(true);
    schedule(1800, () => setCopied(false));
  }, [schedule]);

  const steps = computeSteps(stage);
  const splits = computeSplits(stage);
  const bundleText = computeBundleText(stage);
  const runButton = computeRunButton(stage);

  return (
    <div className={styles.page}>
      <AppNav
        maxWidth={1080}
        links={[
          { label: "Workflows", href: "/workflows" },
          { label: "Proofs", href: "/proofs" },
        ]}
        cta={null}
      />

      <div className={styles.wrap}>
        <Link href="/workflows" className={styles.backLink}>
          <span className={styles.backArrow}>{"<-"}</span>
          Back to workflows
        </Link>

        {!known ? (
          <div style={{ marginTop: 40 }}>
            <div className={styles.title}>Workflow not found</div>
            <p className={styles.subtitle}>This workflow does not exist or has not been composed yet.</p>
          </div>
        ) : (
          <>
            <div className={styles.headerRow}>
              <div className={styles.headerCopy}>
                <h1 className={styles.title}>Invoice Settlement Workflow</h1>
                <p className={styles.subtitle}>
                  Steps: Invoice Risk Agent, Payment Approval Agent, Settlement Verifier
                </p>
              </div>
              <button
                onClick={runWorkflow}
                className={styles.runButton}
                style={{
                  background: runButton.background,
                  color: runButton.color,
                  borderColor: runButton.borderColor,
                  cursor: runButton.cursor,
                }}
              >
                {runButton.label}
              </button>
            </div>

            <StepRuns steps={steps} />
            <PaymentSplitTable splits={splits} />
            <FinalProofBundle
              bundleText={bundleText}
              ready={stage >= 5}
              copyLabel={copied ? "Copied" : "Copy bundle"}
              onCopy={copyBundle}
            />
          </>
        )}
      </div>
    </div>
  );
}
