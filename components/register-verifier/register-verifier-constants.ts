export type RegisterVerifierFormState = {
  name: string;
  taskType: string;
  description: string;
  ownerWallet: string;
  inputSchema: string;
  outputSchema: string;
  wasmHash: string;
  mode: string;
};

export const INITIAL_VERIFIER_FORM_STATE: RegisterVerifierFormState = {
  name: "",
  taskType: "",
  description: "",
  ownerWallet: "",
  inputSchema: "",
  outputSchema: "",
  wasmHash: "",
  mode: "Schema + hash verification",
};

export function validateVerifierForm(form: RegisterVerifierFormState): string | null {
  if (!form.name.trim()) return "Verifier name is required.";
  if (!form.taskType.trim()) return "Task type is required.";
  if (!form.wasmHash.trim()) return "WASM hash is required to publish a template.";
  if (!form.ownerWallet.trim()) return "Owner wallet is required.";
  return null;
}
