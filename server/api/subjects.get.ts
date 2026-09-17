import type { Subject } from '~/types'
import { requireUser } from '~/server/utils/auth'

export default defineEventHandler(async (event): Promise<Subject[]> => {
  await requireUser(event)
  return await query<Subject>(`SELECT id, name FROM subjects ORDER BY name`)
})
