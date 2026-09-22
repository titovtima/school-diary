<script setup lang="ts">
const { user, logout } = useAuth()
const appConfig = useAppConfig()
const school = appConfig.school
const route = useRoute()

const isTeacher = computed(() => user.value?.role === 'teacher')

const links = computed(() => {
  if (!user.value) return []
  if (isTeacher.value) return [
    { to: '/teacher',          label: 'Журнал',      match: /^\/teacher$|\/teacher\/?$/ },
    { to: '/teacher/schedule', label: 'Расписание',  match: /^\/teacher\/schedule/ },
  ]
  return [
    { to: '/student',          label: 'Дневник',     match: /^\/student$|\/student\/?$/ },
    { to: '/student/schedule', label: 'Расписание',  match: /^\/student\/schedule/ },
  ]
})

function isActive(match: RegExp) {
  return match.test(route.path)
}
</script>

<template>
  <header class="app-header">
    <div class="left">
      <NuxtLink to="/" class="brand">
        <img :src="school.icon" alt="" class="brand-icon">
        <span class="brand-name">{{ school.shortName }}</span>
      </NuxtLink>

      <nav v-if="links.length" class="nav">
        <NuxtLink
          v-for="l in links"
          :key="l.to"
          :to="l.to"
          class="nav-link"
          :class="{ active: isActive(l.match) }"
        >{{ l.label }}</NuxtLink>
      </nav>
    </div>

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
.left { display: flex; align-items: center; gap: 24px; }
.brand {
  display: flex; align-items: center; gap: 10px;
  font-weight: 700; color: #0f172a; text-decoration: none;
}
.brand-icon {
  width: 28px; height: 28px; border-radius: 6px;
  object-fit: cover; background: #f1f5f9;
}
.brand-name { font-size: 16px; }
.nav { display: flex; gap: 4px; }
.nav-link {
  padding: 6px 12px; border-radius: 6px; text-decoration: none;
  color: #475569; font-size: 14px;
}
.nav-link:hover { background: #f1f5f9; }
.nav-link.active { background: #dbeafe; color: #1d4ed8; font-weight: 600; }
.right { display: flex; align-items: center; gap: 12px; }
.name { font-weight: 500; }
.role { color: #64748b; font-size: 13px; }
button {
  padding: 6px 12px; border: 1px solid #cbd5e1; background: #fff;
  border-radius: 6px; cursor: pointer;
}
button:hover { background: #f1f5f9; }
</style>
