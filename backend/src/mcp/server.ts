import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

import { config } from "../config.js";

const DEFAULT_BACKEND_URL = `http://127.0.0.1:${config.port}`;

function backendUrl(path: string): string {
  const base = process.env.SEALRAIL_API_URL || DEFAULT_BACKEND_URL;
  return new URL(path, base).toString();
}

async function fetchJson(path: string, init?: RequestInit): Promise<unknown> {
  const res = await fetch(backendUrl(path), {
    ...init,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  const text = await res.text();
  let body: unknown = text;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    // Keep raw text for non-JSON upstream errors.
  }

  if (!res.ok) {
    return {
      ok: false,
      status: res.status,
      url: backendUrl(path),
      body,
    };
  }

  return body;
}

function asJsonText(data: unknown) {
  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify(data, null, 2),
      },
    ],
  };
}

export function createSealRailMcpServer(): McpServer {
  const server = new McpServer({
    name: "sealrail-mcp",
    version: "0.1.0",
  });

  server.registerTool(
    "sealrail_status",
    {
      title: "SealRail status",
      description: "Read public SealRail backend, Casper, verifier, and trust-boundary status.",
      annotations: { readOnlyHint: true, openWorldHint: true },
    },
    async () => asJsonText(await fetchJson("/api/status"))
  );

  server.registerTool(
    "sealrail_agent_manifest",
    {
      title: "SealRail agent manifest",
      description: "Read SealRail's machine-readable integration manifest for external AI agents.",
      annotations: { readOnlyHint: true, openWorldHint: true },
    },
    async () => asJsonText(await fetchJson("/api/integrations/agent-manifest"))
  );

  server.registerTool(
    "sealrail_list_proofs",
    {
      title: "List SealRail proofs",
      description: "List proof bundles so an AI agent can inspect verified work and payment state.",
      annotations: { readOnlyHint: true, openWorldHint: true },
    },
    async () => asJsonText(await fetchJson("/api/proofs"))
  );

  server.registerTool(
    "sealrail_get_proof",
    {
      title: "Get SealRail proof",
      description: "Fetch a specific proof bundle by proof id.",
      inputSchema: {
        proofId: z.string().min(1).describe("SealRail proof id"),
      },
      annotations: { readOnlyHint: true, openWorldHint: true },
    },
    async ({ proofId }) => asJsonText(await fetchJson(`/api/proofs/${encodeURIComponent(proofId)}`))
  );

  server.registerTool(
    "sealrail_create_payment_task",
    {
      title: "Create SealRail payment-backed task",
      description:
        "Create a payment-backed task through the SealRail API. Requires a SealRail API key supplied by the caller.",
      inputSchema: {
        apiKey: z.string().min(1).describe("SealRail API key. The MCP server never stores this value."),
        agentId: z.string().min(1),
        title: z.string().min(1),
        description: z.string().min(1),
        amount: z.number().positive(),
        currency: z.enum(["CSPR", "USD"]).default("CSPR"),
      },
      annotations: { openWorldHint: true },
    },
    async ({ apiKey, agentId, title, description, amount, currency }) =>
      asJsonText(
        await fetchJson("/api/tasks", {
          method: "POST",
          headers: { Authorization: `Bearer ${apiKey}` },
          body: JSON.stringify({ agent_id: agentId, title, description, amount, currency }),
        })
      )
  );

  return server;
}

export async function runSealRailMcpServer(): Promise<void> {
  const server = createSealRailMcpServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runSealRailMcpServer().catch((err) => {
    console.error("SealRail MCP server failed", err);
    process.exit(1);
  });
}
