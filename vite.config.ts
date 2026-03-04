import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/api": "http://localhost:3001",
    },
  },
  resolve: {
    alias: {
      "@deck-web/schema": path.resolve(__dirname, "shared/schema/PresentationSchema.ts"),
      "@deck-web/registry": path.resolve(__dirname, "shared/registry/SlideTemplates.ts"),
    },
  },
});
