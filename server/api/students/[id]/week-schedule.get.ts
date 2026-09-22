import { requireUser } from '~/server/utils/auth'

export interface LessonWithExtras {
  day_of_week: number       // 1..6
  lesson_num: number        // 1..7
  subject_id: number
  subject_name: string
  teacher: string | null
  /** оценки этого ученика за последние 14 дней по этому предмету */
  grades: { value: number; weight: number; grade_type_name: string }[]
  /** домашние задания класса по этому предмету, срок сдачи в ближайшие 7 дней */
  homework: { due_date: string; description: string }[]
}

export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const id = Number(getRouterParam(event, 'id'))

  if (user.role === 'student' && user.student_id !== id)
    throw createError({ statusCode: 403, message: 'Нет доступа' })

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

  // 2. Оценки за последние 14 дней
  const grades = await query<{
    subject_id: number; value: number; weight: number
    grade_type_name: string
  }>(
    `SELECT g.subject_id, g.value, gt.weight, gt.name AS grade_type_name
     FROM grades g
     JOIN grade_types gt ON gt.id = g.grade_type_id
     WHERE g.student_id = $1
       AND g.lesson_date >= CURRENT_DATE - INTERVAL '14 days'
       AND g.lesson_date <= CURRENT_DATE + INTERVAL '14 days'
     ORDER BY g.lesson_date DESC, g.id DESC`,
    [id]
  )

  // 3. ДЗ класса — на ближайшие 7 дней (включая просроченные сегодня/завтра)
  const homework = await query<{
    subject_id: number; due_date: string; description: string
  }>(
    `SELECT h.subject_id,
            to_char(h.due_date, 'YYYY-MM-DD') AS due_date,
            h.description
     FROM homework h
     JOIN students st ON st.class_id = h.class_id
     WHERE st.id = $1
       AND h.due_date >= CURRENT_DATE - INTERVAL '1 day'
       AND h.due_date <= CURRENT_DATE + INTERVAL '7 days'
     ORDER BY h.due_date ASC, h.id ASC`,
    [id]
  )

  // Группируем
  const gradesBySubject = new Map<number, typeof grades>()
  for (const g of grades) {
    if (!gradesBySubject.has(g.subject_id)) gradesBySubject.set(g.subject_id, [])
    gradesBySubject.get(g.subject_id)!.push(g)
  }
  const hwBySubject = new Map<number, typeof homework>()
  for (const h of homework) {
    if (!hwBySubject.has(h.subject_id)) hwBySubject.set(h.subject_id, [])
    hwBySubject.get(h.subject_id)!.push(h)
  }

  const lessons: LessonWithExtras[] = schedule.map(s => ({
    day_of_week: s.day_of_week,
    lesson_num: s.lesson_num,
    subject_id: s.subject_id,
    subject_name: s.subject_name,
    teacher: s.teacher,
    grades: (gradesBySubject.get(s.subject_id) ?? []).map(g => ({
      value: Number(g.value),
      weight: Number(g.weight) || 1,
      grade_type_name: g.grade_type_name,
    })),
    homework: (hwBySubject.get(s.subject_id) ?? []).map(h => ({
      due_date: h.due_date,
      description: h.description,
    })),
  }))

  return lessons
})
