"use client";

/**
 * useGenuiThreadInput - Thread Input Hook
 *
 * Re-exports the shared thread input hook from the provider.
 * This hook uses shared context, enabling features like suggestions
 * to update the input field directly.
 *
 * For direct thread control without shared state, use useGenuiSendMessage instead.
 */

export {
  useGenuiThreadInput,
  type GenuiThreadInputContextProps,
  type SubmitOptions,
} from "../providers/genui-v1-thread-input-provider";
