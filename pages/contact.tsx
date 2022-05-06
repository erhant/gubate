import { Anchor, LoadingOverlay, Text, Box, Grid } from "@mantine/core"
import Head from "next/head"
import Layout from "../components/layout"
import { useState } from "react"
import type { NextPage } from "next"

const Contact: NextPage = () => {
  const [isLoading, setIsLoading] = useState(true)

  return (
    <>
      <Head>
        <title>Gubate | İletişim</title>
        <meta name="description" content="Gubate'ye ulaşın" key="desc" />
      </Head>
      <Layout>
        <Grid>
          {/* google maps embed */}
          <Grid.Col xs={12} sm={8} sx={{ height: "60vh", position: "relative" }}>
            <Box sx={{ height: "100%" }}>
              <LoadingOverlay visible={isLoading} />
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d1503.66688420493!2d29.024765483616992!3d41.083553526984424!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x14cab60d78f36c09%3A0xe7b7ce028e069b37!2zQWthdCwgxZ5odC4gRXJkb2dhbiDEsGJhbiBTay4gMTItMTQsIDM0MzM1IEJlxZ9pa3RhxZ8vxLBzdGFuYnVs!5e0!3m2!1sen!2str!4v1651782853602!5m2!1sen!2str"
                width="100%"
                height="90%"
                style={{ border: 0 }}
                loading="lazy"
                onLoad={() => setIsLoading(false)}
                referrerPolicy="no-referrer-when-downgrade"
              ></iframe>
              <Text color="dimmed" sx={{ height: "10%" }}>
                Şehit Erdoğan İban Sokak No 7 Metropol Apt. D:1 Akatlar Beşiktaş - İstanbul
              </Text>
            </Box>
          </Grid.Col>

          {/* contact info */}
          <Grid.Col xs={12} sm={4}>
            <Box my="md">
              <Text>
                <b>Gülçin Balta Tezcan</b> <br />
                +90 532 242 77 48 <br />
                <Anchor href="mailto:gulcinbaltatezcan@gmail.com">gulcinbaltatezcan@gmail.com</Anchor> <br />
              </Text>
            </Box>
          </Grid.Col>
        </Grid>
      </Layout>
    </>
  )
}

export default Contact
