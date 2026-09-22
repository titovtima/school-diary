export function mondayOfWeek(anyDateISO: string): string {
  const d = new Date(anyDateISO + 'T00:00:00Z')
  const dow = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() - (dow - 1))
  return d.toISOString().slice(0, 10)
}
export function addDays(iso: string, days: number): string {
  const d = new Date(iso + 'T00:00:00Z')
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}
export function formatDayMonth(iso: string): string {
  const [, m, d] = iso.slice(0, 10).split('-')
  return `${d}.${m}`
}
export function isToday(iso: string): boolean {
  return iso === new Date().toISOString().slice(0, 10)
}
export function compareISO(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0
}

export interface Holiday { id: number; name: string; start_date: string; end_date: string }

export function useWeek() {
  const appConfig = useAppConfig()
  // Дефолты — границы учебного года 2026/2027 без лета.
  const yearStart: string = (appConfig as any).schoolYear?.start ?? '2026-09-01'
  const yearEnd: string   = (appConfig as any).schoolYear?.end   ?? '2027-05-31'

  // Первая доступная неделя — та, что содержит 1 сентября.
  // Последняя — та, что содержит 31 мая.
  const minWeekStart = mondayOfWeek(yearStart)
  const maxWeekStart = mondayOfWeek(yearEnd)

  const today = new Date().toISOString().slice(0, 10)

  const initial = (() => {
    const monday = mondayOfWeek(today)
    if (compareISO(monday, minWeekStart) < 0) return minWeekStart
    if (compareISO(monday, maxWeekStart) > 0) return maxWeekStart
    return monday
  })()

  const weekStart = ref(initial)

  const days = computed(() => {
    const out: string[] = []
    for (let i = 0; i < 5; i++) out.push(addDays(weekStart.value, i))
    return out
  })

  const canPrev = computed(() => compareISO(weekStart.value, minWeekStart) > 0)
  const canNext = computed(() => compareISO(weekStart.value, maxWeekStart) < 0)

  function prev() {
    const candidate = addDays(weekStart.value, -7)
    if (compareISO(candidate, minWeekStart) < 0) return
    weekStart.value = candidate
  }
  function next() {
    const candidate = addDays(weekStart.value, 7)
    if (compareISO(candidate, maxWeekStart) > 0) return
    weekStart.value = candidate
  }
  function goToday() {
    const monday = mondayOfWeek(new Date().toISOString().slice(0, 10))
    if (compareISO(monday, minWeekStart) < 0) weekStart.value = minWeekStart
    else if (compareISO(monday, maxWeekStart) > 0) weekStart.value = maxWeekStart
    else weekStart.value = monday
  }

  return { weekStart, days, prev, next, goToday, canPrev, canNext, minWeekStart, maxWeekStart }
}

/** Возвращает название каникул для даты, если дата в них попадает. */
export function holidayName(date: string, holidays: Holiday[]): string | null {
  const h = holidays.find(x => x.start_date <= date && date <= x.end_date)
  return h ? h.name : null
}
