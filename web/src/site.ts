// Facts about the studio that do not change, so they are not editable in the admin panel.
export const ADDRESS = "Şehit Erdoğan İban Sokak No 20, Akal Sitesi C Blok Daire 1, Akatlar, Beşiktaş, İstanbul 34335"

// The map is searched by street and district only: block and flat numbers confuse the geocoder.
const MAP_QUERY = encodeURIComponent("Şehit Erdoğan İban Sokak No 20, Akatlar, Beşiktaş, İstanbul")
export const MAP_EMBED_URL = `https://www.google.com/maps?q=${MAP_QUERY}&z=16&hl=tr&output=embed`
export const MAP_LINK_URL = `https://www.google.com/maps/search/?api=1&query=${MAP_QUERY}`
