import { EventType, type CustomEvent } from "@ag-ui/core";
import { asGenuiCustomEvent, isGenuiCustomEvent } from "@workspace/client";

describe("isGenuiCustomEvent", () => {
  it("returns true for genui.component.start event", () => {
    const event = {
      type: EventType.CUSTOM,
      name: "genui.component.start",
      value: { messageId: "msg1", componentId: "comp1", componentName: "Test" },
    };
    expect(isGenuiCustomEvent(event)).toBe(true);
  });

  it("returns true for genui.component.props_delta event", () => {
    const event = {
      type: EventType.CUSTOM,
      name: "genui.component.props_delta",
      value: { componentId: "comp1", operations: [] },
    };
    expect(isGenuiCustomEvent(event)).toBe(true);
  });

  it("returns true for genui.component.state_delta event", () => {
    const event = {
      type: EventType.CUSTOM,
      name: "genui.component.state_delta",
      value: { componentId: "comp1", operations: [] },
    };
    expect(isGenuiCustomEvent(event)).toBe(true);
  });

  it("returns true for genui.component.end event", () => {
    const event = {
      type: EventType.CUSTOM,
      name: "genui.component.end",
      value: { componentId: "comp1" },
    };
    expect(isGenuiCustomEvent(event)).toBe(true);
  });

  it("returns true for genui.run.awaiting_input event", () => {
    const event = {
      type: EventType.CUSTOM,
      name: "genui.run.awaiting_input",
      value: {
        pendingToolCalls: [
          { toolCallId: "tool1", toolName: "test", arguments: "{}" },
        ],
      },
    };
    expect(isGenuiCustomEvent(event)).toBe(true);
  });

  it("returns true for genui.message.parent event", () => {
    const event = {
      type: EventType.CUSTOM,
      name: "genui.message.parent",
      value: { messageId: "msg1", parentMessageId: "parent1" },
    };
    expect(isGenuiCustomEvent(event)).toBe(true);
  });

  it("returns false for unknown custom event name", () => {
    const event = {
      type: EventType.CUSTOM,
      name: "unknown.event",
      value: {},
    };
    expect(isGenuiCustomEvent(event)).toBe(false);
  });

  it("returns false when name is undefined", () => {
    const event: { name?: string } = {};
    expect(isGenuiCustomEvent(event)).toBe(false);
  });

  it("returns false when name is not a string", () => {
    const event = {
      type: EventType.CUSTOM,
      name: 123,
      value: {},
    };
    expect(isGenuiCustomEvent(event as unknown as { name?: string })).toBe(
      false,
    );
  });

  it("returns false for empty object", () => {
    expect(isGenuiCustomEvent({})).toBe(false);
  });
});

describe("asGenuiCustomEvent", () => {
  it("casts genui.message.parent event", () => {
    const event = {
      type: EventType.CUSTOM,
      name: "genui.message.parent",
      value: { messageId: "msg1", parentMessageId: "parent1" },
      timestamp: 1234,
    } as CustomEvent;

    const result = asGenuiCustomEvent(event);
    expect(result).toBeDefined();
    expect(result?.name).toBe("genui.message.parent");
  });

  it("returns undefined for unknown event name", () => {
    const event = {
      type: EventType.CUSTOM,
      name: "unknown.event",
      value: {},
      timestamp: 1234,
    } as CustomEvent;

    expect(asGenuiCustomEvent(event)).toBeUndefined();
  });
});
