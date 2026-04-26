import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";
import {
  type LlmProviderConfig,
  llmProviderConfig,
} from "@workspace-cloud/core";

export const llmRouter = createTRPCRouter({
  getLlmProviderConfig: publicProcedure.query((): LlmProviderConfig => {
    return llmProviderConfig;
  }),
});
