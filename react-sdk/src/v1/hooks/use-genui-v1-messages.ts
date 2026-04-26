"use client";

/**
 * useGenuiMessages - Messages Hook
 *
 * Provides access to messages in a thread with streaming state awareness.
 * Messages are accumulated from AG-UI events during streaming.
 */

import { useMemo } from "react";
import { useStreamState } from "../providers/genui-v1-stream-context";
import type { GenuiThreadMessage } from "../types/message";

/**
 * Return type for useGenuiMessages hook
 */
export interface UseGenuiThreadMessagesReturn {
  /**
   * All messages in the thread
   */
  messages: GenuiThreadMessage[];

  /**
   * The most recent message (last in the list)
   */
  lastMessage: GenuiThreadMessage | undefined;

  /**
   * User messages only
   */
  userMessages: GenuiThreadMessage[];

  /**
   * Assistant messages only
   */
  assistantMessages: GenuiThreadMessage[];

  /**
   * Whether there are any messages
   */
  hasMessages: boolean;

  /**
   * Total message count
   */
  messageCount: number;
}

/**
 * Hook to access messages in a thread.
 *
 * Provides filtered views of messages (user-only, assistant-only)
 * and metadata about the message list.
 * @param threadId - Thread ID to get messages for
 * @returns Message list and utilities
 * @example
 * ```tsx
 * function MessageList({ threadId }: { threadId: string }) {
 *   const { messages, hasMessages, lastMessage } = useGenuiMessages(threadId);
 *
 *   if (!hasMessages) {
 *     return <EmptyState />;
 *   }
 *
 *   return (
 *     <div>
 *       {messages.map(msg => (
 *         <Message key={msg.id} message={msg} />
 *       ))}
 *     </div>
 *   );
 * }
 * ```
 */
export function useGenuiMessages(
  threadId: string,
): UseGenuiThreadMessagesReturn {
  const streamState = useStreamState();
  const threadState = streamState.threadMap[threadId];

  return useMemo(() => {
    const messages = threadState?.thread.messages ?? [];

    return {
      messages,
      lastMessage: messages[messages.length - 1],
      userMessages: messages.filter((m) => m.role === "user"),
      assistantMessages: messages.filter((m) => m.role === "assistant"),
      hasMessages: messages.length > 0,
      messageCount: messages.length,
    };
  }, [threadState?.thread.messages]);
}
