"use client";

import { useState } from "react";
import Link from "next/link";
import styles from "./MobileNav.module.css";

export type MobileNavItem = { label: string; href: string };

type MobileNavProps = {
  items: MobileNavItem[];
  theme: "light" | "dark";
};

export function MobileNav({ items, theme }: MobileNavProps) {
  const [open, setOpen] = useState(false);
  const themeClass = theme === "dark" ? styles.dark : styles.light;

  return (
    <div className={`${styles.root} ${themeClass}`}>
      <button
        type="button"
        className={styles.burger}
        aria-expanded={open}
        aria-controls="mobile-menu"
        aria-label={open ? "Close navigation menu" : "Open navigation menu"}
        onClick={() => setOpen((o) => !o)}
      >
        <span className={`${styles.burgerLine} ${open ? styles.lineTopOpen : ""}`} />
        <span className={`${styles.burgerLine} ${open ? styles.lineMidOpen : ""}`} />
        <span className={`${styles.burgerLine} ${open ? styles.lineBotOpen : ""}`} />
      </button>
      {open ? (
        <nav id="mobile-menu" className={styles.menu} aria-label="Mobile">
          {items.map((item) =>
            item.href.startsWith("/") ? (
              <Link key={item.label} href={item.href} className={styles.menuLink} onClick={() => setOpen(false)}>
                {item.label}
              </Link>
            ) : (
              <a key={item.label} href={item.href} className={styles.menuLink} onClick={() => setOpen(false)}>
                {item.label}
              </a>
            )
          )}
        </nav>
      ) : null}
    </div>
  );
}
