import path from "path"
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
// @ts-expect-error - Tailwind v4 type definition issue compatibility
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})
