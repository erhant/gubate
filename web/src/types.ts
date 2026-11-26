// Shared data model. web/src/types.ts is a copy of this file: keep the two in sync.

/** "#rrggbb" */
export type Hex = string

export interface Painting {
  id: string
  title: string
  technique: string
  widthCm: number | null
  heightCm: number | null
  year: number | null
  sold: boolean
  /** hidden paintings are only visible in the admin panel */
  hidden: boolean
  /** [ground, accent 1, accent 2]: drives the ink-wash background */
  palette: [Hex, Hex, Hex]
  /** width / height of the image */
  aspect: number
  images: { small: string; medium: string; large: string }
}

export interface Series {
  id: string
  name: string
  /** member painting ids, in the series' own order; a painting is in at most one series */
  paintingIds: string[]
}

export interface TimelineEntry {
  year: string
  text: string
}

export interface SiteData {
  version: 1
  updatedAt: string
  /** array order is gallery order */
  paintings: Painting[]
  series: Series[]
  /** painting ids shown on the welcome page, in order */
  featured: string[]
  about: {
    lead: string
    paragraphs: string[]
    timeline: TimelineEntry[]
  }
  contact: {
    email: string
    phone: string
    instagram: string
    /** digits only, international format, e.g. 905xxxxxxxxx */
    whatsapp: string
  }
}
