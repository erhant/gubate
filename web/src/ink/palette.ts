import type { Hex } from "../types"

export type Rgb = [number, number, number]
/** ground, accent 1, accent 2 as 0..1 floats, plus k: 0 = resting wash, 1 = a painting is in focus */
export type InkState = [number, number, number, number, number, number, number, number, number, number]

export const REST: InkState = [0.957, 0.949, 0.925, 0.1, 0.1, 0.12, 0.1, 0.1, 0.12, 0]

export const hexToRgb = (hex: Hex): Rgb => {
  const n = parseInt(hex.slice(1), 16)
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255]
}
export const rgbToHex = (c: Rgb): Hex =>
  "#" +
  c
    .map((v) =>
      Math.round(Math.min(1, Math.max(0, v)) * 255)
        .toString(16)
        .padStart(2, "0")
    )
    .join("")

const lum = (c: Rgb) => 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]
const scale = (c: Rgb, k: number): Rgb => [c[0] * k, c[1] * k, c[2] * k]

/**
 * Turns a painting's stored palette into shader colours.
 * The ground is lightened until dark text stays readable on it; accents are capped so they
 * read as ink on paper and never as a bright flat fill.
 */
export function inkFor(palette: [Hex, Hex, Hex]): InkState {
  const g0 = hexToRgb(palette[0])
  const w = Math.min(1, 0.13 / (1 - lum(g0) + 0.001)) * 0.9
  const g: Rgb = [1 - (1 - g0[0]) * w, 1 - (1 - g0[1]) * w, 1 - (1 - g0[2]) * w]
  const cap = (c: Rgb) => (lum(c) > 0.62 ? scale(c, 0.62 / lum(c)) : c)
  const a = cap(hexToRgb(palette[1]))
  const b = cap(hexToRgb(palette[2]))
  return [...g, ...a, ...b, 1] as InkState
}

function rgbToHsv(r: number, g: number, b: number): [number, number, number] {
  const max = Math.max(r, g, b),
    min = Math.min(r, g, b),
    d = max - min
  let h = 0
  if (d > 0) {
    if (max === r) h = ((g - b) / d + 6) % 6
    else if (max === g) h = (b - r) / d + 2
    else h = (r - g) / d + 4
    h /= 6
  }
  return [h, max === 0 ? 0 : d / max, max]
}

/** Colour difference that weights green most, as the eye does. 0 = identical, about 1 = black vs white. */
function distance(a: Rgb, b: Rgb): number {
  const dr = a[0] - b[0],
    dg = a[1] - b[1],
    db = a[2] - b[2]
  return Math.sqrt(0.3 * dr * dr + 0.59 * dg * dg + 0.11 * db * db)
}

/** Two suggested colours closer than this look like the same colour in the editor. */
const MIN_SPREAD = 0.14

/**
 * Suggests [ground, accent 1, accent 2] for an image, spread apart so the three are distinct.
 *
 * Ground is the most common coarse colour (usually the paper). Accents come from the pixels
 * that are NOT the ground: they are grouped by hue (plus one group for dark ink), and each
 * accent is the group that is both common and far from everything already chosen. Without
 * the "far from" part, a painting on tinted paper gets the paper back as its first accent.
 */
export function suggestPalette(source: CanvasImageSource): [Hex, Hex, Hex] {
  const N = 96
  const canvas = document.createElement("canvas")
  canvas.width = canvas.height = N
  const ctx = canvas.getContext("2d", { willReadFrequently: true })!
  ctx.drawImage(source, 0, 0, N, N)
  const px = ctx.getImageData(0, 0, N, N).data

  // pass 1: the ground
  const buckets = new Map<number, [number, number, number, number]>()
  for (let i = 0; i < px.length; i += 4) {
    const key = ((px[i]! >> 5) << 6) | ((px[i + 1]! >> 5) << 3) | (px[i + 2]! >> 5)
    const bucket = buckets.get(key) ?? [0, 0, 0, 0]
    bucket[0] += 1
    bucket[1] += px[i]! / 255
    bucket[2] += px[i + 1]! / 255
    bucket[3] += px[i + 2]! / 255
    buckets.set(key, bucket)
  }
  const top = [...buckets.values()].sort((x, y) => y[0] - x[0])[0]!
  const ground: Rgb = [top[1] / top[0], top[2] / top[0], top[3] / top[0]]

  // pass 2: group everything that is clearly not the ground. 12 hue groups + 1 for dark, unsaturated ink.
  const INK = 12
  const groups: [number, number, number, number][] = Array.from({ length: 13 }, () => [0, 0, 0, 0])
  for (let i = 0; i < px.length; i += 4) {
    const c: Rgb = [px[i]! / 255, px[i + 1]! / 255, px[i + 2]! / 255]
    if (distance(c, ground) < MIN_SPREAD) continue
    const [h, s, v] = rgbToHsv(c[0], c[1], c[2])
    const saturated = s > 0.25 && v > 0.2
    if (!saturated && v > 0.45) continue // pale greys and highlights make poor accents
    const group = groups[saturated ? Math.floor(h * 12) % 12 : INK]!
    // vivid pixels count for more, so a small bright bird outweighs a large dull shadow
    const weight = saturated ? 0.35 + s * v : 0.35
    group[0] += weight
    group[1] += weight * c[0]
    group[2] += weight * c[1]
    group[3] += weight * c[2]
  }
  const candidates = groups
    .filter((g) => g[0] > 4)
    .map((g) => ({ weight: g[0], colour: [g[1] / g[0], g[2] / g[0], g[3] / g[0]] as Rgb }))

  // each pick maximises (how common) x (how far from the colours already chosen)
  const pick = (chosen: Rgb[]): Rgb | null => {
    let best: Rgb | null = null
    let bestScore = 0
    for (const { weight, colour } of candidates) {
      const spread = Math.min(...chosen.map((c) => distance(colour, c)))
      if (spread < MIN_SPREAD) continue
      const score = Math.sqrt(weight) * spread
      if (score > bestScore) {
        bestScore = score
        best = colour
      }
    }
    return best
  }
  // fallbacks for near-monochrome images: ink black, then a mid tone between ink and ground
  const ink: Rgb = [0.12, 0.12, 0.14]
  const a = pick([ground]) ?? ink
  const mid: Rgb = [(a[0] + ground[0]) / 2, (a[1] + ground[1]) / 2, (a[2] + ground[2]) / 2]
  const b = pick([ground, a]) ?? (distance(ink, a) >= MIN_SPREAD && distance(ink, ground) >= MIN_SPREAD ? ink : mid)
  return [rgbToHex(ground), rgbToHex(a), rgbToHex(b)]
}
