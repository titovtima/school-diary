<script setup lang="ts">
const appConfig = useAppConfig()
useHead({ title: `Вход · ${appConfig.school.shortName}` })
</script>

<template>
  <div>
    <LoginForm />
  </div>
</template>
