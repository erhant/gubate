import type { SiteData } from "./types.js"

/**
 * Where the site document and the images live.
 * - On Vercel (a Blob store is connected): Vercel Blob.
 * - Locally: files under api/.data, images served from /uploads/*.
 */
export interface Storage {
  kind: "blob" | "local" | "none"
  readSite(): Promise<SiteData | null>
  writeSite(data: SiteData): Promise<void>
  /** stores an image and returns its public URL */
  putImage(name: string, body: ArrayBuffer, contentType: string): Promise<string>
  /** deletes images previously returned by putImage; other URLs are ignored */
  deleteImages(urls: string[]): Promise<void>
  /** local only: raw bytes for GET /uploads/:name */
  readUpload?(name: string): Promise<{ body: ArrayBuffer; contentType: string } | null>
}

const SITE_PATH = "data/site.json"
const SAFE_NAME = /^[a-z0-9][a-z0-9._-]{0,120}$/

export function safeName(name: string): string | null {
  const n = name
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/^-+/, "")
  return SAFE_NAME.test(n) ? n : null
}

function blobStorage(): Storage {
  // imported lazily so local development does not need Blob credentials
  const sdk = () => import("@vercel/blob")
  return {
    kind: "blob",
    async readSite() {
      const { head, BlobNotFoundError } = await sdk()
      try {
        const meta = await head(SITE_PATH)
        // the query string skips the CDN copy, which can lag a minute behind an overwrite
        const res = await fetch(`${meta.url}?v=${encodeURIComponent(meta.etag ?? Date.now())}`, { cache: "no-store" })
        return res.ok ? ((await res.json()) as SiteData) : null
      } catch (e) {
        if (e instanceof BlobNotFoundError) return null
        throw e
      }
    },
    async writeSite(data) {
      const { put } = await sdk()
      await put(SITE_PATH, JSON.stringify(data), {
        access: "public",
        allowOverwrite: true,
        contentType: "application/json",
        cacheControlMaxAge: 60,
      })
    },
    async putImage(name, body, contentType) {
      const { put } = await sdk()
      const blob = await put(`paintings/${name}`, body, { access: "public", addRandomSuffix: true, contentType })
      return blob.url
    },
    async deleteImages(urls) {
      const mine = urls.filter((u) => u.startsWith("https://") && u.includes(".blob.vercel-storage.com/"))
      if (!mine.length) return
      const { del } = await sdk()
      await del(mine)
    },
  }
}

function localStorage(): Storage {
  const dir = process.env.DATA_DIR ?? ".data"
  const fs = () => import("node:fs/promises")
  const types: Record<string, string> = { jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", webp: "image/webp" }
  return {
    kind: "local",
    async readSite() {
      const { readFile } = await fs()
      try {
        return JSON.parse(await readFile(`${dir}/site.json`, "utf8")) as SiteData
      } catch {
        return null
      }
    },
    async writeSite(data) {
      const { mkdir, writeFile } = await fs()
      await mkdir(dir, { recursive: true })
      await writeFile(`${dir}/site.json`, JSON.stringify(data, null, 2))
    },
    async putImage(name, body) {
      const { mkdir, writeFile } = await fs()
      await mkdir(`${dir}/uploads`, { recursive: true })
      const dot = name.lastIndexOf(".")
      const unique = `${name.slice(0, dot)}-${crypto.randomUUID().slice(0, 8)}${name.slice(dot)}`
      await writeFile(`${dir}/uploads/${unique}`, new Uint8Array(body))
      return `/uploads/${unique}`
    },
    async deleteImages(urls) {
      const { unlink } = await fs()
      for (const u of urls) {
        const name = u.startsWith("/uploads/") ? safeName(u.slice("/uploads/".length)) : null
        if (name) await unlink(`${dir}/uploads/${name}`).catch(() => {})
      }
    },
    async readUpload(name) {
      const safe = safeName(name)
      if (!safe) return null
      const { readFile } = await fs()
      try {
        const buf = await readFile(`${dir}/uploads/${safe}`)
        const ext = safe.slice(safe.lastIndexOf(".") + 1)
        return {
          body: buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer,
          contentType: types[ext] ?? "application/octet-stream",
        }
      } catch {
        return null
      }
    },
  }
}

/** Thrown when something must be stored but no storage is connected (Vercel without a Blob store). */
export class StorageNotConfiguredError extends Error {
  constructor() {
    super("No storage is configured: connect a Vercel Blob store to the project.")
  }
}

/**
 * Vercel's filesystem is read-only, so local files are not an option there. Without a Blob
 * store the site still renders (from the empty seed), and any save fails with a clear error.
 */
function noStorage(): Storage {
  const fail = async (): Promise<never> => {
    throw new StorageNotConfiguredError()
  }
  return { kind: "none", readSite: async () => null, writeSite: fail, putImage: fail, deleteImages: async () => {} }
}

export function createStorage(): Storage {
  const hasBlob = !!(process.env.BLOB_STORE_ID || process.env.BLOB_READ_WRITE_TOKEN)
  if (hasBlob) return blobStorage()
  return process.env.VERCEL ? noStorage() : localStorage()
}
