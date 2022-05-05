import { Card, Center, Anchor, Title, Stepper, Transition, Text, Box } from "@mantine/core"
import Head from "next/head"
import Layout from "../components/layout"
import type { NextPage } from "next"

const content = [
  {
    title: "Bahar Temalı Workshop",
    date: "16 Nisan 2022, 10:00 - 14:00",
    desc: "Gülin Özet Üstün ile yaratma cesareti olan çocukları bekliyoruz, haydi gelin beyaz elbiselerimizi eğlenerek birlikte tasarlayalım! (7 - 14 yaş)",
  },
  {
    title: "Sumi-E Workshop",
    date: "1 Nisan 2022, 13:00 - 15:00",
    desc: "Aynur Küçük Yalçın ile bir japon sanatı olan Sumi-e sanatını kullanarak bambu çizeceğiz.",
  },
]
const Ateliers: NextPage = () => {
  return (
    <>
      <Head>
        <title>Gubate | Atölyeler</title>
        <meta name="description" content="Gubate atölyeleri" key="desc" />
      </Head>
      <Layout>
        <>
          {content.map((a, i) => (
            <Box key={i} sx={{ borderLeft: "0.5em outset", paddingLeft: "2em" }} my="md">
              <Title>{a.title}</Title>
              <Text color="dimmed">{a.date}</Text>
              <Text>{a.desc}</Text>
            </Box>
          ))}
        </>
      </Layout>
    </>
  )
}

export default Ateliers
