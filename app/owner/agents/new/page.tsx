"use client";

import { useState } from "react";
import Link from "next/link";
import { AppNav } from "@/components/app/AppNav";
import {
  CATEGORY_OPTIONS,
  EXECUTION_TYPE_LABELS,
  EXECUTION_TYPE_OPTIONS,
  INITIAL_FORM_STATE,
  VERIFIER_OPTIONS,
  outputSchemaSummary,
  validateForm,
  type RegisterAgentFormState,
} from "@/components/owner-register-agent/register-agent-constants";
import styles from "@/components/owner-register-agent/RegisterAgent.module.css";

export default function RegisterAgentPage() {
  const [form, setForm] = useState<RegisterAgentFormState>(INITIAL_FORM_STATE);
  const [validationMessage, setValidationMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);

  function update<K extends keyof RegisterAgentFormState>(key: K, value: RegisterAgentFormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function createAgent() {
    const error = validateForm(form);
    if (error) {
      setValidationMessage(error);
      return;
    }
    setValidationMessage("");
    setSubmitted(true);
  }

  function resetForm() {
    setForm(INITIAL_FORM_STATE);
    setValidationMessage("");
    setSubmitted(false);
  }

  return (
    <div className={styles.page}>
      <AppNav
        maxWidth={900}
        links={[
          { label: "Owner", href: "/owner" },
          { label: "Agents", href: "/agents" },
        ]}
        cta={null}
      />

      <div className={styles.wrap}>
        <Link href="/owner" className={styles.backLink}>
          <span className={styles.backArrow}>{"<-"}</span>
          Back to owner dashboard
        </Link>

        <div className={styles.headerBlock}>
          <div className={styles.eyebrow}>Register agent</div>
          <h1 className={styles.title}>Create an agent that can receive payment-backed tasks.</h1>
        </div>

        {!submitted ? (
          <>
            <div className={styles.panelsWrap}>
              <div className={styles.panel}>
                <div className={styles.panelLabel}>Agent details</div>
                <div className={styles.fields}>
                  <div>
                    <label className={styles.formLabel}>Agent name</label>
                    <input
                      value={form.name}
                      onChange={(e) => update("name", e.target.value)}
                      placeholder="e.g. Invoice Risk Agent"
                      className={styles.formInput}
                    />
                  </div>
                  <div>
                    <label className={styles.formLabel}>Category</label>
                    <select
                      value={form.category}
                      onChange={(e) => update("category", e.target.value)}
                      className={styles.formSelect}
                    >
                      {CATEGORY_OPTIONS.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className={styles.formLabel}>Description</label>
                    <textarea
                      value={form.description}
                      onChange={(e) => update("description", e.target.value)}
                      rows={3}
                      placeholder="What this agent verifies and returns"
                      className={styles.formTextarea}
                    />
                  </div>
                  <div>
                    <label className={styles.formLabel}>Execution type</label>
                    <div className={styles.execTypeRow}>
                      {EXECUTION_TYPE_OPTIONS.map((opt) => {
                        const active = form.executionType === opt;
                        return (
                          <button
                            key={opt}
                            type="button"
                            onClick={() => update("executionType", opt)}
                            className={styles.execTypeButton}
                            style={{
                              background: active ? "#FFFFFF" : "transparent",
                              color: active ? "#080808" : "#B4B4B2",
                              borderColor: active ? "#FFFFFF" : "rgba(255,255,255,0.16)",
                            }}
                          >
                            {EXECUTION_TYPE_LABELS[opt]}
                          </button>
                        );
                      })}
                    </div>
                    {form.executionType === "webhook" ? (
                      <input
                        value={form.webhookUrl}
                        onChange={(e) => update("webhookUrl", e.target.value)}
                        placeholder="https://your-endpoint.example.com/invoke"
                        className={styles.execTypeConditionalInput}
                      />
                    ) : null}
                    {form.executionType === "manual" ? (
                      <input
                        value={form.submitterId}
                        onChange={(e) => update("submitterId", e.target.value)}
                        placeholder="Submitter identifier or API key label"
                        className={styles.execTypeConditionalInput}
                      />
                    ) : null}
                  </div>
                  <div>
                    <label className={styles.formLabel}>Supported task types</label>
                    <input
                      value={form.taskTypes}
                      onChange={(e) => update("taskTypes", e.target.value)}
                      placeholder="e.g. invoice_risk_check"
                      className={styles.formInputMono}
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
              </div>

              <div className={styles.panel}>
                <div className={styles.panelLabel}>Verifier and payment</div>
                <div className={styles.fields}>
                  <div>
                    <label className={styles.formLabel}>Verifier template</label>
                    <select
                      value={form.verifier}
                      onChange={(e) => update("verifier", e.target.value)}
                      className={styles.formSelect}
                    >
                      {VERIFIER_OPTIONS.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                    <p className={styles.fieldNote}>
                      Only verifier templates already registered as VerifierTemplate records can be selected.
                    </p>
                  </div>
                  <div>
                    <label className={styles.formLabel}>Task type</label>
                    <input
                      value={form.taskType}
                      onChange={(e) => update("taskType", e.target.value)}
                      placeholder="e.g. RWA invoice verification"
                      className={styles.formInput}
                    />
                  </div>
                  <div>
                    <label className={styles.formLabel}>Output schema</label>
                    <textarea
                      value={form.outputSchema}
                      onChange={(e) => update("outputSchema", e.target.value)}
                      rows={2}
                      placeholder='{ "decision": "string", "risk_score": "number" }'
                      className={styles.formTextarea}
                      style={{ fontFamily: "var(--font-mono)", fontSize: "12.5px" }}
                    />
                  </div>
                  <div className={styles.fieldRowPair}>
                    <div>
                      <label className={styles.formLabel}>Price amount</label>
                      <input
                        value={form.price}
                        onChange={(e) => update("price", e.target.value)}
                        placeholder="4"
                        className={styles.formInputMono}
                      />
                    </div>
                    <div>
                      <label className={styles.formLabel}>Currency</label>
                      <select
                        value={form.currency}
                        onChange={(e) => update("currency", e.target.value)}
                        className={styles.formSelect}
                      >
                        <option value="CSPR">CSPR</option>
                        <option value="USD">USD</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className={styles.formLabel}>Recipient address</label>
                    <input
                      value={form.recipient}
                      onChange={(e) => update("recipient", e.target.value)}
                      placeholder="0x..."
                      className={styles.formInputMono}
                    />
                  </div>
                  <label className={styles.checkboxRow}>
                    <input
                      type="checkbox"
                      checked={form.publish}
                      onChange={(e) => update("publish", e.target.checked)}
                      className={styles.checkbox}
                    />
                    Publish listing to marketplace
                  </label>
                </div>
              </div>
            </div>

            {validationMessage ? <div className={styles.validationError}>{validationMessage}</div> : null}

            <button onClick={createAgent} className={styles.submitButton}>
              Create agent
            </button>
          </>
        ) : (
          <div className={styles.successCard}>
            <div className={styles.successTag}>
              <span className={styles.successDot} />
              Agent record created
            </div>
            <div className={styles.successName}>{form.name}</div>
            <div className={styles.successRows}>
              <div className={styles.successRow}>
                <span className={styles.successRowLabel}>Execution type</span>
                <span className={styles.successRowValuePlain}>{EXECUTION_TYPE_LABELS[form.executionType]}</span>
              </div>
              <div className={styles.successRow}>
                <span className={styles.successRowLabel}>Verifier</span>
                <span className={styles.successRowValue}>{form.verifier}</span>
              </div>
              <div className={styles.successRow}>
                <span className={styles.successRowLabel}>Output schema</span>
                <span
                  className={styles.successRowValue}
                  style={{ textAlign: "right", maxWidth: "60%" }}
                >
                  {outputSchemaSummary(form.outputSchema)}
                </span>
              </div>
              <div className={styles.successRow}>
                <span className={styles.successRowLabel}>Price</span>
                <span className={styles.successRowValuePlain}>
                  {form.price} {form.currency}
                </span>
              </div>
              <div className={styles.successRow}>
                <span className={styles.successRowLabel}>Marketplace listing</span>
                <span className={styles.listingTag} style={{ color: form.publish ? "#64D96B" : "#6E6E6C" }}>
                  <span className={styles.listingDot} style={{ background: form.publish ? "#64D96B" : "#6E6E6C" }} />
                  {form.publish ? "Published" : "Not published"}
                </span>
              </div>
            </div>
            <div className={styles.successActions}>
              <Link href="/owner" className={styles.btnPrimary}>
                Back to owner dashboard
              </Link>
              <button onClick={resetForm} className={styles.btnGhost}>
                Register another agent
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
