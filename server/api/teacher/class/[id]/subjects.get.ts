import { requireTeacher } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  await requireTeacher(event)
  const classId = Number(getRouterParam(event, 'id'))
  return await query<{ id: number; name: string }>(
    `SELECT DISTINCT sub.id, sub.name
     FROM schedule s
     JOIN subjects sub ON sub.id = s.subject_id
     WHERE s.class_id = $1
     ORDER BY sub.name`,
    [classId]
  )
})
