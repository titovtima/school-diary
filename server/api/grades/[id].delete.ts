import { requireTeacher } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  await requireTeacher(event)
  const id = Number(getRouterParam(event, 'id'))
  await query(`DELETE FROM grades WHERE id = $1`, [id])
  return { ok: true }
})
