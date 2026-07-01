"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AppNav } from "@/components/app/AppNav";
import {
  INITIAL_VERIFIER_FORM_STATE,
  validateVerifierForm,
  type RegisterVerifierFormState,
} from "@/components/register-verifier/register-verifier-constants";
import styles from "@/components/register-verifier/RegisterVerifier.module.css";

export default function RegisterVerifierPage() {
  const [form, setForm] = useState<RegisterVerifierFormState>(INITIAL_VERIFIER_FORM_STATE);
  const [testing, setTesting] = useState(false);
  const [testPassed, setTestPassed] = useState(false);
  const [validationMessage, setValidationMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const testTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (testTimer.current) clearTimeout(testTimer.current);
    },
    []
  );

  function update<K extends keyof RegisterVerifierFormState>(key: K, value: RegisterVerifierFormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  const testVerifier = useCallback(() => {
    setTesting((isTesting) => {
      if (isTesting) return isTesting;
      setTestPassed(false);
      if (testTimer.current) clearTimeout(testTimer.current);
      testTimer.current = setTimeout(() => {
        setTesting(false);
        setTestPassed(true);
      }, 1100);
      return true;
    });
  }, []);

  function publishTemplate() {
    const error = validateVerifierForm(form);
    if (error) {
      setValidationMessage(error);
      return;
    }
    setValidationMessage("");
    setSubmitted(true);
  }

  function resetForm() {
    setForm(INITIAL_VERIFIER_FORM_STATE);
    setTesting(false);
    setTestPassed(false);
    setValidationMessage("");
    setSubmitted(false);
  }

  return (
    <div className={styles.page}>
      <AppNav maxWidth={900} links={[{ label: "Verifiers", href: "/verifiers" }]} cta={null} />

      <div className={styles.wrap}>
        <Link href="/verifiers" className={styles.backLink}>
          <span className={styles.backArrow}>{"<-"}</span>
          Back to verifiers
        </Link>

        <div className={styles.headerBlock}>
          <div className={styles.eyebrow}>Register verifier</div>
          <h1 className={styles.title}>Store verifier schema and WASM hash metadata.</h1>
        </div>

        {!submitted ? (
          <div className={styles.panelsWrap}>
            <div className={styles.panel}>
              <div className={styles.panelLabel}>Verifier details</div>
              <div className={styles.fields}>
                <div>
                  <label className={styles.formLabel}>Name</label>
                  <input
                    value={form.name}
                    onChange={(e) => update("name", e.target.value)}
                    placeholder="e.g. verifyResearchCitation"
                    className={styles.formInputMono}
                  />
                </div>
                <div>
                  <label className={styles.formLabel}>Task type</label>
                  <input
                    value={form.taskType}
                    onChange={(e) => update("taskType", e.target.value)}
                    placeholder="e.g. research verification"
                    className={styles.formInput}
                  />
                </div>
                <div>
                  <label className={styles.formLabel}>Description</label>
                  <textarea
                    value={form.description}
                    onChange={(e) => update("description", e.target.value)}
                    rows={3}
                    placeholder="What this verifier checks and how"
                    className={styles.formTextarea}
                  />
                </div>
                <div>
                  <label className={styles.formLabel}>Owner wallet</label>
                  <input
                    value={form.ownerWallet}
                    onChange={(e) => update("ownerWallet", e.target.value)}
                    placeholder="0x..."
                    className={styles.formInputMono}
                  />
                </div>
              </div>

              <button onClick={testVerifier} className={styles.testButton} style={{ cursor: testing ? "default" : "pointer" }}>
                {testing ? "Testing verifier..." : "Test verifier"}
              </button>

              {testPassed ? (
                <div className={styles.testResult}>
                  <div className={styles.testResultTag}>
                    <span className={styles.testResultDot} />
                    Test passed
                  </div>
                  <div className={styles.testResultOutput}>sample_input -&gt; success: true</div>
                </div>
              ) : null}
            </div>

            <div className={styles.panel}>
              <div className={styles.panelLabel}>Schema and artifact</div>
              <div className={styles.fields}>
                <div>
                  <label className={styles.formLabel}>Input schema</label>
                  <input
                    value={form.inputSchema}
                    onChange={(e) => update("inputSchema", e.target.value)}
                    placeholder="e.g. citation_claim.json"
                    className={styles.formInputMono}
                  />
                </div>
                <div>
                  <label className={styles.formLabel}>Output schema</label>
                  <input
                    value={form.outputSchema}
                    onChange={(e) => update("outputSchema", e.target.value)}
                    placeholder="e.g. citation_result.json"
                    className={styles.formInputMono}
                  />
                </div>
                <div>
                  <label className={styles.formLabel}>WASM hash</label>
                  <input
                    value={form.wasmHash}
                    onChange={(e) => update("wasmHash", e.target.value)}
                    placeholder="e.g. 4a2c...91ef"
                    className={styles.formInputMono}
                  />
                </div>
                <div>
                  <label className={styles.formLabel}>Mode support</label>
                  <select value={form.mode} onChange={(e) => update("mode", e.target.value)} className={styles.formSelect}>
                    <option value="TEE Verification Mode">TEE Verification Mode</option>
                    <option value="TEE Verification">TEE Verification</option>
                  </select>
                </div>
              </div>

              <button onClick={publishTemplate} className={styles.publishButton}>
                Publish template
              </button>

              {validationMessage ? <div className={styles.validationError}>{validationMessage}</div> : null}
            </div>
          </div>
        ) : (
          <div className={styles.successCard}>
            <div className={styles.successTag}>
              <span className={styles.successDot} />
              Verifier template published
            </div>
            <div className={styles.successName}>{form.name}</div>
            <div className={styles.successRows}>
              <div className={styles.successRow}>
                <span className={styles.successRowLabel}>Task type</span>
                <span className={styles.successRowValue}>{form.taskType}</span>
              </div>
              <div className={styles.successRow}>
                <span className={styles.successRowLabel}>WASM hash</span>
                <span className={styles.successRowValueMono}>{form.wasmHash}</span>
              </div>
              <div className={styles.successRow}>
                <span className={styles.successRowLabel}>Mode</span>
                <span className={styles.successRowValueMode}>{form.mode}</span>
              </div>
            </div>
            <div className={styles.successActions}>
              <Link href="/verifiers" className={styles.btnPrimary}>
                Back to verifiers
              </Link>
              <button onClick={resetForm} className={styles.btnGhost}>
                Register another
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
