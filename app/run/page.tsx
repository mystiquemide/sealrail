"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AppNav } from "@/components/app/AppNav";
import { TaskForm } from "@/components/run/TaskForm";
import { LiveProofRail } from "@/components/run/LiveProofRail";
import { VerifiedOutputPanel } from "@/components/run/VerifiedOutputPanel";
import { ProofHashesPanel } from "@/components/run/ProofHashesPanel";
import {
  PROOF_BUNDLE,
  computeButtonLabels,
  computeButtonVariants,
  computeHashes,
  computeOutput,
  computeSteps,
  type Stage,
} from "@/components/run/run-state";
import styles from "@/components/run/Run.module.css";

export default function RunPage() {
  const [stage, setStageState] = useState<Stage>(0);
  const [simulateFail, setSimulateFailState] = useState(false);
  const [copied, setCopied] = useState(false);

  const stageRef = useRef<Stage>(0);
  const failRef = useRef(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const setStage = useCallback((next: Stage) => {
    stageRef.current = next;
    setStageState(next);
  }, []);

  const setSimulateFail = useCallback((next: boolean) => {
    failRef.current = next;
    setSimulateFailState(next);
  }, []);

  const schedule = useCallback((ms: number, fn: () => void) => {
    const t = setTimeout(fn, ms);
    timers.current.push(t);
  }, []);

  const clearTimers = useCallback(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  }, []);

  useEffect(() => () => clearTimers(), [clearTimers]);

  const createTask = useCallback(() => {
    if (stageRef.current !== 0) return;
    setStage(1);
  }, [setStage]);

  const runAgent = useCallback(() => {
    if (stageRef.current !== 1) return;
    setStage(2);
    schedule(1300, () => setStage(3));
  }, [setStage, schedule]);

  const verify = useCallback(() => {
    if (stageRef.current !== 3) return;
    const willFail = failRef.current;
    setStage(4);
    schedule(1500, () => setStage(willFail ? 99 : 5));
  }, [setStage, schedule]);

  const unlock = useCallback(() => {
    if (stageRef.current !== 5) return;
    setStage(6);
  }, [setStage]);

  const reset = useCallback(() => {
    clearTimers();
    setStage(0);
    setCopied(false);
  }, [clearTimers, setStage]);

  const toggleFail = useCallback(() => {
    if (stageRef.current >= 2) return;
    setSimulateFail(!failRef.current);
  }, [setSimulateFail]);

  const runAll = useCallback(() => {
    clearTimers();
    setStage(0);
    setCopied(false);
    schedule(250, createTask);
    schedule(900, runAgent);
    schedule(2900, verify);
    schedule(5100, () => {
      if (!failRef.current) unlock();
    });
  }, [clearTimers, setStage, schedule, createTask, runAgent, verify, unlock]);

  const copyBundle = useCallback(() => {
    if (stageRef.current < 5) return;
    try {
      navigator.clipboard.writeText(JSON.stringify(PROOF_BUNDLE, null, 2));
    } catch {
      // clipboard unavailable, ignore
    }
    setCopied(true);
    schedule(1800, () => setCopied(false));
  }, [schedule]);

  const steps = computeSteps(stage);
  const variants = computeButtonVariants(stage);
  const labels = computeButtonLabels(stage);
  const output = computeOutput(stage);
  const hashes = computeHashes(stage);
  const failLocked = stage >= 2;

  const buttons = [
    { n: "01", label: labels.b1, variant: variants.b1, onClick: createTask },
    { n: "02", label: labels.b2, variant: variants.b2, onClick: runAgent },
    { n: "03", label: labels.b3, variant: variants.b3, onClick: verify },
    { n: "04", label: labels.b4, variant: variants.b4, onClick: unlock },
  ];

  return (
    <div className={styles.page}>
      <AppNav />

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
              <button className={styles.btnRunAll} onClick={runAll}>
                Run full demo
              </button>
              <button className={styles.btnReset} onClick={reset}>
                Reset
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.workspaceWrap}>
        <div className={styles.workspaceGrid}>
          <TaskForm buttons={buttons} simulateFail={simulateFail} failLocked={failLocked} onToggleFail={toggleFail} />
          <LiveProofRail steps={steps} />
        </div>

        <div className={styles.outputGrid}>
          <VerifiedOutputPanel
            outVisible={output.outVisible}
            badge={output.badge}
            color={output.color}
            riskScore={output.riskScore}
            decision={output.decision}
            reason={output.reason}
            flags={output.flags}
            noFlags={output.noFlags}
            flagsEmptyText={output.flagsEmptyText}
          />
          <ProofHashesPanel
            outVisible={output.outVisible}
            outputHash={hashes.outputHash}
            outputHashColor={hashes.outputHashColor}
            wasmHash={hashes.wasmHash}
            wasmColor={hashes.wasmColor}
            attHash={hashes.attHash}
            attColor={hashes.attColor}
            anchHash={hashes.anchHash}
            anchColor={hashes.anchColor}
            paymentState={hashes.paymentState}
            paymentStateColor={hashes.paymentStateColor}
            hasProof={hashes.hasProof}
            copyLabel={copied ? "Copied" : "Copy proof bundle"}
            onCopy={copyBundle}
          />
        </div>
      </div>
    </div>
  );
}
