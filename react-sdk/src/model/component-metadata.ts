// Re-exported from @workspace/client, with React-specific overrides for
// GenuiComponent and RegisteredComponent which use ComponentType<any>
// instead of the client's framework-agnostic `unknown`.
import type { ComponentType } from "react";
import type {
  GenuiComponent as BaseGenuiComponent,
  RegisteredComponent as BaseRegisteredComponent,
} from "@workspace/client";

// Re-export everything from client that doesn't need React-specific overrides
export type {
  SupportedSchema,
  ToolAnnotations,
  ParameterSpec,
  ComponentContextToolMetadata,
  ComponentContextTool,
  GenuiToolRegistry,
  JSONSchemaLite,
  GenuiTool,
  GenuiToolJSONSchema,
  GenuiToolUnknown,
  GenuiToolStandardSchema,
  UnsupportedSchemaGenuiTool,
  GenuiToolAssociations,
  RegisterToolsFn,
  RegisterToolFn,
  DefineToolFn,
} from "@workspace/client";

/**
 * React-specific RegisteredComponent with ComponentType fields.
 */
export interface RegisteredComponent extends Omit<
  BaseRegisteredComponent,
  "component" | "loadingComponent"
> {
  component: ComponentType<any>;
  loadingComponent?: ComponentType<any>;
}

export type ComponentRegistry = Record<string, RegisteredComponent>;

/**
 * React-specific GenuiComponent with ComponentType fields.
 */
export interface GenuiComponent extends Omit<
  BaseGenuiComponent,
  "component" | "loadingComponent"
> {
  /**
   * The React component to render.
   *
   * Make sure to pass the Component itself, not an instance of the component. For example,
   * if you have a component like this:
   *
   * ```tsx
   * const MyComponent = () => {
   *   return <div>My Component</div>;
   * };
   * ```
   *
   * You should pass the `Component`:
   *
   * ```tsx
   * const components = [MyComponent];
   * <GenuiRegistryProvider components={components} />
   * ```
   */
  component: ComponentType<any>;
  /** The loading component to render while the component is loading */
  loadingComponent?: ComponentType<any>;
}
