import { defineConfig } from "vite";

export default defineConfig(async () => ({
  clearScreen: false,
  server: {
    port: 1420,
    strictPort: true,
    watch: {
      ignored: ["**/src-tauri/**"],
    },
  },
  build: {
    target: "es2020",
    minify: "esbuild",
    cssCodeSplit: true,
    chunkSizeWarningLimit: 1500,
    rollupOptions: {
      input: {
        main: "index.html",
      },
      output: {
        manualChunks: {
          three: ["three"],
          pdf: ["pdfjs-dist", "pdf-lib"],
          excel: ["exceljs"],
          charts: ["chart.js"],
        },
      },
    },
  },
}));
