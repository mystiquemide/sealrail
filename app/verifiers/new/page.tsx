"use client";

import { useState } from "react";
import Link from "next/link";
import { AppNav } from "@/components/app/AppNav";
import {
  INITIAL_VERIFIER_FORM_STATE,
  validateVerifierForm,
  type RegisterVerifierFormState,
} from "@/components/register-verifier/register-verifier-constants";
import { ApiClientError, createVerifier, testVerifier } from "@/lib/api";
import styles from "@/components/register-verifier/RegisterVerifier.module.css";

export default function RegisterVerifierPage() {
  const [form, setForm] = useState<RegisterVerifierFormState>(INITIAL_VERIFIER_FORM_STATE);
  const [validationMessage, setValidationMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [createdId, setCreatedId] = useState<string | null>(null);

  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ valid: boolean; [key: string]: unknown } | null>(null);
  const [testError, setTestError] = useState<string | null>(null);

  function update<K extends keyof RegisterVerifierFormState>(key: K, value: RegisterVerifierFormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function publishTemplate() {
    const error = validateVerifierForm(form);
    if (error) {
      setValidationMessage(error);
      return;
    }
    setValidationMessage("");
    setSubmitting(true);
    try {
      const { verifier } = await createVerifier({
        name: form.name,
        task_type: form.taskType,
        wasm_hash: form.wasmHash,
        description: form.description,
        input_schema: form.inputSchema ? { schema: form.inputSchema } : {},
        output_schema: form.outputSchema ? { schema: form.outputSchema } : {},
        mode_support: ["tee_verification_mode"],
        status: "active",
      });
      setCreatedId(verifier.id);
    } catch (err) {
      setValidationMessage(err instanceof ApiClientError ? err.message : "Failed to publish verifier.");
    } finally {
      setSubmitting(false);
    }
  }

  async function runTest() {
    if (!createdId) return;
    setTesting(true);
    setTestError(null);
    try {
      const { result } = await testVerifier(createdId, { sample: true });
      setTestResult(result);
    } catch (err) {
      setTestError(err instanceof ApiClientError ? err.message : "Test failed.");
    } finally {
      setTesting(false);
    }
  }

  function resetForm() {
    setForm(INITIAL_VERIFIER_FORM_STATE);
    setValidationMessage("");
    setCreatedId(null);
    setTesting(false);
    setTestResult(null);
    setTestError(null);
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

        {!createdId ? (
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
                  <p className={styles.fieldNote}>
                    The record is actually owned by your session&apos;s API key identity, not this field — kept here
                    for reference only.
                  </p>
                </div>
              </div>
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

              <button onClick={publishTemplate} disabled={submitting} className={styles.publishButton}>
                {submitting ? "Publishing..." : "Publish template"}
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

            <button onClick={runTest} disabled={testing} className={styles.testButton} style={{ marginTop: 18 }}>
              {testing ? "Testing verifier..." : "Test verifier"}
            </button>

            {testResult ? (
              <div className={styles.testResult}>
                <div
                  className={styles.testResultTag}
                  style={!testResult.valid ? { color: "#F45B45" } : undefined}
                >
                  <span className={styles.testResultDot} style={!testResult.valid ? { background: "#F45B45" } : undefined} />
                  {testResult.valid ? "Test passed" : "Test failed"}
                </div>
                <div className={styles.testResultOutput}>{JSON.stringify(testResult)}</div>
              </div>
            ) : null}
            {testError ? (
              <div className={styles.validationError} style={{ marginTop: 12 }}>
                {testError}
              </div>
            ) : null}

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
