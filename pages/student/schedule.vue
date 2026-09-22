<script setup lang="ts">
import { computed } from 'vue'
import type { LessonWithExtras } from '~/server/api/students/[id]/week-schedule.get'
import { holidayName } from '~/composables/useWeek'
import { isToday } from '~/composables/useWeek'

const appConfig = useAppConfig()
const api = useApi()
const { user } = useAuth()
const studentId = computed(() => user.value?.student_id ?? null)

const { weekStart, days } = useWeek()

const { data: holidays } = await useAsyncData(
  'holidays-student',
  () => api.fetchHolidays(),
  { default: () => [] }
)

const { data: lessons, pending } = await useAsyncData<LessonWithExtras[]>(
  'student-week-schedule',
  () => studentId.value ? api.fetchStudentWeekSchedule(studentId.value, weekStart.value) : Promise.resolve([]),
  { watch: [studentId, weekStart], default: () => [] as LessonWithExtras[] }
)

const byDate = computed(() => {
  const m = new Map<string, LessonWithExtras[]>()
  for (const l of lessons.value ?? []) {
    if (!m.has(l.date)) m.set(l.date, [])
    m.get(l.date)!.push(l)
  }
  return m
})

function dayLabel(iso: string) {
  const [, m, d] = iso.split('-')
  return `${d}.${m}`
}
function holidayOf(date: string) {
  return holidayName(date, holidays.value ?? [])
}
</script>

<template>
  <div class="page">
    <h1>Расписание</h1>

    <div class="toolbar">
      <WeekSwitcher :model-value="weekStart" @update:model-value="weekStart = $event" />
    </div>

    <p v-if="!studentId" class="error">Ученик не определён.</p>
    <div v-else-if="pending && !lessons?.length" class="muted">Загрузка…</div>

    <div v-else class="layout">
      <div class="days">
        <section v-for="(d, i) in days" :key="d" class="day">
          <h2 :class="{ today: isToday(d), holiday: !!holidayOf(d) }">
            {{ appConfig.daysOfWeek[i] }} · {{ dayLabel(d) }}
            <span v-if="holidayOf(d)" class="holiday-badge">{{ holidayOf(d) }}</span>
          </h2>
          <template v-if="byDate.get(d)?.length">
            <LessonCard
              v-for="l in byDate.get(d)"
              :key="`${l.lesson_num}-${l.subject_id}`"
              :lesson="l"
            />
          </template>
          <p v-else-if="holidayOf(d)" class="holiday-text">Каникулы</p>
          <p v-else class="muted small">Уроков нет</p>
        </section>
      </div>
      <BellScheduleCard />
    </div>
  </div>
</template>

<style scoped>
.page { max-width: 1400px; margin: 24px auto; padding: 0 16px; font-family: system-ui, sans-serif; }
.toolbar { margin-bottom: 16px; }
.layout { display: grid; grid-template-columns: 1fr 200px; gap: 24px; align-items: start; }
.days { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 16px; }
.day h2 {
  margin: 0 0 8px; font-size: 14px; color: #0f172a;
  border-bottom: 2px solid #2563eb; padding-bottom: 4px;
}
.day h2.today { border-color: #16a34a; color: #166534; }
.day h2.holiday { border-color: #f59e0b; color: #b45309; }
.holiday-badge {
  font-size: 11px; color: #b45309; background: #fef3c7;
  border-radius: 4px; padding: 1px 6px; margin-left: 6px;
  font-weight: 600;
}
.holiday-text { color: #b45309; font-weight: 600; font-size: 13px; }
.muted { color: #94a3b8; font-size: 13px; }
.small { font-size: 12px; }
.error { color: #dc2626; }
</style>
