<script setup lang="ts">
const appConfig = useAppConfig()
const school = appConfig.school

useHead({
  title: school.name,
  htmlAttrs: { lang: school.lang },
  meta: [
    { name: 'description', content: school.description },
  ],
  link: [
    { rel: 'icon', type: 'image/jpeg', href: school.icon },
    { rel: 'apple-touch-icon', href: school.icon },
  ],
})
</script>

<template>
  <div>
    <AppHeader v-if="$route.path !== '/login'" />
    <NuxtPage />
  </div>
</template>
