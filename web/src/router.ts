import { useEffect, useState } from "react"

// Hash routes (#/galeri/bird-plum) need no server-side fallback, so the site works as plain static files.
const read = () => window.location.hash.replace(/^#\/?/, "").split("/").filter(Boolean).map(decodeURIComponent)

export function useRoute(): string[] {
  const [route, setRoute] = useState(read)
  useEffect(() => {
    const onChange = () => {
      setRoute(read())
      window.scrollTo(0, 0)
    }
    window.addEventListener("hashchange", onChange)
    return () => window.removeEventListener("hashchange", onChange)
  }, [])
  return route
}

export const href = (...parts: string[]) => "#/" + parts.map(encodeURIComponent).join("/")
export const go = (...parts: string[]) => {
  window.location.hash = href(...parts)
}
