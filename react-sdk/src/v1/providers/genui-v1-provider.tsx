"use client";

/**
 * GenuiProvider - Main Provider
 *
 * Composes the necessary providers for the SDK:
 * - GenuiClientProvider: API client and authentication
 * - GenuiRegistryProvider: Component and tool registration
 * - GenuiContextHelpersProvider: Context helper functions
 * - GenuiMcpTokenProvider: MCP access token management
 * - GenuiMcpProvider: MCP server connections and tool discovery
 * - GenuiContextAttachmentProvider: Single-message context attachments
 * - GenuiInteractableProvider: Interactive component tracking
 * - GenuiStreamProvider: Streaming state management
 *
 * This provider should wrap your entire application or the portion
 * that needs access to Genui functionality.
 */

import React, {
  createContext,
  useContext,
  useEffect,
  type PropsWithChildren,
} from "react";
import { useGenuiAuthState } from "../hooks/use-genui-v1-auth-state";
import {
  GenuiClientProvider,
  type GenuiClientProviderProps,
} from "../../providers/genui-client-provider";
import {
  GenuiRegistryProvider,
  type GenuiRegistryProviderProps,
} from "../../providers/genui-registry-provider";
import { GenuiContextAttachmentProvider } from "../../providers/genui-context-attachment-provider";
import { GenuiContextHelpersProvider } from "../../providers/genui-context-helpers-provider";
import { GenuiInteractableProvider } from "../../providers/genui-interactable-provider";
import { GenuiMcpTokenProvider } from "../../providers/genui-mcp-token-provider";
import { GenuiMcpProvider } from "../../mcp/genui-mcp-provider";
import type { ContextHelpers } from "../../context-helpers";
import type { McpServerInfo } from "@workspace/client";
import type {
  ListResourceItem,
  ResourceSource,
} from "../../model/resource-info";
import type { InitialInputMessage } from "../types/message";
import { GenuiStreamProvider } from "./genui-v1-stream-context";
import { GenuiThreadInputProvider } from "./genui-v1-thread-input-provider";

/**
 * Configuration values for the SDK.
 * These are static values that don't change during the session.
 */
export interface GenuiConfig {
  /** User key for thread ownership and scoping */
  userKey?: string;
  /** Whether to automatically generate thread names after a threshold of messages. Defaults to true. */
  autoGenerateThreadName?: boolean;
  /** The message count threshold at which the thread name will be auto-generated. Defaults to 3. */
  autoGenerateNameThreshold?: number;
  /**
   * Initial messages to seed new threads with.
   * These are displayed in the UI immediately and sent to the API on first message.
   */
  initialMessages?: InitialInputMessage[];
}

/**
 * Context for SDK configuration.
 * @internal
 */
export const GenuiConfigContext = createContext<GenuiConfig | null>(null);

/**
 * Hook to access SDK configuration.
 * @returns Configuration values including userKey
 * @throws {Error} If used outside GenuiProvider
 */
export function useGenuiConfig(): GenuiConfig {
  const config = useContext(GenuiConfigContext);
  if (!config) {
    throw new Error("useGenuiConfig must be used within GenuiProvider");
  }
  return config;
}

/**
 * Props for GenuiProvider
 */
export interface GenuiProviderProps extends Pick<
  GenuiClientProviderProps,
  "apiKey" | "genuiUrl" | "environment" | "userToken"
> {
  /**
   * Components to register with the registry.
   * These will be available for the AI to use in responses.
   */
  components?: GenuiRegistryProviderProps["components"];

  /**
   * Tools to register with the registry.
   * These will be executed client-side when requested by the AI.
   */
  tools?: GenuiRegistryProviderProps["tools"];

  /**
   * MCP servers to register with the registry.
   * These provide additional tools and resources from MCP-compatible servers.
   */
  mcpServers?: (McpServerInfo | string)[];

  /**
   * Callback function called when an unregistered tool is called.
   * If not provided, an error will be thrown for unknown tools.
   */
  onCallUnregisteredTool?: GenuiRegistryProviderProps["onCallUnregisteredTool"];

  /**
   * Static resources to register with the registry.
   * These will be available for the AI to access.
   */
  resources?: ListResourceItem[];

  /**
   * Dynamic resource search function.
   * Must be paired with getResource.
   * Called when searching for resources dynamically.
   */
  listResources?: ResourceSource["listResources"];

  /**
   * Dynamic resource fetch function.
   * Must be paired with listResources.
   * Called when fetching a specific resource by URI.
   */
  getResource?: ResourceSource["getResource"];

  /**
   * Configuration for context helpers.
   * A dictionary of functions that provide additional context to the AI.
   * Each key becomes the context name, and the function returns the value.
   */
  contextHelpers?: ContextHelpers;

  /**
   * User key for thread ownership and scoping.
   *
   * **Required**: You must provide either `userKey` OR `userToken` (which contains a userKey).
   * All thread operations (create, list, fetch) only return threads owned by this userKey.
   *
   * - Use `userKey` for server-side or trusted environments where you control the user identity
   * - Use `userToken` (OAuth bearer token) for client-side apps where the token contains the userKey
   */
  userKey?: string;

  /**
   * Whether to automatically generate thread names after a threshold of messages.
   * Defaults to true.
   */
  autoGenerateThreadName?: boolean;

  /**
   * The message count threshold at which the thread name will be auto-generated.
   * Defaults to 3.
   */
  autoGenerateNameThreshold?: number;

  /**
   * Initial messages to seed new threads with.
   * These are displayed in the UI immediately (before the first API call)
   * and sent to the API when the first message is sent to create the thread.
   */
  initialMessages?: InitialInputMessage[];

  /**
   * Children components
   */
  children: React.ReactNode;
}

/**
 * Internal component that emits console warnings for auth misconfiguration.
 * Rendered inside the provider tree so both GenuiClientContext and
 * GenuiConfigContext are available.
 * @returns null (renders nothing).
 */
function GenuiAuthWarnings(): null {
  const authState = useGenuiAuthState();
  const authError = authState.status === "error" ? authState.error : null;

  useEffect(() => {
    switch (authState.status) {
      case "unauthenticated":
        console.warn(
          "[GenuiProvider] Neither userKey nor userToken provided. " +
            "API requests will be blocked until authentication is configured.",
        );
        break;
      case "invalid":
        console.warn(
          "[GenuiProvider] Both userKey and userToken were provided. " +
            "You must provide one or the other, not both.",
        );
        break;
      case "error":
        console.warn("[GenuiProvider] Token exchange failed:", authError);
        break;
    }
  }, [authState.status, authError]);

  return null;
}

/**
 * Main provider for the Genui SDK.
 *
 * Composes GenuiClientProvider, GenuiRegistryProvider, and GenuiStreamProvider
 * to provide a complete context for building AI-powered applications.
 *
 * Threads are managed dynamically through useGenui() hook functions:
 * - startNewThread() - Begin a new conversation
 * - switchThread(threadId) - Switch to an existing thread
 * - initThread(threadId) - Initialize a thread for receiving events
 * @param props - Provider configuration
 * @param props.apiKey - Genui API key for authentication
 * @param props.genuiUrl - Optional custom Genui API URL
 * @param props.environment - Optional environment configuration
 * @param props.userToken - Optional OAuth token for user authentication
 * @param props.components - Components to register with the AI
 * @param props.tools - Tools to register for client-side execution
 * @param props.mcpServers - MCP servers to register for additional tools/resources
 * @param props.onCallUnregisteredTool - Callback for handling unknown tool calls
 * @param props.resources - Static resources to register with the AI
 * @param props.listResources - Dynamic resource search function (must be paired with getResource)
 * @param props.getResource - Dynamic resource fetch function (must be paired with listResources)
 * @param props.contextHelpers - Configuration for context helper functions
 * @param props.userKey - User key for thread ownership (required if not using userToken)
 * @param props.autoGenerateThreadName - Whether to automatically generate thread names. Defaults to true.
 * @param props.autoGenerateNameThreshold - The message count threshold at which the thread name will be auto-generated. Defaults to 3.
 * @param props.initialMessages - Optional initial messages to prepend to the first thread.
 * @param props.children - Child components
 * @returns Provider component tree
 * @example
 * ```tsx
 * import { GenuiProvider } from '@workspace/react';
 *
 * function App() {
 *   return (
 *     <GenuiProvider
 *       apiKey={process.env.NEXT_PUBLIC_GENUI_API_KEY!}
 *       components={[WeatherCard, StockChart]}
 *       tools={[searchTool, calculatorTool]}
 *     >
 *       <ChatInterface />
 *     </GenuiProvider>
 *   );
 * }
 * ```
 */
export function GenuiProvider({
  apiKey,
  genuiUrl,
  environment,
  userToken,
  components,
  tools,
  mcpServers,
  onCallUnregisteredTool,
  resources,
  listResources,
  getResource,
  contextHelpers,
  userKey,
  autoGenerateThreadName,
  autoGenerateNameThreshold,
  initialMessages,
  children,
}: PropsWithChildren<GenuiProviderProps>) {
  // Config is static - created once and never changes
  const config: GenuiConfig = {
    userKey,
    autoGenerateThreadName,
    autoGenerateNameThreshold,
    initialMessages,
  };

  return (
    <GenuiClientProvider
      apiKey={apiKey}
      genuiUrl={genuiUrl}
      environment={environment}
      userToken={userToken}
      userKey={userKey}
    >
      <GenuiRegistryProvider
        components={components}
        tools={tools}
        mcpServers={mcpServers}
        onCallUnregisteredTool={onCallUnregisteredTool}
        resources={resources}
        listResources={listResources}
        getResource={getResource}
      >
        <GenuiContextHelpersProvider contextHelpers={contextHelpers}>
          <GenuiMcpTokenProvider>
            <GenuiMcpProvider>
              <GenuiContextAttachmentProvider>
                <GenuiInteractableProvider>
                  <GenuiConfigContext.Provider value={config}>
                    <GenuiAuthWarnings />
                    <GenuiStreamProvider initialMessages={initialMessages}>
                      <GenuiThreadInputProvider>
                        {children}
                      </GenuiThreadInputProvider>
                    </GenuiStreamProvider>
                  </GenuiConfigContext.Provider>
                </GenuiInteractableProvider>
              </GenuiContextAttachmentProvider>
            </GenuiMcpProvider>
          </GenuiMcpTokenProvider>
        </GenuiContextHelpersProvider>
      </GenuiRegistryProvider>
    </GenuiClientProvider>
  );
}
