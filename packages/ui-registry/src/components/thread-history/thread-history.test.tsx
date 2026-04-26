/// <reference types="@testing-library/jest-dom" />
import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { useGenui, useGenuiThreadList } from "@workspace/react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import {
  ThreadHistory,
  ThreadHistoryHeader,
  ThreadHistoryList,
  ThreadHistorySearch,
} from "./thread-history";

describe("ThreadHistory", () => {
  const mockUseGenui = jest.mocked(useGenui);
  const mockUseGenuiThreadList = jest.mocked(useGenuiThreadList);

  beforeEach(() => {
    mockUseGenui.mockReturnValue({
      switchThread: jest.fn(),
      startNewThread: jest.fn().mockReturnValue("new-thread-id"),
      currentThreadId: "thread-1",
      messages: [],
      isStreaming: false,
      isIdle: true,
    } as never);

    mockUseGenuiThreadList.mockReturnValue({
      data: {
        threads: [
          { id: "thread-1", createdAt: new Date().toISOString() },
          { id: "thread-2", createdAt: new Date().toISOString() },
        ],
      },
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    } as never);
  });

  it("filters threads from search input", async () => {
    const user = userEvent.setup();
    render(
      <ThreadHistory defaultCollapsed={false}>
        <ThreadHistoryHeader />
        <ThreadHistorySearch />
        <ThreadHistoryList />
      </ThreadHistory>,
    );

    expect(screen.getByText("Thread thread-1")).toBeInTheDocument();
    expect(screen.getByText("Thread thread-2")).toBeInTheDocument();

    await user.type(screen.getByPlaceholderText("Search..."), "thread-1");

    expect(screen.getByText("Thread thread-1")).toBeInTheDocument();
    expect(screen.queryByText("Thread thread-2")).toBeNull();
  });

  it("renders thread items in the list", () => {
    render(
      <ThreadHistory defaultCollapsed={false}>
        <ThreadHistoryList />
      </ThreadHistory>,
    );

    expect(screen.getByText("Thread thread-1")).toBeInTheDocument();
    expect(screen.getByText("Thread thread-2")).toBeInTheDocument();
  });
});
