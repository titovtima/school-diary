<template>
  <div>
    <AppHeader v-if="$route.path !== '/login'" />
    <NuxtPage />
  </div>
</template>
