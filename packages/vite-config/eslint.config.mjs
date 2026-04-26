import baseConfig from "@workspace/eslint-config/base";
import { defineConfig } from "eslint/config";

export default defineConfig(baseConfig, {
  languageOptions: {
    parserOptions: {
      projectService: {
        allowDefaultProject: ["*.mjs", "*.config.ts"],
      },
    },
  },
});
