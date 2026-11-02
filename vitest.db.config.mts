import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

/** اختبارات التكامل على PostgreSQL حقيقي: `npm run test:db` */
export default defineConfig({
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
  test: {
    environment: "node",
    include: ["src/**/*.int.test.ts"],
    env: { NODE_ENV: "test", LOG_LEVEL: "silent" },
    testTimeout: 30_000,
    hookTimeout: 120_000,
    fileParallelism: false,
  },
});
