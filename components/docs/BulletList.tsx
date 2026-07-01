import styles from "@/components/docs-legal/DocsLegal.module.css";

type BulletListProps = { items: string[]; dotColor?: string };

export function BulletList({ items, dotColor = "#9A968E" }: BulletListProps) {
  return (
    <div className={styles.bulletList}>
      {items.map((item) => (
        <div key={item} className={styles.bulletItem}>
          <span className={styles.bulletDot} style={{ background: dotColor }} />
          <span className={styles.bulletText}>{item}</span>
        </div>
      ))}
    </div>
  );
}
