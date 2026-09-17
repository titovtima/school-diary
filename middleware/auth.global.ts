export default defineNuxtRouteMiddleware(async (to) => {
  if (to.path === '/login') return

  const user = useState<{ role: string } | null>('auth-user', () => null)
  if (!user.value) {
    try {
      user.value = await $fetch('/api/auth/me')
    } catch {
      user.value = null
    }
  }

  if (!user.value) return navigateTo('/login')

  if (to.path.startsWith('/teacher') && user.value.role !== 'teacher')
    return navigateTo('/student')
  if (to.path.startsWith('/student') && user.value.role !== 'student')
    return navigateTo('/teacher')
})
