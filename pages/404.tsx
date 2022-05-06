import { Anchor, LoadingOverlay, Text, Box, Grid, Title } from "@mantine/core"
import Head from "next/head"
import Layout from "../components/layout"
import { useState } from "react"
import type { NextPage } from "next"
import Link from "next/link"

const Contact: NextPage = () => {
  return (
    <>
      <Head>
        <title>Gubate | Kayboldun!</title>
      </Head>
      <Layout>
        <div style={{ textAlign: "center" }}>
          <Title>Üzgünüz, böyle bir sayfa yok!</Title>
          <Link href="/" passHref>
            <Anchor>Anasayfaya dönün.</Anchor>
          </Link>
        </div>
      </Layout>
    </>
  )
}

export default Contact
