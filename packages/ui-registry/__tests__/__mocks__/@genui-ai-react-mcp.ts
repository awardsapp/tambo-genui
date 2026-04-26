// Jest manual mock for @workspace/react/mcp used by registry component tests.
//
// Tests should cast the exported hooks to `jest.MockedFunction<typeof useGenuiMcpPromptList>`
// (etc) when they need to override behavior for a specific scenario.

import { jest } from "@jest/globals";
import type { Mock } from "jest-mock";

export const useGenuiMcpPromptList: Mock = jest.fn().mockReturnValue({
  data: [],
  isLoading: false,
  error: undefined,
});

export const useGenuiMcpPrompt: Mock = jest.fn().mockReturnValue({
  data: undefined,
  error: undefined,
});

export const useGenuiMcpResourceList: Mock = jest.fn().mockReturnValue({
  data: [],
  isLoading: false,
  error: undefined,
});

export const useGenuiMcpResource: Mock = jest.fn().mockReturnValue({
  data: undefined,
  error: undefined,
});

export const useGenuiMcpElicitation: Mock = jest.fn().mockReturnValue({
  elicitation: null,
  resolveElicitation: jest.fn(),
});

export const useGenuiElicitationContext = useGenuiMcpElicitation;

export const useGenuiMcpServers: Mock = jest.fn().mockReturnValue([]);

export const isMcpResourceEntry: Mock = jest.fn().mockReturnValue(false);

export const GenuiMcpProvider = jest.fn();
export const MCPTransport = jest.fn();
