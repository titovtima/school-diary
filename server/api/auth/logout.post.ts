import { clearSessionCookie } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const token = getCookie(event, 'session_token')
  if (token) await query(`DELETE FROM sessions WHERE token = $1`, [token])
  clearSessionCookie(event)
  return { ok: true }
})
