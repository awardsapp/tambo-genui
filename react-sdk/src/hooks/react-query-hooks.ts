// genuiHooks.ts
import {
  QueriesOptions,
  QueriesResults,
  QueryKey,
  useMutation,
  UseMutationOptions,
  UseMutationResult,
  useQueries,
  useQuery,
  UseQueryOptions,
  UseQueryResult,
} from "@tanstack/react-query";
import { useGenuiQueryClient } from "../providers/genui-client-provider";

/**
 * Wrapper around useQuery that uses the internal genui query client.
 *
 * Use this instead of useQuery from `@tanstack/react-query`
 * @param options - The options for the query, same as useQuery from `@tanstack/react-query`
 * @returns The query result
 */
export function useGenuiQuery<
  TQueryFnData = unknown,
  TError = Error,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
>(options: UseQueryOptions<TQueryFnData, TError, TData, TQueryKey>) {
  const queryClient = useGenuiQueryClient();
  return useQuery(options, queryClient);
}

/**
 * Wrapper around useMutation that uses the internal genui query client.
 *
 * Use this instead of useMutation from `@tanstack/react-query`
 * @param options - The options for the mutation, same as useMutation from `@tanstack/react-query`
 * @returns The mutation result
 */
export function useGenuiMutation<
  TData = unknown,
  TError = Error,
  TVariables = void,
  TContext = unknown,
>(options: UseMutationOptions<TData, TError, TVariables, TContext>) {
  const queryClient = useGenuiQueryClient();
  return useMutation(options, queryClient);
}

/**
 * Type alias for the result of a mutation.
 */
export type UseGenuiMutationResult<
  TData = unknown,
  TError = Error,
  TVariables = void,
  TContext = unknown,
> = UseMutationResult<TData, TError, TVariables, TContext>;

/**
 * Type alias for the result of a query.
 */
export type UseGenuiQueryResult<
  TData = unknown,
  TError = Error,
> = UseQueryResult<TData, TError>;

/**
 * Wrapper around useQueries that uses the internal genui query client.
 * @param options - The options for the queries, same as useQueries from `@tanstack/react-query`
 * @param options.queries - The queries to run, same as queries from useQueries from `@tanstack/react-query`
 * @param options.combine - The function to combine the results of the queries, same as combine from useQueries from `@tanstack/react-query`
 * @param options.subscribed - Whether to subscribe to the queries, same as subscribed from useQueries from `@tanstack/react-query`
 * @returns The queries result
 */
export function useGenuiQueries<
  T extends any[],
  TCombinedResult = QueriesResults<T>,
>({
  queries,
  ...options
}: {
  queries: readonly [...QueriesOptions<T>];
  combine?: (result: QueriesResults<T>) => TCombinedResult;
  subscribed?: boolean;
}) {
  const queryClient = useGenuiQueryClient();
  return useQueries({ ...options, queries }, queryClient);
}
