/**
 * Genui-specific Custom Event Types for v1 Streaming API
 *
 * These types define the custom events emitted by the Genui backend that extend
 * the standard AG-UI event protocol. The backend is the source of truth for
 * these event definitions.
 *
 * IMPORTANT: These types MUST be kept in sync with the frontend SDK types at:
 * react-sdk/src/v1/types/event.ts
 *
 * TODO: Find a way to share these type definitions between frontend and backend
 * to avoid manual synchronization. Options to consider:
 * - Move to a shared package (e.g., @workspace-cloud/core)
 * - Generate frontend types from backend definitions
 * - Use a shared schema (e.g., JSON Schema, Zod) to generate both
 */

import { EventType } from "@ag-ui/core";
import type { Operation } from "fast-json-patch";

/**
 * Base fields for all Genui custom events.
 * This mirrors the AG-UI CustomEvent structure but with explicit typing.
 * The index signature ensures compatibility with AG-UI's Zod passthrough schema.
 */
interface GenuiCustomEventBase {
  /** Event type - always CUSTOM for Genui events */
  type: typeof EventType.CUSTOM;
  /** Unix timestamp in milliseconds */
  timestamp: number;
  /** Optional raw event data */
  rawEvent?: unknown;
  /** Index signature for AG-UI BaseEvent compatibility */
  [key: string]: unknown;
}

/**
 * Helper type to create a strongly-typed custom event envelope.
 * Combines base event fields with specific name and value types.
 */
type GenuiCustomEventEnvelope<
  TName extends string,
  TValue,
> = GenuiCustomEventBase & {
  name: TName;
  value: TValue;
};

// =============================================================================
// Component Streaming Events
// =============================================================================

/**
 * Value payload for component start event.
 */
export interface ComponentStartEventValue {
  /** ID of the message this component belongs to */
  messageId: string;
  /** Unique identifier for this component instance */
  componentId: string;
  /** Name of the component being rendered */
  componentName: string;
}

/**
 * Component start event (custom: genui.component.start)
 * Emitted when a component tool call begins streaming.
 */
export type ComponentStartEvent = GenuiCustomEventEnvelope<
  "genui.component.start",
  ComponentStartEventValue
>;

/**
 * Streaming status for individual component properties.
 */
export type PropStreamingStatus = "started" | "streaming" | "done";

/**
 * Value payload for component props delta event.
 */
export interface ComponentPropsDeltaEventValue {
  /** ID of the component being updated */
  componentId: string;
  /** JSON Patch operations (RFC 6902) to apply to props */
  operations: Operation[];
  /** Current streaming status of each property */
  streamingStatus: Record<string, PropStreamingStatus>;
}

/**
 * Component props delta event (custom: genui.component.props_delta)
 * Uses JSON Patch (RFC 6902) to incrementally update component props.
 */
export type ComponentPropsDeltaEvent = GenuiCustomEventEnvelope<
  "genui.component.props_delta",
  ComponentPropsDeltaEventValue
>;

/**
 * Value payload for component state delta event.
 */
export interface ComponentStateDeltaEventValue {
  /** ID of the component being updated */
  componentId: string;
  /** JSON Patch operations (RFC 6902) to apply to state */
  operations: Operation[];
}

/**
 * Component state delta event (custom: genui.component.state_delta)
 * Uses JSON Patch (RFC 6902) to incrementally update component state.
 */
export type ComponentStateDeltaEvent = GenuiCustomEventEnvelope<
  "genui.component.state_delta",
  ComponentStateDeltaEventValue
>;

/**
 * Value payload for component end event.
 */
export interface ComponentEndEventValue {
  /** ID of the component that finished streaming */
  componentId: string;
  /** Final resolved props for the component */
  finalProps: Record<string, unknown>;
  /** Final resolved state for the component (if any) */
  finalState: Record<string, unknown> | undefined;
}

/**
 * Component end event (custom: genui.component.end)
 * Emitted when component streaming completes.
 */
export type ComponentEndEvent = GenuiCustomEventEnvelope<
  "genui.component.end",
  ComponentEndEventValue
>;

// =============================================================================
// Run Lifecycle Events
// =============================================================================

/**
 * Information about a pending tool call awaiting client-side execution.
 */
export interface PendingToolCall {
  /** Unique identifier for this tool call */
  toolCallId: string;
  /** Name of the tool to be executed */
  toolName: string;
  /** JSON-encoded arguments for the tool */
  arguments: string;
}

/**
 * Value payload for run awaiting input event.
 */
export interface RunAwaitingInputEventValue {
  /** Tool calls that need client-side execution */
  pendingToolCalls: PendingToolCall[];
}

/**
 * Run awaiting input event (custom: genui.run.awaiting_input)
 * Signals that the run is paused waiting for client-side tool execution.
 */
export type RunAwaitingInputEvent = GenuiCustomEventEnvelope<
  "genui.run.awaiting_input",
  RunAwaitingInputEventValue
>;

// =============================================================================
// Message Parent Events
// =============================================================================

/**
 * Value payload for message parent event.
 */
export interface MessageParentEventValue {
  /** ID of the child message */
  messageId: string;
  /** ID of the parent message that spawned this message */
  parentMessageId: string;
}

/**
 * Message parent event (custom: genui.message.parent)
 * Emitted when a message was created during the generation of another message
 * (e.g., MCP sampling or elicitation).
 */
export type MessageParentEvent = GenuiCustomEventEnvelope<
  "genui.message.parent",
  MessageParentEventValue
>;

// =============================================================================
// Union Types and Constants
// =============================================================================

/**
 * Union of all Genui-specific custom events.
 */
export type GenuiCustomEvent =
  | ComponentStartEvent
  | ComponentPropsDeltaEvent
  | ComponentStateDeltaEvent
  | ComponentEndEvent
  | RunAwaitingInputEvent
  | MessageParentEvent;

/**
 * Known Genui custom event names.
 */
export const GENUI_CUSTOM_EVENT_NAMES = [
  "genui.component.start",
  "genui.component.props_delta",
  "genui.component.state_delta",
  "genui.component.end",
  "genui.run.awaiting_input",
  "genui.message.parent",
] as const;

export type GenuiCustomEventName = (typeof GENUI_CUSTOM_EVENT_NAMES)[number];

// =============================================================================
// Factory Functions
// =============================================================================

/**
 * Create a component start event.
 */
export function createComponentStartEvent(
  value: ComponentStartEventValue,
): ComponentStartEvent {
  return {
    type: EventType.CUSTOM,
    name: "genui.component.start",
    value,
    timestamp: Date.now(),
  };
}

/**
 * Create a component props delta event.
 */
export function createComponentPropsDeltaEvent(
  value: ComponentPropsDeltaEventValue,
): ComponentPropsDeltaEvent {
  return {
    type: EventType.CUSTOM,
    name: "genui.component.props_delta",
    value,
    timestamp: Date.now(),
  };
}

/**
 * Create a component state delta event.
 */
export function createComponentStateDeltaEvent(
  value: ComponentStateDeltaEventValue,
): ComponentStateDeltaEvent {
  return {
    type: EventType.CUSTOM,
    name: "genui.component.state_delta",
    value,
    timestamp: Date.now(),
  };
}

/**
 * Create a component end event.
 */
export function createComponentEndEvent(
  value: ComponentEndEventValue,
): ComponentEndEvent {
  return {
    type: EventType.CUSTOM,
    name: "genui.component.end",
    value,
    timestamp: Date.now(),
  };
}

/**
 * Create a run awaiting input event.
 */
export function createRunAwaitingInputEvent(
  value: RunAwaitingInputEventValue,
): RunAwaitingInputEvent {
  return {
    type: EventType.CUSTOM,
    name: "genui.run.awaiting_input",
    value,
    timestamp: Date.now(),
  };
}

/**
 * Create a message parent event.
 */
export function createMessageParentEvent(
  value: MessageParentEventValue,
): MessageParentEvent {
  return {
    type: EventType.CUSTOM,
    name: "genui.message.parent",
    value,
    timestamp: Date.now(),
  };
}
