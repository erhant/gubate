import { MantineThemeOverride } from "@mantine/core"

type TenColors = [string, string, string, string, string, string, string, string, string, string]

const fonts: string = "'Mali', cursive"
// #2296B1
const myBlues: TenColors = [
  "#dcf5ff",
  "#b7e2f6",
  "#8fd1ec",
  "#66c3e3",
  "#3eb8da",
  "#25a3c1",
  "#167797",
  "#074e6d",
  "#002943",
  "#000d1a",
]
const DefaultMantineTheme: MantineThemeOverride = {
  fontFamily: fonts,
  headings: {
    fontFamily: fonts,
  },
  colors: {
    blues: myBlues,
    icons: myBlues,
  },
  primaryColor: "blues",
}

export default DefaultMantineTheme
