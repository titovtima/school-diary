<script setup lang="ts">
import { addDays, isToday, mondayOfWeek, compareISO } from '~/composables/useWeek'

const props = defineProps<{ modelValue: string }>()
const emit = defineEmits<{ (e: 'update:modelValue', v: string): void }>()

const appConfig = useAppConfig()
const yearStart: string = (appConfig as any).schoolYear?.start ?? '2026-09-01'
const yearEnd: string   = (appConfig as any).schoolYear?.end   ?? '2027-05-31'

const minWeekStart = mondayOfWeek(yearStart)
const maxWeekStart = mondayOfWeek(yearEnd)

const end = computed(() => addDays(props.modelValue, 4))

const canPrev = computed(() => compareISO(props.modelValue, minWeekStart) > 0)
const canNext = computed(() => compareISO(props.modelValue, maxWeekStart) < 0)

function shift(days: number) {
  const candidate = addDays(props.modelValue, days)
  if (compareISO(candidate, minWeekStart) < 0) return
  if (compareISO(candidate, maxWeekStart) > 0) return
  emit('update:modelValue', candidate)
}
function today() {
  const t = new Date().toISOString().slice(0, 10)
  const d = mondayOfWeek(t)
  if (compareISO(d, minWeekStart) < 0) emit('update:modelValue', minWeekStart)
  else if (compareISO(d, maxWeekStart) > 0) emit('update:modelValue', maxWeekStart)
  else emit('update:modelValue', d)
}

function fmt(iso: string) {
  const [, m, d] = iso.split('-')
  return `${d}.${m}.${iso.slice(0, 4)}`
}
</script>

<template>
  <div class="week-switcher">
    <button class="nav" :disabled="!canPrev" @click="shift(-7)" title="Предыдущая неделя">←</button>
    <span class="range">
      {{ fmt(props.modelValue) }} — {{ fmt(end) }}
      <span v-if="isToday(props.modelValue)" class="badge">текущая</span>
    </span>
    <button class="nav" :disabled="!canNext" @click="shift(7)" title="Следующая неделя">→</button>
    <button class="today" @click="today">Сегодня</button>
  </div>
</template>

<style scoped>
.week-switcher { display: inline-flex; align-items: center; gap: 10px; font-family: system-ui, sans-serif; }
.nav, .today {
  padding: 4px 10px; border: 1px solid #cbd5e1; background: #fff;
  border-radius: 6px; cursor: pointer; font: inherit;
}
.nav:hover:not(:disabled), .today:hover { background: #f1f5f9; }
.nav:disabled { opacity: 0.4; cursor: not-allowed; background: #f8fafc; }
.range { font-weight: 600; color: #0f172a; }
.badge {
  font-size: 11px; color: #1d4ed8; background: #dbeafe;
  border-radius: 4px; padding: 1px 6px; margin-left: 6px;
}
</style>
