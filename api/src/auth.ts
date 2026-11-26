import type { Context, MiddlewareHandler } from "hono"
import { deleteCookie, getSignedCookie, setSignedCookie } from "hono/cookie"

const COOKIE = "gubate_admin"
const MAX_AGE = 60 * 60 * 24 * 30 // 30 days: she should rarely have to sign in again on her phone

const env = () => ({ password: process.env.ADMIN_PASSWORD ?? "", secret: process.env.SESSION_SECRET ?? "" })

/** Admin is only usable when both variables are set and the secret is long enough. */
export const adminConfigured = () => {
  const { password, secret } = env()
  return password.length >= 8 && secret.length >= 32
}

async function digest(s: string): Promise<Uint8Array> {
  return new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s)))
}

/** Compares hashes byte by byte without an early exit, so timing does not leak the password. */
export async function passwordMatches(given: string): Promise<boolean> {
  const [a, b] = await Promise.all([digest(given), digest(env().password)])
  let diff = 0
  for (let i = 0; i < a.length; ++i) diff |= a[i]! ^ b[i]!
  return diff === 0
}

export async function startSession(c: Context) {
  const expires = Date.now() + MAX_AGE * 1000
  await setSignedCookie(c, COOKIE, String(expires), env().secret, {
    httpOnly: true,
    sameSite: "Strict",
    secure: new URL(c.req.url).protocol === "https:" || !!process.env.VERCEL,
    path: "/",
    maxAge: MAX_AGE,
  })
}

export function endSession(c: Context) {
  deleteCookie(c, COOKIE, { path: "/" })
}

export async function isAdmin(c: Context): Promise<boolean> {
  if (!adminConfigured()) return false
  const value = await getSignedCookie(c, env().secret, COOKIE)
  return typeof value === "string" && Number(value) > Date.now()
}

export const requireAdmin: MiddlewareHandler = async (c, next) => {
  if (!adminConfigured()) return c.json({ error: "admin_not_configured" }, 503)
  if (!(await isAdmin(c))) return c.json({ error: "unauthorized" }, 401)
  await next()
}
