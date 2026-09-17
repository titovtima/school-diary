import type { AuthUser } from '~/types'

export default defineNuxtPlugin(async () => {
  const user = useState<AuthUser | null>('auth-user', () => null)
  if (user.value) return
  try {
    user.value = await $fetch<AuthUser | null>('/api/auth/me')
  } catch {
    user.value = null
  }
})
