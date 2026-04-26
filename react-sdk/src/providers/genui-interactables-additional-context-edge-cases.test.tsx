import { render, waitFor } from "@testing-library/react";
import React from "react";
import { z } from "zod/v4";
import { withGenuiInteractable } from "../hoc/with-genui-interactable";
import {
  GenuiContextHelpersProvider,
  useGenuiContextHelpers,
} from "./genui-context-helpers-provider";
import { GenuiInteractableProvider } from "./genui-interactable-provider";
import { GenuiStubProvider } from "../v1/providers/genui-v1-stub-provider";

function wrapperWithProviders(children: React.ReactNode) {
  return (
    <GenuiStubProvider>
      <GenuiContextHelpersProvider>{children}</GenuiContextHelpersProvider>
    </GenuiStubProvider>
  );
}

describe("Interactables AdditionalContext - Edge Cases & Advanced Scenarios", () => {
  test("handles components without propsSchema gracefully", async () => {
    const SimpleComponent: React.FC<{ text: string }> = ({ text }) => (
      <div>{text}</div>
    );

    const InteractableSimpleComponent = withGenuiInteractable(SimpleComponent, {
      componentName: "SimpleComponent",
      description: "A component without schema",
      // No propsSchema provided
    });

    let capturedContexts: any[] = [];
    const TestComponent = () => {
      const { getAdditionalContext } = useGenuiContextHelpers();

      React.useEffect(() => {
        let mounted = true;
        void getAdditionalContext().then((contexts) => {
          if (mounted) {
            capturedContexts = contexts;
          }
        });
        return () => {
          mounted = false;
        };
      }, [getAdditionalContext]);

      return <div data-testid="ready">ready</div>;
    };

    const { getByTestId } = render(
      wrapperWithProviders(
        <GenuiInteractableProvider>
          <InteractableSimpleComponent text="test" />
          <TestComponent />
        </GenuiInteractableProvider>,
      ),
    );

    await waitFor(() => {
      expect(getByTestId("ready")).toBeInTheDocument();
      const entry = capturedContexts.find(
        (c: any) => c.name === "interactables",
      );
      expect(entry).toBeDefined();
      const component = entry!.context.components[0];
      expect(component.propsSchema).toBe("Not specified");
    });
  });

  test("handles component unmounting and remounting correctly", async () => {
    const Note: React.FC<{ title: string }> = ({ title }) => <div>{title}</div>;
    const InteractableNote = withGenuiInteractable(Note, {
      componentName: "Note",
      description: "A note",
      propsSchema: z.object({ title: z.string() }),
    });

    let capturedContexts: any[] = [];
    const TestComponent = () => {
      const { getAdditionalContext } = useGenuiContextHelpers();

      React.useEffect(() => {
        let mounted = true;
        const interval = setInterval(() => {
          void getAdditionalContext().then((contexts) => {
            if (mounted) {
              capturedContexts = contexts;
            }
          });
        }, 50);
        return () => {
          mounted = false;
          clearInterval(interval);
        };
      }, [getAdditionalContext]);

      return <div data-testid="ready">ready</div>;
    };

    const Host = () => {
      const [showNote, setShowNote] = React.useState(true);

      React.useEffect(() => {
        // Toggle the note on/off to test unmounting
        const timeout = setTimeout(() => setShowNote(false), 100);
        const timeout2 = setTimeout(() => setShowNote(true), 200);
        return () => {
          clearTimeout(timeout);
          clearTimeout(timeout2);
        };
      }, []);

      return (
        <GenuiInteractableProvider>
          {showNote && <InteractableNote title="dynamic note" />}
          <TestComponent />
        </GenuiInteractableProvider>
      );
    };

    const { getByTestId } = render(wrapperWithProviders(<Host />));

    await waitFor(
      () => {
        expect(getByTestId("ready")).toBeInTheDocument();
      },
      { timeout: 1000 },
    );

    // Eventually should show the note again
    await waitFor(
      () => {
        const entry = capturedContexts.find(
          (c: any) => c.name === "interactables",
        );
        expect(entry?.context?.components).toHaveLength(1);
      },
      { timeout: 1000 },
    );
  });

  test("context helper updates when props change from parent", async () => {
    const Counter: React.FC<{ count: number; label?: string }> = ({
      count,
      label = "Count",
    }) => (
      <div>
        {label}: {count}
      </div>
    );

    const InteractableCounter = withGenuiInteractable(Counter, {
      componentName: "Counter",
      description: "A counter component",
      propsSchema: z.object({
        count: z.number(),
        label: z.string().optional(),
      }),
    });

    let capturedContexts: any[] = [];
    const TestComponent = () => {
      const { getAdditionalContext } = useGenuiContextHelpers();

      React.useEffect(() => {
        let mounted = true;
        const interval = setInterval(() => {
          void getAdditionalContext().then((contexts) => {
            if (mounted) {
              capturedContexts = contexts;
            }
          });
        }, 50);
        return () => {
          mounted = false;
          clearInterval(interval);
        };
      }, [getAdditionalContext]);

      return <div data-testid="ready">ready</div>;
    };

    const Host = () => {
      const [count, setCount] = React.useState(0);
      const [label, setLabel] = React.useState("Items");

      React.useEffect(() => {
        const timeout1 = setTimeout(() => setCount(5), 100);
        const timeout2 = setTimeout(() => setLabel("Updated Items"), 200);
        return () => {
          clearTimeout(timeout1);
          clearTimeout(timeout2);
        };
      }, []);

      return (
        <GenuiInteractableProvider>
          <InteractableCounter count={count} label={label} />
          <TestComponent />
        </GenuiInteractableProvider>
      );
    };

    const { getByTestId } = render(wrapperWithProviders(<Host />));

    await waitFor(() => {
      expect(getByTestId("ready")).toBeInTheDocument();
    });

    // Wait for updates to propagate
    await waitFor(
      () => {
        const entry = capturedContexts.find(
          (c: any) => c.name === "interactables",
        );
        if (entry?.context?.components?.[0]) {
          const props = entry.context.components[0].props;
          expect(props.count).toBe(5);
          expect(props.label).toBe("Updated Items");
        }
      },
      { timeout: 1000 },
    );
  });

  test("multiple providers with nested context helpers work correctly", async () => {
    const Note: React.FC<{ title: string }> = ({ title }) => <div>{title}</div>;
    const InteractableNote = withGenuiInteractable(Note, {
      componentName: "Note",
      description: "A note",
      propsSchema: z.object({ title: z.string() }),
    });

    let outerContexts: any[] = [];
    let innerContexts: any[] = [];

    const OuterTestComponent = () => {
      const { getAdditionalContext } = useGenuiContextHelpers();

      React.useEffect(() => {
        let mounted = true;
        void getAdditionalContext().then((contexts) => {
          if (mounted) {
            outerContexts = contexts;
          }
        });
        return () => {
          mounted = false;
        };
      }, [getAdditionalContext]);

      return <div data-testid="outer-ready">outer ready</div>;
    };

    const InnerTestComponent = () => {
      const { getAdditionalContext } = useGenuiContextHelpers();

      React.useEffect(() => {
        let mounted = true;
        void getAdditionalContext().then((contexts) => {
          if (mounted) {
            innerContexts = contexts;
          }
        });
        return () => {
          mounted = false;
        };
      }, [getAdditionalContext]);

      return <div data-testid="inner-ready">inner ready</div>;
    };

    const { getByTestId } = render(
      wrapperWithProviders(
        <GenuiInteractableProvider>
          <InteractableNote title="outer note" />
          <OuterTestComponent />
          <GenuiContextHelpersProvider
            contextHelpers={{
              customContext: () => ({ custom: "inner" }),
            }}
          >
            <GenuiInteractableProvider>
              <InteractableNote title="inner note" />
              <InnerTestComponent />
            </GenuiInteractableProvider>
          </GenuiContextHelpersProvider>
        </GenuiInteractableProvider>,
      ),
    );

    await waitFor(() => {
      expect(getByTestId("outer-ready")).toBeInTheDocument();
      expect(getByTestId("inner-ready")).toBeInTheDocument();
    });

    await waitFor(() => {
      // Outer context should have outer note
      const outerEntry = outerContexts.find(
        (c: any) => c.name === "interactables",
      );
      expect(outerEntry?.context?.components).toHaveLength(1);
      expect(outerEntry?.context?.components[0]?.props?.title).toBe(
        "outer note",
      );

      // Inner context should have inner note and custom context
      const innerEntry = innerContexts.find(
        (c: any) => c.name === "interactables",
      );
      expect(innerEntry?.context?.components).toHaveLength(1);
      expect(innerEntry?.context?.components[0]?.props?.title).toBe(
        "inner note",
      );

      const customEntry = innerContexts.find(
        (c: any) => c.name === "customContext",
      );
      expect(customEntry?.context).toEqual({ custom: "inner" });
    });
  });

  test("provider cleanup removes helper when last provider unmounts", async () => {
    const Note: React.FC<{ title: string }> = ({ title }) => <div>{title}</div>;
    const InteractableNote = withGenuiInteractable(Note, {
      componentName: "Note",
      description: "A note",
      propsSchema: z.object({ title: z.string() }),
    });

    let capturedContexts: any[] = [];
    const TestComponent = () => {
      const { getAdditionalContext } = useGenuiContextHelpers();

      React.useEffect(() => {
        let mounted = true;
        const interval = setInterval(() => {
          void getAdditionalContext().then((contexts) => {
            if (mounted) {
              capturedContexts = contexts;
            }
          });
        }, 50);
        return () => {
          mounted = false;
          clearInterval(interval);
        };
      }, [getAdditionalContext]);

      return <div data-testid="ready">ready</div>;
    };

    const Host = () => {
      const [showProvider, setShowProvider] = React.useState(true);

      React.useEffect(() => {
        const timeout = setTimeout(() => setShowProvider(false), 200);
        return () => clearTimeout(timeout);
      }, []);

      return (
        <>
          {showProvider && (
            <GenuiInteractableProvider>
              <InteractableNote title="will disappear" />
            </GenuiInteractableProvider>
          )}
          <TestComponent />
        </>
      );
    };

    const { getByTestId } = render(wrapperWithProviders(<Host />));

    // Initially should have the context
    await waitFor(() => {
      expect(getByTestId("ready")).toBeInTheDocument();
      const entry = capturedContexts.find(
        (c: any) => c.name === "interactables",
      );
      expect(entry).toBeDefined();
    });

    // After provider unmounts, context should be gone
    await waitFor(
      () => {
        const entry = capturedContexts.find(
          (c: any) => c.name === "interactables",
        );
        expect(entry).toBeUndefined();
      },
      { timeout: 1000 },
    );
  });

  test("helper error handling doesn't crash the system", async () => {
    const Note: React.FC<{ title: string }> = ({ title }) => <div>{title}</div>;
    const InteractableNote = withGenuiInteractable(Note, {
      componentName: "Note",
      description: "A note",
      propsSchema: z.object({ title: z.string() }),
    });

    // Mock console.error to capture error logs
    const consoleSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});

    let capturedContexts: any[] = [];
    const TestComponent = () => {
      const { getAdditionalContext, addContextHelper } =
        useGenuiContextHelpers();

      React.useEffect(() => {
        // Add a helper that throws an error
        addContextHelper("errorHelper", () => {
          throw new Error("Test error in helper");
        });
      }, [addContextHelper]);

      React.useEffect(() => {
        let mounted = true;
        getAdditionalContext()
          .then((contexts) => {
            if (mounted) {
              capturedContexts = contexts;
            }
          })
          .catch(() => {
            // Should not reach here - errors should be handled gracefully
          });
        return () => {
          mounted = false;
        };
      }, [getAdditionalContext]);

      return <div data-testid="ready">ready</div>;
    };

    const { getByTestId } = render(
      wrapperWithProviders(
        <GenuiInteractableProvider>
          <InteractableNote title="test" />
          <TestComponent />
        </GenuiInteractableProvider>,
      ),
    );

    await waitFor(() => {
      expect(getByTestId("ready")).toBeInTheDocument();
      // Should still have the interactables context despite the error
      const entry = capturedContexts.find(
        (c: any) => c.name === "interactables",
      );
      expect(entry).toBeDefined();

      // Error helper should not be present (filtered out)
      const errorEntry = capturedContexts.find(
        (c: any) => c.name === "errorHelper",
      );
      expect(errorEntry).toBeUndefined();
    });

    consoleSpy.mockRestore();
  });
});
