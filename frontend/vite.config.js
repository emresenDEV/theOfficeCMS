import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from "node:url";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    post: 5173,
    open: true,
    },
  resolve: {
    alias: {
      "react-router-dom": "react-router-dom",
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    }
  },
  build : {
    ourDir: "dist",
  },
  base: "./"
});
