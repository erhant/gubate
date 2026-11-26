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

/**
 * Suggests [ground, accent 1, accent 2] for an image.
 * Ground: the most common coarse colour. Accents: the two strongest hue families among the
 * saturated pixels, at least two hue bins apart so they do not come out as near-duplicates.
 */
export function suggestPalette(source: CanvasImageSource): [Hex, Hex, Hex] {
  const N = 96
  const canvas = document.createElement("canvas")
  canvas.width = canvas.height = N
  const ctx = canvas.getContext("2d", { willReadFrequently: true })!
  ctx.drawImage(source, 0, 0, N, N)
  const px = ctx.getImageData(0, 0, N, N).data

  const buckets = new Map<number, [number, number, number, number]>()
  const bins: [number, number, number, number][] = Array.from({ length: 12 }, () => [0, 0, 0, 0])
  let darkest: Rgb = [0.1, 0.1, 0.12],
    darkestLum = 2
  for (let i = 0; i < px.length; i += 4) {
    const r = px[i]! / 255,
      g = px[i + 1]! / 255,
      b = px[i + 2]! / 255
    const key = ((px[i]! >> 5) << 6) | ((px[i + 1]! >> 5) << 3) | (px[i + 2]! >> 5)
    const bucket = buckets.get(key) ?? [0, 0, 0, 0]
    bucket[0] += 1
    bucket[1] += r
    bucket[2] += g
    bucket[3] += b
    buckets.set(key, bucket)
    const [h, s, v] = rgbToHsv(r, g, b)
    if (s > 0.28 && v > 0.25) {
      const weight = s * s * v
      const bin = bins[Math.floor(h * 12) % 12]!
      bin[0] += weight
      bin[1] += weight * r
      bin[2] += weight * g
      bin[3] += weight * b
    }
    const l = lum([r, g, b])
    if (l < darkestLum) {
      darkestLum = l
      darkest = [r, g, b]
    }
  }
  const top = [...buckets.values()].sort((x, y) => y[0] - x[0])[0]!
  const ground: Rgb = [top[1] / top[0], top[2] / top[0], top[3] / top[0]]

  const order = bins.map((_, i) => i).sort((x, y) => bins[y]![0] - bins[x]![0])
  const colour = (i: number | undefined): Rgb | null => {
    const bin = i === undefined ? undefined : bins[i]
    return bin && bin[0] > 0.5 ? [bin[1] / bin[0], bin[2] / bin[0], bin[3] / bin[0]] : null
  }
  const first = order[0]!
  const second = order
    .slice(1)
    .find((i) => Math.min((i - first + 12) % 12, (first - i + 12) % 12) >= 2 && bins[i]![0] > 0.5)
  const a = colour(first) ?? darkest
  const b = colour(second) ?? a
  return [rgbToHex(ground), rgbToHex(a), rgbToHex(b)]
}
