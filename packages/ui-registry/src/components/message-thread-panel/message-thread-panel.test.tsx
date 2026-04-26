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

const { MessageThreadPanel } = await import("./message-thread-panel");

describe("MessageThreadPanel", () => {
  it("exports a component", () => {
    expect(MessageThreadPanel).toBeDefined();
  });
});
