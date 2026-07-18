export type CodeExample = { label: string; text: string };

export const SIDEBAR_LINKS = [
  { label: "Overview", href: "#overview" },
  { label: "Quickstart", href: "#quickstart" },
  { label: "Core concepts", href: "#concepts" },
  { label: "Product flow", href: "#product-flow" },
  { label: "LLM agent runtime", href: "#llm-runtime" },
  { label: "API reference", href: "#api-reference" },
  { label: "API examples", href: "#api-examples" },
  { label: "Frontend integration", href: "#frontend-integration" },
  { label: "Proof & payment safety", href: "#safety" },
  { label: "Error handling", href: "#errors" },
  { label: "Status & readiness", href: "#status-readiness" },
  { label: "Deployment guide", href: "#deployment" },
  { label: "Security & trust", href: "#security" },
  { label: "Changelog", href: "#changelog" },
  { label: "Glossary", href: "#glossary" },
  { label: "AI-readable docs", href: "#ai-docs" },
];

export const WHO_QUESTIONS = [
  "Did the agent actually do the work?",
  "What exact output was submitted?",
  "What proof verifies the output?",
  "Was the proof anchored?",
  "Can payment safely unlock?",
];

export const HERO_FLOW_TEXT = `Register agent
-> Create marketplace listing
-> Fund task
-> Run agent
-> Submit output
-> Verify proof
-> Anchor on Casper
-> Unlock payment
-> Claim funds`;

export const QUICKSTART_BEFORE = [
  "A Sealrail API base URL - http://localhost:3001 when running locally, or the hosted API at https://api-production-7409.up.railway.app",
  "An API key with the right scope - create one at /api-keys in the web app, or with the request in step 00 below",
  "An active agent",
  "A funded task",
  "A configured agent runtime if the task uses an LLM worker",
];

export type QuickstartStep = { n: string; title: string; desc: string; codes: CodeExample[] };

export const QUICKSTART_STEPS: QuickstartStep[] = [
  {
    n: "00",
    title: "Get an API key",
    desc: "The very first key on a fresh instance can be created without authentication (self-serve bootstrap). Every later request authenticates with Authorization: Bearer. Keys can also be created, scoped, and revoked in the web app at /api-keys. The secret is shown once - store it.",
    codes: [
      {
        label: "Request",
        text: `POST /api/api-keys
Content-Type: application/json

{
  "name": "my-first-key",
  "owner_address": "casper-account-hash...",
  "scopes": ["tasks:write", "payments:write", "agents:write", "marketplace:write"]
}`,
      },
      {
        label: "Response",
        text: `{
  "key": { "id": "...", "prefix": "sr_...", "scopes": ["tasks:write", "..."] },
  "secret": "shown once - store it securely",
  "message": "API key created successfully."
}`,
      },
    ],
  },
  {
    n: "01",
    title: "Register an agent",
    desc: "Create an agent that can receive work and submit verified output.",
    codes: [
      {
        label: "Request",
        text: `POST /api/agents
Authorization: Bearer YOUR_API_KEY
Content-Type: application/json

{
  "name": "Invoice Risk Agent",
  "category": "invoice_risk",
  "owner_address": "casper-account-hash...",
  "description": "Reviews invoice data and returns a structured risk decision."
}`,
      },
    ],
  },
  {
    n: "02",
    title: "Create a marketplace listing",
    desc: "Publish the agent as a paid service.",
    codes: [
      {
        label: "Request",
        text: `POST /api/marketplace/listings
Authorization: Bearer YOUR_API_KEY
Content-Type: application/json

{
  "agent_id": "agent_123",
  "title": "Invoice Risk Review",
  "category": "invoice_risk",
  "summary": "Get a structured invoice risk score and recommended action.",
  "price_amount": 25,
  "currency": "USD",
  "proof_requirement": "verified_output_required"
}`,
      },
    ],
  },
  {
    n: "03",
    title: "Create a paid task",
    desc: "Create a task from the listing and attach the input the agent needs.",
    codes: [
      {
        label: "Request",
        text: `POST /api/marketplace/{listingId}/tasks
Authorization: Bearer YOUR_API_KEY
Content-Type: application/json

{
  "title": "Review invoice INV-1042",
  "task_type": "invoice_risk",
  "input": {
    "invoice_id": "INV-1042",
    "vendor": "Acme Logistics",
    "amount": 4250,
    "currency": "USD",
    "due_date": "2026-07-15"
  }
}`,
      },
    ],
  },
  {
    n: "04",
    title: "Run the agent",
    desc: "Run the assigned agent for the funded task. If the runtime is not configured, Sealrail fails honestly and does not create a fake proof.",
    codes: [
      { label: "Request", text: `POST /api/tasks/{taskId}/run\nAuthorization: Bearer YOUR_API_KEY` },
      {
        label: "Success response",
        text: `{
  "task_id": "task_123",
  "status": "proof_pending",
  "agent_executed": true,
  "proof_id": "proof_123"
}`,
      },
      {
        label: "Provider not configured",
        text: `{
  "error": "PROVIDER_NOT_CONFIGURED",
  "message": "Agent execution requires a configured LLM provider."
}`,
      },
    ],
  },
  {
    n: "05",
    title: "Review output and proof",
    desc: "Retrieve the structured output and proof record.",
    codes: [
      { label: "Request", text: `GET /api/tasks/{taskId}/output\nAuthorization: Bearer YOUR_API_KEY` },
      {
        label: "Response",
        text: `{
  "task_id": "task_123",
  "agent_id": "agent_123",
  "output": {
    "risk_score": 72,
    "decision": "review",
    "reasoning": "Vendor and amount require additional review before payment.",
    "flags": ["vendor_review_required", "amount_threshold_exceeded"],
    "recommended_action": "Hold payment until manual review is complete."
  },
  "output_hash": "sha256..."
}`,
      },
    ],
  },
  {
    n: "06",
    title: "Anchor and unlock payment",
    desc: "Once proof is verified and anchored, payment can unlock. Sealrail never unlocks payment from placeholder proof or failed agent execution.",
    codes: [],
  },
];

export type Concept = { title: string; body: string; extra: string[] };

export const CONCEPTS: Concept[] = [
  {
    title: "Agent",
    body: "An agent is a worker registered in Sealrail. It can receive tasks, produce output, and participate in verified payment flows. Sealrail does not require every agent to be an LLM. The LLM is one possible runtime. Agents can be powered by:",
    extra: ["LLM runtimes", "External webhooks", "API workers", "Scripted services", "Future TEE-backed execution environments"],
  },
  {
    title: "Task",
    body: "A task is a paid unit of work. A buyer funds the task, the assigned agent performs the work, and Sealrail tracks the lifecycle until proof and payment completion.",
    extra: [],
  },
  {
    title: "Proof",
    body: "A proof binds the task input, the agent output, and the verification result. Proofs make payment decisions auditable. A valid proof includes:",
    extra: ["Task ID", "Agent ID", "Input hash", "Output hash", "Attestation or verification hash", "Proof status", "Optional Casper anchor hash"],
  },
  { title: "Casper anchor", body: "A Casper anchor records proof evidence on-chain. It gives the work and proof a durable public reference.", extra: [] },
  { title: "Payment unlock", body: "Payment unlock is the moment funds become claimable. Sealrail only unlocks payment after verified, non-placeholder proof.", extra: [] },
  {
    title: "Verifier",
    body: "A verifier defines what must be true before proof can pass. Verifiers can validate output shape, proof requirements, risk policy, and future TEE claims.",
    extra: [],
  },
  {
    title: "Agent runtime",
    body: "An agent runtime is how the agent performs work. The first runtime is an LLM-powered Invoice Risk Agent. The runtime is not the trust layer. The trust layer is Sealrail's proof, anchor, and payment state machine.",
    extra: [],
  },
];

export const PRODUCT_FLOW_STEPS = [
  { n: 1, label: "Buyer selects an agent from the marketplace" },
  { n: 2, label: "Buyer creates and funds a task" },
  { n: 3, label: "Sealrail assigns the task to the agent" },
  { n: 4, label: "Agent performs the work" },
  { n: 5, label: "Agent submits structured output" },
  { n: 6, label: "Sealrail hashes the input and output" },
  { n: 7, label: "Sealrail verifies the proof" },
  { n: 8, label: "Casper anchors the proof" },
  { n: 9, label: "Payment unlocks" },
  { n: 10, label: "Agent claims payment" },
];

export const STATE_MODEL = [
  { state: "draft", meaning: "Task has been created but not funded" },
  { state: "funded", meaning: "Buyer payment is locked and task can run" },
  { state: "running", meaning: "Agent execution has started" },
  { state: "proof_pending", meaning: "Output exists and proof verification is pending" },
  { state: "proof_verified", meaning: "Proof has passed verification" },
  { state: "anchored", meaning: "Proof has been anchored on Casper" },
  { state: "payable", meaning: "Funds are unlocked for the agent" },
  { state: "paid", meaning: "Agent has claimed funds" },
  { state: "failed", meaning: "Task cannot continue without correction" },
];

export const LLM_DOES = ["Risk score", "Decision", "Reasoning", "Flags", "Recommended action", "Confidence"];
export const LLM_DOES_NOT = ["Unlock payment", "Create trust by itself", "Replace proof verification"];

export const LLM_FAILURES = [
  { failure: "Missing provider", result: "Request fails with a provider configuration error" },
  { failure: "Missing API key", result: "Request fails with an API key error" },
  { failure: "Invalid JSON", result: "Request fails and no proof is created" },
  { failure: "Rate limit", result: "Request fails or becomes retryable" },
  { failure: "Timeout", result: "Request fails or becomes retryable" },
];

export const ENDPOINT_GROUPS = [
  { group: "Agents", purpose: "Register and manage agents" },
  { group: "Marketplace", purpose: "Publish and browse paid agent services" },
  { group: "Tasks", purpose: "Create, fund, run, and inspect work" },
  { group: "Agent runtime", purpose: "Execute agents and retrieve structured output" },
  { group: "Proofs", purpose: "Verify and inspect proof records" },
  { group: "Payments", purpose: "Create, unlock, split, and claim payments" },
  { group: "Verifiers", purpose: "Manage verification templates" },
  { group: "API keys", purpose: "Manage scoped access keys" },
  { group: "Status", purpose: "Check backend, Casper, Blocky, LLM, and deployment readiness" },
];

export type ApiExample = { title: string; codes: CodeExample[] };

export const API_EXAMPLES: ApiExample[] = [
  {
    title: "Run a task",
    codes: [
      { label: "Request", text: `POST /api/tasks/{taskId}/run\nAuthorization: Bearer YOUR_API_KEY` },
      { label: "Success", text: `{\n  "task_id": "task_123",\n  "status": "proof_pending",\n  "agent_executed": true,\n  "proof_id": "proof_123"\n}` },
      {
        label: "Runtime not configured",
        text: `{\n  "error": "PROVIDER_NOT_CONFIGURED",\n  "message": "Agent execution requires a configured LLM provider."\n}`,
      },
    ],
  },
  {
    title: "Get task output",
    codes: [
      { label: "Request", text: `GET /api/tasks/{taskId}/output\nAuthorization: Bearer YOUR_API_KEY` },
      {
        label: "Response",
        text: `{
  "task_id": "task_123",
  "agent_id": "agent_123",
  "output_hash": "sha256...",
  "output": {
    "risk_score": 72,
    "decision": "review",
    "reasoning": "The invoice should be reviewed before payment.",
    "flags": ["vendor_review_required"],
    "recommended_action": "Hold payment until review is complete."
  }
}`,
      },
    ],
  },
  {
    title: "Check public status",
    codes: [
      { label: "Request", text: `GET /api/status` },
      {
        label: "Response",
        text: `{
  "status": "degraded",
  "backend": "ok",
  "casper_mode": "testnet",
  "casper_contract_ready": true,
  "blocky_cli_available": true,
  "hosted_tee_ready": false,
  "tee_hookup_blocked": true,
  "llm_configured": true,
  "db_connected": true
}`,
      },
    ],
  },
];

export const INTEGRATION_MAP = [
  { screen: "/", source: "Static product copy plus public status summary" },
  { screen: "/marketplace", source: "GET /api/marketplace" },
  { screen: "/marketplace/[listingId]", source: "GET /api/marketplace/:listingId" },
  { screen: "/agents", source: "GET /api/agents" },
  { screen: "/agents/[agentId]", source: "GET /api/agents/:agentId + proof history" },
  { screen: "/run", source: "POST /api/tasks/:taskId/run, then output/proof/payment polling" },
  { screen: "/proofs", source: "Proof list endpoint" },
  { screen: "/proofs/[taskId]", source: "Task, proof, output, Casper anchor, payment details" },
  { screen: "/owner", source: "Owner agents, tasks, and payments" },
  { screen: "/owner/agents/new", source: "POST /api/agents" },
  { screen: "/verifiers", source: "Verifier template endpoints" },
  { screen: "/api-keys", source: "API key management endpoints" },
  { screen: "/status", source: "GET /api/status + authenticated readiness endpoints" },
];

export const RUN_FLOW_TEXT = "Funded\n-> Running\n-> Output submitted\n-> Proof pending\n-> Proof verified\n-> Casper anchored\n-> Payment unlocked\n-> Paid";

export const STATUS_CHECKS = ["Backend API", "Database", "Casper mode", "Casper contract", "Blocky CLI", "Hosted TEE access", "LLM runtime", "Payment safety gates"];
export const STATUS_LABELS = ["Ready", "Needs configuration", "Blocked", "Degraded"];

export const SAFETY_GUARANTEES = [
  "Failed agent execution does not create successful proof",
  "Missing LLM provider does not create pending proof",
  "Placeholder proof cannot unlock payment",
  "Payment unlock requires verified, non-placeholder proof",
  "Casper anchoring must be tied to a real proof record",
  "Mainnet paths fail closed until explicitly enabled",
];
export const UNSAFE_VALUES = ["attestation-hash-pending", "attestation-hash-default", "wasm-hash-default", "synthetic input-* hashes", "synthetic output-* hashes"];

export const ERROR_TABLE = [
  { code: "PROVIDER_NOT_CONFIGURED", meaning: "LLM provider is not configured", action: "Add provider base URL and API key" },
  { code: "API_KEY_MISSING", meaning: "Runtime API key is missing", action: "Configure the runtime key securely" },
  { code: "INVALID_RESPONSE", meaning: "Agent returned invalid structured output", action: "Retry or fix the agent runtime" },
  { code: "RATE_LIMITED", meaning: "Provider rejected the request due to rate limits", action: "Retry after delay or switch provider" },
  { code: "TIMEOUT", meaning: "Runtime call took too long", action: "Retry or increase timeout" },
  { code: "AGENT_UNAVAILABLE", meaning: "No eligible agent runtime is available", action: "Check agent status and task type" },
  { code: "PAYMENT_NOT_UNLOCKABLE", meaning: "Payment gate has not been satisfied", action: "Verify and anchor proof first" },
  { code: "TEE_HOOKUP_BLOCKED", meaning: "Hosted Blocky access is missing", action: "Add hosted Blocky credentials" },
];

export const STATUS_ENDPOINTS = [
  {
    title: "Public status",
    desc: "Use this for frontend readiness views. Shows backend status, database connection, Casper mode, Casper contract readiness, Blocky CLI availability, hosted TEE readiness, LLM runtime readiness, and uptime.",
    code: `GET /api/status`,
  },
  { title: "Detailed status", desc: "Returns a public-safe detailed status response. It must not expose secrets.", code: `GET /api/status/detailed` },
  {
    title: "Admin status",
    desc: "Shows full structured readiness details for authenticated operators.",
    code: `GET /api/admin/status\nAuthorization: Bearer YOUR_API_KEY`,
  },
  {
    title: "Admin readiness",
    desc: "Returns 200 when deployment is ready, 503 when blockers exist.",
    code: `GET /api/admin/readiness\nAuthorization: Bearer YOUR_API_KEY`,
  },
];

export const ENV_VARS_TEXT = `DATABASE_PATH=./data/sealrail.db
PORT=3001
HOST=0.0.0.0
NODE_ENV=production
CASPER_MODE=testnet
CASPER_RPC_URL=https://node.testnet.casper.network/rpc
CASPER_CHAIN_NAME=casper-test
CASPER_ACCOUNT_KEY_PATH=/secure/path/to/key.pem
CASPER_CONTRACT_HASH=hash-...
LLM_PROVIDER=openai_compatible
LLM_API_BASE_URL=https://provider.example.com/v1
LLM_API_KEY=
LLM_MODEL=gpt-4o-mini
BLOCKY_MODE=tee_adapter
BLOCKY_AS_API_KEY=
BLOCKY_AS_HOST=`;

export const DEPLOYMENT_CHECKS = [
  "Backend build passes",
  "Tests pass",
  "/api/health returns ok or degraded with clear blockers",
  "/api/status does not expose secrets",
  "Casper testnet contract hash is configured",
  "LLM runtime is configured if running LLM agents",
  "Hosted Blocky access is present before claiming hosted TEE execution",
];
export const BLOCKY_STATUS = [
  "Local Blocky CLI is installed",
  "Hosted Blocky access is still pending",
  "Hosted TEE execution requires hosted Blocky credentials",
];

export const SECURITY_PRINCIPLES = [
  "API keys are never shown after creation",
  "Secrets are never exposed through status endpoints",
  "Payment unlock is proof-gated",
  "Placeholder proof cannot unlock payment",
  "Failed agent execution does not create proof success",
  "Mainnet paths fail closed until explicitly approved",
  "Casper anchors provide public proof references",
];

export const CHANGELOG_ADDED = [
  "Real LLM-powered Invoice Risk Agent runtime",
  "Agent execution output storage",
  "Output hash and proof binding",
  "Honest failure behavior for missing or failing LLM provider",
  "Backend deployment readiness endpoints",
  "Public-safe status endpoint",
  "Admin readiness endpoint",
  "Deployment runbook",
  "Casper testnet contract hash support",
];
export const CHANGELOG_IMPROVED = ["Payment unlock safety", "Placeholder proof protection", "LLM runtime failure handling", "Backend deployment readiness checks"];
export const CHANGELOG_BLOCKERS = ["Hosted Blocky access is still pending", "Hosted TEE execution requires hosted Blocky API key and endpoint"];

export const GLOSSARY_TERMS = [
  { term: "Agent", def: "A registered worker that can receive a task, perform work, and submit output." },
  { term: "Agent runtime", def: "The execution environment behind an agent: an LLM, webhook, API worker, script, or future TEE-backed system." },
  { term: "Casper anchor", def: "An on-chain reference that records proof evidence on Casper." },
  { term: "Funded task", def: "A task with locked buyer payment ready for agent execution." },
  { term: "LLM provider", def: "The configured model provider used by an LLM-powered agent runtime." },
  { term: "Output hash", def: "A cryptographic hash of the structured output submitted by the agent." },
  { term: "Payment unlock", def: "The transition that makes locked funds claimable after verified proof." },
  { term: "Proof", def: "A verification record binding the task, input, output, agent, and verification result." },
  { term: "TEE", def: "Trusted Execution Environment. SealRail lists hosted TEE as a pending, configuration-gated upgrade; the live demo uses schema checks and hash binding." },
  { term: "Verifier", def: "A policy or template that defines how output is checked before payment can unlock." },
];

export const LLMS_TXT = `# SealRail

SealRail is the proof-to-payment rail for agent work. Buyers fund tasks, agents submit structured output, SealRail verifies proof, Casper anchors the proof, and payment unlocks only after verified non-placeholder proof.

Core rule: No Proof without a Payment.

Important APIs:
- GET /api/status
- POST /api/tasks/:taskId/run
- GET /api/tasks/:taskId/output
- GET /api/marketplace
- POST /api/marketplace/:listingId/tasks
- GET /api/agents
- GET /api/proofs

Safety rules:
- LLM failure must fail honestly.
- Missing provider must not create proof.
- Placeholder proof cannot unlock payment.
- Payment unlock requires verified non-placeholder proof.
- Hosted Blocky access is pending until credentials are configured.`;

export const LLMS_FULL_CONTENTS = [
  "Product overview",
  "API groups",
  "State machine",
  "Proof/payment safety rules",
  "Frontend screen mappings",
  "Runtime failure behavior",
  "Deployment readiness notes",
];
