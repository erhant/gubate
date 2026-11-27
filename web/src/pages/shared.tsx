import type { Painting } from "../types"

/** "Suluboya · 34 × 45 cm · 2021", skipping whatever has not been filled in. */
export function details(p: Painting): string {
  const size = p.widthCm && p.heightCm ? `${p.widthCm} × ${p.heightCm} cm` : ""
  return [p.technique, size, p.year ? String(p.year) : ""].filter(Boolean).join(" · ")
}

/** Longer side of the three stored sizes, in pixels. The same numbers as in the admin panel's imageTools. */
const LONG_SIDE = { small: 640, medium: 1400, large: 2600 } as const

/**
 * The three sizes of a painting for the browser to choose from, so a phone does not download
 * the picture meant for a large screen. Each entry needs the picture's width, which is the
 * longer side for a wide painting and less than that for a tall one.
 */
export function srcSet(p: Painting): string {
  return (["small", "medium", "large"] as const)
    .map((size) => `${p.images[size]} ${Math.round(LONG_SIDE[size] * Math.min(1, p.aspect))}w`)
    .join(", ")
}

export function SoldBadge({ painting }: { painting: Painting }) {
  return painting.sold ? <span className="badge">Satıldı</span> : null
}
