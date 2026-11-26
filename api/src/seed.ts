import type { SiteData } from "./types"

// The starting document, used until the first save from the admin panel.
// It has no paintings: they are uploaded through the panel and stored with the images, never in git.
export const seed: SiteData = {
  version: 1,
  updatedAt: "2026-11-26T00:00:00.000Z",
  paintings: [],
  groups: [
    {
      id: "kuslar",
      name: "Kuşlar",
    },
    {
      id: "cicekler",
      name: "Çiçekler",
    },
    {
      id: "bocekler",
      name: "Böcekler",
    },
  ],
  series: [],
  featured: [],
  about: {
    lead: "Gülçin Balta Tezcan emekli bir ressam ve sanat eğitimcisi. Bugün fırçasını sumi-e için kullanıyor.",
    paragraphs: [
      "1982'de Gazi Yüksek Öğretmen Okulu Resim-İş Eğitimi Grafik Bölümü'nden mezun oldu. Grafik ajanslarında ve Karadeniz Ereğli Anadolu Lisesi'nde resim öğretmeni olarak çalıştı. Hacettepe Üniversitesi Güzel Sanatlar Fakültesi'nde yüksek lisansını, 1991'de de doktorasını tamamladı.",
      "1988'de Marmara Üniversitesi Güzel Sanatlar Fakültesi Sinema-TV Bölümü'ne geçti. Canlandırma Film Bölümü'nü kurdu ve bölüm başkanlığını yürüttü. Üniversitelerde resim, temel sanat, grafik ve canlandırma film dersleri verdi.",
    ],
    timeline: [
      {
        year: "1981",
        text: "18. Antalya Şenliği Grafik Sergisi",
      },
      {
        year: "1985",
        text: "“Hacivat ve Karagöz’ün Animasyona Uygulanabilirliği” araştırması ve canlandırma filmi",
      },
      {
        year: "1987",
        text: "Bolu Devlet Güzel Sanatlar Galerisi, Karma Sergi",
      },
      {
        year: "1988",
        text: "Mersin Devlet Güzel Sanatlar Galerisi, Karma Resim Sergisi",
      },
      {
        year: "1991",
        text: "Ankara Uluslararası Canlandırma Film Festivali, “Koyun Masalı”",
      },
      {
        year: "2004",
        text: "Marmara Üniversitesi Öğretim Üyeleri Sergisi",
      },
      {
        year: "2008",
        text: "Marmara Üniversitesi Canlandırma Film Bölümü Başkanlığı",
      },
      {
        year: "2010",
        text: "8. Fusion Print Art Calendar Design Exhibition, İstanbul – Japonya",
      },
      {
        year: "2011",
        text: "9. Fusion Print Art Calendar Design Exhibition, İstanbul – Japonya",
      },
      {
        year: "2013",
        text: "“Bir Küçücük Çocuktum” canlandırma filmi",
      },
    ],
  },
  contact: {
    email: "gulcinbaltatezcan@gmail.com",
    phone: "+90 532 242 77 48",
    instagram: "gubatesanat",
    whatsapp: "905322427748",
  },
}
