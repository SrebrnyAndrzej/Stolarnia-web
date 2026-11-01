import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  root: "web",
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      // STOLARNIA_API pozwala podpiąć frontend do serwera testowego na osobnych danych.
      "/api": process.env.STOLARNIA_API ?? "http://localhost:3210",
      "/mcp": process.env.STOLARNIA_API ?? "http://localhost:3210",
    },
  },
  build: {
    outDir: "../dist/web",
    emptyOutDir: true,
  },
});
