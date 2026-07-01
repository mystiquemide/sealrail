import type { ApiKey } from "./api-keys-types";
import styles from "./ApiKeys.module.css";

type ApiKeyTableProps = {
  keys: ApiKey[];
  onRevoke: (id: number) => void;
};

export function ApiKeyTable({ keys, onRevoke }: ApiKeyTableProps) {
  return (
    <>
      <div className={styles.table}>
        <div className={`${styles.tableHead} ${styles.gridCols}`}>
          <span>Name</span>
          <span>Prefix</span>
          <span>Scopes</span>
          <span>Last used</span>
          <span style={{ textAlign: "right" }}>Action</span>
        </div>
        {keys.map((k) => (
          <div key={k.id} className={`${styles.row} ${styles.gridCols}`} style={{ opacity: k.revoked ? 0.45 : 1 }}>
            <span className={styles.name}>{k.name}</span>
            <span className={styles.prefix}>{k.prefix}</span>
            <span className={styles.scopes}>{k.scopes.join(" ")}</span>
            <span className={styles.lastUsed}>{k.lastUsed}</span>
            <button
              onClick={() => {
                if (!k.revoked) onRevoke(k.id);
              }}
              disabled={k.revoked}
              className={styles.revokeButton}
              style={{ color: k.revoked ? "#6E6E6C" : "#A8A8A6", cursor: k.revoked ? "default" : "pointer" }}
            >
              {k.revoked ? "Revoked" : "Revoke"}
            </button>
          </div>
        ))}
      </div>
      <p className={styles.footNote}>
        Only the key prefix is stored and displayed. Full secrets are shown once at creation and never persisted in
        plain text.
      </p>
    </>
  );
}
