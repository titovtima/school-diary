import type { AuthUser } from '~/types'

export const useAuth = () => {
  const user = useState<AuthUser | null>('auth-user', () => null)

  async function refresh(): Promise<void> {
    user.value = await $fetch<AuthUser | null>('/api/auth/me')
  }
  async function login(loginStr: string, password: string): Promise<AuthUser> {
    const u = await $fetch<AuthUser>('/api/auth/login', {
      method: 'POST',
      body: { login: loginStr, password },
    })
    user.value = u
    return u
  }
  async function logout(): Promise<void> {
    await $fetch('/api/auth/logout', { method: 'POST' })
    user.value = null
    await navigateTo('/login')
  }

  return { user, refresh, login, logout }
}
