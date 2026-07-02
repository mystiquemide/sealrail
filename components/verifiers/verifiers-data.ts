import type { VerifierTemplate } from "@/lib/api-types";

export type VerifierRow = {
  id: string;
  name: string;
  taskType: string;
  wasmHash: string;
  state: string;
};

export function toVerifierRow(v: VerifierTemplate): VerifierRow {
  return {
    id: v.id,
    name: v.name,
    taskType: v.task_type,
    wasmHash: v.wasm_hash,
    state: v.status.charAt(0).toUpperCase() + v.status.slice(1),
  };
}
