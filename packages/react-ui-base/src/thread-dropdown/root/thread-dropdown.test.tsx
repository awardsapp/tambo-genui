import { describe, expect, it, jest } from "@jest/globals";
import { useGenui, useGenuiThreadList } from "@workspace/react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ThreadDropdown } from "../index";

function makeThread(id: string) {
  return {
    id,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    runStatus: "idle" as const,
  };
}

describe("ThreadDropdown", () => {
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
        threads: [makeThread("thread-1"), makeThread("thread-2")],
      },
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    } as never);
  });

  it("renders Root with data-slot attribute", () => {
    const { container } = render(
      <ThreadDropdown.Root>
        <span>child</span>
      </ThreadDropdown.Root>,
    );

    expect(
      container.querySelector('[data-slot="thread-dropdown"]'),
    ).toBeTruthy();
    expect(screen.getByText("child")).toBeTruthy();
  });

  it("throws when parts are used outside Root", () => {
    const spy = jest.spyOn(console, "error").mockImplementation(() => {});
    expect(() => render(<ThreadDropdown.Trigger />)).toThrow(
      "ThreadDropdownContext is missing",
    );
    spy.mockRestore();
  });

  it("renders trigger as a button without hardcoded aria-label", () => {
    render(
      <ThreadDropdown.Root>
        <ThreadDropdown.Trigger>Open</ThreadDropdown.Trigger>
      </ThreadDropdown.Root>,
    );

    expect(screen.getByRole("button", { name: "Open" })).toBeTruthy();
  });

  it("renders content with data-slot attribute", () => {
    const { container } = render(
      <ThreadDropdown.Root>
        <ThreadDropdown.Content>Content</ThreadDropdown.Content>
      </ThreadDropdown.Root>,
    );

    expect(
      container.querySelector('[data-slot="thread-dropdown-content"]'),
    ).toBeTruthy();
  });

  it("calls switchThread when thread item is clicked", async () => {
    const mockSwitchThread = jest.fn();
    mockUseGenui.mockReturnValue({
      switchThread: mockSwitchThread,
      startNewThread: jest.fn().mockReturnValue("new-id"),
      currentThreadId: "thread-1",
      messages: [],
      isStreaming: false,
      isIdle: true,
    } as never);

    const user = userEvent.setup();

    render(
      <ThreadDropdown.Root>
        <ThreadDropdown.ThreadItem thread={makeThread("thread-2")}>
          Thread 2
        </ThreadDropdown.ThreadItem>
      </ThreadDropdown.Root>,
    );

    await user.click(screen.getByText("Thread 2"));
    expect(mockSwitchThread).toHaveBeenCalledWith("thread-2");
  });

  it("calls startNewThread and refetch when new thread is clicked", async () => {
    const mockStartNewThread = jest.fn().mockReturnValue("new-id");
    const mockRefetch = jest.fn(async () => undefined);

    mockUseGenui.mockReturnValue({
      switchThread: jest.fn(),
      startNewThread: mockStartNewThread,
      currentThreadId: "thread-1",
      messages: [],
      isStreaming: false,
      isIdle: true,
    } as never);

    mockUseGenuiThreadList.mockReturnValue({
      data: { threads: [] },
      isLoading: false,
      error: null,
      refetch: mockRefetch,
    } as never);

    const user = userEvent.setup();

    render(
      <ThreadDropdown.Root>
        <ThreadDropdown.NewThread>New Thread</ThreadDropdown.NewThread>
      </ThreadDropdown.Root>,
    );

    await user.click(screen.getByText("New Thread"));
    expect(mockStartNewThread).toHaveBeenCalled();
    expect(mockRefetch).toHaveBeenCalled();
  });

  it("invokes onThreadChange callback on thread switch", async () => {
    const onThreadChange = jest.fn();
    const user = userEvent.setup();

    render(
      <ThreadDropdown.Root onThreadChange={onThreadChange}>
        <ThreadDropdown.ThreadItem thread={makeThread("thread-2")}>
          Thread 2
        </ThreadDropdown.ThreadItem>
      </ThreadDropdown.Root>,
    );

    await user.click(screen.getByText("Thread 2"));
    expect(onThreadChange).toHaveBeenCalled();
  });
});
