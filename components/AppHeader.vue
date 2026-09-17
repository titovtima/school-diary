<script setup lang="ts">
const { user, logout } = useAuth()
const appConfig = useAppConfig()
const school = appConfig.school
</script>

<template>
  <header class="app-header">
    <NuxtLink to="/" class="brand">
      <img :src="school.icon" alt="" class="brand-icon">
      <span class="brand-name">{{ school.shortName }}</span>
    </NuxtLink>
    <div v-if="user" class="right">
      <span class="name">{{ user.full_name }}</span>
      <span class="role">{{ user.role === 'teacher' ? 'учитель' : 'ученик' }}</span>
      <button @click="logout">Выйти</button>
    </div>
  </header>
</template>

<style scoped>
.app-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 10px 20px; border-bottom: 1px solid #e2e8f0;
  font-family: system-ui, sans-serif; background: #fff;
}
.brand {
  display: flex; align-items: center; gap: 10px;
  font-weight: 700; color: #0f172a; text-decoration: none;
}
.brand-icon {
  width: 28px; height: 28px; border-radius: 6px;
  object-fit: cover; background: #f1f5f9;
}
.brand-name { font-size: 16px; }
.right { display: flex; align-items: center; gap: 12px; }
.name { font-weight: 500; }
.role { color: #64748b; font-size: 13px; }
button {
  padding: 6px 12px; border: 1px solid #cbd5e1; background: #fff;
  border-radius: 6px; cursor: pointer;
}
button:hover { background: #f1f5f9; }
</style>
