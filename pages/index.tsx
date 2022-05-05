import { Modal, Text, Title, Box, Image, Center } from "@mantine/core"
import Head from "next/head"
import Layout from "../components/layout"
import { useEffect, useState } from "react"
import { isTodayMothersDay } from "../utils"
import "react-responsive-carousel/lib/styles/carousel.min.css" // requires a loader
import { Carousel } from "react-responsive-carousel"
import type { NextPage } from "next"

const Index: NextPage = () => {
  const [showToday, setShowToday] = useState(true)

  useEffect(() => {
    // check if its mothers day
    if (isTodayMothersDay()) {
      const shown = false // window.sessionStorage.getItem("gubate-mother-shown")
      if (!shown) {
        setShowToday(true)
        window.sessionStorage.setItem("gubate-mother-shown", "1")
      }
    }
  }, [])

  return (
    <>
      <Head>
        <title>Gubate</title>
        <meta name="description" content="Gubate anasayfa" key="desc" />
      </Head>
      <Layout>
        <>
          {/* mother's day modal */}
          <Modal opened={showToday} onClose={() => setShowToday(false)}>
            <Box sx={{ textAlign: "center" }}>
              <Title>
                ❤️❤️❤️ <br />
                Anneler günün kutlu olsuuun!! <br /> ❤️❤️❤️
              </Title>
              <Center my="md">
                <Image src="/assets/mother/withbird.jpeg" width={350} height={350} alt="bird" />
              </Center>

              <Title order={3}>Seni çok seven, Erhan.</Title>
            </Box>
          </Modal>

          {/* image carousel */}
          <Box my="md">
            <Carousel autoPlay interval={5000} infiniteLoop showThumbs={false} showStatus={false}>
              <div>
                <img
                  src="/assets/mother/withbird.jpeg"
                  style={{ width: 350, height: 350, objectFit: "cover" }}
                  alt="bird"
                />
              </div>
              <div>
                <img src="/assets/gallery/1.jpeg" style={{ width: 350, height: 350, objectFit: "cover" }} alt="bio" />
              </div>
            </Carousel>
          </Box>

          {/* text content */}
          <Text>
            Atölyemizde bireylerin resim (yağlıboya, suluboya, pastelboya), desen, canlandırma film ve benzeri sanat
            aktiviteleri ile kendilerini özgürce ifade edebilmelerine ve yaratıcılıklarını geliştirmelerine olanak
            sağlayan bir çalışma ortamı sunuyoruz. Ayrıca gelişim ve değişim taleplerine bağlı olarak potansiyellerini
            keşfetmelerine ve hedeflerine ulaşmalarına olanak sağlayan koçluk ve proje bazında çözüm sunmak amacıyla
            uzmanlık alanları kapsamında danışmanlık hizmeti vermekteyiz.
          </Text>
        </>
      </Layout>
    </>
  )
}

export default Index
