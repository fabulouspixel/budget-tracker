import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: "/budget-tracker/",
  plugins: [react()],
  test: {
    environment: "jsdom",
  },
});

