<script setup lang="ts">
import { computed } from 'vue'

interface TeacherLesson {
  day_of_week: number
  lesson_num: number
  class_id: number
  class_name: string
  subject_id: number
  subject_name: string
}

const appConfig = useAppConfig()
const api = useApi()
const { user } = useAuth()
const userId = computed(() => user.value?.id ?? null)

const { data: lessons, pending } = await useAsyncData<TeacherLesson[]>(
  'teacher-week-schedule',
  () => userId.value ? api.fetchTeacherWeekSchedule() : Promise.resolve([]),
  { watch: [userId], default: () => [] as TeacherLesson[] }
)

const byDay = computed(() => {
  const map = new Map<number, TeacherLesson[]>()
  for (const l of lessons.value ?? []) {
    if (!map.has(l.day_of_week)) map.set(l.day_of_week, [])
    map.get(l.day_of_week)!.push(l)
  }
  return map
})

const { lessonTime } = useSchedule()
</script>

<template>
  <div class="page">
    <h1>Моё расписание</h1>

    <p v-if="pending && !lessons?.length" class="muted">Загрузка…</p>

    <div v-else class="layout">
      <div class="days">
        <section v-for="day in 5" :key="day" class="day">
          <h2>{{ appConfig.daysOfWeek[day - 1] }}</h2>
          <template v-if="byDay.get(day)?.length">
            <div
              v-for="l in byDay.get(day)"
              :key="`${l.lesson_num}-${l.class_id}-${l.subject_id}`"
              class="lesson"
            >
              <div class="head">
                <span class="num">{{ l.lesson_num }}</span>
                <span class="time">{{ lessonTime(l.lesson_num) }}</span>
                <span class="class">{{ l.class_name }}</span>
              </div>
              <div class="subject">{{ l.subject_name }}</div>
            </div>
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
.lesson {
  border: 1px solid #e2e8f0; border-radius: 8px;
  padding: 8px 10px; margin-bottom: 8px; background: #fff;
}
.head { display: flex; align-items: baseline; gap: 8px; flex-wrap: wrap; }
.num {
  display: inline-flex; justify-content: center; align-items: center;
  width: 20px; height: 20px; border-radius: 4px;
  background: #2563eb; color: #fff; font-size: 11px; font-weight: 700;
}
.time { color: #64748b; font-size: 11px; }
.class { font-weight: 600; color: #0f172a; }
.subject { font-size: 12px; color: #475569; margin-top: 2px; }
.muted { color: #94a3b8; font-size: 13px; }
.small { font-size: 12px; }
</style>
