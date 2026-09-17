<script setup lang="ts">
const { user, logout } = useAuth()
</script>

<template>
  <header class="app-header">
    <NuxtLink to="/" class="brand">📘 Дневник</NuxtLink>
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
.brand { font-weight: 700; color: #0f172a; text-decoration: none; }
.right { display: flex; align-items: center; gap: 12px; }
.name { font-weight: 500; }
.role { color: #64748b; font-size: 13px; }
button { padding: 6px 12px; border: 1px solid #cbd5e1; background: #fff; border-radius: 6px; cursor: pointer; }
button:hover { background: #f1f5f9; }
</style>
