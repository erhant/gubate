import type { SiteData } from "./types"

async function json<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new ApiError(res.status, (body as { error?: string }).error ?? "error")
  }
  return res.json() as Promise<T>
}

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string
  ) {
    super(code)
  }
}

// After a save, this browser asks for that exact version, so the person who made a change sees it
// on the site at once while everyone else gets the cached copy (at most a couple of minutes old).
const REV_KEY = "gubate:rev"
const savedRev = (): string => {
  try {
    return localStorage.getItem(REV_KEY) ?? ""
  } catch {
    return ""
  }
}
const rememberRev = (site: SiteData): SiteData => {
  try {
    localStorage.setItem(REV_KEY, site.updatedAt)
  } catch {
    // private browsing: the site is simply a little stale for her too
  }
  return site
}

export const getSite = () => {
  const rev = savedRev()
  return fetch(rev ? `/api/site?v=${encodeURIComponent(rev)}` : "/api/site").then((r) => json<SiteData>(r))
}

export const admin = {
  me: () => fetch("/api/admin/me").then((r) => json<{ configured: boolean; signedIn: boolean }>(r)),
  login: (password: string) =>
    fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    }).then((r) => json<{ ok: true }>(r)),
  logout: () => fetch("/api/admin/logout", { method: "POST" }).then((r) => json<{ ok: true }>(r)),
  getSite: () => fetch("/api/admin/site").then((r) => json<SiteData>(r)),
  saveSite: (site: SiteData, baseUpdatedAt: string) =>
    fetch("/api/admin/site", {
      method: "PUT",
      headers: { "Content-Type": "application/json", "X-Base-Updated-At": baseUpdatedAt },
      body: JSON.stringify(site),
    })
      .then((r) => json<SiteData>(r))
      .then(rememberRev),
  upload: (name: string, blob: Blob) =>
    fetch(`/api/admin/upload?name=${encodeURIComponent(name)}`, {
      method: "POST",
      headers: { "Content-Type": blob.type },
      body: blob,
    }).then((r) => json<{ url: string }>(r)),
}
