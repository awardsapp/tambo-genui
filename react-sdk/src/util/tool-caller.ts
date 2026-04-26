import GenuiAI from "@workspace/typescript-sdk";
import {
  ComponentContextTool,
  GenuiTool,
  GenuiToolRegistry,
} from "../model/component-metadata";
import { mapGenuiToolToContextTool } from "./registry";

/**
 * Process a message from the thread, invoking the appropriate tool and returning the result.
 * @param toolCallRequest - The message to handle
 * @param toolRegistry - The tool registry
 * @returns The result of the tool call along with the tool definition
 */
export const handleToolCall = async (
  toolCallRequest: GenuiAI.ToolCallRequest,
  toolRegistry: GenuiToolRegistry,
  onCallUnregisteredTool?: (
    toolName: string,
    args: GenuiAI.ToolCallParameter[],
  ) => Promise<string>,
): Promise<{
  result: unknown;
  error?: string;
  genuiTool?: GenuiTool;
}> => {
  if (!toolCallRequest?.toolName) {
    throw new Error("Tool name is required");
  }

  try {
    const { tool, genuiTool } = findTool(
      toolCallRequest.toolName,
      toolRegistry,
    );
    if (!tool) {
      if (onCallUnregisteredTool) {
        const result = await onCallUnregisteredTool(
          toolCallRequest.toolName,
          toolCallRequest.parameters,
        );
        return {
          result,
        };
      }
      throw new Error(`Tool ${toolCallRequest.toolName} not found in registry`);
    }
    return {
      result: await runToolChoice(toolCallRequest, tool),
      genuiTool,
    };
  } catch (error) {
    console.error("Error in calling tool: ", error);
    return {
      result: `When attempting to call tool ${toolCallRequest.toolName} the following error occurred: ${error}. Explain to the user that the tool call failed and try again if needed.`,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
};

const findTool = (
  toolName: string,
  toolRegistry: GenuiToolRegistry,
):
  | {
      tool: ComponentContextTool;
      genuiTool: GenuiTool;
    }
  | { tool: null; genuiTool: null } => {
  const registryTool = toolRegistry[toolName];

  if (!registryTool) {
    return { tool: null, genuiTool: null };
  }

  const contextTool = mapGenuiToolToContextTool(registryTool);
  return {
    tool: {
      getComponentContext: registryTool.tool,
      definition: contextTool,
    },
    genuiTool: registryTool,
  };
};

const runToolChoice = async (
  toolCallRequest: GenuiAI.ToolCallRequest,
  tool: ComponentContextTool,
): Promise<unknown> => {
  const parameters = toolCallRequest.parameters ?? [];

  // Reconstruct the object from parameter name-value pairs
  const inputObject = Object.fromEntries(
    parameters.map((param) => [param.parameterName, param.parameterValue]),
  );
  return await tool.getComponentContext(inputObject);
};
