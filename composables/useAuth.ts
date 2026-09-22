import type { AuthUser } from '~/types'

export const useAuth = () => {
  const user = useState<AuthUser | null>('auth-user', () => null)
  const ready = useState<boolean>('auth-ready', () => false)

  async function refresh(): Promise<void> {
    const fetch = useRequestFetch()
    try {
      user.value = await fetch<AuthUser | null>('/api/auth/me')
    } catch {
      user.value = null
    }
    ready.value = true
  }

  async function login(loginStr: string, password: string, remember = false): Promise<AuthUser> {
    const res = await $fetch<{ user: AuthUser }>('/api/auth/login', {
      method: 'POST',
      body: { login: loginStr, password, remember },
    })
    user.value = res.user
    ready.value = true
    return res.user
  }

  async function logout(): Promise<void> {
    // Сначала обнуляем состояние — чтобы все watch'и на user перестали
    // дёргать защищённые эндпоинты, и не было 401 в консоли.
    user.value = null
    try { await $fetch('/api/auth/logout', { method: 'POST' }) } catch { /* noop */ }
    await navigateTo('/login')
  }

  return { user, ready, refresh, login, logout }
}
