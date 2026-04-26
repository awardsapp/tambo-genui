import { renderHook } from "@testing-library/react";
import React from "react";
import { GenuiStubProvider } from "./genui-v1-stub-provider";
import { useGenui } from "../hooks/use-genui-v1";
import { useGenuiThreadInput } from "../hooks/use-genui-v1-thread-input";
import { useGenuiRegistry } from "../../providers/genui-registry-provider";
import { useGenuiClient } from "../../providers/genui-client-provider";
import type { GenuiThread } from "@workspace/client";

describe("GenuiStubProvider", () => {
  const mockThread: GenuiThread = {
    id: "thread_123",
    messages: [
      {
        id: "msg_1",
        role: "user",
        content: [{ type: "text", text: "Hello" }],
        createdAt: "2024-01-01T00:00:00Z",
      },
      {
        id: "msg_2",
        role: "assistant",
        content: [{ type: "text", text: "Hi there!" }],
        createdAt: "2024-01-01T00:00:01Z",
      },
    ],
    status: "idle",
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:01Z",
    lastRunCancelled: false,
  };

  describe("useGenui", () => {
    it("provides thread data via useGenui", () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <GenuiStubProvider thread={mockThread}>{children}</GenuiStubProvider>
      );

      const { result } = renderHook(() => useGenui(), {
        wrapper,
      });

      expect(result.current.messages).toHaveLength(2);
      expect(result.current.messages[0].id).toBe("msg_1");
      expect(result.current.messages[1].id).toBe("msg_2");
      expect(result.current.isIdle).toBe(true);
      expect(result.current.isStreaming).toBe(false);
    });

    it("returns empty messages when no thread provided", () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <GenuiStubProvider>{children}</GenuiStubProvider>
      );

      const { result } = renderHook(() => useGenui(), {
        wrapper,
      });

      expect(result.current.messages).toHaveLength(0);
      expect(result.current.isIdle).toBe(true);
    });

    it("shows streaming state when isStreaming prop is true", () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <GenuiStubProvider thread={mockThread} isStreaming>
          {children}
        </GenuiStubProvider>
      );

      const { result } = renderHook(() => useGenui(), {
        wrapper,
      });

      expect(result.current.isStreaming).toBe(true);
      expect(result.current.isIdle).toBe(false);
    });
  });

  describe("useGenuiThreadInput", () => {
    it("provides thread input context", () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <GenuiStubProvider thread={mockThread}>{children}</GenuiStubProvider>
      );

      const { result } = renderHook(() => useGenuiThreadInput(), { wrapper });

      expect(result.current.value).toBe("");
      expect(result.current.threadId).toBe("thread_123");
      expect(typeof result.current.setValue).toBe("function");
      expect(typeof result.current.submit).toBe("function");
    });

    it("uses initial input value when provided", () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <GenuiStubProvider thread={mockThread} inputValue="Hello world">
          {children}
        </GenuiStubProvider>
      );

      const { result } = renderHook(() => useGenuiThreadInput(), { wrapper });

      expect(result.current.value).toBe("Hello world");
    });

    it("calls custom onSubmit when provided", async () => {
      const mockOnSubmit = jest
        .fn()
        .mockResolvedValue({ threadId: "new_thread" });

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <GenuiStubProvider thread={mockThread} onSubmit={mockOnSubmit}>
          {children}
        </GenuiStubProvider>
      );

      const { result } = renderHook(() => useGenuiThreadInput(), { wrapper });

      const response = await result.current.submit();

      expect(mockOnSubmit).toHaveBeenCalled();
      expect(response.threadId).toBe("new_thread");
    });
  });

  describe("Registry", () => {
    it("registers provided components", () => {
      const TestComponent = () => <div>Test</div>;
      const components = [
        {
          name: "TestComponent",
          description: "A test component",
          component: TestComponent,
        },
      ];

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <GenuiStubProvider thread={mockThread} components={components}>
          {children}
        </GenuiStubProvider>
      );

      const { result } = renderHook(() => useGenuiRegistry(), { wrapper });

      expect(result.current.componentList.TestComponent).toBeDefined();
      expect(result.current.componentList.TestComponent.name).toBe(
        "TestComponent",
      );
    });

    it("registers provided tools", () => {
      const tools = [
        {
          name: "testTool",
          description: "A test tool",
          tool: async () => "result",
        },
      ];

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <GenuiStubProvider thread={mockThread} tools={tools as any}>
          {children}
        </GenuiStubProvider>
      );

      const { result } = renderHook(() => useGenuiRegistry(), { wrapper });

      expect(result.current.toolRegistry.testTool).toBeDefined();
      expect(result.current.toolRegistry.testTool.name).toBe("testTool");
    });
  });

  describe("Client", () => {
    it("provides stub client", () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <GenuiStubProvider thread={mockThread}>{children}</GenuiStubProvider>
      );

      const { result } = renderHook(() => useGenuiClient(), { wrapper });

      expect(result.current).toBeDefined();
    });
  });

  describe("Thread management", () => {
    it("provides thread management functions", () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <GenuiStubProvider thread={mockThread}>{children}</GenuiStubProvider>
      );

      const { result } = renderHook(() => useGenui(), {
        wrapper,
      });

      expect(typeof result.current.startNewThread).toBe("function");
      expect(typeof result.current.switchThread).toBe("function");
      expect(typeof result.current.initThread).toBe("function");
    });

    it("calls custom onStartNewThread when provided", () => {
      const mockStartNewThread = jest.fn().mockReturnValue("custom_thread_id");

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <GenuiStubProvider
          thread={mockThread}
          onStartNewThread={mockStartNewThread}
        >
          {children}
        </GenuiStubProvider>
      );

      const { result } = renderHook(() => useGenui(), {
        wrapper,
      });

      const newThreadId = result.current.startNewThread();

      expect(mockStartNewThread).toHaveBeenCalled();
      expect(newThreadId).toBe("custom_thread_id");
    });
  });

  describe("Messages-only thread", () => {
    it("accepts just messages array instead of full thread", () => {
      const messages = [
        {
          id: "msg_1",
          role: "user" as const,
          content: [{ type: "text" as const, text: "Hello" }],
          createdAt: "2024-01-01T00:00:00Z",
        },
      ];

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <GenuiStubProvider thread={{ messages }} threadId="custom_id">
          {children}
        </GenuiStubProvider>
      );

      const { result } = renderHook(() => useGenui(), { wrapper });

      expect(result.current.messages).toHaveLength(1);
      expect(result.current.messages[0].id).toBe("msg_1");
    });
  });
});
