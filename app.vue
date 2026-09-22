<script setup lang="ts">
const appConfig = useAppConfig()
const school = appConfig.school

const user = useState('auth-user', () => null)
const route = useRoute()

const isLoginPage = computed(() => route.path === '/login')
const showHeader = computed(() => !isLoginPage.value && !!user.value)

useHead({
  title: school.name,
  htmlAttrs: { lang: school.lang },
  meta: [{ name: 'description', content: school.description }],
  link: [
    { rel: 'icon', type: 'image/jpeg', href: school.icon },
    { rel: 'apple-touch-icon', href: school.icon },
  ],
})
</script>

<template>
  <AppHeader v-if="showHeader" />
  <NuxtPage />
</template>
