import { requireUser } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const id = Number(getRouterParam(event, 'id'))

  if (user.role === 'student' && user.student_id !== id)
    throw createError({ statusCode: 403, message: 'Нет доступа' })

  return await query<{ id: number; name: string }>(
    `SELECT sub.id, sub.name
     FROM students st
     JOIN subject_classes sc ON sc.class_id = st.class_id
     JOIN subjects sub ON sub.id = sc.subject_id
     WHERE st.id = $1
     ORDER BY sub.name`,
    [id]
  )
})
