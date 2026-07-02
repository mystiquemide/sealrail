// ────────────────────────────────────────
// Sealrail Verifier Template Service
// Phase L: L1 CRUD, L2 WASM hash registration,
// L3 Test-verifier action
// ────────────────────────────────────────

import { randomUUID, createHash } from "crypto";
import { getDb } from "../db.js";
import type { VerifierTemplate, ProofMode } from "../types.js";

// ── Row types for DB queries ──────────────

interface VerifierRow {
  id: string;
  owner_address: string;
  name: string;
  slug: string;
  description: string;
  task_type: string;
  input_schema: string;
  output_schema: string;
  wasm_hash: string;
  wasm_file_url: string | null;
  mode_support: string;
  status: string;
  created_at: string;
  updated_at: string;
}

// ── WASM hash utilities ──────────────────

/**
 * Generate a SHA-256 hex hash of raw WASM bytes (Buffer).
 * Returns a 64-character lowercase hex string.
 */
export function hashWasmBytes(wasmBytes: Buffer): string {
  return createHash("sha256").update(wasmBytes).digest("hex");
}

/**
 * Validate a hex-encoded hash string (SHA-256 compatible).
 * Accepts 64-char hex strings (SHA-256) or 128-char (SHA3-512).
 */
export function validateWasmHash(hash: string): boolean {
  if (typeof hash !== "string" || hash.length === 0) return false;
  // Must be all lowercase hex
  if (!/^[0-9a-f]+$/.test(hash)) return false;
  // Accept SHA-256 (64) or SHA3-512 (128)
  return hash.length === 64 || hash.length === 128;
}

// ── Schema validation ─────────────────────

/**
 * Validate that a value is a parseable JSON object.
 * Returns the parsed object or throws.
 */
function validateSchemaObject(
  value: unknown,
  fieldName: string,
): Record<string, unknown> {
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
        throw new Error(`INVALID_${fieldName}: ${fieldName} must be a JSON object`);
      }
      return parsed as Record<string, unknown>;
    } catch {
      throw new Error(`INVALID_${fieldName}: ${fieldName} must be valid JSON`);
    }
  }

  if (typeof value === "object" && value !== null && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }

  throw new Error(`INVALID_${fieldName}: ${fieldName} must be a JSON object`);
}

// ── Slug generation ───────────────────────

/**
 * Generate a URL-safe slug from a name.
 */
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
}

// ── Row mapping ───────────────────────────

function parseModeSupport(raw: string): ProofMode[] {
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.filter(
        (m): m is ProofMode => m === "tee_verification_mode" || m === "hosted_tee",
      );
    }
  } catch {
    // fall through
  }
  return ["tee_verification_mode"];
}

function parseJsonField(raw: string): Record<string, unknown> {
  try {
    const parsed = JSON.parse(raw);
    if (typeof parsed === "object" && parsed !== null && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>;
    }
  } catch {
    // fall through
  }
  return {};
}

function rowToVerifier(row: VerifierRow): VerifierTemplate {
  return {
    id: row.id,
    owner_address: row.owner_address,
    name: row.name,
    slug: row.slug,
    description: row.description,
    task_type: row.task_type,
    input_schema: parseJsonField(row.input_schema),
    output_schema: parseJsonField(row.output_schema),
    wasm_hash: row.wasm_hash,
    wasm_file_url: row.wasm_file_url,
    mode_support: parseModeSupport(row.mode_support),
    status: row.status as VerifierTemplate["status"],
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

// ── Internal lookup ───────────────────────

function getVerifierRowById(id: string): VerifierRow | undefined {
  const db = getDb();
  return db
    .prepare("SELECT * FROM verifier_templates WHERE id = ?")
    .get(id) as VerifierRow | undefined;
}

function getVerifierRowBySlug(slug: string): VerifierRow | undefined {
  const db = getDb();
  return db
    .prepare("SELECT * FROM verifier_templates WHERE slug = ?")
    .get(slug) as VerifierRow | undefined;
}

// ── L1: CRUD Operations ───────────────────

export interface CreateVerifierParams {
  ownerAddress: string;
  name: string;
  description?: string;
  taskType: string;
  inputSchema?: Record<string, unknown> | string;
  outputSchema?: Record<string, unknown> | string;
  wasmHash: string;
  wasmFileUrl?: string;
  modeSupport?: ProofMode[];
  status?: "draft" | "active";
}

/**
 * Register a new verifier template.
 * Validates schemas, generates slug, validates wasm_hash.
 */
export function createVerifier(params: CreateVerifierParams): VerifierTemplate {
  const db = getDb();

  // Validate name
  if (!params.name || params.name.trim().length === 0) {
    throw new Error("INVALID_NAME: Verifier name must not be empty");
  }

  // Validate and normalize schemas
  const inputSchema = validateSchemaObject(
    params.inputSchema ?? {},
    "INPUT_SCHEMA",
  );
  const outputSchema = validateSchemaObject(
    params.outputSchema ?? {},
    "OUTPUT_SCHEMA",
  );

  // Validate WASM hash
  if (!params.wasmHash || !validateWasmHash(params.wasmHash)) {
    throw new Error(
      "INVALID_WASM_HASH: wasm_hash must be a 64-char SHA-256 or 128-char SHA3 hex string",
    );
  }

  // Generate slug and check uniqueness
  const slug = generateSlug(params.name);
  if (!slug) {
    throw new Error("INVALID_NAME: Could not generate a valid slug from the name");
  }

  const existingBySlug = getVerifierRowBySlug(slug);
  if (existingBySlug) {
    throw new Error(`DUPLICATE_SLUG: A verifier with slug '${slug}' already exists`);
  }

  // Validate task type
  if (!params.taskType || params.taskType.trim().length === 0) {
    throw new Error("INVALID_TASK_TYPE: Task type must not be empty");
  }

  // Normalize mode support
  const modeSupport = params.modeSupport ?? ["tee_verification_mode"];
  if (
    !Array.isArray(modeSupport) ||
    modeSupport.length === 0 ||
    modeSupport.some((m) => m !== "tee_verification_mode" && m !== "hosted_tee")
  ) {
    throw new Error(
      "INVALID_MODE_SUPPORT: mode_support must be a non-empty array of valid modes",
    );
  }

  const id = randomUUID();
  const now = new Date().toISOString();
  const status = params.status ?? "draft";

  db.prepare(`
    INSERT INTO verifier_templates (id, owner_address, name, slug, description, task_type, input_schema, output_schema, wasm_hash, wasm_file_url, mode_support, status, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    params.ownerAddress,
    params.name.trim(),
    slug,
    params.description?.trim() ?? "",
    params.taskType.trim(),
    JSON.stringify(inputSchema),
    JSON.stringify(outputSchema),
    params.wasmHash,
    params.wasmFileUrl ?? null,
    JSON.stringify(modeSupport),
    status,
    now,
    now,
  );

  const row = getVerifierRowById(id);
  if (!row) {
    throw new Error("CREATE_FAILED: Verifier was created but could not be retrieved");
  }

  return rowToVerifier(row);
}

/**
 * Get a single verifier template by ID.
 */
export function getVerifier(verifierId: string): VerifierTemplate | null {
  const row = getVerifierRowById(verifierId);
  if (!row) return null;
  return rowToVerifier(row);
}

export interface ListVerifiersFilters {
  status?: string;
  taskType?: string;
  ownerAddress?: string;
}

/**
 * List verifier templates with optional filters.
 */
export function listVerifiers(filters: ListVerifiersFilters = {}): VerifierTemplate[] {
  const db = getDb();

  const conditions: string[] = [];
  const params: unknown[] = [];

  if (filters.status) {
    conditions.push("status = ?");
    params.push(filters.status);
  }

  if (filters.taskType) {
    conditions.push("task_type = ?");
    params.push(filters.taskType);
  }

  if (filters.ownerAddress) {
    conditions.push("owner_address = ?");
    params.push(filters.ownerAddress);
  }

  const whereClause =
    conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  const rows = db
    .prepare(
      `SELECT * FROM verifier_templates ${whereClause} ORDER BY created_at DESC`,
    )
    .all(...params) as VerifierRow[];

  return rows.map(rowToVerifier);
}

export interface UpdateVerifierParams {
  name?: string;
  description?: string;
  taskType?: string;
  inputSchema?: Record<string, unknown> | string;
  outputSchema?: Record<string, unknown> | string;
  wasmHash?: string;
  wasmFileUrl?: string;
  modeSupport?: ProofMode[];
  status?: "draft" | "active" | "deprecated";
}

/**
 * Update a verifier template. Owner-only.
 */
export function updateVerifier(
  verifierId: string,
  ownerAddress: string,
  params: UpdateVerifierParams,
): VerifierTemplate {
  const db = getDb();
  const existing = getVerifier(verifierId);

  if (!existing) {
    throw new Error("VERIFIER_NOT_FOUND");
  }

  if (existing.owner_address !== ownerAddress) {
    throw new Error(
      "NOT_OWNER: Only the verifier owner can update this template",
    );
  }

  const updates: string[] = [];
  const values: unknown[] = [];

  if (params.name !== undefined) {
    if (params.name.trim().length === 0) {
      throw new Error("INVALID_NAME: Verifier name must not be empty");
    }

    const newSlug = generateSlug(params.name);
    if (!newSlug) {
      throw new Error("INVALID_NAME: Could not generate a valid slug from the name");
    }

    // Check slug uniqueness (excluding current verifier)
    const existingBySlug = getVerifierRowBySlug(newSlug);
    if (existingBySlug && existingBySlug.id !== verifierId) {
      throw new Error(
        `DUPLICATE_SLUG: A verifier with slug '${newSlug}' already exists`,
      );
    }

    updates.push("name = ?");
    values.push(params.name.trim());
    updates.push("slug = ?");
    values.push(newSlug);
  }

  if (params.description !== undefined) {
    updates.push("description = ?");
    values.push(params.description.trim());
  }

  if (params.taskType !== undefined) {
    if (params.taskType.trim().length === 0) {
      throw new Error("INVALID_TASK_TYPE: Task type must not be empty");
    }
    updates.push("task_type = ?");
    values.push(params.taskType.trim());
  }

  if (params.inputSchema !== undefined) {
    const validated = validateSchemaObject(params.inputSchema, "INPUT_SCHEMA");
    updates.push("input_schema = ?");
    values.push(JSON.stringify(validated));
  }

  if (params.outputSchema !== undefined) {
    const validated = validateSchemaObject(params.outputSchema, "OUTPUT_SCHEMA");
    updates.push("output_schema = ?");
    values.push(JSON.stringify(validated));
  }

  if (params.wasmHash !== undefined) {
    if (!validateWasmHash(params.wasmHash)) {
      throw new Error(
        "INVALID_WASM_HASH: wasm_hash must be a 64-char SHA-256 or 128-char SHA3 hex string",
      );
    }
    updates.push("wasm_hash = ?");
    values.push(params.wasmHash);
  }

  if (params.wasmFileUrl !== undefined) {
    updates.push("wasm_file_url = ?");
    values.push(params.wasmFileUrl ?? null);
  }

  if (params.modeSupport !== undefined) {
    if (
      !Array.isArray(params.modeSupport) ||
      params.modeSupport.length === 0 ||
      params.modeSupport.some(
        (m) => m !== "tee_verification_mode" && m !== "hosted_tee",
      )
    ) {
      throw new Error(
        "INVALID_MODE_SUPPORT: mode_support must be a non-empty array of valid modes",
      );
    }
    updates.push("mode_support = ?");
    values.push(JSON.stringify(params.modeSupport));
  }

  if (params.status !== undefined) {
    updates.push("status = ?");
    values.push(params.status);
  }

  if (updates.length === 0) {
    return existing;
  }

  updates.push("updated_at = ?");
  values.push(new Date().toISOString());
  values.push(verifierId);

  db.prepare(
    `UPDATE verifier_templates SET ${updates.join(", ")} WHERE id = ?`,
  ).run(...values);

  const updated = getVerifier(verifierId);
  if (!updated) {
    throw new Error(
      "UPDATE_FAILED: Verifier was updated but could not be retrieved",
    );
  }

  return updated;
}

// ── L2: WASM hash registration ────────────

export interface UploadVerifierParams {
  ownerAddress: string;
  name: string;
  description?: string;
  taskType: string;
  inputSchema?: Record<string, unknown> | string;
  outputSchema?: Record<string, unknown> | string;
  wasmContent?: string; // base64-encoded WASM bytes
  wasmHash?: string;
  wasmFileUrl?: string;
  modeSupport?: ProofMode[];
  status?: "draft" | "active";
}

/**
 * Register a verifier template with WASM upload support.
 * If wasmContent is provided (base64), its SHA-256 hash is computed
 * and used as the wasm_hash. If wasmHash is provided directly,
 * it must be a valid SHA-256/SHA3 hex string.
 *
 * Note: WASM content is NOT stored in the database. Only the hash is stored.
 * This is a deliberate design choice for the current release - full WASM
 * storage requires blob/file system integration.
 */
export function uploadVerifier(params: UploadVerifierParams): VerifierTemplate {
  let finalWasmHash: string;

  if (params.wasmContent) {
    // Reject empty or whitespace-only base64
    if (typeof params.wasmContent !== "string" || params.wasmContent.trim().length === 0) {
      throw new Error(
        "INVALID_WASM_CONTENT: wasm_content must be non-empty base64-encoded binary data",
      );
    }

    // Validate base64 format before decoding
    if (!/^[A-Za-z0-9+/]*={0,2}$/.test(params.wasmContent.trim())) {
      throw new Error(
        "INVALID_WASM_CONTENT: wasm_content must be valid base64",
      );
    }

    // Decode base64 and hash the WASM bytes
    let wasmBytes: Buffer;
    try {
      wasmBytes = Buffer.from(params.wasmContent.trim(), "base64");
      if (wasmBytes.length === 0) {
        throw new Error("Empty WASM content");
      }
    } catch {
      throw new Error(
        "INVALID_WASM_CONTENT: wasm_content must be valid base64-encoded binary data",
      );
    }

    finalWasmHash = hashWasmBytes(wasmBytes);

    // If user also supplied a hash, it must match
    if (params.wasmHash && params.wasmHash !== finalWasmHash) {
      throw new Error(
        `WASM_HASH_MISMATCH: The provided hash (${params.wasmHash}) does not match the computed hash (${finalWasmHash})`,
      );
    }
  } else if (params.wasmHash) {
    if (!validateWasmHash(params.wasmHash)) {
      throw new Error(
        "INVALID_WASM_HASH: wasm_hash must be a 64-char SHA-256 or 128-char SHA3 hex string",
      );
    }
    finalWasmHash = params.wasmHash;
  } else {
    throw new Error(
      "MISSING_WASM: Either wasm_content (base64) or wasm_hash must be provided",
    );
  }

  return createVerifier({
    ownerAddress: params.ownerAddress,
    name: params.name,
    description: params.description,
    taskType: params.taskType,
    inputSchema: params.inputSchema,
    outputSchema: params.outputSchema,
    wasmHash: finalWasmHash,
    wasmFileUrl: params.wasmFileUrl,
    modeSupport: params.modeSupport,
    status: params.status,
  });
}

// ── L3: Test-verifier action ──────────────

export interface TestVerifierInput {
  /** The input to test against the verifier's input_schema. */
  input: Record<string, unknown>;
}

export interface TestVerifierResult {
  /** Whether the input passed validation against the input_schema. */
  valid: boolean;
  /** The verifier template ID that was tested. */
  verifier_id: string;
  /** The status of the verifier at test time. */
  verifier_status: string;
  /** The computed SHA-256 hash of the input. */
  input_hash: string;
  /** The deterministically produced test output. */
  output: Record<string, unknown>;
  /** The hash of the output. */
  output_hash: string;
  /** The WASM hash registered with this verifier. */
  wasm_hash: string;
  /** The timestamp of the test. */
  tested_at: string;
  /** Mode of the test - always "tee_verification_mode". */
  mode: "tee_verification_mode";
  /** Deterministic verification token (SHA-256 of input_hash + output_hash + wasm_hash). */
  verification_token: string;
}

/**
 * Validate input against a verifier template's input_schema using
 * simple key-presence and type-checking (deterministic local path).
 *
 * Returns a deterministic test result with hashes and a verification
 * token. This uses the TEE verification mode approach: the input is
 * validated, output is produced deterministically, and hashes are
 * chained to form a verification token suitable for judge evaluation.
 *
 * Note: In a hosted TEE deployment, this would route through the
 * bky-as attestation pipeline. The current path uses deterministic
 * local verification with full hash chaining - compatible with the
 * tee_verification_mode architecture.
 */
export function testVerifier(
  verifierId: string,
  testInput: TestVerifierInput,
): TestVerifierResult {
  const verifier = getVerifier(verifierId);

  if (!verifier) {
    throw new Error("VERIFIER_NOT_FOUND");
  }

  if (verifier.status === "deprecated") {
    throw new Error(
      "VERIFIER_DEPRECATED: Cannot test a deprecated verifier template",
    );
  }

  if (!testInput.input || typeof testInput.input !== "object") {
    throw new Error("INVALID_TEST_INPUT: input must be a non-null object");
  }

  // Validate input against input_schema
  const valid = validateInputAgainstSchema(
    testInput.input,
    verifier.input_schema,
  );

  // Compute hashes
  const inputHash = createHash("sha256")
    .update(JSON.stringify(testInput.input))
    .digest("hex");

  // Produce deterministic test output
  const testOutput: Record<string, unknown> = {
    result: valid ? "passed" : "failed",
    verifier_name: verifier.name,
    verifier_slug: verifier.slug,
    task_type: verifier.task_type,
    input_keys_validated: Object.keys(testInput.input),
    expected_keys: Object.keys(verifier.input_schema),
  };

  if (!valid) {
    testOutput.validation_errors = buildSchemaValidationErrors(
      testInput.input,
      verifier.input_schema,
    );
  }

  const outputHash = createHash("sha256")
    .update(JSON.stringify(testOutput))
    .digest("hex");

  // Build deterministic verification token
  const verificationToken = createHash("sha256")
    .update(`${inputHash}:${outputHash}:${verifier.wasm_hash}`)
    .digest("hex");

  return {
    valid,
    verifier_id: verifierId,
    verifier_status: verifier.status,
    input_hash: inputHash,
    output: testOutput,
    output_hash: outputHash,
    wasm_hash: verifier.wasm_hash,
    tested_at: new Date().toISOString(),
    mode: "tee_verification_mode",
    verification_token: verificationToken,
  };
}

// ── Schema validation helpers ─────────────

/**
 * Validate an input object against a JSON schema definition.
 * Simple key-type validation: checks that all expected keys exist
 * in the input with matching types (string/number/boolean/object).
 */
function validateInputAgainstSchema(
  input: Record<string, unknown>,
  schema: Record<string, unknown>,
): boolean {
  if (!schema || Object.keys(schema).length === 0) {
    // Empty schema - any input is valid
    return true;
  }

  for (const [key, expectedType] of Object.entries(schema)) {
    const value = input[key];

    // Key must exist
    if (value === undefined) {
      return false;
    }

    // Type matching
    const actualType = Array.isArray(value)
      ? "array"
      : typeof value;

    const expected = String(expectedType).toLowerCase();

    if (expected !== actualType) {
      // Allow null for object types
      if (expected === "object" && value === null) {
        continue;
      }
      return false;
    }
  }

  return true;
}

/**
 * Build a list of schema validation error strings.
 */
function buildSchemaValidationErrors(
  input: Record<string, unknown>,
  schema: Record<string, unknown>,
): string[] {
  const errors: string[] = [];

  for (const [key, expectedType] of Object.entries(schema)) {
    const value = input[key];
    if (value === undefined) {
      errors.push(`Missing required key: '${key}' (expected ${String(expectedType)})`);
      continue;
    }

    const actualType = Array.isArray(value) ? "array" : typeof value;
    const expected = String(expectedType).toLowerCase();

    if (expected !== actualType) {
      if (!(expected === "object" && value === null)) {
        errors.push(
          `Type mismatch for '${key}': expected ${expected}, got ${actualType}`,
        );
      }
    }
  }

  return errors;
}

// ── Health ────────────────────────────────

export interface VerifierServiceHealth {
  healthy: boolean;
  totalVerifiers: number;
  activeVerifiers: number;
  draftVerifiers: number;
  deprecatedVerifiers: number;
}

export function getVerifierServiceHealth(): VerifierServiceHealth {
  const db = getDb();
  const total = (
    db.prepare("SELECT COUNT(*) as cnt FROM verifier_templates").get() as {
      cnt: number;
    }
  ).cnt;
  const active = (
    db
      .prepare(
        "SELECT COUNT(*) as cnt FROM verifier_templates WHERE status = 'active'",
      )
      .get() as { cnt: number }
  ).cnt;
  const draft = (
    db
      .prepare(
        "SELECT COUNT(*) as cnt FROM verifier_templates WHERE status = 'draft'",
      )
      .get() as { cnt: number }
  ).cnt;

  return {
    healthy: true,
    totalVerifiers: total,
    activeVerifiers: active,
    draftVerifiers: draft,
    deprecatedVerifiers: total - active - draft,
  };
}
