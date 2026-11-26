// Local development server: `pnpm dev`. On Vercel the default export of src/index.ts is used directly.
import { serve } from "@hono/node-server"
import app from "./src/index.js"

const port = Number(process.env.PORT ?? 3001)
serve({ fetch: app.fetch, port }, () => console.log(`gubate api on http://localhost:${port}`))
