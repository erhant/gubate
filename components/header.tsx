import {
  Box,
  Anchor,
  Container,
  Image,
  Group,
  useMantineTheme,
  Drawer,
  Burger,
  Stack,
  Divider,
  Button,
} from "@mantine/core"
import { useMediaQuery } from "@mantine/hooks"
import Link from "next/link"
import { useState } from "react"

const links = [
  { href: "/", text: "Anasayfa" },
  { href: "/ateliers", text: "Atölyeler" },
  { href: "/gallery", text: "Galeri" },
  { href: "/about", text: "Hakkında" },
  { href: "/contact", text: "İletişim" },
]

const Header = () => {
  const theme = useMantineTheme()
  const greaterThanSM = useMediaQuery(`(min-width: ${theme.breakpoints.sm}px)`)
  const [opened, setOpened] = useState(false)

  return (
    <Box component="header" my="lg">
      <Container>
        <Drawer opened={opened} onClose={() => setOpened(false)} padding="xs" size="xs" position="right">
          <Stack>
            {links.map((l, i) => (
              <Link href={l.href} key={i} passHref>
                <Button variant="light">{l.text}</Button>
              </Link>
            ))}
          </Stack>
        </Drawer>
        <Group>
          <Image src="/assets/logo.png" width={200} height="100%" alt="gubate" ml={greaterThanSM ? "lg" : "xs"} />

          <span style={{ flexGrow: 1 }} />
          {greaterThanSM ? (
            links.map((l, i) => (
              <Link href={l.href} key={i} passHref>
                <Anchor>{l.text}</Anchor>
              </Link>
            ))
          ) : (
            <Burger opened={opened} onClick={() => setOpened((o) => !o)} />
          )}
          <Box ml={greaterThanSM ? "lg" : "xs"} />
        </Group>
      </Container>
    </Box>
  )
}

export default Header
