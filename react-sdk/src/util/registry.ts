import GenuiAI from "@workspace/typescript-sdk";
import {
  ComponentContextToolMetadata,
  ComponentRegistry,
  DefineToolFn,
  RegisteredComponent,
  GenuiTool,
  GenuiToolAssociations,
  GenuiToolRegistry,
} from "../model/component-metadata";
import {
  getParametersFromToolSchema,
  isStandardSchema,
  schemaToJsonSchema,
} from "../schema";

/**
 * Get all the available components from the component registry
 * @param componentRegistry - The component registry
 * @param toolRegistry - The tool registry
 * @param toolAssociations - The tool associations
 * @returns The available components
 */
export const getAvailableComponents = (
  componentRegistry: ComponentRegistry,
  toolRegistry: GenuiToolRegistry,
  toolAssociations: GenuiToolAssociations,
): GenuiAI.AvailableComponent[] => {
  const availableComponents: GenuiAI.AvailableComponent[] = [];

  for (const [name, componentEntry] of Object.entries(componentRegistry)) {
    const associatedToolNames = toolAssociations[name] ?? [];

    const contextTools = associatedToolNames
      .map((toolName) => {
        const tool = toolRegistry[toolName];
        if (!tool) return null;
        return mapGenuiToolToContextTool(tool);
      })
      .filter((tool): tool is ComponentContextToolMetadata => tool !== null);

    availableComponents.push({
      name: componentEntry.name,
      description: componentEntry.description,
      props: componentEntry.props,
      contextTools,
    });
  }

  return availableComponents;
};

/**
 * Get tools from tool registry that are not associated with any component
 * @param toolRegistry - The tool registry
 * @param toolAssociations - The tool associations
 * @returns The tools that are not associated with any component
 */
export const getUnassociatedTools = (
  toolRegistry: GenuiToolRegistry,
  toolAssociations: GenuiToolAssociations,
): GenuiTool[] => {
  return Object.values(toolRegistry).filter((tool) => {
    // Check if the tool's name appears in any of the tool association arrays
    return !Object.values(toolAssociations).flat().includes(tool.name);
  });
};

/**
 * Helper function to convert component props from Standard Schema or JSON Schema
 * @param component - The component to convert
 * @returns The converted props as JSON Schema
 */
export const convertPropsToJsonSchema = (
  component: RegisteredComponent,
): unknown => {
  if (!component.props) {
    return component.props;
  }

  // Check if props is a Standard Schema (Zod, Valibot, ArkType, etc.)
  if (isStandardSchema(component.props)) {
    return schemaToJsonSchema(component.props);
  }

  // Already JSON Schema or unknown format - return as-is
  return component.props;
};

/**
 * Get a component by name from the component registry
 * @param componentName - The name of the component to get
 * @param componentRegistry - The component registry
 * @returns The component registration information
 */
export const getComponentFromRegistry = (
  componentName: string,
  componentRegistry: ComponentRegistry,
): RegisteredComponent => {
  const componentEntry = componentRegistry[componentName];

  if (!componentEntry) {
    throw new Error(
      `Genui tried to use Component ${componentName}, but it was not found.`,
    );
  }

  return componentEntry;
};

/**
 * Map a Genui tool to a context tool
 * @param tool - The tool to map
 * @returns The context tool
 */
export const mapGenuiToolToContextTool = (
  tool: GenuiTool,
): ComponentContextToolMetadata => {
  const parameters = getParametersFromToolSchema(tool);

  return {
    name: tool.name,
    description: tool.description,
    parameters,
    ...("maxCalls" in tool && tool.maxCalls !== undefined
      ? { maxCalls: tool.maxCalls }
      : {}),
    ...("annotations" in tool && tool.annotations !== undefined
      ? { annotations: tool.annotations }
      : {}),
  };
};

/**
 * Provides type safety for defining a Genui Tool.
 *
 * Genui uses the [standard-schema.dev](https://standard-schema.dev) spec which means you can use any Standard Schema
 * compliant validator (Zod, Valibot, ArkType, etc.). This ensures the tool function args and output types are correctly
 * inferred from the provided schemas.
 * @example
 * ```typescript
 * import { z } from "zod/v4";
 *
 * const myTool = defineGenuiTool({
 *   // ...
 * });
 * ```
 * @param tool The tool definition to register
 * @returns The registered tool definition
 */
export const defineTool: DefineToolFn = (tool: any) => {
  if ("toolSchema" in tool) {
    return tool;
  }
  tool.inputSchema ??= { type: "object", properties: {}, required: [] };
  tool.outputSchema ??= { type: "object", properties: {}, required: [] };
  return tool;
};
