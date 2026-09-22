<script setup lang="ts">
import { computed } from 'vue'
import type { LessonWithExtras } from '~/server/api/students/[id]/week-schedule.get'
import { normalizeDate } from '~/composables/useDate'

const appConfig = useAppConfig()
const api = useApi()
const { user } = useAuth()
const studentId = computed(() => user.value?.student_id ?? null)

const { data: lessons, pending } = await useAsyncData<LessonWithExtras[]>(
  'student-week-schedule',
  () => studentId.value ? api.fetchStudentWeekSchedule(studentId.value) : Promise.resolve([]),
  { watch: [studentId], default: () => [] as LessonWithExtras[] }
)

const today = new Date().toISOString().slice(0, 10)

const byDay = computed(() => {
  const map = new Map<number, LessonWithExtras[]>()
  for (const l of lessons.value ?? []) {
    const filtered: LessonWithExtras = {
      ...l,
      homework: l.homework.filter(h => normalizeDate(h.due_date) >= today),
    }
    if (!map.has(l.day_of_week)) map.set(l.day_of_week, [])
    map.get(l.day_of_week)!.push(filtered)
  }
  return map
})
</script>

<template>
  <div class="page">
    <h1>Расписание</h1>

    <p v-if="!studentId" class="error">Ученик не определён.</p>
    <p v-else-if="pending && !lessons?.length" class="muted">Загрузка…</p>

    <div v-else class="layout">
      <div class="days">
        <section v-for="day in 5" :key="day" class="day">
          <h2>{{ appConfig.daysOfWeek[day - 1] }}</h2>
          <template v-if="byDay.get(day)?.length">
            <LessonCard
              v-for="l in byDay.get(day)"
              :key="`${l.lesson_num}-${l.subject_id}`"
              :lesson="l"
            />
          </template>
          <p v-else class="muted small">Уроков нет</p>
        </section>
      </div>
      <BellScheduleCard />
    </div>
  </div>
</template>

<style scoped>
.page { max-width: 1400px; margin: 24px auto; padding: 0 16px; font-family: system-ui, sans-serif; }
.layout { display: grid; grid-template-columns: 1fr 200px; gap: 24px; align-items: start; }
.days { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 16px; }
.day h2 {
  margin: 0 0 8px; font-size: 14px; color: #0f172a;
  border-bottom: 2px solid #2563eb; padding-bottom: 4px;
}
.muted { color: #94a3b8; font-size: 13px; }
.small { font-size: 12px; }
.error { color: #dc2626; }
</style>
