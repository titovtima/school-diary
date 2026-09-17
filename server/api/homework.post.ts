import type { NewHomework } from '~/types'
import { requireTeacher } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  await requireTeacher(event)
  const body = await readBody<NewHomework>(event)

  if (!body?.class_id || !body?.subject_id || !body?.due_date || !body?.description)
    throw createError({ statusCode: 400, message: 'Не заполнены поля' })

  const [row] = await query(
    `INSERT INTO homework (class_id, subject_id, due_date, description)
     VALUES ($1, $2, $3, $4) RETURNING id`,
    [body.class_id, body.subject_id, body.due_date, body.description]
  )
  return { id: (row as any).id }
})
