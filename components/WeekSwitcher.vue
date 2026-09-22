<script setup lang="ts">
import { formatDayMonth, addDays, isToday } from '~/composables/useWeek'

const props = defineProps<{ modelValue: string }>()
const emit = defineEmits<{ (e: 'update:modelValue', v: string): void }>()

const end = computed(() => addDays(props.modelValue, 4))

function shift(days: number) {
  emit('update:modelValue', addDays(props.modelValue, days))
}
function today() {
  const t = new Date().toISOString().slice(0, 10)
  const d = new Date(t + 'T00:00:00Z')
  const dow = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() - (dow - 1))
  emit('update:modelValue', d.toISOString().slice(0, 10))
}
</script>

<template>
  <div class="week-switcher">
    <button class="nav" @click="shift(-7)">←</button>
    <span class="range">
      {{ formatDayMonth(props.modelValue) }} — {{ formatDayMonth(end) }}
      <span v-if="isToday(props.modelValue)" class="badge">текущая</span>
    </span>
    <button class="nav" @click="shift(7)">→</button>
    <button class="today" @click="today">Сегодня</button>
  </div>
</template>

<style scoped>
.week-switcher {
  display: inline-flex; align-items: center; gap: 10px;
  font-family: system-ui, sans-serif;
}
.nav, .today {
  padding: 4px 10px; border: 1px solid #cbd5e1; background: #fff;
  border-radius: 6px; cursor: pointer; font: inherit;
}
.nav:hover, .today:hover { background: #f1f5f9; }
.range { font-weight: 600; color: #0f172a; }
.badge {
  font-size: 11px; color: #1d4ed8; background: #dbeafe;
  border-radius: 4px; padding: 1px 6px; margin-left: 6px;
}
</style>
