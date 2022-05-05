import { AppProps } from "next/app"
import { useState } from "react"
import DefaultMantineTheme from "../themes/default"
// install cookies-next package to manage cookies
import "../styles/globals.scss"
import { MantineProvider, ColorScheme, ColorSchemeProvider } from "@mantine/core"

export default function App(props: AppProps & { colorScheme: ColorScheme }) {
  const { Component, pageProps } = props
  const [colorScheme, setColorScheme] = useState<ColorScheme>(props.colorScheme)

  const toggleColorScheme = (value?: ColorScheme) => {
    const nextColorScheme = value || (colorScheme === "dark" ? "light" : "dark")
    setColorScheme(nextColorScheme)
  }

  return (
    <ColorSchemeProvider colorScheme={colorScheme} toggleColorScheme={toggleColorScheme}>
      <MantineProvider
        theme={{
          ...DefaultMantineTheme,
          colorScheme,
          primaryColor: colorScheme === "dark" ? "blues" : "blues", // todo: do we want different colors for schemes?
        }}
        withGlobalStyles
        withNormalizeCSS
      >
        <Component {...pageProps} />
      </MantineProvider>
    </ColorSchemeProvider>
  )
}
