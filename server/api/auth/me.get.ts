import { getAuthUser } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const user = await getAuthUser(event)
  if (!user) return null

  const rows = await query<{ is_admin: boolean }>(
    `SELECT is_admin FROM users WHERE id = $1`,
    [user.id]
  )

  return {
    id: user.id,
    login: user.login,
    role: user.role,
    full_name: user.full_name,
    student_id: user.student_id ?? null,
    is_admin: rows[0]?.is_admin ?? false,
  }
})
