import type { GradeType } from '~/types'
import { requireUser } from '~/server/utils/auth'

export default defineEventHandler(async (event): Promise<GradeType[]> => {
  await requireUser(event)
  return await query<GradeType>(
    `SELECT id, name, weight FROM grade_types ORDER BY id`
  )
})
