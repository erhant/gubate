import { Center, Pagination, SimpleGrid, Text, Image, Modal } from "@mantine/core"
import Head from "next/head"
import Layout from "../components/layout"
import { motion } from "framer-motion"
import { useState } from "react"
import type { GetStaticPropsContext, NextPage } from "next"
import { readdirSync } from "fs"

const COLS = 3
const Gallery: NextPage<{ images: string[]; numPages: number }> = ({ images, numPages }) => {
  const [activePage, setPage] = useState(1)
  const [openModal, setOpenModal] = useState(false)
  const [modalImage, setModalImage] = useState("")

  return (
    <>
      <Head>
        <title>Gubate | Galeri</title>
        <meta name="description" content="Gubate galerisi" key="desc" />
      </Head>
      <Layout>
        <>
          {/* single image display */}
          <Modal
            transition="fade"
            transitionDuration={600}
            centered
            transitionTimingFunction="ease"
            opened={openModal}
            onClose={() => setOpenModal(false)}
            withCloseButton={false}
            padding={0}
          >
            <Image src={"/assets/gallery/" + modalImage} width="100%" height="100%" />
          </Modal>

          {/* image gallery */}
          {images.length > 0 ? (
            <>
              <Center>
                <SimpleGrid spacing="sm" cols={COLS} sx={{ marginLeft: "auto", marginRight: "auto" }}>
                  {images.slice((activePage - 1) * COLS * COLS, activePage * COLS * COLS).map((src, i) => (
                    <motion.div key={i} whileHover={{ scale: 1.1 }}>
                      <Image
                        src={"/assets/gallery/" + src}
                        m="xs"
                        width="15vw"
                        height="15vw"
                        onClick={() => {
                          setModalImage(src)
                          setOpenModal(true)
                        }}
                        sx={{ cursor: "pointer" }}
                      />
                    </motion.div>
                  ))}
                </SimpleGrid>
              </Center>
              {numPages > 0 && (
                <Center my="md">
                  <Pagination page={activePage} onChange={setPage} total={numPages} radius="xl" />
                </Center>
              )}
            </>
          ) : (
            <Text sx={{ textAlign: "center" }} my="lg">
              Henüz bir resim yok.
            </Text>
          )}
        </>
      </Layout>
    </>
  )
}

export default Gallery

export async function getStaticProps(context: GetStaticPropsContext) {
  // get all images under assets/gallery
  const imagesPaths = readdirSync(process.cwd() + "/public/assets/gallery")
  return {
    props: { images: imagesPaths, numPages: Math.ceil(imagesPaths.length / (COLS * COLS)) }, // will be passed to the page component as props
  }
}
