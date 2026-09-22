import { requireTeacher } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const user = await requireTeacher(event)
  const classId = Number(getRouterParam(event, 'id'))
  const url = getRequestURL(event)
  const showAll = url.searchParams.get('all') === '1'

  const adminRows = await query<{ is_admin: boolean }>(
    `SELECT is_admin FROM users WHERE id = $1`, [user.id]
  )
  const isAdmin = adminRows[0]?.is_admin ?? false
  const restrict = !(isAdmin && showAll)

  if (restrict) {
    return await query<{ id: number; name: string }>(
      `SELECT DISTINCT sub.id, sub.name
       FROM schedule s
       JOIN subjects sub ON sub.id = s.subject_id
       WHERE s.class_id = $1 AND s.teacher = $2
       ORDER BY sub.name`,
      [classId, user.full_name]
    )
  }
  return await query<{ id: number; name: string }>(
    `SELECT DISTINCT sub.id, sub.name
     FROM subject_classes sc
     JOIN subjects sub ON sub.id = sc.subject_id
     WHERE sc.class_id = $1
     ORDER BY sub.name`,
    [classId]
  )
})
