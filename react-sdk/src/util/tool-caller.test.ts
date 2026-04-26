import type GenuiAI from "@workspace/typescript-sdk";
import type { GenuiToolRegistry } from "../model/component-metadata";
import { handleToolCall } from "./tool-caller";

function makeRegistry(
  toolName: string,
  impl: (input: Record<string, unknown>) => unknown,
): GenuiToolRegistry {
  return {
    [toolName]: {
      name: toolName,
      description: `Test tool ${toolName}`,
      tool: impl,
      inputSchema: { type: "object", properties: {} },
      outputSchema: { type: "object" },
    },
  };
}

describe("handleToolCall", () => {
  it("calls the registered tool with reconstructed parameters", async () => {
    const registry = makeRegistry("myTool", (input) => `got ${input.name}`);
    const request: GenuiAI.ToolCallRequest = {
      toolName: "myTool",
      parameters: [{ parameterName: "name", parameterValue: "Alice" }],
    };

    const { result, error } = await handleToolCall(request, registry);
    expect(result).toBe("got Alice");
    expect(error).toBeUndefined();
  });

  it("throws when toolName is missing", async () => {
    await expect(
      handleToolCall(
        { toolName: "", parameters: [] } as GenuiAI.ToolCallRequest,
        {},
      ),
    ).rejects.toThrow("Tool name is required");
  });

  it("returns error message when tool is not found and no fallback", async () => {
    const request: GenuiAI.ToolCallRequest = {
      toolName: "missing",
      parameters: [],
    };

    const { result, error } = await handleToolCall(request, {});
    expect(error).toBe("Tool missing not found in registry");
    expect(result).toContain("missing");
  });

  it("calls onCallUnregisteredTool fallback when tool not in registry", async () => {
    const fallback = jest.fn().mockResolvedValue("fallback result");
    const request: GenuiAI.ToolCallRequest = {
      toolName: "unregistered",
      parameters: [{ parameterName: "x", parameterValue: "1" }],
    };

    const { result, error } = await handleToolCall(request, {}, fallback);
    expect(result).toBe("fallback result");
    expect(error).toBeUndefined();
    expect(fallback).toHaveBeenCalledWith("unregistered", request.parameters);
  });

  it("returns error info when tool execution throws", async () => {
    const registry = makeRegistry("boom", () => {
      throw new Error("kaboom");
    });
    const request: GenuiAI.ToolCallRequest = {
      toolName: "boom",
      parameters: [],
    };

    const { result, error } = await handleToolCall(request, registry);
    expect(error).toBe("kaboom");
    expect(result).toContain("kaboom");
  });

  it("handles null parameters", async () => {
    const registry = makeRegistry("noArgs", () => "ok");
    const request = {
      toolName: "noArgs",
      parameters: null,
    } as unknown as GenuiAI.ToolCallRequest;

    const { result } = await handleToolCall(request, registry);
    expect(result).toBe("ok");
  });
});
