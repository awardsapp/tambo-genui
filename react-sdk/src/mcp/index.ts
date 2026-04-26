/**
 * Entry point for MCP (Model Context Protocol) support in the React SDK.
 *
 * Note: The `@modelcontextprotocol/sdk` is included automatically with `@workspace/react`.
 * If you use features that require schema validation (like component props schemas),
 * you'll need to install `zod` and `zod-to-json-schema` as optional peer dependencies.
 * See the React SDK README for the recommended version ranges.
 */
export { MCPTransport } from "@workspace/client";
export type {
  MCPElicitationHandler,
  MCPHandlers,
  MCPSamplingHandler,
} from "@workspace/client";
export type {
  ElicitationRequestedSchema,
  PrimitiveSchemaDefinition,
  GenuiElicitationRequest,
  GenuiElicitationResponse,
} from "@workspace/client";
export {
  useGenuiMcpPrompt,
  useGenuiMcpPromptList,
  useGenuiMcpResource,
  useGenuiMcpResourceList,
  isMcpResourceEntry,
} from "./mcp-hooks";
export type {
  ListPromptEntry,
  ListPromptItem,
  ListResourceEntry,
  ListResourceItem,
} from "./mcp-hooks";
export {
  GenuiMcpProvider,
  useGenuiMcpElicitation,
  useGenuiMcpServers,
  useGenuiElicitationContext,
  type ConnectedMcpServer,
  type FailedMcpServer,
  type McpServer,
  type ProviderMCPHandlers,
} from "./genui-mcp-provider";

// Public MCP server metadata types
export type { McpServerInfo, NormalizedMcpServerInfo } from "@workspace/client";
