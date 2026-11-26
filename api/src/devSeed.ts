import { seed } from "./seed.js"
import type { Painting, SiteData } from "./types.js"

// Local development only: three generated placeholder images (web/public/dev) so the site has
// something to show before anything is uploaded. Production starts from the empty seed.
const placeholder = (
  n: number,
  aspect: number,
  widthCm: number,
  heightCm: number,
  ground: string,
  accent: string
): Painting => ({
  id: `ornek-${n}`,
  title: `Örnek ${n}`,
  technique: "Yer tutucu resim",
  widthCm,
  heightCm,
  year: 2026,
  sold: n === 3,
  hidden: false,
  palette: [ground, accent, "#1e1c20"],
  aspect,
  images: { small: `/dev/ornek-${n}.jpg`, medium: `/dev/ornek-${n}.jpg`, large: `/dev/ornek-${n}.jpg` },
})

export const devSeed: SiteData = {
  ...seed,
  paintings: [
    placeholder(1, 1.333, 60, 45, "#e7e0d9", "#9e7047"),
    placeholder(2, 0.75, 36, 48, "#e4dfcd", "#4d798c"),
    placeholder(3, 1, 30, 30, "#ede7dc", "#993d58"),
  ],
  featured: ["ornek-1", "ornek-2", "ornek-3"],
  series: [{ id: "ornek", name: "Örnek", paintingIds: ["ornek-1", "ornek-2"] }],
}
