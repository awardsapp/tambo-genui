import { genuiViteConfig } from "@workspace/vite-config";
import react from "@vitejs/plugin-react";
import { mergeConfig } from "vite";

export default mergeConfig(
  {
    plugins: [react()],
  },
  genuiViteConfig({
    entry: [
      "./src/index.ts",
      // TODO(lachieh): we shouldn't need to set this as an entrypoint.
      // No idea why, but vite (rolldown?) is not exporting the constants file,
      // even though it is exported from the index and imported by other files.
      "./src/message-input/constants.ts",
    ],
  }),
);
