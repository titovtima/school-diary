import type { SchoolClass } from '~/types'
import { requireTeacher } from '~/server/utils/auth'

export default defineEventHandler(async (event): Promise<SchoolClass[]> => {
  const user = await requireTeacher(event)
  const url = getRequestURL(event)
  const showAll = url.searchParams.get('all') === '1'

  const adminRows = await query<{ is_admin: boolean }>(
    `SELECT is_admin FROM users WHERE id = $1`, [user.id]
  )
  const isAdmin = adminRows[0]?.is_admin ?? false

  // Все классы — только если админ И включил галочку "показать все"
  if (isAdmin && showAll) {
    return await query<SchoolClass>(
      `SELECT id, name, year FROM classes ORDER BY year DESC, name`
    )
  }

  // Иначе — только те классы, где учитель ведёт уроки
  return await query<SchoolClass>(
    `SELECT DISTINCT c.id, c.name, c.year
     FROM classes c
     JOIN schedule s ON s.class_id = c.id
     WHERE s.teacher = $1
     ORDER BY c.year DESC, c.name`,
    [user.full_name]
  )
})
