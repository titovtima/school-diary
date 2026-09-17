import { getAuthUser } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const user = await getAuthUser(event)
  if (!user) return null
  return {
    id: user.id,
    login: user.login,
    role: user.role,
    full_name: user.full_name,
    student_id: user.student_id ?? null,
  }
})
