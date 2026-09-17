<script setup lang="ts">
const { user, refresh } = useAuth()
if (!user.value) await refresh()
if (user.value?.role === 'teacher') await navigateTo('/teacher')
else if (user.value?.role === 'student') await navigateTo('/student')
else await navigateTo('/login')
</script>

<template>
  <div style="padding: 40px; font-family: system-ui">Загрузка…</div>
</template>
