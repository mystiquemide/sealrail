import { describe, expect, it } from "vitest";
import { ecosystemIntegrations } from "./ecosystem";

describe("ecosystemIntegrations", () => {
  it("separates live integration surfaces from roadmap items", () => {
    expect(ecosystemIntegrations.live.map((item) => item.title)).toEqual(
      expect.arrayContaining(["Casper testnet", "Odra ProofRegistry", "x402-compatible receipts", "MCP server"])
    );
    expect(ecosystemIntegrations.roadmap.map((item) => item.title)).toEqual(
      expect.arrayContaining(["Agent wallet identity", "External agent frameworks"])
    );
    expect(ecosystemIntegrations.agentManifestPath).toBe("/api/integrations/agent-manifest");
  });
});
