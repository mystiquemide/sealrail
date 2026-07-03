import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { config } from "../config.js";
import { getCsprCloudHealth, getDeployConfirmation, getLatestCsprUsdRate } from "../services/cspr-cloud.js";

const CONTRACT_DEPLOY_TRANSACTION =
  "https://testnet.cspr.live/transaction/b2c6a9326545a137c3d7772385e9fe8003129e29f29336d451785e6a7f3a6196";

export function buildAgentManifest() {
  const network = config.casperChainName || "casper-test";
  const explorerBase = network.includes("mainnet") ? "https://cspr.live" : "https://testnet.cspr.live";

  return {
    name: "SealRail",
    version: "0.1.0",
    purpose: "Proof-gated payments for AI-agent work on Casper.",
    network,
    capabilities: [
      "create_payment_backed_task",
      "run_agent_task",
      "verify_output",
      "anchor_proof_on_casper",
      "unlock_payment_after_proof",
      "emit_x402_compatible_receipt",
      "serve_mcp_tools_for_external_agents",
    ],
    endpoints: {
      status: "/api/status",
      health: "/api/health",
      createTask: "/api/tasks",
      runTask: "/api/tasks/:taskId/run",
      verifyTask: "/api/tasks/:taskId/verify",
      anchorTask: "/api/tasks/:taskId/anchor",
      unlockPayment: "/api/tasks/:taskId/unlock-payment",
      listProofs: "/api/proofs",
      proofDetail: "/api/proofs/:proofId",
      marketplace: "/api/marketplace",
      csprCloudStatus: "/api/integrations/cspr-cloud/status",
      csprCloudDeployConfirmation: "/api/integrations/cspr-cloud/deploys/:deployHash",
      csprCloudLatestRate: "/api/integrations/cspr-cloud/rates/cspr/latest",
    },
    mcp: {
      transport: "stdio",
      command: "npm run mcp --prefix backend",
      serverPackage: "@modelcontextprotocol/sdk",
      tools: [
        "sealrail_status",
        "sealrail_agent_manifest",
        "sealrail_list_proofs",
        "sealrail_get_proof",
        "sealrail_create_payment_task",
      ],
    },
    integrations: {
      implemented: [
        "casper_testnet",
        "odra_proof_registry",
        "casper_client_tooling",
        "x402_compatible_receipts",
        "proof_hash_metadata",
        "agent_runtime_api",
        "mcp_server",
        "cspr_cloud_api",
        "cspr_cloud_x402_facilitator",
      ],
      planned: [
        "casper_ai_toolkit",
        "agent_wallet_identity",
        "external_agent_frameworks",
      ],
    },
    casper: {
      mode: config.casperMode,
      chainName: network,
      contractReady: Boolean(config.casperContractHash),
      proofRegistryPackageHash: config.casperContractHash || null,
      deployTransaction: CONTRACT_DEPLOY_TRANSACTION,
      explorerBase,
    },
    csprCloud: {
      configured: Boolean(config.csprCloudToken || config.csprCloudApiKey),
      apiUrl: config.csprCloudApiUrl,
      nodeUrl: config.csprCloudNodeUrl,
      x402FacilitatorUrl: config.csprCloudX402FacilitatorUrl,
      uses: [
        "indexed_casper_data",
        "deploy_status_confirmation",
        "cspr_usd_rate_lookup",
        "casper_node_status",
        "x402_supported_network_discovery",
      ],
    },
    trustBoundaries: {
      hostedTeeReady: Boolean(config.blockyAsApiKey && config.blockyAsHost),
      hostedTeeStatus: config.blockyAsApiKey && config.blockyAsHost ? "configured" : "pending_hosted_access",
      paymentUnlockRule: "payment unlocks only after verified proof",
      noPlaceholderProofUnlock: true,
      noFakeLlmSuccess: true,
    },
  };
}

export function registerIntegrationRoutes(app: FastifyInstance): void {
  app.get("/api/integrations/agent-manifest", async (_request: FastifyRequest, reply: FastifyReply) => {
    return reply.send(buildAgentManifest());
  });

  // ── CSPR.cloud health ──
  app.get("/api/integrations/cspr-cloud/status", async (_request: FastifyRequest, reply: FastifyReply) => {
    const health = await getCsprCloudHealth();
    return reply.send(health);
  });

  // ── CSPR.cloud deploy confirmation ──
  app.get("/api/integrations/cspr-cloud/deploys/:deployHash", async (request: FastifyRequest, reply: FastifyReply) => {
    const { deployHash } = request.params as { deployHash: string };
    if (!deployHash) return reply.status(400).send({ error: "deployHash is required" });
    const confirmation = await getDeployConfirmation(deployHash);
    return reply.send(confirmation);
  });

  // ── CSPR.cloud latest CSPR/USD rate ──
  app.get("/api/integrations/cspr-cloud/rates/cspr/latest", async (_request: FastifyRequest, reply: FastifyReply) => {
    try {
      const rate = await getLatestCsprUsdRate();
      return reply.send(rate);
    } catch (err) {
      return reply.status(502).send({ error: err instanceof Error ? err.message : String(err) });
    }
  });
}
