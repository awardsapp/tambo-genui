"use client";

/**
 * Thread List Query Hook
 *
 * React Query hook for fetching a list of threads.
 */

import type { UseQueryOptions } from "@tanstack/react-query";
import type {
  ThreadListParams,
  ThreadListResponse,
} from "@workspace/typescript-sdk/resources/threads/threads";
import { useGenuiClient } from "../../providers/genui-client-provider";
import { useGenuiQuery } from "../../hooks/react-query-hooks";
import { useGenuiConfig } from "../providers/genui-v1-provider";
import { useGenuiAuthState } from "./use-genui-v1-auth-state";

/**
 * Options for fetching thread list.
 * Re-exported from SDK for convenience.
 * Note: userKey can also be provided via GenuiProvider context.
 */
export type { ThreadListParams as ThreadListOptions };

/**
 * Hook to fetch a list of threads.
 *
 * Uses React Query for caching and automatic refetching.
 * Threads are considered stale after 5 seconds.
 *
 * Returns the thread list directly from the SDK with no transformation.
 * Each thread includes runStatus, metadata, and all SDK fields.
 * @param listOptions - Filtering and pagination options
 * @param queryOptions - Additional React Query options
 * @returns React Query query object with thread list
 * @example
 * ```tsx
 * function ThreadList({ userKey }: { userKey?: string }) {
 *   const { data, isLoading, isError } = useGenuiThreadList({
 *     userKey,
 *     limit: 20,
 *   });
 *
 *   if (isLoading) return <Spinner />;
 *   if (isError) return <Error />;
 *
 *   return (
 *     <ul>
 *       {data.threads.map(thread => (
 *         <li key={thread.id}>
 *           {thread.id} - {thread.runStatus}
 *         </li>
 *       ))}
 *       {data.hasMore && <LoadMoreButton cursor={data.nextCursor} />}
 *     </ul>
 *   );
 * }
 * ```
 */
export function useGenuiThreadList(
  listOptions?: ThreadListParams,
  queryOptions?: Omit<
    UseQueryOptions<ThreadListResponse>,
    "queryKey" | "queryFn"
  >,
) {
  const client = useGenuiClient();
  const { userKey: contextUserKey } = useGenuiConfig();
  const authState = useGenuiAuthState();
  const isIdentified = authState.status === "identified";

  // Merge userKey from context with provided options (explicit option takes precedence)
  const effectiveOptions: ThreadListParams | undefined =
    (listOptions?.userKey ?? contextUserKey)
      ? { ...listOptions, userKey: listOptions?.userKey ?? contextUserKey }
      : listOptions;

  return useGenuiQuery({
    queryKey: ["v1-threads", "list", effectiveOptions],
    queryFn: async () => await client.threads.list(effectiveOptions),
    staleTime: 5000, // Consider stale after 5s
    ...queryOptions,
    enabled: isIdentified && (queryOptions?.enabled ?? true),
  });
}
