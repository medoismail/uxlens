import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";
import { copyFileSync, mkdirSync, existsSync, readdirSync } from "fs";

/** Copy static extension files (manifest, icons) to dist after build */
function copyExtensionFiles() {
  return {
    name: "copy-extension-files",
    closeBundle() {
      const dist = resolve(__dirname, "dist");
      const assetsDir = resolve(dist, "assets");
      if (!existsSync(assetsDir)) mkdirSync(assetsDir, { recursive: true });

      // Copy manifest.json
      copyFileSync(resolve(__dirname, "manifest.json"), resolve(dist, "manifest.json"));

      // Copy icons
      const srcAssets = resolve(__dirname, "assets");
      if (existsSync(srcAssets)) {
        for (const file of readdirSync(srcAssets)) {
          copyFileSync(resolve(srcAssets, file), resolve(assetsDir, file));
        }
      }
    },
  };
}

export default defineConfig(({ mode }) => ({
  plugins: [react(), copyExtensionFiles()],
  define: {
    __API_BASE__: JSON.stringify(
      mode === "development"
        ? "http://localhost:3000"
        : "https://www.uxlens.pro"
    ),
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
    rollupOptions: {
      input: {
        popup: resolve(__dirname, "popup/index.html"),
        "service-worker": resolve(__dirname, "background/service-worker.ts"),
        capture: resolve(__dirname, "content/capture.ts"),
        "auth-bridge": resolve(__dirname, "content/auth-bridge.ts"),
        offscreen: resolve(__dirname, "offscreen/offscreen.html"),
      },
      output: {
        entryFileNames: (chunk) => {
          if (chunk.name === "service-worker") return "background/service-worker.js";
          if (chunk.name === "capture") return "content/capture.js";
          if (chunk.name === "auth-bridge") return "content/auth-bridge.js";
          return "[name]/[name].js";
        },
        chunkFileNames: "shared/[name]-[hash].js",
        assetFileNames: (info) => {
          if (info.name?.endsWith(".css")) return "popup/styles.css";
          return "assets/[name][extname]";
        },
      },
    },
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "."),
    },
  },
}));
