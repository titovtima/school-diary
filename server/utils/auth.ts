import bcrypt from 'bcryptjs'
import { randomBytes } from 'node:crypto'
import type { H3Event } from 'h3'

export interface AuthUser {
  id: number
  login: string
  role: 'teacher' | 'student'
  full_name: string
  student_id: number | null
}

const COOKIE = 'session_token'
const TTL_DAYS = 14

export function hashPassword(pwd: string): string {
  return bcrypt.hashSync(pwd, 10)
}

export function verifyPassword(pwd: string, hash: string): boolean {
  return bcrypt.compareSync(pwd, hash)
}

export async function createSession(userId: number): Promise<string> {
  const token = randomBytes(32).toString('hex')
  const expires = new Date(Date.now() + TTL_DAYS * 24 * 3600 * 1000)
  await query(
    `INSERT INTO sessions (token, user_id, expires_at) VALUES ($1, $2, $3)`,
    [token, userId, expires]
  )
  return token
}

export async function getAuthUser(event: H3Event): Promise<AuthUser | null> {
  const token = getCookie(event, COOKIE)
  if (!token) return null
  const rows = await query<AuthUser>(
    `SELECT u.id, u.login, u.role, u.full_name, u.student_id
     FROM sessions s
     JOIN users u ON u.id = s.user_id
     WHERE s.token = $1 AND s.expires_at > NOW()`,
    [token]
  )
  return rows[0] ?? null
}

export async function requireUser(event: H3Event): Promise<AuthUser> {
  const user = await getAuthUser(event)
  if (!user) throw createError({ statusCode: 401, message: 'Не авторизован' })
  return user
}

export async function requireTeacher(event: H3Event): Promise<AuthUser> {
  const user = await requireUser(event)
  if (user.role !== 'teacher')
    throw createError({ statusCode: 403, message: 'Доступ только для учителя' })
  return user
}

export function setSessionCookie(event: H3Event, token: string): void {
  setCookie(event, COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: TTL_DAYS * 24 * 3600,
  })
}

export function clearSessionCookie(event: H3Event): void {
  deleteCookie(event, COOKIE, { path: '/' })
}
