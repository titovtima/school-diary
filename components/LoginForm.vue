<script setup lang="ts">
import { ref, onMounted } from 'vue'

const { login } = useAuth()
const appConfig = useAppConfig()

const form = ref({ login: '', password: '' })
const remember = ref(true)
const error = ref('')
const loading = ref(false)

const LS_LAST_LOGIN = 'school-diary:last-login'
onMounted(() => {
  try {
    const saved = window.localStorage.getItem(LS_LAST_LOGIN)
    if (saved) form.value.login = saved
  } catch { /* noop */ }
})

async function submit() {
  error.value = ''
  loading.value = true
  try {
    const u = await login(form.value.login, form.value.password, remember.value)
    try { window.localStorage.setItem(LS_LAST_LOGIN, form.value.login) } catch { /* noop */ }
    await navigateTo(u.role === 'teacher' ? '/teacher' : '/student')
  } catch (e: any) {
    error.value = e?.data?.message || 'Ошибка входа'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <form class="login-form" @submit.prevent="submit">
    <h2>Вход в {{ appConfig.school.shortName }}</h2>

    <label>Логин
      <input v-model="form.login" autocomplete="username" required>
    </label>

    <label>Пароль
      <input v-model="form.password" type="password" autocomplete="current-password" required>
    </label>

    <label class="remember">
      <input v-model="remember" type="checkbox">
      <span>Запомнить меня на 14 дней</span>
    </label>

    <p v-if="error" class="error">{{ error }}</p>

    <button :disabled="loading">{{ loading ? 'Вход…' : 'Войти' }}</button>
  </form>
</template>

<style scoped>
.login-form {
  display: grid; gap: 12px; max-width: 340px;
  margin: 80px auto; font-family: system-ui, sans-serif;
}
h2 { margin: 0 0 4px; font-size: 20px; color: #0f172a; }
label { display: grid; gap: 4px; font-size: 13px; color: #475569; }
input:not([type=checkbox]) {
  padding: 8px 10px; border: 1px solid #cbd5e1; border-radius: 6px;
}
.remember {
  display: flex; align-items: center; gap: 8px;
  font-size: 13px; color: #334155; cursor: pointer;
}
.remember input[type=checkbox] { width: 16px; height: 16px; }
button {
  padding: 10px; border: none; border-radius: 6px;
  background: #2563eb; color: #fff; font-weight: 600; cursor: pointer;
}
button:disabled { background: #94a3b8; }
.error { color: #dc2626; font-size: 13px; margin: 0; }
</style>
