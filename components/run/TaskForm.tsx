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

type FieldSpec = {
  key: keyof TaskFormFields;
  label: string;
  hint: string;
  mono?: boolean;
  fullWidth?: boolean;
  multiline?: boolean;
};

const FIELD_SPECS: FieldSpec[] = [
  { key: "invoiceId", label: "Invoice ID", hint: "Any unique identifier for this invoice.", mono: true },
  { key: "amount", label: "Amount (USD)", hint: "Locked at task creation, released on proof." },
  { key: "vendor", label: "Vendor", hint: "Who is billing." },
  { key: "buyer", label: "Buyer", hint: "Who is paying." },
  { key: "dueDate", label: "Due date", hint: "YYYY-MM-DD.", mono: true },
  { key: "terms", label: "Terms", hint: "Payment terms, e.g. Net 30." },
  { key: "notes", label: "Notes", hint: "Optional context passed to the agent.", fullWidth: true, multiline: true },
];

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
        {FIELD_SPECS.map((spec) => {
          const inputId = `task-${spec.key}`;
          const hintId = `task-${spec.key}-hint`;
          return (
            <div key={spec.key} className={spec.fullWidth ? styles.formFieldFull : undefined}>
              <label htmlFor={inputId} className={styles.formLabel}>
                {spec.label}
              </label>
              {spec.multiline ? (
                <textarea
                  id={inputId}
                  aria-describedby={hintId}
                  value={fields[spec.key]}
                  readOnly={fieldsLocked}
                  rows={2}
                  onChange={(e) => onFieldChange(spec.key, e.target.value)}
                  className={styles.formTextarea}
                />
              ) : (
                <input
                  id={inputId}
                  aria-describedby={hintId}
                  value={fields[spec.key]}
                  readOnly={fieldsLocked}
                  onChange={(e) => onFieldChange(spec.key, e.target.value)}
                  className={spec.mono ? styles.formInputMono : styles.formInput}
                />
              )}
              <p id={hintId} className={styles.formHint}>
                {spec.hint}
              </p>
            </div>
          );
        })}
      </div>

      <div className={styles.stageButtons}>
        {buttons.map((b) => (
          <StageButton key={b.n} n={b.n} label={b.label} variant={b.variant} onClick={b.onClick} />
        ))}
      </div>
    </div>
  );
}
