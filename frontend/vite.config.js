import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
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
    }
  },
  build : {
    ourDir: "dist",
  },
  base: "./"
});
