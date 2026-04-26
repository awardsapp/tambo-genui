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

const { MessageThreadCollapsible } =
  await import("./message-thread-collapsible");

describe("MessageThreadCollapsible", () => {
  it("exports a component", () => {
    expect(MessageThreadCollapsible).toBeDefined();
  });
});
