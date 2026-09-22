import { requireUser } from '~/server/utils/auth'

export interface LessonWithExtras {
  day_of_week: number
  lesson_num: number
  date: string
  subject_id: number
  subject_name: string
  teacher: string | null
  grades: { value: number; weight: number; grade_type_name: string }[]
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

  // 1. Расписание класса
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

  // 2. Оценки за эту неделю — с lesson_num
  const grades = await query<{
    subject_id: number; value: number; weight: number
    grade_type_name: string; lesson_date: string; lesson_num: number
  }>(
    `SELECT g.subject_id, g.value, gt.weight, gt.name AS grade_type_name,
            to_char(g.lesson_date,'YYYY-MM-DD') AS lesson_date,
            g.lesson_num
     FROM grades g
     JOIN grade_types gt ON gt.id = g.grade_type_id
     WHERE g.student_id = $1
       AND g.lesson_date BETWEEN $2::date AND $3::date
     ORDER BY g.lesson_date, g.lesson_num, g.id`,
    [id, weekStart, weekEnd]
  )

  // 3. ДЗ класса на эту неделю (привязано к дате, не к уроку)
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

  // Индексы
  const gradesIndex = new Map<string, typeof grades>()
  for (const g of grades) {
    const key = `${g.subject_id}|${g.lesson_date}|${g.lesson_num}`
    if (!gradesIndex.has(key)) gradesIndex.set(key, [])
    gradesIndex.get(key)!.push(g)
  }
  const hwIndex = new Map<string, typeof homework>()
  for (const h of homework) {
    const key = `${h.subject_id}|${h.due_date}`
    if (!hwIndex.has(key)) hwIndex.set(key, [])
    hwIndex.get(key)!.push(h)
  }

  // Для ДЗ: только первый урок по предмету в этот день получает ДЗ
  const firstLessonBySubjectDate = new Map<string, number>()
  for (const s of schedule) {
    const date = addDays(weekStart, s.day_of_week - 1)
    const key = `${s.subject_id}|${date}`
    const cur = firstLessonBySubjectDate.get(key)
    if (cur == null || s.lesson_num < cur) {
      firstLessonBySubjectDate.set(key, s.lesson_num)
    }
  }

  const lessons: LessonWithExtras[] = schedule.map(s => {
    const date = addDays(weekStart, s.day_of_week - 1)
    const gKey = `${s.subject_id}|${date}|${s.lesson_num}`
    const hwKey = `${s.subject_id}|${date}`
    const isFirstLessonForSubject =
      firstLessonBySubjectDate.get(hwKey) === s.lesson_num

    return {
      day_of_week: s.day_of_week,
      lesson_num: s.lesson_num,
      date,
      subject_id: s.subject_id,
      subject_name: s.subject_name,
      teacher: s.teacher,
      grades: (gradesIndex.get(gKey) ?? []).map(g => ({
        value: Number(g.value),
        weight: Number(g.weight) || 1,
        grade_type_name: g.grade_type_name,
      })),
      homework: isFirstLessonForSubject
        ? (hwIndex.get(hwKey) ?? []).map(h => ({
            due_date: h.due_date,
            description: h.description,
          }))
        : [],
    }
  })

  return lessons
})
