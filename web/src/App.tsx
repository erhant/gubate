import { lazy, Suspense, useEffect, useState } from "react"
import { getSite } from "./api"
import { InkBackground, setInk } from "./ink/InkBackground"
import { About } from "./pages/About"
import { Contact } from "./pages/Contact"
import { Gallery } from "./pages/Gallery"
import { Home } from "./pages/Home"
import { Viewer } from "./pages/Viewer"
import { href, useRoute } from "./router"
import { Seal } from "./Seal"
import type { SiteData } from "./types"

// The admin panel is a separate chunk: visitors never download it.
const AdminApp = lazy(() => import("./admin/AdminApp"))

const NAV = [
  { key: "", label: "Karşılama" },
  { key: "galeri", label: "Galeri" },
  { key: "hakkinda", label: "Hakkında" },
  { key: "iletisim", label: "İletişim" },
]

export function App() {
  const route = useRoute()
  const [site, setSite] = useState<SiteData | null>(null)
  const [failed, setFailed] = useState(false)
  const page = route[0] ?? ""
  const isAdmin = page === "yonetim"
  // a series view is part of the gallery as far as the menu is concerned ("grup" is the old address)
  const section = page === "grup" || page === "seri" ? "galeri" : page

  useEffect(() => {
    if (isAdmin) return
    getSite().then(setSite, () => setFailed(true))
  }, [isAdmin])

  // leaving a painting or the gallery returns the wash to its resting colours
  useEffect(() => {
    if (!(page === "galeri" && route[1])) setInk(null)
  }, [page, route])

  return (
    <>
      <InkBackground />
      {isAdmin ? (
        <Suspense fallback={<p className="status">Yükleniyor…</p>}>
          <AdminApp />
        </Suspense>
      ) : (
        <div className="shell">
          <nav className="rail" aria-label="Ana menü">
            <a className="brand" href={href()}>
              <Seal />
              <span>Gubate</span>
            </a>
            <div className="rail-links">
              {NAV.map((n) => (
                <a
                  key={n.key}
                  href={n.key ? href(n.key) : href()}
                  aria-current={section === n.key ? "page" : undefined}
                >
                  {n.label}
                </a>
              ))}
            </div>
          </nav>
          <main className="main">
            {failed && <p className="status">Site yüklenemedi. Lütfen sayfayı yenileyin.</p>}
            {!site && !failed && <p className="status">Yükleniyor…</p>}
            {site && page === "" && <Home site={site} />}
            {site && page === "galeri" && !route[1] && <Gallery site={site} filter={{ kind: "all" }} />}
            {site && page === "grup" && route[1] && <Gallery site={site} filter={{ kind: "series", id: route[1] }} />}
            {site && page === "seri" && route[1] && <Gallery site={site} filter={{ kind: "series", id: route[1] }} />}
            {site && page === "galeri" && route[1] && <Viewer site={site} id={route[1]} />}
            {site && page === "hakkinda" && <About site={site} />}
            {site && page === "iletisim" && <Contact site={site} />}
            <footer className="footer">© {new Date().getFullYear()} Gülçin Balta Tezcan · Tüm hakları saklıdır.</footer>
          </main>
        </div>
      )}
    </>
  )
}
