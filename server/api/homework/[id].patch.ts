import { requireTeacher } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  await requireTeacher(event)
  const id = Number(getRouterParam(event, 'id'))
  const body = await readBody<{
    subject_id?: number
    due_date?: string
    description?: string
  }>(event)

  const sets: string[] = []
  const params: any[] = []
  if (body.subject_id != null)        { params.push(Number(body.subject_id)); sets.push(`subject_id = $${params.length}`) }
  if (body.due_date)                  { params.push(body.due_date);          sets.push(`due_date = $${params.length}`) }
  if (body.description !== undefined) { params.push(body.description);       sets.push(`description = $${params.length}`) }
  if (!sets.length) throw createError({ statusCode: 400, message: 'Нечего обновлять' })

  params.push(id)
  await query(`UPDATE homework SET ${sets.join(', ')} WHERE id = $${params.length}`, params)
  return { ok: true }
})
