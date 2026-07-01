"use client";

import { useEffect, useRef, useState } from "react";
import { AppNav } from "@/components/app/AppNav";
import { ApiKeyTable } from "@/components/api-keys/ApiKeyTable";
import { CreateApiKeyModal } from "@/components/api-keys/CreateApiKeyModal";
import { INITIAL_KEYS, generateKeySecret, type ApiKey } from "@/components/api-keys/api-keys-types";
import styles from "@/components/api-keys/ApiKeys.module.css";

export default function ApiKeysPage() {
  const [keys, setKeys] = useState<ApiKey[]>(INITIAL_KEYS);
  const [modalOpen, setModalOpen] = useState(false);
  const [stage, setStage] = useState<"form" | "secret">("form");
  const [newKeyName, setNewKeyName] = useState("");
  const [selectedScopes, setSelectedScopes] = useState<string[]>(["tasks:write"]);
  const [generatedSecret, setGeneratedSecret] = useState("");
  const [validationMessage, setValidationMessage] = useState("");
  const [copied, setCopied] = useState(false);
  const copyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (copyTimer.current) clearTimeout(copyTimer.current);
    },
    []
  );

  function openModal() {
    setModalOpen(true);
    setStage("form");
    setNewKeyName("");
    setSelectedScopes(["tasks:write"]);
    setValidationMessage("");
  }

  function closeModal() {
    setModalOpen(false);
  }

  function toggleScope(scope: string) {
    setSelectedScopes((prev) => (prev.includes(scope) ? prev.filter((s) => s !== scope) : [...prev, scope]));
  }

  function createKey() {
    if (!newKeyName.trim()) {
      setValidationMessage("Key name is required.");
      return;
    }
    if (selectedScopes.length === 0) {
      setValidationMessage("Select at least one scope.");
      return;
    }
    const { prefix, secret } = generateKeySecret();
    const newKey: ApiKey = {
      id: Date.now(),
      name: newKeyName.trim(),
      prefix,
      scopes: [...selectedScopes],
      lastUsed: "Never",
      revoked: false,
    };
    setKeys((prev) => [newKey, ...prev]);
    setGeneratedSecret(secret);
    setStage("secret");
    setValidationMessage("");
  }

  function copySecret() {
    try {
      navigator.clipboard.writeText(generatedSecret);
    } catch {
      // clipboard unavailable, ignore
    }
    setCopied(true);
    if (copyTimer.current) clearTimeout(copyTimer.current);
    copyTimer.current = setTimeout(() => setCopied(false), 1600);
  }

  function revokeKey(id: number) {
    setKeys((prev) => prev.map((k) => (k.id === id ? { ...k, revoked: true } : k)));
  }

  return (
    <div className={styles.page}>
      <AppNav
        active="API keys"
        maxWidth={1080}
        links={[
          { label: "Verifiers", href: "/verifiers" },
          { label: "Proofs", href: "/proofs" },
        ]}
        cta={null}
      />

      <div className={styles.wrap}>
        <div className={styles.headerRow}>
          <div className={styles.headerCopy}>
            <div className={styles.eyebrow}>API keys</div>
            <h1 className={styles.title}>Create scoped keys for task, proof, agent, and workflow APIs.</h1>
          </div>
          <button onClick={openModal} className={styles.btnPrimary}>
            Create key
          </button>
        </div>

        <ApiKeyTable keys={keys} onRevoke={revokeKey} />

        {modalOpen ? (
          <CreateApiKeyModal
            stage={stage}
            newKeyName={newKeyName}
            selectedScopes={selectedScopes}
            validationMessage={validationMessage}
            generatedSecret={generatedSecret}
            copyLabel={copied ? "Copied" : "Copy secret"}
            onNameChange={setNewKeyName}
            onToggleScope={toggleScope}
            onCreate={createKey}
            onCopySecret={copySecret}
            onClose={closeModal}
          />
        ) : null}
      </div>
    </div>
  );
}
