/**
 * Genui-specific Custom Event Types for Streaming API
 *
 * Defines custom events specific to Genui functionality.
 * For standard AG-UI events, import directly from `@ag-ui/core`.
 */

import type { CustomEvent } from "@ag-ui/core";
import type { Operation } from "fast-json-patch";

type GenuiCustomEventEnvelope<TName extends string, TValue> = Omit<
  CustomEvent,
  "name" | "value"
> & {
  name: TName;
  value: TValue;
};

/**
 * Component start event (custom: genui.component.start)
 */
export type ComponentStartEvent = GenuiCustomEventEnvelope<
  "genui.component.start",
  {
    messageId: string;
    componentId: string;
    componentName: string;
  }
>;

/**
 * Component props delta event (custom: genui.component.props_delta)
 * Uses JSON Patch (RFC 6902) to update component props
 */
export type ComponentPropsDeltaEvent = GenuiCustomEventEnvelope<
  "genui.component.props_delta",
  {
    componentId: string;
    operations: Operation[];
  }
>;

/**
 * Component state delta event (custom: genui.component.state_delta)
 * Uses JSON Patch (RFC 6902) to update component state
 */
export type ComponentStateDeltaEvent = GenuiCustomEventEnvelope<
  "genui.component.state_delta",
  {
    componentId: string;
    operations: Operation[];
  }
>;

/**
 * Component end event (custom: genui.component.end)
 */
export type ComponentEndEvent = GenuiCustomEventEnvelope<
  "genui.component.end",
  {
    componentId: string;
  }
>;

/**
 * Pending tool call information from awaiting_input event
 */
export interface PendingToolCall {
  toolCallId: string;
  toolName: string;
  arguments: string;
}

/**
 * Run awaiting input event (custom: genui.run.awaiting_input)
 * Signals that the run is paused waiting for client-side tool execution
 */
export type RunAwaitingInputEvent = GenuiCustomEventEnvelope<
  "genui.run.awaiting_input",
  {
    pendingToolCalls: PendingToolCall[];
  }
>;

/**
 * Message parent event (custom: genui.message.parent)
 * Emitted when a message was created during the generation of another message
 * (e.g., MCP sampling or elicitation).
 */
export type MessageParentEvent = GenuiCustomEventEnvelope<
  "genui.message.parent",
  {
    messageId: string;
    parentMessageId: string;
  }
>;

/**
 * Union type of Genui-specific custom events
 */
export type GenuiCustomEvent =
  | ComponentStartEvent
  | ComponentPropsDeltaEvent
  | ComponentStateDeltaEvent
  | ComponentEndEvent
  | RunAwaitingInputEvent
  | MessageParentEvent;

/**
 * Known Genui custom event names for type narrowing
 */
const GENUI_CUSTOM_EVENT_NAMES = [
  "genui.component.start",
  "genui.component.props_delta",
  "genui.component.state_delta",
  "genui.component.end",
  "genui.run.awaiting_input",
  "genui.message.parent",
] as const;

/**
 * Type guard to check if an event is a Genui custom event.
 * Validates that the event has a name matching known Genui custom event types.
 * @param event - Event object to check
 * @param event.name - Event name to match against known Genui event types
 * @returns True if event is a GenuiCustomEvent
 */
export function isGenuiCustomEvent(event: {
  name?: string;
}): event is GenuiCustomEvent {
  return (
    typeof event.name === "string" &&
    (GENUI_CUSTOM_EVENT_NAMES as readonly string[]).includes(event.name)
  );
}

/**
 * Casts a CustomEvent to the specific GenuiCustomEvent type based on its name.
 * Uses exhaustive type checking to ensure all event types are handled.
 * @param event - The CustomEvent to cast
 * @returns The properly typed GenuiCustomEvent, or undefined if not a known Genui event
 */
export function asGenuiCustomEvent(
  event: CustomEvent,
): GenuiCustomEvent | undefined {
  switch (event.name) {
    case "genui.component.start":
      return event as ComponentStartEvent;
    case "genui.component.props_delta":
      return event as ComponentPropsDeltaEvent;
    case "genui.component.state_delta":
      return event as ComponentStateDeltaEvent;
    case "genui.component.end":
      return event as ComponentEndEvent;
    case "genui.run.awaiting_input":
      return event as RunAwaitingInputEvent;
    case "genui.message.parent":
      return event as MessageParentEvent;
    default:
      return undefined;
  }
}
