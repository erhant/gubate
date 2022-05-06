// TODO: there is a simpler way to find this
export const isTodayMothersDay = (): boolean => {
  // get today; it should be May & Sunday
  const today: Date = new Date()
  const todayWeekday: string = today.toLocaleDateString("en-US", { weekday: "long" })
  if (todayWeekday == "Sunday" && today.getMonth() == 5) {
    // get today last week; it should be in May
    const prev: Date = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000) // - 7 days
    if (prev.getMonth() == 5) {
      //get today the previous week; it should be in April
      const prevprev: Date = new Date(prev.getTime() - 7 * 24 * 60 * 60 * 1000) // - 14 days
      if (prevprev.getMonth() == 4) {
        return true
      }
    }
  }
  return false
}
