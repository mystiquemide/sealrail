"use client";

import { useEffect, useRef, useState } from "react";
import { AppNav } from "@/components/app/AppNav";
import { ApiKeyTable } from "@/components/api-keys/ApiKeyTable";
import { CreateApiKeyModal } from "@/components/api-keys/CreateApiKeyModal";
import { EmptyState } from "@/components/app/EmptyState";
import { ApiClientError, createApiKey, listApiKeys, revokeApiKey } from "@/lib/api";
import { ensureSession } from "@/lib/session";
import type { ApiKey } from "@/lib/api-types";
import styles from "@/components/api-keys/ApiKeys.module.css";

export default function ApiKeysPage() {
  const [keys, setKeys] = useState<ApiKey[] | null>(null);
  const [error, setError] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [stage, setStage] = useState<"form" | "secret">("form");
  const [newKeyName, setNewKeyName] = useState("");
  const [selectedScopes, setSelectedScopes] = useState<string[]>(["tasks:write"]);
  const [generatedSecret, setGeneratedSecret] = useState("");
  const [validationMessage, setValidationMessage] = useState("");
  const [copied, setCopied] = useState(false);
  const [creating, setCreating] = useState(false);
  const copyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    loadKeys();
    return () => {
      if (copyTimer.current) clearTimeout(copyTimer.current);
    };
  }, []);

  async function loadKeys() {
    try {
      const { keys } = await listApiKeys();
      setKeys(keys);
    } catch {
      setError(true);
    }
  }

  function openModal() {
    setModalOpen(true);
    setStage("form");
    setNewKeyName("");
    setSelectedScopes(["tasks:write"]);
    setValidationMessage("");
  }

  function closeModal() {
    setModalOpen(false);
    loadKeys();
  }

  function toggleScope(scope: string) {
    setSelectedScopes((prev) => (prev.includes(scope) ? prev.filter((s) => s !== scope) : [...prev, scope]));
  }

  async function handleCreateKey() {
    if (!newKeyName.trim()) {
      setValidationMessage("Key name is required.");
      return;
    }
    if (selectedScopes.length === 0) {
      setValidationMessage("Select at least one scope.");
      return;
    }
    setCreating(true);
    setValidationMessage("");
    try {
      const session = await ensureSession();
      const { secret } = await createApiKey({
        name: newKeyName.trim(),
        scopes: selectedScopes,
        owner_address: session.ownerAddress,
      });
      setGeneratedSecret(secret);
      setStage("secret");
    } catch (err) {
      setValidationMessage(err instanceof ApiClientError ? err.message : "Failed to create key.");
    } finally {
      setCreating(false);
    }
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

  async function handleRevoke(id: string) {
    try {
      await revokeApiKey(id);
      loadKeys();
    } catch {
      // Revoke failures surface implicitly: row stays non-revoked and stays clickable to retry.
    }
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

        {error ? (
          <EmptyState error title="Couldn't load API keys" body="The backend at NEXT_PUBLIC_API_URL could not be reached." />
        ) : keys === null ? (
          <p style={{ color: "#8c8c8a", fontSize: 13 }}>Loading...</p>
        ) : (
          <ApiKeyTable keys={keys} onRevoke={handleRevoke} />
        )}

        {modalOpen ? (
          <CreateApiKeyModal
            stage={stage}
            newKeyName={newKeyName}
            selectedScopes={selectedScopes}
            validationMessage={creating ? "Creating..." : validationMessage}
            generatedSecret={generatedSecret}
            copyLabel={copied ? "Copied" : "Copy secret"}
            onNameChange={setNewKeyName}
            onToggleScope={toggleScope}
            onCreate={handleCreateKey}
            onCopySecret={copySecret}
            onClose={closeModal}
          />
        ) : null}
      </div>
    </div>
  );
}
