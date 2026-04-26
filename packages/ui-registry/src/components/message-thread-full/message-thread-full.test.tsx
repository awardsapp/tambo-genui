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

const { MessageThreadFull } = await import("./message-thread-full");

describe("MessageThreadFull", () => {
  it("exports a component", () => {
    expect(MessageThreadFull).toBeDefined();
  });
});
