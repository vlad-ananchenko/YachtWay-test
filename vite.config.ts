import { defineConfig } from "vite";

const base = process.env.VITE_BASE ?? "/test-task/";

export default defineConfig({
  base,
  css: {
    preprocessorOptions: { scss: { api: "modern" } },
  },
  server: { host: true, port: 5173 },
  preview: { host: true, port: 4173 },
});
