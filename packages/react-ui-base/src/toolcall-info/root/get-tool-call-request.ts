import type { GenuiThreadMessage, GenuiToolUseContent } from "@workspace/react";

/**
 * Get the first tool_use content block from the message.
 * In V1, tool calls are content blocks of type "tool_use" rather than
 * top-level message properties.
 * @param message - The message to get the tool call from
 * @returns The first tool_use content block, or undefined
 */
export function getToolCallRequest(
  message: GenuiThreadMessage,
): GenuiToolUseContent | undefined {
  return message.content.find(
    (block): block is GenuiToolUseContent => block.type === "tool_use",
  );
}
