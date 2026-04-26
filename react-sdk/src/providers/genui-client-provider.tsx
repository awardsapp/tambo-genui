"use client";
import GenuiAI, { ClientOptions } from "@workspace/typescript-sdk";
import { QueryClient } from "@tanstack/react-query";
import React, { createContext, PropsWithChildren, useMemo } from "react";
import packageJson from "../../package.json";
import { useGenuiSessionToken } from "./hooks/use-genui-session-token";

export interface GenuiClientProviderProps {
  /**
   * The URL of the Genui API (only used for local development and debugging)
   */
  genuiUrl?: string;
  /**
   * The API key for the Genui API. This typically comes from a variable like
   * `process.env.NEXT_PUBLIC_GENUI_API_KEY`
   */
  apiKey: string;
  /**
   * The environment to use for the Genui API
   */
  environment?: "production" | "staging";

  /**
   * The user token to use to identify the user in the Genui API. This token is
   * a 3rd party token like a Google or GitHub access token, exchanged with the
   * Genui API to get a session token. This is used to securely identify the
   * user when calling the Genui API.
   */
  userToken?: string;

  /**
   * Additional headers to include in all requests to the Genui API.
   * These will be merged with the default headers.
   */
  additionalHeaders?: Record<string, string>;

  /**
   * User key sent as a default query parameter on all API requests.
   * Required if no bearer token (userToken) is provided.
   */
  userKey?: string;
}

export interface GenuiClientContextProps {
  /** The GenuiAI client */
  client: GenuiAI;
  /** The genui-specific query client */
  queryClient: QueryClient;
  /** Whether the session token is currently being updated */
  isUpdatingToken: boolean;
  /** Additional headers to include in all requests */
  additionalHeaders?: Record<string, string>;
  /** Error from token exchange, if any */
  tokenExchangeError: Error | null;
  /** The raw userToken value passed to the provider */
  userToken: string | undefined;
  /** Whether the token exchange succeeded */
  hasValidToken: boolean;
}

export const GenuiClientContext = createContext<
  GenuiClientContextProps | undefined
>(undefined);

/**
 * The GenuiClientProvider is a React provider that provides a GenuiAI client
 * and a query client to the descendants of the provider.
 * @param props - The props for the GenuiClientProvider
 * @param props.children - The children to wrap
 * @param props.genuiUrl - The URL of the Genui API
 * @param props.apiKey - The API key for the Genui API
 * @param props.environment - The environment to use for the Genui API
 * @param props.userToken - The oauth access token to use to identify the user in the Genui API
 * @param props.additionalHeaders - Additional headers to include in all requests
 * @param props.userKey - User key sent as a default query parameter on all API requests
 * @returns The GenuiClientProvider component
 */
export const GenuiClientProvider: React.FC<
  PropsWithChildren<GenuiClientProviderProps>
> = ({
  children,
  genuiUrl,
  apiKey,
  environment,
  userToken,
  additionalHeaders,
  userKey,
}) => {
  const genuiConfig = useMemo(
    () =>
      ({
        apiKey,
        defaultHeaders: {
          "X-Genui-React-Version": packageJson.version,
          ...additionalHeaders,
        },
        defaultQuery: userKey ? { userKey } : undefined,
        baseURL: genuiUrl ?? undefined,
        environment: environment ?? undefined,
      }) satisfies ClientOptions,
    [additionalHeaders, apiKey, genuiUrl, environment, userKey],
  );

  const client = useMemo(() => new GenuiAI(genuiConfig), [genuiConfig]);
  const queryClient = useMemo(() => new QueryClient(), []);

  // Keep the session token updated and get the updating state
  const {
    isFetching: isUpdatingToken,
    error: tokenExchangeError,
    data: tokenData,
  } = useGenuiSessionToken(client, queryClient, userToken);

  return (
    <GenuiClientContext.Provider
      value={{
        client,
        queryClient,
        isUpdatingToken,
        additionalHeaders: genuiConfig.defaultHeaders,
        tokenExchangeError: tokenExchangeError ?? null,
        userToken,
        hasValidToken: !!tokenData?.access_token,
      }}
    >
      {children}
    </GenuiClientContext.Provider>
  );
};

/**
 * The useGenuiClient hook provides access to the GenuiAI client
 * to the descendants of the GenuiClientProvider.
 * @returns The GenuiAI client
 */
export const useGenuiClient = () => {
  const context = React.useContext(GenuiClientContext);
  if (context === undefined) {
    throw new Error("useGenuiClient must be used within a GenuiClientProvider");
  }
  return context.client;
};

/**
 * The useGenuiQueryClient hook provides access to the genui-specific query client
 * to the descendants of the GenuiClientProvider.
 * @returns The genui-specific query client
 * @private
 */
export const useGenuiQueryClient = () => {
  const context = React.useContext(GenuiClientContext);
  if (context === undefined) {
    throw new Error(
      "useGenuiQueryClient must be used within a GenuiClientProvider",
    );
  }
  return context.queryClient;
};

/**
 * Hook to check if the session token is currently being updated
 * @returns true if the token is being refreshed, false otherwise
 */
export const useIsGenuiTokenUpdating = () => {
  const context = React.useContext(GenuiClientContext);
  if (context === undefined) {
    throw new Error(
      "useIsGenuiTokenUpdating must be used within a GenuiClientProvider",
    );
  }
  return context.isUpdatingToken;
};
