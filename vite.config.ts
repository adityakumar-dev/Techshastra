import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    allowedHosts: true,
    strictPort: true,
    proxy: {
      "/supabase-proxy": {
        target: "http://127.0.0.1:54321",
        changeOrigin: true,
        ws: true,
        rewrite: (path) => path.replace(/^\/supabase-proxy/, ""),
      },
    },
  },
  plugins: [react()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Core React runtime
          "vendor-react": ["react", "react-dom", "react-router-dom"],
          // UI component library
          "vendor-ui": [
            "@radix-ui/react-accordion",
            "@radix-ui/react-alert-dialog",
            "@radix-ui/react-avatar",
            "@radix-ui/react-checkbox",
            "@radix-ui/react-dialog",
            "@radix-ui/react-dropdown-menu",
            "@radix-ui/react-label",
            "@radix-ui/react-navigation-menu",
            "@radix-ui/react-popover",
            "@radix-ui/react-select",
            "@radix-ui/react-separator",
            "@radix-ui/react-slider",
            "@radix-ui/react-slot",
            "@radix-ui/react-switch",
            "@radix-ui/react-tabs",
            "@radix-ui/react-toast",
            "@radix-ui/react-tooltip",
          ],
          // Supabase client
          "vendor-supabase": ["@supabase/supabase-js"],
          // Animation
          "vendor-motion": ["framer-motion"],
          // Spreadsheet + email
          "vendor-tools": ["xlsx", "@emailjs/browser"],
          // StackBlitz SDK (heavy, used only on one page)
          "vendor-stackblitz": ["@stackblitz/sdk"],
          // Date utilities
          "vendor-date": ["date-fns"],
          // Form validation
          "vendor-forms": ["react-hook-form", "@hookform/resolvers", "zod"],
        },
      },
    },
    chunkSizeWarningLimit: 600,
  },
}));

