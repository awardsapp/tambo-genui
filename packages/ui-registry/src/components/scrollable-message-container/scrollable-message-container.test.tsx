/// <reference types="@testing-library/jest-dom" />
import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { useGenui } from "@workspace/react";
import { render } from "@testing-library/react";
import React from "react";
import { ScrollableMessageContainer } from "./scrollable-message-container";

// @workspace/react is mocked via moduleNameMapper in jest.config.ts

describe("ScrollableMessageContainer", () => {
  const mockUseGenui = jest.mocked(useGenui);

  beforeEach(() => {
    mockUseGenui.mockReturnValue({
      messages: [],
      isStreaming: false,
      isIdle: true,
    } as never);
  });

  it("renders children correctly", () => {
    const { getByText } = render(
      <ScrollableMessageContainer>
        <div>Test Content</div>
      </ScrollableMessageContainer>,
    );
    expect(getByText("Test Content")).toBeInTheDocument();
  });

  it("applies custom className", () => {
    const { container } = render(
      <ScrollableMessageContainer className="custom-class">
        <div>Content</div>
      </ScrollableMessageContainer>,
    );
    const scrollContainer = container.querySelector(
      '[data-slot="scrollable-message-container"]',
    );
    expect(scrollContainer).toHaveClass("custom-class");
  });

  it("has default scroll styling classes", () => {
    const { container } = render(
      <ScrollableMessageContainer>
        <div>Content</div>
      </ScrollableMessageContainer>,
    );
    const scrollContainer = container.querySelector(
      '[data-slot="scrollable-message-container"]',
    );
    expect(scrollContainer).toHaveClass("flex-1", "overflow-y-auto");
  });

  it("passes through additional props", () => {
    const { container } = render(
      <ScrollableMessageContainer data-testid="test-container">
        <div>Content</div>
      </ScrollableMessageContainer>,
    );
    const scrollContainer = container.querySelector(
      '[data-slot="scrollable-message-container"]',
    );
    expect(scrollContainer).toHaveAttribute("data-testid", "test-container");
  });
});
