import styles from "@/components/docs-legal/DocsLegal.module.css";
import type { CodeExample } from "./docs-content";

export function CodeBlock({ label, text }: CodeExample) {
  return (
    <div className={styles.codeBlock}>
      {label ? <div className={styles.codeBlockLabel}>{label}</div> : null}
      <pre className={styles.codeBlockText}>{text}</pre>
    </div>
  );
}
