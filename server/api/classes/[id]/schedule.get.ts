import type { ScheduleItem } from '~/types'
import { requireUser } from '~/server/utils/auth'

export default defineEventHandler(async (event): Promise<ScheduleItem[]> => {
  await requireUser(event)
  const id = Number(getRouterParam(event, 'id'))
  return await query<ScheduleItem>(
    `SELECT s.id, s.class_id, s.subject_id, sub.name AS subject_name,
            s.teacher, s.day_of_week, s.lesson_num
     FROM schedule s
     JOIN subjects sub ON sub.id = s.subject_id
     WHERE s.class_id = $1
     ORDER BY s.day_of_week, s.lesson_num`,
    [id]
  )
})
