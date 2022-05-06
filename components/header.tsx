import { Box, Anchor, Container, Image, Group } from "@mantine/core"
import Link from "next/link"

const links = [
  { href: "/", text: "Anasayfa" },
  { href: "/ateliers", text: "Atölyeler" },
  { href: "/gallery", text: "Galeri" },
  { href: "/about", text: "Hakkında" },
  { href: "/contact", text: "İletişim" },
]
const Header = () => {
  return (
    <Box component="header" my="lg">
      <Container>
        <Group>
          <Image src="/assets/logo.png" width={200} height="100%" alt="gubate" ml="lg" />
          <span style={{ flexGrow: 1 }} />
          {links.map((l, i) => (
            <Link href={l.href} key={i} passHref>
              <Anchor>{l.text}</Anchor>
            </Link>
          ))}
          <Box mr="lg" />
        </Group>
      </Container>
    </Box>
  )
}

export default Header
