import { EventType, type RunStartedEvent } from "@ag-ui/core";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, act } from "@testing-library/react";
import React from "react";
import {
  GenuiStreamProvider,
  useStreamState,
  useStreamDispatch,
  useThreadManagement,
} from "./genui-v1-stream-context";

// Mock useGenuiClient and useGenuiQueryClient to avoid GenuiClientProvider dependency
jest.mock("../../providers/genui-client-provider", () => ({
  useGenuiClient: jest.fn(() => ({
    threads: {
      messages: {
        list: jest.fn().mockResolvedValue({ messages: [], hasMore: false }),
      },
      retrieve: jest.fn().mockResolvedValue({}),
    },
  })),
  useGenuiQueryClient: jest.fn(),
}));

// Mock useGenuiConfig to avoid GenuiProvider dependency
jest.mock("./genui-v1-provider", () => {
  const actual = jest.requireActual("./genui-v1-provider");
  return {
    ...actual,
    useGenuiConfig: () => ({ userKey: undefined }),
  };
});

// Import for mocking
import { useGenuiQueryClient } from "../../providers/genui-client-provider";

describe("GenuiStreamProvider", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });
    // Configure mock to return the test's queryClient
    jest.mocked(useGenuiQueryClient).mockReturnValue(queryClient);
  });

  const createWrapper = () => {
    return function Wrapper({ children }: { children: React.ReactNode }) {
      return (
        <QueryClientProvider client={queryClient}>
          <GenuiStreamProvider>{children}</GenuiStreamProvider>
        </QueryClientProvider>
      );
    };
  };
  describe("useStreamState", () => {
    it("throws when used outside provider", () => {
      // Suppress console.error for expected error
      const consoleSpy = jest
        .spyOn(console, "error")
        .mockImplementation(() => {});

      expect(() => {
        renderHook(() => useStreamState());
      }).toThrow("useStreamState must be used within GenuiStreamProvider");

      consoleSpy.mockRestore();
    });

    it("returns initial state with placeholder thread ready for new messages", () => {
      const { result } = renderHook(() => useStreamState(), {
        wrapper: createWrapper(),
      });

      // Initial state should have placeholder thread ready for optimistic UI
      expect(result.current.currentThreadId).toBe("placeholder");
      expect(result.current.threadMap.placeholder).toBeDefined();
      expect(result.current.threadMap.placeholder.thread.id).toBe(
        "placeholder",
      );
      expect(result.current.threadMap.placeholder.thread.messages).toEqual([]);
      expect(result.current.threadMap.placeholder.streaming.status).toBe(
        "idle",
      );
    });

    it("initializes thread via dispatch", () => {
      const { result } = renderHook(
        () => ({
          state: useStreamState(),
          dispatch: useStreamDispatch(),
        }),
        { wrapper: createWrapper() },
      );

      act(() => {
        result.current.dispatch({
          type: "INIT_THREAD",
          threadId: "thread_123",
        });
      });

      expect(result.current.state.threadMap.thread_123).toBeDefined();
      expect(result.current.state.threadMap.thread_123.thread.id).toBe(
        "thread_123",
      );
      expect(result.current.state.threadMap.thread_123.thread.status).toBe(
        "idle",
      );
      expect(result.current.state.threadMap.thread_123.thread.messages).toEqual(
        [],
      );
    });

    it("initializes thread with initial data via dispatch", () => {
      const { result } = renderHook(
        () => ({
          state: useStreamState(),
          dispatch: useStreamDispatch(),
        }),
        { wrapper: createWrapper() },
      );

      act(() => {
        result.current.dispatch({
          type: "INIT_THREAD",
          threadId: "thread_123",
          initialThread: {
            name: "Test Thread",
            metadata: { key: "value" },
          },
        });
      });

      expect(result.current.state.threadMap.thread_123.thread.name).toBe(
        "Test Thread",
      );
      expect(result.current.state.threadMap.thread_123.thread.metadata).toEqual(
        {
          key: "value",
        },
      );
      // Default values should still be set
      expect(result.current.state.threadMap.thread_123.thread.status).toBe(
        "idle",
      );
    });
  });

  describe("useStreamDispatch", () => {
    it("throws when used outside provider", () => {
      const consoleSpy = jest
        .spyOn(console, "error")
        .mockImplementation(() => {});

      expect(() => {
        renderHook(() => useStreamDispatch());
      }).toThrow("useStreamDispatch must be used within GenuiStreamProvider");

      consoleSpy.mockRestore();
    });

    it("dispatches events to update state", () => {
      const { result } = renderHook(
        () => ({
          state: useStreamState(),
          dispatch: useStreamDispatch(),
        }),
        { wrapper: createWrapper() },
      );

      // Initialize the thread first
      act(() => {
        result.current.dispatch({
          type: "INIT_THREAD",
          threadId: "thread_123",
        });
      });

      const runStartedEvent: RunStartedEvent = {
        type: EventType.RUN_STARTED,
        runId: "run_1",
        threadId: "thread_123",
      };

      act(() => {
        result.current.dispatch({
          type: "EVENT",
          event: runStartedEvent,
          threadId: "thread_123",
        });
      });

      expect(result.current.state.threadMap.thread_123.thread.status).toBe(
        "streaming",
      );
      expect(result.current.state.threadMap.thread_123.streaming.status).toBe(
        "streaming",
      );
      expect(result.current.state.threadMap.thread_123.streaming.runId).toBe(
        "run_1",
      );
    });
  });

  describe("useThreadManagement", () => {
    it("throws when used outside provider", () => {
      const consoleSpy = jest
        .spyOn(console, "error")
        .mockImplementation(() => {});

      expect(() => {
        renderHook(() => useThreadManagement());
      }).toThrow("useThreadManagement must be used within GenuiStreamProvider");

      consoleSpy.mockRestore();
    });

    it("initThread creates a new thread", () => {
      const { result } = renderHook(
        () => ({
          state: useStreamState(),
          management: useThreadManagement(),
        }),
        { wrapper: createWrapper() },
      );

      act(() => {
        result.current.management.initThread("thread_456");
      });

      expect(result.current.state.threadMap.thread_456).toBeDefined();
      expect(result.current.state.threadMap.thread_456.thread.id).toBe(
        "thread_456",
      );
    });

    it("switchThread changes currentThreadId", () => {
      const { result } = renderHook(
        () => ({
          state: useStreamState(),
          management: useThreadManagement(),
        }),
        { wrapper: createWrapper() },
      );

      // Initialize and switch to a thread
      act(() => {
        result.current.management.initThread("thread_789");
        result.current.management.switchThread("thread_789");
      });

      expect(result.current.state.currentThreadId).toBe("thread_789");
    });

    it("startNewThread creates temp thread and switches to it", () => {
      const { result } = renderHook(
        () => ({
          state: useStreamState(),
          management: useThreadManagement(),
        }),
        { wrapper: createWrapper() },
      );

      let tempId: string;
      act(() => {
        tempId = result.current.management.startNewThread();
      });

      expect(tempId!).toBe("placeholder");
      expect(result.current.state.currentThreadId).toBe("placeholder");
      expect(result.current.state.threadMap.placeholder).toBeDefined();
    });
  });

  describe("validation", () => {
    it("throws when state is provided without dispatch", () => {
      const consoleSpy = jest
        .spyOn(console, "error")
        .mockImplementation(() => {});

      const Wrapper = ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={queryClient}>
          <GenuiStreamProvider state={{} as never}>
            {children}
          </GenuiStreamProvider>
        </QueryClientProvider>
      );

      expect(() => {
        renderHook(() => useStreamState(), { wrapper: Wrapper });
      }).toThrow(
        "GenuiStreamProvider requires both state and dispatch when overriding",
      );

      consoleSpy.mockRestore();
    });

    it("throws when dispatch is provided without state", () => {
      const consoleSpy = jest
        .spyOn(console, "error")
        .mockImplementation(() => {});

      const Wrapper = ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={queryClient}>
          <GenuiStreamProvider dispatch={jest.fn()}>
            {children}
          </GenuiStreamProvider>
        </QueryClientProvider>
      );

      expect(() => {
        renderHook(() => useStreamState(), { wrapper: Wrapper });
      }).toThrow(
        "GenuiStreamProvider requires both state and dispatch when overriding",
      );

      consoleSpy.mockRestore();
    });

    it("throws when threadManagement is missing required methods", () => {
      const consoleSpy = jest
        .spyOn(console, "error")
        .mockImplementation(() => {});

      const Wrapper = ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={queryClient}>
          <GenuiStreamProvider
            threadManagement={{ initThread: "not-a-function" } as never}
          >
            {children}
          </GenuiStreamProvider>
        </QueryClientProvider>
      );

      expect(() => {
        renderHook(() => useStreamState(), { wrapper: Wrapper });
      }).toThrow(
        "GenuiStreamProvider: threadManagement override is missing required methods",
      );

      consoleSpy.mockRestore();
    });
  });
});
