import styles from "@/components/docs-legal/DocsLegal.module.css";
import { SIDEBAR_LINKS } from "./docs-content";

export function DocsSidebar() {
  return (
    <nav className={styles.sidebar}>
      <div className={styles.sidebarLabel}>On this page</div>
      {SIDEBAR_LINKS.map((link) => (
        <a key={link.href} href={link.href} className={styles.sidebarLink}>
          {link.label}
        </a>
      ))}
    </nav>
  );
}
