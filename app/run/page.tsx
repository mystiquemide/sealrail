"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AppNav } from "@/components/app/AppNav";
import { EmptyState } from "@/components/app/EmptyState";
import { Skeleton } from "@/components/app/Skeleton";
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
  listAgents,
  runDemoInvoiceProof,
} from "@/lib/api";
import { DEMO_BUYER_ADDRESS, getSession, hasCasperWalletExtension } from "@/lib/session";
import { BACKEND_UNREACHABLE_BODY } from "@/lib/copy";
import type { Agent } from "@/lib/api-types";
import styles from "@/components/run/Run.module.css";

const GREEN = "#64D96B";
const AMBER = "#F2B84B";
const RED = "#F45B45";
const GRAY = "#6E6E6C";
const NEU = "#C9C9C7";

function formatPaymentState(status: string): string {
  switch (status) {
    case "not_started":
      return "Not started";
    case "locked":
      return "Locked";
    case "unlockable":
      return "Verified - ready to claim";
    case "paid":
      return "Unlocked";
    case "blocked":
      return "Blocked";
    default:
      return status;
  }
}

function paymentStateColorFor(status: string, failed: boolean): string {
  if (failed) return RED;
  switch (status) {
    case "paid":
      return GREEN;
    case "unlockable":
    case "locked":
      return AMBER;
    case "blocked":
      return RED;
    default:
      return GRAY;
  }
}

const INITIAL_FIELDS: TaskFormFields = {
  invoiceId: "INV-1030",
  amount: "12400",
  vendor: "Northwind Supply",
  buyer: "Atlas Retail",
  dueDate: "2026-07-30",
  terms: "Net 30",
  notes: "Recurring vendor. Due-date variance flagged on prior cycle.",
};

const READ_ONLY_PROOF_LINKS = [
  {
    href: "/proofs/0b9bad2e-3fe8-4ab5-80fb-4fa12de95f77",
    label: "View completed proof",
    body: "Verified invoice-risk run with Casper testnet anchor and payable state.",
  },
  {
    href: "/proofs/6d809aec-c67d-44aa-938d-e75c2867bd4c",
    label: "View failed proof",
    body: "Rejected proof with no Casper anchor and payment blocked.",
  },
  {
    href: "/proofs",
    label: "Open proof explorer",
    body: "Browse persisted proof rows and open their on-chain deploys.",
  },
];

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
  const [deployHash, setDeployHash] = useState<string | null>("live");
  const [casperMode, setCasperMode] = useState<string>("testnet");
  const [output, setOutput] = useState<OutputState | null>(null);
  const [wasmHash, setWasmHash] = useState("pending");
  const [attHash, setAttHash] = useState("pending");
  const [anchHash, setAnchHash] = useState("pending");
  const [paymentStatusRaw, setPaymentStatusRaw] = useState("not_started");
  const [paymentState, setPaymentState] = useState(formatPaymentState("not_started"));
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied" | "failed">("idle");
  const [fullFlowRunning, setFullFlowRunning] = useState(false);
  const [agentLoadError, setAgentLoadError] = useState(false);
  const copyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let alive = true;

    listAgents({ status: "active", category: "invoice" })
      .then(({ agents }) => {
        if (alive) setAgent(agents[0] ?? null);
      })
      .catch((err) => {
        if (!alive) return;
        setErrorMessage(err instanceof ApiClientError ? err.message : "Couldn't load the invoice agent. Please refresh.");
        setAgentLoadError(true);
        setAgent(null);
      });

    return () => {
      alive = false;
      if (copyTimer.current) clearTimeout(copyTimer.current);
    };
  }, []);

  function updateField<K extends keyof TaskFormFields>(key: K, value: string) {
    setFields((f) => ({ ...f, [key]: value }));
  }

  const runFullFlow = useCallback(async (demoFailure = false) => {
    if (!agent) return;
    if (!getSession() && !hasCasperWalletExtension()) {
      setFailedStep(null);
      setBusyStep(null);
      setFullFlowRunning(false);
      setErrorMessage(
        "Casper Wallet extension not detected. Fresh runs need wallet approval to bind holder identity. Use a read-only proof below, or install Casper Wallet and refresh."
      );
      return;
    }
    setFullFlowRunning(true);
    setFailedStep(null);
    setErrorMessage(null);
    setBusyStep(1);
    try {
      const demo = await runDemoInvoiceProof({
        agent_id: agent.id,
        buyer_address: DEMO_BUYER_ADDRESS,
        total_amount: Number(fields.amount) || 0,
        currency: "USD",
        title: fields.invoiceId,
        task_type: agent.supported_task_types[0] ?? "invoice_risk",
        demo_failure: demoFailure,
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

      setTaskId(demo.task_id);
      setPaymentStatusRaw("locked");
      setPaymentState(formatPaymentState("locked"));
      setStage(1);
      setBusyStep(2);

      const result = demo.output.result as {
        risk_score?: number;
        decision?: string;
        reasoning?: string;
        flags?: string[];
      };
      setProofId(demo.proof_id);
      setOutput({
        riskScore: result.risk_score !== undefined ? String(result.risk_score) : "-",
        decision: result.decision ?? "-",
        reason: result.reasoning ?? "No reasoning returned.",
        flags: result.flags ?? [],
        outputHash: demo.output.output_hash ?? "verification-failed",
      });

      if (demo.failed) {
        setStage(3);
        setFailedStep(3);
        setBusyStep(null);
        setAnchHash("not anchored");
        setDeployHash(null);
        setCasperMode("not_anchored");
        setWasmHash(demo.proof.wasm_hash);
        setAttHash(demo.proof.attestation_hash);
        setPaymentStatusRaw(demo.payment_status);
        setPaymentState(formatPaymentState(demo.payment_status));
        setErrorMessage("Proof failed. No Casper anchor was created and payment stayed blocked.");
        return;
      }

      setStage(3);
      setBusyStep(3);

      setAnchHash(demo.anchor_hash ?? "pending");
      setDeployHash(demo.deploy_hash || "live");
      setCasperMode(demo.casper_mode ?? "testnet");
      setWasmHash(demo.proof.wasm_hash);
      setAttHash(demo.proof.attestation_hash);
      setStage(5);
      setBusyStep(4);

      setPaymentStatusRaw(demo.payment_status);
      setPaymentState(formatPaymentState(demo.payment_status));
      setStage(6);
    } catch (err) {
      const message = err instanceof ApiClientError ? err.message : err instanceof Error ? err.message : "Demo flow failed.";
      setErrorMessage(
        message.includes("Casper Wallet") || message.includes("Wallet")
          ? `${message} You can still verify the invariant with the read-only proof links below.`
          : message
      );
      setFailedStep(2);
    } finally {
      setBusyStep(null);
      setFullFlowRunning(false);
    }
  }, [agent, fields]);

  function reset() {
    setStage(0);
    setBusyStep(null);
    setFailedStep(null);
    setTaskId(null);
    setProofId(null);
    setDeployHash("live");
    setCasperMode("testnet");
    setOutput(null);
    setWasmHash("pending");
    setAttHash("pending");
    setAnchHash("pending");
    setPaymentStatusRaw("not_started");
    setPaymentState(formatPaymentState("not_started"));
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
        payment_state: paymentStatusRaw,
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
  }, [taskId, output, fields.invoiceId, wasmHash, attHash, anchHash, deployHash, casperMode, paymentState, paymentStatusRaw]);

  const steps = computeSteps(stage, busyStep, failedStep, anchHash !== "pending" ? anchHash : undefined);
  const variants = computeButtonVariants(stage, busyStep, failedStep);
  const labels = computeButtonLabels(stage, busyStep, failedStep);
  const outVisible = stage >= 3;
  const hasProof = stage >= 5;

  // Wrapped so the DOM click event never leaks into the optional task-id parameter
  const buttons = [
    { n: "01", label: labels.b1, variant: variants.b1, onClick: () => void runFullFlow() },
    { n: "02", label: labels.b2, variant: variants.b2, onClick: () => void runFullFlow() },
    { n: "03", label: labels.b3, variant: variants.b3, onClick: () => void runFullFlow() },
    { n: "04", label: labels.b4, variant: variants.b4, onClick: () => void runFullFlow() },
  ];

  if (agent === undefined) {
    return (
      <div className={styles.page}>
        <AppNav />
        <main id="main" tabIndex={-1}>
          <div className={styles.headerWrap}>
            <div className={styles.headerCopy}>
              <Skeleton width={90} height={11} />
              <Skeleton width="70%" height={34} style={{ marginTop: 14 }} />
              <Skeleton width="55%" height={16} style={{ marginTop: 12 }} />
            </div>
          </div>
          <div className={styles.workspaceWrap} style={{ paddingBottom: 0 }}>
            <div className={styles.sponsorGrid}>
              {[0, 1, 2].map((i) => (
                <div key={i} className={styles.sponsorCard}>
                  <Skeleton width={140} height={11} />
                  <Skeleton width="100%" height={12} style={{ marginTop: 12 }} />
                  <Skeleton width="80%" height={12} style={{ marginTop: 8 }} />
                </div>
              ))}
            </div>
          </div>
          <div className={styles.workspaceWrap}>
            <div className={styles.workspaceGrid}>
              <div style={{ height: 320 }}>
                <Skeleton block />
              </div>
              <div style={{ height: 320 }}>
                <Skeleton block />
              </div>
            </div>
          </div>
          <span
            role="status"
            style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0 0 0 0)", whiteSpace: "nowrap" }}
          >
            Loading task runner...
          </span>
        </main>
      </div>
    );
  }


  if (agent === null) {
    return (
      <div className={styles.page}>
        <AppNav />
        <main id="main" tabIndex={-1} className={styles.headerWrap}>
          {agentLoadError ? (
            <EmptyState
              error
              title="Couldn't load the invoice agent"
              body={BACKEND_UNREACHABLE_BODY}
            />
          ) : (
            <EmptyState
              title="No invoice-risk agent registered yet"
              body='Register an agent in the "invoice" category to run a payment-backed proof task.'
              actionLabel="Register an agent"
              actionHref="/owner/agents/new"
            />
          )}
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
            <p className={styles.walletNote}>
              Running a fresh flow needs the Casper Wallet extension to bind the holder identity. No wallet?
              Verify the same invariant on <Link href="/proofs" className={styles.walletNoteLink}>/proofs</Link> and open any proof&apos;s Casper deploy.
            </p>
            <div className={styles.readOnlyCallout}>
              <div>
                <div className={styles.readOnlyLabel}>Safe path</div>
                <p className={styles.readOnlyBody}>No wallet approval or live mutation needed. Inspect the completed and failed proof paths directly.</p>
              </div>
              <div className={styles.readOnlyActions}>
                {READ_ONLY_PROOF_LINKS.map((link) => (
                  <Link key={link.href} href={link.href} className={styles.readOnlyLink}>
                    <span>{link.label}</span>
                    <small>{link.body}</small>
                  </Link>
                ))}
              </div>
            </div>
          </div>
          <div className={styles.headerActions}>
            <span className={styles.modeBadge}>
              <span className={styles.modeBadgeDot} />
              Schema + hash verification
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
              {stage === 0 && !fullFlowRunning ? (
                <button
                  className={styles.btnReset}
                  onClick={() => void runFullFlow(true)}
                  disabled={busyStep !== null || fullFlowRunning}
                >
                  Run failing proof
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
            <div className={styles.panelLabel}>Agentic AI + RWA on Casper</div>
            <p className={styles.sponsorText}>Payment infrastructure for AI-agent work: invoice work is verified, anchored on Casper, then paid.</p>
          </div>
          <div className={styles.sponsorCard}>
            <div className={styles.panelLabel}>x402-compatible receipt</div>
            <p className={styles.sponsorText}>The proof bundle includes a 402-style payment receipt: payment required, proof required, unlock only after verified anchor.</p>
          </div>
          <div className={styles.sponsorCard}>
            <div className={styles.panelLabel}>Casper anchor visibility</div>
            <p className={styles.sponsorText}>Mode: <span className={styles.inlineMono}>{casperMode}</span> · deploy: <span className={styles.inlineMono}>{deployHash ?? "live"}</span></p>
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
            riskScore={output?.riskScore ?? "-"}
            decision={output?.decision ?? "-"}
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
            paymentStateColor={paymentStateColorFor(paymentStatusRaw, Boolean(failedStep))}
            hasProof={hasProof}
            copyLabel={copyStatus === "copied" ? "Copied" : copyStatus === "failed" ? "Couldn't copy - select manually" : "Copy proof bundle"}
            onCopy={copyBundle}
            detailHref={proofId ? `/proofs/${proofId}` : taskId ? `/proofs/${taskId}` : "#"}
          />
        </div>
      </div>
      </main>
    </div>
  );
}
