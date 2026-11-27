import { useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { qrCode } from "../qr"
import { SITE_URL } from "../site"

/** light modules around the code, which scanners need */
const QUIET = 4

/** the red frame around the quiet zone, in modules */
const FRAME = 1
const SEAL = "#b3261e"

/** Draws the code on a canvas, large enough to print, inside a frame in the red of the seal. */
function draw(canvas: HTMLCanvasElement, modules: boolean[][]) {
  const inset = QUIET + FRAME
  const count = modules.length + inset * 2
  // a whole number of pixels per module keeps the edges sharp
  const px = Math.floor(1200 / count)
  canvas.width = canvas.height = px * count
  const ctx = canvas.getContext("2d")
  if (!ctx) return
  ctx.fillStyle = SEAL
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  // the quiet zone stays white: scanners need it, so the frame goes outside it
  ctx.fillStyle = "#fff"
  ctx.fillRect(FRAME * px, FRAME * px, canvas.width - FRAME * px * 2, canvas.height - FRAME * px * 2)
  ctx.fillStyle = "#16161a"
  modules.forEach((row, y) =>
    row.forEach((dark, x) => {
      if (dark) ctx.fillRect((x + inset) * px, (y + inset) * px, px, px)
    })
  )
}

const TR: Record<string, string> = { ç: "c", ğ: "g", ı: "i", ö: "o", ş: "s", ü: "u" }
const fileName = (label: string) =>
  `gubate-${label
    .toLocaleLowerCase("tr")
    .replace(/[çğıöşü]/g, (c) => TR[c] ?? c)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")}.png`

function ShareDialog({ label, url, onClose }: { label: string; url: string; onClose: () => void }) {
  const canvas = useRef<HTMLCanvasElement>(null)
  const modules = useRef(qrCode(url)).current
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (canvas.current) draw(canvas.current, modules)
  }, [modules])

  // Escape closes this box only; the arrow keys must not turn the page behind it
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
      if (e.key === "Escape" || e.key.startsWith("Arrow")) e.stopImmediatePropagation()
    }
    window.addEventListener("keydown", onKey, true)
    return () => window.removeEventListener("keydown", onKey, true)
  }, [onClose])

  const download = () => {
    canvas.current?.toBlob((blob) => {
      if (!blob) return
      const link = document.createElement("a")
      link.href = URL.createObjectURL(blob)
      link.download = fileName(label)
      link.click()
      setTimeout(() => URL.revokeObjectURL(link.href), 10_000)
    }, "image/png")
  }

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    } catch {
      // without clipboard access the address is still on screen to copy by hand
    }
  }

  // drawn outside the page so that nothing in it can clip the box
  return createPortal(
    <div className="share-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="share" role="dialog" aria-modal="true" aria-label={`${label}: paylaş`}>
        <h2>{label}</h2>
        <canvas ref={canvas} role="img" aria-label={`${url} adresinin QR kodu`} />
        <p className="small share-url">{url.replace(/^https?:\/\//, "")}</p>
        <div className="share-actions">
          <button type="button" className="button paper" onClick={download}>
            İndir
          </button>
          <button type="button" className="button paper" onClick={copy}>
            {copied ? "Kopyalandı" : "Kopyala"}
          </button>
          <button type="button" className="button primary" autoFocus onClick={onClose}>
            Kapat
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}

/**
 * A button that opens the share view of one page of the site: its QR code, to save as a picture, and its address, to copy.
 * `path` is the part of the address after "#/". With `text` the button shows a word instead of only the icon.
 */
export function ShareButton(props: { label: string; path: string; className: string; text?: boolean }) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button
        type="button"
        className={props.className}
        aria-label={`${props.label}: paylaş`}
        title="Paylaş"
        onClick={() => setOpen(true)}
      >
        {props.text ? (
          "Paylaş"
        ) : (
          <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" fill="none" stroke="currentColor">
            <path strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" d="M12 15V4m0 0L8 8m4-4 4 4" />
            <path strokeWidth="1.6" strokeLinecap="round" d="M5 12v7h14v-7" />
          </svg>
        )}
      </button>
      {open && <ShareDialog label={props.label} url={`${SITE_URL}/#/${props.path}`} onClose={() => setOpen(false)} />}
    </>
  )
}
