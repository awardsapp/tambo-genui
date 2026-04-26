import { describe, expect, it, jest } from "@jest/globals";

await jest.unstable_mockModule("@workspace/react/mcp", () => ({
  useGenuiMcpPrompt: jest.fn(() => ({ data: null })),
  useGenuiMcpPromptList: jest.fn(() => ({ data: [], isLoading: false })),
  useGenuiMcpResourceList: jest.fn(() => ({ data: [], isLoading: false })),
  useGenuiElicitationContext: jest.fn(() => ({
    elicitation: null,
    resolveElicitation: null,
  })),
}));

const { ControlBar } = await import("./control-bar");

describe("ControlBar", () => {
  it("exports a component", () => {
    expect(ControlBar).toBeDefined();
  });
});
