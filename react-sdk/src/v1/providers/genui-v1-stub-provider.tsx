"use client";

/**
 * GenuiStubProvider - Mock Provider for Testing
 *
 * Provides stubbed versions of all contexts for testing components
 * that use Genui hooks without making real API calls.
 * @example
 * ```tsx
 * const mockThread = {
 *   id: "thread_123",
 *   messages: [
 *     { id: "msg_1", role: "user", content: [{ type: "text", text: "Hello" }], createdAt: "..." },
 *     { id: "msg_2", role: "assistant", content: [{ type: "text", text: "Hi!" }], createdAt: "..." },
 *   ],
 *   status: "idle",
 *   createdAt: "2024-01-01T00:00:00Z",
 *   updatedAt: "2024-01-01T00:00:00Z",
 * };
 *
 * function TestComponent() {
 *   return (
 *     <GenuiStubProvider thread={mockThread}>
 *       <MyComponent />
 *     </GenuiStubProvider>
 *   );
 * }
 * ```
 */

import GenuiAI from "@workspace/typescript-sdk";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React, { useMemo, type PropsWithChildren } from "react";
import type {
  GenuiComponent,
  GenuiTool,
  GenuiToolRegistry,
} from "../../model/component-metadata";
import { GenuiClientContext } from "../../providers/genui-client-provider";
import { GenuiRegistryContext } from "../../providers/genui-registry-provider";
import type { GenuiThreadMessage } from "../types/message";
import type { GenuiThread } from "@workspace/client";
import type { StreamAction, StreamState, ThreadState } from "@workspace/client";
import { GenuiConfigContext, type GenuiConfig } from "./genui-v1-provider";
import {
  GenuiStreamProvider,
  type ThreadManagement,
} from "./genui-v1-stream-context";
import {
  GenuiThreadInputContext,
  type GenuiThreadInputContextProps,
} from "./genui-v1-thread-input-provider";

/**
 * Props for GenuiStubProvider
 */
export interface GenuiStubProviderProps {
  /**
   * Thread data to display.
   * Can be a full GenuiThread or just an array of messages.
   */
  thread?: GenuiThread | { messages: GenuiThreadMessage[] };

  /**
   * Optional thread ID. Defaults to "stub_thread" or thread.id if provided.
   */
  threadId?: string;

  /**
   * Components to register with the registry.
   */
  components?: GenuiComponent[];

  /**
   * Tools to register with the registry.
   */
  tools?: GenuiTool[];

  /**
   * User key for the config context.
   */
  userKey?: string;

  /**
   * Initial input value for the thread input context.
   */
  inputValue?: string;

  /**
   * Whether the thread is currently streaming.
   */
  isStreaming?: boolean;

  /**
   * Override for the submit function.
   * If not provided, submit will be a no-op that returns the threadId.
   */
  onSubmit?: () => Promise<{ threadId: string }>;

  /**
   * Override for the setValue function.
   */
  onSetValue?: (value: string | ((prev: string) => string)) => void;

  /**
   * Override for startNewThread.
   */
  onStartNewThread?: () => string;

  /**
   * Override for switchThread.
   */
  onSwitchThread?: (threadId: string | null) => void;

  /**
   * Override for initThread.
   */
  onInitThread?: (threadId: string) => void;
}

/**
 * Creates a default GenuiThread from messages or returns the full thread.
 * @returns A normalized thread object
 */
function normalizeThread(
  threadData: GenuiThread | { messages: GenuiThreadMessage[] } | undefined,
  threadId: string,
): GenuiThread {
  if (!threadData) {
    return {
      id: threadId,
      messages: [],
      status: "idle",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastRunCancelled: false,
    };
  }

  if ("id" in threadData && "status" in threadData) {
    return threadData;
  }

  return {
    id: threadId,
    messages: threadData.messages,
    status: "idle",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    lastRunCancelled: false,
  };
}

/**
 * GenuiStubProvider provides mock implementations of all contexts
 * for testing components that use Genui hooks.
 *
 * All operations are no-ops by default, returning stub data.
 * Override specific behaviors via props as needed for testing.
 * Stream state is derived once from props and is not updated by thread management.
 * @returns A provider wrapper suitable for tests
 */
export function GenuiStubProvider({
  children,
  thread: threadData,
  threadId: providedThreadId,
  components = [],
  tools = [],
  userKey,
  inputValue: initialInputValue = "",
  isStreaming = false,
  onSubmit,
  onSetValue,
  onStartNewThread,
  onSwitchThread,
  onInitThread,
}: PropsWithChildren<GenuiStubProviderProps>) {
  // Determine thread ID
  const threadId =
    providedThreadId ??
    (threadData && "id" in threadData ? threadData.id : "stub_thread");

  // Normalize thread data
  const thread = normalizeThread(threadData, threadId);

  // Create stub QueryClient
  const queryClient = useMemo(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { retry: false },
          mutations: { retry: false },
        },
      }),
    [],
  );

  // Create stub client
  const stubClient = useMemo(() => ({}) as GenuiAI, []);

  // Build component registry
  const componentList = useMemo(() => {
    const list: GenuiRegistryContext["componentList"] = {};

    for (const component of components) {
      list[component.name] = {
        component: component.component,
        loadingComponent: component.loadingComponent,
        name: component.name,
        description: component.description,
        props: component.propsDefinition ?? {},
        contextTools: [],
      };
    }

    return list;
  }, [components]);

  // Build tool registry
  const toolRegistry = useMemo(() => {
    return tools.reduce((acc, tool) => {
      acc[tool.name] = tool;
      return acc;
    }, {} as GenuiToolRegistry);
  }, [tools]);

  // Stream state
  const streamState = useMemo<StreamState>(() => {
    const threadState: ThreadState = {
      thread,
      streaming: {
        status: isStreaming ? "streaming" : "idle",
      },
      accumulatingToolArgs: {},
    };

    return {
      threadMap: { [threadId]: threadState },
      currentThreadId: threadId,
    };
  }, [thread, threadId, isStreaming]);

  // Stream dispatch (no-op)
  const streamDispatch = useMemo<React.Dispatch<StreamAction>>(
    () => () => {},
    [],
  );

  // Thread management
  const threadManagement = useMemo<ThreadManagement>(
    () => ({
      initThread: onInitThread ?? (() => {}),
      switchThread: onSwitchThread ?? (() => {}),
      startNewThread:
        onStartNewThread ??
        (() => {
          const newId = `stub_${crypto.randomUUID()}`;
          return newId;
        }),
    }),
    [onInitThread, onSwitchThread, onStartNewThread],
  );

  // Config context
  const config = useMemo<GenuiConfig>(() => ({ userKey }), [userKey]);

  // Input state (managed internally for stub)
  const [inputValue, setInputValueInternal] = React.useState(initialInputValue);

  // Thread input context
  const threadInputContext = useMemo<GenuiThreadInputContextProps>(() => {
    const setValue: React.Dispatch<React.SetStateAction<string>> =
      onSetValue ?? setInputValueInternal;

    const submit: GenuiThreadInputContextProps["submit"] =
      onSubmit ??
      (async () => {
        return { threadId };
      });

    return {
      value: inputValue,
      setValue,
      submit,
      threadId,
      setThreadId: () => {},
      images: [],
      addImage: async () => {},
      addImages: async () => {},
      removeImage: () => {},
      clearImages: () => {},
      isPending: false,
      isError: false,
      error: null,
      isIdle: true,
      isSuccess: false,
      status: "idle",
      data: undefined,
      variables: undefined,
      failureCount: 0,
      failureReason: null,
      reset: () => {},
      context: undefined,
      submittedAt: 0,
      isPaused: false,
      isDisabled: false,
    };
  }, [inputValue, threadId, onSubmit, onSetValue, setInputValueInternal]);

  // Registry context
  const registryContext = useMemo<GenuiRegistryContext>(
    () => ({
      componentList,
      toolRegistry,
      componentToolAssociations: {},
      mcpServerInfos: [],
      resources: [],
      resourceSource: null,
      onCallUnregisteredTool: undefined,
      registerComponent: () => {},
      registerTool: () => {},
      registerTools: () => {},
      unregisterTools: () => {},
      addToolAssociation: () => {},
      registerMcpServer: () => {},
      registerMcpServers: () => {},
      registerResource: () => {},
      registerResources: () => {},
      registerResourceSource: () => {},
    }),
    [componentList, toolRegistry],
  );

  // Client context
  const clientContext = useMemo(
    () => ({
      client: stubClient,
      queryClient,
      isUpdatingToken: false,
      tokenExchangeError: null,
      userToken: undefined,
      hasValidToken: false,
    }),
    [stubClient, queryClient],
  );

  return (
    <QueryClientProvider client={queryClient}>
      <GenuiClientContext.Provider value={clientContext}>
        <GenuiRegistryContext.Provider value={registryContext}>
          <GenuiConfigContext.Provider value={config}>
            <GenuiStreamProvider
              state={streamState}
              dispatch={streamDispatch}
              threadManagement={threadManagement}
            >
              <GenuiThreadInputContext.Provider value={threadInputContext}>
                {children}
              </GenuiThreadInputContext.Provider>
            </GenuiStreamProvider>
          </GenuiConfigContext.Provider>
        </GenuiRegistryContext.Provider>
      </GenuiClientContext.Provider>
    </QueryClientProvider>
  );
}
