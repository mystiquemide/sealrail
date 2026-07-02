"use client";

import { use, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { AppNav } from "@/components/app/AppNav";
import { StepRuns } from "@/components/workflow-detail/StepRuns";
import { PaymentSplitTable } from "@/components/workflow-detail/PaymentSplitTable";
import { FinalProofBundle } from "@/components/workflow-detail/FinalProofBundle";
import {
  computeBundleText,
  computeRunButtonLabel,
  computeSplits,
  computeSteps,
} from "@/components/workflow-detail/workflow-detail-state";
import {
  ApiClientError,
  finalizeWorkflowRun,
  getWorkflow,
  getWorkflowRun,
  listAgents,
  listVerifiers,
  runWorkflow,
  runWorkflowStep,
} from "@/lib/api";
import { DEMO_BUYER_ADDRESS } from "@/lib/session";
import type { WorkflowRun, WorkflowTemplate } from "@/lib/api-types";
import styles from "@/components/workflow-detail/WorkflowDetail.module.css";

type WorkflowDetailPageProps = {
  params: Promise<{ workflowId: string }>;
};

export default function WorkflowDetailPage({ params }: WorkflowDetailPageProps) {
  const { workflowId } = use(params);

  const [template, setTemplate] = useState<WorkflowTemplate | null | undefined>(undefined);
  const [run, setRun] = useState<WorkflowRun | null>(null);
  const [agentNames, setAgentNames] = useState<Map<string, string>>(new Map());
  const [verifierNames, setVerifierNames] = useState<Map<string, string>>(new Map());
  const [busy, setBusy] = useState(false);
  const [busyStepId, setBusyStepId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [stepProofHashes, setStepProofHashes] = useState<string[]>([]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const { workflow } = await getWorkflow(workflowId);
        if (cancelled) return;
        setTemplate(workflow);
        const agentIds = Array.from(new Set(workflow.steps.map((s) => s.agent_id)));
        const verifierIds = Array.from(new Set(workflow.steps.map((s) => s.verifier_id)));
        const [{ agents }, { verifiers }] = await Promise.all([listAgents(), listVerifiers()]);
        setAgentNames(new Map(agents.filter((a) => agentIds.includes(a.id)).map((a) => [a.id, a.name])));
        setVerifierNames(new Map(verifiers.filter((v) => verifierIds.includes(v.id)).map((v) => [v.id, v.name])));
      } catch (err) {
        if (!cancelled) setTemplate(err instanceof ApiClientError && err.status === 404 ? null : null);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [workflowId]);

  const advance = useCallback(async () => {
    if (busy) return;
    setBusy(true);
    setErrorMessage(null);
    try {
      let currentRun = run;

      if (!currentRun) {
        const res = await runWorkflow(workflowId, DEMO_BUYER_ADDRESS);
        currentRun = res.run;
        setRun(currentRun);
      }

      const nextStep = currentRun.step_runs.find((sr) => sr.status === "waiting");
      if (nextStep) {
        setBusyStepId(nextStep.id);
        const res = await runWorkflowStep(currentRun.id, nextStep.step_template_id, nextStep.agent_id);
        setStepProofHashes((prev) => [...prev, res.proof.output_hash]);
        setRun(res.run);
        setBusyStepId(null);
        return;
      }

      const allVerified = currentRun.step_runs.every((sr) => sr.status === "verified");
      if (allVerified && currentRun.status !== "anchored" && currentRun.status !== "payable" && currentRun.status !== "paid") {
        const res = await finalizeWorkflowRun(currentRun.id);
        setRun(res.run);
      }
    } catch (err) {
      setErrorMessage(err instanceof ApiClientError ? err.message : "Workflow step failed.");
      const latest = await getWorkflowRun(workflowId).catch(() => null);
      if (latest) setRun(latest.run);
    } finally {
      setBusy(false);
      setBusyStepId(null);
    }
  }, [busy, run, workflowId]);

  const copyBundle = useCallback(() => {
    if (!run || run.status !== "payable" && run.status !== "paid" && run.status !== "anchored") return;
    const bundle = {
      workflow: workflowId,
      run_id: run.id,
      step_proof_hashes: stepProofHashes,
      final_proof_id: run.final_proof_id,
      status: run.status,
    };
    try {
      navigator.clipboard.writeText(JSON.stringify(bundle, null, 2));
    } catch {
      // clipboard unavailable, ignore
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }, [run, workflowId, stepProofHashes]);

  if (template === undefined) {
    return (
      <div className={styles.page}>
        <AppNav maxWidth={1080} links={[{ label: "Workflows", href: "/workflows" }]} cta={null} />
        <div className={styles.wrap}>
          <p className={styles.subtitle}>Loading...</p>
        </div>
      </div>
    );
  }

  const steps = template && run ? computeSteps(run.step_runs, template.steps, agentNames, verifierNames, busyStepId) : [];
  const splits = template
    ? computeSplits(
        template.payment_split_default.length > 0
          ? template.payment_split_default
          : template.steps.map((s) => ({ address: s.agent_id, role: "workflow_step", share_bps: s.payment_share_bps, agent_id: s.agent_id })),
        run?.status ?? "created",
        agentNames
      )
    : [];
  const bundleText = computeBundleText(run, stepProofHashes);
  const runButtonLabel = computeRunButtonLabel(run, busy);
  const finished = run ? ["anchored", "payable", "paid"].includes(run.status) : false;
  const failed = run?.status === "step_failed";

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

        {!template ? (
          <div style={{ marginTop: 40 }}>
            <div className={styles.title}>Workflow not found</div>
            <p className={styles.subtitle}>This workflow does not exist or has not been composed yet.</p>
          </div>
        ) : (
          <>
            <div className={styles.headerRow}>
              <div className={styles.headerCopy}>
                <h1 className={styles.title}>{template.name}</h1>
                <p className={styles.subtitle}>
                  Steps: {template.steps.map((s) => agentNames.get(s.agent_id) ?? s.name).join(", ")}
                </p>
              </div>
              <button
                onClick={advance}
                disabled={busy || finished || failed}
                className={styles.runButton}
                style={{
                  background: finished ? "transparent" : busy ? "rgba(60,141,255,0.14)" : "#FFFFFF",
                  color: finished ? "#64D96B" : busy ? "#9DC4FF" : "#080808",
                  borderColor: finished ? "rgba(100,217,107,0.4)" : busy ? "rgba(60,141,255,0.45)" : "#FFFFFF",
                  cursor: busy || finished || failed ? "default" : "pointer",
                }}
              >
                {runButtonLabel}
              </button>
            </div>

            {errorMessage ? <div style={{ color: "#F45B45", fontSize: 13, margin: "12px 0" }}>{errorMessage}</div> : null}

            <StepRuns steps={steps} />
            <PaymentSplitTable splits={splits} />
            <FinalProofBundle
              bundleText={bundleText}
              ready={finished}
              copyLabel={copied ? "Copied" : "Copy bundle"}
              onCopy={copyBundle}
            />
          </>
        )}
      </div>
    </div>
  );
}
