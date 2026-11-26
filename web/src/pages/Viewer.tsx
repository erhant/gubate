import { useEffect, useState } from "react"
import { setInk } from "../ink/InkBackground"
import { go, href } from "../router"
import type { Painting, SiteData } from "../types"
import { details, SoldBadge } from "./shared"

// The scale view: a wall of 300 x 170 cm with a 160 x 75 cm console table for reference.
// For a painting too large for that wall, the whole scene is zoomed out so it still fits.
const WALL_W = 300
const WALL_H = 170
const CONSOLE_W = 160
const CONSOLE_H = 75
/** gap between the console top and the painting's lower edge, in cm */
const HANG_GAP = 20

function Wall({ painting }: { painting: Painting }) {
  const width = painting.widthCm!
  const height = painting.heightCm!
  const zoom = Math.max(1, width / (WALL_W * 0.8), (height + CONSOLE_H + HANG_GAP + 10) / WALL_H)
  const w = WALL_W * zoom
  const h = WALL_H * zoom
  const pct = (cm: number, of: number) => `${(cm / of) * 100}%`
  return (
    <div className="wall" style={{ aspectRatio: `${WALL_W} / ${WALL_H}` }}>
      <img
        src={painting.images.medium}
        alt={painting.title}
        style={{ width: pct(width, w), bottom: pct(CONSOLE_H + HANG_GAP, h), aspectRatio: `${width} / ${height}` }}
      />
      <div
        className="console"
        aria-hidden="true"
        style={{ width: pct(CONSOLE_W, w), height: pct(CONSOLE_H, h), left: pct((w - CONSOLE_W) / 2, w) }}
      >
        <div className="console-body">
          <span />
          <span />
          <span />
        </div>
        <div className="console-legs">
          <span />
          <span />
        </div>
      </div>
      <p className="console-label" style={{ bottom: pct(CONSOLE_H + 2, h) }}>
        konsol {CONSOLE_W} cm
      </p>
    </div>
  )
}

export function Viewer({ site, id }: { site: SiteData; id: string }) {
  const index = site.paintings.findIndex((p) => p.id === id)
  const painting = site.paintings[index]
  const [wall, setWall] = useState(false)
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

  const hasSize = !!(painting.widthCm && painting.heightCm)
  return (
    <div className="viewer">
      <div className="viewer-bar">
        <a className="button paper" href={href("galeri")}>
          Galeriye dön
        </a>
        <div className="actions">
          {hasSize && (
            <button type="button" className="button paper" aria-pressed={wall} onClick={() => setWall(!wall)}>
              {wall ? "Resme dön" : "Duvarda gör"}
            </button>
          )}
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
      {wall && hasSize ? (
        <Wall painting={painting} />
      ) : (
        // the key restarts the fade for every painting
        <img
          key={painting.id}
          className="viewer-image fade"
          src={painting.images.large}
          alt={painting.title}
          style={{ aspectRatio: painting.aspect }}
        />
      )}
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
