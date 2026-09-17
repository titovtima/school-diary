import type { NewGrade } from '~/types'
import { requireTeacher } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  await requireTeacher(event)
  const body = await readBody<NewGrade>(event)

  if (!body?.student_id || !body?.subject_id || !body?.grade_type_id)
    throw createError({ statusCode: 400, message: 'Не заполнены обязательные поля' })
  if (body.value < 1 || body.value > 5)
    throw createError({ statusCode: 400, message: 'Оценка должна быть от 1 до 5' })

  const [row] = await query(
    `INSERT INTO grades (student_id, subject_id, grade_type_id, value, lesson_date, comment)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
    [body.student_id, body.subject_id, body.grade_type_id,
     body.value, body.lesson_date, body.comment ?? null]
  )
  return { id: (row as any).id }
})
