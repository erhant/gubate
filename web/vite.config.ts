import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

// In development the API runs separately (api: `pnpm dev`, port 3001).
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/api": "http://localhost:3001",
      "/uploads": "http://localhost:3001",
    },
  },
})
