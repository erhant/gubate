import { useEffect } from "react"
import { setInk } from "../ink/InkBackground"
import { go, href } from "../router"
import type { SiteData } from "../types"
import { ShareButton } from "./Share"
import { details, SoldBadge } from "./shared"

export function Viewer({ site, id }: { site: SiteData; id: string }) {
  const index = site.paintings.findIndex((p) => p.id === id)
  const painting = site.paintings[index]
  const count = site.paintings.length
  const prev = site.paintings[(index + count - 1) % count]
  const next = site.paintings[(index + 1) % count]

  useEffect(() => {
    if (painting) setInk(painting.palette)
  }, [painting])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" && prev) go("galeri", prev.id)
      if (e.key === "ArrowRight" && next) go("galeri", next.id)
      if (e.key === "Escape") go("galeri")
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [prev, next])

  if (!painting) {
    return (
      <div className="stack">
        <p className="muted">Bu resim bulunamadı.</p>
        <a className="button" href={href("galeri")}>
          Galeriye dön
        </a>
      </div>
    )
  }

  return (
    <div className="viewer">
      <div className="viewer-bar">
        <a className="button paper" href={href("galeri")}>
          Galeriye dön
        </a>
        <div className="actions">
          <ShareButton className="button paper" label={painting.title} path={`galeri/${painting.id}`} text />
          {prev && count > 1 && (
            <a className="button paper" href={href("galeri", prev.id)}>
              Önceki
            </a>
          )}
          {next && count > 1 && (
            <a className="button paper" href={href("galeri", next.id)}>
              Sonraki
            </a>
          )}
        </div>
      </div>
      {/* the key restarts the fade for every painting */}
      <img
        key={painting.id}
        className="viewer-image fade"
        src={painting.images.large}
        alt={painting.title}
        style={{ aspectRatio: painting.aspect }}
      />
      <div className="plate">
        <h1>{painting.title}</h1>
        <p className="muted">{details(painting)}</p>
        {site.series
          .filter((s) => s.paintingIds.includes(painting.id))
          .map((s) => (
            <a key={s.id} className="series-line" href={href("seri", s.id)}>
              {s.name} serisi · {s.paintingIds.indexOf(painting.id) + 1} / {s.paintingIds.length}
            </a>
          ))}
        <SoldBadge painting={painting} />
      </div>
    </div>
  )
}
