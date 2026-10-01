import { requireUser } from '~/server/utils/auth'

export interface LessonGrade {
  id: number
  subject_id: number
  subject_name: string
  value: number
  weight: number
  grade_type_id: number
  grade_type_name: string
  grade_type_color: string
  lesson_date: string
  lesson_num: number
  comment: string | null
}
export interface LessonAbsence {
  id: number
  lesson_num: number
  comment: string | null
}
export interface LessonWithExtras {
  day_of_week: number
  lesson_num: number
  date: string
  subject_id: number
  subject_name: string
  teacher: string | null
  grades: LessonGrade[]
  absences: LessonAbsence[]
  homework: { due_date: string; description: string }[]
}

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
  const user = await requireUser(event)
  const id = Number(getRouterParam(event, 'id'))
  if (user.role === 'student' && user.student_id !== id)
    throw createError({ statusCode: 403, message: 'Нет доступа' })

  const url = getRequestURL(event)
  const today = new Date().toISOString().slice(0, 10)
  const weekStart = mondayOfWeek(url.searchParams.get('week_start') || today)
  const weekEnd = addDays(weekStart, 4)

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

  const schedule = await query<{
    day_of_week: number; lesson_num: number
    subject_id: number; subject_name: string; teacher: string | null
  }>(
    `SELECT s.day_of_week, s.lesson_num, s.subject_id,
            sub.name AS subject_name, s.teacher
     FROM schedule s
     JOIN students st ON st.class_id = s.class_id
     JOIN subjects sub ON sub.id = s.subject_id
     WHERE st.id = $1
     ORDER BY s.day_of_week, s.lesson_num`,
    [id]
  )

  const grades = await query<any>(
    `SELECT g.id, g.subject_id, sub.name AS subject_name,
            g.value, gt.weight, g.grade_type_id, gt.name AS grade_type_name,
            gt.color AS grade_type_color,
            to_char(g.lesson_date,'YYYY-MM-DD') AS lesson_date,
            g.lesson_num, g.comment
     FROM grades g
     JOIN subjects sub ON sub.id = g.subject_id
     JOIN grade_types gt ON gt.id = g.grade_type_id
     WHERE g.student_id = $1
       AND g.lesson_date BETWEEN $2::date AND $3::date
     ORDER BY g.lesson_date, g.lesson_num, g.id`,
    [id, weekStart, weekEnd]
  )

  const absences = await query<any>(
    `SELECT a.id, a.subject_id,
            to_char(a.lesson_date,'YYYY-MM-DD') AS lesson_date,
            a.lesson_num, a.comment
     FROM absences a
     WHERE a.student_id = $1
       AND a.lesson_date BETWEEN $2::date AND $3::date
     ORDER BY a.lesson_date, a.lesson_num, a.id`,
    [id, weekStart, weekEnd]
  )

  const homework = await query<{
    subject_id: number; due_date: string; description: string
  }>(
    `SELECT h.subject_id,
            to_char(h.due_date,'YYYY-MM-DD') AS due_date,
            h.description
     FROM homework h
     JOIN students st ON st.class_id = h.class_id
     WHERE st.id = $1
       AND h.due_date BETWEEN $2::date AND $3::date
     ORDER BY h.due_date, h.id`,
    [id, weekStart, weekEnd]
  )

  const gradesIndex = new Map<string, LessonGrade[]>()
  for (const g of grades) {
    const key = `${g.subject_id}|${g.lesson_date}|${g.lesson_num}`
    if (!gradesIndex.has(key)) gradesIndex.set(key, [])
    gradesIndex.get(key)!.push({
      id: Number(g.id),
      subject_id: Number(g.subject_id),
      subject_name: String(g.subject_name),
      value: Number(g.value),
      weight: Number(g.weight) || 1,
      grade_type_id: Number(g.grade_type_id),
      grade_type_name: String(g.grade_type_name),
      grade_type_color: String(g.grade_type_color || '#94a3b8'),
      lesson_date: String(g.lesson_date),
      lesson_num: Number(g.lesson_num) || 1,
      comment: g.comment ?? null,
    })
  }

  const absencesIndex = new Map<string, LessonAbsence[]>()
  for (const a of absences) {
    const key = `${a.subject_id}|${a.lesson_date}|${a.lesson_num}`
    if (!absencesIndex.has(key)) absencesIndex.set(key, [])
    absencesIndex.get(key)!.push({
      id: Number(a.id),
      lesson_num: Number(a.lesson_num) || 1,
      comment: a.comment ?? null,
    })
  }

  const hwIndex = new Map<string, typeof homework>()
  for (const h of homework) {
    const key = `${h.subject_id}|${h.due_date}`
    if (!hwIndex.has(key)) hwIndex.set(key, [])
    hwIndex.get(key)!.push(h)
  }

  const firstLessonBySubjectDate = new Map<string, number>()
  for (const s of schedule) {
    const date = addDays(weekStart, s.day_of_week - 1)
    if (holidays.has(date)) continue
    const key = `${s.subject_id}|${date}`
    const cur = firstLessonBySubjectDate.get(key)
    if (cur == null || s.lesson_num < cur) firstLessonBySubjectDate.set(key, s.lesson_num)
  }

  const lessons: LessonWithExtras[] = []
  for (const s of schedule) {
    const date = addDays(weekStart, s.day_of_week - 1)
    if (holidays.has(date)) continue
    const gKey = `${s.subject_id}|${date}|${s.lesson_num}`
    const hwKey = `${s.subject_id}|${date}`
    const isFirst = firstLessonBySubjectDate.get(hwKey) === s.lesson_num

    lessons.push({
      day_of_week: s.day_of_week,
      lesson_num: s.lesson_num,
      date,
      subject_id: s.subject_id,
      subject_name: s.subject_name,
      teacher: s.teacher,
      grades: gradesIndex.get(gKey) ?? [],
      absences: absencesIndex.get(gKey) ?? [],
      homework: isFirst
        ? (hwIndex.get(hwKey) ?? []).map(h => ({
            due_date: h.due_date,
            description: h.description,
          }))
        : [],
    })
  }

  return lessons
})
