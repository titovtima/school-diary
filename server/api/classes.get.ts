import type { SchoolClass } from '~/types'
import { requireUser } from '~/server/utils/auth'

export default defineEventHandler(async (event): Promise<SchoolClass[]> => {
  await requireUser(event)
  return await query<SchoolClass>(
    `SELECT id, name, year FROM classes ORDER BY year DESC, name`
  )
})
