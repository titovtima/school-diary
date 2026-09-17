import type { Term } from '~/types'
import { requireUser } from '~/server/utils/auth'

export default defineEventHandler(async (event): Promise<Term[]> => {
  await requireUser(event)
  return await query<Term>(
    `SELECT id, name,
            to_char(start_date, 'YYYY-MM-DD') AS start_date,
            to_char(end_date,   'YYYY-MM-DD') AS end_date,
            year
     FROM terms
     ORDER BY start_date DESC`
  )
})
