export interface Bell { n: number; from: string; to: string }

export const useSchedule = () => {
  const appConfig = useAppConfig()
  const bells = ((appConfig.bells ?? []) as Bell[]).filter(b => b && typeof b.n === 'number')

  function bellFor(lessonNum: number): Bell | null {
    return bells.find(b => b.n === lessonNum) ?? null
  }

  function lessonTime(lessonNum: number): string {
    const b = bellFor(lessonNum)
    if (!b) return ''
    return `${b.from}–${b.to}`
  }

  return { bells, bellFor, lessonTime }
}
