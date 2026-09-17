import { requireTeacher } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  await requireTeacher(event)
  const id = Number(getRouterParam(event, 'id'))
  const body = await readBody<{ value?: number; grade_type_id?: number; comment?: string }>(event)

  if (body.value != null && (body.value < 1 || body.value > 5))
    throw createError({ statusCode: 400, message: 'Оценка 1–5' })

  const sets: string[] = []
  const params: any[] = []
  if (body.value != null)         { params.push(body.value);         sets.push(`value = $${params.length}`) }
  if (body.grade_type_id != null) { params.push(body.grade_type_id); sets.push(`grade_type_id = $${params.length}`) }
  if (body.comment !== undefined) { params.push(body.comment);       sets.push(`comment = $${params.length}`) }
  if (!sets.length) throw createError({ statusCode: 400, message: 'Нечего обновлять' })

  params.push(id)
  await query(`UPDATE grades SET ${sets.join(', ')} WHERE id = $${params.length}`, params)
  return { ok: true }
})
