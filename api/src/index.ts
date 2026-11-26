import { Hono } from "hono"
import { adminConfigured, endSession, isAdmin, passwordMatches, requireAdmin, startSession } from "./auth"
import { devSeed } from "./devSeed"
import { seed } from "./seed"
import { createStorage, safeName } from "./storage"
import type { Painting, SiteData } from "./types"
import { sanitizeSite } from "./validate"

const storage = createStorage()

// The site document changes a few times a month, so keep it in memory between requests.
let memo: { at: number; data: SiteData } | null = null
const MEMO_MS = 60_000

async function loadSite(fresh = false): Promise<SiteData> {
  if (!fresh && memo && Date.now() - memo.at < MEMO_MS) return memo.data
  const stored = await storage.readSite()
  // documents saved before a field existed are completed here; local development starts with placeholders
  const data = stored ? { ...stored, series: stored.series ?? [] } : storage.kind === "local" ? devSeed : seed
  memo = { at: Date.now(), data }
  return data
}

const imageUrls = (p: Painting) => [p.images.small, p.images.medium, p.images.large]

const api = new Hono()

/** Public: everything the site needs, without hidden paintings. */
api.get("/site", async (c) => {
  const site = await loadSite()
  const visible = new Set(site.paintings.filter((p) => !p.hidden).map((p) => p.id))
  c.header("Cache-Control", "public, s-maxage=60, stale-while-revalidate=600")
  return c.json({
    ...site,
    paintings: site.paintings.filter((p) => visible.has(p.id)),
    featured: site.featured.filter((id) => visible.has(id)),
    series: site.series.map((s) => ({ ...s, paintingIds: s.paintingIds.filter((id) => visible.has(id)) })),
  })
})

api.get("/admin/me", async (c) => c.json({ configured: adminConfigured(), signedIn: await isAdmin(c) }))

api.post("/admin/login", async (c) => {
  if (!adminConfigured()) return c.json({ error: "admin_not_configured" }, 503)
  const body = await c.req.json().catch(() => null)
  // a fixed delay makes guessing slow without keeping any state
  await new Promise((r) => setTimeout(r, 600))
  if (typeof body?.password !== "string" || !(await passwordMatches(body.password)))
    return c.json({ error: "wrong_password" }, 401)
  await startSession(c)
  return c.json({ ok: true })
})

api.post("/admin/logout", (c) => {
  endSession(c)
  return c.json({ ok: true })
})

/** Admin: the full document, hidden paintings included. */
api.get("/admin/site", requireAdmin, async (c) => {
  c.header("Cache-Control", "no-store")
  return c.json(await loadSite(true))
})

/** Admin: replaces the whole document. Images that are no longer referenced are deleted. */
api.put("/admin/site", requireAdmin, async (c) => {
  const next = sanitizeSite(await c.req.json().catch(() => null))
  if (!next) return c.json({ error: "invalid_document" }, 400)
  const prev = await loadSite(true)
  // refuse to save over a newer version (for example the panel left open in two tabs)
  const base = c.req.header("x-base-updated-at")
  if (base && base !== prev.updatedAt) return c.json({ error: "stale", updatedAt: prev.updatedAt }, 409)
  await storage.writeSite(next)
  memo = { at: Date.now(), data: next }
  const kept = new Set(next.paintings.flatMap(imageUrls))
  const orphaned = prev.paintings.flatMap(imageUrls).filter((u) => !kept.has(u))
  await storage.deleteImages(orphaned).catch((e) => console.error("could not delete images", e))
  return c.json(next)
})

/** Admin: stores one already-resized image. Vercel Functions accept at most 4.5 MB per request. */
api.post("/admin/upload", requireAdmin, async (c) => {
  const name = safeName(c.req.query("name") ?? "")
  const type = c.req.header("content-type") ?? ""
  if (!name || !/^image\/(jpeg|png|webp)$/.test(type)) return c.json({ error: "bad_image" }, 400)
  const body = await c.req.arrayBuffer()
  if (body.byteLength === 0 || body.byteLength > 4_300_000) return c.json({ error: "too_large" }, 413)
  return c.json({ url: await storage.putImage(name, body, type) })
})

/** Local development only: serves images written by the local storage. */
api.get("/uploads/:name", async (c) => {
  const file = await storage.readUpload?.(c.req.param("name"))
  if (!file) return c.notFound()
  return c.body(file.body, 200, {
    "Content-Type": file.contentType,
    "Cache-Control": "public, max-age=31536000, immutable",
  })
})

// Mounted twice so the routes work whether or not the platform strips the /api prefix.
const app = new Hono()
app.route("/api", api)
app.route("/", api)
app.onError((err, c) => {
  console.error(err)
  return c.json({ error: "server_error" }, 500)
})

export default app
