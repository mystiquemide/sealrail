export const CATEGORY_OPTIONS = ["Invoice", "DeFi", "Research", "Compliance", "Custom"] as const;

export type ExecutionType = "llm" | "webhook" | "manual";

export const EXECUTION_TYPE_LABELS: Record<ExecutionType, string> = {
  llm: "First-party LLM worker",
  webhook: "External webhook",
  manual: "Manual / API submitter",
};

export const EXECUTION_TYPE_OPTIONS: ExecutionType[] = ["llm", "webhook", "manual"];

export type RegisterAgentFormState = {
  name: string;
  category: string;
  description: string;
  taskTypes: string;
  ownerWallet: string;
  executionType: ExecutionType;
  webhookUrl: string;
  submitterId: string;
  verifier: string;
  taskType: string;
  outputSchema: string;
  price: string;
  currency: string;
  recipient: string;
  publish: boolean;
};

export const INITIAL_FORM_STATE: RegisterAgentFormState = {
  name: "",
  category: "Invoice",
  description: "",
  taskTypes: "",
  ownerWallet: "",
  executionType: "llm",
  webhookUrl: "",
  submitterId: "",
  verifier: "",
  taskType: "",
  outputSchema: "",
  price: "",
  currency: "CSPR",
  recipient: "",
  publish: true,
};

export function outputSchemaSummary(outputSchema: string): string {
  return outputSchema.trim() ? outputSchema.trim() : "default (risk decision json)";
}

export function validateForm(form: RegisterAgentFormState): string | null {
  if (!form.name.trim()) return "Agent name is required.";
  if (!form.ownerWallet.trim()) return "Owner wallet is required.";
  if (!form.verifier) return "Select a verifier template that already exists.";
  if (!form.price.trim() || Number.isNaN(Number(form.price))) return "Enter a valid price amount.";
  if (!form.recipient.trim()) return "Recipient address is required.";
  return null;
}
