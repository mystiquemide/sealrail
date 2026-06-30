// ────────────────────────────────────────
// Sealrail Database Connection & Migration
// SQLite via better-sqlite3 — synchronous, fast, zero-config
// ────────────────────────────────────────

import Database from "better-sqlite3";
import { mkdirSync } from "fs";
import { dirname } from "path";
import { config } from "./config.js";
import { SCHEMA } from "./schema.js";

let db: Database.Database | null = null;

/**
 * Get or create the database connection.
 * Runs schema migration on first connect.
 */
export function getDb(): Database.Database {
  if (db) return db;

  // Ensure the data directory exists
  const dbDir = dirname(config.databasePath);
  mkdirSync(dbDir, { recursive: true });

  db = new Database(config.databasePath);

  // Enable WAL mode for better concurrent read performance
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");

  // Run schema migration
  db.exec(SCHEMA);

  return db;
}

/**
 * Close the database connection gracefully.
 */
export function closeDb(): void {
  if (db) {
    db.close();
    db = null;
  }
}

/**
 * Reset database — for testing only.
 * Drops all tables and re-runs schema migration.
 */
export function resetDb(): void {
  const conn = getDb();
  // Get all table names
  const tables = conn
    .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'")
    .all() as { name: string }[];

  conn.exec("PRAGMA foreign_keys = OFF");
  for (const { name } of tables) {
    conn.exec(`DROP TABLE IF EXISTS "${name}"`);
  }
  conn.exec("PRAGMA foreign_keys = ON");

  // Re-run schema
  conn.exec(SCHEMA);
}
