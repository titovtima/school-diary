import type { Homework } from '~/types'
import { requireTeacher } from '~/server/utils/auth'

export default defineEventHandler(async (event): Promise<Homework[]> => {
  await requireTeacher(event)
  const classId = Number(getRouterParam(event, 'id'))
  const url = getRequestURL(event)
  const subjectId = url.searchParams.get('subject_id')
  const from = url.searchParams.get('from')
  const to = url.searchParams.get('to')

  const params: any[] = [classId]
  let where = ''
  if (subjectId) { params.push(Number(subjectId)); where += ` AND h.subject_id = $${params.length}` }
  if (from)      { params.push(from);              where += ` AND h.due_date >= $${params.length}` }
  if (to)        { params.push(to);                where += ` AND h.due_date <= $${params.length}` }

  return await query<Homework>(
    `SELECT h.id, h.class_id, h.subject_id, sub.name AS subject_name,
            to_char(h.due_date, 'YYYY-MM-DD') AS due_date,
            h.description
     FROM homework h
     JOIN subjects sub ON sub.id = h.subject_id
     WHERE h.class_id = $1 ${where}
     ORDER BY h.due_date DESC, h.id DESC`,
    params
  )
})
