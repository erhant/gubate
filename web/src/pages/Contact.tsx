import { useState, type FormEvent } from "react"
import { ADDRESS, MAP_EMBED_URL, MAP_LINK_URL } from "../site"
import type { SiteData } from "../types"

export function Contact({ site }: { site: SiteData }) {
  const { contact } = site
  const [name, setName] = useState("")
  const [message, setMessage] = useState("")
  const viaWhatsapp = !!contact.whatsapp

  // No server-side mail: the form opens WhatsApp (or the visitor's mail app) with the message filled in.
  const submit = (e: FormEvent) => {
    e.preventDefault()
    const text = `Merhaba, ben ${name.trim()}.\n\n${message.trim()}`
    if (viaWhatsapp) {
      window.open(`https://wa.me/${contact.whatsapp}?text=${encodeURIComponent(text)}`, "_blank", "noopener")
    } else {
      // a mailto link opened in a new tab leaves an empty tab behind, so navigate in place
      window.location.href = `mailto:${contact.email}?subject=${encodeURIComponent("Gubate")}&body=${encodeURIComponent(text)}`
    }
  }

  return (
    <div className="stack">
      <div className="contact">
        <div className="contact-text">
          <h1>İletişim</h1>
          <p>Bir resim hakkında soru sormak, sipariş vermek ya da sadece merhaba demek için yazabilirsiniz.</p>
          <ul className="contact-list">
            {contact.email && (
              <li>
                <a href={`mailto:${contact.email}`}>{contact.email}</a>
              </li>
            )}
            {contact.phone && (
              <li>
                <a href={`tel:${contact.phone.replace(/[^\d+]/g, "")}`}>{contact.phone}</a>
              </li>
            )}
            {contact.instagram && (
              <li>
                <a
                  href={`https://instagram.com/${contact.instagram.replace(/^@/, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Instagram: @{contact.instagram.replace(/^@/, "")}
                </a>
              </li>
            )}
            <li>{ADDRESS}</li>
          </ul>
        </div>
        {(viaWhatsapp || contact.email) && (
          <form className="form" onSubmit={submit}>
            <label htmlFor="contact-name">Adınız</label>
            <input
              id="contact-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoComplete="name"
            />
            <label htmlFor="contact-message">Mesajınız</label>
            <textarea
              id="contact-message"
              rows={5}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
            />
            <button type="submit" className="button accent">
              {viaWhatsapp ? "WhatsApp ile gönder" : "E-posta ile gönder"}
            </button>
            <p className="muted small">
              {viaWhatsapp ? "Mesajınız WhatsApp uygulamasında açılır." : "Mesajınız e-posta uygulamanızda açılır."}
            </p>
          </form>
        )}
      </div>
      <section className="map" aria-labelledby="map-title">
        <div className="page-head">
          <h2 id="map-title">Adres</h2>
          <a className="button paper" href={MAP_LINK_URL} target="_blank" rel="noopener noreferrer">
            Google Haritalar'da aç
          </a>
        </div>
        <iframe title="Haritada adres" src={MAP_EMBED_URL} loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
      </section>
    </div>
  )
}
