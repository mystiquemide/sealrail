"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AppNav } from "@/components/app/AppNav";
import {
  CATEGORY_OPTIONS,
  EXECUTION_TYPE_LABELS,
  EXECUTION_TYPE_OPTIONS,
  INITIAL_FORM_STATE,
  outputSchemaSummary,
  validateForm,
  type RegisterAgentFormState,
} from "@/components/owner-register-agent/register-agent-constants";
import { ApiClientError, createAgent, createMarketplaceListing, listVerifiers } from "@/lib/api";
import { ensureSession } from "@/lib/session";
import type { AgentCategory, VerifierTemplate } from "@/lib/api-types";
import styles from "@/components/owner-register-agent/RegisterAgent.module.css";

export default function RegisterAgentPage() {
  const [form, setForm] = useState<RegisterAgentFormState>(INITIAL_FORM_STATE);
  const [validationMessage, setValidationMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [ownerAddress, setOwnerAddress] = useState("");
  const [verifiers, setVerifiers] = useState<VerifierTemplate[] | null>(null);

  useEffect(() => {
    ensureSession().then((s) => setOwnerAddress(s.ownerAddress));
    listVerifiers({ status: "active" }).then(({ verifiers }) => {
      setVerifiers(verifiers);
      if (verifiers.length > 0) setForm((f) => ({ ...f, verifier: verifiers[0].id }));
    });
  }, []);

  function update<K extends keyof RegisterAgentFormState>(key: K, value: RegisterAgentFormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function createAgentSubmit() {
    const error = validateForm(form);
    if (error) {
      setValidationMessage(error);
      return;
    }
    setValidationMessage("");
    setSubmitting(true);
    try {
      const { agent } = await createAgent({
        name: form.name,
        category: form.category.toLowerCase() as AgentCategory,
        description: form.description,
        short_pitch: form.taskType || form.description,
        pricing_model: "fixed",
        base_price: Number(form.price),
        currency: form.currency as "CSPR" | "USD",
        verifier_ids: form.verifier ? [form.verifier] : [],
        supported_task_types: form.taskTypes
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
      });

      if (form.publish && form.verifier) {
        await createMarketplaceListing({
          agent_id: agent.id,
          title: agent.name,
          category: agent.category,
          price_amount: Number(form.price),
          currency: form.currency as "CSPR" | "USD",
          verifier_id: form.verifier,
          summary: form.description,
        }).catch(() => {
          // Agent was created successfully even if listing publish failed; not fatal to this flow.
        });
      }

      setSubmitted(true);
    } catch (err) {
      setValidationMessage(err instanceof ApiClientError ? err.message : "Failed to create agent.");
    } finally {
      setSubmitting(false);
    }
  }

  function resetForm() {
    setForm({ ...INITIAL_FORM_STATE, verifier: verifiers?.[0]?.id ?? "" });
    setValidationMessage("");
    setSubmitted(false);
  }

  const verifierName = verifiers?.find((v) => v.id === form.verifier)?.name ?? form.verifier;

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
                    <p className={styles.fieldNote}>
                      Execution type isn&apos;t part of the current agent record yet — captured here for the roadmap,
                      not persisted server-side.
                    </p>
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
                    <input value={ownerAddress} readOnly className={styles.formInputMono} style={{ opacity: 0.7 }} />
                    <p className={styles.fieldNote}>Determined by your session&apos;s API key identity.</p>
                  </div>
                </div>
              </div>

              <div className={styles.panel}>
                <div className={styles.panelLabel}>Verifier and payment</div>
                <div className={styles.fields}>
                  <div>
                    <label className={styles.formLabel}>Verifier template</label>
                    {verifiers === null ? (
                      <p className={styles.fieldNote}>Loading verifiers...</p>
                    ) : verifiers.length === 0 ? (
                      <p className={styles.fieldNote}>
                        No verifier templates exist yet.{" "}
                        <Link href="/verifiers/new" style={{ textDecoration: "underline" }}>
                          Register one first
                        </Link>
                        .
                      </p>
                    ) : (
                      <select
                        value={form.verifier}
                        onChange={(e) => update("verifier", e.target.value)}
                        className={styles.formSelect}
                      >
                        {verifiers.map((v) => (
                          <option key={v.id} value={v.id}>
                            {v.name}
                          </option>
                        ))}
                      </select>
                    )}
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

            <button onClick={createAgentSubmit} disabled={submitting} className={styles.submitButton}>
              {submitting ? "Creating..." : "Create agent"}
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
                <span className={styles.successRowValue}>{verifierName}</span>
              </div>
              <div className={styles.successRow}>
                <span className={styles.successRowLabel}>Output schema</span>
                <span className={styles.successRowValue} style={{ textAlign: "right", maxWidth: "60%" }}>
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
                  {form.publish ? "Publish attempted" : "Not published"}
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
