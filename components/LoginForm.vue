<script setup lang="ts">
import { ref } from 'vue'

const { login } = useAuth()
const form = ref({ login: '', password: '' })
const error = ref('')
const loading = ref(false)

async function submit() {
  error.value = ''
  loading.value = true
  try {
    const u = await login(form.value.login, form.value.password)
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
    <h2>Вход в дневник</h2>
    <label>Логин
      <input v-model="form.login" autocomplete="username" required>
    </label>
    <label>Пароль
      <input v-model="form.password" type="password" autocomplete="current-password" required>
    </label>
    <p v-if="error" class="error">{{ error }}</p>
    <button :disabled="loading">{{ loading ? 'Вход…' : 'Войти' }}</button>
  </form>
</template>

<style scoped>
.login-form { display: grid; gap: 12px; max-width: 320px; margin: 80px auto; font-family: system-ui, sans-serif; }
label { display: grid; gap: 4px; font-size: 13px; color: #475569; }
input { padding: 8px 10px; border: 1px solid #cbd5e1; border-radius: 6px; }
button { padding: 10px; border: none; border-radius: 6px; background: #2563eb; color: #fff; font-weight: 600; cursor: pointer; }
button:disabled { background: #94a3b8; }
.error { color: #dc2626; font-size: 13px; }
</style>
