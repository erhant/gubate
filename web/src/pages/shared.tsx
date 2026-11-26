import type { Painting } from "../types"

/** "Suluboya · 34 × 45 cm · 2021", skipping whatever has not been filled in. */
export function details(p: Painting): string {
  const size = p.widthCm && p.heightCm ? `${p.widthCm} × ${p.heightCm} cm` : ""
  return [p.technique, size, p.year ? String(p.year) : ""].filter(Boolean).join(" · ")
}

export function SoldBadge({ painting }: { painting: Painting }) {
  return painting.sold ? <span className="badge">Satıldı</span> : null
}
