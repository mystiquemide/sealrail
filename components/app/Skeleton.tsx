import styles from "./Skeleton.module.css";

type SkeletonProps = {
  /** CSS width, e.g. "70%" or 120. Defaults to 100%. */
  width?: string | number;
  /** CSS height, e.g. 12 or "1rem". Defaults to the bar/block default. */
  height?: string | number;
  /** Render a rounded block (card/avatar) instead of a text bar. */
  block?: boolean;
  className?: string;
  style?: React.CSSProperties;
};

/**
 * A single non-interactive shimmer placeholder. It stands in for content that
 * has not loaded yet: visible, but never focusable or editable. Marked
 * aria-hidden so screen readers announce the surrounding "loading" caption
 * instead of empty bars.
 */
export function Skeleton({ width, height, block = false, className, style }: SkeletonProps) {
  return (
    <span
      aria-hidden="true"
      className={`${block ? styles.block : styles.bar} ${className ?? ""}`}
      style={{ width: width ?? undefined, height: height ?? undefined, ...style }}
    />
  );
}
