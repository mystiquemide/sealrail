import { MODE_OPTIONS, STATUS_OPTIONS } from "./proofs-data";
import styles from "./Proofs.module.css";

type ProofsFilterBarProps = {
  search: string;
  statusFilter: string;
  modeFilter: string;
  onSearchChange: (value: string) => void;
  onStatusChange: (value: string) => void;
  onModeChange: (value: string) => void;
};

export function ProofsFilterBar({
  search,
  statusFilter,
  modeFilter,
  onSearchChange,
  onStatusChange,
  onModeChange,
}: ProofsFilterBarProps) {
  return (
    <div className={styles.filterWrap}>
      <div className={styles.filterBar}>
        <div className={styles.searchWrap}>
          <input
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search task ID"
            className={styles.searchInput}
          />
        </div>
        <div className={styles.filterGroup}>
          <span className={styles.filterLabel}>Status</span>
          <select
            className={styles.filterSelect}
            value={statusFilter}
            onChange={(e) => onStatusChange(e.target.value)}
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>
        <div className={styles.filterGroup}>
          <span className={styles.filterLabel}>Mode</span>
          <select className={styles.filterSelect} value={modeFilter} onChange={(e) => onModeChange(e.target.value)}>
            {MODE_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
