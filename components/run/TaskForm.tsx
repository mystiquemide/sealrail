import type { ButtonVariant } from "./run-state";
import { BUTTON_VARIANT_STYLE } from "./run-state";
import styles from "./Run.module.css";

type StageButtonProps = {
  n: string;
  label: string;
  variant: ButtonVariant;
  onClick: () => void;
};

function StageButton({ n, label, variant, onClick }: StageButtonProps) {
  const v = BUTTON_VARIANT_STYLE[variant];
  return (
    <button
      onClick={onClick}
      className={styles.stageButton}
      style={{ background: v.background, color: v.color, borderColor: v.borderColor, opacity: v.opacity, cursor: v.cursor }}
    >
      <span className={styles.stageButtonNum}>{n}</span>
      {label}
    </button>
  );
}

type TaskFormProps = {
  buttons: { n: string; label: string; variant: ButtonVariant; onClick: () => void }[];
  simulateFail: boolean;
  failLocked: boolean;
  onToggleFail: () => void;
};

export function TaskForm({ buttons, simulateFail, failLocked, onToggleFail }: TaskFormProps) {
  return (
    <div className={styles.panel} style={{ flex: "1 1 380px" }}>
      <div className={styles.panelLabel}>Task input</div>
      <div className={styles.formGrid}>
        <div>
          <label className={styles.formLabel}>Invoice ID</label>
          <input value="INV-1024" readOnly className={styles.formInputMono} />
        </div>
        <div>
          <label className={styles.formLabel}>Amount</label>
          <input value="12,400 USD" readOnly className={styles.formInput} />
        </div>
        <div>
          <label className={styles.formLabel}>Vendor</label>
          <input value="Northwind Supply" readOnly className={styles.formInput} />
        </div>
        <div>
          <label className={styles.formLabel}>Buyer</label>
          <input value="Atlas Retail" readOnly className={styles.formInput} />
        </div>
        <div>
          <label className={styles.formLabel}>Due date</label>
          <input value="2026-07-30" readOnly className={styles.formInputMono} />
        </div>
        <div>
          <label className={styles.formLabel}>Terms</label>
          <input value="Net 30" readOnly className={styles.formInput} />
        </div>
        <div className={styles.formFieldFull}>
          <label className={styles.formLabel}>Notes</label>
          <textarea
            readOnly
            rows={2}
            className={styles.formTextarea}
            value="Recurring vendor. Due-date variance flagged on prior cycle."
          />
        </div>
      </div>

      <div className={styles.stageButtons}>
        {buttons.map((b) => (
          <StageButton key={b.n} n={b.n} label={b.label} variant={b.variant} onClick={b.onClick} />
        ))}
      </div>

      <label className={styles.failRow} style={{ cursor: failLocked ? "not-allowed" : "pointer" }}>
        <input
          type="checkbox"
          checked={simulateFail}
          disabled={failLocked}
          onChange={onToggleFail}
          className={styles.failCheckbox}
        />
        Simulate a failed proof
      </label>
    </div>
  );
}
