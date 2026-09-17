import {
  verifyPassword, createSession, setSessionCookie,
} from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const { login, password } = await readBody<{ login: string; password: string }>(event)
  if (!login || !password)
    throw createError({ statusCode: 400, message: 'Логин и пароль обязательны' })

  const rows = await query<{
    id: number; password_hash: string; role: 'teacher' | 'student'
    full_name: string; student_id: number | null
  }>(
    `SELECT id, password_hash, role, full_name, student_id
     FROM users WHERE login = $1`,
    [login]
  )
  const user = rows[0]
  if (!user || !verifyPassword(password, user.password_hash))
    throw createError({ statusCode: 401, message: 'Неверный логин или пароль' })

  const token = await createSession(user.id)
  setSessionCookie(event, token)
  return {
    id: user.id, role: user.role,
    full_name: user.full_name, student_id: user.student_id,
  }
})
