import { suggestPalette } from "../ink/palette"
import type { Hex } from "../types"

export interface PreparedImage {
  small: Blob
  medium: Blob
  large: Blob
  aspect: number
  palette: [Hex, Hex, Hex]
}

// Long side in pixels. The server accepts at most ~4.3 MB per image, which a 2600 px JPEG stays well under.
const SIZES = { small: 640, medium: 1400, large: 2600 } as const

/** Thrown when the browser cannot open the chosen file as an image. `format` is what the file really is. */
export class ImageDecodeError extends Error {
  constructor(public format: string) {
    super(`cannot decode ${format} image`)
  }
}

/** Identifies an image by its first bytes: the file name and the reported type cannot be trusted. */
async function sniff(file: Blob): Promise<string> {
  const b = new Uint8Array(await file.slice(0, 16).arrayBuffer())
  const text = (from: number, to: number) => String.fromCharCode(...b.slice(from, to))
  if (b[0] === 0xff && b[1] === 0xd8) return "JPEG"
  if (b[0] === 0x89 && text(1, 4) === "PNG") return "PNG"
  if (text(0, 4) === "RIFF" && text(8, 12) === "WEBP") return "WebP"
  if (text(0, 3) === "GIF") return "GIF"
  if (text(4, 8) === "ftyp") return text(8, 12).startsWith("avi") ? "AVIF" : "HEIC"
  return "bilinmeyen biçim"
}

async function decode(
  file: Blob
): Promise<{ source: CanvasImageSource; width: number; height: number; close: () => void }> {
  if ("createImageBitmap" in window) {
    try {
      // respects the phone's rotation flag, so portrait photos stay portrait
      const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" })
      return { source: bitmap, width: bitmap.width, height: bitmap.height, close: () => bitmap.close() }
    } catch {
      // fall through to <img>
    }
  }
  // <img> with plain load/error events is the most forgiving path: some Safari versions reject
  // img.decode() for large photos that they can still load and draw.
  const url = URL.createObjectURL(file)
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image()
      el.onload = () => resolve(el)
      el.onerror = () => reject(new Error("image load failed"))
      el.src = url
    })
    if (!img.naturalWidth || !img.naturalHeight) throw new Error("empty image")
    return { source: img, width: img.naturalWidth, height: img.naturalHeight, close: () => URL.revokeObjectURL(url) }
  } catch {
    URL.revokeObjectURL(url)
    throw new ImageDecodeError(await sniff(file).catch(() => "bilinmeyen biçim"))
  }
}

function encode(source: CanvasImageSource, width: number, height: number, quality: number): Promise<Blob> {
  const canvas = document.createElement("canvas")
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext("2d")!
  ctx.imageSmoothingQuality = "high"
  ctx.drawImage(source, 0, 0, width, height)
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("encode failed"))), "image/jpeg", quality)
  )
}

/** Resizes a photo to the three sizes the site uses and suggests its colours. Runs entirely in the browser. */
export async function prepareImage(file: Blob): Promise<PreparedImage> {
  const { source, width, height, close } = await decode(file)
  try {
    const make = async (longSide: number) => {
      const k = Math.min(1, longSide / Math.max(width, height))
      const w = Math.max(1, Math.round(width * k)),
        h = Math.max(1, Math.round(height * k))
      let blob = await encode(source, w, h, 0.86)
      if (blob.size > 4_000_000) blob = await encode(source, w, h, 0.7)
      return blob
    }
    return {
      small: await make(SIZES.small),
      medium: await make(SIZES.medium),
      large: await make(SIZES.large),
      aspect: Math.round((width / height) * 1000) / 1000,
      palette: suggestPalette(source),
    }
  } finally {
    close()
  }
}

/** Re-runs the colour suggestion for an image that is already uploaded. Needs the image host to allow cross-origin reads. */
export async function suggestFromUrl(url: string): Promise<[Hex, Hex, Hex]> {
  const img = new Image()
  img.crossOrigin = "anonymous"
  img.src = url
  await img.decode()
  return suggestPalette(img)
}
