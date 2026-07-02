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
      disabled={variant === "off" || variant === "busy" || variant === "done"}
      className={styles.stageButton}
      style={{ background: v.background, color: v.color, borderColor: v.borderColor, opacity: v.opacity, cursor: v.cursor }}
    >
      <span className={styles.stageButtonNum}>{n}</span>
      {label}
    </button>
  );
}

export type TaskFormFields = {
  invoiceId: string;
  amount: string;
  vendor: string;
  buyer: string;
  dueDate: string;
  terms: string;
  notes: string;
};

type TaskFormProps = {
  fields: TaskFormFields;
  onFieldChange: <K extends keyof TaskFormFields>(key: K, value: string) => void;
  fieldsLocked: boolean;
  buttons: { n: string; label: string; variant: ButtonVariant; onClick: () => void }[];
};

export function TaskForm({ fields, onFieldChange, fieldsLocked, buttons }: TaskFormProps) {
  return (
    <div className={styles.panel} style={{ flex: "1 1 380px" }}>
      <div className={styles.panelLabel}>Task input</div>
      <div className={styles.formGrid}>
        <div>
          <label className={styles.formLabel}>Invoice ID</label>
          <input
            value={fields.invoiceId}
            readOnly={fieldsLocked}
            onChange={(e) => onFieldChange("invoiceId", e.target.value)}
            className={styles.formInputMono}
          />
        </div>
        <div>
          <label className={styles.formLabel}>Amount (USD)</label>
          <input
            value={fields.amount}
            readOnly={fieldsLocked}
            onChange={(e) => onFieldChange("amount", e.target.value)}
            className={styles.formInput}
          />
        </div>
        <div>
          <label className={styles.formLabel}>Vendor</label>
          <input
            value={fields.vendor}
            readOnly={fieldsLocked}
            onChange={(e) => onFieldChange("vendor", e.target.value)}
            className={styles.formInput}
          />
        </div>
        <div>
          <label className={styles.formLabel}>Buyer</label>
          <input
            value={fields.buyer}
            readOnly={fieldsLocked}
            onChange={(e) => onFieldChange("buyer", e.target.value)}
            className={styles.formInput}
          />
        </div>
        <div>
          <label className={styles.formLabel}>Due date</label>
          <input
            value={fields.dueDate}
            readOnly={fieldsLocked}
            onChange={(e) => onFieldChange("dueDate", e.target.value)}
            className={styles.formInputMono}
          />
        </div>
        <div>
          <label className={styles.formLabel}>Terms</label>
          <input
            value={fields.terms}
            readOnly={fieldsLocked}
            onChange={(e) => onFieldChange("terms", e.target.value)}
            className={styles.formInput}
          />
        </div>
        <div className={styles.formFieldFull}>
          <label className={styles.formLabel}>Notes</label>
          <textarea
            readOnly={fieldsLocked}
            rows={2}
            onChange={(e) => onFieldChange("notes", e.target.value)}
            className={styles.formTextarea}
            value={fields.notes}
          />
        </div>
      </div>

      <div className={styles.stageButtons}>
        {buttons.map((b) => (
          <StageButton key={b.n} n={b.n} label={b.label} variant={b.variant} onClick={b.onClick} />
        ))}
      </div>
    </div>
  );
}
