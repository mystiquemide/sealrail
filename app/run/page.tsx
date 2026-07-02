"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AppNav } from "@/components/app/AppNav";
import { EmptyState } from "@/components/app/EmptyState";
import { TaskForm, type TaskFormFields } from "@/components/run/TaskForm";
import { LiveProofRail } from "@/components/run/LiveProofRail";
import { VerifiedOutputPanel } from "@/components/run/VerifiedOutputPanel";
import { ProofHashesPanel } from "@/components/run/ProofHashesPanel";
import {
  computeButtonLabels,
  computeButtonVariants,
  computeSteps,
  type BusyStep,
  type FailedStep,
  type Stage,
} from "@/components/run/run-state";
import {
  ApiClientError,
  anchorTask,
  createTask,
  getTaskDetail,
  getTaskOutput,
  listAgents,
  runTask,
  unlockTaskPayment,
  verifyTask,
} from "@/lib/api";
import { DEMO_BUYER_ADDRESS } from "@/lib/session";
import type { Agent } from "@/lib/api-types";
import styles from "@/components/run/Run.module.css";

const GREEN = "#64D96B";
const AMBER = "#F2B84B";
const RED = "#F45B45";
const GRAY = "#6E6E6C";
const NEU = "#C9C9C7";

const INITIAL_FIELDS: TaskFormFields = {
  invoiceId: "INV-1030",
  amount: "12400",
  vendor: "Northwind Supply",
  buyer: "Atlas Retail",
  dueDate: "2026-07-30",
  terms: "Net 30",
  notes: "Recurring vendor. Due-date variance flagged on prior cycle.",
};

type OutputState = {
  riskScore: string;
  decision: string;
  reason: string;
  flags: string[];
  outputHash: string;
};

export default function RunPage() {
  const [agent, setAgent] = useState<Agent | null | undefined>(undefined);
  const [fields, setFields] = useState<TaskFormFields>(INITIAL_FIELDS);
  const [stage, setStage] = useState<Stage>(0);
  const [busyStep, setBusyStep] = useState<BusyStep>(null);
  const [failedStep, setFailedStep] = useState<FailedStep>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [taskId, setTaskId] = useState<string | null>(null);
  const [proofId, setProofId] = useState<string | null>(null);
  const [deployHash, setDeployHash] = useState<string | null>(null);
  const [casperMode, setCasperMode] = useState<string>("pending");
  const [output, setOutput] = useState<OutputState | null>(null);
  const [wasmHash, setWasmHash] = useState("pending");
  const [attHash, setAttHash] = useState("pending");
  const [anchHash, setAnchHash] = useState("pending");
  const [paymentState, setPaymentState] = useState("Not started");
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied" | "failed">("idle");
  const [fullFlowRunning, setFullFlowRunning] = useState(false);
  const copyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    listAgents({ status: "active", category: "invoice" }).then(({ agents }) => {
      setAgent(agents[0] ?? null);
    });
    return () => {
      if (copyTimer.current) clearTimeout(copyTimer.current);
    };
  }, []);

  function updateField<K extends keyof TaskFormFields>(key: K, value: string) {
    setFields((f) => ({ ...f, [key]: value }));
  }

  const handleCreateTask = useCallback(async (): Promise<string | null> => {
    if (!agent) return null;
    setBusyStep(1);
    setErrorMessage(null);
    try {
      const res = await createTask({
        agent_id: agent.id,
        buyer_address: DEMO_BUYER_ADDRESS,
        total_amount: Number(fields.amount) || 0,
        currency: "USD",
        title: fields.invoiceId,
        task_type: agent.supported_task_types[0] ?? "invoice_risk",
        input: {
          invoice_id: fields.invoiceId,
          vendor: fields.vendor,
          buyer: fields.buyer,
          due_date: fields.dueDate,
          terms: fields.terms,
          notes: fields.notes,
          amount_usd: Number(fields.amount) || 0,
        },
      });
      setTaskId(res.task_id);
      setPaymentState("Locked");
      setStage(1);
      return res.task_id;
    } catch (err) {
      setErrorMessage(err instanceof ApiClientError ? err.message : "Failed to create task.");
      return null;
    } finally {
      setBusyStep(null);
    }
  }, [agent, fields]);

  const handleRunAgent = useCallback(
    async (overrideTaskId?: string): Promise<boolean> => {
      const tid = overrideTaskId ?? taskId;
      if (!tid) return false;
      setBusyStep(2);
      setErrorMessage(null);
      try {
        const runRes = await runTask(tid);
        setProofId(runRes.proof_id);
        const { output: out } = await getTaskOutput(tid);
        const result = out.result as {
          risk_score?: number;
          decision?: string;
          reasoning?: string;
          flags?: string[];
        };
        setOutput({
          riskScore: result.risk_score !== undefined ? String(result.risk_score) : "—",
          decision: result.decision ?? "—",
          reason: result.reasoning ?? "No reasoning returned.",
          flags: result.flags ?? [],
          outputHash: out.output_hash,
        });
        setStage(3);
        return true;
      } catch (err) {
        setErrorMessage(err instanceof ApiClientError ? err.message : "Agent execution failed.");
        setFailedStep(2);
        return false;
      } finally {
        setBusyStep(null);
      }
    },
    [taskId]
  );

  const handleVerifyAndAnchor = useCallback(
    async (overrideTaskId?: string): Promise<boolean> => {
      const tid = overrideTaskId ?? taskId;
      if (!tid) return false;
      setBusyStep(3);
      setErrorMessage(null);
      try {
        await verifyTask(tid);
        const anchorRes = await anchorTask(tid);
        setAnchHash(anchorRes.anchor_hash);
        setProofId(anchorRes.proof_id);
        setDeployHash(anchorRes.deploy_hash || null);
        setCasperMode(anchorRes.casper_mode);

        const detail = await getTaskDetail(tid);
        const latestProof = detail.proofs[detail.proofs.length - 1];
        if (latestProof) {
          setWasmHash(latestProof.wasm_hash);
          setAttHash(latestProof.attestation_hash);
        }
        setStage(5);
        return true;
      } catch (err) {
        setErrorMessage(err instanceof ApiClientError ? err.message : "Verification failed.");
        setFailedStep(3);
        return false;
      } finally {
        setBusyStep(null);
      }
    },
    [taskId]
  );

  const handleUnlockPayment = useCallback(
    async (overrideTaskId?: string): Promise<boolean> => {
      const tid = overrideTaskId ?? taskId;
      if (!tid) return false;
      setBusyStep(4);
      setErrorMessage(null);
      try {
        await unlockTaskPayment(tid);
        setPaymentState("Unlocked");
        setStage(6);
        return true;
      } catch (err) {
        setErrorMessage(err instanceof ApiClientError ? err.message : "Payment unlock failed.");
        return false;
      } finally {
        setBusyStep(null);
      }
    },
    [taskId]
  );

  const runFullFlow = useCallback(async () => {
    setFullFlowRunning(true);
    try {
      const tid = await handleCreateTask();
      if (!tid) return;
      if (!(await handleRunAgent(tid))) return;
      if (!(await handleVerifyAndAnchor(tid))) return;
      await handleUnlockPayment(tid);
    } finally {
      setFullFlowRunning(false);
    }
  }, [handleCreateTask, handleRunAgent, handleVerifyAndAnchor, handleUnlockPayment]);

  function reset() {
    setStage(0);
    setBusyStep(null);
    setFailedStep(null);
    setTaskId(null);
    setProofId(null);
    setDeployHash(null);
    setCasperMode("pending");
    setOutput(null);
    setWasmHash("pending");
    setAttHash("pending");
    setAnchHash("pending");
    setPaymentState("Not started");
    setErrorMessage(null);
    setCopyStatus("idle");
  }

  const copyBundle = useCallback(async () => {
    if (!taskId || !output) return;
    const bundle = {
      task: fields.invoiceId,
      task_id: taskId,
      decision: output.decision,
      risk_score: output.riskScore,
      flags: output.flags,
      output_hash: output.outputHash,
      wasm_hash: wasmHash,
      attestation_hash: attHash,
      casper_anchor: anchHash,
      casper_deploy_hash: deployHash,
      casper_mode: casperMode,
      payment_state: paymentState,
      x402_receipt: {
        protocol: "x402-compatible",
        network: casperMode === "pending" ? "casper" : `casper-${casperMode}`,
        status_code: 402,
        payment_required: true,
        proof_required: true,
        unlock_condition: "verified_proof_anchor",
        payment_state: paymentState.toLowerCase(),
      },
    };
    if (copyTimer.current) clearTimeout(copyTimer.current);
    try {
      await navigator.clipboard.writeText(JSON.stringify(bundle, null, 2));
      setCopyStatus("copied");
    } catch {
      setCopyStatus("failed");
    }
    copyTimer.current = setTimeout(() => setCopyStatus("idle"), 1800);
  }, [taskId, output, fields.invoiceId, wasmHash, attHash, anchHash, deployHash, casperMode, paymentState]);

  const steps = computeSteps(stage, busyStep, failedStep, anchHash !== "pending" ? anchHash : undefined);
  const variants = computeButtonVariants(stage, busyStep, failedStep);
  const labels = computeButtonLabels(stage, busyStep, failedStep);
  const outVisible = stage >= 3;
  const hasProof = stage >= 5;

  // Wrapped so the DOM click event never leaks into the optional task-id parameter
  const buttons = [
    { n: "01", label: labels.b1, variant: variants.b1, onClick: () => void handleCreateTask() },
    { n: "02", label: labels.b2, variant: variants.b2, onClick: () => void handleRunAgent() },
    { n: "03", label: labels.b3, variant: variants.b3, onClick: () => void handleVerifyAndAnchor() },
    { n: "04", label: labels.b4, variant: variants.b4, onClick: () => void handleUnlockPayment() },
  ];

  if (agent === undefined) {
    return (
      <div className={styles.page}>
        <AppNav />
        <main id="main" tabIndex={-1} className={styles.headerWrap}>
          <p className={styles.subtitle}>Loading...</p>
        </main>
      </div>
    );
  }


  if (agent === null) {
    return (
      <div className={styles.page}>
        <AppNav />
        <main id="main" tabIndex={-1} className={styles.headerWrap}>
          <EmptyState
            title="No invoice-risk agent registered yet"
            body='Register an agent in the "invoice" category to run a payment-backed proof task.'
            actionLabel="Register an agent"
            actionHref="/owner/agents/new"
          />
        </main>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <AppNav />

      <main id="main" tabIndex={-1}>
      <div className={styles.headerWrap}>
        <div className={styles.headerRow}>
          <div className={styles.headerCopy}>
            <div className={styles.eyebrow}>Task runner</div>
            <h1 className={styles.title}>Run a payment-backed invoice proof.</h1>
            <p className={styles.subtitle}>
              Create a funded task, verify the agent output, anchor the proof on Casper, and unlock payment.
            </p>
          </div>
          <div className={styles.headerActions}>
            <span className={styles.modeBadge}>
              <span className={styles.modeBadgeDot} />
              TEE Verification Mode
            </span>
            <div className={styles.headerButtons}>
              {stage === 0 || fullFlowRunning ? (
                <button
                  className={styles.btnRunAll}
                  onClick={() => void runFullFlow()}
                  disabled={busyStep !== null || fullFlowRunning}
                >
                  {fullFlowRunning ? "Running full flow..." : "Run full flow"}
                </button>
              ) : null}
              <button className={styles.btnReset} onClick={reset}>
                Reset
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.workspaceWrap} style={{ paddingBottom: 0 }}>
        <div className={styles.sponsorGrid}>
          <div className={styles.sponsorCard}>
            <div className={styles.panelLabel}>Casper Innovation Track</div>
            <p className={styles.sponsorText}>Agentic AI + RWA payment infrastructure: invoice work is verified, anchored, then paid.</p>
          </div>
          <div className={styles.sponsorCard}>
            <div className={styles.panelLabel}>x402-compatible receipt</div>
            <p className={styles.sponsorText}>The proof bundle includes a 402-style payment receipt: payment required, proof required, unlock only after verified anchor.</p>
          </div>
          <div className={styles.sponsorCard}>
            <div className={styles.panelLabel}>Casper anchor visibility</div>
            <p className={styles.sponsorText}>Mode: <span className={styles.inlineMono}>{casperMode}</span> · deploy: <span className={styles.inlineMono}>{deployHash ?? "pending"}</span></p>
          </div>
        </div>
      </div>

      {errorMessage ? (
        <div className={styles.workspaceWrap} style={{ paddingBottom: 0 }}>
          <div style={{ color: RED, fontSize: 13, padding: "12px 0" }}>{errorMessage}</div>
        </div>
      ) : null}

      <div className={styles.workspaceWrap}>
        <div className={styles.workspaceGrid}>
          <TaskForm fields={fields} onFieldChange={updateField} fieldsLocked={stage > 0} buttons={buttons} />
          <LiveProofRail steps={steps} taskTitle={fields.invoiceId} />
        </div>

        <div className={styles.outputGrid}>
          <VerifiedOutputPanel
            outVisible={outVisible}
            badge={failedStep === 2 ? "Agent failed" : failedStep === 3 ? "Proof failed" : hasProof ? "Proof verified" : outVisible ? "Unverified" : "No output"}
            color={failedStep ? RED : hasProof ? GREEN : AMBER}
            riskScore={output?.riskScore ?? "—"}
            decision={output?.decision ?? "—"}
            reason={output?.reason ?? "Run the agent to produce a decision."}
            flags={output?.flags ?? []}
            noFlags={!output || output.flags.length === 0}
            flagsEmptyText="No flags raised."
          />
          <ProofHashesPanel
            outVisible={outVisible}
            outputHash={output?.outputHash ?? "pending"}
            outputHashColor={output ? NEU : GRAY}
            wasmHash={wasmHash}
            wasmColor={wasmHash !== "pending" ? NEU : GRAY}
            attHash={attHash}
            attColor={attHash !== "pending" ? NEU : GRAY}
            anchHash={anchHash}
            anchColor={anchHash !== "pending" ? GREEN : GRAY}
            paymentState={paymentState}
            paymentStateColor={stage >= 6 ? GREEN : failedStep ? RED : stage >= 1 ? AMBER : GRAY}
            hasProof={hasProof}
            copyLabel={copyStatus === "copied" ? "Copied" : copyStatus === "failed" ? "Couldn't copy — select manually" : "Copy proof bundle"}
            onCopy={copyBundle}
            detailHref={proofId ? `/proofs/${proofId}` : taskId ? `/proofs/${taskId}` : "#"}
          />
        </div>
      </div>
      </main>
    </div>
  );
}
