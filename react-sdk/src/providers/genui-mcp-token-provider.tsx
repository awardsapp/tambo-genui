"use client";
import React, {
  createContext,
  type PropsWithChildren,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { GenuiClientContext } from "./genui-client-provider";

export interface GenuiMcpTokenContextProps {
  /**
   * The current MCP access token for the internal Genui MCP server.
   */
  mcpAccessToken: string | null;
  /**
   * The base URL for the Genui API (used to construct the MCP server URL)
   * Returns undefined if the client is not yet initialized
   */
  genuiBaseUrl: string | undefined;
}

const GenuiMcpTokenContext = createContext<
  GenuiMcpTokenContextProps | undefined
>(undefined);

/**
 * Provider for managing the MCP access token that is returned by the Genui API.
 * This token is used to authenticate with the internal Genui MCP server.
 *
 * Exposes the base URL and a null token by default. Token fetching is handled
 * by the useGenuiMcpToken hook which supports contextKey-based token retrieval.
 * @internal
 * @param props - The provider props
 * @param props.children - The children to wrap
 * @returns The GenuiMcpTokenProvider component
 */
export const GenuiMcpTokenProvider: React.FC<PropsWithChildren> = ({
  children,
}) => {
  const clientContext = useContext(GenuiClientContext);
  if (!clientContext) {
    throw new Error(
      "GenuiMcpTokenProvider must be used within a GenuiClientProvider",
    );
  }
  const { client } = clientContext;
  const genuiBaseUrl = client.baseURL;

  const value = useMemo(
    () => ({ mcpAccessToken: null, genuiBaseUrl }),
    [genuiBaseUrl],
  );

  return (
    <GenuiMcpTokenContext.Provider value={value}>
      {children}
    </GenuiMcpTokenContext.Provider>
  );
};

/**
 * Hook to access the current MCP access token with optional token fetching.
 *
 * Token fetching logic:
 * - If contextKey is provided → fetches a token using that contextKey
 * - Otherwise → returns null
 * @param contextKey - Optional context key for fetching tokens
 * @returns The current MCP access token and base URL
 */
export const useGenuiMcpToken = (
  contextKey?: string,
): GenuiMcpTokenContextProps => {
  const context = useContext(GenuiMcpTokenContext);
  if (context === undefined) {
    throw new Error(
      "useGenuiMcpToken must be used within a GenuiMcpTokenProvider",
    );
  }

  const clientContext = useContext(GenuiClientContext);
  if (!clientContext) {
    throw new Error(
      "useGenuiMcpToken must be used within a GenuiClientProvider",
    );
  }
  const { client } = clientContext;

  // State for fetched token
  const [fetchedToken, setFetchedToken] = useState<string | null>(null);
  const hasAttemptedFetch = useRef(false);

  // Determine if we should fetch a token
  const shouldFetch = contextKey && !fetchedToken && !hasAttemptedFetch.current;

  // Fetch token when needed
  useEffect(() => {
    if (shouldFetch) {
      hasAttemptedFetch.current = true;
      const fetchToken = async () => {
        try {
          const response = await client.beta.auth.getMcpToken({ contextKey });
          if (response.mcpAccessToken) {
            setFetchedToken(response.mcpAccessToken);
          }
        } catch (error) {
          console.error("Failed to fetch MCP token:", error);
        }
      };
      void fetchToken();
    }
  }, [shouldFetch, client, contextKey]);

  const selectedToken = fetchedToken;

  return {
    mcpAccessToken: selectedToken,
    genuiBaseUrl: context.genuiBaseUrl,
  };
};
