/// <reference types="@testing-library/jest-dom" />
import { jest, describe, it, expect, beforeEach } from "@jest/globals";
import React from "react";
import { render, screen } from "@testing-library/react";
import { McpPromptButton, McpResourceButton } from "./mcp-components";
import {
  useGenuiMcpPromptList,
  useGenuiMcpPrompt,
  useGenuiMcpResourceList,
} from "@workspace/react/mcp";

// Mocks are provided via moduleNameMapper in jest.config.ts

const mockUseGenuiMcpPromptList = jest.mocked(useGenuiMcpPromptList);
const mockUseGenuiMcpPrompt = jest.mocked(useGenuiMcpPrompt);
const mockUseGenuiMcpResourceList = jest.mocked(useGenuiMcpResourceList);

describe("McpPromptButton", () => {
  const mockOnInsertText = jest.fn();
  const defaultPromptList = [
    {
      server: { url: "http://localhost:3000" },
      prompt: { name: "test-prompt", description: "A test prompt" },
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseGenuiMcpPromptList.mockReturnValue({
      data: defaultPromptList,
      isLoading: false,
    } as ReturnType<typeof useGenuiMcpPromptList>);
    mockUseGenuiMcpPrompt.mockReturnValue({
      data: undefined,
      error: undefined,
    } as ReturnType<typeof useGenuiMcpPrompt>);
  });

  it("renders the button when prompts are available", () => {
    render(<McpPromptButton value="" onInsertText={mockOnInsertText} />);

    expect(
      screen.getByRole("button", { name: "Insert MCP Prompt" }),
    ).toBeInTheDocument();
  });

  it("does not render when no prompts are available", () => {
    mockUseGenuiMcpPromptList.mockReturnValue({
      data: [],
      isLoading: false,
    } as ReturnType<typeof useGenuiMcpPromptList>);

    const { container } = render(
      <McpPromptButton value="" onInsertText={mockOnInsertText} />,
    );

    expect(container.firstChild).toBeNull();
  });

  it("does not render when prompts are undefined", () => {
    mockUseGenuiMcpPromptList.mockReturnValue({
      data: undefined,
      isLoading: false,
    } as ReturnType<typeof useGenuiMcpPromptList>);

    const { container } = render(
      <McpPromptButton value="" onInsertText={mockOnInsertText} />,
    );

    expect(container.firstChild).toBeNull();
  });

  describe("prompt data validation", () => {
    it("handles valid prompt data with text content", () => {
      const validPromptData = {
        messages: [
          { content: { type: "text", text: "Hello, world!" } },
          { content: { type: "text", text: "Second message" } },
        ],
      };

      const { rerender } = render(
        <McpPromptButton value="" onInsertText={mockOnInsertText} />,
      );

      mockUseGenuiMcpPrompt.mockReturnValue({
        data: validPromptData,
        error: undefined,
      } as ReturnType<typeof useGenuiMcpPrompt>);

      rerender(<McpPromptButton value="" onInsertText={mockOnInsertText} />);

      // The callback should not be called yet since no prompt is selected
      expect(mockOnInsertText).not.toHaveBeenCalled();
    });

    it("handles prompt data with missing messages array", () => {
      const invalidPromptData = {};

      mockUseGenuiMcpPrompt.mockReturnValue({
        data: invalidPromptData,
        error: undefined,
      } as ReturnType<typeof useGenuiMcpPrompt>);

      render(<McpPromptButton value="" onInsertText={mockOnInsertText} />);

      expect(mockOnInsertText).not.toHaveBeenCalled();
    });

    it("handles prompt data with non-array messages", () => {
      const invalidPromptData = {
        messages: "not an array",
      };

      mockUseGenuiMcpPrompt.mockReturnValue({
        data: invalidPromptData,
        error: undefined,
      } as ReturnType<typeof useGenuiMcpPrompt>);

      render(<McpPromptButton value="" onInsertText={mockOnInsertText} />);

      expect(mockOnInsertText).not.toHaveBeenCalled();
    });

    it("handles completely null prompt data", () => {
      mockUseGenuiMcpPrompt.mockReturnValue({
        data: null,
        error: undefined,
      } as ReturnType<typeof useGenuiMcpPrompt>);

      render(<McpPromptButton value="" onInsertText={mockOnInsertText} />);

      expect(mockOnInsertText).not.toHaveBeenCalled();
    });

    it("handles undefined prompt data", () => {
      mockUseGenuiMcpPrompt.mockReturnValue({
        data: undefined,
        error: undefined,
      } as ReturnType<typeof useGenuiMcpPrompt>);

      render(<McpPromptButton value="" onInsertText={mockOnInsertText} />);

      expect(mockOnInsertText).not.toHaveBeenCalled();
    });
  });

  describe("error handling", () => {
    it("handles fetch errors gracefully", () => {
      mockUseGenuiMcpPrompt.mockReturnValue({
        data: undefined,
        error: new Error("Network error"),
      } as ReturnType<typeof useGenuiMcpPrompt>);

      render(<McpPromptButton value="" onInsertText={mockOnInsertText} />);

      expect(
        screen.getByRole("button", { name: "Insert MCP Prompt" }),
      ).toBeInTheDocument();
    });
  });
});

describe("McpResourceButton", () => {
  const mockOnInsertResource = jest.fn();
  const defaultResourceList = [
    {
      server: { url: "http://localhost:3000" },
      resource: {
        uri: "test:file://doc.md",
        name: "Documentation",
        description: "Main docs",
      },
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseGenuiMcpResourceList.mockReturnValue({
      data: defaultResourceList,
      isLoading: false,
    } as ReturnType<typeof useGenuiMcpResourceList>);
  });

  it("renders the button when resources are available", () => {
    render(
      <McpResourceButton value="" onInsertResource={mockOnInsertResource} />,
    );

    expect(
      screen.getByRole("button", { name: "Insert MCP Resource" }),
    ).toBeInTheDocument();
  });

  it("does not render when no resources are available", () => {
    mockUseGenuiMcpResourceList.mockReturnValue({
      data: [],
      isLoading: false,
    } as ReturnType<typeof useGenuiMcpResourceList>);

    const { container } = render(
      <McpResourceButton value="" onInsertResource={mockOnInsertResource} />,
    );

    expect(container.firstChild).toBeNull();
  });

  it("does not render when resources are undefined", () => {
    mockUseGenuiMcpResourceList.mockReturnValue({
      data: undefined,
      isLoading: false,
    } as ReturnType<typeof useGenuiMcpResourceList>);

    const { container } = render(
      <McpResourceButton value="" onInsertResource={mockOnInsertResource} />,
    );

    expect(container.firstChild).toBeNull();
  });
});
