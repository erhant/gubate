import { useEffect, useMemo, useState } from "react"
import { qrCode } from "../qr"
import { SITE_URL } from "../site"

const URL = `${SITE_URL}/#/galeri`
/** light modules around the code, which scanners need */
const QUIET = 4
/** the red frame around the quiet zone, in modules */
const FRAME = 1
const SEAL = "#b3261e"

/** The code as a PNG, large enough to print, inside a frame in the red of the seal. */
function picture(modules: boolean[][]): string {
  const inset = QUIET + FRAME
  const count = modules.length + inset * 2
  // a whole number of pixels per module keeps the edges sharp
  const px = Math.floor(1200 / count)
  const canvas = document.createElement("canvas")
  canvas.width = canvas.height = px * count
  const ctx = canvas.getContext("2d")
  if (!ctx) return ""
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
  return canvas.toDataURL("image/png")
}

function Dialog({ onClose }: { onClose: () => void }) {
  // an ordinary picture, so that pressing and holding it on a phone offers to save or share it
  const src = useMemo(() => picture(qrCode(URL)), [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [onClose])

  // no close button: a tap outside the box or Escape closes it
  return (
    <div className="qr-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="qr" role="dialog" aria-modal="true" aria-label="Galerinin QR kodu">
        <img src={src} alt={`${URL} adresinin QR kodu`} />
      </div>
    </div>
  )
}

/** A button that shows the QR code of the gallery, for cards, labels and exhibitions. */
export function GalleryQr() {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button type="button" className="button paper" onClick={() => setOpen(true)}>
        QR kod
      </button>
      {open && <Dialog onClose={() => setOpen(false)} />}
    </>
  )
}
