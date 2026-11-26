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
  const url = URL.createObjectURL(file)
  const img = new Image()
  img.src = url
  await img.decode()
  return { source: img, width: img.naturalWidth, height: img.naturalHeight, close: () => URL.revokeObjectURL(url) }
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
