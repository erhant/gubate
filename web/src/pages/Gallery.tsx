import { useEffect, useRef, useState } from "react"
import { setInk } from "../ink/InkBackground"
import { href } from "../router"
import type { Painting, SiteData } from "../types"
import { ShareButton } from "./Share"
import { details, SoldBadge } from "./shared"

/** What the gallery is showing: everything, or one series in its own order. */
export type GalleryFilter = { kind: "all" } | { kind: "series"; id: string }

const TR: Record<string, string> = { ç: "c", ğ: "g", ı: "i", ö: "o", ş: "s", ü: "u" }
/** Lower-cased by Turkish rules and without accents, so "cicek" finds "Çiçek" and "IRIS" finds "İris". */
const fold = (s: string) =>
  s
    .toLocaleLowerCase("tr")
    .replace(/[çğıöşü]/g, (c) => TR[c] ?? c)
    .trim()

// kept while the page is open, so the results are still there after looking at one painting and coming back
let remembered = ""

/** One, two or three columns depending on how wide the gallery is. */
function useColumnCount() {
  const ref = useRef<HTMLDivElement>(null)
  const [count, setCount] = useState(3)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const measure = () => setCount(el.clientWidth < 520 ? 1 : el.clientWidth < 860 ? 2 : 3)
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(el)
    return () => observer.disconnect()
  }, [])
  return [ref, count] as const
}

/**
 * Masonry without CSS columns: each painting goes to the currently shortest column.
 * (CSS multi-column layout mis-paints children that are transformed on hover.)
 */
function distribute(paintings: Painting[], count: number): Painting[][] {
  const columns: Painting[][] = Array.from({ length: count }, () => [])
  const heights = new Array<number>(count).fill(0)
  for (const p of paintings) {
    let shortest = 0
    for (let i = 1; i < count; ++i) if (heights[i]! < heights[shortest]!) shortest = i
    columns[shortest]!.push(p)
    // image height in column widths, plus a rough allowance for the caption
    heights[shortest]! += 1 / p.aspect + 0.3
  }
  return columns
}

export function Gallery({ site, filter }: { site: SiteData; filter: GalleryFilter }) {
  const [gridRef, columnCount] = useColumnCount()
  const byId = new Map(site.paintings.map((p) => [p.id, p]))
  // only offer series that have at least one visible painting
  const series = site.series.filter((s) => s.paintingIds.some((id) => byId.has(id)))
  const current = filter.kind === "series" ? series.find((s) => s.id === filter.id) : undefined

  let shown = site.paintings
  // a series keeps its own order, independent of the gallery order
  if (filter.kind === "series")
    shown = (current?.paintingIds ?? []).map((id) => byId.get(id)).filter((p): p is Painting => !!p)

  const [query, setQuery] = useState(remembered)
  const [searching, setSearching] = useState(remembered !== "")
  const search = (value: string) => {
    remembered = value
    setQuery(value)
  }
  const inFilter = shown.length
  const words = fold(query).split(/\s+/).filter(Boolean)
  if (words.length > 0) {
    // Every word has to appear in the title, the technique or the name of the series, or be the year.
    // Sizes are left out, and the year has to match whole: otherwise the "2" of "Kuşlar 2" would find every painting.
    const seriesOf = new Map<string, string>()
    for (const s of site.series) for (const id of s.paintingIds) seriesOf.set(id, s.name)
    shown = shown.filter((p) => {
      const text = fold(`${p.title} ${p.technique} ${seriesOf.get(p.id) ?? ""}`)
      return words.every((w) => text.includes(w) || w === String(p.year))
    })
  }

  const chip = (label: string, to: string, active: boolean) => (
    <a key={to} className="chip" href={to} aria-current={active ? "true" : undefined}>
      {label}
    </a>
  )

  return (
    <div className="stack">
      <header className="gallery-head">
        <h1>Galeri</h1>
        <div className="chips">
          {series.length > 0 && (
            <nav className="chips" aria-label="Seriler">
              {chip("Tümü", href("galeri"), filter.kind === "all")}
              {series.map((s) => chip(s.name, href("seri", s.id), filter.kind === "series" && filter.id === s.id))}
            </nav>
          )}
          <button
            type="button"
            className="chip search-toggle"
            aria-label="Resim ara"
            aria-expanded={searching}
            aria-pressed={searching}
            onClick={() => {
              // closing the box also ends the search
              if (searching) search("")
              setSearching(!searching)
            }}
          >
            <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
              <circle cx="10.5" cy="10.5" r="6.5" fill="none" stroke="currentColor" strokeWidth="1.6" />
              <path d="M15.5 15.5 21 21" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
          </button>
          <ShareButton
            className="chip search-toggle"
            label={current ? `${current.name} serisi` : "Galeri"}
            path={current ? `seri/${current.id}` : "galeri"}
          />
        </div>
        {/* floats over the top of the paintings, so opening it or typing in it moves nothing */}
        {searching && (
          <div className="search">
            <input
              type="search"
              aria-label="Resim ara"
              placeholder="Resim adı, teknik ya da yıl"
              enterKeyHint="search"
              autoComplete="off"
              autoFocus={query === ""}
              value={query}
              onChange={(e) => search(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Escape") {
                  search("")
                  setSearching(false)
                }
                // puts the on-screen keyboard away so the results can be seen
                if (e.key === "Enter") e.currentTarget.blur()
              }}
            />
            {words.length > 0 && (
              <p className="muted small" role="status">
                {shown.length > 0 ? `${shown.length} resim bulundu` : "Resim bulunamadı"}
                {current ? ` · ${current.name} serisinde` : ""}
              </p>
            )}
          </div>
        )}
      </header>
      {current && (
        <p className="muted">
          {current.name} serisi · {inFilter} resim
        </p>
      )}
      {inFilter === 0 && <p className="muted">Henüz bir resim yok.</p>}
      <div className="grid" ref={gridRef}>
        {distribute(shown, columnCount).map((column, i) => (
          <div key={i} className="grid-column">
            {column.map((p) => (
              <a
                key={p.id}
                className="work tile"
                href={href("galeri", p.id)}
                onMouseEnter={() => setInk(p.palette)}
                onMouseLeave={() => setInk(null)}
                onFocus={() => setInk(p.palette)}
                onBlur={() => setInk(null)}
              >
                <img src={p.images.small} alt={p.title} loading="lazy" style={{ aspectRatio: p.aspect }} />
                <span className="tile-title">{p.title}</span>
                <span className="muted small">{details(p)}</span>
                <SoldBadge painting={p} />
              </a>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
