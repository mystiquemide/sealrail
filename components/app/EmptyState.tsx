import Link from "next/link";
import styles from "./EmptyState.module.css";

type EmptyStateProps = {
  title: string;
  body: string;
  actionLabel?: string;
  actionHref?: string;
  error?: boolean;
};

export function EmptyState({ title, body, actionLabel, actionHref, error }: EmptyStateProps) {
  return (
    <div className={styles.block}>
      {error ? (
        <div className={styles.errorTag}>
          <span className={styles.errorDot} />
          Error loading data
        </div>
      ) : null}
      <div className={styles.title}>{title}</div>
      <p className={styles.body}>{body}</p>
      {actionLabel && actionHref ? (
        <Link href={actionHref} className={styles.action}>
          {actionLabel}
        </Link>
      ) : null}
    </div>
  );
}
