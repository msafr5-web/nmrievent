import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    exclude: ["**/*.int.test.ts", "**/node_modules/**"],
    env: { NODE_ENV: "test", LOG_LEVEL: "silent" },
    coverage: { provider: "v8", include: ["src/lib/**", "src/app/api/**"] },
  },
});
