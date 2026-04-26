/// <reference types="@testing-library/jest-dom" />
import { jest, describe, it, expect, beforeEach } from "@jest/globals";
import React from "react";
import { render } from "@testing-library/react";
import { Message, ToolcallInfo } from "./message";
import { useGenui } from "@workspace/react";
import type { GenuiThreadMessage } from "@workspace/react";

// @workspace/react is mocked via moduleNameMapper in jest.config.ts

/**
 * Creates a minimal GenuiThreadMessage with a tool_use content block for testing.
 */
function createToolCallMessage(
  overrides: Partial<GenuiThreadMessage> = {},
): GenuiThreadMessage {
  return {
    id: "test-message-id",
    role: "assistant",
    content: [
      {
        type: "tool_use",
        id: "tool-call-1",
        name: "test_tool",
        input: {},
      },
    ],
    createdAt: new Date().toISOString(),
    ...overrides,
  } as GenuiThreadMessage;
}

function createToolResponseMessage(
  content: GenuiThreadMessage["content"],
): GenuiThreadMessage {
  return {
    id: "tool-response-id",
    role: "user",
    content: content.map((block) => ({
      ...block,
      type: "tool_result" as const,
      toolUseId: "tool-call-1",
    })),
    createdAt: new Date().toISOString(),
  } as GenuiThreadMessage;
}

describe("formatToolResult in ToolcallInfo", () => {
  const mockUseGenui = jest.mocked(useGenui);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("text content", () => {
    it("renders plain text tool result", () => {
      const toolCallMessage = createToolCallMessage();
      const toolResponse = createToolResponseMessage([
        { type: "text", text: "Tool executed successfully" },
      ] as GenuiThreadMessage["content"]);

      mockUseGenui.mockReturnValue({
        messages: [toolCallMessage, toolResponse],
        isStreaming: false,
        isIdle: true,
      } as never);

      const { container } = render(
        <Message role="assistant" message={toolCallMessage}>
          <ToolcallInfo />
        </Message>,
      );

      expect(
        container.querySelector('[data-slot="toolcall-info"]'),
      ).toBeTruthy();
    });

    it("renders JSON tool result with formatting", () => {
      const toolCallMessage = createToolCallMessage();
      const toolResponse = createToolResponseMessage([
        { type: "text", text: '{"status": "success", "count": 42}' },
      ] as GenuiThreadMessage["content"]);

      mockUseGenui.mockReturnValue({
        messages: [toolCallMessage, toolResponse],
        isStreaming: false,
        isIdle: true,
      } as never);

      const { container } = render(
        <Message role="assistant" message={toolCallMessage}>
          <ToolcallInfo />
        </Message>,
      );

      expect(
        container.querySelector('[data-slot="toolcall-info"]'),
      ).toBeTruthy();
    });
  });

  describe("image content", () => {
    it("renders image_url content from tool result", () => {
      const toolCallMessage = createToolCallMessage();
      const toolResponse = createToolResponseMessage([
        {
          type: "image_url",
          image_url: { url: "https://example.com/image.png" },
        },
      ] as unknown as GenuiThreadMessage["content"]);

      mockUseGenui.mockReturnValue({
        messages: [toolCallMessage, toolResponse],
        isStreaming: false,
        isIdle: true,
      } as never);

      const { container } = render(
        <Message role="assistant" message={toolCallMessage}>
          <ToolcallInfo />
        </Message>,
      );

      expect(
        container.querySelector('[data-slot="toolcall-info"]'),
      ).toBeTruthy();
    });

    it("renders mixed text and image content", () => {
      const toolCallMessage = createToolCallMessage();
      const toolResponse = createToolResponseMessage([
        { type: "text", text: "Here is the generated image:" },
        {
          type: "image_url",
          image_url: { url: "https://example.com/chart.png" },
        },
      ] as unknown as GenuiThreadMessage["content"]);

      mockUseGenui.mockReturnValue({
        messages: [toolCallMessage, toolResponse],
        isStreaming: false,
        isIdle: true,
      } as never);

      const { container } = render(
        <Message role="assistant" message={toolCallMessage}>
          <ToolcallInfo />
        </Message>,
      );

      expect(
        container.querySelector('[data-slot="toolcall-info"]'),
      ).toBeTruthy();
    });
  });

  describe("resource content", () => {
    it("renders resource with text content", () => {
      const toolCallMessage = createToolCallMessage();
      const toolResponse = createToolResponseMessage([
        {
          type: "resource",
          resource: {
            name: "file.txt",
            text: "File contents here",
          },
        },
      ] as unknown as GenuiThreadMessage["content"]);

      mockUseGenui.mockReturnValue({
        messages: [toolCallMessage, toolResponse],
        isStreaming: false,
        isIdle: true,
      } as never);

      const { container } = render(
        <Message role="assistant" message={toolCallMessage}>
          <ToolcallInfo />
        </Message>,
      );

      expect(
        container.querySelector('[data-slot="toolcall-info"]'),
      ).toBeTruthy();
    });

    it("renders resource with URI reference", () => {
      const toolCallMessage = createToolCallMessage();
      const toolResponse = createToolResponseMessage([
        {
          type: "resource",
          resource: {
            uri: "file:///path/to/document.pdf",
            name: "document.pdf",
          },
        },
      ] as unknown as GenuiThreadMessage["content"]);

      mockUseGenui.mockReturnValue({
        messages: [toolCallMessage, toolResponse],
        isStreaming: false,
        isIdle: true,
      } as never);

      const { container } = render(
        <Message role="assistant" message={toolCallMessage}>
          <ToolcallInfo />
        </Message>,
      );

      expect(
        container.querySelector('[data-slot="toolcall-info"]'),
      ).toBeTruthy();
    });

    it("renders resource with base64 image blob", () => {
      const toolCallMessage = createToolCallMessage();
      const toolResponse = createToolResponseMessage([
        {
          type: "resource",
          resource: {
            name: "screenshot.png",
            mimeType: "image/png",
            blob: "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
          },
        },
      ] as unknown as GenuiThreadMessage["content"]);

      mockUseGenui.mockReturnValue({
        messages: [toolCallMessage, toolResponse],
        isStreaming: false,
        isIdle: true,
      } as never);

      const { container } = render(
        <Message role="assistant" message={toolCallMessage}>
          <ToolcallInfo />
        </Message>,
      );

      expect(
        container.querySelector('[data-slot="toolcall-info"]'),
      ).toBeTruthy();
    });
  });

  describe("mixed content types", () => {
    it("renders text, image, and resource together", () => {
      const toolCallMessage = createToolCallMessage();
      const toolResponse = createToolResponseMessage([
        { type: "text", text: "Analysis complete." },
        {
          type: "image_url",
          image_url: { url: "https://example.com/graph.png" },
        },
        {
          type: "resource",
          resource: {
            uri: "file:///data/results.json",
            name: "results.json",
          },
        },
      ] as unknown as GenuiThreadMessage["content"]);

      mockUseGenui.mockReturnValue({
        messages: [toolCallMessage, toolResponse],
        isStreaming: false,
        isIdle: true,
      } as never);

      const { container } = render(
        <Message role="assistant" message={toolCallMessage}>
          <ToolcallInfo />
        </Message>,
      );

      expect(
        container.querySelector('[data-slot="toolcall-info"]'),
      ).toBeTruthy();
    });
  });

  describe("edge cases", () => {
    it("handles empty content array", () => {
      const toolCallMessage = createToolCallMessage();
      const toolResponse = createToolResponseMessage([]);

      mockUseGenui.mockReturnValue({
        messages: [toolCallMessage, toolResponse],
        isStreaming: false,
        isIdle: true,
      } as never);

      const { container } = render(
        <Message role="assistant" message={toolCallMessage}>
          <ToolcallInfo />
        </Message>,
      );

      expect(
        container.querySelector('[data-slot="toolcall-info"]'),
      ).toBeTruthy();
    });

    it("handles resource without any content fields", () => {
      const toolCallMessage = createToolCallMessage();
      const toolResponse = createToolResponseMessage([
        {
          type: "resource",
          resource: {},
        },
      ] as unknown as GenuiThreadMessage["content"]);

      mockUseGenui.mockReturnValue({
        messages: [toolCallMessage, toolResponse],
        isStreaming: false,
        isIdle: true,
      } as never);

      const { container } = render(
        <Message role="assistant" message={toolCallMessage}>
          <ToolcallInfo />
        </Message>,
      );

      expect(
        container.querySelector('[data-slot="toolcall-info"]'),
      ).toBeTruthy();
    });

    it("handles image_url without url", () => {
      const toolCallMessage = createToolCallMessage();
      const toolResponse = createToolResponseMessage([
        {
          type: "image_url",
          image_url: {},
        },
      ] as unknown as GenuiThreadMessage["content"]);

      mockUseGenui.mockReturnValue({
        messages: [toolCallMessage, toolResponse],
        isStreaming: false,
        isIdle: true,
      } as never);

      const { container } = render(
        <Message role="assistant" message={toolCallMessage}>
          <ToolcallInfo />
        </Message>,
      );

      expect(
        container.querySelector('[data-slot="toolcall-info"]'),
      ).toBeTruthy();
    });
  });
});
