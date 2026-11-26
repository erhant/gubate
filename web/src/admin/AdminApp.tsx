import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react"
import { admin, ApiError } from "../api"
import { setInk } from "../ink/InkBackground"
import { href } from "../router"
import type { Group, Painting, Series, SiteData } from "../types"
import { prepareImage, suggestFromUrl } from "./imageTools"

type Tab = "resimler" | "anasayfa" | "gruplar" | "seriler" | "yazilar"
type Update = (change: (draft: SiteData) => void) => void

const TABS: { key: Tab; label: string }[] = [
  { key: "resimler", label: "Resimler" },
  { key: "anasayfa", label: "Ana sayfa" },
  { key: "gruplar", label: "Gruplar" },
  { key: "seriler", label: "Seriler" },
  { key: "yazilar", label: "Yazılar" },
]

const TR: Record<string, string> = { ç: "c", ğ: "g", ı: "i", ö: "o", ş: "s", ü: "u" }
const slug = (s: string) =>
  s
    .toLowerCase()
    .replace(/[çğıöşü]/g, (c) => TR[c] ?? c)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40)
const newId = (prefix: string) => `${prefix}-${Date.now().toString(36)}`

function move<T>(list: T[], from: number, to: number) {
  if (to < 0 || to >= list.length) return
  const [item] = list.splice(from, 1)
  list.splice(to, 0, item!)
}

function message(e: unknown): string {
  if (e instanceof ApiError) {
    if (e.code === "wrong_password") return "Şifre yanlış."
    if (e.code === "stale") return "Başka bir yerden değişiklik yapılmış. Sayfayı yenileyip tekrar deneyin."
    if (e.code === "too_large") return "Resim çok büyük."
    if (e.status === 401) return "Oturum süresi dolmuş. Sayfayı yenileyip tekrar giriş yapın."
  }
  return "Bir şeyler ters gitti. Lütfen tekrar deneyin."
}

export default function AdminApp() {
  const [state, setState] = useState<"loading" | "unconfigured" | "login" | "ready">("loading")
  const [site, setSite] = useState<SiteData | null>(null)
  const [base, setBase] = useState("")
  const [dirty, setDirty] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [tab, setTab] = useState<Tab>("resimler")
  const [editing, setEditing] = useState<string | null>(null)
  const latest = useRef<SiteData | null>(null)

  const load = async () => {
    const data = await admin.getSite()
    put(data)
    setBase(data.updatedAt)
    setDirty(false)
    setState("ready")
  }

  useEffect(() => {
    admin
      .me()
      .then((me) => (!me.configured ? setState("unconfigured") : me.signedIn ? load() : setState("login")))
      .catch(() => setError(message(null)))
    return () => setInk(null)
  }, [])

  // warn before closing the tab with unsaved changes
  useEffect(() => {
    if (!dirty) return
    const warn = (e: BeforeUnloadEvent) => e.preventDefault()
    window.addEventListener("beforeunload", warn)
    return () => window.removeEventListener("beforeunload", warn)
  }, [dirty])

  // Changes are applied to the latest document straight away (not inside a state updater), so
  // handlers can read e.target.value safely and several changes in one tick build on each other.
  const put = (doc: SiteData) => {
    latest.current = doc
    setSite(doc)
  }
  const update: Update = (change) => {
    if (!latest.current) return
    const draft = structuredClone(latest.current)
    change(draft)
    put(draft)
    setDirty(true)
  }

  const save = async (doc: SiteData | null = site) => {
    if (!doc) return
    setSaving(true)
    setError("")
    // keep the document on screen even if saving fails, so nothing she did is lost
    put(doc)
    try {
      const saved = await admin.saveSite(doc, base)
      put(saved)
      setBase(saved.updatedAt)
      setDirty(false)
    } catch (e) {
      setDirty(true)
      setError(message(e))
    } finally {
      setSaving(false)
    }
  }

  if (state === "loading") return <p className="status">{error || "Yükleniyor…"}</p>
  if (state === "unconfigured")
    return (
      <div className="admin">
        <h1>Yönetim</h1>
        <p>
          Yönetim paneli henüz ayarlanmamış. ADMIN_PASSWORD ve SESSION_SECRET değişkenlerinin tanımlanması gerekiyor.
        </p>
      </div>
    )
  if (state === "login") return <Login onDone={() => load().catch((e) => setError(message(e)))} />
  if (!site) return null

  const painting = editing ? site.paintings.find((p) => p.id === editing) : undefined
  return (
    <div className="admin">
      <header className="admin-head">
        <h1>Yönetim</h1>
        <div className="actions">
          <a className="button paper" href={href()}>
            Siteyi gör
          </a>
          <button type="button" className="button paper" onClick={() => admin.logout().then(() => setState("login"))}>
            Çıkış
          </button>
        </div>
      </header>

      {painting ? (
        <PaintingEditor
          key={painting.id}
          painting={painting}
          groups={site.groups}
          series={site.series}
          update={update}
          onClose={() => setEditing(null)}
        />
      ) : (
        <>
          <div className="tabs" role="tablist">
            {TABS.map((t) => (
              <button
                key={t.key}
                type="button"
                role="tab"
                aria-selected={tab === t.key}
                className="tab"
                onClick={() => setTab(t.key)}
              >
                {t.label}
              </button>
            ))}
          </div>
          {tab === "resimler" && (
            <Paintings site={site} update={update} onEdit={setEditing} onUploaded={save} onError={setError} />
          )}
          {tab === "anasayfa" && <Featured site={site} update={update} />}
          {tab === "gruplar" && <Groups site={site} update={update} />}
          {tab === "seriler" && (
            <SeriesTab site={site} update={update} onEdit={setEditing} onUploaded={save} onError={setError} />
          )}
          {tab === "yazilar" && <Texts site={site} update={update} />}
        </>
      )}

      {(dirty || error) && (
        <div className="savebar" role="status">
          <span>{error || "Kaydedilmemiş değişiklikler var."}</span>
          {dirty && (
            <button type="button" className="button accent" disabled={saving} onClick={() => save()}>
              {saving ? "Kaydediliyor…" : "Kaydet"}
            </button>
          )}
        </div>
      )}
    </div>
  )
}

function Login({ onDone }: { onDone: () => void }) {
  const [password, setPassword] = useState("")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError("")
    try {
      await admin.login(password)
      onDone()
    } catch (err) {
      setError(message(err))
    } finally {
      setBusy(false)
    }
  }
  return (
    <form className="admin login form" onSubmit={submit}>
      <h1>Yönetim</h1>
      <label htmlFor="admin-password">Şifre</label>
      <input
        id="admin-password"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        autoComplete="current-password"
        required
      />
      <button type="submit" className="button accent" disabled={busy}>
        {busy ? "Giriş yapılıyor…" : "Giriş yap"}
      </button>
      {error && <p role="alert">{error}</p>}
    </form>
  )
}

function Field({ id, label, hint, children }: { id: string; label: string; hint?: string; children: ReactNode }) {
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      {children}
      {hint && <p className="muted small">{hint}</p>}
    </div>
  )
}

/** A number input that accepts both "34.5" and "34,5" and can be left empty. */
function NumberField(props: { id: string; label: string; value: number | null; onValue: (v: number | null) => void }) {
  const [text, setText] = useState(props.value === null ? "" : String(props.value))
  return (
    <Field id={props.id} label={props.label}>
      <input
        id={props.id}
        inputMode="decimal"
        value={text}
        onChange={(e) => {
          const typed = e.target.value
          setText(typed)
          const parsed = Number(typed.trim().replace(",", "."))
          props.onValue(typed.trim() === "" || Number.isNaN(parsed) ? null : parsed)
        }}
      />
    </Field>
  )
}

const UNTITLED = "Adsız"

/**
 * Adds a painting to a series (at the end). A painting that has no real title yet is named
 * after the series and its position: "Kuşlar 2", "Kuşlar 3", …
 */
function addToSeries(doc: SiteData, seriesId: string, paintingId: string) {
  const series = doc.series.find((s) => s.id === seriesId)
  const painting = doc.paintings.find((p) => p.id === paintingId)
  if (!series || !painting || series.paintingIds.includes(paintingId)) return
  series.paintingIds.push(paintingId)
  if (painting.title.trim() === "" || painting.title === UNTITLED) {
    painting.title = `${series.name} ${series.paintingIds.length}`
  }
}

interface UploadProps {
  site: SiteData
  onEdit: (id: string) => void
  onUploaded: (doc: SiteData) => Promise<void>
  onError: (m: string) => void
}

/** Resize, upload and save a new painting, then open it for editing. `place` can file it somewhere first. */
function useUpload({ site, onEdit, onUploaded, onError }: UploadProps) {
  const [progress, setProgress] = useState("")
  const run = async (file: File, place?: (doc: SiteData, painting: Painting) => void) => {
    onError("")
    try {
      setProgress("Resim hazırlanıyor…")
      const prepared = await prepareImage(file)
      const id = newId("resim")
      const images = { small: "", medium: "", large: "" }
      let step = 0
      for (const size of ["small", "medium", "large"] as const) {
        setProgress(`Yükleniyor… (${++step}/3)`)
        images[size] = (await admin.upload(`${id}-${size}.jpg`, prepared[size])).url
      }
      const painting: Painting = {
        id,
        title: UNTITLED,
        technique: "",
        widthCm: null,
        heightCm: null,
        year: null,
        groupId: null,
        sold: false,
        hidden: false,
        palette: prepared.palette,
        aspect: prepared.aspect,
        images,
      }
      // saved straight away so an uploaded photo is never lost or left orphaned
      const doc = structuredClone(site)
      doc.paintings.unshift(painting)
      place?.(doc, painting)
      setProgress("Kaydediliyor…")
      await onUploaded(doc)
      onEdit(id)
    } catch (e) {
      onError(e instanceof ApiError ? message(e) : "Bu resim okunamadı. JPEG ya da PNG bir fotoğraf deneyin.")
    } finally {
      setProgress("")
    }
  }
  return { progress, run }
}

/** A big button that opens the photo picker. */
function UploadButton(props: { id: string; label: string; progress: string; onFile: (file: File) => void }) {
  return (
    <>
      <input
        id={props.id}
        className="visually-hidden"
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={(e) => {
          const file = e.target.files?.[0]
          // cleared so that picking the same photo again still fires a change
          e.target.value = ""
          if (file) props.onFile(file)
        }}
      />
      <label htmlFor={props.id} className="button accent big" aria-disabled={!!props.progress}>
        {props.progress || props.label}
      </label>
    </>
  )
}

function Paintings(props: UploadProps & { update: Update }) {
  const { site, update, onEdit } = props
  const upload = useUpload(props)

  return (
    <section className="stack">
      <UploadButton id="add-painting" label="+ Resim ekle" progress={upload.progress} onFile={(f) => upload.run(f)} />
      <ul className="rows">
        {site.paintings.map((p, i) => (
          <li key={p.id} className="row">
            <img src={p.images.small} alt="" />
            <div className="row-text">
              <strong>{p.title || "Adsız"}</strong>
              <span className="row-badges">
                {p.hidden && <span className="badge quiet">Gizli</span>}
                {p.sold && <span className="badge">Satıldı</span>}
              </span>
            </div>
            <div className="row-actions">
              <button
                type="button"
                className="icon"
                aria-label={`${p.title} yukarı taşı`}
                disabled={i === 0}
                onClick={() => update((d) => move(d.paintings, i, i - 1))}
              >
                ↑
              </button>
              <button
                type="button"
                className="icon"
                aria-label={`${p.title} aşağı taşı`}
                disabled={i === site.paintings.length - 1}
                onClick={() => update((d) => move(d.paintings, i, i + 1))}
              >
                ↓
              </button>
              <button type="button" className="button paper" onClick={() => onEdit(p.id)}>
                Düzenle
              </button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}

function PaintingEditor({
  painting,
  groups,
  series,
  update,
  onClose,
}: {
  painting: Painting
  groups: Group[]
  series: Series[]
  update: Update
  onClose: () => void
}) {
  const [confirming, setConfirming] = useState(false)
  const [note, setNote] = useState("")
  const set = (change: (p: Painting) => void) =>
    update((d) => {
      const p = d.paintings.find((x) => x.id === painting.id)
      if (p) change(p)
    })

  // the page background previews the colours as she changes them
  useEffect(() => {
    setInk(painting.palette)
    return () => setInk(null)
  }, [painting.palette])

  const resuggest = async () => {
    setNote("")
    try {
      const palette = await suggestFromUrl(painting.images.small)
      set((p) => (p.palette = palette))
    } catch {
      setNote("Renkler bu resimden okunamadı. Renkleri elle seçebilirsiniz.")
    }
  }

  const COLOURS = ["Zemin", "Renk 1", "Renk 2"]
  return (
    <section className="editor">
      <button type="button" className="button paper" onClick={onClose}>
        ← Resimlere dön
      </button>
      <img
        className="editor-image"
        src={painting.images.medium}
        alt={painting.title}
        style={{ aspectRatio: painting.aspect }}
      />
      <div className="panel form">
        <Field id="p-title" label="Başlık">
          <input id="p-title" value={painting.title} onChange={(e) => set((p) => (p.title = e.target.value))} />
        </Field>
        <Field id="p-technique" label="Teknik" hint="Örnek: Kâğıt üzerine mürekkep ve suluboya">
          <input
            id="p-technique"
            value={painting.technique}
            onChange={(e) => set((p) => (p.technique = e.target.value))}
          />
        </Field>
        <div className="field-row">
          <NumberField
            id="p-width"
            label="En (cm)"
            value={painting.widthCm}
            onValue={(v) => set((p) => (p.widthCm = v))}
          />
          <NumberField
            id="p-height"
            label="Boy (cm)"
            value={painting.heightCm}
            onValue={(v) => set((p) => (p.heightCm = v))}
          />
          <NumberField id="p-year" label="Yıl" value={painting.year} onValue={(v) => set((p) => (p.year = v))} />
        </div>
        <Field id="p-group" label="Grup">
          <select
            id="p-group"
            value={painting.groupId ?? ""}
            onChange={(e) => set((p) => (p.groupId = e.target.value || null))}
          >
            <option value="">Grup yok</option>
            {groups.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>
        </Field>
        <label className="switch" htmlFor="p-sold">
          <input
            id="p-sold"
            type="checkbox"
            checked={painting.sold}
            onChange={(e) => set((p) => (p.sold = e.target.checked))}
          />
          <span>Satıldı</span>
        </label>
        <label className="switch" htmlFor="p-hidden">
          <input
            id="p-hidden"
            type="checkbox"
            checked={painting.hidden}
            onChange={(e) => set((p) => (p.hidden = e.target.checked))}
          />
          <span>Gizli (sitede görünmez)</span>
        </label>

        {series.length > 0 && (
          <fieldset className="colours">
            <legend>Seriler</legend>
            <p className="muted small">
              Bir resim birden fazla seride olabilir. Başlığı boşsa seri adını ve sırasını alır.
            </p>
            {series.map((s) => (
              <label key={s.id} className="switch" htmlFor={`p-series-${s.id}`}>
                <input
                  id={`p-series-${s.id}`}
                  type="checkbox"
                  checked={s.paintingIds.includes(painting.id)}
                  onChange={(e) => {
                    const member = e.target.checked
                    update((d) => {
                      if (member) addToSeries(d, s.id, painting.id)
                      else
                        for (const x of d.series)
                          if (x.id === s.id) x.paintingIds = x.paintingIds.filter((id) => id !== painting.id)
                    })
                  }}
                />
                <span>{s.name}</span>
              </label>
            ))}
          </fieldset>
        )}

        <fieldset className="colours">
          <legend>Arka plan renkleri</legend>
          <p className="muted small">Sayfanın arka planı bu renklere göre değişir. Değiştirince hemen görürsünüz.</p>
          <div className="field-row">
            {COLOURS.map((label, i) => (
              <Field key={label} id={`p-colour-${i}`} label={label}>
                <input
                  id={`p-colour-${i}`}
                  type="color"
                  value={painting.palette[i as 0 | 1 | 2]}
                  onChange={(e) => set((p) => (p.palette[i as 0 | 1 | 2] = e.target.value))}
                />
              </Field>
            ))}
          </div>
          <button type="button" className="button paper" onClick={resuggest}>
            Renkleri yeniden öner
          </button>
          {note && <p role="alert">{note}</p>}
        </fieldset>

        <div className="danger">
          {confirming ? (
            <>
              <p>Bu resim silinsin mi? Kaydettikten sonra geri alınamaz.</p>
              <div className="actions">
                <button
                  type="button"
                  className="button accent"
                  onClick={() => {
                    update((d) => {
                      d.paintings = d.paintings.filter((p) => p.id !== painting.id)
                      d.featured = d.featured.filter((id) => id !== painting.id)
                      for (const x of d.series) x.paintingIds = x.paintingIds.filter((id) => id !== painting.id)
                    })
                    onClose()
                  }}
                >
                  Evet, sil
                </button>
                <button type="button" className="button paper" onClick={() => setConfirming(false)}>
                  Vazgeç
                </button>
              </div>
            </>
          ) : (
            <button type="button" className="button paper" onClick={() => setConfirming(true)}>
              Resmi sil
            </button>
          )}
        </div>
      </div>
    </section>
  )
}

function Featured({ site, update }: { site: SiteData; update: Update }) {
  const byId = new Map(site.paintings.map((p) => [p.id, p]))
  const rest = site.paintings.filter((p) => !site.featured.includes(p.id) && !p.hidden)
  return (
    <section className="stack">
      <p className="muted">Ana sayfada sırayla gösterilecek resimler. Beş resim önerilir.</p>
      <ul className="rows">
        {site.featured.map((id, i) => {
          const p = byId.get(id)
          if (!p) return null
          return (
            <li key={id} className="row">
              <img src={p.images.small} alt="" />
              <div className="row-text">
                <strong>
                  {i + 1}. {p.title}
                </strong>
              </div>
              <div className="row-actions">
                <button
                  type="button"
                  className="icon"
                  aria-label={`${p.title} yukarı taşı`}
                  disabled={i === 0}
                  onClick={() => update((d) => move(d.featured, i, i - 1))}
                >
                  ↑
                </button>
                <button
                  type="button"
                  className="icon"
                  aria-label={`${p.title} aşağı taşı`}
                  disabled={i === site.featured.length - 1}
                  onClick={() => update((d) => move(d.featured, i, i + 1))}
                >
                  ↓
                </button>
                <button
                  type="button"
                  className="button paper"
                  onClick={() => update((d) => (d.featured = d.featured.filter((x) => x !== id)))}
                >
                  Çıkar
                </button>
              </div>
            </li>
          )
        })}
      </ul>
      {rest.length > 0 && (
        <Field id="featured-add" label="Ana sayfaya resim ekle">
          <select
            id="featured-add"
            value=""
            onChange={(e) => e.target.value && update((d) => d.featured.push(e.target.value))}
          >
            <option value="">Resim seçin…</option>
            {rest.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title}
              </option>
            ))}
          </select>
        </Field>
      )}
    </section>
  )
}

function Groups({ site, update }: { site: SiteData; update: Update }) {
  const [name, setName] = useState("")
  const add = (e: FormEvent) => {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) return
    update((d) => d.groups.push({ id: newId(slug(trimmed) || "grup"), name: trimmed }))
    setName("")
  }
  return (
    <section className="stack">
      <p className="muted">
        Galerideki resimleri gruplara ayırır. Bir grubu silince resimleri silinmez, grupsuz kalır.
      </p>
      <ul className="rows">
        {site.groups.map((g, i) => (
          <li key={g.id} className="row">
            <label className="visually-hidden" htmlFor={`group-${g.id}`}>
              Grup adı
            </label>
            <input
              id={`group-${g.id}`}
              className="row-input"
              value={g.name}
              onChange={(e) => update((d) => (d.groups[i]!.name = e.target.value))}
            />
            <div className="row-actions">
              <button
                type="button"
                className="button paper"
                onClick={() =>
                  update((d) => {
                    d.groups = d.groups.filter((x) => x.id !== g.id)
                    for (const p of d.paintings) if (p.groupId === g.id) p.groupId = null
                  })
                }
              >
                Sil
              </button>
            </div>
          </li>
        ))}
      </ul>
      <form className="form inline" onSubmit={add}>
        <Field id="group-new" label="Yeni grup">
          <input id="group-new" value={name} onChange={(e) => setName(e.target.value)} />
        </Field>
        <button type="submit" className="button accent">
          Ekle
        </button>
      </form>
    </section>
  )
}

function SeriesTab(props: UploadProps & { update: Update }) {
  const { site, update, onEdit } = props
  const upload = useUpload(props)
  const [uploadingTo, setUploadingTo] = useState("")
  const [name, setName] = useState("")
  const byId = new Map(site.paintings.map((p) => [p.id, p]))

  const add = (e: FormEvent) => {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) return
    update((d) => d.series.push({ id: newId(slug(trimmed) || "seri"), name: trimmed, paintingIds: [] }))
    setName("")
  }
  const edit = (id: string, change: (s: Series) => void) =>
    update((d) => {
      const s = d.series.find((x) => x.id === id)
      if (s) change(s)
    })

  return (
    <section className="stack">
      <p className="muted">
        Seri, kendi sırası olan bir resim dizisidir. Bir resim birden fazla seride olabilir. Seriye eklenen başlıksız
        resim seri adını ve sırasını alır (örnek: “Kuşlar 2”).
      </p>
      {site.series.map((s) => {
        const others = site.paintings.filter((p) => !s.paintingIds.includes(p.id))
        return (
          <div key={s.id} className="panel form">
            <Field id={`series-name-${s.id}`} label="Seri adı">
              <input
                id={`series-name-${s.id}`}
                value={s.name}
                onChange={(e) => {
                  const value = e.target.value
                  edit(s.id, (x) => (x.name = value))
                }}
              />
            </Field>
            <ul className="rows">
              {s.paintingIds.map((id, i) => {
                const p = byId.get(id)
                if (!p) return null
                return (
                  <li key={id} className="row">
                    <img src={p.images.small} alt="" />
                    <div className="row-text">
                      <strong>
                        {i + 1}. {p.title || UNTITLED}
                      </strong>
                    </div>
                    <div className="row-actions">
                      <button
                        type="button"
                        className="icon"
                        aria-label={`${p.title} yukarı taşı`}
                        disabled={i === 0}
                        onClick={() => edit(s.id, (x) => move(x.paintingIds, i, i - 1))}
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        className="icon"
                        aria-label={`${p.title} aşağı taşı`}
                        disabled={i === s.paintingIds.length - 1}
                        onClick={() => edit(s.id, (x) => move(x.paintingIds, i, i + 1))}
                      >
                        ↓
                      </button>
                      <button
                        type="button"
                        className="button paper"
                        onClick={() => edit(s.id, (x) => (x.paintingIds = x.paintingIds.filter((y) => y !== id)))}
                      >
                        Çıkar
                      </button>
                    </div>
                  </li>
                )
              })}
            </ul>
            {others.length > 0 && (
              <Field id={`series-add-${s.id}`} label="Var olan bir resmi ekle">
                <select
                  id={`series-add-${s.id}`}
                  value=""
                  onChange={(e) => {
                    const id = e.target.value
                    if (id) update((d) => addToSeries(d, s.id, id))
                  }}
                >
                  <option value="">Resim seçin…</option>
                  {others.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.title || UNTITLED}
                    </option>
                  ))}
                </select>
              </Field>
            )}
            <UploadButton
              id={`series-upload-${s.id}`}
              label="+ Bu seriye yeni resim yükle"
              progress={uploadingTo === s.id ? upload.progress : ""}
              onFile={(file) => {
                setUploadingTo(s.id)
                upload.run(file, (doc, painting) => addToSeries(doc, s.id, painting.id))
              }}
            />
            <button
              type="button"
              className="button paper"
              onClick={() => update((d) => (d.series = d.series.filter((x) => x.id !== s.id)))}
            >
              Seriyi sil (resimler silinmez)
            </button>
          </div>
        )
      })}
      <form className="form inline" onSubmit={add}>
        <Field id="series-new" label="Yeni seri">
          <input id="series-new" value={name} onChange={(e) => setName(e.target.value)} />
        </Field>
        <button type="submit" className="button accent">
          Ekle
        </button>
      </form>
    </section>
  )
}

function Texts({ site, update }: { site: SiteData; update: Update }) {
  const { about, contact } = site
  // paragraphs are edited as one text box, separated by blank lines
  const [body, setBody] = useState(about.paragraphs.join("\n\n"))
  return (
    <section className="stack">
      <div className="panel form">
        <h2>Hakkında</h2>
        <Field id="t-lead" label="Giriş cümlesi">
          <textarea
            id="t-lead"
            rows={3}
            value={about.lead}
            onChange={(e) => update((d) => (d.about.lead = e.target.value))}
          />
        </Field>
        <Field id="t-body" label="Özgeçmiş" hint="Paragrafları boş bir satırla ayırın.">
          <textarea
            id="t-body"
            rows={10}
            value={body}
            onChange={(e) => {
              setBody(e.target.value)
              update(
                (d) =>
                  (d.about.paragraphs = e.target.value
                    .split(/\n\s*\n/)
                    .map((p) => p.trim())
                    .filter(Boolean))
              )
            }}
          />
        </Field>
      </div>

      <div className="panel form">
        <h2>Sergiler ve çalışmalar</h2>
        <ul className="rows">
          {about.timeline.map((t, i) => (
            <li key={i} className="row timeline-row">
              <label className="visually-hidden" htmlFor={`tl-year-${i}`}>
                Yıl
              </label>
              <input
                id={`tl-year-${i}`}
                className="year-input"
                inputMode="numeric"
                value={t.year}
                onChange={(e) => update((d) => (d.about.timeline[i]!.year = e.target.value))}
              />
              <label className="visually-hidden" htmlFor={`tl-text-${i}`}>
                Açıklama
              </label>
              <input
                id={`tl-text-${i}`}
                className="row-input"
                value={t.text}
                onChange={(e) => update((d) => (d.about.timeline[i]!.text = e.target.value))}
              />
              <button
                type="button"
                className="icon"
                aria-label="Satırı sil"
                onClick={() => update((d) => d.about.timeline.splice(i, 1))}
              >
                ×
              </button>
            </li>
          ))}
        </ul>
        <button
          type="button"
          className="button paper"
          onClick={() => update((d) => d.about.timeline.push({ year: "", text: "Yeni satır" }))}
        >
          + Satır ekle
        </button>
      </div>

      <div className="panel form">
        <h2>İletişim</h2>
        <Field id="c-email" label="E-posta">
          <input
            id="c-email"
            type="email"
            value={contact.email}
            onChange={(e) => update((d) => (d.contact.email = e.target.value))}
          />
        </Field>
        <Field id="c-phone" label="Telefon">
          <input
            id="c-phone"
            type="tel"
            value={contact.phone}
            onChange={(e) => update((d) => (d.contact.phone = e.target.value))}
          />
        </Field>
        <Field id="c-whatsapp" label="WhatsApp numarası" hint="Ülke koduyla, boşluksuz. Örnek: 905321234567">
          <input
            id="c-whatsapp"
            inputMode="numeric"
            value={contact.whatsapp}
            onChange={(e) => update((d) => (d.contact.whatsapp = e.target.value.replace(/\D/g, "")))}
          />
        </Field>
        <Field id="c-instagram" label="Instagram kullanıcı adı">
          <input
            id="c-instagram"
            value={contact.instagram}
            onChange={(e) => update((d) => (d.contact.instagram = e.target.value))}
          />
        </Field>
      </div>
    </section>
  )
}
