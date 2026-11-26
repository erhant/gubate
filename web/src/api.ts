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

export const getSite = () => fetch("/api/site").then((r) => json<SiteData>(r))

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
    }).then((r) => json<SiteData>(r)),
  upload: (name: string, blob: Blob) =>
    fetch(`/api/admin/upload?name=${encodeURIComponent(name)}`, {
      method: "POST",
      headers: { "Content-Type": blob.type },
      body: blob,
    }).then((r) => json<{ url: string }>(r)),
}
