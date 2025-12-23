import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: parseInt(process.env.PORT || process.env.VITE_PORT || '5173'),  // Dynamic port for multi-player
    strictPort: false,  // Allow fallback if port is taken
    // Required for @linera/client WASM to work (SharedArrayBuffer)
    headers: {
      "Cross-Origin-Opener-Policy": "same-origin",
      "Cross-Origin-Embedder-Policy": "credentialless",
    },
  },
  // Build configuration - match DeadKeys pattern for WASM bundling
  build: {
    target: 'esnext',
    rollupOptions: {
      input: {
        index: 'index.html',
        linera: '@linera/client',
      },
      preserveEntrySignatures: 'strict',
    },
  },
  // Don't pre-bundle WASM modules
  optimizeDeps: {
    exclude: ["@linera/client", "@linera/signer"],
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
