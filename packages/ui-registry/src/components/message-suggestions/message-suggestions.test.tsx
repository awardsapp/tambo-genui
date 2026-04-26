/// <reference types="@testing-library/jest-dom" />
import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import type { Suggestion } from "@workspace/react";
import { useGenui, useGenuiSuggestions } from "@workspace/react";
import { render, screen } from "@testing-library/react";
import React from "react";
import {
  MessageSuggestions,
  MessageSuggestionsList,
} from "./message-suggestions";

const initialSuggestions: Suggestion[] = [
  {
    id: "seed-1",
    title: "Seed suggestion",
    detailedSuggestion: "Seed suggestion details",
    messageId: "seed-message-id",
  },
];

const generatedSuggestions: Suggestion[] = [
  {
    id: "generated-1",
    title: "Generated suggestion",
    detailedSuggestion: "Generated suggestion details",
    messageId: "generated-message-id",
  },
];

describe("MessageSuggestions", () => {
  const mockUseGenui = jest.mocked(useGenui);
  const mockUseGenuiSuggestions = jest.mocked(useGenuiSuggestions);

  beforeEach(() => {
    mockUseGenui.mockReturnValue({
      messages: [],
      isStreaming: false,
      isIdle: true,
    } as never);

    mockUseGenuiSuggestions.mockReturnValue({
      suggestions: generatedSuggestions,
      selectedSuggestionId: null,
      accept: jest.fn(async () => undefined),
      isGenerating: false,
      error: null,
    } as never);
  });

  it("renders nothing when there are no messages and no initial suggestions", () => {
    const { container } = render(
      <MessageSuggestions>
        <MessageSuggestionsList />
      </MessageSuggestions>,
    );

    expect(container.firstChild).toBeNull();
  });

  it("uses caller-provided initial suggestions for empty threads", () => {
    render(
      <MessageSuggestions initialSuggestions={initialSuggestions}>
        <MessageSuggestionsList />
      </MessageSuggestions>,
    );

    expect(screen.getByText("Seed suggestion")).toBeInTheDocument();
    expect(screen.queryByText("Generated suggestion")).toBeNull();
  });

  it("uses generated suggestions once thread has messages", () => {
    mockUseGenui.mockReturnValue({
      messages: [
        {
          id: "msg-1",
          role: "assistant",
          content: [{ type: "text", text: "Hello" }],
          createdAt: new Date().toISOString(),
        },
      ],
      isStreaming: false,
      isIdle: true,
    } as never);

    render(
      <MessageSuggestions initialSuggestions={initialSuggestions}>
        <MessageSuggestionsList />
      </MessageSuggestions>,
    );

    expect(screen.getByText("Generated suggestion")).toBeInTheDocument();
    expect(screen.queryByText("Seed suggestion")).toBeNull();
  });
});
