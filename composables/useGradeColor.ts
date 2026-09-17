export function gradeWeightClass(weight: number): string {
  const w = Number(weight)
  if (w <= 1.0)  return 'w1'
  if (w <= 1.25) return 'w2'
  if (w <= 1.5)  return 'w3'
  if (w <= 1.75) return 'w4'
  return 'w5'
}

export function weightLabel(weight: number): string {
  const w = Number(weight)
  if (w <= 1.0)  return 'обычная'
  if (w <= 1.25) return 'повышенная'
  if (w <= 1.5)  return 'повышенная'
  if (w <= 1.75) return 'высокая'
  return 'высокая'
}

/** '1' -> '1.0', '1.5' -> '1.5', '2' -> '2.0' */
export function formatWeight(weight: number): string {
  const w = Number(weight)
  if (!Number.isFinite(w)) return ''
  return w.toFixed(1)
}
