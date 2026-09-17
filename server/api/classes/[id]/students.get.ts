import type { Student } from '~/types'
import { requireTeacher } from '~/server/utils/auth'

export default defineEventHandler(async (event): Promise<Student[]> => {
  await requireTeacher(event)
  const id = Number(getRouterParam(event, 'id'))
  return await query<Student>(
    `SELECT id, class_id, full_name, birth_date
     FROM students WHERE class_id = $1 ORDER BY full_name`,
    [id]
  )
})
