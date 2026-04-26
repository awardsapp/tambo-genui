"use client";

/**
 * useGenui - Main Hook
 *
 * Combines all contexts into a single hook for convenient access
 * to thread state, streaming status, registry, and client.
 */

import { EventType } from "@ag-ui/core";
import type GenuiAI from "@workspace/typescript-sdk";
import React, {
  useCallback,
  useContext,
  useMemo,
  useRef,
  type ReactElement,
} from "react";
import {
  useGenuiClient,
  useGenuiQueryClient,
} from "../../providers/genui-client-provider";
import { useGenuiConfig } from "../providers/genui-v1-provider";
import { useGenuiAuthState } from "./use-genui-v1-auth-state";
import type { GenuiAuthState } from "@workspace/client";
import {
  GenuiRegistryContext,
  type GenuiRegistryContext as GenuiRegistryContextType,
} from "../../providers/genui-registry-provider";
import { ComponentRenderer } from "../components/v1-component-renderer";
import {
  useStreamDispatch,
  useStreamState,
  useThreadManagement,
  type ThreadManagement,
} from "../providers/genui-v1-stream-context";
import type {
  Content,
  ReactGenuiThreadMessage,
  GenuiToolDisplayProps,
  GenuiToolUseContent,
} from "../types/message";
import type { StreamingState } from "@workspace/client";
import { isPlaceholderThreadId, type ThreadState } from "@workspace/client";

/**
 * Return type for useGenui hook
 */
export interface UseGenuiReturn {
  /**
   * The Genui API client instance
   */
  client: GenuiAI;

  /**
   * Current thread state for the given threadId, or undefined if not loaded
   */
  thread: ThreadState | undefined;

  /**
   * Messages in the current thread.
   * Component content blocks include `renderedComponent` for direct rendering.
   */
  messages: ReactGenuiThreadMessage[];

  /**
   * Current streaming state
   */
  streamingState: StreamingState;

  /**
   * Whether the thread is currently streaming a response
   */
  isStreaming: boolean;

  /**
   * Whether the thread is waiting for the AI to start responding
   */
  isWaiting: boolean;

  /**
   * Whether the thread is idle (not streaming or waiting)
   */
  isIdle: boolean;

  /**
   * Register a component with the registry
   */
  registerComponent: GenuiRegistryContextType["registerComponent"];

  /**
   * Register a tool with the registry
   */
  registerTool: GenuiRegistryContextType["registerTool"];

  /**
   * Register multiple tools with the registry
   */
  registerTools: GenuiRegistryContextType["registerTools"];

  /**
   * The component registry (Map of name -> component definition)
   */
  componentList: GenuiRegistryContextType["componentList"];

  /**
   * The tool registry (Map of name -> tool definition)
   */
  toolRegistry: GenuiRegistryContextType["toolRegistry"];

  /**
   * Current thread ID (always available - uses "placeholder" for new threads)
   */
  currentThreadId: string;

  /**
   * Initialize a new thread in the stream context
   */
  initThread: ThreadManagement["initThread"];

  /**
   * Switch the current active thread
   */
  switchThread: ThreadManagement["switchThread"];

  /**
   * Start a new thread (generates a temporary ID)
   */
  startNewThread: ThreadManagement["startNewThread"];

  /**
   * Dispatch function for stream events (advanced usage)
   */
  dispatch: ReturnType<typeof useStreamDispatch>;

  /**
   * Cancel the current run on this thread.
   * Optimistically updates local state and sends cancellation request to the API.
   * No-op if there's no active run or thread is a placeholder.
   */
  cancelRun: () => Promise<void>;

  /**
   * Current authentication state.
   * Use this to show auth-related UI or conditionally render features.
   */
  authState: GenuiAuthState;

  /**
   * Shorthand for `authState.status === "identified"`.
   * When true, the SDK is ready to make API calls.
   */
  isIdentified: boolean;

  /**
   * Update a thread's name.
   * Useful for implementing manual thread renaming UI in history sidebars.
   * Cache invalidation is best-effort; failures will be logged and won't reject.
   * @param threadId - ID of the thread to rename
   * @param name - New name for the thread
   * @returns Promise that resolves when the update completes
   */
  updateThreadName: (threadId: string, name: string) => Promise<void>;
}

/**
 * Main hook for accessing Genui functionality.
 *
 * Combines thread state, streaming status, registry, and client
 * into a single convenient hook.
 *
 * Messages returned include renderedComponent on component content blocks,
 * allowing direct rendering via {content.renderedComponent}.
 * @param threadId - Optional thread ID to get state for
 * @returns Combined context with thread state, messages, and utilities
 * @example
 * ```tsx
 * function ChatInterface() {
 *   const {
 *     thread,
 *     messages,
 *     isStreaming,
 *     registerComponent,
 *   } = useGenui('thread_123');
 *
 *   return (
 *     <div>
 *       {messages.map(msg => <Message key={msg.id} message={msg} />)}
 *       {isStreaming && <LoadingIndicator />}
 *     </div>
 *   );
 * }
 * ```
 */
/**
 * Cache entry for a rendered component wrapper.
 * Stores the element and the props JSON used to create it.
 */
interface ComponentCacheEntry {
  element: ReactElement;
  propsJson: string;
}

/**
 *
 * @returns The combined Genui context
 */
export function useGenui(): UseGenuiReturn {
  const client = useGenuiClient();
  const queryClient = useGenuiQueryClient();
  const { userKey } = useGenuiConfig();
  const streamState = useStreamState();
  const dispatch = useStreamDispatch();
  const registry = useContext(GenuiRegistryContext);
  const threadManagement = useThreadManagement();
  const authState = useGenuiAuthState();

  // Cache for rendered component wrappers - maintains stable element references
  // across renders when props haven't changed
  const componentCacheRef = useRef(new Map<string, ComponentCacheEntry>());

  // Get thread state for the current thread
  const threadState = streamState.threadMap[streamState.currentThreadId];

  // Keep a live snapshot of the threadMap for callbacks without forcing them to
  // re-create on every stream state update.
  const threadMapRef = useRef(streamState.threadMap);
  threadMapRef.current = streamState.threadMap;

  // Cancel the current run on this thread
  const cancelRun = useCallback(async () => {
    const runId = threadState?.streaming.runId;
    const threadId = streamState.currentThreadId;

    // No-op if there's no active run or thread is a placeholder
    if (!runId || isPlaceholderThreadId(threadId)) {
      return;
    }

    // Optimistically update local state with RUN_ERROR event
    dispatch({
      type: "EVENT",
      threadId,
      event: {
        type: EventType.RUN_ERROR,
        message: "Run cancelled",
        code: "CANCELLED",
        timestamp: Date.now(),
      },
    });

    // Call API to cancel the run
    try {
      await client.threads.runs.delete(runId, { threadId, userKey });
    } catch (error) {
      // Log but don't rethrow - local state is already updated
      console.warn("Failed to cancel run on server:", error);
    }
  }, [
    client,
    userKey,
    streamState.currentThreadId,
    threadState?.streaming.runId,
    dispatch,
  ]);

  // Update a thread's name
  const updateThreadName = useCallback(
    async (threadId: string, name: string) => {
      await client.threads.update(threadId, { name, userKey });

      if (threadMapRef.current[threadId]) {
        dispatch({
          type: "UPDATE_THREAD_NAME",
          threadId,
          name: name,
        });
      }

      try {
        await Promise.all([
          queryClient.invalidateQueries({
            queryKey: ["v1-threads", "list"],
          }),
          queryClient.invalidateQueries({
            queryKey: ["v1-threads", threadId],
          }),
        ]);
      } catch (error) {
        console.warn(
          "[useGenui] Failed to invalidate thread queries after rename:",
          error,
        );
      }
    },
    [client, userKey, dispatch, queryClient],
  );

  // Memoize the return object to prevent unnecessary re-renders
  return useMemo(() => {
    const thread = threadState;
    const rawMessages = thread?.thread.messages ?? [];
    const streamingState: StreamingState = thread?.streaming ?? {
      status: "idle" as const,
    };

    // Build a set of tool_use IDs that have completed (have a matching tool_result)
    // We need to look across all messages since tool_result might be in a different message
    const completedToolIds = new Set<string>();
    for (const msg of rawMessages) {
      for (const content of msg.content) {
        if (content.type === "tool_result") {
          completedToolIds.add(content.toolUseId);
        }
      }
    }

    // Transform messages to add computed properties to content blocks
    const messages = rawMessages.map((message): ReactGenuiThreadMessage => {
      const transformedContent = message.content.map((content): Content => {
        // Transform tool_use content to add computed state
        if (content.type === "tool_use") {
          const hasCompleted = completedToolIds.has(content.id);
          const input = content.input ?? {};

          // Extract Genui display props from input
          const genuiDisplayProps: GenuiToolDisplayProps = {
            _genui_statusMessage:
              typeof input._genui_statusMessage === "string"
                ? input._genui_statusMessage
                : undefined,
            _genui_completionStatusMessage:
              typeof input._genui_completionStatusMessage === "string"
                ? input._genui_completionStatusMessage
                : undefined,
          };

          // Compute status message based on completion state
          const statusMessage = hasCompleted
            ? (genuiDisplayProps._genui_completionStatusMessage ??
              `Called ${content.name}`)
            : (genuiDisplayProps._genui_statusMessage ??
              `Calling ${content.name}`);

          // Filter out _genui_* properties from input - consumers only see actual tool params
          const cleanInput: Record<string, unknown> = {};
          for (const [key, value] of Object.entries(input)) {
            if (!key.startsWith("_genui_")) {
              cleanInput[key] = value;
            }
          }

          const v1Content: GenuiToolUseContent = {
            ...content,
            input: cleanInput,
            hasCompleted,
            statusMessage,
            genuiDisplayProps,
          };
          return v1Content;
        }

        if (content.type !== "component") {
          return content;
        }

        const componentContent = content;
        const propsJson = JSON.stringify(componentContent.props ?? {});
        const cache = componentCacheRef.current;
        const cached = cache.get(componentContent.id);

        // Return cached element if props haven't changed
        if (cached?.propsJson === propsJson) {
          return {
            ...componentContent,
            renderedComponent: cached.element,
          };
        }

        // Create new wrapper element
        const element = React.createElement(ComponentRenderer, {
          key: componentContent.id,
          content: componentContent,
          threadId: streamState.currentThreadId,
          messageId: message.id,
        });

        // Update cache
        cache.set(componentContent.id, { element, propsJson });

        return {
          ...componentContent,
          renderedComponent: element,
        };
      });

      return {
        ...message,
        content: transformedContent,
      };
    });

    return {
      client,
      thread,
      messages,
      streamingState,
      isStreaming: streamingState.status === "streaming",
      isWaiting: streamingState.status === "waiting",
      isIdle: streamingState.status === "idle",
      registerComponent: registry.registerComponent,
      registerTool: registry.registerTool,
      registerTools: registry.registerTools,
      componentList: registry.componentList,
      toolRegistry: registry.toolRegistry,
      currentThreadId: streamState.currentThreadId,
      initThread: threadManagement.initThread,
      switchThread: threadManagement.switchThread,
      startNewThread: threadManagement.startNewThread,
      dispatch,
      cancelRun,
      authState,
      isIdentified: authState.status === "identified",
      updateThreadName,
    };
  }, [
    cancelRun,
    updateThreadName,
    client,
    threadState,
    registry,
    streamState.currentThreadId,
    threadManagement,
    dispatch,
    authState,
  ]);
}
