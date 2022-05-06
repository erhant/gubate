import { Title, Image, Text, Accordion, List } from "@mantine/core"
import Head from "next/head"
import Layout from "../components/layout"
import type { NextPage } from "next"
import { motion } from "framer-motion"

const About: NextPage = () => {
  return (
    <>
      <Head>
        <title>Gubate | Hakkında</title>
        <meta name="description" content="Gubate hakkında" key="desc" />
      </Head>
      <Layout>
        <>
          <Accordion initialItem={0}>
            <Accordion.Item
              label={
                <motion.div initial={{ x: 0 }} whileHover={{ x: 5 }}>
                  <Title>Gülçin Balta Tezcan kimdir?</Title>
                </motion.div>
              }
            >
              <Image
                src="/assets/gallery/1.jpeg"
                width={250}
                height={200}
                alt="gubate"
                sx={{ float: "left" }}
                radius="md"
                mr="md"
                mb="md"
              />
              <Text>
                Gülçin Balta Tezcan, 1982 yılında Gazi Yüksek Öğretmen okulu Resim-İş Eğitimi Grafik Bölümü’nden mezun
                oldu. Çeşitli grafik ajanslarında çalıştıktan sonra Karadeniz Ereğli Anadolu Lisesinde Resim-İş
                öğretmeni olarak görev aldı. 1984 yılında Hacettepe Üniversitesi, Güzel Sanatlar Fakültesi, Uygulamalı
                Sanatlar Bölümü, Grafik Anasanat dalında Yüksek Lisansa başladı, aynı zamanda araştırma görevlisi olarak
                çalıştı. 1991 yılında Doktora çalışmasını yine aynı bölümde tamamladı. 1988 yılında Marmara
                Üniversitesi, Güzel Sanatlar Fakültesi, Sinema-TV bölümüne geçti. 2007-2012 yılları arasında
                “Canlandırma Film Bölümü”nü kurdu ve 3 yıl bölüm başkanlığını yürüttü. Sanat hayatı boyunca
                çalışmalarını üniversitelerde resim, temel sanat, grafik ve canlandırma film alanında sürdürmüştür. Aynı
                çalışmayı okul öncesi kurumlarda da yapmış ve 3-6 yaş grubu çocuklarla sanat, 5-6 yaş grubu çocuklarla
                da canlandırma film çalışmaları gerçekleştirmiş olup sanat çalışmalarına Gubate Sanat ve Gelişim’de
                devam etmektedir.
              </Text>
            </Accordion.Item>

            <Accordion.Item
              label={
                <motion.div initial={{ x: 0 }} whileHover={{ x: 5 }}>
                  <Title my="sm">Katıldığı Sergi ve Yarışmalar</Title>
                </motion.div>
              }
            >
              <List>
                {[
                  "1981 18. Antalya Şenliği Grafik Sergisi",
                  "1981 24 Kasım Öğretmenler günü için Milli Eğitim Bakanlığı’nın açmış olduğu “Öğretmenim” konulu afiş yarışmasında üçüncülük ödülü",
                  "1982 Aka Tour adlı Turizm şirketinin okulumuz öğrencileri arasında düzenlediği grafik yarışmasında, amblem birinciliği ve broşür üçüncülüğü ödülü",
                  "1982 Türkiye Çevre Sorunları Vakfı Grafik Sergisi",
                  "1982 Milli Eğitim Bakanlığı Kitap Kapakları tasarımı",
                  "1983 9. Balkan Kürek Şampiyonası Afiş ve çıkartmaları tasarımı",
                  "1985 “Gençlik Yılı” Sergisi",
                  "1985 Uluslararası Atatürk Plaket ve Rozet Yarışması",
                  '1985 "Hacivat ve Karagöz\'ün Animasyona Uygulanabilirliği" adlı araştırma ve Canlandırma Filmi',
                  "1986 Kültür ve Turizm Bakanlığı Kitap Kapakları",
                  "1987 Bolu Devlet Güzel Sanatlar Galerisi Karma Sergi",
                  "1988 Hacettepe Üniversitesi, Güzel Sanatlar Fakültesi, Lisans üstü öğrencileri sergisi",
                  "1988 Mersin Devlet Güzel Sanatlar Galerisi, Karma Resim Sergisi",
                  '1988 Shell "Hayatınız Bizim İçin Değerlidir" yarışmalı afiş sergisi',
                  "1988 Toprak Mahsülleri Ofisi Amblem ikinciliği ödülü",
                  '1991 Ankara Uluslar arası Canlandırma Film Festivali, "Koyun Masalı" adlı animasyon filmi',
                  "1995 Marmara Üniversitesi, Araştırma Fonu Proje Yürütücülüğü",
                  '1996 Kültür Bakanlığı "Atatürk ve Çocuk" konulu Senaryo Yarışması',
                  "2001 Renault 10 Saniye de yaratıcılık adlı film yarışması",
                  "2002 Yağmur Öyküleri adlı filmdeki canlandırma kısmının çizim ve canlandırmaları (Kurmaca-Canlandırma 7’35’’DV,Mayıs)",
                  "2002 Ebru adlı filmin danışmanlığı ve canlandırmaları (Canlandırma, 6’38’’, DV, Haziran)",
                  "2003 Zilli Kurt, (Belgesel, 45’17’’, DV, Ocak)",
                  "2003 Bir Dilek Tut adlı filmin canlandırmaları, Danışmanlığı (Canlandırma, 2”5’, Aralık)",
                  "2004 Değişim adlı filmin danışmanlığı ve canlandırma çalışmaları (Canlandırma, 1”10’, DV, Ocak)",
                  "2004 Paylaşım adlı filmin danışmanlığı ve canlandırma çalışmaları (Canlandırma, 2”10’, DV, Mart)",
                  "2004 Evlilik Evcilik Değildir (Sosyal Reklam, Yönetim ve Kurgu, 2”5’)",
                  "2004 Gönülçelen adlı filmin çizimleri ve canlandırma çalışmaları (Canlandırma, 5”, DV, Haziran)",
                  "2004 Biz..Bunu mu İstiyoruz.. (Canlandırma, 2”,DV, Haziran)",
                  "2004 Marmara Üniversitesi Öğretim Üyeleri Sergisi",
                  "2007 Mayıs, Marmara Üniversitesi, Atatürk Eğitim Fakültesi, Uygulama Anakolu 6 yaş grubu öğrencilerine Canlandırma Film yapım semineri; Senaryo, Story-board, Kukla Yapımı, back-graund Hazırlığı, film çekimi konularında bilgi ve uygulama çalışması. Küçük Penguenin Sorunu (Canlandırma,4’’, DV, Mayıs)",
                  "2008 Marmara Üniversitesi, Atatürk Eğitim Fakültesi, Uygulama Anakolu 6 yaş grubu öğrencilerine Canlandırma Film yapım semineri; Senaryo, Story-board, Kukla Yapımı, back-graund Hazırlığı, film çekimi konularında bilgi ve uygulama çalışması. Bizi Kurtarın (Canlandırma, 6”, DV, Mayıs)",
                  "2008 Marmara Üniversitesi Öğretim Üyeleri Sergisi",
                  "2010 8.Fusıon Print Art Calendar Design Exhibition, Mayıs, İstanbul- Japonya",
                  "2010 Doğuş’ta Sanat, Öğretim Üyeleri Sergisi, Aralık",
                  "2011 Marmara Üniversitesi, Atatürk Eğitim Fakültesi, Uygulama Anakolu 6 yaş grubu öğrencilerine Canlandırma Film yapım semineri; Senaryo, Story-board, Kukla Yapımı, back-graund Hazırlığı, film çekimi konularında bilgi ve uygulama çalışması.Biz çöp değiliz (Canlandırma. 4’, DV, Mayıs)",
                  "2011 9 Fusıon Print Art Calendar Design Exhibition, Mayıs, İstanbul- Japonya",
                  "2012 Marmara Üniversitesi, Atatürk Eğitim Fakültesi, Prof.Dr Ayla Oktay Okul öncesi Eğitim Uygulama Birimi 6 yaş grubu öğrencilerine Canlandırma Film yapım semineri; Senaryo, Story-board, Kukla Yapımı, back-graund Hazırlığı, film çekimi konularında bilgi ve uygulama çalışması.Dalgın Kediler (Canlandırma 2’.30’’, DV, Haziran)",
                  "2012 Marmara Üniversitesi, Atatürk Eğitim Fakültesi, Prof.Dr Ayla Oktay Okul öncesi Eğitim Uygulama Birimi öğrencilerine Sanat Eğitimi Dersleri",
                  "2013 Marmara Üniversitesi, Atatürk Eğitim Fakültesi, Prof.Dr Ayla Oktay Okul öncesi Eğitim Uygulama Birimi 6 yaş grubu öğrencilerine Canlandırma Film yapım semineri; Senaryo, Story-board, Kukla Yapımı, back-graund Hazırlığı, film çekimi konularında bilgi ve uygulama çalışması. Mini Tayfalar (Canlandırma 4’.30’’, DV, Haziran)",
                  "2013 Marmara Üniversitesi, Atatürk Eğitim Fakültesi, Prof.Dr Ayla Oktay Okul öncesi Eğitim Uygulama Birimi öğrencilerine Sanat Eğitimi Dersleri",
                  "2013 “Bir Küçücük Çocuktum” Canlandırma Film, DV, 3’15’’, Ekim",
                ].map((t, i) => (
                  <List.Item key={i}>{t}</List.Item>
                ))}
              </List>
            </Accordion.Item>

            <Accordion.Item
              label={
                <motion.div initial={{ x: 0 }} whileHover={{ x: 5 }}>
                  <Title my="sm">Yapmıs Oldugu İdari Görevler</Title>
                </motion.div>
              }
            >
              <List>
                {[
                  "M.Ü. Sinema-TV Bölümü, Bölüm Başkan yardımcılığı 1995-1998",
                  "M.Ü. Güzel sanatlar Fakültesi, Yardımcı Doçent Temsilciliği, 1999-2005",
                  "M.Ü. Araştırma Projesi Yürütücülüğü 1995",
                  "M.Ü. Fakülte Kurulu Üyeliği 1999-2005",
                  "M.Ü. Sinema-Tv Bölümü Bölüm Başkan Yardımcılığı 2007-2009",
                  "Lisans öğrencilerinin Canlandırma Film Projelerinde Danışmanlıklar",
                  "Fakülte Özel Yetenek Sınavlarında Jüri Üyelikleri",
                  "Canlandırma Film Bölümü Kuruluş Hazırlıkları",
                  "Canlandırma Film Bölümü Başkanlığı, Ocak 2008-2009",
                  "Canlandırma Film Bölüm Başkanlığı, Mart 2010-2012",
                  "2009-2010 5. Uluslararası Öğrenci Trienali Basın ve Halkla İlişkiler Komisyonu Başkanlığı",
                  "Film Gösterim Komisyonu Üyeliği",
                ].map((t, i) => (
                  <List.Item key={i}>{t}</List.Item>
                ))}
              </List>
            </Accordion.Item>
          </Accordion>
        </>
      </Layout>
    </>
  )
}

export default About
