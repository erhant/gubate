import { useEffect, useRef, useState } from "react"
import { setInk } from "../ink/InkBackground"
import { href } from "../router"
import type { Painting, SiteData } from "../types"
import { details, SoldBadge } from "./shared"

/** What the gallery is showing: everything, one group, or one series in its own order. */
export type GalleryFilter = { kind: "all" } | { kind: "group"; id: string } | { kind: "series"; id: string }

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
  // only offer groups and series that have at least one visible painting
  const groups = site.groups.filter((g) => site.paintings.some((p) => p.groupId === g.id))
  const series = site.series.filter((s) => s.paintingIds.some((id) => byId.has(id)))
  const current = filter.kind === "series" ? series.find((s) => s.id === filter.id) : undefined

  let shown = site.paintings
  if (filter.kind === "group") shown = site.paintings.filter((p) => p.groupId === filter.id)
  // a series keeps its own order, independent of the gallery order
  if (filter.kind === "series")
    shown = (current?.paintingIds ?? []).map((id) => byId.get(id)).filter((p): p is Painting => !!p)

  const chip = (label: string, to: string, active: boolean) => (
    <a key={to} className="chip" href={to} aria-current={active ? "true" : undefined}>
      {label}
    </a>
  )

  return (
    <div className="stack">
      <header className="gallery-head">
        <h1>Galeri</h1>
        <div className="chip-rows">
          {(groups.length > 0 || series.length > 0) && (
            <nav className="chips" aria-label="Gruplar">
              {chip("Tümü", href("galeri"), filter.kind === "all")}
              {groups.map((g) => chip(g.name, href("grup", g.id), filter.kind === "group" && filter.id === g.id))}
            </nav>
          )}
          {series.length > 0 && (
            <nav className="chips" aria-label="Seriler">
              <span className="chips-label">Seriler</span>
              {series.map((s) => chip(s.name, href("seri", s.id), filter.kind === "series" && filter.id === s.id))}
            </nav>
          )}
        </div>
      </header>
      {current && (
        <p className="muted">
          {current.name} serisi · {shown.length} resim
        </p>
      )}
      {shown.length === 0 && <p className="muted">Henüz bir resim yok.</p>}
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
