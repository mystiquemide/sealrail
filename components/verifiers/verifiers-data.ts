export type VerifierTemplate = {
  name: string;
  taskType: string;
  wasmHash: string;
  state: string;
};

export const VERIFIER_TEMPLATES: VerifierTemplate[] = [
  { name: "verifyInvoiceRisk", taskType: "invoice", wasmHash: "b94f...bb69f", state: "Active" },
];
