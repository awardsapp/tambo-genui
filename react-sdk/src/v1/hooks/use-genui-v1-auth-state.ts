"use client";

import { useContext } from "react";
import { GenuiClientContext } from "../../providers/genui-client-provider";
import { GenuiConfigContext } from "../providers/genui-v1-provider";
import type { GenuiAuthState } from "@workspace/client";

/**
 * Hook to compute the current authentication state for the SDK.
 *
 * Reads from GenuiClientContext and GenuiConfigContext to determine
 * whether the SDK is ready to make API calls.
 * @returns The current auth state as a discriminated union
 * @throws {Error} If used outside GenuiProvider
 */
export function useGenuiAuthState(): GenuiAuthState {
  const clientContext = useContext(GenuiClientContext);
  if (!clientContext) {
    throw new Error("useGenuiAuthState must be used within GenuiProvider");
  }

  const config = useContext(GenuiConfigContext);
  if (!config) {
    throw new Error("useGenuiAuthState must be used within GenuiProvider");
  }

  const { tokenExchangeError, userToken, hasValidToken } = clientContext;
  const { userKey } = config;

  // Invalid: both userKey AND userToken provided
  if (userKey && userToken) {
    return { status: "invalid" };
  }

  // Identified via userKey
  if (userKey) {
    return { status: "identified", source: "userKey" };
  }

  // Token exchange scenarios
  if (userToken) {
    if (tokenExchangeError) {
      return { status: "error", error: tokenExchangeError };
    }
    if (hasValidToken) {
      return { status: "identified", source: "tokenExchange" };
    }
    return { status: "exchanging" };
  }

  // Neither provided
  return { status: "unauthenticated" };
}
