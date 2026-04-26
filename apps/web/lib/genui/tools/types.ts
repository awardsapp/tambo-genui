import type { api, useTRPCClient } from "@/trpc/react";

/**
 * Tool context containing TRPC client and utilities
 */
export interface ToolContext {
  trpcClient: ReturnType<typeof useTRPCClient>;
  utils: ReturnType<typeof api.useUtils>;
}

/**
 * Tool registration function
 */
import type { UseGenuiReturn } from "@workspace/react";
export type RegisterToolFn = UseGenuiReturn["registerTool"];
