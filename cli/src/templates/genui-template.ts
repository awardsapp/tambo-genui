/**
 * Template for the genui.ts file
 * This template will be used to generate a genui.ts file with empty registries
 */

export const genuiTsTemplate = `/**
 * @file genui.ts
 * @description Central configuration file for Genui components and tools
 * 
 * This file serves as the central place to register your Genui components and tools.
 * It exports arrays that will be used by the GenuiProvider.
 * 
 * IMPORTANT: If you have components in different directories (e.g., both ui/ and genui/),
 * make sure all import paths are consistent. Run 'npx genui migrate' to consolidate.
 * 
 * Read more about Genui at https://docs.genui.co
 */

import type { GenuiComponent } from "@workspace/react";


/**
 * Components Array - A collection of Genui components to register
 * 
 * Components represent UI elements that can be generated or controlled by AI.
 * Register your custom components here to make them available to the AI.
 * 
 * Example of adding a component:
 * 
 * \`\`\`typescript
 * import { z } from "zod/v4";
 * import { CustomChart } from "../components/ui/custom-chart";
 * 
 * // Define and add your component
 * export const components: GenuiComponent[] = [
 *   {
 *     name: "CustomChart",
 *     description: "Renders a custom chart with the provided data",
 *     component: CustomChart,
 *     propsSchema: z.object({
 *       data: z.array(z.number()),
 *       title: z.string().optional(),
 *     })
 *   }
 * ];
 * \`\`\`
 */
export const components: GenuiComponent[] = [];

// Import your custom components that utilize the Genui SDK
// import { CustomChart } from "../components/genui/custom-chart";
`;
