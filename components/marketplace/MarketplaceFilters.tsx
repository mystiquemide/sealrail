import { CATEGORY_OPTIONS, MODE_OPTIONS, STATUS_OPTIONS } from "./marketplace-data";
import styles from "./Marketplace.module.css";

type MarketplaceFiltersProps = {
  categoryFilter: string;
  modeFilter: string;
  statusFilter: string;
  onCategoryChange: (value: string) => void;
  onModeChange: (value: string) => void;
  onStatusChange: (value: string) => void;
};

export function MarketplaceFilters({
  categoryFilter,
  modeFilter,
  statusFilter,
  onCategoryChange,
  onModeChange,
  onStatusChange,
}: MarketplaceFiltersProps) {
  return (
    <div className={styles.filtersWrap}>
      <div className={styles.filtersBar}>
        <div className={styles.filterGroup}>
          <span className={styles.filterLabel}>Category</span>
          <select
            className={styles.filterSelect}
            value={categoryFilter}
            onChange={(e) => onCategoryChange(e.target.value)}
          >
            {CATEGORY_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>
        <div className={styles.filterGroup}>
          <span className={styles.filterLabel}>Proof mode</span>
          <select className={styles.filterSelect} value={modeFilter} onChange={(e) => onModeChange(e.target.value)}>
            {MODE_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
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
      </div>
    </div>
  );
}
