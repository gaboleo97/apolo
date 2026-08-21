import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["packages/**/src/**/*.test.ts", "apps/web/lib/**/*.test.ts"],
    env: {
      DATABASE_URL: "postgres://postgres:postgres@localhost:54322/postgres",
    },
  },
});
