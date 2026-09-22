import type { AuthUser } from '~/types'

export default defineNuxtRouteMiddleware((to) => {
  if (to.path === '/login') return

  // На SSR не решаем — пусть HTML отрисуется, а cookie уже проверена
  // в plugins/auth.ts через useRequestFetch. Если user=null,
  // клиент сам разберётся после гидратации.
  if (import.meta.server) return

  const user = useState<AuthUser | null>('auth-user', () => null)
  const ready = useState<boolean>('auth-ready', () => false)

  if (!ready.value) return
  if (!user.value) return navigateTo('/login')

  if ((to.path === '/teacher' || to.path.startsWith('/teacher/')) && user.value.role !== 'teacher')
    return navigateTo('/student')
  if ((to.path === '/student' || to.path.startsWith('/student/')) && user.value.role !== 'student')
    return navigateTo('/teacher')
})
