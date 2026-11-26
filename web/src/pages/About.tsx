import type { SiteData } from "../types"

export function About({ site }: { site: SiteData }) {
  const { about } = site
  return (
    <div className="about">
      <div className="about-text">
        <h1>Hakkında</h1>
        {about.lead && <p className="lead">{about.lead}</p>}
        {about.paragraphs.map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </div>
      {about.timeline.length > 0 && (
        <section className="timeline" aria-labelledby="timeline-title">
          <h2 id="timeline-title">Sergiler ve çalışmalar</h2>
          <ol>
            {about.timeline.map((t, i) => (
              <li key={i}>
                <span className="year">{t.year}</span>
                <span>{t.text}</span>
              </li>
            ))}
          </ol>
        </section>
      )}
    </div>
  )
}
