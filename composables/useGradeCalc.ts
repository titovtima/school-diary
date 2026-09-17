export interface WeightedGrade {
  value: number
  weight: number
}

/**
 * Средневзвешенный балл. Возвращает null, если нет данных
 * или сумма весов = 0 (защита от NaN).
 */
export function weightedAverage(grades: WeightedGrade[]): number | null {
  if (!grades.length) return null
  let s = 0
  let w = 0
  for (const g of grades) {
    const v = Number(g.value)
    const wt = Number(g.weight)
    if (!Number.isFinite(v) || !Number.isFinite(wt)) continue
    s += v * wt
    w += wt
  }
  if (!Number.isFinite(s) || !Number.isFinite(w) || w === 0) return null
  const result = s / w
  return Number.isFinite(result) ? result : null
}

export function formatAvg(avg: number | null): string {
  return avg == null ? '—' : avg.toFixed(2)
}
