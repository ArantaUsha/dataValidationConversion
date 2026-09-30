import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  base: "./", // relative paths so the built page can be hosted from any sub-path
  test: {
    environment: "jsdom",
    setupFiles: ["./src/__tests__/setup.js"],
    globals: true,
  },
});
