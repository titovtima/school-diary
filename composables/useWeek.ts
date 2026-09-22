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

export function useWeek() {
  const today = new Date().toISOString().slice(0, 10)
  const weekStart = ref(mondayOfWeek(today))

  const days = computed(() => {
    const out: string[] = []
    for (let i = 0; i < 5; i++) out.push(addDays(weekStart.value, i))
    return out
  })

  function prev() { weekStart.value = addDays(weekStart.value, -7) }
  function next() { weekStart.value = addDays(weekStart.value, 7) }
  function goToday() { weekStart.value = mondayOfWeek(today) }

  return { weekStart, days, prev, next, goToday }
}
