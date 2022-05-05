// the layout is simply header - footer - side navbar - content
import { AppShell, Container } from "@mantine/core"
import { ReactChild, ReactElement, useState } from "react"
import Header from "./header"
import Footer from "./footer"

type Props = {
  children: ReactChild
}

const Layout = ({ children }: Props) => {
  return (
    <>
      <AppShell padding="md" header={<Header />} footer={<Footer />}>
        <Container>{children}</Container>
      </AppShell>
    </>
  )
}

export default Layout
