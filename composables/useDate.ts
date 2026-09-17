/**
 * Приводит любой вход (ISO-строка, Date, строка с временем) к 'YYYY-MM-DD'.
 * Не падает на мусоре — возвращает ''.
 */
function toISODate(input: unknown): string {
  if (input == null) return ''
  if (input instanceof Date) {
    if (Number.isNaN(input.getTime())) return ''
    return input.toISOString().slice(0, 10)
  }
  const s = String(input)
  // уже 'YYYY-MM-DD' или 'YYYY-MM-DDTHH...' — берём первые 10
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10)
  // пробуем распарсить как дату (осторожно)
  const d = new Date(s)
  if (Number.isNaN(d.getTime())) return ''
  return d.toISOString().slice(0, 10)
}

/** '2026-09-17' -> '17.09.2026' */
export function formatDate(input: unknown): string {
  const iso = toISODate(input)
  if (!iso) return ''
  const [y, m, d] = iso.split('-')
  return `${d}.${m}.${y}`
}

/** '2026-09-17' -> '17.09' */
export function formatDateShort(input: unknown): string {
  const iso = toISODate(input)
  if (!iso) return ''
  const [, m, d] = iso.split('-')
  return `${d}.${m}`
}

/** Диапазон дат -> '17.09.2025 — 25.10.2025' */
export function formatRange(from: unknown, to: unknown): string {
  return `${formatDate(from)} — ${formatDate(to)}`
}

/** Все будние дни между датами (включительно), ISO-строки 'YYYY-MM-DD' */
export function schoolDaysBetween(from: unknown, to: unknown): string[] {
  const startIso = toISODate(from)
  const endIso = toISODate(to)
  if (!startIso || !endIso) return []

  const out: string[] = []
  const d = new Date(startIso + 'T00:00:00Z')
  const end = new Date(endIso + 'T00:00:00Z')
  if (Number.isNaN(d.getTime()) || Number.isNaN(end.getTime())) return []

  while (d <= end) {
    const dow = d.getUTCDay()
    if (dow !== 0 && dow !== 6) out.push(d.toISOString().slice(0, 10))
    d.setUTCDate(d.getUTCDate() + 1)
  }
  return out
}

/** Нормализует 'YYYY-MM-DD' для сравнения — то же, что toISODate, но экспорт */
export const normalizeDate = toISODate
