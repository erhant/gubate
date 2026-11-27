import { useEffect } from "react"
import { setInk } from "../ink/InkBackground"
import { go, href } from "../router"
import type { Painting, SiteData } from "../types"
import { details, SoldBadge, srcSet } from "./shared"

/** The painting may be 78% of the window tall; this is the width that goes with that height. */
const widthAtFullHeight = (p: Painting) => `${(78 * p.aspect).toFixed(1)}vh`
/** Roughly how wide the painting is drawn, for the browser to choose a file by. */
const sizes = (p: Painting) => `min(100vw, ${widthAtFullHeight(p)})`

/** Fetches a painting in the size this screen needs, so that turning to it shows it at once. */
function preload(p: Painting) {
  const img = new Image()
  img.sizes = sizes(p)
  img.srcset = srcSet(p)
}

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
        srcSet={srcSet(painting)}
        sizes={sizes(painting)}
        alt={painting.title}
        // the small picture is usually in the cache from the gallery, and fills the frame until the sharp one arrives
        style={{
          // set here and not left to the file's own size, so a painting looks the same whichever file is chosen
          width: `min(100%, ${widthAtFullHeight(painting)})`,
          aspectRatio: painting.aspect,
          background: `center / cover url("${painting.images.small}")`,
        }}
        // once it is on screen, the neighbours are fetched for "Önceki" and "Sonraki"
        onLoad={() => {
          if (count > 1 && next) preload(next)
          if (count > 2 && prev) preload(prev)
        }}
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
