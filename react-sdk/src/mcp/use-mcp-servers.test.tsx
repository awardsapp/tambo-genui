import { render, waitFor } from "@testing-library/react";
import React, { useEffect } from "react";
import { GenuiMcpTokenProvider } from "../providers/genui-mcp-token-provider";
import { GenuiRegistryProvider } from "../providers/genui-registry-provider";
import { GenuiClientContext } from "../providers/genui-client-provider";
import { QueryClient } from "@tanstack/react-query";
import {
  GenuiMcpProvider,
  useGenuiMcpServers,
  type McpServer,
} from "./genui-mcp-provider";

// Mock the registry to provide a no-op registerTool
// Do not mock the registry; use the real provider in render

// Provide a minimal client context instead of mocking the hook

// Mock the MCP client; use a mutable implementation to avoid TDZ issues
let createImpl: jest.Mock = jest.fn();
jest.mock("@workspace/client", () => ({
  ...jest.requireActual("@workspace/client"),
  MCPClient: { create: (...args: any[]) => createImpl(...args) },
  MCPTransport: { SSE: "sse", HTTP: "http" },
}));

// Import after mocks note: jest.mock calls are hoisted, so standard imports are fine

describe("useGenuiMcpServers + GenuiMcpProvider", () => {
  beforeEach(() => {
    createImpl = jest.fn();
  });

  it("provides normalized MCP server entries to inner components", async () => {
    const fakeClient = { listTools: jest.fn().mockResolvedValue([]) } as any;
    createImpl.mockResolvedValue(fakeClient);

    const Inner: React.FC = () => {
      const servers = useGenuiMcpServers();
      return (
        <div>
          <div data-testid="count">{servers.length}</div>
          <div data-testid="urls">{servers.map((s) => s.url).join(",")}</div>
        </div>
      );
    };

    const { getByTestId } = render(
      <GenuiClientContext.Provider
        value={{
          client: { baseURL: "https://api.genui.co" } as any,
          queryClient: new QueryClient(),
          isUpdatingToken: false,
          tokenExchangeError: null,
          userToken: undefined,
          hasValidToken: false,
        }}
      >
        <GenuiRegistryProvider
          mcpServers={[{ url: "https://one.example" }, "https://two.example"]}
        >
          <GenuiMcpTokenProvider>
            <GenuiMcpProvider>
              <Inner />
            </GenuiMcpProvider>
          </GenuiMcpTokenProvider>
        </GenuiRegistryProvider>
      </GenuiClientContext.Provider>,
    );

    await waitFor(() => {
      expect(getByTestId("count").textContent).toBe("2");
      const urls = getByTestId("urls").textContent || "";
      expect(urls).toContain("https://one.example");
      expect(urls).toContain("https://two.example");
    });
  });

  it("marks a successfully connected server with a client instance", async () => {
    const fakeClient = { listTools: jest.fn().mockResolvedValue([]) } as any;
    createImpl.mockResolvedValue(fakeClient);

    let latest: McpServer[] = [];
    const Capture: React.FC = () => {
      const servers = useGenuiMcpServers();
      useEffect(() => {
        latest = servers;
      }, [servers]);
      return null;
    };

    render(
      <GenuiClientContext.Provider
        value={{
          client: { baseURL: "https://api.genui.co" } as any,
          queryClient: new QueryClient(),
          isUpdatingToken: false,
          tokenExchangeError: null,
          userToken: undefined,
          hasValidToken: false,
        }}
      >
        <GenuiRegistryProvider mcpServers={[{ url: "https://ok.example" }]}>
          <GenuiMcpTokenProvider>
            <GenuiMcpProvider>
              <Capture />
            </GenuiMcpProvider>
          </GenuiMcpTokenProvider>
        </GenuiRegistryProvider>
      </GenuiClientContext.Provider>,
    );

    await waitFor(() => {
      expect(latest.length).toBe(1);
      expect("client" in latest[0]).toBe(true);
      expect((latest[0] as any).client).toBe(fakeClient);
      // no connectionError on connected server
      expect((latest[0] as any).connectionError).toBeUndefined();
    });
  });

  it("marks a failed server with a connectionError and no client", async () => {
    const boom = new Error("boom");
    createImpl.mockRejectedValue(boom);

    let latest: McpServer[] = [];
    const Capture: React.FC = () => {
      const servers = useGenuiMcpServers();
      useEffect(() => {
        latest = servers;
      }, [servers]);
      return null;
    };

    render(
      <GenuiClientContext.Provider
        value={{
          client: { baseURL: "https://api.genui.co" } as any,
          queryClient: new QueryClient(),
          isUpdatingToken: false,
          tokenExchangeError: null,
          userToken: undefined,
          hasValidToken: false,
        }}
      >
        <GenuiRegistryProvider mcpServers={[{ url: "https://fail.example" }]}>
          <GenuiMcpTokenProvider>
            <GenuiMcpProvider>
              <Capture />
            </GenuiMcpProvider>
          </GenuiMcpTokenProvider>
        </GenuiRegistryProvider>
      </GenuiClientContext.Provider>,
    );

    await waitFor(() => {
      expect(latest.length).toBe(1);
      expect("client" in latest[0]).toBe(false);
      // @ts-expect-error narrowing at runtime
      expect(latest[0].connectionError).toBeInstanceOf(Error);
      // @ts-expect-error narrowing at runtime
      expect(latest[0].connectionError?.message).toBe("boom");
    });
  });
});
