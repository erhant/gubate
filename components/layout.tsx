import { Container } from "@mantine/core"
import { ReactChild } from "react"
import Header from "./header"
import Footer from "./footer"

type Props = {
  children: ReactChild
}

const Layout = ({ children }: Props) => {
  return (
    <div className="layout">
      <Header />
      <main>
        <Container>{children}</Container>
      </main>
      <div style={{ flexGrow: 1 }} />
      <Footer />
    </div>
  )
}

export default Layout
