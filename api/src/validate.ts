import type { Painting, Series, SiteData, TimelineEntry } from "./types.js"

const HEX = /^#[0-9a-fA-F]{6}$/
const ID = /^[a-z0-9][a-z0-9-]{0,63}$/

const str = (v: unknown, max: number): string => (typeof v === "string" ? v.slice(0, max) : "")
const num = (v: unknown, min: number, max: number): number | null =>
  typeof v === "number" && Number.isFinite(v) && v >= min && v <= max ? v : null
const url = (v: unknown): string => {
  const s = str(v, 600)
  return s.startsWith("/") || s.startsWith("https://") ? s : ""
}

function painting(v: any): Painting | null {
  if (!v || typeof v !== "object" || !ID.test(v.id)) return null
  const pal = Array.isArray(v.palette) ? v.palette : []
  const images = v.images ?? {}
  const p: Painting = {
    id: v.id,
    title: str(v.title, 120),
    technique: str(v.technique, 120),
    widthCm: num(v.widthCm, 1, 1000),
    heightCm: num(v.heightCm, 1, 1000),
    year: num(v.year, 1900, 2200),
    sold: v.sold === true,
    hidden: v.hidden === true,
    palette: [0, 1, 2].map((i) => (HEX.test(pal[i]) ? pal[i].toLowerCase() : "#f4f2ec")) as Painting["palette"],
    aspect: num(v.aspect, 0.1, 10) ?? 1,
    images: { small: url(images.small), medium: url(images.medium), large: url(images.large) },
  }
  return p.images.small && p.images.medium && p.images.large ? p : null
}

/**
 * Builds the series list from a document of any vintage.
 *
 * Older documents also had "groups": a single-choice label stored on the painting as groupId.
 * Groups and series are now one thing, so each old group becomes a series holding its paintings
 * in gallery order. A painting ends up in at most one series: the first one that lists it wins.
 */
export function seriesOf(v: any, paintingIds: Set<string>): Series[] {
  const series: Series[] = (Array.isArray(v?.series) ? v.series : [])
    .slice(0, 100)
    .filter((s: any) => s && ID.test(s.id))
    .map((s: any) => ({
      id: s.id as string,
      name: str(s.name, 80),
      paintingIds: (Array.isArray(s.paintingIds) ? s.paintingIds : []).filter((id: unknown) => typeof id === "string"),
    }))
  for (const g of Array.isArray(v?.groups) ? v.groups : []) {
    if (!g || !ID.test(g.id)) continue
    let target = series.find((s) => s.id === g.id)
    if (!target) {
      target = { id: g.id, name: str(g.name, 80), paintingIds: [] }
      series.push(target)
    }
    for (const p of Array.isArray(v?.paintings) ? v.paintings : []) {
      if (p?.groupId === g.id && typeof p.id === "string") target.paintingIds.push(p.id)
    }
  }
  const taken = new Set<string>()
  for (const s of series) {
    s.paintingIds = s.paintingIds.filter((id) => paintingIds.has(id) && !taken.has(id) && !!taken.add(id))
  }
  return series
}

/** Brings a document read from storage to the current shape without otherwise changing it. */
export function upgradeStored(stored: any): SiteData {
  const { groups: _groups, ...rest } = stored
  const paintings = (Array.isArray(stored.paintings) ? stored.paintings : []).map(
    ({ groupId: _groupId, ...p }: any) => p
  )
  return { ...rest, paintings, series: seriesOf(stored, new Set(paintings.map((p: any) => p.id))) }
}

/** Coerces untrusted input into a valid SiteData, or returns null if it is not even close. */
export function sanitizeSite(input: unknown): SiteData | null {
  const v = input as any
  if (!v || typeof v !== "object" || !Array.isArray(v.paintings)) return null
  const seen = new Set<string>()
  const paintings = (v.paintings as unknown[])
    .slice(0, 500)
    .map(painting)
    .filter((p): p is Painting => !!p && !seen.has(p.id) && !!seen.add(p.id))
  const series = seriesOf(v, seen)
  const about = v.about ?? {}
  const contact = v.contact ?? {}
  const timeline: TimelineEntry[] = (Array.isArray(about.timeline) ? about.timeline : [])
    .slice(0, 200)
    .map((t: any) => ({ year: str(t?.year, 12), text: str(t?.text, 400) }))
    .filter((t: TimelineEntry) => t.text)
  return {
    version: 1,
    updatedAt: new Date().toISOString(),
    paintings,
    series,
    featured: (Array.isArray(v.featured) ? v.featured : [])
      .filter((id: unknown) => typeof id === "string" && seen.has(id))
      .slice(0, 12),
    about: {
      lead: str(about.lead, 400),
      paragraphs: (Array.isArray(about.paragraphs) ? about.paragraphs : [])
        .slice(0, 20)
        .map((p: unknown) => str(p, 3000))
        .filter(Boolean),
      timeline,
    },
    contact: {
      email: str(contact.email, 200),
      phone: str(contact.phone, 40),
      instagram: str(contact.instagram, 100),
      whatsapp: str(contact.whatsapp, 20).replace(/\D/g, ""),
    },
  }
}
