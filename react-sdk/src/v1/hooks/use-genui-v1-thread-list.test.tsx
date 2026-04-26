import GenuiAI from "@workspace/typescript-sdk";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import React from "react";
import {
  useGenuiClient,
  useGenuiQueryClient,
} from "../../providers/genui-client-provider";
import { useGenuiConfig } from "../providers/genui-v1-provider";
import { useGenuiThreadList } from "./use-genui-v1-thread-list";

jest.mock("../../providers/genui-client-provider", () => ({
  useGenuiClient: jest.fn(),
  useGenuiQueryClient: jest.fn(),
}));

jest.mock("../providers/genui-v1-provider", () => ({
  useGenuiConfig: jest.fn(),
}));

jest.mock("./use-genui-v1-auth-state", () => ({
  useGenuiAuthState: () => ({
    status: "identified",
    source: "userKey",
  }),
}));

describe("useGenuiThreadList", () => {
  const mockThreads = {
    threads: [
      { id: "thread_1", runStatus: "idle" },
      { id: "thread_2", runStatus: "idle" },
    ],
    hasMore: false,
    nextCursor: undefined,
  };

  const mockThreadsApi = {
    retrieve: jest.fn(),
    list: jest.fn(),
  };

  const mockGenuiAI = {
    apiKey: "",
    threads: mockThreadsApi,
  } as unknown as GenuiAI;

  let queryClient: QueryClient;

  function TestWrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  }

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });
    jest.mocked(useGenuiClient).mockReturnValue(mockGenuiAI);
    jest.mocked(useGenuiQueryClient).mockReturnValue(queryClient);
    jest.mocked(useGenuiConfig).mockReturnValue({ userKey: undefined });
    mockThreadsApi.list.mockReset();
  });

  it("fetches thread list", async () => {
    mockThreadsApi.list.mockResolvedValue(mockThreads);

    const { result } = renderHook(() => useGenuiThreadList(), {
      wrapper: TestWrapper,
    });

    await waitFor(() => {
      expect(result.current.data).toEqual(mockThreads);
    });

    expect(mockThreadsApi.list).toHaveBeenCalledWith(undefined);
  });

  it("passes list options to API", async () => {
    mockThreadsApi.list.mockResolvedValue(mockThreads);

    const { result } = renderHook(
      () =>
        useGenuiThreadList({
          userKey: "test-context",
          limit: 10,
        }),
      { wrapper: TestWrapper },
    );

    await waitFor(() => {
      expect(result.current.data).toEqual(mockThreads);
    });

    expect(mockThreadsApi.list).toHaveBeenCalledWith({
      userKey: "test-context",
      limit: 10,
    });
  });

  it("handles loading state", async () => {
    let resolvePromise: (value: unknown) => void;
    const promise = new Promise((resolve) => {
      resolvePromise = resolve;
    });
    mockThreadsApi.list.mockReturnValue(promise);

    const { result } = renderHook(() => useGenuiThreadList(), {
      wrapper: TestWrapper,
    });

    expect(result.current.isLoading).toBe(true);
    expect(result.current.data).toBeUndefined();

    resolvePromise!(mockThreads);
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
  });

  it("handles error state", async () => {
    const mockError = new Error("Failed to fetch threads");
    mockThreadsApi.list.mockRejectedValue(mockError);

    const { result } = renderHook(() => useGenuiThreadList(), {
      wrapper: TestWrapper,
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
      expect(result.current.error).toBe(mockError);
    });
  });

  it("uses userKey from config when not provided in options", async () => {
    mockThreadsApi.list.mockResolvedValue(mockThreads);
    jest.mocked(useGenuiConfig).mockReturnValue({ userKey: "config-user-key" });

    const { result } = renderHook(() => useGenuiThreadList(), {
      wrapper: TestWrapper,
    });

    await waitFor(() => {
      expect(result.current.data).toEqual(mockThreads);
    });

    expect(mockThreadsApi.list).toHaveBeenCalledWith({
      userKey: "config-user-key",
    });
  });

  it("prefers explicit userKey over config userKey", async () => {
    mockThreadsApi.list.mockResolvedValue(mockThreads);
    jest.mocked(useGenuiConfig).mockReturnValue({ userKey: "config-user-key" });

    const { result } = renderHook(
      () => useGenuiThreadList({ userKey: "explicit-user-key" }),
      { wrapper: TestWrapper },
    );

    await waitFor(() => {
      expect(result.current.data).toEqual(mockThreads);
    });

    expect(mockThreadsApi.list).toHaveBeenCalledWith({
      userKey: "explicit-user-key",
    });
  });
});
