import { requireUser } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  await requireUser(event)
  return await query<{
    id: number; name: string; start_date: string; end_date: string
  }>(
    `SELECT id, name,
            to_char(start_date, 'YYYY-MM-DD') AS start_date,
            to_char(end_date,   'YYYY-MM-DD') AS end_date
     FROM holidays
     ORDER BY start_date`
  )
})
