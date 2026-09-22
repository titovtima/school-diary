import type { NewGrade } from '~/types'
import { requireTeacher } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const user = await requireTeacher(event)
  const body = await readBody<NewGrade>(event)

  if (!body?.student_id || !body?.subject_id || !body?.grade_type_id)
    throw createError({ statusCode: 400, message: 'Не заполнены обязательные поля' })
  if (body.value < 1 || body.value > 5)
    throw createError({ statusCode: 400, message: 'Оценка должна быть от 1 до 5' })
  if (!body.lesson_num || body.lesson_num < 1 || body.lesson_num > 8)
    throw createError({ statusCode: 400, message: 'Номер урока от 1 до 8' })

  // Проверка прав: учитель ставит только по своим предметам, кроме админа
  const rows = await query<{ is_admin: boolean; class_id: number; allowed: boolean }>(
    `SELECT u.is_admin,
            st.class_id,
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

  const [row] = await query(
    `INSERT INTO grades (student_id, subject_id, grade_type_id, value, lesson_date, lesson_num, comment)
     VALUES ($1, $2, $3, $4, $5::date, $6, $7) RETURNING id`,
    [body.student_id, body.subject_id, body.grade_type_id,
     body.value, body.lesson_date, body.lesson_num, body.comment ?? null]
  )
  return { id: (row as any).id }
})
