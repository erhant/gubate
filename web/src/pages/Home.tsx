import { setInk } from "../ink/InkBackground"
import { href } from "../router"
import type { Painting, SiteData } from "../types"
import { details, SoldBadge } from "./shared"

export function Home({ site }: { site: SiteData }) {
  const byId = new Map(site.paintings.map((p) => [p.id, p]))
  const featured = site.featured.map((id) => byId.get(id)).filter((p): p is Painting => !!p)
  const [hero, ...rest] = featured
  const hover = (p: Painting) => ({
    onMouseEnter: () => setInk(p.palette),
    onMouseLeave: () => setInk(null),
    onFocus: () => setInk(p.palette),
    onBlur: () => setInk(null),
  })

  return (
    <div className="home">
      <section className="hero">
        <div className="hero-text">
          <p className="eyebrow">Sumi-e · mürekkep resmi</p>
          <h1>İzler</h1>
          <p className="lede">
            Gubate, ressam Gülçin Balta Tezcan tarafından mürekkep ve suluboya ile yapılan resimlerin evi. Her resim
            birkaç fırça darbesiyle başlar. Kâğıdın boş kalan yeri de resmin parçasıdır.
          </p>
          <div className="actions">
            <a className="button primary" href={href("galeri")}>
              Galeriyi gez
            </a>
            <a className="button" href={href("iletisim")}>
              İletişime geç
            </a>
          </div>
        </div>
        {hero && (
          <a className="work hero-work" href={href("galeri", hero.id)} {...hover(hero)}>
            <img src={hero.images.medium} alt={hero.title} fetchPriority="high" style={{ aspectRatio: hero.aspect }} />
            <span className="caption">
              1 / {featured.length} · {hero.title}
            </span>
          </a>
        )}
      </section>

      {rest.map((p, i) => (
        <section key={p.id} className={i % 2 ? "feature" : "feature reverse"}>
          <a className="work" href={href("galeri", p.id)} {...hover(p)}>
            <img
              src={p.images.medium}
              alt={p.title}
              loading="lazy"
              decoding="async"
              style={{ aspectRatio: p.aspect }}
            />
          </a>
          <div className="feature-text">
            <p className="count">
              {i + 2} / {featured.length}
            </p>
            <h2>{p.title}</h2>
            <p className="muted">{details(p)}</p>
            <SoldBadge painting={p} />
          </div>
        </section>
      ))}

      <div className="center">
        <a className="button primary" href={href("galeri")}>
          Tüm resimleri gör
        </a>
      </div>
    </div>
  )
}
