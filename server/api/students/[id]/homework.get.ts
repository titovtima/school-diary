import type { Homework } from '~/types'
import { requireUser } from '~/server/utils/auth'

export default defineEventHandler(async (event): Promise<Homework[]> => {
  const user = await requireUser(event)
  const id = Number(getRouterParam(event, 'id'))

  if (user.role === 'student' && user.student_id !== id)
    throw createError({ statusCode: 403, message: 'Нет доступа' })

  return await query<Homework>(
    `SELECT h.id, h.class_id, h.subject_id, sub.name AS subject_name,
            to_char(h.due_date, 'YYYY-MM-DD') AS due_date,
            h.description
     FROM homework h
     JOIN subjects sub ON sub.id = h.subject_id
     JOIN students st ON st.class_id = h.class_id
     WHERE st.id = $1
     ORDER BY h.due_date DESC, h.id DESC`,
    [id]
  )
})
