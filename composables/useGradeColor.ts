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
  if (w <= 1.0) return 'обычная'
  if (w <= 1.5) return 'повышенная'
  return 'высокая'
}

export function formatWeight(weight: number): string {
  const w = Number(weight)
  if (!Number.isFinite(w)) return ''
  return w.toFixed(1)
}

export interface BadgeStyle {
  class?: string
  style?: Record<string, string>
}

export function gradeStyle(color: string | null | undefined, weight: number): BadgeStyle {
  if (color && /^#[0-9a-fA-F]{6}$/.test(color)) {
    return { style: { backgroundColor: color } }
  }
  return { class: gradeWeightClass(weight) }
}
