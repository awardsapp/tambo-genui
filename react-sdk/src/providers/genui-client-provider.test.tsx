import { renderHook } from "@testing-library/react";
import React from "react";
import {
  GenuiClientProvider,
  GenuiClientProviderProps,
  useIsGenuiTokenUpdating,
  useGenuiClient,
  useGenuiQueryClient,
} from "./genui-client-provider";

// Mock the session token hook to control token fetching state
jest.mock("./hooks/use-genui-session-token", () => ({
  useGenuiSessionToken: jest.fn(),
}));

import { useGenuiSessionToken } from "./hooks/use-genui-session-token";

// Add fetch polyfill for jsdom environment (GenuiAI SDK requires it)
const mockFetch = jest.fn();
let previousFetch: typeof fetch;

beforeEach(() => {
  mockFetch.mockReset();
  previousFetch = global.fetch;
  global.fetch = mockFetch as unknown as typeof fetch;
});

afterEach(() => {
  global.fetch = previousFetch;
});

describe("GenuiClientProvider", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Default mock: not fetching
    jest.mocked(useGenuiSessionToken).mockReturnValue({
      isFetching: false,
      data: undefined,
      error: null,
      isLoading: false,
      isError: false,
      isSuccess: false,
      status: "pending",
      fetchStatus: "idle",
    } as any);
  });

  const createWrapper = (props: GenuiClientProviderProps) => {
    const Wrapper = ({ children }: { children: React.ReactNode }) => (
      <GenuiClientProvider {...props}>{children}</GenuiClientProvider>
    );
    Wrapper.displayName = "TestWrapper";
    return Wrapper;
  };

  describe("Client Configuration", () => {
    it("should create client accessible via useGenuiClient hook", () => {
      const { result } = renderHook(() => useGenuiClient(), {
        wrapper: createWrapper({ apiKey: "test-api-key" }),
      });

      // Client should be a GenuiAI instance with expected shape
      expect(result.current).toBeDefined();
      expect(result.current.beta).toBeDefined();
    });

    it("should provide the same client instance on re-renders", () => {
      const { result, rerender } = renderHook(() => useGenuiClient(), {
        wrapper: createWrapper({ apiKey: "test-api-key" }),
      });

      const firstClient = result.current;
      rerender();
      const secondClient = result.current;

      expect(firstClient).toBe(secondClient);
    });

    it("should configure client with provided genuiUrl", () => {
      const { result } = renderHook(() => useGenuiClient(), {
        wrapper: createWrapper({
          apiKey: "test-api-key",
          genuiUrl: "https://custom.genui.api",
        }),
      });

      expect(result.current.baseURL).toBe("https://custom.genui.api");
    });

    it("should configure client with provided environment", async () => {
      const { result } = renderHook(() => useGenuiClient(), {
        wrapper: createWrapper({
          apiKey: "test-api-key",
          environment: "staging",
        }),
      });

      const { url } = await result.current.buildRequest({
        method: "get",
        path: "/test-endpoint",
      });

      expect(url).toBe("https://hydra-api-dev.up.railway.app/test-endpoint");
    });

    it("should throw if both genuiUrl and environment are provided", () => {
      const consoleSpy = jest.spyOn(console, "error").mockImplementation();

      expect(() => {
        renderHook(() => useGenuiClient(), {
          wrapper: createWrapper({
            apiKey: "test-api-key",
            genuiUrl: "https://custom.genui.api",
            environment: "staging",
          }),
        });
      }).toThrow(
        "Ambiguous URL; The `baseURL` option (or GENUI_AI_BASE_URL env var) and the `environment` option are given. If you want to use the environment you must pass baseURL: null",
      );

      consoleSpy.mockRestore();
    });

    it("should include additional headers in client configuration", async () => {
      const { result } = renderHook(() => useGenuiClient(), {
        wrapper: createWrapper({
          apiKey: "test-api-key",
          additionalHeaders: {
            "X-Custom-Header": "custom-value",
            "X-Another-Header": "another-value",
          },
        }),
      });

      const { req } = await result.current.buildRequest({
        method: "get",
        path: "/test-endpoint",
      });

      expect(req.headers.get("X-Genui-React-Version")).toBeDefined();
      expect(req.headers.get("X-Genui-React-Version")).toMatch(/\d+\.\d+\.\d+/); // version format
      expect(req.headers.get("X-Custom-Header")).toBe("custom-value");
      expect(req.headers.get("X-Another-Header")).toBe("another-value");
    });
  });

  describe("Token State", () => {
    it("should expose isUpdatingToken=true when session token is fetching", () => {
      jest.mocked(useGenuiSessionToken).mockReturnValue({
        isFetching: true,
      } as any);

      const { result } = renderHook(() => useIsGenuiTokenUpdating(), {
        wrapper: createWrapper({
          apiKey: "test-api-key",
          userToken: "oauth-token",
        }),
      });

      expect(result.current).toBe(true);
    });

    it("should expose isUpdatingToken=false when not fetching", () => {
      jest.mocked(useGenuiSessionToken).mockReturnValue({
        isFetching: false,
      } as any);

      const { result } = renderHook(() => useIsGenuiTokenUpdating(), {
        wrapper: createWrapper({ apiKey: "test-api-key" }),
      });

      expect(result.current).toBe(false);
    });

    it("should call useGenuiSessionToken with userToken when provided", () => {
      renderHook(() => useGenuiClient(), {
        wrapper: createWrapper({
          apiKey: "test-api-key",
          userToken: "my-oauth-token",
        }),
      });

      expect(useGenuiSessionToken).toHaveBeenCalledWith(
        expect.anything(), // client
        expect.anything(), // queryClient
        "my-oauth-token",
      );
    });
  });
});

describe("Hook Contracts", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    jest.mocked(useGenuiSessionToken).mockReturnValue({
      isFetching: false,
    } as any);
  });

  const createWrapper = (props: { apiKey: string }) => {
    const Wrapper = ({ children }: { children: React.ReactNode }) => (
      <GenuiClientProvider {...props}>{children}</GenuiClientProvider>
    );
    Wrapper.displayName = "TestWrapper";
    return Wrapper;
  };

  describe("useGenuiClient", () => {
    it("should return client instance inside provider", () => {
      const { result } = renderHook(() => useGenuiClient(), {
        wrapper: createWrapper({ apiKey: "test-api-key" }),
      });

      expect(result.current).toBeDefined();
      expect(result.current.beta).toBeDefined();
    });

    it("should throw descriptive error outside provider", () => {
      // Suppress console.error for this test
      const consoleSpy = jest.spyOn(console, "error").mockImplementation();

      expect(() => {
        renderHook(() => useGenuiClient());
      }).toThrow("useGenuiClient must be used within a GenuiClientProvider");

      consoleSpy.mockRestore();
    });
  });

  describe("useGenuiQueryClient", () => {
    it("should return QueryClient instance inside provider", () => {
      const { result } = renderHook(() => useGenuiQueryClient(), {
        wrapper: createWrapper({ apiKey: "test-api-key" }),
      });

      expect(result.current).toBeDefined();
      expect(typeof result.current.getQueryCache).toBe("function");
    });

    it("should throw descriptive error outside provider", () => {
      const consoleSpy = jest.spyOn(console, "error").mockImplementation();

      expect(() => {
        renderHook(() => useGenuiQueryClient());
      }).toThrow(
        "useGenuiQueryClient must be used within a GenuiClientProvider",
      );

      consoleSpy.mockRestore();
    });
  });

  describe("useIsGenuiTokenUpdating", () => {
    it("should throw descriptive error outside provider", () => {
      const consoleSpy = jest.spyOn(console, "error").mockImplementation();

      expect(() => {
        renderHook(() => useIsGenuiTokenUpdating());
      }).toThrow(
        "useIsGenuiTokenUpdating must be used within a GenuiClientProvider",
      );

      consoleSpy.mockRestore();
    });
  });
});
