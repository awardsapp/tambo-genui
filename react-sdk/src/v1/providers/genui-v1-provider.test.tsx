import GenuiAI from "@workspace/typescript-sdk";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, act } from "@testing-library/react";
import React from "react";
import { z } from "zod";
import {
  useGenuiClient,
  useGenuiQueryClient,
} from "../../providers/genui-client-provider";
import { useGenuiRegistry } from "../../providers/genui-registry-provider";
import { useGenuiContextHelpers } from "../../providers/genui-context-helpers-provider";
import { useStreamState, useThreadManagement } from "./genui-v1-stream-context";
import { GenuiProvider, useGenuiConfig } from "./genui-v1-provider";

// Module-level QueryClient for tests - created lazily
let testQueryClient: QueryClient | null = null;

// Mock the client provider to capture the apiKey
jest.mock("../../providers/genui-client-provider", () => {
  return {
    useGenuiClient: jest.fn(),
    useGenuiQueryClient: jest.fn(),
    GenuiClientProvider: jest.fn(
      ({ children }: { children: React.ReactNode }) => children,
    ),
  };
});

// Mock MCP providers to avoid GenuiClientContext dependency
jest.mock("../../providers/genui-mcp-token-provider", () => ({
  GenuiMcpTokenProvider: ({ children }: { children: React.ReactNode }) =>
    children,
}));

jest.mock("../../mcp/genui-mcp-provider", () => ({
  GenuiMcpProvider: ({ children }: { children: React.ReactNode }) => children,
}));

// Mock auth state to avoid GenuiClientContext dependency
jest.mock("../hooks/use-genui-v1-auth-state", () => ({
  useGenuiAuthState: () => ({
    status: "identified",
    source: "userKey",
  }),
}));

// Mock useGenuiSendMessage to avoid complex dependencies
jest.mock("../hooks/use-genui-v1-send-message", () => ({
  useGenuiSendMessage: jest.fn(() => ({
    mutateAsync: jest.fn(),
    mutate: jest.fn(),
    isPending: false,
    isError: false,
    error: null,
    isSuccess: false,
    reset: jest.fn(),
  })),
}));

describe("GenuiProvider", () => {
  const mockFetch: typeof fetch = async (..._args) => {
    throw new Error("fetch not implemented");
  };

  const mockClient = new GenuiAI({
    apiKey: "test-api-key",
    fetch: mockFetch,
  });

  beforeEach(() => {
    // Create a fresh QueryClient for each test
    testQueryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    jest.mocked(useGenuiClient).mockReturnValue(mockClient);
    jest.mocked(useGenuiQueryClient).mockReturnValue(testQueryClient);

    // Mock GenuiClientProvider to wrap children with QueryClientProvider
    const { GenuiClientProvider } = jest.requireMock(
      "../../providers/genui-client-provider",
    );
    jest
      .mocked(GenuiClientProvider)
      .mockImplementation(({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={testQueryClient!}>
          {children}
        </QueryClientProvider>
      ));
  });

  it("provides access to registry context", () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <GenuiProvider apiKey="test-api-key">{children}</GenuiProvider>
    );

    const { result } = renderHook(() => useGenuiRegistry(), { wrapper });

    expect(result.current.componentList).toBeDefined();
    expect(result.current.toolRegistry).toBeDefined();
    expect(typeof result.current.registerComponent).toBe("function");
    expect(typeof result.current.registerTool).toBe("function");
  });

  it("provides access to stream context with placeholder thread ready", () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <GenuiProvider apiKey="test-api-key">{children}</GenuiProvider>
    );

    const { result } = renderHook(() => useStreamState(), { wrapper });

    expect(result.current.threadMap).toBeDefined();
    // Initial state has placeholder thread for optimistic UI
    expect(result.current.currentThreadId).toBe("placeholder");
    expect(result.current.threadMap.placeholder).toBeDefined();
  });

  it("manages threads via useThreadManagement", () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <GenuiProvider apiKey="test-api-key">{children}</GenuiProvider>
    );

    const { result } = renderHook(
      () => ({
        state: useStreamState(),
        management: useThreadManagement(),
      }),
      { wrapper },
    );

    // Initially has placeholder thread for optimistic UI
    expect(result.current.state.currentThreadId).toBe("placeholder");

    // Initialize and switch to a different thread
    act(() => {
      result.current.management.initThread("thread_123");
      result.current.management.switchThread("thread_123");
    });

    expect(result.current.state.currentThreadId).toBe("thread_123");
    expect(result.current.state.threadMap.thread_123).toBeDefined();
  });

  it("provides access to query client via useGenuiQueryClient", () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <GenuiProvider apiKey="test-api-key">{children}</GenuiProvider>
    );

    const { result } = renderHook(() => useGenuiQueryClient(), { wrapper });

    expect(result.current).toBeInstanceOf(QueryClient);
  });

  it("registers components when provided", () => {
    const TestComponent = () => <div>Test</div>;
    const propsSchema = z.object({
      title: z.string().describe("The title"),
    });
    const components = [
      {
        name: "TestComponent",
        description: "A test component",
        component: TestComponent,
        propsSchema,
      },
    ];

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <GenuiProvider apiKey="test-api-key" components={components}>
        {children}
      </GenuiProvider>
    );

    const { result } = renderHook(() => useGenuiRegistry(), { wrapper });

    expect(result.current.componentList.TestComponent).toBeDefined();
    expect(result.current.componentList.TestComponent.name).toBe(
      "TestComponent",
    );
  });

  it("registers tools when provided", () => {
    const inputSchema = z.object({
      query: z.string().describe("Search query"),
    });
    const outputSchema = z.string().describe("Result string");
    const tools = [
      {
        name: "testTool",
        description: "A test tool",
        tool: async () => "result",
        inputSchema,
        outputSchema,
      },
    ];

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <GenuiProvider apiKey="test-api-key" tools={tools}>
        {children}
      </GenuiProvider>
    );

    const { result } = renderHook(() => useGenuiRegistry(), { wrapper });

    expect(result.current.toolRegistry.testTool).toBeDefined();
    expect(result.current.toolRegistry.testTool.name).toBe("testTool");
  });

  it("registers MCP servers when provided", () => {
    const mcpServers = [
      { url: "https://mcp.example.com", name: "Example MCP" },
    ];

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <GenuiProvider apiKey="test-api-key" mcpServers={mcpServers}>
        {children}
      </GenuiProvider>
    );

    const { result } = renderHook(() => useGenuiRegistry(), { wrapper });

    expect(result.current.mcpServerInfos).toHaveLength(1);
    expect(result.current.mcpServerInfos[0].url).toBe(
      "https://mcp.example.com",
    );
  });

  it("provides onCallUnregisteredTool to registry", () => {
    const onCallUnregisteredTool = jest
      .fn()
      .mockResolvedValue("fallback result");

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <GenuiProvider
        apiKey="test-api-key"
        onCallUnregisteredTool={onCallUnregisteredTool}
      >
        {children}
      </GenuiProvider>
    );

    const { result } = renderHook(() => useGenuiRegistry(), { wrapper });

    expect(result.current.onCallUnregisteredTool).toBe(onCallUnregisteredTool);
  });

  it("registers static resources when provided", () => {
    const resources = [
      {
        uri: "resource://test/example",
        name: "Test Resource",
        description: "A test resource",
        mimeType: "text/plain",
      },
    ];

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <GenuiProvider apiKey="test-api-key" resources={resources}>
        {children}
      </GenuiProvider>
    );

    const { result } = renderHook(() => useGenuiRegistry(), { wrapper });

    expect(result.current.resources).toHaveLength(1);
    expect(result.current.resources[0].uri).toBe("resource://test/example");
    expect(result.current.resources[0].name).toBe("Test Resource");
  });

  it("registers resource source when listResources and getResource provided", () => {
    const listResources = jest.fn().mockResolvedValue({ resources: [] });
    const getResource = jest.fn().mockResolvedValue({ contents: [] });

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <GenuiProvider
        apiKey="test-api-key"
        listResources={listResources}
        getResource={getResource}
      >
        {children}
      </GenuiProvider>
    );

    const { result } = renderHook(() => useGenuiRegistry(), { wrapper });

    expect(result.current.resourceSource).toBeDefined();
    expect(result.current.resourceSource?.listResources).toBe(listResources);
    expect(result.current.resourceSource?.getResource).toBe(getResource);
  });

  it("provides userKey via useGenuiConfig", () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <GenuiProvider apiKey="test-api-key" userKey="my-user-key">
        {children}
      </GenuiProvider>
    );

    const { result } = renderHook(() => useGenuiConfig(), { wrapper });

    expect(result.current.userKey).toBe("my-user-key");
  });

  it("returns undefined userKey from useGenuiConfig when no userKey provided", () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <GenuiProvider apiKey="test-api-key">{children}</GenuiProvider>
    );

    const { result } = renderHook(() => useGenuiConfig(), { wrapper });

    expect(result.current.userKey).toBeUndefined();
  });

  it("provides context helpers via useGenuiContextHelpers hook", async () => {
    const contextHelpers = {
      getUserName: () => "Test User",
      getCurrentTime: () => new Date().toISOString(),
    };

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <GenuiProvider apiKey="test-api-key" contextHelpers={contextHelpers}>
        {children}
      </GenuiProvider>
    );

    const { result, rerender } = renderHook(() => useGenuiContextHelpers(), {
      wrapper,
    });

    // Helpers are registered via useEffect, so we need to trigger a rerender
    await act(async () => {
      rerender();
    });

    const helpers = result.current.getContextHelpers();
    expect(helpers.getUserName).toBe(contextHelpers.getUserName);
    expect(helpers.getCurrentTime).toBe(contextHelpers.getCurrentTime);
  });

  it("returns only interactables contextHelper when none explicitly provided", async () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <GenuiProvider apiKey="test-api-key">{children}</GenuiProvider>
    );

    const { result } = renderHook(() => useGenuiContextHelpers(), { wrapper });

    const helpers = result.current.getContextHelpers();
    // GenuiInteractableProvider registers "interactables" and GenuiContextAttachmentProvider registers "contextAttachments"
    expect(Object.keys(helpers)).toEqual([
      "interactables",
      "contextAttachments",
    ]);
  });
});
