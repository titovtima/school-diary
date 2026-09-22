/** SQL-фрагмент: NOT EXISTS (holidays для даты $N). */
export function notHolidaySQL(dateExpr: string, params: any[], dateValue: string): string {
  params.push(dateValue)
  return `NOT EXISTS (
    SELECT 1 FROM holidays h
    WHERE h.start_date <= ${dateExpr} AND h.end_date >= ${dateExpr}
  )`
}

/** Возвращает список учебных дней между from и to, исключая каникулы. */
export async function schoolDaysBetween(from: string, to: string): Promise<string[]> {
  const rows = await query<{ d: string }>(
    `SELECT to_char(d,'YYYY-MM-DD') AS d
     FROM generate_series($1::date, $2::date, INTERVAL '1 day') AS d
     WHERE EXTRACT(ISODOW FROM d) BETWEEN 1 AND 5
       AND NOT EXISTS (
         SELECT 1 FROM holidays h
         WHERE h.start_date <= d::date AND h.end_date >= d::date
       )
     ORDER BY d`,
    [from, to]
  )
  return rows.map(r => r.d)
}

/** День недели (1=пн..7=вс) для даты. */
export function dowOf(iso: string): number {
  const d = new Date(iso + 'T00:00:00Z')
  return d.getUTCDay() || 7
}
