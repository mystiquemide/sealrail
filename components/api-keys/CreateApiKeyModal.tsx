import { ALL_SCOPES } from "./api-keys-types";
import styles from "./ApiKeys.module.css";

type CreateApiKeyModalProps = {
  stage: "form" | "secret";
  newKeyName: string;
  selectedScopes: string[];
  validationMessage: string;
  statusMessage?: string;
  generatedSecret: string;
  copyLabel: string;
  onNameChange: (value: string) => void;
  onToggleScope: (scope: string) => void;
  onCreate: () => void;
  onCopySecret: () => void;
  onClose: () => void;
};

export function CreateApiKeyModal({
  stage,
  newKeyName,
  selectedScopes,
  validationMessage,
  statusMessage,
  generatedSecret,
  copyLabel,
  onNameChange,
  onToggleScope,
  onCreate,
  onCopySecret,
  onClose,
}: CreateApiKeyModalProps) {
  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalCard}>
        {stage === "form" ? (
          <>
            <div className={styles.modalLabel}>Create key</div>
            <div className={styles.formField}>
              <label className={styles.formLabel}>Name</label>
              <input
                value={newKeyName}
                onChange={(e) => onNameChange(e.target.value)}
                placeholder="e.g. Backend runner"
                className={styles.formInput}
              />
            </div>
            <div className={styles.formField}>
              <label className={styles.formLabelSpaced}>Scopes</label>
              <div className={styles.scopeList}>
                {ALL_SCOPES.map((scope) => (
                  <label key={scope} className={styles.scopeRow}>
                    <input
                      type="checkbox"
                      checked={selectedScopes.includes(scope)}
                      onChange={() => onToggleScope(scope)}
                      className={styles.scopeCheckbox}
                    />
                    <span className={styles.scopeLabel}>{scope}</span>
                  </label>
                ))}
              </div>
            </div>

            {statusMessage ? <div className={styles.modalStatusMessage}>{statusMessage}</div> : null}
            {!statusMessage && validationMessage ? (
              <div className={styles.modalValidationError}>{validationMessage}</div>
            ) : null}

            <div className={styles.modalActions}>
              <button onClick={onCreate} disabled={Boolean(statusMessage)} className={styles.modalPrimaryButton}>
                Create key
              </button>
              <button onClick={onClose} className={styles.modalSecondaryButton}>
                Cancel
              </button>
            </div>
          </>
        ) : (
          <>
            <div className={styles.shownOnceTag}>
              <span className={styles.shownOnceDot} />
              Shown once
            </div>
            <p className={styles.shownOnceBody}>
              Copy this secret now. It will not be shown again and only the prefix is stored.
            </p>
            <div className={styles.secretBox}>{generatedSecret}</div>
            <div className={styles.modalActions}>
              <button onClick={onCopySecret} className={styles.modalPrimaryButton}>
                {copyLabel}
              </button>
              <button onClick={onClose} className={styles.modalSecondaryButton}>
                Done
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
