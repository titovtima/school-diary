import type { NewAbsence } from '~/types'
import { requireTeacher } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const user = await requireTeacher(event)
  const body = await readBody<NewAbsence>(event)

  if (!body?.student_id || !body?.subject_id)
    throw createError({ statusCode: 400, message: 'Не заполнены обязательные поля' })
  if (!body.lesson_num || body.lesson_num < 1 || body.lesson_num > 8)
    throw createError({ statusCode: 400, message: 'Номер урока от 1 до 8' })

  const rows = await query<{ is_admin: boolean; allowed: boolean }>(
    `SELECT u.is_admin,
            EXISTS (
              SELECT 1 FROM schedule s
              WHERE s.class_id = st.class_id
                AND s.subject_id = $2
                AND s.teacher = u.full_name
                AND s.day_of_week = EXTRACT(ISODOW FROM $4::date)::int
                AND s.lesson_num = $5
            ) AS allowed
     FROM users u, students st
     WHERE u.id = $1 AND st.id = $3`,
    [user.id, body.subject_id, body.student_id, body.lesson_date, body.lesson_num]
  )
  const info = rows[0]
  if (!info) throw createError({ statusCode: 400, message: 'Ученик или учитель не найден' })
  if (!info.is_admin && !info.allowed)
    throw createError({ statusCode: 403, message: 'Вы не ведёте этот урок' })

  // Если запись об отсутствии уже есть — вернуть её id
  const existing = await query<{ id: number }>(
    `SELECT id FROM absences
     WHERE student_id = $1 AND subject_id = $2 AND lesson_date = $3::date AND lesson_num = $4`,
    [body.student_id, body.subject_id, body.lesson_date, body.lesson_num]
  )
  if (existing[0]) return { id: existing[0].id, existing: true }

  const [row] = await query(
    `INSERT INTO absences (student_id, subject_id, lesson_date, lesson_num, comment)
     VALUES ($1, $2, $3::date, $4, $5) RETURNING id`,
    [body.student_id, body.subject_id, body.lesson_date, body.lesson_num, body.comment ?? null]
  )
  return { id: (row as any).id, existing: false }
})
