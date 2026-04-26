// Re-exported from @workspace/client, with React-specific extension for GenuiComponentContent
import type { ReactElement } from "react";
import type {
  GenuiComponentContent as BaseGenuiComponentContent,
  TextContent,
  GenuiToolUseContent,
  ToolResultContent,
  ResourceContent,
} from "@workspace/client";

import type { GenuiThreadMessage as BaseGenuiThreadMessage } from "@workspace/client";

export type {
  TextContent,
  ToolResultContent,
  ResourceContent,
  InputMessage,
  InitialInputMessage,
  MessageListResponse,
  MessageGetResponse,
  ComponentStreamingState,
  GenuiToolDisplayProps,
  GenuiToolUseContent,
  MessageRole,
  GenuiThreadMessage,
} from "@workspace/client";

/**
 * Extended ComponentContent with streaming state and rendered element.
 * Used by the React SDK to track component rendering lifecycle.
 *
 * Extends the base client GenuiComponentContent with the React-specific
 * `renderedComponent` field.
 */
export interface GenuiComponentContent extends BaseGenuiComponentContent {
  /**
   * The rendered React element for this component.
   * undefined if not yet rendered, null if the component couldn't be found in the registry.
   */
  renderedComponent?: ReactElement | null;
}

/**
 * Union type of all content block types.
 * Uses React-specific GenuiComponentContent which includes renderedComponent.
 */
export type Content =
  | TextContent
  | GenuiToolUseContent
  | ToolResultContent
  | GenuiComponentContent
  | ResourceContent;

/**
 * React-specific thread message type where component content blocks
 * include `renderedComponent`. Returned by `useGenui().messages`.
 */
export interface ReactGenuiThreadMessage extends BaseGenuiThreadMessage {
  content: Content[];
}
