import { ensureSession } from "./session";
import type {
  Agent,
  AgentCategory,
  AgentReputation,
  AgentStatus,
  ApiErrorBody,
  ApiKey,
  Currency,
  MarketplaceListing,
  Payment,
  Proof,
  PublicStatus,
  Task,
  TaskDetail,
  TaskStatus,
  VerifierTemplate,
  WorkflowRun,
  WorkflowStepRun,
  WorkflowTemplate,
} from "./api-types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "https://api-production-7409.up.railway.app";

export class ApiClientError extends Error {
  status: number;
  code: string;
  body: ApiErrorBody;

  constructor(status: number, body: ApiErrorBody) {
    super(body.message || `Request failed with status ${status}`);
    this.name = "ApiClientError";
    this.status = status;
    this.code = body.error ?? "UNKNOWN_ERROR";
    this.body = body;
  }
}

type RequestOptions = {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  body?: unknown;
  auth?: boolean;
  query?: Record<string, string | number | undefined>;
};

function buildUrl(path: string, query?: RequestOptions["query"]): string {
  const url = new URL(`${API_BASE}${path}`);
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== "") url.searchParams.set(key, String(value));
    }
  }
  return url.toString();
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = {};
  if (options.body !== undefined) headers["Content-Type"] = "application/json";

  if (options.auth && typeof window !== "undefined") {
    const session = await ensureSession();
    headers["Authorization"] = `Bearer ${session.secret}`;
  }

  const res = await fetch(buildUrl(path, options.query), {
    method: options.method ?? "GET",
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    cache: "no-store",
  });

  const text = await res.text();
  const parsed = text ? JSON.parse(text) : {};

  if (!res.ok) {
    throw new ApiClientError(res.status, parsed as ApiErrorBody);
  }

  return parsed as T;
}

// ── Status ──

export const getPublicStatus = () => request<PublicStatus>("/api/status");

// ── Agents ──

export const listAgents = (filters?: { category?: AgentCategory; status?: AgentStatus; owner_address?: string }) =>
  request<{ agents: Agent[]; count: number }>("/api/agents", { query: filters });

export const getAgent = (agentId: string) => request<{ agent: Agent }>(`/api/agents/${agentId}`);

export const getAgentReputation = (agentId: string) =>
  request<{ agent_id: string; reputation: AgentReputation }>(`/api/agents/${agentId}/reputation`);

export const getAgentProofs = (agentId: string) =>
  request<{ agent_id: string; proofs: Proof[]; count: number }>(`/api/agents/${agentId}/proofs`);

export const createAgent = (body: {
  name: string;
  category: AgentCategory;
  description?: string;
  short_pitch?: string;
  pricing_model?: string;
  base_price?: number;
  currency?: Currency;
  verifier_ids?: string[];
  supported_task_types?: string[];
}) => request<{ agent: Agent; message: string }>("/api/agents", { method: "POST", body, auth: true });

// ── Marketplace ──

export const listMarketplace = (filters?: { category?: string; status?: string; owner_address?: string }) =>
  request<{ listings: MarketplaceListing[]; count: number }>("/api/marketplace", { query: filters });

export const getMarketplaceListing = (listingId: string) =>
  request<{ listing: MarketplaceListing }>(`/api/marketplace/${listingId}`);

export const createMarketplaceListing = (body: {
  agent_id: string;
  title: string;
  category: string;
  price_amount: number;
  currency: Currency;
  verifier_id: string;
  summary?: string;
  proof_requirement?: string;
}) => request<{ listing: MarketplaceListing; message: string }>("/api/marketplace/listings", {
  method: "POST",
  body,
  auth: true,
});

export const createTaskFromListing = (listingId: string, body: { buyer_address: string; input?: Record<string, unknown> }) =>
  request<{ task: Task; payment: Payment; listing: { id: string; title: string; price_amount: number; currency: Currency } }>(
    `/api/marketplace/${listingId}/tasks`,
    { method: "POST", body, auth: true }
  );

// ── Tasks ──

export const listTasks = (filters?: { status?: TaskStatus }) =>
  request<{ tasks: Task[]; count: number }>("/api/tasks", { query: filters });
export const getTaskDetail = (taskId: string) => request<TaskDetail>(`/api/tasks/${taskId}`);
export const getProofDetail = (proofId: string) =>
  request<{
    proof_id: string;
    task_id: string | null;
    invoice_id: string | null;
    payment_state: string | null;
    x402_receipt?: Record<string, unknown>;
  }>(`/api/proofs/${proofId}`);

export const createTask = (body: {
  agent_id: string;
  buyer_address: string;
  total_amount: number;
  currency: Currency;
  title?: string;
  task_type?: string;
  input?: Record<string, unknown>;
  unlock_rule?: string;
}) =>
  request<{
    task_id: string;
    payment_id: string;
    task_status: TaskStatus;
    payment_status: string;
    total_amount: number;
    currency: Currency;
    message: string;
  }>("/api/tasks", { method: "POST", body, auth: true });

export const runTask = (taskId: string) =>
  request<{ task_id: string; status: TaskStatus; proof_id: string; agent_executed: boolean; message: string }>(
    `/api/tasks/${taskId}/run`,
    { method: "POST", auth: true }
  );

export const verifyTask = (taskId: string) =>
  request<{ task_id: string; status: TaskStatus; proof_ids: string[]; message: string }>(`/api/tasks/${taskId}/verify`, {
    method: "POST",
    auth: true,
  });

export const anchorTask = (taskId: string) =>
  request<{ task_id: string; anchor_hash: string; deploy_hash: string; mode: string; casper_mode: string; proof_id: string }>(
    `/api/tasks/${taskId}/anchor`,
    { method: "POST", auth: true }
  );

export const getTaskOutput = (taskId: string) =>
  request<{
    task_id: string;
    output: {
      agent_id: string;
      result: Record<string, unknown>;
      input_hash: string;
      output_hash: string;
      model_metadata: { provider: string; model: string } | null;
      started_at: string;
      completed_at: string;
      duration_ms: number;
    };
  }>(`/api/tasks/${taskId}/output`);

export const unlockTaskPayment = (taskId: string) =>
  request<{ task_id: string; payment_id: string; task_status: TaskStatus; payment_status: string; message: string }>(
    `/api/tasks/${taskId}/unlock-payment`,
    { method: "POST", auth: true }
  );

// ── Payments ──

export const listPayments = (filters?: { status?: string }) =>
  request<{ payments: Payment[]; count: number }>("/api/payments", { query: filters });

export const getPayment = (paymentId: string) => request<{ payment: Payment }>(`/api/payments/${paymentId}`);

export const createPaymentSplits = (
  paymentId: string,
  body: {
    recipients: Array<{
      address: string;
      share_bps: number;
      role: string;
      agent_id?: string;
      verifier_id?: string;
      proof_required?: boolean;
    }>;
  }
) => request<{ payment_id: string; status: string; split_hash: string; message: string }>(`/api/payments/${paymentId}/splits`, {
  method: "POST",
  body,
  auth: true,
});

// ── Verifiers ──

export const listVerifiers = (filters?: { status?: string; task_type?: string; owner_address?: string }) =>
  request<{ verifiers: VerifierTemplate[]; count: number }>("/api/verifiers", { query: filters });

export const getVerifier = (verifierId: string) => request<{ verifier: VerifierTemplate }>(`/api/verifiers/${verifierId}`);

export const createVerifier = (body: {
  name: string;
  task_type: string;
  wasm_hash: string;
  description?: string;
  input_schema?: Record<string, unknown>;
  output_schema?: Record<string, unknown>;
  mode_support?: string[];
  status?: string;
}) => request<{ verifier: VerifierTemplate; message: string }>("/api/verifiers", { method: "POST", body, auth: true });

export const testVerifier = (verifierId: string, input: Record<string, unknown>) =>
  request<{ result: { valid: boolean; [key: string]: unknown }; message: string }>(`/api/verifiers/${verifierId}/test`, {
    method: "POST",
    body: { input },
  });

// ── Workflows ──

export const listWorkflows = (filters?: { status?: string; category?: string; owner_address?: string }) =>
  request<{ workflows: WorkflowTemplate[]; count: number }>("/api/workflows", { query: filters });

export const getWorkflow = (workflowId: string) => request<{ workflow: WorkflowTemplate }>(`/api/workflows/${workflowId}`);

export const runWorkflow = (workflowId: string, buyerAddress: string) =>
  request<{ run: WorkflowRun; message: string }>(`/api/workflows/${workflowId}/run`, {
    method: "POST",
    body: { buyer_address: buyerAddress },
    auth: true,
  });

export const getWorkflowRun = (runId: string) => request<{ run: WorkflowRun }>(`/api/workflow-runs/${runId}`);

export const runWorkflowStep = (runId: string, stepId: string, agentId: string) =>
  request<{ run: WorkflowRun; step_run: WorkflowStepRun; proof: Proof; message: string }>(
    `/api/workflow-runs/${runId}/steps/${stepId}/run`,
    { method: "POST", body: { agent_id: agentId }, auth: true }
  );

export const finalizeWorkflowRun = (runId: string) =>
  request<{ run: WorkflowRun; final_proof: Proof; step_proofs: Proof[]; step_count: number; message: string }>(
    `/api/workflow-runs/${runId}/finalize`,
    { method: "POST", auth: true }
  );

// ── API keys ──

export const listApiKeys = () => request<{ keys: ApiKey[]; count: number; owner_address: string }>("/api/api-keys", { auth: true });

export const createApiKey = (body: { name: string; scopes?: string[]; owner_address?: string }) =>
  request<{ key: ApiKey; secret: string; message: string }>("/api/api-keys", { method: "POST", body, auth: true });

export const revokeApiKey = (keyId: string) =>
  request<{ key: ApiKey; message: string }>(`/api/api-keys/${keyId}`, { method: "DELETE", auth: true });
