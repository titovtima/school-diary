import { requireTeacher } from '~/server/utils/auth'

function mondayOfWeek(anyDateISO: string): string {
  const d = new Date(anyDateISO + 'T00:00:00Z')
  const dow = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() - (dow - 1))
  return d.toISOString().slice(0, 10)
}
function addDays(iso: string, days: number): string {
  const d = new Date(iso + 'T00:00:00Z')
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}

export default defineEventHandler(async (event) => {
  const user = await requireTeacher(event)
  const url = getRequestURL(event)
  const today = new Date().toISOString().slice(0, 10)
  const weekStart = mondayOfWeek(url.searchParams.get('week_start') || today)
  const weekEnd = addDays(weekStart, 4)

  // Праздники
  const holidayRows = await query<{ d: string }>(
    `SELECT to_char(d,'YYYY-MM-DD') AS d
     FROM generate_series($1::date, $2::date, INTERVAL '1 day') AS d
     WHERE EXISTS (
       SELECT 1 FROM holidays h
       WHERE h.start_date <= d::date AND h.end_date >= d::date
     )`,
    [weekStart, weekEnd]
  )
  const holidays = new Set(holidayRows.map(r => r.d))

  const lessons = await query<{
    day_of_week: number; lesson_num: number
    class_id: number; class_name: string
    subject_id: number; subject_name: string
  }>(
    `SELECT s.day_of_week, s.lesson_num,
            c.id AS class_id, c.name AS class_name,
            sub.id AS subject_id, sub.name AS subject_name
     FROM schedule s
     JOIN classes  c ON c.id = s.class_id
     JOIN subjects sub ON sub.id = s.subject_id
     WHERE s.teacher = $1
     ORDER BY s.day_of_week, s.lesson_num`,
    [user.full_name]
  )

  const homework = await query<{
    class_id: number; subject_id: number
    due_date: string; description: string
  }>(
    `SELECT h.class_id, h.subject_id,
            to_char(h.due_date,'YYYY-MM-DD') AS due_date,
            h.description
     FROM homework h
     WHERE h.due_date BETWEEN $1::date AND $2::date
     ORDER BY h.due_date, h.id`,
    [weekStart, weekEnd]
  )

  const hwIndex = new Map<string, typeof homework>()
  for (const h of homework) {
    const key = `${h.class_id}|${h.subject_id}|${h.due_date}`
    if (!hwIndex.has(key)) hwIndex.set(key, [])
    hwIndex.get(key)!.push(h)
  }

  const result = []
  for (const l of lessons) {
    const date = addDays(weekStart, l.day_of_week - 1)
    if (holidays.has(date)) continue
    const key = `${l.class_id}|${l.subject_id}|${date}`
    result.push({
      day_of_week: l.day_of_week,
      lesson_num: l.lesson_num,
      date,
      class_id: Number(l.class_id),
      class_name: String(l.class_name),
      subject_id: Number(l.subject_id),
      subject_name: String(l.subject_name),
      grades: [] as { value: number; weight: number; grade_type_name: string }[],
      homework: (hwIndex.get(key) ?? []).map(h => ({
        due_date: h.due_date,
        description: h.description,
      })),
    })
  }
  return result
})
