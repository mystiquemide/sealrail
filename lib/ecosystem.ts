export type EcosystemIntegrationItem = {
  title: string;
  description: string;
};

export const ecosystemIntegrations = {
  agentManifestPath: "/api/integrations/agent-manifest",
  live: [
    {
      title: "Casper testnet",
      description: "Hosted backend reports Casper testnet mode with ProofRegistry contract readiness and deploy metadata.",
    },
    {
      title: "Odra ProofRegistry",
      description: "The proof registry contract is built with Odra and deployed on Casper testnet for proof anchoring.",
    },
    {
      title: "x402-compatible receipts",
      description: "Proof bundles expose payment-required receipt metadata, unlock conditions, network, and payment state.",
    },
    {
      title: "MCP server",
      description: "A real Model Context Protocol stdio server exposes SealRail tools for status, manifests, proofs, and payment-backed task creation.",
    },
  ] satisfies EcosystemIntegrationItem[],
  roadmap: [
    {
      title: "CSPR.cloud APIs",
      description: "Deeper read/write lookup support for proof metadata, deploys, and account-level status.",
    },
    {
      title: "Agent wallet identity",
      description: "Casper wallet-linked ownership for agents, buyers, and verifiers with reputation tied to real proof history.",
    },
    {
      title: "External agent frameworks",
      description: "Adapters for popular autonomous agent runtimes so they can call SealRail as their proof-gated payment rail.",
    },
  ] satisfies EcosystemIntegrationItem[],
} as const;
